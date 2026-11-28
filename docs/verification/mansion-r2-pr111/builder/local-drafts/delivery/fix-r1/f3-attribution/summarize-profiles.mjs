import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const run = resolve(process.argv[2]);
const read = file => JSON.parse(readFileSync(resolve(run, file), 'utf8'));
const dataset = read('dispatch-samples.json');
const scale = 1000;
const average = x => x.reduce((sum, value) => sum + value, 0) / x.length;
const percentile = (x, p) => [...x].sort((a, b) => a - b)[Math.ceil(x.length * p) - 1];
const rounded = ms => Number(ms.toFixed(6));
const timingSummary = values => ({ mean: rounded(average(values)), median: rounded(percentile(values, 0.5)),
  p95: rounded(percentile(values, 0.95)) });
const significant = /^\((?:root|idle|program|garbage collector)\)$/;
const aggregate = new Map();

function decode(row) {
  const profile = read(row.file);
  const byId = new Map(profile.nodes.map(node => [node.id, node]));
  const parent = new Map(profile.nodes.flatMap(node => (node.children ?? []).map(child => [child, node.id])));
  assert.equal(profile.samples.length, profile.timeDeltas.length);
  const getPath = id => {
    const frames = [];
    for (let cursor = id; cursor !== undefined; cursor = parent.get(cursor)) frames.push(byId.get(cursor).callFrame);
    return frames;
  };
  function label(frame, stack, index) {
    const url = frame.url.replace(/^file:\/\/\/.*?\/(?=packages\/)/, '');
    const name = frame.functionName;
    if (significant.test(name)) return name;
    if (name) return name + ' @ ' + url;
    const caller = stack.slice(index + 1).find(node => node.url === frame.url && node.functionName);
    return '(anonymous' + (caller ? ' in ' + caller.functionName : ':' + (frame.lineNumber + 1)) + ') @ ' + url;
  }
  const seen = new Map();
  const summary = { dispatchPathUs: 0, garbageCollectorUs: 0, programUs: 0, otherUs: 0 };
  const table = new Map();
  const clonePaths = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const id = profile.samples[i], micros = profile.timeDeltas[i];
    if (!seen.has(id)) seen.set(id, getPath(id));
    const stack = seen.get(id);
    const inDispatch = stack.some(frame => frame.functionName === 'executeCharacterLifeCommand');
    if (!inDispatch) {
      const name = stack[0].functionName;
      if (name === '(garbage collector)') summary.garbageCollectorUs += micros;
      else if (name === '(program)') summary.programUs += micros;
      else summary.otherUs += micros;
      continue;
    }
    summary.dispatchPathUs += micros;
    const identities = stack.map((frame, index) => label(frame, stack, index));
    const leaf = identities[0];
    for (const name of new Set(identities)) {
      const fn = table.get(name) ?? { self: 0, total: 0 };
      fn.total += micros;
      if (name === leaf) fn.self += micros;
      table.set(name, fn);
    }
    if (stack.some(frame => frame.functionName === 'structuredClone')) {
      const cloneFrom = stack.findIndex(frame => frame.functionName === 'structuredClone');
      const caller = identities.slice(cloneFrom + 1).find(name => name.includes(' @ packages/')) ?? '(no JS caller)';
      clonePaths.set(caller, (clonePaths.get(caller) ?? 0) + micros);
    }
  }
  return { table, summary, clonePaths, sampleCount: profile.samples.length };
}

for (const row of dataset.rows) {
  const id = row.difficulty + '/' + row.side;
  if (!aggregate.has(id))
    aggregate.set(id, { times: [], blocks: [], table: new Map(), clonePaths: new Map(), pathTimes: {}, sampleCount: 0 });
  const dest = aggregate.get(id);
  const block = decode(row);
  dest.sampleCount += block.sampleCount;
  dest.times.push(...row.times);
  for (const [name, f] of block.table) {
    const v = dest.table.get(name) ?? { self: 0, total: 0 };
    v.self += f.self;
    v.total += f.total;
    dest.table.set(name, v);
  }
  for (const [name, us] of block.clonePaths) dest.clonePaths.set(name, (dest.clonePaths.get(name) ?? 0) + us);
  const n = row.times.length;
  for (const [name, us] of Object.entries(block.summary)) dest.pathTimes[name] = (dest.pathTimes[name] ?? 0) + us;
  dest.blocks.push({
    number: row.block, wall: timingSummary(row.times.map(t => t.wallNs / 1e6)),
    threadCpu: timingSummary(row.times.map(t => t.threadCpuUs / scale)),
    pathMs: Object.fromEntries(Object.entries(block.summary).map(([name, us]) => [name.replace(/Us$/, ''), rounded(us / n / scale)])),
    cloneMs: rounded([...block.clonePaths.values()].reduce((sum, us) => sum + us, 0) / n / scale),
  });
}

function summary(side) {
  const n = side.times.length;
  return {
    n, sampleCount: side.sampleCount,
    wall: timingSummary(side.times.map(t => t.wallNs / 1e6)),
    threadCpu: timingSummary(side.times.map(t => t.threadCpuUs / scale)),
    profileMsPerDispatch: Object.fromEntries(Object.entries(side.pathTimes).map(([name, us]) => [name.replace(/Us$/, ''), rounded(us / n / scale)])),
    cloneCallSitesMsPerDispatch: Object.fromEntries([...side.clonePaths].map(([name, us]) => [name, rounded(us / n / scale)])),
    blocks: side.blocks,
  };
}

function compare(from, to) {
  const names = new Set([...from.table.keys(), ...to.table.keys()]);
  const rows = [...names].map(name => {
    const a = from.table.get(name) ?? { self: 0, total: 0 };
    const b = to.table.get(name) ?? { self: 0, total: 0 };
    const base = { self: a.self / from.times.length / scale, total: a.total / from.times.length / scale };
    const head = { self: b.self / to.times.length / scale, total: b.total / to.times.length / scale };
    return { name, base, head, selfDelta: rounded(head.self - base.self), totalDelta: rounded(head.total - base.total) };
  });
  const meaningful = rows.filter(x => !significant.test(x.name) &&
    !x.name.includes('profiledEndWeek @') && !x.name.includes('profile-end-week.mjs') && !x.name.startsWith('executeCharacterLifeCommand @'));
  return {
    topBySelf: meaningful.sort((a, b) => Math.abs(b.selfDelta) - Math.abs(a.selfDelta)).slice(0, 20),
    topByTotal: meaningful.sort((a, b) => Math.abs(b.totalDelta) - Math.abs(a.totalDelta)).slice(0, 20),
    rows: rows.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
const results = {};
for (const difficulty of ['normal', 'easy']) {
  const sides = Object.fromEntries(['base', 'head', 'aa1', 'aa2'].map(side => [side, aggregate.get(difficulty + '/' + side)]));
  assert(Object.values(sides).every(side => side.times.length === dataset.blockCount * dataset.dispatchesPerCohort));
  const timing = Object.fromEntries(Object.entries(sides).map(([key, side]) => [key, summary(side)]));
  const work = read(difficulty + '-work.json');
  const paired = compare(sides.base, sides.head);
  const control = compare(sides.aa1, sides.aa2);
  results[difficulty] = { timing, paired, control, diffPaths: work.differences.map(row => row.path) };
}
writeFileSync(resolve(run, 'profile-summary.json'), JSON.stringify(results, null, 2) + '\n', 'utf8');
for (const [difficulty, { timing, paired, diffPaths }] of Object.entries(results)) {
  console.log(difficulty);
  for (const [side, { n, sampleCount, wall, threadCpu, profileMsPerDispatch, cloneCallSitesMsPerDispatch }] of Object.entries(timing))
    console.log(JSON.stringify({ side, n, sampleCount, wall, threadCpu, profileMsPerDispatch, cloneCallSitesMsPerDispatch }));
  console.log('Self', JSON.stringify(paired.topBySelf.slice(0, 8)));
  console.log('Total', JSON.stringify(paired.topByTotal.slice(0, 8)));
  console.log('Changed output leaves', diffPaths.length);
}
