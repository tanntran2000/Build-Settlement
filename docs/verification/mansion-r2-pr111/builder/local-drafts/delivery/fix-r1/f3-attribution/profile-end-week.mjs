import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Session } from 'node:inspector/promises';
import { createRequire, registerHooks } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [baseDir, headDir, fixtureDir, outputDir] = process.argv.slice(2, 6).map(p => resolve(p));
const audit = process.argv[6] === '--audit';
const roots = [baseDir, headDir].map(dir => pathToFileURL(dir + '/').href);
const ts = createRequire(resolve(headDir, 'package.json'))('typescript');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hash = value => sha(JSON.stringify(value));
const save = (name, value) => writeFileSync(resolve(outputDir, name), JSON.stringify(value) + '\n', 'utf8');
const read = name => readFileSync(resolve(fixtureDir, name), 'utf8');
const transpiled = new Map();

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      const root = roots.find(url => context.parentURL?.startsWith(url));
      assert(root, context.parentURL);
      const [, workspace] = specifier.split('/');
      return next(new URL('packages/' + workspace + '/src/index.ts', root).href, context);
    }
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (roots.some(root => url.startsWith(root)) && url.endsWith('.ts')) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
        fileName: url,
      }).outputText;
      if (audit) transpiled.set(url, source);
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});

mkdirSync(outputDir, { recursive: true });
const load = (index, path) => import(new URL('packages/' + path, roots[index]).href);
const apis = await Promise.all(roots.map(async (_, index) => ({
  play: (await load(index, 'simulation/src/character-life-command.ts')).executeCharacterLifeCommand,
  read: (await load(index, 'persistence/src/index.ts')).deserializeCharacterLifeSave,
})));
const originalBench = JSON.parse(read('measurement-summary.json'));

function profiledEndWeek(api, state) {
  return api.play(state, { type: 'END_WEEK', expectedRevision: state.city.revision, expectedWeek: state.city.world.week });
}

const inspector = new Session();
inspector.connect();
await inspector.post('Profiler.enable');

const difficulties = ['normal', 'easy'];
const blockCount = 16;
const dispatchesPerCohort = 12;
const rows = [];
async function runCohort(api, state, resultSha256, file) {
  const inputs = Array.from({ length: dispatchesPerCohort }, () => structuredClone(state));
  const results = [];
  const times = [];
  await inspector.post('Profiler.start');
  for (const input of inputs) {
    const cpuStart = process.threadCpuUsage();
    const since = process.hrtime.bigint();
    const result = profiledEndWeek(api, input);
    const wallNs = Number(process.hrtime.bigint() - since);
    const cpu = process.threadCpuUsage(cpuStart);
    times.push({ wallNs, threadCpuUs: cpu.user + cpu.system });
    results.push(result);
  }
  const { profile } = await inspector.post('Profiler.stop');
  assert(profile.samples.length > 0);
  save(file, profile);
  for (const result of results) assert.equal(hash(result), resultSha256, 'Profile changed dispatch output bytes');
  return times;
}

const stableKey = url => roots.reduce((name, root) => name.replace(root, ''), url);
const statFields = ['stress', 'arousal', 'working'];
const branchFiles = /(?:character-life-command|world-npc|tile-trial(?:-week)?|order-week|crime-week|purse-week|household-week|npc-life-week|mansion-week|mansion\/effects|workshop-operation|society-week)\.ts$/;

function keyChanges(before, after, prefix = '') {
  if (Object.is(before, after)) return [];
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].flatMap(key => keyChanges(before[key], after[key], prefix ? prefix + '.' + key : key));
  }
  return [{ path: prefix, base: before ?? null, head: after ?? null }];
}

function describe(state, result) {
  const { next, report } = result;
  const housing = new Map();
  for (const { household } of state.npcs) housing.set(household.home, (housing.get(household.home) ?? 0) + 1);
  const changedNpcRows = {};
  const npcFacts = state.npcs.map((npc, index) => {
    const after = next.npcs[index];
    assert.equal(after.character.id, npc.character.id);
    const diffs = keyChanges(npc, after);
    for (const { path } of diffs) changedNpcRows[path] = (changedNpcRows[path] ?? 0) + 1;
    return { id: npc.character.id, room: npc.household.room, post: npc.postTileId,
      life: Object.fromEntries(statFields.map(field => [field, [npc.life[field], after.life[field]]])),
      affection: [npc.character.relationshipToPlayer.affection, after.character.relationshipToPlayer.affection] };
  });
  return {
    tiles: state.city.tiles.length, developedTiles: state.city.tiles.filter(tile => tile.building !== null).length,
    housing: [...housing], roster: state.npcs.length, rooms: state.city.society.mansion.rooms.length,
    activePosts: state.npcs.filter(npc => npc.postTileId !== null).length,
    servants: state.npcs.filter(npc => npc.household.status === 'servant').length,
    advancedServantContracts: state.npcs.filter((npc, i) => npc.household.contract
      && npc.household.contract.weeksLeft !== next.npcs[i].household.contract?.weeksLeft).length,
    changedNpcRows, npcFacts, activities: report.activities, items: report.items, immigration: report.immigration,
    acquisition: next.city.society.acquisition, cityCrime: report.crimeEvent, authority: report.order, crisis: report.crisis,
    household: report.household, npcLife: report.npcLife, purse: report.purse,
    mansion: report.mansion ?? null, homeUpkeep: report.householdUpkeep,
  };
}

async function auditBranch(api, state, sha256, name) {
  const input = structuredClone(state);
  const originalClone = globalThis.structuredClone;
  const cloneCounts = new Map();
  function observedClone(value, options) {
    const stack = new Error().stack.split('\n')[2].trim();
    const key = stableKey(stack).replace(/:\d+:\d+(?=\)?$)/, '');
    const row = cloneCounts.get(key) ?? { calls: 0, jsonBytes: 0, arrayRows: 0 };
    row.calls++;
    row.jsonBytes += Buffer.byteLength(JSON.stringify(value) ?? '');
    row.arrayRows += Array.isArray(value) ? value.length : 0;
    cloneCounts.set(key, row);
    return originalClone(value, options);
  }
  let result;
  await inspector.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
  try {
    globalThis.structuredClone = observedClone;
    result = profiledEndWeek(api, input);
  } finally {
    globalThis.structuredClone = originalClone;
  }
  const coverage = await inspector.post('Profiler.takePreciseCoverage');
  await inspector.post('Profiler.stopPreciseCoverage');
  assert.equal(hash(result), sha256, 'Branch audit changed dispatch output bytes');
  const targeted = coverage.result.filter(script => roots.some(root => script.url.startsWith(root)) && branchFiles.test(script.url))
    .map(script => ({ path: stableKey(script.url), functions: script.functions.filter(fn => fn.ranges[0].count > 0).map(fn => ({
      name: fn.functionName, ranges: fn.ranges.map(range => ({
        ...range, text: transpiled.get(script.url).slice(range.startOffset, range.endOffset).slice(0, 135),
      })),
    })) }));
  save(name + '-coverage.json', targeted);
  return { ...describe(state, result), cloneCounts: [...cloneCounts].sort(), resultSha256: sha256, result };
}

for (const difficulty of difficulties) {
  const bytes = read(difficulty + '-full-mansion-v15.json');
  const reference = originalBench.paired.find(row => row.difficulty === difficulty);
  assert.equal(sha(bytes), reference.fixtureSha256);
  const states = apis.map(api => {
    const decoded = api.read(bytes);
    assert.equal(decoded.success, true, JSON.stringify(decoded.error ?? null));
    return decoded.state;
  });
  assert.equal(JSON.stringify(states[0]), JSON.stringify(states[1]));
  const expected = [reference.hashA, reference.hashB];
  states.forEach((state, i) => {
    assert.equal(state.npcs.length, 100);
    assert.equal(state.npcs.filter(npc => npc.household.home === 'estate-1').length, 30);
    assert.equal(hash(profiledEndWeek(apis[i], structuredClone(state))), expected[i]);
  });
  if (audit) {
    const base = await auditBranch(apis[0], states[0], expected[0], difficulty + '-base');
    const head = await auditBranch(apis[1], states[1], expected[1], difficulty + '-head');
    const differences = keyChanges(base.result, head.result);
    delete base.result;
    delete head.result;
    save(difficulty + '-work.json', { fixtureSha256: sha(bytes), base, head, differences });
  } else {
    await inspector.post('Profiler.setSamplingInterval', { interval: 500 });
    for (let i = 0; i < 24; i++) {
      for (const index of i % 2 ? [1, 0] : [0, 1])
        profiledEndWeek(apis[index], structuredClone(states[index]));
    }
    for (let block = 1; block <= blockCount; block++) {
      const pair = block % 2 ? ['base', 'head'] : ['head', 'base'];
      const control = block % 2 ? ['aa1', 'aa2'] : ['aa2', 'aa1'];
      const order = block % 4 < 2 ? [...pair, ...control] : [...control, ...pair];
      for (const side of order) {
        const index = Number(side === 'head');
        const file = difficulty + '-' + String(block).padStart(2, '0') + '-' + side + '.cpuprofile';
        const times = await runCohort(apis[index], states[index], expected[index], file);
        rows.push({ difficulty, block, side, file, times, fixtureSha256: sha(bytes), resultSha256: expected[index] });
      }
      if (block % 4 === 0) console.log(difficulty + ' completed block ' + block + '/' + blockCount);
    }
  }
}
if (!audit) save('dispatch-samples.json', { blockCount, dispatchesPerCohort, samplingIntervalUs: 500, rows });
inspector.disconnect();
