import { test, expect, type Page } from '@playwright/test';

async function select(page: Page, id: string) { await page.getByRole('button', { name: `Select ${id}`, exact: true }).click(); }
async function assign(page: Page, id: string, workers: number) {
  await select(page, id); await page.getByLabel('Assigned workers (WF)', { exact: true }).fill(String(workers));
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
}
async function expand(page: Page) {
  for (const [id, type] of [['forest-1', 'logging'], ['ore-1', 'mine'], ['plain-2', 'workshop'], ['plain-3', 'market']]) {
    await select(page, id); await page.getByLabel('Building type').selectOption(type); await page.getByRole('button', { name: 'Build', exact: true }).click();
  }
  for (const [id, workers] of [['field-1', 3], ['plain-1', 3], ['forest-1', 1], ['ore-1', 1], ['plain-2', 1]] as const) await assign(page, id, workers);
}
async function exported(page: Page) {
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const file = await download; const stream = await file.createReadStream(); const chunks = []; for await (const c of stream!) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}
for (const width of [1280, 390]) test(`population mode grows once, preserves workforce and roundtrips at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.getByRole('link', { name: 'Play population trial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Population Trial', exact: true })).toBeVisible();
  await expand(page); const before = JSON.parse(await exported(page)); expect(before.rulesetId).toBe('tile-population-01');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-immigration')).toContainText('100 → 102');
  await expect(page.getByTestId('trial-immigration')).toContainText('2 arrivals');
  await page.getByRole('button', { name: 'Plan next week', exact: true }).dblclick();
  const saved = await exported(page); const snapshot = JSON.parse(saved); expect(snapshot.state.world.week).toBe(2);
  expect(snapshot.state.world.settlements.settlement_haven_01.cohorts[0].count).toBe(102);
  expect(snapshot.state.tiles).toEqual(before.state.tiles);
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'new.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByRole('status')).toContainText('imported');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-immigration')).toContainText('102 → 104');
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await select(page, 'field-1'); await expect(page.getByLabel('Assigned workers (WF)', { exact: true })).toHaveValue('3');
  expect(errors).toEqual([]);
});
test('cross-ruleset imports preserve each mode and old saves continue without growth', async ({ page }) => {
  await page.goto('/?mode=tiles'); await expand(page); const old = await exported(page);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-immigration')).toHaveCount(0);
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  const legacyAfter = JSON.parse(await exported(page)); expect(legacyAfter.state.world.settlements.settlement_haven_01.cohorts[0].count).toBe(100);
  await page.goto('/?mode=population'); const initial = JSON.parse(await exported(page));
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(old) });
  await expect(page.getByRole('alert').last()).toContainText('ruleset');
  expect(JSON.parse(await exported(page)).state).toEqual(initial.state);
  const fresh = await exported(page);
  await page.goto('/?mode=tiles'); const before = JSON.parse(await exported(page));
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'population.json', mimeType: 'application/json', buffer: Buffer.from(fresh) });
  await expect(page.getByRole('alert').last()).toContainText('ruleset');
  expect(JSON.parse(await exported(page)).state).toEqual(before.state);
});
