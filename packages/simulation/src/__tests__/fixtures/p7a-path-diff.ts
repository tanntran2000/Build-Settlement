// Run from repo root: node packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts [--fixtures-only]
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const base = '753e4503673df86830fba2ef2c9ef1e64a843729';
const root = 'packages/persistence/src/__tests__/fixtures';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const original = (file: string) => execFileSync('git', ['show', `${base}:${file}`]);
const tracked = (prefix: string) => execFileSync('git', ['ls-tree', '-r', '--name-only', base, '--', prefix], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

// Expand added life objects to leaves, including empty history collections.
function paths(a: unknown, b: unknown, prefix = ''): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';
  if (a === undefined && object(b) && Object.keys(b).length) {
    return Object.keys(b).flatMap(key => paths(undefined, b[key], `${prefix}.${key}`));
  }
  if (!object(a) || !object(b) || Array.isArray(a) !== Array.isArray(b)) return [prefix];
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(key =>
    paths(a[key], b[key], prefix ? `${prefix}.${key}` : key));
}

let changedLeaves = 0;
function decoded(before: string, after: string, label: string, tile = false) {
  const { state: oldState, ...oldEnvelope } = JSON.parse(before), { state: newState, ...newEnvelope } = JSON.parse(after);
  const key = tile ? 'rulesetId' : 'cityRulesetId';
  assert.equal(oldEnvelope[key], 'tile-society-09', `${label}: old envelope`);
  assert.equal(newEnvelope[key], 'tile-society-10', `${label}: new envelope`);
  assert.deepEqual(newEnvelope, { ...oldEnvelope, [key]: 'tile-society-10' }, `${label}: other envelope changes`);
  const changed = paths(tile ? { city: oldState } : oldState, tile ? { city: newState } : newState);
  assert.ok(changed.includes('city.society.rulesetId'), `${label}: missing ruleset change`);
  for (const path of changed) assert.ok(path === 'city.society.rulesetId' || /^npcs\.\d+\.life\..+$/.test(path), `${label}: FORBIDDEN ${path}`);
  if (!tile) {
    assert.equal(newState.npcs.length, oldState.npcs.length, `${label}: NPC count`);
    for (let i = 0; i < newState.npcs.length; i++) {
      assert.equal(Object.hasOwn(oldState.npcs[i], 'life'), false, `${label}: original already has life`);
      assert.equal(Object.keys(newState.npcs[i]).at(-1), 'life', `${label}: life must be last`);
      const { life, ...existing } = newState.npcs[i];
      assert.deepEqual(existing, oldState.npcs[i], `${label}: existing NPC fields`);
      assert.ok(life && typeof life === 'object', `${label}: missing life`);
    }
  }
  changedLeaves += changed.length;
  console.log(`${label}: ${changed.length} leaves: ${changed.join(', ')}`);
  console.log(`${label}: SHA256 before=${sha(Buffer.from(before))} after=${sha(Buffer.from(after))}`);
}

console.log(`UTC=${new Date().toISOString()}`);
console.log(`BASE=${base}`);
console.log(`HEAD=${execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`);
const historical = tracked(root).filter(file => /\/society-v[1-9]\//.test(file));
for (const file of historical) {
  const blob = execFileSync('git', ['hash-object', `--path=${file}`, file], { encoding: 'utf8' }).trim();
  assert.equal(blob, execFileSync('git', ['rev-parse', `${base}:${file}`], { encoding: 'utf8' }).trim(), `Historical fixture changed: ${file}`);
}
const oldNames = readdirSync(`${root}/society-v9`).sort(), newNames = readdirSync(`${root}/society-v10`).sort();
assert.equal(newNames.length, 10);
assert.deepEqual(newNames, oldNames, 'v10 scenarios differ from v9');
for (const name of newNames) decoded(original(`${root}/society-v9/${name}`).toString('utf8'), readFileSync(`${root}/society-v10/${name}`, 'utf8'), `v10/${name}`, name === 'new-game.json');

let seeds = 0;
if (!process.argv.includes('--fixtures-only')) {
  const before = JSON.parse(original(golden).toString('utf8')), after = JSON.parse(readFileSync(golden, 'utf8'));
  assert.equal(before.length, 3); assert.equal(after.length, before.length);
  for (let i = 0; i < before.length; i++) {
    const { session: oldText, ...oldSummary } = before[i], { session: newText, ...newSummary } = after[i];
    assert.deepEqual(newSummary, oldSummary, 'Golden seed/order/60-week summary changed');
    decoded(oldText, newText, `golden seed ${oldSummary.seed}`); seeds++;
  }
}
const protectedFiles = tracked('packages/simulation/src/__tests__/fixtures').filter(file => file !== golden);
for (const file of protectedFiles) {
  assert.equal(execFileSync('git', ['hash-object', `--path=${file}`, file], { encoding: 'utf8' }).trim(),
    execFileSync('git', ['rev-parse', `${base}:${file}`], { encoding: 'utf8' }).trim(), `Generator or historical path evidence changed: ${file}`);
}
console.log(`PASS: ${seeds} golden seeds, ${newNames.length} v10 scenarios, ${changedLeaves} allowed state leaves; envelopes only 09 -> 10; ${historical.length} historical fixtures and ${protectedFiles.length} generator/evidence blobs unchanged; forbidden paths=0.`);
