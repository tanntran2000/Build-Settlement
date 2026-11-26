import { test, expect } from '@playwright/test';
import { exportLife, go, importLife } from './character-life-navigation.helpers.js';
import { storedSaveText } from './storage.helpers.js';

for (const width of [1280, 1600]) {
  test('New Game difficulty is keyboard-selectable and survives storage at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    const group = page.getByRole('radiogroup', { name: 'Difficulty' });
    const normal = group.getByRole('radio', { name: 'Normal' });
    const easy = group.getByRole('radio', { name: 'Easy' });
    await expect(normal).toBeChecked();
    await normal.focus();
    await normal.press('ArrowRight');
    await expect(easy).toBeChecked();
    await page.getByLabel('Name', { exact: true }).fill('Synthetic Keeper');
    await page.getByRole('tab', { name: 'Review', exact: true }).click();
    await page.getByRole('button', { name: 'Create character', exact: true }).click();
    await go(page, 'session');
    const panel = page.getByRole('region', { name: 'Planning checkpoints' });
    await expect(panel.getByText('Difficulty: Easy', { exact: true })).toBeVisible();
    await expect(panel.getByRole('radiogroup')).toHaveCount(0);
    const fresh = await exportLife(page);
    expect(fresh.city.society!.difficulty).toBe('easy');
    expect(fresh.player.purse).toStrictEqual({ moneyMilli: 0, levyPercent: 0, donatedThisWeekMilli: 0, robbery: null });
    fresh.player.purse = { moneyMilli: 1201, levyPercent: 5, donatedThisWeekMilli: 1000,
      robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 201 } };
    await importLife(page, fresh);
    const before = await exportLife(page);
    expect(before.player.purse).toStrictEqual(fresh.player.purse);
    await panel.getByRole('button', { name: 'Save locally' }).click();
    await expect(panel.getByRole('status')).toHaveText('Saved in this browser.');
    const stored = await storedSaveText(page);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).state).toEqual(before);
    await page.reload();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await go(page, 'session');
    await expect(panel.getByText('Difficulty: Easy', { exact: true })).toBeVisible();
    expect(await exportLife(page)).toEqual(before);
    expect(await storedSaveText(page)).toBe(stored);
  });
}
