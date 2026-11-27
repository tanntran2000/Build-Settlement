import { expect, test, type Page } from '@playwright/test';
import { CRISIS_TRIAL, type CharacterLifeSessionState } from '@haven/core';
import { serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { expectReport, exportLife, go, importLife, keyActivate, makeLife, tabTo } from './character-life-navigation.helpers.ts';
import { readStoredRecords, storedSaveText } from './storage.helpers.ts';

function close(s: CharacterLifeSessionState) {
  const r = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedWeek: 1, expectedRevision: s.city.revision });
  if (!r.success || !r.report) throw Error('Expected End Week report.');
  return { next: r.next, report: r.report };
}
const card = (page: Page) => page.getByRole('region', { name: 'Robbers at the Mansion', exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const row = (page: Page) => page.getByTestId('purse-report').locator('dt:text-is("Robbery") + dd');

for (const [width, difficulty, excess, ransom, loss, rest] of [
  [1280, 'normal', '30.088', '7.522', '18.052', '43.816'],
  [1600, 'easy', '10.355', '2.588', '6.213', '50.267'],
] as const) {
  test('renders and answers the ' + difficulty + ' home robbery at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const s = makeLife(40);
    s.city.society!.difficulty = difficulty;
    s.player.purse.moneyMilli = 50001;
    s.player.purse.levyPercent = 5;
    const expected = close(s);
    await page.goto('/');
    await importLife(page, s);
    await page.locator('#life-nav-player').click();
    await expect(page.getByTestId('purse-risk')).toHaveText(difficulty === 'easy'
      ? 'Safe amount 45 Money · At risk 5.001 Money'
      : 'Safe amount 22.5 Money · At risk 27.501 Money');
    await page.keyboard.press('Escape');
    const end = page.getByTestId('life-end-week');
    await keyActivate(page, end);
    await expect(end).toBeDisabled();
    await expect(end).toHaveText('Answer the robbery first.');
    const robbery = card(page);
    await expect(robbery).toBeVisible();
    await expect(robbery.getByRole('button')).toHaveText(['Pay', 'Chase', 'Let go']);
    await expect(robbery.locator('#home-robbery-pay-amount')).toHaveText('Lose ' + ransom + ' Money.');
    await expect(robbery.locator('#home-robbery-chase-amount')).toHaveText('Success: lose 0 Money. Failure: lose ' + loss + ' Money.');
    await expect(robbery.locator('#home-robbery-let-go-amount')).toHaveText('Lose ' + loss + ' Money.');
    for (const name of ['pay', 'chase', 'let-go']) {
      const disabled = robbery.locator('[data-robbery-option="' + name + '"]');
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await expect(disabled).toHaveAttribute('aria-describedby', 'home-robbery-' + name + '-amount home-robbery-' + name + '-reason');
      await expect(robbery.locator('#home-robbery-' + name + '-reason')).toHaveText('Choose Plan next week to answer.');
      await disabled.press('Enter');
      await expect(row(page)).toHaveText('Awaiting answer · ' + excess + ' Money at risk');
    }
    await expectReport(page, expected.report, difficulty);
    await keyActivate(page, button(page, 'Plan next week'));
    await expect(end).toBeDisabled();
    const pay = robbery.getByRole('button', { name: 'Pay', exact: true });
    await tabTo(page, pay);
    await keyActivate(page, pay);
    await expect(robbery).toHaveCount(0);
    await expect(end).toBeEnabled();
    await expect(row(page)).toHaveText('Paid · −' + ransom + ' Money · ' + excess + ' Money at risk');
    await expect(page.getByTestId('purse-money')).toHaveText('Money ' + rest);
    await expect(page.locator('#life-reports-heading')).toBeFocused();

    const low = makeLife(40);
    low.city.society!.difficulty = difficulty;
    low.city.society!.order.security = 14;
    low.player.purse.moneyMilli = 22500;
    low.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
    await importLife(page, low);
    await go(page, 'reports');
    const chase = card(page).getByRole('button', { name: 'Chase', exact: true });
    await tabTo(page, chase);
    await expect(chase).toHaveAttribute('aria-disabled', 'true');
    await expect(chase).toHaveAttribute('aria-describedby', 'home-robbery-chase-amount home-robbery-chase-reason');
    await expect(card(page).locator('#home-robbery-chase-reason')).toHaveText('Needs Security 15.');
    await chase.press('Space');
    expect((await exportLife(page)).player.purse).toStrictEqual(low.player.purse);

    await go(page, 'reports');
    for (const narrow of [320, 375]) {
      await page.setViewportSize({ width: narrow, height: 812 });
      await expect(card(page)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await card(page).getByRole('button').evaluateAll(nodes =>
        nodes.every(node => node.getBoundingClientRect().height >= 44 && node.getBoundingClientRect().right <= innerWidth))).toBe(true);
    }
  });

  test('describes all controls blocked by the Money reserve at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const s = makeLife(40);
    s.city.society!.difficulty = difficulty;
    s.city.tiles.find(tile => tile.id === 'slum-1')!.building =
      { typeId: 'drug-store', level: 1, workers: 0, enabled: true };
    s.city.society!.items.materials['green-leaf'] = 2;
    s.player.purse.moneyMilli = 4999;
    s.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
    const notice = '4 Money is held until the robbery is answered.';
    await page.goto('/');
    await importLife(page, s);
    const before = await exportLife(page);
    await page.locator('#life-nav-player').click();
    await expect(page.getByTestId('purse-held-money')).toHaveText(notice);
    await page.getByLabel('Donation amount in Money', { exact: true }).fill('1');
    const donate = button(page, 'Donate');
    await expect(donate).toBeDisabled();
    await expect(donate).toHaveAccessibleDescription(notice);
    await donate.press('Enter');
    await page.keyboard.press('Escape');
    await go(page, 'city');
    await button(page, 'Select spec-1').click();
    const market = page.getByRole('group', { name: 'Weekly offers', exact: true }).getByRole('button', { name: 'Buy', exact: true });
    await expect(market).toHaveCount(s.city.society!.items.market.length);
    for (const buy of await market.all()) {
      await expect(buy).toBeDisabled();
      await expect(buy).toHaveAccessibleDescription(notice);
    }
    await market.first().press('Enter');
    await button(page, 'Select slum-1').click();
    const potions = page.getByRole('region', { name: 'Potion shop', exact: true }).getByRole('button', { name: /^Buy / });
    await expect(potions).toHaveCount(3);
    for (const buy of await potions.all()) {
      await expect(buy).toBeDisabled();
      await expect(buy).toHaveAccessibleDescription(notice);
    }
    await potions.first().press('Enter');
    await page.getByRole('tab', { name: 'Brew', exact: true }).click();
    const brew = page.locator('[data-craft-recipe="brew-heal-potion-1"]').getByRole('button', { name: 'Place Heal Potion I', exact: true });
    await expect(brew).toBeDisabled();
    await expect(brew).toHaveAccessibleDescription(notice);
    await brew.press('Enter');
    expect(await exportLife(page)).toStrictEqual(before);
  });
}

test('rejects a robbery card one milli above Money and preserves the session and local checkpoint', async ({ page }) => {
  const s = makeLife(40);
  s.player.purse.moneyMilli = 4000;
  await page.goto('/');
  await importLife(page, s);
  const before = await exportLife(page);
  await button(page, 'Save locally').click();
  const saved = serializeCharacterLifeSave(before);
  if (!saved.success) throw Error(saved.error.message);
  await expect.poll(() => storedSaveText(page)).toBe(saved.text);
  const records = await readStoredRecords(page);
  const rejected = JSON.parse(saved.text);
  rejected.state.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4001 };
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({
    name: 'unbacked-robbery.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(rejected)),
  });
  await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]'))
    .toHaveText('This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.');
  expect(await exportLife(page)).toStrictEqual(before);
  expect(await readStoredRecords(page)).toStrictEqual(records);
  expect(await storedSaveText(page)).toBe(saved.text);
});

test('shows the exact card exposure and option losses after a permitted donation', async ({ page }) => {
  const s = makeLife(40);
  s.player.purse.moneyMilli = 50001;
  s.player.purse.levyPercent = 5;
  await page.goto('/');
  await importLife(page, s);
  await keyActivate(page, page.getByTestId('life-end-week'));
  await expect(row(page)).toHaveText('Awaiting answer · 30.088 Money at risk');
  await keyActivate(page, button(page, 'Plan next week'));
  await page.locator('#life-nav-player').click();
  await page.getByLabel('Donation amount in Money', { exact: true }).fill('21');
  const donate = button(page, 'Donate');
  await expect(donate).toBeEnabled();
  await donate.click();
  await expect(page.getByRole('region', { name: 'Purse', exact: true }).getByText('Money 30.338', { exact: true })).toBeVisible();
  await expect(page.getByTestId('purse-risk')).toHaveText('Safe amount 21.25 Money · At risk 30.088 Money');
  await go(page, 'reports');
  await expect(card(page).locator('#home-robbery-pay-amount')).toHaveText('Lose 7.522 Money.');
  await expect(card(page).locator('#home-robbery-let-go-amount')).toHaveText('Lose 18.052 Money.');
});

test('blocks a 5 Money Market purchase only while the same balance includes a 4 Money hold', async ({ page }) => {
  const s = makeLife(40);
  s.player.purse.moneyMilli = 8999;
  s.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
  const offers = s.city.society!.items.market;
  const offerIndex = offers.findIndex(offer => offer.priceMilli === 5000);
  expect(offers[offerIndex].priceMilli).toBe(5000);
  const openMarket = async () => {
    await go(page, 'city');
    await button(page, 'Select spec-1').click();
    const market = page.getByRole('group', { name: 'Weekly offers', exact: true });
    const buys = market.getByRole('button', { name: 'Buy', exact: true });
    await expect(buys).toHaveCount(offers.length);
    await expect(market.getByRole('article').nth(offerIndex).getByText('5 Money', { exact: true })).toBeVisible();
    return buys.nth(offerIndex);
  };
  await page.goto('/');
  await importLife(page, s);
  const before = await exportLife(page);
  const blocked = await openMarket();
  await expect(blocked).toBeDisabled();
  await expect(blocked).toHaveAccessibleDescription('4 Money is held until the robbery is answered.');
  await blocked.press('Enter');
  expect(await exportLife(page)).toStrictEqual(before);

  const cleared = structuredClone(s);
  cleared.player.purse.robbery = null;
  await importLife(page, cleared);
  const ready = await exportLife(page);
  expect(ready.player.purse).toStrictEqual({ ...before.player.purse, robbery: null });
  expect(ready.city.society!.items).toStrictEqual(before.city.society!.items);
  const enabled = await openMarket();
  await expect(enabled).toBeEnabled();
  await enabled.click();
  const bought = await exportLife(page);
  expect(bought.player.purse.moneyMilli).toBe(3999);
  expect(bought.city.society!.items.market).toStrictEqual(offers.filter((_, i) => i !== offerIndex));
});

test('shows crisis first and resumes between the two answers from IndexedDB and JSON', async ({ page }) => {
  const s = makeLife(40);
  const society = s.city.society!;
  society.crisis.stage = 'warning';
  society.crisis.hungerStreak = CRISIS_TRIAL.demandHungerWeeks - 1;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 0;
  const stock = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  stock.food = 0;
  stock.wheat = 0;
  for (const id of ['field-1', 'plain-1']) {
    const building = s.city.tiles.find(tile => tile.id === id)!.building!;
    building.workers = 0;
  }
  s.player.purse.moneyMilli = 50001;
  await page.goto('/');
  await importLife(page, s);
  await keyActivate(page, page.getByTestId('life-end-week'));
  await expect(page.getByTestId('crisis-card')).toBeVisible();
  await expect(card(page)).toHaveCount(0);
  await expect(page.getByTestId('life-end-week')).toHaveText('Answer the crisis first.');
  await keyActivate(page, button(page, 'Plan next week'));
  const both = await exportLife(page);
  expect(both.city.society!.pendingCard).toStrictEqual({ id: 'crisis-demand-w2', source: 'crisis', kind: 'demand', week: 2 });
  expect(both.player.purse.robbery?.id).toBe('home-robbery-w1');
  await button(page, 'Save locally').click();
  await expect(page.getByText('Saved in this browser. Replaced the previous local checkpoint.', { exact: true })).toBeVisible();
  await page.reload();
  await button(page, 'Continue').click();
  expect((await exportLife(page)).player.purse).toStrictEqual(both.player.purse);
  await go(page, 'reports');
  const refuse = page.getByTestId('crisis-card').getByRole('button', { name: 'Refuse', exact: true });
  await keyActivate(page, refuse);
  await expect(card(page).getByRole('heading')).toBeFocused();
  await expect(page.getByTestId('life-end-week')).toHaveText('Answer the robbery first.');
  const between = await exportLife(page);
  expect(between.city.society!.pendingCard).toBeNull();
  expect(between.player.purse).toStrictEqual(both.player.purse);
  await importLife(page, between);
  await go(page, 'reports');
  await expect(page.getByTestId('crisis-card')).toHaveCount(0);
  await keyActivate(page, card(page).getByRole('button', { name: 'Let go', exact: true }));
  await expect(page.getByTestId('life-shell').getByRole('status').filter({ hasText: 'Robbery · Let go · −17.25 Money · 28.751 Money at risk' })).toHaveText('Robbery · Let go · −17.25 Money · 28.751 Money at risk');
  await expect(page.getByTestId('life-end-week')).toBeEnabled();
  expect((await exportLife(page)).player.purse.robbery).toBeNull();
});
