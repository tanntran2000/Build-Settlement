// Run from repo root: node packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const base = 'dac604054d7cbbf14a0a42209a3ff560380f2956';
const fixtureRoot = 'packages/persistence/src/__tests__/fixtures';
const golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json';
const mutable = ['life-5-weeks.json', 'life-laws.json'].map(name => `${fixtureRoot}/society-v10/${name}`);
const original = (file: string) => execFileSync('git', ['show', `${base}:${file}`]);
const tracked = (prefix: string) => execFileSync('git', ['ls-tree', '-r', '--name-only', base, '--', prefix], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object';

function paths(before: unknown, after: unknown, prefix = ''): string[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (before === undefined && object(after) && Object.keys(after).length) {
    return Object.keys(after).flatMap(key => paths(undefined, after[key], `${prefix}.${key}`));
  }
  if (after === undefined && object(before) && Object.keys(before).length) {
    return Object.keys(before).flatMap(key => paths(before[key], undefined, `${prefix}.${key}`));
  }
  if (!object(before) || !object(after) || Array.isArray(before) !== Array.isArray(after)) return [prefix];
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(key =>
    paths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
}

let leaves = 0;
function decoded(before: string, after: string, label: string, expected: number) {
  const { state: oldState, ...oldEnvelope } = JSON.parse(before);
  const { state: newState, ...newEnvelope } = JSON.parse(after);
  assert.equal(oldEnvelope.cityRulesetId, 'tile-society-10', `${label}: base ruleset`);
  assert.deepEqual(newEnvelope, oldEnvelope, `${label}: save envelope changed`);
  const changed = paths(oldState, newState);
  for (const path of changed) {
    assert.ok(/^npcs\.\d+\.life\..+$/.test(path) || /^(?:report\.)?npcLife\..+$/.test(path), `${label}: FORBIDDEN ${path}`);
  }
  assert.equal(changed.length, expected, `${label}: unexpected changed leaf count`);
  leaves += changed.length;
  console.log(`${label}: ${changed.length} allowed leaves: ${changed.join(', ')}`);
  console.log(`${label}: SHA256 before=${sha(Buffer.from(before))} after=${sha(Buffer.from(after))}`);
}

function unchanged(file: string) {
  const current = execFileSync('git', ['hash-object', `--path=${file}`, file], { encoding: 'utf8' }).trim();
  const prior = execFileSync('git', ['rev-parse', `${base}:${file}`], { encoding: 'utf8' }).trim();
  assert.equal(current, prior, `Protected blob changed: ${file}`);
}

console.log(`BASE=${base}`);
const fixtures = tracked(fixtureRoot).filter(file => file.endsWith('.json'));
assert.equal(fixtures.length, 73);
assert.equal(fixtures.filter(file => /\/society-v[1-9]\//.test(file)).length, 63);
assert.equal(fixtures.filter(file => /\/society-v10\//.test(file)).length, 10);
for (const file of fixtures) {
  if (mutable.includes(file)) decoded(original(file).toString('utf8'), readFileSync(file, 'utf8'), file, 3);
  else unchanged(file);
}
const before = JSON.parse(original(golden).toString('utf8'));
const after = JSON.parse(readFileSync(golden, 'utf8'));
assert.equal(before.length, 3); assert.equal(after.length, 3);
for (let i = 0; i < before.length; i++) {
  const { session: oldSession, ...oldSummary } = before[i];
  const { session: newSession, ...newSummary } = after[i];
  assert.deepEqual(newSummary, oldSummary, 'Golden seed/order/60-week metrics changed');
  decoded(oldSession, newSession, `golden seed ${oldSummary.seed}`, 12);
}
const protectedArtifacts = tracked('packages/simulation/src/__tests__/fixtures').filter(file => file !== golden);
assert.equal(protectedArtifacts.length, 11);
for (const file of protectedArtifacts) unchanged(file);
assert.equal(leaves, 42);
console.log(`PASS: 3 golden seeds, 2 changed v10 fixtures, ${leaves} allowed life leaves; envelopes and tile-society-10 unchanged; 71 fixtures (63 historical, 8 current) and 11 generator/evidence blobs unchanged; forbidden paths=0.`);
