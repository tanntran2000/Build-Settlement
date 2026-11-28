const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const base = 'd306f686876aca47bd9f4176a366380aa56fc774';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

const allowedPaths = [
  'packages/core/src/data/mansion.json',
  'packages/core/src/mansion/__tests__/catalog.test.ts',
  'packages/core/src/mansion/__tests__/shape.test.ts',
  'packages/core/src/mansion/catalog.ts',
  'packages/core/src/mansion/invariants.ts',
  'packages/core/src/mansion/rules.ts',
  'packages/core/src/mansion/types.ts',
  'packages/core/src/trial/society.ts',
  'packages/persistence/src/__tests__/upgrade-v14.test.ts',
  'packages/persistence/src/session-records.ts',
  'packages/persistence/src/upgrade-v14.ts',
  'packages/simulation/src/__tests__/mansion-command.test.ts',
  'packages/simulation/src/mansion-command.ts',
  'packages/ui/src/CharacterLifeApp.svelte',
  'packages/ui/src/MansionPanel.svelte',
  'packages/ui/src/TileManagement.svelte',
  'packages/ui/src/__tests__/mansion-view.test.ts',
  'packages/ui/src/__tests__/v14-load.test.ts',
  'packages/ui/src/character-life-session.ts',
  'packages/ui/src/mansion-view.ts',
  'tests/e2e/mansion-rooms.spec.ts',
];
const changed = git('diff', '--name-only', base, 'HEAD').trim().split(/\r?\n/);
assert.deepEqual(changed, allowedPaths);
for (const path of changed) console.log(path);
const patch = git('diff', '--unified=0', base, 'HEAD');
const edits = patch.split(/\r?\n/).filter(line => /^[+-](?![+-])/.test(line));
const digests = edits.filter(line => /\b[\da-f]{64}\b/i.test(line));
assert.deepEqual(digests, []);
assert.equal(git('diff', '--name-only', base, 'HEAD', '--', 'packages/persistence/src/__tests__/fixtures', 'packages/simulation/src/__tests__/fixtures', 'packages/core/src/data/tuning.json'), '');

const mansionFile = 'packages/core/src/data/mansion.json';
const previous = JSON.parse(git('show', base + ':' + mansionFile));
const current = JSON.parse(git('show', 'HEAD:' + mansionFile));
delete current.defaultBuildType;
for (const type of Object.values(current.roomTypes)) {
  delete type.starter;
  delete type.suiteRoles;
  delete type.migrationPriority;
  delete type.reportAccess;
}
for (const furniture of Object.values(current.furniture)) delete furniture.addsBed;
assert.deepEqual(current, previous);
console.log('21 approved paths; no changes to saved fixtures, serialized goldens, tuning, or SHA-256 literals.');
console.log('The Mansion catalog, with only the new behavior fields removed, exactly matches the pre-review catalog.');
