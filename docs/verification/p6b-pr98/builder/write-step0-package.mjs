import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Generates proposals only. It never writes inside the product worktree.
const root = dirname(fileURLToPath(import.meta.url));
const base = '43fcb9b856c66606230d6d7ba49140ae94cfaa00';
const source = path => execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8' });
function edit(id, path, before, after, why, task) {
  const value = source(path), start = value.indexOf(before);
  if (start < 0 || value.indexOf(before, start + before.length) >= 0) throw Error(`${id}: expected one exact before anchor`);
  return { id, path, line: value.slice(0, start).split('\n').length, before, after, why, task };
}
const helper = 'tests/e2e/character-life-navigation.helpers.ts';
const importLine = source(helper).split('\n').find(line => line.startsWith('import { createCharacterLifeSession,'));
const parserBefore = '  if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;\n  return result;';
const parserAfter = `  if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;
  const outputTable = quartermaster.getByRole('table', { name: 'Workshop output', exact: true });
  expect(await outputTable.count()).toBeLessThanOrEqual(1);
  if (await outputTable.count()) {
    const outputRows = await rows(quartermaster, 'Workshop output', ['Plot', 'Work', 'Output', 'Destination']);
    expect(outputRows.length).toBeGreaterThan(0);
    const places = { Inventory: 'inventory', 'Potion inventory': 'consumables', 'Material stack': 'materials', 'Temporary storage': 'storage', 'Waiting for room': 'ready' } as const;
    result.crafted = outputRows.map(([tileId, work, name, destination]) => {
      const output = definition(name);
      const matches = Object.entries(RECIPES).filter(([, recipe]) => recipe.output === output);
      expect(matches).toHaveLength(1);
      const [recipeId, recipe] = matches[0];
      expect(work).toBe(recipe.kind === 'refine' ? 'Refined' : ITEM_CATALOG[output].category === 'consumable' ? 'Brewed' : 'Crafted');
      expect(Object.hasOwn(places, destination)).toBe(true);
      return { tileId, recipeId, output, place: places[destination as keyof typeof places] };
    });
  }
  const idleTable = quartermaster.getByRole('table', { name: 'Idle workshops', exact: true });
  expect(await idleTable.count()).toBeLessThanOrEqual(1);
  if (await idleTable.count()) {
    const idleRows = await rows(quartermaster, 'Idle workshops', ['Plot', 'Status']);
    expect(idleRows.length).toBeGreaterThan(0);
    result.workshopsIdle = idleRows.map(([tileId, status]) => {
      expect(status).toBe('No orders completed. Check workers, supplies and upkeep.');
      return tileId;
    });
  }
  return result;`;
const city = 'packages/ui/src/CharacterLifeCity.svelte';
const management = 'packages/ui/src/TileManagement.svelte';
const known = source(management).split('\n').find(line => line.includes('const known = ['));
const route = source(management).split('\n').find(line => line.includes("else if (['BUY_ITEM'"));
const proposal = {
  status: 'proposed; owner decision required before RED or product/test edits', base,
  branch: 'feat/p6b-crafting-ui',
  existingTestEdits: [
    edit('P1', helper, importLine, importLine.replace('ITEM_CATALOG,', 'ITEM_CATALOG,RECIPES,'), 'The visible report oracle derives recipe ids from unique rendered output names and the static recipe catalog, independently of production UI helpers.', 'C2'),
    edit('P2', helper, "  expect(await page.locator('[role=tabpanel]').count()).toBe(1);", "  expect(await characters.locator('[role=tabpanel]').count()).toBe(1);", 'Buy/Brew adds a separate legitimate tab widget in the mounted City view. Preserve exactly one mounted Character tabpanel by scoping this character-window assertion to Characters. Existing visible-count, keyboard traversal and hidden-view checks remain.', 'C1'),
    edit('P3', helper, parserBefore, parserAfter, 'Parse optional crafted and idle rows from visible Quartermaster tables, with exact headers, nonempty rows, unique item/recipe lookup and explicit English destination/status validation. Keep all old parsing intact and omit absent optional keys.', 'C2'),
  ],
  outsideAllowlistEdits: [
    edit('X1', city, '  <InsideCity {state} {selectedId} {locked} {managementError} {onselect} {oncommand} />', '  <InsideCity {state} {npcs} {selectedId} {locked} {managementError} {onselect} {oncommand} />', 'Pass the existing read-only NPC list through the sole InsideCity mount so the capacity display includes the posted NPC effective technical/medical skill and worn items. No state mutation or dispatcher change.', 'C1'),
    edit('X2', management, known, known.replace("'NOT_SELLABLE'];", "'NOT_SELLABLE', 'RECIPE_UNKNOWN', 'NO_WORKSHOP', 'MISSING_INPUT', 'QUEUE_FULL', 'ORDER_UNKNOWN', 'WORKSHOP_BUSY'];"), 'Recognize the six craft/busy error codes already implemented by PR B instead of misclassifying them as UNKNOWN_COMMAND_FAILURE. Keep every old code and its order.', 'C1'),
    edit('X3', management, route, route.replace("'UNEQUIP_ITEM']", "'UNEQUIP_ITEM','PLACE_CRAFT_ORDER','CANCEL_CRAFT_ORDER']"), 'Route place/cancel failures through the existing managementError/itemError channel so the panel can show command errors. Leave revision checks, dispatch and every old route intact.', 'C1'),
  ],
  allowedProductFiles: ['packages/ui/src/WorkshopPanel.svelte', 'packages/ui/src/PotionPanel.svelte', 'packages/ui/src/InsideCity.svelte', 'packages/ui/src/ItemCard.svelte', 'packages/ui/src/items-view.ts', 'packages/ui/src/SoloWeekReport.svelte', 'packages/ui/src/report-letters.ts'],
  newTestFiles: ['packages/ui/src/__tests__/crafting-view.test.ts', 'tests/e2e/crafting.spec.ts'],
  goldenFixturePinChanges: [],
  noOtherExistingTestEdits: true,
  noOtherOutsideAllowlistEdits: true,
};
writeFileSync(join(root, 'step0-proposed-edits.json'), JSON.stringify(proposal, null, 2) + '\n', 'utf8');
const md = [
  '# PR C Step 0 — exact proposed edits', '',
  `Base: \`${base}\`. Status: **PROPOSED — HOLD**. No edit below has been applied.`, '',
  'Three existing e2e-helper edits (one file) and three product lines outside the original allowlist (two files). P3 is one contiguous insertion anchored by its exact two-line before block. Line numbers are at the base commit. All other bytes in these three files stay unchanged.', '',
];
for (const [title, entries] of [['Existing test/helper edits', proposal.existingTestEdits], ['Outside-allowlist product edits', proposal.outsideAllowlistEdits]]) {
  md.push(`## ${title}`, '');
  for (const e of entries) md.push(`### ${e.id} — ${e.path}:${e.line} (${e.task})`, '', e.why, '', '**Before**', '', '```ts', e.before, '```', '', '**After**', '', '```ts', e.after, '```', '');
}
md.push('## Unchanged paths and tests', '', 'No golden, fixture, catalog, recipe, hash pin, assertion value, timeout or accessibility threshold changes. The final verifier checks every existing test file plus this helper, all three exact extra product lines, the path allowlist and all 86 immutable paths.', '', '## Owner decision', '', 'Approve or reject P1–P3 and X1–X3 as written. An approval must identify this proposal file by SHA256. If implementation later needs another existing-test edit or extra path, stop and issue a new HOLD.', '');
writeFileSync(join(root, 'step0-proposed-edits.md'), md.join('\n'), 'utf8');
console.log(JSON.stringify({ base, existingTestEdits: proposal.existingTestEdits.map(({id,path,line,task})=>({id,path,line,task})), outsideAllowlistEdits: proposal.outsideAllowlistEdits.map(({id,path,line,task})=>({id,path,line,task})) }, null, 2));
