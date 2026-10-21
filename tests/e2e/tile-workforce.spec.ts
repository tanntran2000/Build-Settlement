import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const select = (page: Page, id: string) => page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
const editor = (page: Page) => page.getByLabel('Assigned workers (WF)', { exact: true });
const manage = (page: Page) => page.getByRole('region', { name: 'Manage tile', exact: true });
async function assign(page: Page, id: string, workers: number) {
  await select(page, id);
  await editor(page).fill(String(workers));
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
}
async function threeAssignedBuildings(page: Page) {
  await page.goto('/?mode=tiles');
  await select(page, 'field-2');
  await page.getByLabel('Building type').selectOption('farm');
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  for (const id of ['field-1', 'plain-1', 'field-2']) await assign(page, id, 3);
}
async function allocations(page: Page, expected: number[]) {
  for (const [index, id] of ['field-1', 'plain-1', 'field-2'].entries()) {
    await expect(page.getByTestId(`trial-tile-${id}`)).toContainText(`${expected[index]} WF`);
  }
  await expect(page.locator('header')).toContainText(`${expected.reduce((a, n) => a + n, 0)} / 10 WF assigned`);
}
async function checkpoint(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  return readFile((await (await pending).path())!, 'utf8');
}
async function load(page: Page, text: string) {
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'workers.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toContainText('Checkpoint imported');
}

test('confirmed equal assignments survive three weeks and checkpoint restoration without another assignment', async ({ page }) => {
  await threeAssignedBuildings(page);
  await allocations(page, [3, 3, 3]);
  for (let week = 1; week <= 3; week++) {
    await page.getByRole('button', { name: 'End Week', exact: true }).click();
    await expect(page.locator('header')).toContainText(`Week ${week + 1} · Report`);
    await allocations(page, [3, 3, 3]);
    await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
    await allocations(page, [3, 3, 3]);
    await select(page, 'plain-1');
    await expect(editor(page)).toHaveValue('3');
  }
  const saved = await checkpoint(page);
  await assign(page, 'field-1', 4);
  await allocations(page, [4, 3, 3]);
  const changed = JSON.parse(await checkpoint(page));
  await assign(page, 'plain-1', 4);
  await expect(page.getByRole('alert')).toContainText('shared workforce pool');
  await allocations(page, [4, 3, 3]);
  expect(JSON.parse(await checkpoint(page)).state).toEqual(changed.state);
  await load(page, saved);
  await allocations(page, [3, 3, 3]);
  await select(page, 'plain-1');
  await expect(editor(page)).toHaveValue('3');
  const restored = JSON.parse(await checkpoint(page));
  expect(restored.state.tiles).toEqual(JSON.parse(saved).state.tiles);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await allocations(page, [3, 3, 3]);
});

test('editor distinguishes confirmed workforce from a draft without committing on blur or Enter', async ({ page }) => {
  await page.goto('/?mode=tiles');
  await select(page, 'field-1');
  await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 2 WF');
  await editor(page).fill('3');
  await expect(page.locator('#trial-workers-draft')).toContainText('Unapplied draft');
  await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 2 WF');
  await editor(page).press('Tab');
  await editor(page).press('Enter');
  await expect(page.getByTestId('trial-tile-field-1')).toContainText('2 WF');
  await select(page, 'plain-1');
  await expect(editor(page)).toHaveValue('2');
  await expect(page.locator('#trial-workers-draft')).toHaveCount(0);
  await assign(page, 'field-1', 3);
  await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 3 WF');
  await expect(page.locator('#trial-workers-draft')).toHaveCount(0);
  await editor(page).fill('4');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 3 WF');
  await expect(editor(page)).toHaveValue('3');
  await expect(page.locator('#trial-workers-draft')).toHaveCount(0);
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 3 WF');
});

for (const width of [1280, 390]) {
  test(`rejected assignment shows a local error and the unchanged confirmed amount at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await threeAssignedBuildings(page);
    const saved = await checkpoint(page);
    await assign(page, 'field-1', 4);
    await assign(page, 'plain-1', 4);
    const error = manage(page).getByRole('alert');
    await expect(error).toContainText('shared workforce pool');
    await expect(error).toBeInViewport();
    await expect(editor(page)).toHaveValue('4');
    await expect(editor(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(editor(page)).toHaveAttribute('aria-describedby', /trial-workers-error/);
    await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 3 WF');
    await expect(page.locator('#trial-workers-draft')).toContainText('Unapplied draft');
    await expect(page.getByRole('region', { name: 'Planning checkpoints' }).getByRole('alert')).toHaveCount(0);
    await allocations(page, [4, 3, 3]);
    await select(page, 'field-2');
    await expect(manage(page).getByRole('alert')).toHaveCount(0);
    await expect(editor(page)).toHaveAttribute('aria-invalid', 'false');
    await assign(page, 'plain-1', 4);
    await expect(manage(page).getByRole('alert')).toBeVisible();
    await load(page, saved);
    await expect(manage(page).getByRole('alert')).toHaveCount(0);
    await expect(editor(page)).toHaveValue('3');
    await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 3 WF');
    await expect(page.locator('#trial-workers-draft')).toHaveCount(0);
    await expect(editor(page)).toHaveAttribute('aria-invalid', 'false');
    await assign(page, 'plain-1', 4);
    await expect(manage(page).getByRole('alert')).toHaveCount(0);
    await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 4 WF');
    await allocations(page, [3, 4, 3]);
  });
}
