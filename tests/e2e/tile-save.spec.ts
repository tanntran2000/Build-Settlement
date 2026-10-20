import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function checkpoint(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const d = await download;
  return readFile((await d.path())!, 'utf8');
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

test('exports a real file, restores a multiweek plan and resumes the same economics', async ({ page }) => {
  await page.goto('/?mode=tiles');
  await build(page, 'forest-1', 'logging', 2); await build(page, 'ore-1', 'mine', 1);
  await build(page, 'plain-2', 'workshop', 1); await build(page, 'plain-3', 'market');
  await next(page); await page.getByRole('button', { name: 'Upgrade', exact: true }).click(); await next(page);
  await page.getByLabel('Building type').selectOption('processor');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByRole('button', { name: 'Select forest-1', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const text = await checkpoint(page), save = JSON.parse(text);
  expect(save).toMatchObject({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-trial-01', state: { phase: 'planning', world: { week: 3 } } });
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  const stocks = (await page.getByTestId('trial-stocks').textContent())!, goods = (await page.getByTestId('trial-goods').textContent())!;
  await expect(page.getByRole('button', { name: 'Export checkpoint', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Import checkpoint', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await importText(page, text); await expect(page.getByRole('status')).toContainText('Checkpoint imported');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Paused');
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Food Processor');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-stocks')).toHaveText(stocks);
  await expect(page.getByTestId('trial-goods')).toHaveText(goods);
  await page.reload(); await expect(page.getByTestId('trial-stock-gold')).toHaveText('30');
  await importText(page, text); await expect(page.getByRole('status')).toContainText('Checkpoint imported');
  const exportedAgain = JSON.parse(await checkpoint(page));
  expect(exportedAgain.state.world).toEqual(save.state.world);
  expect(exportedAgain.state.tiles).toEqual(save.state.tiles);
  expect(exportedAgain.state.happiness).toEqual(save.state.happiness);
  expect(exportedAgain.state.revision).toBeGreaterThan(save.state.revision);
});

test('invalid, incompatible, report and oversized files preserve the plan', async ({ page }) => {
  await page.goto('/?mode=tiles'); const valid = JSON.parse(await checkpoint(page));
  const badStock = structuredClone(valid); badStock.state.world.settlements.settlement_haven_01.inventory.gold = -1;
  const report = structuredClone(valid); report.state.phase = 'report';
  for (const text of ['{', '{}', JSON.stringify({ ...valid, rulesetId: 'future' }), JSON.stringify(badStock), JSON.stringify(report), ' '.repeat(1024 * 1024 + 1)]) {
    await importText(page, text); await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByTestId('trial-stock-gold')).toHaveText('30');
    await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeEnabled();
  }
});

test('a delayed import cannot overwrite gameplay that advanced while reading', async ({ page }) => {
  await page.goto('/?mode=tiles'); const text = await checkpoint(page); await delayReads(page);
  await importText(page, text); await pending(page, 1);
  await build(page, 'forest-1', 'logging'); await release(page, 0);
  await expect(page.getByRole('alert').first()).toContainText('plan changed');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('28');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Logging Camp');
});

test('the latest selected import wins even when an older read completes last', async ({ page }) => {
  await page.goto('/?mode=tiles'); const a = JSON.parse(await checkpoint(page)), b = structuredClone(a);
  a.state.world.settlements.settlement_haven_01.inventory.gold = 41000;
  b.state.world.settlements.settlement_haven_01.inventory.gold = 52000;
  await delayReads(page); await importText(page, JSON.stringify(a)); await pending(page, 1);
  await importText(page, JSON.stringify(b)); await pending(page, 2);
  await release(page, 1); await expect(page.getByTestId('trial-stock-gold')).toHaveText('52');
  await release(page, 0); await expect(page.getByTestId('trial-stock-gold')).toHaveText('52');
  await expect(page.getByRole('status')).toContainText('Checkpoint imported');
});

test('a file read failure is recoverable and never changes the game', async ({ page }) => {
  await page.goto('/?mode=tiles'); const text = await checkpoint(page);
  await page.evaluate(() => { File.prototype.text = () => Promise.reject(Error('raw/private/error')); });
  await importText(page, text); await expect(page.getByRole('alert').first()).toContainText('Could not read');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('30');
  await expect(page.getByText('raw/private/error', { exact: false })).toHaveCount(0);
  await page.reload(); await importText(page, text); await expect(page.getByRole('status')).toContainText('Checkpoint imported');
});

test('the previous report is UI-only and survives cancel or invalid import until a valid load clears it', async ({ page }) => {
  await page.goto('/?mode=tiles');
  const initial = await checkpoint(page);
  await next(page);
  await expect(page.getByRole('heading', { name: 'Week 1 report', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Plan next week', exact: true })).toBeDisabled();
  const stocks = await page.getByTestId('trial-stocks').textContent();
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles([]);
  await importText(page, '{bad');
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByTestId('trial-stocks')).toHaveText(stocks!);
  await expect(page.getByRole('heading', { name: 'Week 1 report', exact: true })).toBeVisible();
  const saved = JSON.parse(await checkpoint(page));
  expect(saved.state.phase).toBe('planning');
  expect(saved.state.world.week).toBe(2);
  expect(saved.state).not.toHaveProperty('report');
  await importText(page, initial);
  await expect(page.getByRole('status')).toContainText('Checkpoint imported');
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toHaveCount(0);
  await expect(page.locator('header')).toContainText('Week 1 · Planning');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.locator('header')).toContainText('Week 2 · Report');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('30.5');
});
