import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {makeLife,importLife,go,exportLife,reportUnits} from './character-life-navigation.helpers.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {societyPopulation} from '../../packages/core/src/index.ts';
async function start(page:Page){await page.goto('/');await importLife(page,makeLife());}

const manage = (page: Page) => page.getByRole('region', { name: 'Manage tile', exact: true });
const checkpoints = (page: Page) => page.getByRole('region', { name: 'Planning checkpoints', exact: true });
const select = (page: Page, id: string) => page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
async function save(page: Page) {
  await go(page,'session');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const result=JSON.parse(await readFile((await (await download).path())!, 'utf8'));await go(page,'city');return result;
}
async function load(page: Page, data: unknown) {
  await go(page,'session');
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Checkpoint imported');
  await go(page,'city');
}
async function nearBottom(page: Page, action: string) {
  const button = page.getByRole('button', { name: action, exact: true });
  await button.scrollIntoViewIfNeeded();
  await button.evaluate(node => window.scrollTo(0, scrollY + node.getBoundingClientRect().bottom - innerHeight + 12));
  return button;
}
async function fullyVisible(page: Page, alert: Locator) {
  await expect(alert).toBeInViewport();
  const box = (await alert.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}

for (const [value, expected] of [
  [8796093022208001, '8,796,093,022,208.001'],
  [Number.MAX_SAFE_INTEGER, '9,007,199,254,740.991'],
] as const) {
  test(`displays exact Gold ${value} without changing its checkpoint integer`, async ({ page }) => {
    await start(page);
    const fixture = await save(page);
    fixture.state.city.world.settlements.settlement_haven_01.inventory.gold = value;
    await load(page, fixture);
    await page.locator('#life-nav-information').click();
    await expect(page.getByTestId('trial-stock-gold')).toHaveText(expected);
    expect((await save(page)).state.city.world.settlements.settlement_haven_01.inventory.gold).toBe(value);
  });
}

const scenarios = [
  { name: 'terrain Build', tile: 'forest-1', type: 'farm', action: 'Build', error: 'Farm requires fertile terrain.', recoveryType: 'logging', cost: { gold: 2000, wood: 0, iron: 0 } },
  { name: 'Gold Build', tile: 'field-2', type: 'farm', action: 'Build', missing: 'gold', error: 'Not enough gold for this action.', cost: { gold: 3000, wood: 1000, iron: 0 } },
  { name: 'Wood Build', tile: 'field-2', type: 'farm', action: 'Build', missing: 'wood', error: 'Not enough wood for this action.', cost: { gold: 3000, wood: 1000, iron: 0 } },
  { name: 'Iron Build', tile: 'plain-2', type: 'processor', action: 'Build', missing: 'iron', error: 'Not enough iron for this action.', cost: { gold: 3000, wood: 2000, iron: 1000 } },
  { name: 'terrain Replace', tile: 'field-1', type: 'logging', action: 'Replace', error: 'Logging Camp requires forest terrain.', recoveryType: 'farm', cost: { gold: 3000, wood: 1000, iron: 0 } },
  { name: 'Gold Upgrade', tile: 'forest-1', type: 'logging', action: 'Upgrade', missing: 'gold', error: 'Not enough gold for this action.', cost: { gold: 4000, wood: 0, iron: 0 } },
];

for (const width of [1280, 390, 320]) {
  for (const scenario of scenarios) {
    test(`${scenario.name} rejection stays contextual at ${width}px and repeated failures preserve state`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 800 });
      await start(page);
      if (scenario.action === 'Upgrade') {
        await page.getByRole('button', { name: 'Build', exact: true }).click();
        await page.getByLabel('Assigned workers (WF)', { exact: true }).fill('2');
        await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
      }
      const recovery = await save(page);
      if (scenario.missing) {
        const poor = structuredClone(recovery);
        poor.state.city.world.settlements.settlement_haven_01.inventory[scenario.missing] = 0;
        await load(page, poor);
      }
      await select(page, scenario.tile);
      await page.getByLabel('Building type').selectOption(scenario.type);
      const before = await save(page);
      for (let attempt = 0; attempt < 3; attempt++) {
        const button = await nearBottom(page, scenario.action);
        await button.click();
        const alert = manage(page).getByRole('alert');
        await expect(alert).toContainText(scenario.error);
        await fullyVisible(page, alert);
        await expect(manage(page).getByRole('alert')).toHaveCount(1);
        await expect(checkpoints(page).getByRole('alert')).toHaveCount(0);
        await expect(button).toHaveAttribute('aria-describedby', 'trial-management-error');
        expect(await button.evaluate(node => document.activeElement === node)).toBe(true);
      }
      expect((await save(page)).state).toEqual(before.state);
      if (scenario.missing) await load(page, recovery);
      await page.getByLabel('Building type').selectOption(scenario.recoveryType ?? scenario.type);
      await page.getByRole('button', { name: scenario.action, exact: true }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);
      const after = await save(page);
      for (const key of ['gold', 'wood', 'iron'] as const) {
        expect(after.state.city.world.settlements.settlement_haven_01.inventory[key]).toBe(recovery.state.city.world.settlements.settlement_haven_01.inventory[key] - scenario.cost[key]);
      }
      expect(after.state.city.tiles.find((tile: { id: string }) => tile.id === scenario.tile).building).toMatchObject({ typeId: scenario.recoveryType ?? scenario.type, level: scenario.action === 'Upgrade' ? 2 : 1 });
    });
  }

  test(`Pause arithmetic rejection is beside its control at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 800 });
    await start(page);
    const fixture = await save(page);
    fixture.state.city.revision = Number.MAX_SAFE_INTEGER - 1;
    await load(page, fixture);
    await select(page, 'field-1');
    const before = await save(page);
    const button = await nearBottom(page, 'Pause');
    await button.click();
    await expect(manage(page).getByRole('alert')).toContainText('safe arithmetic');
    await fullyVisible(page, manage(page).getByRole('alert'));
    await expect(button).toHaveAttribute('aria-describedby', 'trial-management-error');
    expect(await button.evaluate(node => document.activeElement === node)).toBe(true);
    expect((await save(page)).state).toEqual(before.state);
    await select(page, 'plain-1');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('checkpoint errors stay in checkpoints and a valid load clears building feedback', async ({ page }) => {
  await start(page);
  const initial = await save(page);
  await page.getByLabel('Building type').selectOption('farm');
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await expect(manage(page).getByRole('alert')).toContainText('fertile');
  await go(page,'session');
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.locator('[data-life-error][role=alert]')).toBeVisible();
  await expect(page.locator('#trial-management-error')).toHaveCount(1);
  await load(page, initial);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('stock ledger preserves grouped integer milli digits and a negative net',async({page})=>{
 const session=makeLife();const c=session.city.society!.classes;
 Object.assign(c,{free:50,makers:{common:50,elite:0},luminaries:{common:0,elite:0},merchants:{common:0,elite:0}});
 const settlement=session.city.world.settlements[session.city.world.activeSettlementId!];settlement.cohorts[0].count=societyPopulation(session.city.society!);settlement.inventory.gold=Number.MAX_SAFE_INTEGER-3000;
 for(const id of ['field-1','plain-1'])session.city.tiles.find(t=>t.id===id)!.building!.workers=5;
 await page.goto('/');await importLife(page,session);
 const before=await exportLife(page);const result=executeCharacterLifeCommand(before,{type:'END_WEEK',expectedRevision:before.city.revision,expectedWeek:before.city.world.week});if(!result.success||!result.report)throw Error('ledger oracle failed');
 await page.getByTestId('life-end-week').click();const r=result.report;expect(r.after.gold-r.before.gold).toBeLessThan(0);
 const row=page.getByRole('table',{name:'Weekly stock ledger',exact:true}).getByRole('row').filter({has:page.getByRole('rowheader',{name:'gold',exact:true})});
 await expect(row.getByRole('cell')).toHaveText([r.before.gold,r.after.gold-r.before.gold,r.after.gold].map(reportUnits));
});
