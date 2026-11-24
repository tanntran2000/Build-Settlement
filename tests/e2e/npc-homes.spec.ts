import { expect, test, type Locator } from '@playwright/test';
import { withNpcs } from '../../packages/core/src/__tests__/helpers/npcs.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { BROWSER_NPC_KEYS, characterWindow, exportLife, go, importLife, keyActivate, keyPost, makeLife, selectArea, selectPerson } from './character-life-navigation.helpers.ts';

for (const width of [1280, 1600]) test(`homes show capacity and a keyboard Move clears the city post at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const initial = withNpcs(makeLife(), [BROWSER_NPC_KEYS[0]]);
  const { id, name } = initial.npcs[0].character;
  const assigned = executeCharacterLifeCommand(initial, { type: 'ASSIGN_NPC', npcId: id, tileId: 'field-1', expectedRevision: initial.city.revision });
  if (!assigned.success) throw Error(assigned.error.message);
  await page.goto('/'); await importLife(page, assigned.next);
  const manage = page.getByRole('region', { name: 'Manage tile', exact: true });
  const home = manage.getByRole('region', { name: 'Home residents', exact: true });
  const selectHome = async (tileId: string) => keyActivate(page, page.getByTestId(`trial-tile-${tileId}`));
  const destination = home.getByLabel(`Destination for ${name}`, { exact: true });
  const move = home.getByRole('button', { name: 'Move', exact: true });
  const count = async (text: string) => expect(home.getByText(text, { exact: true })).toBeVisible();

  await selectHome('estate-1');
  await count('Beds used: 0 / 10');
  await count('No residents.');
  await expect(move).toHaveCount(0);

  await selectHome('estate-2');
  await count('Beds used: 1 / 25');
  await expect(home.getByRole('listitem')).toHaveCount(1);
  await expect(home.getByText(name, { exact: true })).toBeVisible();
  await expect(move).toBeDisabled();
  await expect(move).toHaveAccessibleDescription('Choose a destination home.');
  await expect(destination.locator('option')).toHaveText(['Choose a destination home', 'Mansion (estate-1)']);
  await keyPost(page, destination, 'estate-1');
  await keyActivate(page, move);
  await expect(manage.getByRole('heading').first()).toBeFocused();
  await count('Beds used: 0 / 25');
  await count('No residents.');

  const expected = executeCharacterLifeCommand(assigned.next, { type: 'MOVE_NPC_HOME', npcId: id, homeTileId: 'estate-1', expectedRevision: assigned.next.city.revision });
  if (!expected.success) throw Error(expected.error.message);
  const moved = await exportLife(page);
  expect(moved).toStrictEqual(expected.next);
  expect(moved.npcs[0].household.home).toBe('estate-1');
  expect(moved.npcs[0].postTileId).toBeNull();
  await selectPerson(page, id); await selectArea(page, 'Work');
  await expect(characterWindow(page).getByText("Only Retainers' Hall residents can hold a city post.", { exact: true })).toBeVisible();
  await expect(characterWindow(page).getByRole('button', { name: 'Assign', exact: true })).toHaveCount(0);

  await go(page, 'city'); await selectHome('estate-1');
  await count('Beds used: 1 / 10');
  await expect(home.getByText(name, { exact: true })).toBeVisible();
  const endWeek: Locator = page.getByTestId('life-end-week');
  await keyActivate(page, endWeek); await go(page, 'city');
  await expect(destination).toBeDisabled();
  await expect(move).toBeDisabled();
  await expect(move).toHaveAccessibleDescription('Plan next week to move residents.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
