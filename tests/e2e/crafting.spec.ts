import { test, expect, type Page } from '@playwright/test';
import { ITEM_CATALOG, ITEM_TRIAL, type CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { makeLife, importLife, exportLife, go, selectPerson, selectArea, keyActivate, tabTo, expectOneCharacterWindow } from './character-life-navigation.helpers.ts';

function act(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const r = executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
  if (!r.success) throw Error(`${type}: ${r.error.code} ${r.error.message}`);
  return r.next;
}
function supplied(buildSmithy = true) {
  const s = makeLife(42), stock = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  Object.assign(stock, { gold: 1000000, food: 1000000, wood: 1000000, iron: 1000000 });
  s.city.society!.classes.free = 37; s.city.society!.classes.makers.common = 30; s.city.society!.classes.luminaries.common = 20;
  s.city.society!.stocksMilli.herbs = 10000;
  s.city.tiles.find(t => t.id === 'service-1')!.building = { typeId: 'hospital', level: 1, workers: 2, enabled: true };
  s.city.tiles.find(t => t.id === 'slum-1')!.building = { typeId: 'drug-store', level: 1, workers: 0, enabled: true };
  if (buildSmithy) s.city.tiles.find(t => t.id === 'spec-2')!.building = { typeId: 'smithy', level: 1, workers: 1, enabled: true };
  const items = s.city.society!.items;
  items.materials = { iron: 12, nitrate: 2, 'green-leaf': 6 };
  items.inventory.push({ id: items.nextItemId++, defId: 'common-ring' });
  return s;
}
const smithy = (page: Page) => page.getByRole('region', { name: 'Smithy workshop', exact: true });
const recipe = (page: Page, id: string) => page.locator(`[data-craft-recipe="${id}"]`);
async function selectPlot(page: Page, id: string) { await go(page, 'city'); await page.getByRole('button', { name: `Select ${id}`, exact: true }).click(); }
async function place(page: Page, id: string) { await recipe(page, id).getByRole('button', { name: /^Place / }).click(); }

test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1280, height: 900 }); await page.goto('/?mode=world-life'); });

test('C1 1280 builds a Smithy, refines 2 Iron, upgrades a Player ring, cancels, brews and receives outputs', async ({ page }) => {
  let s = supplied(false); s.npcs[0].character.skills.technical = 80;
  await importLife(page, s); await selectPlot(page, 'spec-2');
  await page.getByLabel('Building type', { exact: true }).selectOption('smithy');
  await page.getByRole('region', { name: 'Manage tile', exact: true }).getByRole('button', { name: 'Build', exact: true }).click();
  s = act(s, 'BUILD', { tileId: 'spec-2', typeId: 'smithy' });
  await expect(smithy(page)).toBeVisible();
  await page.getByLabel('Assigned workers (WF)', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click(); s = act(s, 'SET_WORKERS', { tileId: 'spec-2', workers: 1 });
  await selectPerson(page, s.npcs[0].character.id); const work = await selectArea(page, 'Work');
  await work.getByLabel(`Manager post for ${s.npcs[0].character.name}`, { exact: true }).selectOption('spec-2');
  await work.getByRole('button', { name: 'Assign', exact: true }).click(); s = act(s, 'ASSIGN_NPC', { npcId: s.npcs[0].character.id, tileId: 'spec-2' });
  await selectPlot(page, 'spec-2');
  await expect(smithy(page).getByRole('heading', { name: 'Refine', exact: true })).toBeVisible();
  await expect(smithy(page).getByRole('heading', { name: 'Upgrade', exact: true })).toBeVisible();
  await expect(recipe(page, 'upgrade-rare-ring-player').getByRole('article')).toHaveCount(2);
  await expect(recipe(page, 'upgrade-rare-ring-player')).toContainText('Before → After');
  await expect(recipe(page, 'refine-silver')).toContainText('2 Iron');
  await expect(recipe(page, 'refine-silver')).toContainText('Fee: 1 Gold');
  await expect(smithy(page).locator('input')).toHaveCount(0);
  await place(page, 'refine-silver'); s = act(s, 'PLACE_CRAFT_ORDER', { tileId: 'spec-2', recipeId: 'refine-silver' });
  await place(page, 'upgrade-rare-ring-player'); s = act(s, 'PLACE_CRAFT_ORDER', { tileId: 'spec-2', recipeId: 'upgrade-rare-ring-player', itemId: 1 });
  await expect(smithy(page)).toContainText('2 of 3 this week');
  await place(page, 'refine-silver'); s = act(s, 'PLACE_CRAFT_ORDER', { tileId: 'spec-2', recipeId: 'refine-silver' });
  await smithy(page).getByRole('button', { name: 'Cancel order 3', exact: true }).click(); s = act(s, 'CANCEL_CRAFT_ORDER', { tileId: 'spec-2', index: 2 });
  await selectPlot(page, 'service-1'); await page.getByRole('tab', { name: 'Brew', exact: true }).click();
  await place(page, 'brew-heal-potion-1'); s = act(s, 'PLACE_CRAFT_ORDER', { tileId: 'service-1', recipeId: 'brew-heal-potion-1' });
  expect(await exportLife(page)).toEqual(s);
  const result = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: s.city.world.week });
  if (!result.success || !result.report) throw Error('End Week');
  expect(result.report.items.crafted?.map(c => c.output).sort()).toEqual(['heal-potion-1', 'rare-ring-player', 'silver']);
  await page.getByTestId('life-end-week').click();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  const expected = act(result.next, 'NEXT_WEEK'); expect(await exportLife(page)).toEqual(expected);
  await selectPerson(page, 'player'); const inventory = await selectArea(page, 'Inventory');
  await expect(inventory.getByRole('article', { name: ITEM_CATALOG['rare-ring-player'].name, exact: true })).toBeVisible();
  await inventory.getByRole('button', { name: 'Materials', exact: true }).click();
  await expect(inventory.getByRole('row', { name: 'Silver Rare 1', exact: true })).toBeVisible();
  await selectPlot(page, 'service-1');
  await expect(page.getByRole('region', { name: 'Potion inventory', exact: true })).toContainText('Heal Potion I');
});

test('C1 keyboard Place and Cancel keep surviving focus, and hidden Brew never enters Characters tab order', async ({ page }) => {
  const s = supplied(); s.city.society!.items.materials.iron = 2;
  await importLife(page, s); await selectPlot(page, 'spec-2');
  await keyActivate(page, recipe(page, 'refine-silver').getByRole('button', { name: /^Place / }));
  await expect(recipe(page, 'refine-silver')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.isConnected && document.activeElement?.tagName === 'BUTTON')).toBe(true);
  const cancel = smithy(page).getByRole('button', { name: 'Cancel order 1', exact: true });
  await keyActivate(page, cancel); await expect(cancel).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.isConnected && document.activeElement?.tagName === 'BUTTON')).toBe(true);
  await expect(recipe(page, 'refine-silver').getByRole('button', { name: /^Place / })).toBeVisible();
  await selectPlot(page, 'service-1'); await tabTo(page, page.getByRole('tab', { name: 'Buy', exact: true }));
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Brew', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tabpanel', { name: 'Brew', exact: true })).toBeVisible();
  await selectPerson(page, 'player'); await expectOneCharacterWindow(page);
  for (let i = 0; i < 35; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('[hidden], [aria-hidden="true"]'))).toBe(false); }
});

test('C1 Hospital and Drug Store Brew tabs permit unstaffed orders and preserve the default Buy path', async ({ page }) => {
  let s = supplied(); s.city.tiles.find(t => t.id === 'service-1')!.building!.workers = 0; s.city.society!.stocksMilli.herbs = 0;
  await importLife(page, s);
  for (const [tileId, region] of [['service-1', 'Hospital brewing'], ['slum-1', 'Drug Store brewing']]) {
    await selectPlot(page, tileId);
    await expect(page.getByRole('tab', { name: 'Buy', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Brew', exact: true }).click();
    await expect(page.getByRole('region', { name: region, exact: true })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Brew', exact: true }).locator('input')).toHaveCount(0);
    await place(page, 'brew-heal-potion-1'); s = act(s, 'PLACE_CRAFT_ORDER', { tileId, recipeId: 'brew-heal-potion-1' });
  }
  expect(await exportLife(page)).toEqual(s);
});

test('C1 queue holds inputs/Gold, shows ready outputs, and failed cancel stays atomic with a panel error', async ({ page }) => {
  let s = act(supplied(), 'PLACE_CRAFT_ORDER', { tileId: 'spec-2', recipeId: 'upgrade-rare-ring-player', itemId: 1 });
  const items = s.city.society!.items;
  for (let i = 0; i < ITEM_TRIAL.inventoryCap; i++) items.inventory.push({ id: items.nextItemId++, defId: 'common-weapon' });
  items.workshops!['spec-2'].ready = [{ item: { id: items.nextItemId++, defId: 'rare-ring-player' } }, { material: 'silver', count: 1 }];
  await importLife(page, s); await selectPlot(page, 'spec-2');
  await expect(smithy(page)).toContainText('Ready outputs · Waiting for room');
  await expect(smithy(page).getByTestId('workshop-ready')).toContainText(ITEM_CATALOG['rare-ring-player'].name);
  await expect(smithy(page).getByTestId('workshop-ready')).toContainText('1 Silver');
  await expect(smithy(page)).toContainText('Held fee: 3 Gold');
  await smithy(page).getByRole('button', { name: 'Cancel order 1', exact: true }).click();
  await expect(smithy(page).getByRole('alert')).toHaveText('There is no room in the inventory.');
  expect(await exportLife(page)).toEqual(s);
});
