import { test, expect, type Page } from '@playwright/test';

async function tile(page: Page, id: string) {
  await page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
}
async function build(page: Page, id: string, type: string, workers?: number) {
  await tile(page, id);
  await page.getByLabel('Building type').selectOption(type);
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  if (workers !== undefined) {
    await page.getByLabel('Assigned workers (WF)').fill(String(workers));
    await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  }
}

test('tile mode is discoverable and rejects unsuitable placement without spending', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Play tile building trial' }).click();
  await expect(page.getByRole('heading', { name: 'Tile Building Trial', exact: true })).toBeVisible();
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('30');
  await tile(page, 'plain-2');
  await page.getByLabel('Building type').selectOption('logging');
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await expect(page.getByRole('alert').first()).toContainText('requires forest');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('30');
  await expect(page.getByTestId('trial-tile-plain-2')).toContainText('Empty');
});

test('builds production and Market, serves Goods once, then upgrades and replaces', async ({ page }) => {
  await page.goto('/?mode=tiles');
  await build(page, 'forest-1', 'logging', 2);
  await build(page, 'ore-1', 'mine', 1);
  await build(page, 'plain-2', 'workshop', 1);
  await build(page, 'plain-3', 'market');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('18');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Week 1 report', exact: true })).toBeVisible();
  await expect(page.getByTestId('trial-goods')).toContainText('2 / 2');
  await expect(page.getByTestId('trial-goods')).toContainText('100%');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('18.5');
  await expect(page.getByTestId('trial-stock-food')).toHaveText('4');
  await expect(page.getByTestId('trial-stocks').getByText('Goods', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Upgrade', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await page.getByRole('button', { name: 'Upgrade', exact: true }).click();
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Level 2');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('12.5');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-goods')).toContainText('2 / 2');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('12.5');
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await page.getByLabel('Building type').selectOption('processor');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Food Processor');
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Level 1');
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('9.5');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Paused');
  await page.reload();
  await expect(page.getByTestId('trial-stock-gold')).toHaveText('30');
});

test('invalid worker and unaffordable replacement preserve plan', async ({ page }) => {
  await page.goto('/?mode=tiles');
  await tile(page, 'field-1');
  await page.getByLabel('Assigned workers (WF)').fill('0.5');
  await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  await expect(page.getByRole('alert').first()).toContainText('whole');
  await expect(page.getByTestId('trial-tile-field-1')).toContainText('2 WF');
  await build(page, 'plain-2', 'market');
  await page.getByRole('button', { name: 'Upgrade', exact: true }).click();
  await page.getByLabel('Building type').selectOption('market');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  // Replacement spends Wood once each time; it never refunds the old building.
  await expect(page.getByRole('alert').first()).toContainText('Not enough wood');
  await expect(page.getByTestId('trial-tile-plain-2')).toContainText('Market');
  await expect(page.getByTestId('trial-stock-wood')).toHaveText('0');
});

for (const width of [1280, 390]) {
  test(`double-click Plan next week preserves the new plan at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/?mode=tiles');
    await build(page, 'forest-1', 'logging', 2);
    await page.getByRole('button', { name: 'End Week', exact: true }).click();
    const stocks = await page.getByTestId('trial-stocks').textContent();
    await page.getByRole('button', { name: 'Plan next week', exact: true }).dblclick();
    await expect(page.locator('header')).toContainText('Week 2 · Planning');
    await expect(page.getByTestId('trial-stocks')).toHaveText(stocks!);
    await expect(page.getByRole('button', { name: 'Plan next week', exact: true })).toBeDisabled();
    await expect(page.getByText('Previous report · Planning is active.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeEnabled();
    // A separate intentional action is immediately available; no debounce timer.
    await page.getByRole('button', { name: 'End Week', exact: true }).click();
    await expect(page.locator('header')).toContainText('Week 3 · Report');
    await expect(page.getByTestId('trial-stock-wood')).toHaveText('16');
    await expect(page.getByRole('heading', { name: 'Week 1 report', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Week 2 report', exact: true })).toBeVisible();
  });
}

test('repeated keyboard activation cannot turn planning into another End Week', async ({ page }) => {
  await page.goto('/?mode=tiles');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.locator('header')).toContainText('Week 2 · Planning');
  await page.getByRole('button', { name: 'End Week', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('header')).toContainText('Week 3 · Report');
});

test('repeated touch taps at Plan coordinates preserve planning until intentional End Week', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('/?mode=tiles');
    await page.getByRole('button', { name: 'End Week', exact: true }).tap();
    const next = page.getByRole('button', { name: 'Plan next week', exact: true });
    await next.scrollIntoViewIfNeeded();
    const box = (await next.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator('header')).toContainText('Week 2 · Planning');
    await expect(next).toBeDisabled();
    await page.getByRole('button', { name: 'End Week', exact: true }).tap();
    await expect(page.locator('header')).toContainText('Week 3 · Report');
  } finally { await context.close(); }
});
