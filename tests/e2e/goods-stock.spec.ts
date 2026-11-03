import {expect,test} from '@playwright/test';
import {SOCIETY_RULESET} from '../../packages/core/src/index.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {expectReport,exportLife,go,importLife,keyActivate,makeLife,selectArea,selectPerson} from './character-life-navigation.helpers.ts';
for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 900 }]) test(`Society five-week report and navigation parity at ${viewport.width}px`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.goto('/?mode=world-life');
  let session = makeLife(20261028);
  await importLife(page, session);
  await page.getByText('Goods requirements', { exact: true }).click();
  await expect(page.getByTestId('trial-stock-goods')).toHaveText('10');
  const before = await exportLife(page);
  for (const destination of ['city', 'characters', 'help', 'session'] as const) await go(page, destination);
  expect(await exportLife(page)).toEqual(before);
  const person = await selectPerson(page, 'npc_starter_1'); await selectArea(page, 'Work');
  await expect(person.getByLabel('Manager post', { exact: false }).locator('option')).toHaveText(['Manager — Farm (field-1)', 'Manager — Food Processor (plain-1)', 'Manager — Market (spec-1)']);
  await go(page, 'help');
  await page.getByText('Weekly rules', { exact: true }).click();
  await expect(page.getByText(/^TRIAL: each class eats/)).toBeVisible();
  let debit = 0;
  for (let week = 1; week <= 5; week++) {
    const result = executeCharacterLifeCommand(session, { type: 'END_WEEK', expectedRevision: session.city.revision, expectedWeek: session.city.world.week });
    if (!result.success) throw Error(result.error.message);
    await keyActivate(page, page.getByTestId('life-end-week'));
    const report = await expectReport(page, result.report!);
    debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;
    expect(report.unpaidUpkeepMilli).toBe(0); expect(report.goodsStock!.closingMilli).toBe(10000 - week * 1450);
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
  await go(page, 'city'); await expect(page.getByTestId('trial-stock-goods')).toHaveText('2.75');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('goods-week5-city.png'), fullPage: true });
});
