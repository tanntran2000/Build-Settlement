// Run from the repo root: node packages/simulation/src/__tests__/fixtures/p6b-path-diff.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const base = '5e9674e31fb017f730dced4178514ebbfe1dbf24';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const changedFixtures = new Set(['life-5-weeks.json','life-laws.json'].map(n => `packages/persistence/src/__tests__/fixtures/society-v8/${n}`));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function paths(a: unknown,b: unknown,p = ''): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return [p];
  const left = a as Record<string,unknown>, right = b as Record<string,unknown>;
  return [...new Set([...Object.keys(left),...Object.keys(right)])].flatMap(k => {
    const next = p ? `${p}.${k}` : k;
    return !Object.hasOwn(left,k) || !Object.hasOwn(right,k) ? [next] : paths(left[k],right[k],next);
  });
}
function pair(file: string) {
  const before = execFileSync('git',['show',`${base}:${file}`]), after = readFileSync(file);
  console.log(`File: ${file}\nBefore SHA256: ${sha(before)}\nAfter SHA256: ${sha(after)}`);
  return { before,after };
}
function decoded(before: string,after: string,label: string,health = false) {
  const {state:oldState,...oldEnvelope} = JSON.parse(before), {state:newState,...newEnvelope} = JSON.parse(after);
  assert.deepEqual(newEnvelope,oldEnvelope,`${label}: envelope changed`);
  const changed = paths(oldState,newState);
  console.log(`${label}: ${changed.join(', ')}`);
  assert.ok(changed.length > 0,`${label}: no changed paths`);
  assert.ok(changed.every(p => p.startsWith('city.society.items.') || health && p === 'player.character.health'),`${label}: unexpected path`);
  return changed.length;
}
console.log(`Base: ${base}\nUTC: ${new Date().toISOString()}`);
const raw = pair(golden), before = JSON.parse(raw.before.toString('utf8')), after = JSON.parse(raw.after.toString('utf8'));
assert.equal(after.length,before.length);
for (const old of before) {
  const next = after.find((s: {seed: number}) => s.seed === old.seed); assert.ok(next);
  const {session:a,...oldSummary} = old, {session:b,...newSummary} = next;
  assert.deepEqual(newSummary,oldSummary); decoded(a,b,`Golden seed ${old.seed}`,true);
}
const fixtureFiles = execFileSync('git',['ls-files','packages/persistence/src/__tests__/fixtures'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>f.endsWith('.json'));
let unchanged = 0;
for (const file of fixtureFiles) {
  const {before,after} = pair(file);
  if (changedFixtures.has(file)) decoded(before.toString('utf8'),after.toString('utf8'),file);
  else { assert.ok(before.equals(after),`Unauthorized fixture change: ${file}`); unchanged++; }
}
console.log(`PASS: 3 golden seeds satisfy the PR B path allowlist; exactly 2 v8 fixtures change only city.society.items.*; ${unchanged} other fixture files are byte-identical.`);
