import { test, expect, type Page } from '@playwright/test';

const stock = (page: Page, key: string) => page.getByTestId(`weekly-stock-${key}`);
async function assign(page: Page, amount: string) {
  await page.getByLabel('Farm Field workforce (WF)').fill(amount);
}
async function end(page: Page, amount: string) {
  await assign(page, amount);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
}

test.beforeEach(async ({ page }) => { await page.goto('/?mode=weekly'); });

test('draft leaves stocks unchanged; 4 WF produces the before/net/after ledger once', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Weekly Management' })).toBeVisible();
  await expect(page.getByText('Resets on reload', { exact: false })).toBeVisible();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await assign(page, '4');
  await expect(stock(page, 'gold')).toHaveText('10');
  await expect(stock(page, 'food')).toHaveText('4');
  await page.getByRole('button', { name: 'End Week', exact: true }).dblclick();
  await expect(page.getByTestId('weekly-week')).toHaveText('2');
  await expect(stock(page, 'gold')).toHaveText('6');
  await expect(stock(page, 'food')).toHaveText('12');
  await expect(stock(page, 'wood')).toHaveText('0');
  await expect(stock(page, 'iron')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeDisabled();
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report).toContainText('Week 1 report');
  await expect(report.getByRole('row', { name: 'Gold 10 -4 6 4 4 0' })).toBeVisible();
  await expect(report.getByRole('row', { name: 'Food 4 8 12 0 0 0' })).toBeVisible();
  const snapshot = await report.innerText();
  // Exercise a bound draft update during Report without recomputing its economics.
  await page.getByLabel('Farm Field workforce (WF)').evaluate((input: HTMLInputElement) => {
    input.value = '9';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.setViewportSize({ width: 600, height: 800 });
  await page.getByText('WHY', { exact: true }).click();
  await page.getByText('WHY', { exact: true }).click();
  await expect(report).toHaveText(snapshot, { useInnerText: true });
  await expect(stock(page, 'food')).toHaveText('12');
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await expect(page.getByLabel('Farm Field workforce (WF)')).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeEnabled();
});

test('Enter submits once and report phase ignores repeated Enter', async ({ page }) => {
  const input = page.getByLabel('Farm Field workforce (WF)');
  await assign(page, '0.5');
  await input.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('weekly-week')).toHaveText('2');
  await expect(stock(page, 'gold')).toHaveText('9.5');
  await expect(stock(page, 'food')).toHaveText('5');
});

test('shortage WHY distinguishes assigned unfunded and unassigned; no negative stocks', async ({ page }) => {
  await end(page, '8');
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await end(page, '4');
  await expect(stock(page, 'gold')).toHaveText('0');
  await expect(stock(page, 'food')).toHaveText('24');
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report).toContainText('Unfunded assigned: 2 WF');
  await expect(report).toContainText('Unassigned: 6 WF');
  await expect(report).toContainText('Gold shortage');
  await expect(report.getByRole('row', { name: 'Gold 2 -2 0 4 2 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await end(page, '0');
  await expect(stock(page, 'food')).toHaveText('24');
});

test('invalid draft is accessible and recoverable without advancing or changing stocks', async ({ page }) => {
  for (const value of ['11', '-1', '0.0001', 'abc', '']) {
    await end(page, value);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Farm Field workforce (WF)')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('weekly-week')).toHaveText('1');
    await expect(stock(page, 'gold')).toHaveText('10');
    await expect(stock(page, 'food')).toHaveText('4');
  }
  await end(page, '4');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(stock(page, 'food')).toHaveText('12');
});

test('reload resets the independent prototype and R1 remains at Day 1', async ({ page }) => {
  await end(page, '4');
  await page.reload();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await expect(stock(page, 'gold')).toHaveText('10');
  await page.goto('/');
  await expect(page.locator('#current-day')).toHaveText('1');
  await expect(page.locator('#resource-food')).toHaveText('100');
});
