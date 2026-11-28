import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { exportLife, go, importLife, keyActivate, keyPost, makeLife, makeLifeWithNpcs } from './character-life-navigation.helpers.ts';
import { readStoredRecords, storedSaveText } from './storage.helpers.ts';

const fixtures = new URL('../../packages/persistence/src/__tests__/fixtures/', import.meta.url);
const file = (path: string) => readFile(new URL(path, fixtures));
const oldMessage = 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
const damagedMessage = 'This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.';
const upload = (page: Page, buffer: Buffer) => page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'mansion.json', mimeType: 'application/json', buffer });

async function selectHome(page: Page, id: string) {
  await keyActivate(page, page.getByTestId('trial-tile-' + id));
}

for (const width of [1280, 1600]) {
  test('builds and upgrades rooms and moves residents by keyboard at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = makeLifeWithNpcs(42), { id, name } = state.npcs[0].character;
    await page.goto('/');
    await importLife(page, state);
    await go(page, 'city');
    await selectHome(page, 'estate-1');
    const rooms = page.getByRole('region', { name: 'Mansion rooms' });
    await expect(rooms.getByRole('heading', { name: 'Master Suite · Level 1' })).toBeVisible();
    await expect(rooms.getByRole('heading', { name: 'Throne Room · Level 1' })).toBeVisible();
    const types = rooms.getByLabel('Build room type'), build = rooms.getByRole('button', { name: 'Build room', exact: true });
    await keyPost(page, types, 'guard-quarters');
    await expect(build).toBeDisabled();
    await expect(build).toHaveAccessibleDescription('Needs Mansion level 2');
    await keyPost(page, types, 'maids-quarters');
    await keyActivate(page, build);
    await keyPost(page, types, 'bedroom');
    await keyActivate(page, build);
    const bedrooms = rooms.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Bedrooms · Level 1', exact: true }) });
    await expect(bedrooms.getByText('2 Gold · 0.5 Wood · 0.2 Iron')).toBeVisible();
    await keyActivate(page, bedrooms.getByRole('button', { name: 'Upgrade Bedrooms' }));
    await expect(rooms.getByRole('heading', { name: 'Bedrooms · Level 2' })).toBeVisible();
    await selectHome(page, 'estate-2');
    const home = page.getByRole('region', { name: 'Home residents' });
    const resident = home.getByRole('listitem').filter({ hasText: name });
    const move = resident.getByRole('button', { name: 'Move', exact: true });
    await keyPost(page, resident.getByLabel('Destination for ' + name), 'estate-1');
    await expect(move).toHaveAccessibleDescription('Choose a Mansion room.');
    await keyPost(page, resident.getByLabel('Room for ' + name), 'room-3');
    await keyActivate(page, move);
    await selectHome(page, 'estate-1');
    await expect(rooms.getByText('Beds used: 1 / 10', { exact: true })).toBeVisible();
    await keyPost(page, rooms.getByLabel('Move to room for ' + name), 'room-4');
    await keyActivate(page, rooms.getByRole('button', { name: 'Move ' + name + ' to room', exact: true }));
    await expect(rooms.getByText('Beds used: 1 / 1', { exact: true })).toBeVisible();
    expect((await exportLife(page)).npcs.find(npc => npc.character.id === id)?.household.room).toBe('room-4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('imports a real v14 file at the title and opens the existing Report from the Throne Room', async ({ page }) => {
  await page.goto('/');
  await upload(page, await file('society-v14/life-demand-card.json'));
  await expect(page.getByTestId('life-shell')).toBeVisible();
  await go(page, 'city');
  await selectHome(page, 'estate-1');
  const rooms = page.getByRole('region', { name: 'Mansion rooms' });
  await expect(rooms.getByRole('heading', { name: 'Master Suite · Level 1' })).toBeVisible();
  await keyActivate(page, rooms.getByRole('button', { name: 'Open Report' }));
  await expect(page.locator('#life-nav-report')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#life-reports-heading')).toBeFocused();
  expect((await exportLife(page)).city.society?.rulesetId).toBe('tile-society-15');
});

test('keeps both checkpoint copies when a v14 upgrade fails or a v15 file is damaged', async ({ page }) => {
  const earlier = JSON.parse((await file('society-v14/life-new-game.json')).toString('utf8'));
  earlier.state.player.purse.moneyMilli = -1;
  const current = JSON.parse((await file('society-v15/life-new-game.json')).toString('utf8'));
  current.state.player.needs.lust = 101;
  const invalid = [[earlier, oldMessage], [current, damagedMessage]] as const;
  await page.goto('/');
  for (const [bad, message] of invalid) {
    await upload(page, Buffer.from(JSON.stringify(bad)));
    await expect(page.getByRole('alert')).toHaveText(message);
  }
  await importLife(page, makeLife(40));
  await go(page, 'session');
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Saved in this browser.');
  const oldRows = await readStoredRecords(page), oldText = await storedSaveText(page), before = await exportLife(page);
  for (const [bad, message] of invalid) {
    await go(page, 'session');
    await upload(page, Buffer.from(JSON.stringify(bad)));
    await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]')).toHaveText(message);
    expect(await readStoredRecords(page)).toEqual(oldRows);
    expect(await storedSaveText(page)).toBe(oldText);
    expect(await exportLife(page)).toEqual(before);
  }
});
