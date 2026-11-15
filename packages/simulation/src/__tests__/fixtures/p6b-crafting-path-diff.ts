// Run from the repository root: node packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const base = 'e85917733e229701830ad7f53dfcfbe2fefab831';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const root = 'packages/persistence/src/__tests__/fixtures';
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const oldBytes = (file: string) => execFileSync('git', ['show', `${base}:${file}`]);
function paths(a: unknown, b: unknown, prefix = ''): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return [prefix];
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap(key => {
    const next = prefix ? `${prefix}.${key}` : key;
    return !Object.hasOwn(left, key) || !Object.hasOwn(right, key) ? [next] : paths(left[key], right[key], next);
  });
}
function decoded(before: string, after: string, label: string, tile = false) {
  const { state: oldState, ...oldEnvelope } = JSON.parse(before), { state: newState, ...newEnvelope } = JSON.parse(after);
  const envelopeKey = tile ? 'rulesetId' : 'cityRulesetId';
  assert.equal(oldEnvelope[envelopeKey], 'tile-society-08');
  assert.equal(newEnvelope[envelopeKey], 'tile-society-09');
  assert.deepEqual(newEnvelope, { ...oldEnvelope, [envelopeKey]: 'tile-society-09' }, `${label}: unexpected envelope change`);
  const changed = paths(oldState, newState), society = tile ? 'society' : 'city.society';
  assert.ok(changed.includes(`${society}.rulesetId`), `${label}: missing ruleset change`);
  const unexpected = changed.filter(p => p !== `${society}.rulesetId` && !p.startsWith(`${society}.items.`));
  console.log(`${label}: ${changed.length} changed state paths; unexpected: ${unexpected.length}`);
  for (const p of changed) console.log(`  ${p}`);
  assert.deepEqual(unexpected, [], `${label}: path outside ruleset/items allowlist`);
}
console.log(`Base: ${base}\nUTC: ${new Date().toISOString()}`);
const beforeBytes = oldBytes(golden), afterBytes = readFileSync(golden);
console.log(`Golden before SHA256: ${sha(beforeBytes)}\nGolden after SHA256: ${sha(afterBytes)}`);
const before = JSON.parse(beforeBytes.toString('utf8')), after = JSON.parse(afterBytes.toString('utf8'));
assert.equal(after.length, before.length);
for (const [index, previous] of before.entries()) {
  const { session: a, ...oldSummary } = previous, { session: b, ...newSummary } = after[index];
  assert.deepEqual(newSummary, oldSummary, 'golden scenario order/metadata/report counters changed');
  decoded(a, b, `Golden seed ${previous.seed}`);
}
const historical = execFileSync('git', ['ls-tree', '-r', '--name-only', base, root], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(f => f.endsWith('.json'));
for (const file of historical) assert.ok(oldBytes(file).equals(readFileSync(file)), `Historical fixture changed: ${file}`);
const oldNames = readdirSync(`${root}/society-v8`).sort(), newNames = readdirSync(`${root}/society-v9`).sort();
assert.deepEqual(newNames, oldNames, 'v9 scenario set differs from v8');
for (const name of newNames) {
  const a = readFileSync(`${root}/society-v8/${name}`, 'utf8'), b = readFileSync(`${root}/society-v9/${name}`, 'utf8');
  decoded(a, b, `v9/${name}`, name === 'new-game.json');
}
for (const file of ['make-catalog-golden.ts', 'p6b-path-diff.ts', 'p6b-path-diff.txt']) {
  const full = `packages/simulation/src/__tests__/fixtures/${file}`;
  const blob = execFileSync('git', ['hash-object', `--path=${full}`, full], { encoding: 'utf8' }).trim();
  const original = execFileSync('git', ['rev-parse', `${base}:${full}`], { encoding: 'utf8' }).trim();
  assert.equal(blob, original, `Existing generator/path evidence changed: ${file}`);
}
console.log(`PASS: ${before.length} golden seeds, ${newNames.length} new v9 scenarios; only ruleset/items state paths change; all ${historical.length} historical fixtures are byte-identical; original generator/P6-A path evidence Git blobs unchanged.`);
