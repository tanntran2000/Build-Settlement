import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const KEY = 'haven.tile-trial.checkpoint.v1';
const region = (page: Page) => page.getByRole('region', { name: 'Planning checkpoints', exact: true });
const slot = (page: Page) => page.evaluate(key => localStorage.getItem(key), KEY);
const setSlot = (page: Page, text: string) => page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, text]);
const saveLocally = (page: Page) => page.getByRole('button', { name: 'Save locally', exact: true }).click();
const continueLocally = (page: Page) => page.getByRole('button', { name: 'Continue locally', exact: true }).click();
const gold = (page: Page) => page.getByTestId('trial-stock-gold');
// Lets delayed reads and Svelte updates settle before asserting that nothing changed.
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));

async function checkpoint(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  return readFile((await (await download).path())!, 'utf8');
}
async function importText(page: Page, text: string) {
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'checkpoint.json', mimeType: 'application/json', buffer: Buffer.from(text) });
}
async function build(page: Page, id: string, type: string, workers?: number) {
  await page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
  await page.getByLabel('Building type').selectOption(type);
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  if (workers !== undefined) {
    await page.getByLabel('Assigned workers (WF)').fill(String(workers));
    await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  }
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
}
async function delayReads(page: Page) {
  await page.evaluate(() => {
    const original = File.prototype.text;
    (window as unknown as { releaseReads: (() => void)[] }).releaseReads = [];
    File.prototype.text = async function () {
      const text = await original.call(this);
      await new Promise<void>(resolve => (window as unknown as { releaseReads: (() => void)[] }).releaseReads.push(resolve));
      return text;
    };
  });
}
const pending = (page: Page, n: number) => page.waitForFunction(n => (window as unknown as { releaseReads: unknown[] }).releaseReads.length === n, n);
const release = (page: Page, n: number) => page.evaluate(n => (window as unknown as { releaseReads: (() => void)[] }).releaseReads[n](), n);

test('saves a multiweek plan locally, continues after reload and resumes the same economics', async ({ page }) => {
  await page.goto('/?mode=tiles'); expect(await slot(page)).toBeNull();
  await build(page, 'forest-1', 'logging', 2); await build(page, 'ore-1', 'mine', 1);
  await build(page, 'plain-2', 'workshop', 1); await build(page, 'plain-3', 'market');
  await next(page); await page.getByRole('button', { name: 'Upgrade', exact: true }).click(); await next(page);
  await page.getByLabel('Building type').selectOption('processor');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByRole('button', { name: 'Select forest-1', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await saveLocally(page); await expect(region(page).getByRole('status')).toHaveText('Saved in this browser.');
  const text = (await slot(page))!, save = JSON.parse(text);
  expect(save).toMatchObject({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-trial-01', state: { phase: 'planning', world: { week: 3 } } });
  expect(await checkpoint(page)).toBe(text);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  const stocks = (await page.getByTestId('trial-stocks').textContent())!, goods = (await page.getByTestId('trial-goods').textContent())!;
  await expect(page.getByRole('button', { name: 'Save locally', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Continue locally', exact: true })).toBeDisabled();

  await page.reload(); await expect(gold(page)).toHaveText('30'); expect(await slot(page)).toBe(text);
  await build(page, 'forest-1', 'logging'); await next(page); expect(await slot(page)).toBe(text);
  await continueLocally(page); await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toHaveCount(0);
  await expect(page.locator('header')).toContainText('Week 3 · Planning');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Paused');
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Food Processor');
  await expect(page.getByTestId('trial-tile-ore-1')).toContainText('1 WF');
  const restored = JSON.parse(await checkpoint(page));
  expect(restored.state.world).toEqual(save.state.world); expect(restored.state.tiles).toEqual(save.state.tiles);
  expect(restored.state.happiness).toEqual(save.state.happiness); expect(restored.state.revision).toBeGreaterThan(save.state.revision);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-stocks')).toHaveText(stocks);
  await expect(page.getByTestId('trial-goods')).toHaveText(goods);
  expect(await slot(page)).toBe(text);
});

test('explicit save replaces the slot, even an invalid one, and file import never writes it', async ({ page }) => {
  await page.goto('/?mode=tiles'); await setSlot(page, '{broken');
  await saveLocally(page); await expect(region(page).getByRole('status')).toHaveText('Saved in this browser. Replaced the previous local checkpoint.');
  const first = (await slot(page))!; expect(await checkpoint(page)).toBe(first);
  await build(page, 'forest-1', 'logging'); await importText(page, first);
  await expect(region(page).getByRole('status')).toContainText('Checkpoint imported'); expect(await slot(page)).toBe(first);
  await build(page, 'forest-1', 'logging'); await saveLocally(page);
  await expect(region(page).getByRole('status')).toContainText('Replaced the previous local checkpoint');
  expect(JSON.parse((await slot(page))!).state.tiles.find((t: { id: string }) => t.id === 'forest-1').building.typeId).toBe('logging');
});

test('missing, invalid and incompatible slots preserve the game and the stored bytes', async ({ page }) => {
  await page.goto('/?mode=tiles'); await build(page, 'forest-1', 'logging');
  await continueLocally(page); await expect(region(page).getByRole('alert')).toContainText('No local checkpoint');
  await expect(gold(page)).toHaveText('28'); expect(await slot(page)).toBeNull();
  const valid = JSON.parse(await checkpoint(page)), variant = (change: (save: typeof valid) => void) => { const save = structuredClone(valid); change(save); return JSON.stringify(save); };
  for (const text of [
    '{', '{}', variant(s => { s.schemaVersion = 2; }), variant(s => { s.rulesetId = 'future'; }), variant(s => { s.state.tiles[0].terrain = 'ore'; }),
    variant(s => { s.state.world.settlements.settlement_haven_01.inventory.gold = -1; }), variant(s => { s.state.phase = 'report'; }), ' '.repeat(1024 * 1024 + 1),
  ]) {
    await setSlot(page, text); await continueLocally(page);
    await expect(region(page).getByRole('alert')).toContainText('left unchanged');
    await expect(gold(page)).toHaveText('28'); await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Logging Camp');
    await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeEnabled();
    expect(await slot(page) === text).toBe(true);
  }
});

test('blocked or full storage keeps the game, the previous checkpoint and file backups usable', async ({ page }) => {
  await page.goto('/?mode=tiles'); await saveLocally(page); const prior = (await slot(page))!;
  await build(page, 'forest-1', 'logging');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('raw/private/error', 'QuotaExceededError'); }; });
  await saveLocally(page); await expect(region(page).getByRole('alert')).toContainText('Could not save in this browser');
  await expect(gold(page)).toHaveText('28'); expect(await slot(page)).toBe(prior);
  await page.evaluate(() => { Storage.prototype.getItem = () => { throw new DOMException('raw/private/error', 'SecurityError'); }; });
  await continueLocally(page); await expect(region(page).getByRole('alert')).toContainText('Could not read browser storage');
  await expect(gold(page)).toHaveText('28');
  await page.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('raw/private/error', 'SecurityError'); } }));
  await saveLocally(page); await expect(region(page).getByRole('alert')).toContainText('Use Export checkpoint');
  await continueLocally(page); await expect(region(page).getByRole('alert')).toContainText('Use Import checkpoint');
  await expect(gold(page)).toHaveText('28'); await expect(page.getByText('raw/private/error', { exact: false })).toHaveCount(0);
  const backup = await checkpoint(page); await next(page);
  await importText(page, backup); await expect(region(page).getByRole('status')).toContainText('Checkpoint imported');
  await expect(gold(page)).toHaveText('28');

  await page.reload(); expect(await slot(page)).toBe(prior);
  const logger = await page.evaluate(() => localStorage.getItem('haven.runtime-errors.v1'));
  expect(logger ?? '').not.toContain('haven.tile-trial.save');
  await continueLocally(page); await expect(region(page).getByRole('status')).toContainText('Local checkpoint loaded');
});

test('population mode never shows, reads or writes the legacy local slot', async ({ page }) => {
  await page.goto('/?mode=tiles'); await saveLocally(page); const legacy = (await slot(page))!;
  await page.goto('/?mode=population');
  await expect(page.getByRole('heading', { name: 'Population Trial', exact: true })).toBeVisible();
  await expect(region(page).getByRole('button', { name: 'Save locally' })).toHaveCount(0);
  await expect(region(page).getByRole('button', { name: 'Continue locally' })).toHaveCount(0);
  await build(page, 'forest-1', 'logging'); await next(page);
  const population = await checkpoint(page); expect(JSON.parse(population).rulesetId).toBe('tile-population-01');
  await importText(page, population); await expect(region(page).getByRole('status')).toContainText('Checkpoint imported');
  expect(await slot(page)).toBe(legacy);
  await page.goto('/?mode=tiles'); await continueLocally(page);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await expect(page.locator('header')).toContainText('Week 1 · Planning'); await expect(gold(page)).toHaveText('30');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-immigration')).toHaveCount(0);
});

test('a delayed file import cannot overwrite a successful Continue', async ({ page }) => {
  await page.goto('/?mode=tiles'); await saveLocally(page);
  const other = JSON.parse(await checkpoint(page)); other.state.world.settlements.settlement_haven_01.inventory.gold = 41000;
  await build(page, 'forest-1', 'logging'); await delayReads(page);
  await importText(page, JSON.stringify(other)); await pending(page, 1);
  await continueLocally(page); await expect(gold(page)).toHaveText('30');
  await release(page, 0); await settle(page);
  await expect(gold(page)).toHaveText('30'); await expect(region(page).getByRole('alert')).toHaveCount(0);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await importText(page, '{bad'); await pending(page, 2);
  await continueLocally(page); await release(page, 1); await settle(page);
  await expect(region(page).getByRole('alert')).toHaveCount(0);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
});
