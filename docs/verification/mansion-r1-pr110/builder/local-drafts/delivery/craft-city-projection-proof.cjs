const { registerHooks } = require('node:module');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { resolve } = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const ts = require(require.resolve('typescript', { paths: [process.cwd()] }));
const file = 'packages/simulation/src/__tests__/craft-week.test.ts';
const dir = 'C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/';
const before = require('node:child_process').execFileSync('git', ['show', '8d37d16ca24420987e6b1294257da13bcdefb5a2:' + file], { encoding: 'utf8' }).split(/\r?\n/);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const relative = name => pathToFileURL(resolve(name)).href;
const tuning = relative('packages/core/src/data/tuning.json');
const buildings = relative('packages/core/src/data/buildings.json');

registerHooks({
  load(url, context, next) {
    if (url === tuning || url === buildings) {
      const manifest = JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
      if (url === tuning) {
        Object.assign(manifest.TILE_TRIAL_BALANCE, { taxGoldPerResident: 30 });
        Object.assign(manifest.GOODS_STOCK_TRIAL, { initialFoodMilli: 20000, initialGoodsMilli: 10000, goldPerGoodsMilli: 1000 });
      } else {
        for (const id of ['logging', 'mine', 'quarry', 'sheep-pasture', 'herb-garden']) manifest.trial[id].upkeepMilli = 500;
      }
      return { source: JSON.stringify(manifest), format: 'json', shortCircuit: true };
    }
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      const { outputText } = ts.transpileModule(source, { fileName: fileURLToPath(url), compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
      return { source: outputText, format: 'module', shortCircuit: true };
    }
    return next(url, context);
  },
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
      const url = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    return next(specifier, context);
  },
});

const record = (line, after, why) => ({ file, line, why, before: before[line - 1], after, afterUtf8Base64: Buffer.from(after).toString('base64') });
async function main() {
  const { createSocietyState } = await import(relative('packages/core/src/index.ts'));
  const { runTileTrialWeek } = await import(relative('packages/simulation/src/tile-trial-week.ts'));
  const tested = [];
  const exact = [0, 42, 20261028].map((seed, index) => {
    const city = createSocietyState();
    city.world.worldMetadata.worldSeed = seed;
    const stocks = city.world.settlements[city.world.activeSettlementId].inventory;
    for (const key of ['gold', 'food', 'wood', 'iron']) stocks[key] = 1_000_000;
    city.goodsStock.amountMilli = 1_000_000;
    const reports = [], items = [];
    for (let week = 0; week < 60; week++) {
      reports.push(runTileTrialWeek(city));
      items.push(structuredClone(city.society.items));
      city.phase = 'planning';
    }
    const line = 24 + index, raw = before[line - 1];
    const pinned = Object.fromEntries(Array.from(raw.matchAll(/(reports|items|city|priorCity):'([0-9a-f]{64})'/g), ([, label, digest]) => [label, digest]));
    const { mansion, ...v14Society } = city.society;
    const { acquisition, difficulty, ...v12Society } = v14Society;
    assert.equal(city.world.week, 61);
    assert.equal(hash(reports), pinned.reports);
    assert.equal(hash(items), pinned.items);
    assert.equal(hash({ ...city, society: { ...v14Society, rulesetId: 'tile-society-14' } }), pinned.city);
    assert.equal(hash({ ...city, society: { ...v12Society, rulesetId: 'tile-society-12' } }), pinned.priorCity);
    assert.equal(mansion.rooms.length, 2);
    const updatedHash = hash(city);
    tested.push({ seed, reports: pinned.reports, items: pinned.items, v12Projection: pinned.priorCity, v14Projection: pinned.city, v15: updatedHash });
    console.log(seed + ': city ' + pinned.city + ' → ' + updatedHash + '; both historical projections, item states and reports match');
    return record(line, raw.replace(pinned.city, updatedHash), 'Pin the whole v15 city state after the same 60-week replay');
  });
  assert.ok(before[42].includes('const { acquisition, difficulty, ...v12Society }'));
  exact.push(record(43, before[42].replace('acquisition, difficulty,','acquisition, difficulty, mansion,'), 'Exclude the new Mansion key from the v12 projection and retain the original v12 digest'));
  writeFileSync(dir + 'R1.3-HOLD-byte-inventory.json', JSON.stringify({ records: exact, replayEvidence: tested }, null, 2) + '\n');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
