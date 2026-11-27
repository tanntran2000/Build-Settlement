import { registerHooks, createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [head, fixtures, out] = process.argv.slice(2).map(path => resolve(path));
const roots = [head].map(root => ({ root, url: pathToFileURL(root + '/').href }));
const ts = createRequire(resolve(head, 'package.json'))('typescript');
const sha = value => createHash('sha256').update(value).digest('hex');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      const { root } = roots.find(entry => context.parentURL?.startsWith(entry.url)) ?? roots[0];
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

const commandPath = 'packages/simulation/src/character-life-command.ts';
const source = readFileSync(resolve(head, commandPath), 'utf8').replaceAll('\r\n', '\n');
const blocked = source.match(/  if \(type === 'END_WEEK' && session\.player\.purse\.robbery && Object\.getOwnPropertyDescriptor[\s\S]*?\n  }/)?.[0];
const wageGuard = source.match(/const wages = ([^\n]+)\n\s+\? payNpcWages\(session\) : undefined;/)?.[1];
const robberyCheck = source.match(/const robbery = runHomeRobberyCheck\(next, report\.week\);/)?.[0];
const reportSelect = source.match(/purse: (robbery \? Object\.freeze\(\{ \.\.\.purse, robbery \}\) : purse) \}\)/)?.[1];
for (const fragment of [blocked, wageGuard, robberyCheck, reportSelect]) {
  assert.equal(typeof fragment, 'string');
}
assert(wageGuard.includes('!session.player.purse.robbery'));
const fragments = { blocked, wageGuard, robberyCheck, reportSelect };
const sourcePath = 'packages/simulation/src/purse-week.ts';
const { runHomeRobberyCheck } = await from(head, sourcePath);
const { executeCharacterLifeCommand } = await from(head, commandPath);
const { safeAmountMilli } = await from(head, 'packages/core/src/index.ts');
const { deserializeCharacterLifeSave } = await from(head, 'packages/persistence/src/index.ts');

// Use the dispatcher's branch expressions and the production check. Exclude wage
// payment, levy processing, and report assembly that existed before M3.
const probeText = [
  'function probe(session, raw, next, report, purse) {',
  '  const type = raw.type;',
  blocked,
  '  if (!(' + wageGuard + ')) throw Error("Unexpected ineligible wages.");',
  '  ' + robberyCheck,
  '  return ' + reportSelect + ';',
  '}',
].join('\n');
const { outputText } = ts.transpileModule(probeText, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
});
const probe = new Function('runHomeRobberyCheck', 'fail', outputText + '\nreturn probe;')(
  runHomeRobberyCheck, () => { throw Error('Unexpected blocked End Week.'); },
);

const warmup = 16000;
const samples = 20000;
const cases = ['normal', 'easy'].map(difficulty => {
  const fixture = readFileSync(resolve(fixtures, difficulty + '-100-npc.json'), 'utf8');
  const restored = deserializeCharacterLifeSave(fixture);
  assert(restored.success);
  const session = restored.state;
  assert.equal(session.npcs.length, 100);
  assert.equal(session.city.society.difficulty, difficulty);
  session.city.world.week = 10;
  session.player.purse.moneyMilli = 0;
  session.player.purse.levyPercent = 5;
  const raw = { type: 'END_WEEK', expectedWeek: 10, expectedRevision: session.city.revision };
  const closed = executeCharacterLifeCommand(session, raw);
  assert(closed.success);
  assert.equal(closed.next.npcs.length, 100);
  assert.equal(closed.report.week, 10);
  const { next, report } = closed;
  const purse = report.purse;
  const security = next.city.society.order.security;
  const safeMilli = safeAmountMilli(security, difficulty);
  assert.equal(next.player.purse.robbery, null);
  assert.equal(purse.robbery, undefined);
  assert.equal(next.player.purse.moneyMilli, purse.moneyAfterMilli);
  assert(purse.moneyAfterMilli < safeMilli);
  assert.notEqual(next.city.society.crisis.stage, 'fallen');
  assert.equal(probe(session, raw, next, report, purse), purse);
  return { difficulty, fixtureSHA256: sha(fixture), security, moneyMilli: purse.moneyAfterMilli, safeMilli,
    session, raw, next, report, purse, nextSHA256: sha(JSON.stringify(next)), rawNs: [] };
});
const run = ({ session, raw, next, report, purse }) => probe(session, raw, next, report, purse);
for (let i = 0; i < warmup; i++) {
  for (const input of cases) assert.equal(run(input), input.purse);
}
for (let i = 0; i < samples; i++) {
  for (let j = 0; j < cases.length; j++) {
    const input = cases[(i + j) % cases.length];
    const start = process.hrtime.bigint();
    const result = run(input);
    const elapsed = process.hrtime.bigint() - start;
    input.rawNs.push(Number(elapsed));
    assert.equal(result, input.purse);
  }
}

const percentile = (a, p) => a[Math.ceil(p * a.length) - 1] / 1_000_000;
const results = cases.map(input => {
  assert.equal(sha(JSON.stringify(input.next)), input.nextSHA256);
  const { difficulty, fixtureSHA256, security, moneyMilli, safeMilli, rawNs } = input;
  const sorted = [...rawNs].sort((a, b) => a - b);
  const summary = { difficulty, fixtureSHA256, npcCount: input.next.npcs.length, security, moneyMilli, safeMilli,
    samples: rawNs.length, minMs: percentile(sorted, 1 / sorted.length), medianMs: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95), maxMs: percentile(sorted, 1) };
  writeFileSync(resolve(out, difficulty + '-isolated-raw-ns.json'), JSON.stringify(rawNs) + '\n', { flag: 'wx' });
  return summary;
});
const summary = {
  node: process.version, warmupPerDifficulty: warmup, thresholdMedianMs: 0.05,
  sourceFiles: [commandPath, sourcePath].map(path => ({ path, sha256: sha(readFileSync(resolve(head, path))) })),
  fragments, results,
};
writeFileSync(resolve(out, 'isolated-summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary, null, 2));
if (results.some(result => result.medianMs > summary.thresholdMedianMs)) process.exitCode = 1;
