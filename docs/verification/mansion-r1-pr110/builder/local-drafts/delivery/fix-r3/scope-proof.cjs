const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const base = 'b6365646a4f13c0eb21babbcbae953b19400b52b';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const paths = [
  'packages/persistence/src/__tests__/game-store.test.ts',
  'packages/persistence/src/game-store.ts',
  'packages/persistence/src/memory-store.ts',
  'packages/ui/src/CharacterLifeApp.svelte',
  'packages/ui/src/TitleScreen.svelte',
  'packages/ui/src/__tests__/character-life-session.test.ts',
  'packages/ui/src/__tests__/v14-load.test.ts',
  'packages/ui/src/character-life-session.ts',
  'packages/ui/src/indexeddb-store.ts',
  'tests/e2e/mansion-rooms.spec.ts',
  'tests/e2e/storage.spec.ts',
];
assert.deepEqual(git('diff', '--name-only', base, 'HEAD').trim().split(/\r?\n/), paths);
const patch = git('diff', '--unified=0', base, 'HEAD');
const edits = patch.split(/\r?\n/).filter(line => /^[+-](?![+-])/.test(line));
assert.deepEqual(edits.filter(line => /\b[\da-f]{64}\b/i.test(line)), []);
assert.deepEqual(edits.filter(line => /^\+.*(?:\btest|\bit)\.(?:skip|only|setTimeout)\b/.test(line)), []);
const existingTests = paths.filter(file => file.endsWith('game-store.test.ts') || file.endsWith('character-life-session.test.ts') || file.endsWith('storage.spec.ts'));
const expected = readFileSync(join(__dirname, 'existing-expectations-R3-01.diff'), 'utf8');
assert.equal(git('diff', '--unified=0', base, 'HEAD', '--', ...existingTests), expected);
for (const path of paths) console.log(path);
console.log('11 scoped paths. Existing-test changes exactly match the R3-01 inventory. No fixture, golden, catalog, timeout, skip or digest-literal changes.');
