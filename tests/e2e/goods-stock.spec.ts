import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { GOODS_STOCK_RULESET } from '../../packages/core/src/index.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { expectReport, exportLife, go, importLife, keyActivate, makeLife, selectArea, selectPerson } from './character-life-navigation.helpers.ts';

const fixtures = 'packages/persistence/src/__tests__/fixtures/legacy-v1';
const modes = [
  { mode: 'population', fixture: 'population', oldKey: 'haven.tile-population.checkpoint.v1', newKey: 'haven.tile-population-goods.checkpoint.v1' },
  { mode: 'world', fixture: 'world', oldKey: 'haven.world-session.checkpoint.v1', newKey: 'haven.world-session-goods.checkpoint.v1' },
  { mode: 'world-npc', fixture: 'npc', oldKey: 'haven.world-npc-session.checkpoint.v1', newKey: 'haven.world-npc-session-goods.checkpoint.v1' },
  { mode: 'world-life', fixture: 'life', oldKey: 'haven.character-life-session.checkpoint.v1', newKey: 'haven.character-life-session-goods.checkpoint.v1' },
];
async function exportEnvelope(page: Page) {
  if (await page.getByTestId('life-shell').count()) await go(page, 'session');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
}
async function createLife(page: Page) {
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Synthetic Keeper');
  await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await page.getByRole('button', { name: 'Create character', exact: true }).click();
}
for (const c of modes) test(`${c.mode}: new opening, click-only generation slots, explicit legacy continuation`, async ({ page }) => {
  const bytes = await readFile(`${fixtures}/${c.fixture}.json`, 'utf8');
  await page.addInitScript(({ oldKey, newKey, bytes }) => {
    localStorage.setItem(oldKey, bytes);
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    const calls: string[][] = [];
    Object.assign(window, { goodsCalls: calls, goodsRead: (key: string) => get.call(localStorage, key) });
    Storage.prototype.getItem = function (key) { if ([oldKey, newKey].includes(key)) calls.push(['get', key]); return get.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if ([oldKey, newKey].includes(key)) calls.push(['set', key]); set.call(this, key, value); };
  }, { ...c, bytes });
  await page.goto(`/?mode=${c.mode}`);
  if (c.mode === 'world-life') await createLife(page);
  const fresh = await exportEnvelope(page), city = fresh.state.city ?? fresh.state;
  expect(fresh.cityRulesetId ?? fresh.rulesetId).toBe(GOODS_STOCK_RULESET);
  expect(city.world.settlements.settlement_haven_01.inventory).toMatchObject({ gold: 45000, food: 20000, wood: 8000, iron: 4000 });
  expect(city.goodsStock).toEqual({ rulesetId: GOODS_STOCK_RULESET, amountMilli: 10000 });
  expect(city.tiles.find((t: { id: string }) => t.id === 'plain-2').building).toEqual({ typeId: 'market', level: 1, workers: 0, enabled: true });
  const calls = () => page.evaluate(() => (window as unknown as { goodsCalls: string[][] }).goodsCalls);
  expect(await calls()).toEqual([]);
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  expect(await calls()).toEqual([['get', c.newKey], ['set', c.newKey]]);
  await page.getByRole('button', { name: 'Continue old-rules checkpoint', exact: true }).click();
  const legacy = await exportEnvelope(page), oldCity = legacy.state.city ?? legacy.state;
  expect(legacy.cityRulesetId ?? legacy.rulesetId).toBe('tile-population-01');
  expect(oldCity.world.settlements.settlement_haven_01.inventory).toMatchObject({ gold: 30000, food: 4000 });
  expect(oldCity).not.toHaveProperty('goodsStock');
  expect(oldCity.tiles.find((t: { id: string }) => t.id === 'plain-2').building).toBeNull();
  expect({ ...legacy.state, ...('city' in legacy.state ? { city: { ...oldCity, revision: 0 } } : { revision: 0 }) }).toEqual(JSON.parse(bytes).state);
  expect(await calls()).toEqual([['get', c.newKey], ['set', c.newKey], ['get', c.oldKey]]);
  if (c.mode === 'world-life') {
    const person = await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
    await expect(person.getByLabel('Manager post', { exact: false }).locator('option')).toHaveCount(2);
    await go(page, 'session');
  }
  // Continue the captured legacy week in the actual UI, retaining its old report.
  const baseline = JSON.parse(await readFile(`${fixtures}/${c.fixture}-continuation.json`, 'utf8')).result;
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  if (c.mode === 'world-life') await expectReport(page, baseline.report);
  else {
    await expect(page.getByTestId('trial-goods')).toContainText('Goods service: 0 / 2');
    await expect(page.getByTestId('trial-goods')).toContainText('Revenue: 0 Gold.');
    await expect(page.getByTestId('goods-stock-flow')).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  const continued = await exportEnvelope(page), continuedCity = continued.state.city ?? continued.state;
  const expectedCity = baseline.next?.city ?? baseline.nextState;
  expect({ ...continuedCity, revision: expectedCity.revision, phase: expectedCity.phase }).toEqual(expectedCity);
  await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
  const restored = await exportEnvelope(page);
  expect((restored.state.city ?? restored.state).goodsStock.amountMilli).toBe(10000);
  await page.evaluate(key => localStorage.setItem(key, '{broken'), c.newKey);
  await page.getByRole('button', { name: 'Continue locally', exact: true }).click();
  await expect(page.getByRole('alert').last()).toContainText('left unchanged');
  expect((await exportEnvelope(page)).state).toEqual(restored.state);
  expect(await page.evaluate(key => (window as unknown as { goodsRead: (key: string) => string }).goodsRead(key), c.oldKey)).toBe(bytes);
});

for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 900 }]) test(`Goods five-week report and navigation parity at ${viewport.width}px`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.goto('/?mode=world-life');
  let session = makeLife(20261028, GOODS_STOCK_RULESET);
  await importLife(page, session);
  await page.getByText('Goods requirements', { exact: true }).click();
  await expect(page.getByTestId('trial-stock-goods')).toHaveText('10');
  const before = await exportLife(page);
  for (const destination of ['city', 'characters', 'help', 'session'] as const) await go(page, destination);
  expect(await exportLife(page)).toEqual(before);
  const person = await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await expect(person.getByLabel('Manager post', { exact: false }).locator('option')).toHaveText(['Manager — Farm (field-1)', 'Manager — Food Processor (plain-1)', 'Manager — Market (plain-2)']);
  await go(page, 'help');
  await page.getByText('Weekly rules', { exact: true }).click();
  await expect(page.getByText(/15 Gold for five baseline operating weeks/)).toBeVisible();
  let debit = 0;
  for (let week = 1; week <= 5; week++) {
    const result = executeCharacterLifeCommand(session, { type: 'END_WEEK', expectedRevision: session.city.revision, expectedWeek: session.city.world.week });
    if (!result.success) throw Error(result.error.message);
    await keyActivate(page, page.getByTestId('life-end-week'));
    const report = await expectReport(page, result.report!);
    debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;
    expect(report.unpaidUpkeepMilli).toBe(0); expect(report.goodsStock!.closingMilli).toBe(10000 - week * 2000);
    if (week === 5) {
      await page.getByRole('dialog', { name: 'Report', exact: true }).evaluate(node => { node.scrollTop = 0; });
      await page.screenshot({ path: info.outputPath('goods-week5-report.png') });
    }
    await keyActivate(page, page.getByRole('button', { name: 'Plan next week', exact: true }));
    const next = executeCharacterLifeCommand(result.next, { type: 'NEXT_WEEK', expectedRevision: result.next.city.revision });
    if (!next.success) throw Error(next.error.message); session = next.next;
    expect(await exportLife(page)).toEqual(session);
  }
  expect(debit).toBe(15000);
  await go(page, 'city'); await expect(page.getByTestId('trial-stock-goods')).toHaveText('0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('goods-week5-city.png'), fullPage: true });
});
