import { expect, test } from '@playwright/test';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { expectReport, exportLife, go, importLife, keyActivate, makeLife, tabTo } from './character-life-navigation.helpers.ts';

for (const width of [1280, 1600]) {
  test('uses the Player purse, reports both transactions and round-trips at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const s = makeLife();
    const easy = width === 1600;
    s.city.society!.difficulty = easy ? 'easy' : 'normal';
    s.player.purse.moneyMilli = 3000;
    await page.goto('/');
    await importLife(page, s);
    await expect(page.getByTestId('purse-money')).toHaveText('Money 3');
    const player = page.locator('#life-nav-player');
    await tabTo(page, player);
    await keyActivate(page, player);
    const purse = page.getByRole('region', { name: 'Purse', exact: true });
    await expect(purse).toContainText('Safe amount — · At risk —');
    await expect(purse.getByRole('button', { name: 'Decrease weekly levy' })).toHaveAttribute('aria-disabled', 'true');
    const increase = purse.getByRole('button', { name: 'Increase weekly levy' });
    await tabTo(page, increase);
    for (let i = 0; i < 5; i++) await keyActivate(page, increase);
    await expect(purse).toContainText('5 %');
    await expect(purse).toContainText('Happiness cost: −3 a week');
    const input = purse.getByLabel('Donation amount in Money');
    await tabTo(page, input);
    await page.keyboard.type('1e2');
    await expect(purse.getByRole('button', { name: 'Donate', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await input.fill('4');
    await expect(purse).toContainText('Not enough Money.');
    await input.fill('1');
    await expect(purse.getByText(easy ? '1 Money → 0.5 Gold' : '1 Money → 1 Gold', { exact: true })).toBeVisible();
    const donate = purse.getByRole('button', { name: 'Donate', exact: true });
    await tabTo(page, donate);
    await keyActivate(page, donate);
    await expect(purse).toContainText('Money 2');
    await page.keyboard.press('Escape');
    await expect(player).toBeFocused();

    const before = await exportLife(page);
    expect(before.player.purse).toMatchObject({ moneyMilli: 2000, levyPercent: 5, donatedThisWeekMilli: 1000 });
    await go(page, 'session');
    await page.getByRole('button', { name: 'Save locally', exact: true }).click();
    await expect(page.getByText('Saved in this browser.', { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByTestId('life-shell')).toBeVisible();
    expect((await exportLife(page)).player.purse).toStrictEqual(before.player.purse);
    await importLife(page, before);
    const planning = await exportLife(page);
    expect(planning.player.purse).toStrictEqual(before.player.purse);

    const r = executeCharacterLifeCommand(planning, { type: 'END_WEEK', expectedWeek: 1, expectedRevision: planning.city.revision });
    if (!r.success || !r.report) throw Error('Expected End Week report');
    await go(page, 'city');
    await page.getByTestId('life-end-week').click();
    expect((await expectReport(page, r.report)).purse).toStrictEqual(r.report.purse);
    expect(r.report.purse?.donationsMilli).toBe(1000);
    expect(r.report.purse?.donationGoldMilli).toBe(easy ? 500 : 1000);
  });
}
