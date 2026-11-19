import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const base = '27f4dc2e0ea6ed4f12e79fab6366d11fb555551b';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const buildings = 'packages/core/src/data/buildings.json';
const fixtureRoot = 'packages/persistence/src/__tests__/fixtures';
const v10 = `${fixtureRoot}/society-v10`;
const v11 = `${fixtureRoot}/society-v11`;
const original = (file: string) => execFileSync('git', ['cat-file', 'blob', `${base}:${file}`], { maxBuffer: 4 * 1024 * 1024 });
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const additions = ['mansion', 'retainers-hall', 'guild', 'auction-house', 'slave-market'];
const newPlots = ['house-12', 'house-13', 'house-14', 'service-7', 'service-8', 'spec-11', 'spec-12', 'slum-7', 'slum-8', 'slum-9'];
const startingTiles = [
  ...newPlots.map(id => ({ id, terrain: 'town', building: null })),
  ...['mansion', 'retainers-hall'].map((typeId, index) => ({
    id: `estate-${index + 1}`, terrain: 'town', building: { typeId, level: 1, workers: 0, enabled: true },
  })),
];
const goldPairs = [
  [0, 592989, 420189], [42, 581669, 402419], [20261028, 626484, 446484],
];
const oldGolden = original(golden);
const newGolden = readFileSync(golden);
const oldEntries = JSON.parse(oldGolden.toString('utf8'));
const newEntries = JSON.parse(newGolden.toString('utf8'));
assert.equal(oldEntries.length, goldPairs.length);
assert.equal(newEntries.length, goldPairs.length);
for (const [i, [seed, beforeGold, afterGold]] of goldPairs.entries()) {
  const { session: oldText, ...summary } = oldEntries[i];
  const { session: newText, ...nextSummary } = newEntries[i];
  assert.equal(summary.seed, seed);
  assert.equal(summary.weeks, 60);
  assert.deepEqual(nextSummary, summary, `seed ${seed}: scenario counters`);
  const before = JSON.parse(oldText);
  const after = JSON.parse(newText);
  assert.equal(before.cityRulesetId, 'tile-society-10');
  assert.equal(before.state.city.society.rulesetId, 'tile-society-10');
  assert.equal(before.state.city.society.wallRing, 2);
  assert.equal(before.state.city.tiles.length, 63);
  const inventory = before.state.city.world.settlements.settlement_haven_01.inventory;
  assert.equal(inventory.gold, beforeGold);
  before.cityRulesetId = 'tile-society-11';
  before.state.city.society.rulesetId = 'tile-society-11';
  before.state.city.tiles.push(...startingTiles);
  inventory.gold = afterGold;
  assert.deepEqual(after, before, `seed ${seed}: changed a path outside the approved list`);
  assert.equal(JSON.stringify(before), newText, `seed ${seed}: serialization bytes`);
  console.log(`Seed ${seed}: cityRulesetId, state.city.society.rulesetId, state.city.tiles[63..74], state.city.world.settlements.settlement_haven_01.inventory.gold ${beforeGold} → ${afterGold}`);
}
assert.equal(newGolden.toString('utf8'), JSON.stringify(newEntries, null, 2) + '\n');
const beforeBuildings = JSON.parse(original(buildings).toString('utf8'));
const afterBuildings = JSON.parse(readFileSync(buildings, 'utf8'));
for (const group of ['trial', 'society']) {
  const old = beforeBuildings[group], next = afterBuildings[group];
  assert.deepEqual(Object.keys(next).filter(key => !Object.hasOwn(old, key)), additions);
  for (const id of additions) old[id] = next[id];
}
assert.deepEqual(afterBuildings, beforeBuildings, 'unexpected catalog changes');
const historical = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', base, '--', fixtureRoot], { maxBuffer: 4 * 1024 * 1024 })
  .toString('utf8').split('\0').filter(Boolean);
for (const file of historical) assert.deepEqual(readFileSync(file), original(file), file);
assert.deepEqual(readdirSync(v11).sort(), readdirSync(v10).sort());
for (const name of readdirSync(v11)) {
  const text = readFileSync(`${v11}/${name}`, 'utf8');
  const decoded = JSON.parse(text);
  assert.equal(text, JSON.stringify(decoded), name);
  assert.equal(name === 'new-game.json' ? decoded.rulesetId : decoded.cityRulesetId, 'tile-society-11', name);
}
console.log(`Base ${base}`);
console.log(`Golden SHA-256 before ${hash(oldGolden)}`);
console.log(`Golden SHA-256 after  ${hash(newGolden)}`);
console.log(`PASS: 3 golden seeds, exactly 5 additions to each catalog, ${historical.length} preserved historical fixtures, 10 v11 siblings. Forbidden paths: 0.`);
