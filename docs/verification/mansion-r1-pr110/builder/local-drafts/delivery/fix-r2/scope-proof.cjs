const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const old = 'b3d1278ee02e374f1c3cf1eceee48a0dc0fbcbf7';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const approved = [
  'packages/core/src/mansion/__tests__/catalog.test.ts',
  'packages/core/src/mansion/invariants.ts',
  'packages/core/src/mansion/rules.ts',
  'packages/persistence/src/game-store.ts',
  'packages/persistence/src/memory-store.ts',
  'packages/persistence/src/upgrade-v14.ts',
  'packages/ui/src/CharacterLifeApp.svelte',
  'packages/ui/src/TileManagement.svelte',
  'packages/ui/src/TitleScreen.svelte',
  'packages/ui/src/__tests__/character-life-session.test.ts',
  'packages/ui/src/__tests__/v14-load.test.ts',
  'packages/ui/src/character-life-session.ts',
  'packages/ui/src/indexeddb-store.ts',
  'tests/e2e/mansion-rooms.spec.ts',
  'tests/e2e/storage.spec.ts',
];
assert.deepEqual(git('diff', '--name-only', old, 'HEAD').trim().split(/\r?\n/), approved);
for (const file of approved) console.log(file);
const patch = git('diff', '--unified=0', old, 'HEAD');
assert.deepEqual(patch.split(/\r?\n/).filter(line => /^[+-](?![+-])/.test(line) && /\b[\da-f]{64}\b/i.test(line)), []);
assert.equal(git('diff', '--name-only', old, 'HEAD', '--', 'packages/persistence/src/__tests__/fixtures', 'packages/simulation/src/__tests__/fixtures', 'packages/core/src/data'), '');

const legacyTests = new Map([
  ['packages/ui/src/__tests__/character-life-session.test.ts', [
    ["import { createCheckpointDeps,", "import { DAMAGED_CHECKPOINT_MESSAGE,createCheckpointDeps,"],
    ["expect(await saveLocalCharacterLife(a2Session(),checkpointDeps)).toEqual({ success: true,replaced: false }); expect(await readLocalCharacterLife(checkpointDeps))", "expect(await saveLocalCharacterLife(a2Session(),checkpointDeps)).toEqual({ success: true,replaced: false,volatile: true }); expect(await readLocalCharacterLife(checkpointDeps))"],
    ["corrupt stored city is refused with the existing message and exact records preserved", "corrupt stored city is refused as damaged and exact records are preserved"],
    ["expect(await readLocalCharacterLife(d)).toEqual({success:false,message:OLD});expect(await d.store.read('main')).toEqual(before);", "expect(await readLocalCharacterLife(d)).toEqual({success:false,message:DAMAGED_CHECKPOINT_MESSAGE});expect(await d.store.read('main')).toEqual(before);"],
  ]],
  ['tests/e2e/storage.spec.ts', [
    ["expect(await exportLife(page)).toEqual(makeLife());await button(page,'Main menu').click();await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);", "expect(await exportLife(page)).toEqual(makeLife());await button(page,'Main menu').click();const prompt=page.getByRole('dialog',{name:'Session-only checkpoint',exact:true});await expect(prompt.getByText('Saved for this session only. Use Export checkpoint to keep your progress.',{exact:true})).toBeVisible();await prompt.getByRole('button',{name:'Return to title',exact:true}).click();await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);"],
  ]],
]);
for (const [path, substitutions] of legacyTests) {
  let planned = git('show', old + ':' + path);
  for (const [before, after] of substitutions) {
    assert.equal(planned.split(before).length, 2, path);
    planned = planned.replace(before, after);
  }
  assert.equal(git('show', 'HEAD:' + path), planned, path);
  console.log('Exact correction-5 substitutions confirmed: ' + path);
}
console.log('15 correction-5 paths. No data, archived or current fixtures, serialized goldens, or SHA-256 literal changes.');
