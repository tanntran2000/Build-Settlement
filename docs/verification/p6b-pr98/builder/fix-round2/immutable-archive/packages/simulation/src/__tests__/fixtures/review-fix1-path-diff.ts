// Run from the repo root: node packages/simulation/src/__tests__/fixtures/review-fix1-path-diff.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const base = 'b31dc0268279abcb29483d372cd17d156fa825f0';
const fixtures = 'packages/persistence/src/__tests__/fixtures/society-v8';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

function paths(a: unknown, b: unknown, path = ''): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return [path];
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap(key => {
    const next = path ? `${path}.${key}` : key;
    return !Object.hasOwn(left, key) || !Object.hasOwn(right, key) ? [next] : paths(left[key], right[key], next);
  });
}

function readPair(file: string) {
  const before = execFileSync('git', ['show', `${base}:${file}`]), after = readFileSync(file);
  console.log(`File: ${file}\nBefore SHA256: ${sha(before)}\nAfter SHA256: ${sha(after)}`);
  return [JSON.parse(before.toString('utf8')), JSON.parse(after.toString('utf8'))];
}

function compare(before: Record<string, unknown>, after: Record<string, unknown>, label: string, tile = false) {
  const { state: oldState, ...oldEnvelope } = before, { state: newState, ...newEnvelope } = after;
  assert.deepEqual(newEnvelope, oldEnvelope, `${label}: envelope changed`);
  const changed = paths(tile ? { city: oldState } : oldState, tile ? { city: newState } : newState);
  console.log(`${label}: ${changed.length ? changed.join(', ') : '(unchanged)'}`);
  assert.ok(changed.every(path => path.startsWith('city.society.items.market.')), `${label}: unexpected path`);
  return changed.length;
}

console.log(`Base: ${base}\nUTC: ${new Date().toISOString()}`);
const [oldGolden, newGolden] = readPair(golden);
assert.equal(newGolden.length, oldGolden.length);
for (const before of oldGolden) {
  const after = newGolden.find((entry: { seed: number }) => entry.seed === before.seed);
  assert.ok(after);
  const { session: oldSession, ...oldSummary } = before, { session: newSession, ...newSummary } = after;
  assert.deepEqual(newSummary, oldSummary);
  assert.ok(compare(JSON.parse(oldSession), JSON.parse(newSession), `Golden seed ${before.seed}`) > 0);
}
for (const name of readdirSync(fixtures).filter(name => name.endsWith('.json')).sort()) {
  const [before, after] = readPair(`${fixtures}/${name}`);
  const changed = compare(before, after, name, name === 'new-game.json');
  if (name.startsWith('life-')) assert.ok(changed > 0);
  else assert.equal(changed, 0);
}
console.log('PASS: only city.society.items Market paths differ against b31dc02; all gameplay and envelope fields are unchanged.');
