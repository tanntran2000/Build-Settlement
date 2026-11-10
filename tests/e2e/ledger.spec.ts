import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { deserializeCharacterLifeSave } from '../../packages/persistence/src/index.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { reportLetters, reportStamps } from '../../packages/ui/src/report-letters.ts';
import { END_SCREEN_COPY } from '../../packages/ui/src/society-view.ts';
import { makeLife, importLife, go, expectReport, reportRegion } from './character-life-navigation.helpers.ts';

async function fixture(name: string) {
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v7/${name}.json`, import.meta.url), 'utf8'));
  if (!result.success) throw Error(result.error.message);
  return result.state;
}
async function fit(page: Page) {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const grid = reportRegion(page).locator('.letters-grid');
    if (await grid.count()) {
      const columns = (await grid.evaluate(node => getComputedStyle(node).gridTemplateColumns)).split(' ').length;
      if (width < 750) expect(columns).toBe(1); else expect(columns).toBeGreaterThanOrEqual(2);
    }
    for (const button of await page.locator('button:visible, summary:visible').all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      const control = await button.evaluate(node => ({ text: node.textContent, letter: node.closest('[data-letter]')?.getAttribute('data-letter'), minHeight: getComputedStyle(node).minHeight, padding: getComputedStyle(node).padding }));
      expect(box!.height, JSON.stringify(control)).toBeGreaterThanOrEqual(44);
    }
  }
}

test('B3 empty Report and blocked fonts retain the fallback at both widths', async ({ page }) => {
  await page.route('**/*.ttf', route => route.abort());
  await page.route('**/assets/ui-pixel/**', route => route.abort());
  await page.route('**/assets/desk/**', route => route.abort());
  await page.goto('/?mode=world-life'); await importLife(page, makeLife()); await go(page, 'reports');
  await expect(reportRegion(page).locator('[data-letter]')).toHaveCount(0);
  await expect(reportRegion(page).locator('[data-report-stamp]')).toHaveCount(0);
  await expect(reportRegion(page).getByRole('button', { name: 'Plan next week', exact: true })).toHaveClass(/ledger-wax/);
  await expect(reportRegion(page).getByRole('button', { name: 'Plan next week', exact: true })).toHaveAttribute('aria-disabled', 'true');
  await page.getByTestId('life-end-week').click();
  await expect(reportRegion(page).locator('[data-letter="steward"]')).toBeVisible();
  await fit(page);
});

for (const kind of ['new-game', 'crime-raid', 'crime-wound', 'laws'] as const) {
  test(`B3 ${kind} letters preserve rows, Details and complete report parity`, async ({ page }) => {
    const initial = kind === 'new-game' ? makeLife() : await fixture(`life-${kind}`);
    const result = executeCharacterLifeCommand(initial, { type: 'END_WEEK', expectedRevision: initial.city.revision, expectedWeek: initial.city.world.week });
    if (!result.success || !result.report) throw Error('Report fixture failed');
    await page.goto('/?mode=world-life'); await importLife(page, initial); await go(page, 'city');
    await page.getByTestId('life-end-week').click();
    const panel = reportRegion(page), projected = reportLetters(result.report);
    expect(await panel.locator('[data-letter]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-letter')))).toEqual(projected.map(letter => letter.id));
    expect(await panel.locator('[data-report-stamp]').allTextContents()).toEqual(reportStamps(result.report).map(stamp => `${stamp.label} ${stamp.value}`));
    for (const letter of projected) {
      const region = panel.locator(`[data-letter="${letter.id}"]`);
      await expect(region).toHaveAttribute('aria-label', letter.sender);
      await expect(region.getByRole('heading', { level: 3 })).toHaveText(letter.headline);
      const details = region.locator(':scope > details');
      await expect(details).not.toHaveAttribute('open');
      expect(await region.locator('dl.letter-rows > div').evaluateAll(nodes => nodes.map(node => ({ label: node.querySelector('dt')!.textContent, value: node.querySelector('dd')?.textContent ?? '', tone: node.getAttribute('data-tone') })))).toEqual(letter.rows);
      const colours = { gain: 'rgb(47, 93, 42)', loss: 'rgb(140, 42, 31)', muted: 'rgb(107, 79, 46)' };
      for (const row of await region.locator('dl.letter-rows > div').all()) {
        const tone = await row.getAttribute('data-tone') as keyof typeof colours;
        await expect(row).toHaveCSS('color', colours[tone]);
        for (const text of await row.locator('dt,dd').all()) await expect(text).toHaveCSS('color', colours[tone]);
      }
      for (const sentence of await region.locator('dl.letter-rows > div[data-sentence]').all()) await expect(sentence.locator('dd')).toHaveCount(0);
      const heading = letter.id === 'steward' ? 'Gold and upkeep' : letter.id === 'quartermaster' ? 'Needs and services'
        : letter.id === 'census' ? 'Population and happiness' : letter.id === 'captain' ? result.report.order ? 'Order' : 'Crime'
        : letter.id === 'council' ? 'Laws' : result.report.crisis ? 'Crisis' : null;
      if (heading) {
        await details.locator(':scope > summary').click();
        await expect(details.getByRole('heading', { name: heading, exact: true })).toBeVisible();
        await details.locator(':scope > summary').click();
      } else await expect(details.locator('section')).toHaveCount(0);
    }
    const council = projected.some(letter => letter.id === 'council');
    await expect(panel.locator('[aria-label="Laws"]')).toHaveCount(result.report.laws ? 1 : 0);
    if (result.report.laws) {
      await expect(panel.locator(`[data-letter="${council ? 'council' : 'steward'}"] [aria-label="Laws"]`)).toHaveCount(1);
      if (!council) await expect(panel.locator('[aria-label="Laws"]')).toContainText('No laws in force.');
    }
    await expectReport(page, result.report);
    const children = await panel.evaluate(node => [...node.children].map(child => child.tagName));
    expect(children.at(-1)).toBe('BUTTON');
    await expect(panel.getByRole('button', { name: 'Plan next week', exact: true })).toHaveClass(/ledger-wax/);
    await fit(page);
  });
}

test('B3 urgent letter precedes reports and keeps crisis command behavior', async ({ page }) => {
  const initial = await fixture('life-demand-card');
  await page.goto('/?mode=world-life'); await importLife(page, initial); await go(page, 'reports');
  const card = page.locator('[data-life-view="reports"] [data-testid="crisis-card"]');
  await expect(card.getByText('Urgent letter', { exact: true })).toHaveAttribute('aria-hidden', 'true');
  await expect(card.getByText('Answer before End Week', { exact: true })).toBeVisible();
  await expect(card).toHaveCSS('border-top-color', 'rgb(142, 42, 30)');
  await expect(card.locator('[data-card-option]')).toHaveClass([/ledger-plaque/, /ledger-plaque/, /ledger-plaque/, /ledger-plaque/]);
  await expect(page.getByTestId('life-end-week')).toBeDisabled();
  await fit(page);
  await card.locator('[data-card-option="pay"]').click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('#life-nav-report')).toHaveAttribute('aria-current', 'page');
  const answered = executeCharacterLifeCommand(initial, { type: 'CHOOSE_CARD_OPTION', expectedRevision: initial.city.revision, cardId: initial.city.society!.pendingCard!.id, option: 'pay' });
  if (!answered.success) throw Error(answered.error.message);
  const result = executeCharacterLifeCommand(answered.next, { type: 'END_WEEK', expectedRevision: answered.next.city.revision, expectedWeek: answered.next.city.world.week });
  if (!result.success || !result.report) throw Error('Demand report failed');
  await page.getByTestId('life-end-week').click(); await expectReport(page, result.report);
});

for (const [name, cause] of [['life-rebellion-last-week', 'rebellion'], ['life-crime-death', 'assassination']] as const) {
  test(`B3 ${cause} is one sealed letter with unchanged fall behavior`, async ({ page }) => {
    const initial = await fixture(name), slot = 'haven.character-life-session-society.checkpoint.v1';
    await page.goto('/?mode=world-life'); await importLife(page, initial); await go(page, 'session');
    await page.getByRole('button', { name: 'Save locally', exact: true }).click();
    await go(page, 'city'); await page.getByTestId('life-end-week').click();
    const letter = page.locator('[data-fallen-letter]');
    await expect(letter).toHaveCount(1);
    await expect(letter.locator('[data-fallen-seal]')).toHaveAttribute('aria-hidden', 'true');
    await expect(letter.getByRole('heading', { level: 1 })).toHaveText(END_SCREEN_COPY[cause].title);
    await expect(letter.locator('p')).toHaveText(`${END_SCREEN_COPY[cause].text} You ruled for ${initial.city.world.week} weeks.`);
    await expect(page.getByRole('button')).toHaveText(['New Game']);
    await expect(letter.getByRole('button')).toHaveClass(/ledger-wax/);
    expect(await page.evaluate(key => localStorage.getItem(key), slot)).toBeNull();
    await fit(page);
    await letter.getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Character Creation', exact: true })).toBeVisible();
  });
}
