import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const KEY = 'haven.world-npc-session.checkpoint.v1';
const WORLD_KEY = 'haven.world-session.checkpoint.v1';
const IDS = ['npc_starter_1', 'npc_starter_2', 'npc_starter_3'];
const panel = (page: Page) => page.getByRole('region', { name: 'NPCs', exact: true });
const card = (page: Page, id: string) => page.getByTestId(`npc-${id}`);
const post = (page: Page, id: string) => page.getByTestId(`npc-post-${id}`);
const controls = (page: Page) => page.getByRole('region', { name: 'Planning checkpoints', exact: true });
const names = (page: Page) => Promise.all(IDS.map(id => card(page, id).getByRole('heading').innerText()));
async function assign(page: Page, id: string, tileId: string) {
  await card(page, id).getByLabel('Manager post', { exact: false }).selectOption(tileId);
  await card(page, id).getByRole('button', { name: 'Assign', exact: true }).click();
}
async function checkpoint(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const file = await download; expect(file.suggestedFilename()).toMatch(/^haven-world-npc-week-\d+\.json$/);
  return readFile((await file.path())!, 'utf8');
}
const importText = (page: Page, text: string) => page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'npc.json', mimeType: 'application/json', buffer: Buffer.from(text) });
async function pinSeed(page: Page, seed: number) {
  await page.addInitScript(seed => {
    Object.defineProperty(crypto, 'getRandomValues', { value: (array: Uint32Array) => { array[0] = seed; return array; } });
  }, seed);
}

test('New Game lists 3 named starters, all unassigned, with stats, traits and disabled-effect labels', async ({ page }) => {
  await page.goto('/?mode=world-npc');
  await expect(page.getByRole('heading', { name: 'World Session', exact: true })).toBeVisible();
  const text = await panel(page).innerText();
  expect(text).toContain('NPC effects on output are not active yet.');
  expect(text).toContain('PROVISIONAL');
  const n = await names(page);
  expect(new Set(n).size).toBe(3); n.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+$/));
  for (const id of IDS) await expect(post(page, id)).toHaveText('Post: Unassigned');
  await expect(card(page, 'npc_starter_1')).toContainText('Technical 65');
  await expect(card(page, 'npc_starter_1')).toContainText('Frugal');
  await expect(card(page, 'npc_starter_1')).toContainText('effect not active yet');
  await expect(card(page, 'npc_starter_2')).toContainText('Health 85');
  await card(page, 'npc_starter_2').getByText('Relationship to you', { exact: true }).click();
  await expect(card(page, 'npc_starter_2').getByRole('meter', { name: 'Trust' })).toHaveAttribute('aria-valuenow', '30');
  await expect(panel(page).getByRole('link', { name: 'World Session without NPCs' })).toHaveAttribute('href', '/?mode=world');
});

test('same pinned seed reproduces names; clicks never reroll them', async ({ page }) => {
  await pinSeed(page, 12345);
  await page.goto('/?mode=world-npc'); const first = await names(page);
  await page.reload(); expect(await names(page)).toEqual(first);
  await assign(page, 'npc_starter_1', 'field-1');
  await card(page, 'npc_starter_1').getByRole('button', { name: 'Unassign', exact: true }).click();
  await page.getByTestId('trial-tile-plain-1').click();
  expect(await names(page)).toEqual(first);
});

test('only built manager tiles are offered; a low-stat starter can take the Farm slot', async ({ page }) => {
  await page.goto('/?mode=world-npc');
  const options = await card(page, 'npc_starter_3').getByLabel('Manager post', { exact: false }).locator('option').allInnerTexts();
  expect(options).toEqual(['Manager — Farm (field-1)', 'Manager — Food Processor (plain-1)']);
  await assign(page, 'npc_starter_3', 'field-1');
  await expect(post(page, 'npc_starter_3')).toHaveText('Post: Manager — Farm (field-1)');
  await expect(card(page, 'npc_starter_1').getByLabel('Manager post', { exact: false }).locator('option')).toHaveText(['Manager — Food Processor (plain-1)']);
  for (const id of ['npc_starter_1', 'npc_starter_2']) await expect(post(page, id)).toHaveText('Post: Unassigned');
});

test('pause keeps the post; replacing the building clears it', async ({ page }) => {
  await page.goto('/?mode=world-npc');
  await assign(page, 'npc_starter_2', 'plain-1');
  await page.getByTestId('trial-tile-plain-1').click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(post(page, 'npc_starter_2')).toHaveText('Post: Manager — Food Processor (plain-1)');
  await page.getByLabel('Building type', { exact: true }).selectOption('market');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await expect(page.getByTestId('trial-tile-plain-1')).toContainText('Market');
  await expect(post(page, 'npc_starter_2')).toHaveText('Post: Unassigned');
});

test('assignment is refused in Report and kept through the week', async ({ page }) => {
  await page.goto('/?mode=world-npc');
  await assign(page, 'npc_starter_1', 'field-1');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(card(page, 'npc_starter_1').getByRole('button', { name: 'Unassign', exact: true })).toBeDisabled();
  await expect(card(page, 'npc_starter_2').getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await expect(post(page, 'npc_starter_1')).toHaveText('Post: Manager — Farm (field-1)');
});

test('save, continue, export and import preserve posts and resolved names; slots stay separate', async ({ page }) => {
  await page.goto('/?mode=world-npc');
  await page.evaluate(k => localStorage.setItem(k, 'world-v1-bytes'), WORLD_KEY);
  await assign(page, 'npc_starter_1', 'field-1'); const n = await names(page);
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  const exported = await checkpoint(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
  await expect(controls(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  expect(await names(page)).toEqual(n);
  await expect(post(page, 'npc_starter_1')).toHaveText('Post: Manager — Farm (field-1)');
  await page.reload(); await importText(page, exported);
  await expect(controls(page).getByRole('status')).toHaveText('Checkpoint imported. Planning restored.');
  expect(await names(page)).toEqual(n);
  await expect(post(page, 'npc_starter_1')).toHaveText('Post: Manager — Farm (field-1)');
  expect(await page.evaluate(k => localStorage.getItem(k), WORLD_KEY)).toBe('world-v1-bytes');
});

test('cross-loading is rejected in both directions without changing either slot', async ({ page }) => {
  await page.goto('/?mode=world');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const worldText = await readFile((await (await download).path())!, 'utf8');
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await page.goto('/?mode=world-npc'); const npcText = await checkpoint(page);
  const before = await panel(page).innerText();
  await importText(page, worldText);
  await expect(controls(page).getByRole('alert')).toContainText('Not an NPC world checkpoint');
  expect(await panel(page).innerText()).toBe(before);
  await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
  await expect(controls(page).getByRole('alert')).toContainText('No local checkpoint');
  await page.evaluate(([k, t]) => localStorage.setItem(k, t), [KEY, worldText]);
  await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
  await expect(controls(page).getByRole('alert')).toContainText('left unchanged');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe(worldText);
  await page.goto('/?mode=world');
  await importText(page, npcText);
  await expect(controls(page).getByRole('alert')).toContainText('Unsupported world checkpoint format');
  await expect(page.getByRole('region', { name: 'NPCs', exact: true })).toHaveCount(0);
});
