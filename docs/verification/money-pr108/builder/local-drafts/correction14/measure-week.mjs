import { registerHooks, createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

const [base, head, fixtures, out] = process.argv.slice(2).map(path => resolve(path));
const roots = [base, head].map(root => ({ root, url: pathToFileURL(root + '/').href }));
const ts = createRequire(resolve(head, 'package.json'))('typescript');
const sha = value => createHash('sha256').update(value).digest('hex');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      const { root } = roots.find(entry => context.parentURL?.startsWith(entry.url)) ?? roots[1];
      return next(pathToFileURL(resolve(root, 'packages', specifier.split('/')[1], 'src/index.ts')).href, context);
    }
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const { outputText } = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      });
      return { format: 'module', source: outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

const from = (root, file) => import(pathToFileURL(resolve(root, file)).href);
const [a, b] = await Promise.all(roots.map(({root}) => from(root, 'packages/simulation/src/character-life-command.ts')));
const core = await from(head, 'packages/core/src/index.ts');
const persistence = await from(head, 'packages/persistence/src/index.ts');
const rawPath = resolve(out, 'raw-timings.ndjson');
writeFileSync(rawPath, '', { flag: 'wx' });
const summary = [];

function dispatch(action, state) {
  return action.executeCharacterLifeCommand(state, {
    type: 'END_WEEK', expectedRevision: state.city.revision, expectedWeek: state.city.world.week,
  });
}
function check(result) {
  if (!result.success) throw Error(result.error.code + ' ' + result.error.message);
  assert.equal(result.next.npcs.length, 100);
  assert.equal(result.report.week, 10);
  return result;
}
function close(action, state) { return check(dispatch(action, state)); }
function stats(values) {
  const sorted = [...values].sort((a,b) => a-b);
  const at = fraction => sorted[Math.ceil(sorted.length * fraction) - 1];
  return { n: sorted.length, min: sorted[0], median: at(.5), p95: at(.95), max: sorted.at(-1),
    above50: sorted.filter(ms => ms > 50).length };
}
function timings(action, state, expectedResult) {
  const ms = [];
  for (let i = 0; i < 8; i++) {
    const cloned = structuredClone(state);
    const start = performance.now();
    const result = dispatch(action, cloned);
    ms.push(performance.now() - start);
    assert.equal(sha(JSON.stringify(check(result))), expectedResult);
  }
  return ms;
}
for (const difficulty of ['normal','easy']) for (const [scenario, levyPercent, excess] of [
  ['zero-levy', 0, null], ['levy-below-safe', 5, null], ['draw-miss', 5, 9], ['draw-hit', 5, 30000],
]) {
  const fixture = JSON.parse(readFileSync(resolve(fixtures, difficulty + '-100-npc.json'), 'utf8')).state;
  fixture.city.world.week = 10;
  fixture.player.purse.levyPercent = levyPercent;
  fixture.player.purse.moneyMilli = 0;
  const preview = close(a, fixture);
  const safe = core.safeAmountMilli(preview.next.city.society.order.security, difficulty);
  const levyMoneyMilli = preview.report.purse.moneyAfterMilli;
  if (excess !== null) fixture.player.purse.moneyMilli = safe + excess - levyMoneyMilli;
  const baseResult = close(a, fixture), headResult = close(b, fixture);
  const card = headResult.next.player.purse.robbery;
  if (scenario === 'draw-hit') assert.deepEqual(card, { id: 'home-robbery-w10', week: 10, excessMilli: 30000 });
  else assert.equal(card, null);
  assert.equal(headResult.report.purse.moneyAfterMilli > safe, excess !== null);
  const hashes = [baseResult, headResult].map(result => sha(JSON.stringify(result)));
  if (scenario !== 'draw-hit') assert.equal(hashes[0], hashes[1]);
  if (scenario === 'draw-hit') {
    const planning = b.executeCharacterLifeCommand(headResult.next, {
      type: 'NEXT_WEEK', expectedRevision: headResult.next.city.revision,
    });
    assert(planning.success);
    const saved = persistence.serializeCharacterLifeSave(planning.next);
    assert(saved.success);
    planning.next.player.purse.robbery = null;
    const noCard = persistence.serializeCharacterLifeSave(planning.next);
    assert(noCard.success);
    const size = { difficulty, pendingBytes: Buffer.byteLength(saved.text), nullBytes: Buffer.byteLength(noCard.text),
      delta: Buffer.byteLength(saved.text) - Buffer.byteLength(noCard.text), saveSha256: sha(saved.text) };
    writeFileSync(resolve(out, difficulty + '-save-size.json'), JSON.stringify(size,null,2)+'\n');
    writeFileSync(resolve(out, difficulty + '-pending-save.json'), saved.text);
  }
  const inputSha = sha(JSON.stringify(fixture));
  timings(a, fixture, hashes[0]);
  timings(b, fixture, hashes[1]);
  const noise = [], delta = [], baseTimes = [], headTimes = [];
  for (let i = 0; i < 8; i++) {
    const aa = [timings(a,fixture,hashes[0]),timings(a,fixture,hashes[0])];
    const pair = i%2 === 0 ? [timings(a,fixture,hashes[0]),timings(b,fixture,hashes[1])]
      : [timings(b,fixture,hashes[1]),timings(a,fixture,hashes[0])].reverse();
    const [before, after] = pair;
    baseTimes.push(...before);
    headTimes.push(...after);
    const aDelta = stats(aa[1]).median-stats(aa[0]).median;
    const bDelta = stats(after).median-stats(before).median;
    noise.push(aDelta);
    delta.push(bDelta);
    appendFileSync(rawPath, JSON.stringify({ difficulty, scenario, inputSha, hashes, block: i+1,
      order: i%2===0?'AB':'BA', aa, before, after, aDelta, bDelta })+'\n');
  }
  assert.equal(sha(JSON.stringify(fixture)),inputSha);
  summary.push({difficulty,scenario,npcCount:100,levyPercent,excess,safe,levyMoneyMilli,card,inputSha,
    baseMs:stats(baseTimes),headMs:stats(headTimes),aaMedianDeltaMs:stats(noise),pairedMedianDeltaMs:stats(delta)});
  console.log(JSON.stringify(summary.at(-1)));
}
writeFileSync(resolve(out, 'measurement-summary.json'),JSON.stringify({node:process.version,summary},null,2)+'\n');

