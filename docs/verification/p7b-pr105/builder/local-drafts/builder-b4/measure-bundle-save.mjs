import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { connectSource } from './workspace-source.mjs';

const [directory, originalSaveFile] = process.argv.slice(2);
const root = process.cwd(), evidence = resolve(directory), ui = join(root, 'packages', 'ui');
const bundleDir = join(evidence, 'bundle'), saveDir = join(evidence, 'save-size');
mkdirSync(bundleDir, { recursive: true });
mkdirSync(saveDir, { recursive: true });
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD'), tree = git('rev-parse', 'HEAD^{tree}');
assert.equal(git('status', '--porcelain=v1'), '');
const sha = contents => createHash('sha256').update(contents).digest('hex');
function save(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
const uiRequire = createRequire(join(ui, 'package.json'));
const vite = join(dirname(uiRequire.resolve('vite/package.json')), 'bin', 'vite.js');
const manifest = [];

function assets(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const file = join(dir, item.name);
    return item.isDirectory() ? assets(file) : /\.(js|css)$/.test(file) ? [file] : [];
  });
}
async function servedBuild(build, measure) {
  const url = 'http://localhost:' + build.port;
  // Same commands and bounded startup poll as the B3 served bundle verifier.
  const server = spawn(process.execPath, [vite, 'preview', ...build.args, '--port', String(build.port), '--strictPort'],
    { cwd: ui, windowsHide: true, stdio: 'inherit' });
  try {
    let response;
    for (let poll = 0; poll < 100; poll++) {
      if (server.exitCode !== null) throw Error('Preview exited: ' + build.name);
      try { response = await fetch(url); if (response.ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(response?.ok, 'Preview unavailable: ' + build.name);
    const servedIndex = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(servedIndex, readFileSync(join(build.dir, 'index.html')));
    const rows = [];
    for (const file of assets(build.dir).sort()) {
      const path = relative(build.dir, file).replaceAll('\\', '/'), local = readFileSync(file);
      const res = await fetch(url + '/' + path);
      assert.ok(res.ok, path);
      assert.equal(sha(Buffer.from(await res.arrayBuffer())), sha(local), path);
      const compressed = gzipSync(local);
      rows.push({ file: path, bytes: local.length, sha256: sha(local), gzipBytes: compressed.length, gzipSha256: sha(compressed) });
      if (build.name === 'production') writeFileSync(join(bundleDir, path.replaceAll('/', '-')) + '.gz', compressed);
    }
    manifest.push({ build: build.name, port: build.port, indexSha256: sha(servedIndex), assets: rows });
    if (measure) await measure(url);
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit'); server.kill(); await exited;
    }
  }
}

async function measureCheckpoint(url) {
  const { require, from } = connectSource(root, root);
  const { deserializeCharacterLifeSave, serializeCharacterLifeSave, recordsToSession } = await from('packages/persistence/src/index.ts');
  const { readStoredRecords } = await from('tests/e2e/storage.helpers.ts');
  const original = readFileSync(originalSaveFile, 'utf8');
  const previous = deserializeCharacterLifeSave(original);
  assert.equal(previous.success, true, JSON.stringify(previous.error));
  assert.equal(serializeCharacterLifeSave(previous.state).text, original);
  const state = previous.state, { stock, lots, departures } = state.city.society.acquisition;
  assert.deepEqual([state.npcs.length, stock.length, lots.length, departures.length], [100, 12, 2, 14]);
  assert.ok(state.npcs.every(npc => npc.life.history.recent.length === 20));
  // Synthetic capacity probe on top of the smoke fixture. Earlier Guild residents
  // keep their IDs and market provenance. Current-week Guild hires stay as bought.
  const notices = state.npcs.filter(npc => npc.household.status === 'servant' && npc.household.boughtWeek < state.city.world.week);
  for (const npc of notices) {
    npc.household.notice = 'lifelong';
    npc.household.lifelongAskWeek = state.city.world.week - 10;
    npc.household.obedience = Math.max(50, npc.household.obedience);
    npc.character.relationshipToPlayer.affection = 75;
  }
  const encoded = serializeCharacterLifeSave(state);
  assert.equal(encoded.success, true, JSON.stringify(encoded.error));
  assert.deepEqual(deserializeCharacterLifeSave(encoded.text), { success: true, state });
  const browser = await require('playwright').chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url + '/?mode=world-life');
    await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({
      name: 'largest-notice-save.json', mimeType: 'application/json', buffer: Buffer.from(encoded.text),
    });
    await page.getByTestId('life-shell').waitFor();
    await page.locator('#life-nav-session').click();
    await page.getByRole('button', { name: 'Save locally', exact: true }).click();
    await page.getByText('Saved in this browser.', { exact: true }).waitFor();
    const rows = (await readStoredRecords(page)).filter(row => row.slotId === 'main' && row.table !== 'system');
    assert.equal(serializeCharacterLifeSave(recordsToSession(rows)).text, encoded.text);
    await page.reload();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('life-shell').waitFor();
    await page.locator('#life-nav-session').click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export checkpoint', exact: true }).click(),
    ]);
    assert.equal(readFileSync(await download.path(), 'utf8'), encoded.text);

    const indexedDb = JSON.stringify(rows);
    const result = { head, tree, npcCount: state.npcs.length, notices: notices.length,
      stock: stock.length, lots: lots.length, actionsPerLot: lots.map(item => item.raises.length), departures: departures.length,
      historyRowsPerNpc: 20, noNoticeSaveBytes: Buffer.byteLength(original),
      saveBytes: Buffer.byteLength(encoded.text), indexedDbRowJsonBytes: Buffer.byteLength(indexedDb), rowCount: rows.length,
      limitBytes: 1_048_576, jsonSha256: sha(encoded.text), indexedDbSha256: sha(indexedDb) };
    assert.ok(result.saveBytes <= result.limitBytes);
    writeFileSync(join(saveDir, 'largest-notice-save.json'), encoded.text, 'utf8');
    writeFileSync(join(saveDir, 'largest-notice-indexeddb-rows.json'), indexedDb, 'utf8');
    save(join(saveDir, 'largest-notice-measurement.json'), result);
    console.log('Largest notice checkpoint ' + JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

await servedBuild({ name: 'production', dir: join(ui, 'dist'), port: 4173, args: [] }, measureCheckpoint);
await servedBuild({ name: 'regression', dir: join(ui, 'regression', 'dist'), port: 4174,
  args: ['regression', '--config', 'vite.config.ts', '--outDir', 'dist'] });
const count = suffix => manifest[0].assets.filter(row => row.file.endsWith(suffix)).reduce((sum, row) => sum + row.gzipBytes, 0);
const jsGzipBytes = count('.js'), cssGzipBytes = count('.css'), total = jsGzipBytes + cssGzipBytes;
const baseline = { head: '95821832a8c95988c3203b4c38f5f9ae665978e9', jsGzipBytes: 162154, cssGzipBytes: 7709, totalGzipBytes: 169863 };
const data = { head, tree, baseline, jsGzipBytes, cssGzipBytes, totalGzipBytes: total, deltaGzipBytes: total - baseline.totalGzipBytes,
  limitBytes: 200000, headroomBytes: 200000 - total, manifest };
save(join(bundleDir, 'bundle-and-served-hashes.json'), data);
console.log('Served bundle ' + JSON.stringify(data));
assert.ok(total < data.limitBytes, 'Exceeded the 200 kB gzip budget.');

