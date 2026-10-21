import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const editor = (page: Page) => page.getByLabel('Assigned workers (WF)', { exact: true });
const select = (page: Page, id: string) => page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
async function assign(page: Page, id: string, amount: string) {
  await select(page, id); await editor(page).fill(amount);
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
}
async function checkpoint(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
}
const allocations = (state: { tiles: { id: string; building: { workers: number } | null }[] }) =>
  ['field-1', 'plain-1', 'field-2'].map(id => state.tiles.find(tile => tile.id === id)!.building!.workers);

for (const width of [1280, 390]) {
  for (const draft of [
    { name: 'valid', amount: '2', succeeds: true, assigned: 2 },
    { name: 'still invalid', amount: '5', succeeds: false, assigned: 3 },
    { name: 'confirmed value', amount: '3', succeeds: true, assigned: 3 },
  ]) {
    test(`editing rejected workforce to ${draft.name} clears only its old error at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?mode=tiles');
      await select(page, 'field-2'); await page.getByLabel('Building type').selectOption('farm');
      await page.getByRole('button', { name: 'Build', exact: true }).click();
      for (const [id, amount] of [['field-1', '4'], ['plain-1', '3'], ['field-2', '3']]) await assign(page, id, amount);
      const before = await checkpoint(page);
      await assign(page, 'plain-1', '4');
      await expect(page.locator('#trial-workers-error')).toContainText('shared workforce pool');
      await expect(editor(page)).toHaveAttribute('aria-invalid', 'true');

      await editor(page).fill(draft.amount);
      await expect(page.locator('#trial-workers-error')).toHaveCount(0);
      await expect(editor(page)).toHaveAttribute('aria-invalid', 'false');
      await expect(editor(page)).not.toHaveAttribute('aria-describedby', /trial-workers-error/);
      await expect(page.locator('#trial-workers-confirmed')).toContainText('Assigned: 3 WF');
      if (draft.amount === '3') await expect(page.locator('#trial-workers-draft')).toHaveCount(0);
      else await expect(page.locator('#trial-workers-draft')).toContainText('Unapplied draft');
      await editor(page).press('Tab'); await editor(page).press('Enter');
      expect((await checkpoint(page)).state).toEqual(before.state);

      await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
      const submitted = await checkpoint(page);
      expect(allocations(submitted.state)).toEqual([4, draft.assigned, 3]);
      expect(submitted.state.world).toEqual(before.state.world);
      if (draft.succeeds) {
        await expect(page.locator('#trial-workers-error')).toHaveCount(0);
        await expect(editor(page)).toHaveAttribute('aria-invalid', 'false');
        expect(submitted.state.revision).toBe(before.state.revision + 1);
      } else {
        await expect(page.locator('#trial-workers-error')).toContainText('shared workforce pool');
        await expect(editor(page)).toHaveAttribute('aria-invalid', 'true');
        expect(submitted.state).toEqual(before.state);
      }

      await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'before-draft.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) });
      await expect(page.getByRole('region', { name: 'Planning checkpoints', exact: true }).getByRole('status')).toContainText('Checkpoint imported');
      await expect(editor(page)).toHaveValue('3');
      await expect(page.locator('#trial-workers-error')).toHaveCount(0);
      await expect(editor(page)).toHaveAttribute('aria-invalid', 'false');
      const restored = await checkpoint(page);
      expect(restored.state.tiles).toEqual(before.state.tiles);
      expect(restored.state.world).toEqual(before.state.world);
      expect(restored.state.happiness).toBe(before.state.happiness);
      expect(restored.state.revision).toBeGreaterThan(submitted.state.revision);
    });
  }
}
