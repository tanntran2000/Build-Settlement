import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [run, revision, mode, root, vitePackage] = process.argv.slice(2);
assert.ok(['base', 'head'].includes(revision));
assert.ok(['measurement', 'profile'].includes(mode));
assert.ok(mode === 'measurement' ? /^\d{2}-(base|head)$/.test(run) : run === 'profile-' + revision);
const provenance = JSON.parse(readFileSync(join(here, 'source-snapshots.json'), 'utf8'));
const source = provenance.revisions[revision];
assert.equal(root, source.directory);
assert.equal(vitePackage, provenance.vitePackage);
assert.deepEqual(process.execArgv, []);
assert.ok(!process.env.NODE_OPTIONS && !process.env.NODE_COMPILE_CACHE);

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const save = (name, value) => writeFileSync(join(here, name), JSON.stringify(value, null, 2) + '\n', 'utf8');
const saveSession = (suffix, value) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n', 'utf8');
  writeFileSync(join(here, run + '-' + suffix + '-session.json'), bytes);
  return { bytes: bytes.length, fileSha256: sha256(bytes), compactSha256: sha256(JSON.stringify(value)) };
};
const result = {
  run, revision, mode, commit: source.commit, tree: source.tree,
  utcStart: new Date().toISOString(), pid: process.pid,
  runtime: {
    node: process.version, v8: process.versions.v8, arch: process.arch,
    vite: JSON.parse(readFileSync(join(vitePackage, 'package.json'), 'utf8')).version,
    execArgv: process.execArgv,
  },
  workload: { seed: 42, adults: 100, ticks: 60, nextWeek: 'after every END_WEEK including tick 60' },
  harnessSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
  productTimingHooks: 0, cpuSamplingUs: mode === 'profile' ? 1000 : null, ticks: [],
};

let server;
let inspector;
try {
  const { createServer } = await import(pathToFileURL(join(vitePackage, 'dist/node/index.js')).href);
  server = await createServer({
    root, configFile: false, appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    ssr: { noExternal: true },
  });
  const core = await server.ssrLoadModule('/packages/core/src/index.ts');
  const { executeCharacterLifeCommand } = await server.ssrLoadModule('/packages/simulation/src/character-life-command.ts');

  const made = core.createCharacterLifeSession(42, {
    ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper',
  });
  assert.equal(made.success, true);
  let session = made.value;
  const templates = structuredClone(session.npcs);
  const profiles = structuredClone(session.profiles);
  session.npcs = Array.from({ length: 100 }, (_, index) => {
    const npc = structuredClone(templates[index % 3]);
    npc.character.id = index < 3 ? templates[index].character.id : 'npc_perf_' + index;
    npc.character.name = 'Perf NPC ' + index;
    npc.life = core.createNpcLife(42, npc.character.id, npc.character.age);
    return npc;
  });
  session.profiles = session.npcs.map((npc, index) => ({
    ...structuredClone(profiles[index % 3]), id: npc.character.id,
  }));
  const inventory = session.city.world.settlements[session.city.world.activeSettlementId].inventory;
  for (const key of ['gold', 'food', 'wood', 'iron']) inventory[key] = 1_000_000;
  session.city.goodsStock.amountMilli = 1_000_000;
  assert.equal(core.isCharacterLifeSessionState(session), true);
  assert.ok(session.npcs.every(npc => npc.character.gender === 'female' && npc.character.age >= 18 && npc.life));
  result.initialSession = saveSession('initial', session);
  assert.equal(result.initialSession.fileSha256, provenance.initialSessionFileSha256);

  if (mode === 'profile') {
    const { Session } = await import('node:inspector/promises');
    inspector = new Session();
    inspector.connect();
    await inspector.post('Profiler.enable');
    await inspector.post('Profiler.setSamplingInterval', { interval: result.cpuSamplingUs });
  }
  for (let tick = 1; tick <= 60; tick++) {
    const week = session.city.world.week;
    const raw = { type: 'END_WEEK', expectedRevision: session.city.revision, expectedWeek: week };
    if (inspector) await inspector.post('Profiler.start');
    const startMs = performance.now();
    const next = executeCharacterLifeCommand(session, raw);
    const endMs = performance.now();
    if (inspector) {
      const { profile } = await inspector.post('Profiler.stop');
      inspector.disconnect();
      inspector = undefined;
      save(run + '.cpuprofile', profile);
    }

    assert.equal(next.success, true, 'END_WEEK tick ' + tick);
    assert.ok(next.report);
    session = next.next;
    result.ticks.push({ tick, weekBefore: week, weekAfter: session.city.world.week, startMs, endMs, endWeekMs: endMs - startMs });
    const planning = executeCharacterLifeCommand(session, { type: 'NEXT_WEEK', expectedRevision: session.city.revision });
    assert.equal(planning.success, true, 'NEXT_WEEK tick ' + tick);
    session = planning.next;
  }
  assert.equal(session.city.world.week, 61);
  assert.equal(session.npcs.length, 100);
  result.finalWeek = session.city.world.week;
  result.finalSession = saveSession('final', session);
  result.exitCode = 0;
} catch (error) {
  result.exitCode = 1;
  result.error = String(error.stack ?? error);
} finally {
  if (inspector) inspector.disconnect();
  if (server) {
    try {
      await server.close();
    } catch (error) {
      result.exitCode = 1;
      result.closeError = String(error.stack ?? error);
    }
  }
  result.utcEnd = new Date().toISOString();
  save(run + '.json', result);
  process.exitCode = result.exitCode;
  console.log(JSON.stringify({
    run, revision, mode, commit: result.commit, pid: result.pid, exitCode: result.exitCode,
    tick1Ms: result.ticks[0]?.endWeekMs, ticks: result.ticks.length, error: result.error ?? result.closeError,
  }));
}
