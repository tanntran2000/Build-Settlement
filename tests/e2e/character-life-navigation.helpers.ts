import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState, TRIAL_BUILDINGS, WEEKLY_RESOURCE_KEYS, type CharacterLifeSessionState, type TileTrialReport } from '../../packages/core/src/index.ts';
import { serializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
import type { LifeDestination } from '../../packages/ui/src/character-life-navigation.ts';

export function makeLife(seed = 12345): CharacterLifeSessionState {
  const result = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  expect(result.success).toBe(true);
  if (!result.success) throw new Error(result.error.message);
  expect(isCharacterLifeSessionState(result.value)).toBe(true);
  return result.value;
}

export const charactersView = (page: Page) => page.locator('[data-life-view="characters"]');
export const characterWindow = (page: Page) => charactersView(page).getByRole('region', { name: 'Character window', exact: true });
export async function selectPerson(page: Page, id: string) {
  await go(page, 'characters');
  await charactersView(page).getByTestId(`character-${id}`).click();
  await expect(characterWindow(page)).toHaveAttribute('data-character-id', id);
  return characterWindow(page);
}

export async function selectArea(page: Page, name: string) {
  const tab = characterWindow(page).getByRole('tab', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  return characterWindow(page).getByRole('tabpanel');
}

export async function expectOneCharacterWindow(page: Page) {
  const characters = charactersView(page);
  await expect(characters.getByRole('tablist')).toHaveCount(1);
  await expect(characters.getByRole('tab')).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
  await expect(characters.getByRole('tabpanel')).toHaveCount(1);
  expect(await page.locator('[role=tabpanel]').count()).toBe(1);
}

export async function go(page: Page, destination: LifeDestination): Promise<void> {
  const name = destination[0].toUpperCase() + destination.slice(1);
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('button', { name, exact: true }).click();
  await expect(page.locator(`[data-life-view="${destination}"]`)).toBeVisible();
}

export async function importLife(page: Page, session: CharacterLifeSessionState): Promise<void> {
  const encoded = serializeCharacterLifeSave(session);
  expect(encoded.success).toBe(true);
  if (!encoded.success) throw new Error(encoded.error.message);
  const inGame = await page.getByTestId('life-shell').count() > 0;
  if (inGame) await go(page, 'session');
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'life.json', mimeType: 'application/json', buffer: Buffer.from(encoded.text) });
  await expect(page.getByTestId('life-shell')).toBeVisible();
  if (inGame) await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Checkpoint imported. Planning restored.');
}

export async function exportLife(page: Page): Promise<CharacterLifeSessionState> {
  expect(await page.getByTestId('life-end-week').getAttribute('aria-disabled')).toBe('false');
  await go(page, 'session');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^haven-world-life-week-\d+\.json$/);
  const state = JSON.parse(await readFile((await download.path())!, 'utf8')).state;
  expect(isCharacterLifeSessionState(state)).toBe(true);
  return state;
}

// Independent integer formatter: report expectations must not share the production formatter.
export function reportUnits(value: number): string {
  const digits = String(Math.abs(value)).padStart(4, '0');
  const fraction = digits.slice(-3).replace(/0+$/, '');
  return `${value < 0 ? '-' : ''}${digits.slice(0, -3)}${fraction ? `.${fraction}` : ''}`;
}

// Selectively adapted from QOL 8c8505f: fixture data only, no historical verdicts.
export function reportFixture(kind: 'shortage' | 'zero' | 'precision' | 'service' | 'empty'): CharacterLifeSessionState {
  const s = makeLife(), settlement = s.city.world.settlements[s.city.world.activeSettlementId!];
  if (kind === 'shortage') {
    settlement.inventory.food = 0; settlement.inventory.wheat = 0;
    for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
  } else if (kind === 'zero') {
    for (const cohort of settlement.cohorts) cohort.count = 0;
    for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
    settlement.inventory.gold = 0;
  } else if (kind === 'precision') {
    settlement.inventory.gold = 100001; settlement.inventory.wheat = 100001;
    settlement.inventory.food = 1;
    s.city.tiles.find(t => t.id === 'field-1')!.building!.workers = 0;
    s.city.tiles.find(t => t.id === 'plain-1')!.building!.workers = 1;
  } else if (kind === 'service') {
    for (const [id, operation, workers] of [['forest-1', 'logging', 2], ['ore-1', 'mine', 1], ['plain-2', 'goods', 1], ['plain-3', 'market', 0]] as const) {
      const typeId = Object.entries(TRIAL_BUILDINGS).find(([, d]) => d.operation === operation)![0];
      s.city.tiles.find(t => t.id === id)!.building = { typeId, level: 1, workers, enabled: true };
    }
  } else {
    for (const tile of s.city.tiles) if (tile.building) Object.assign(tile.building, { enabled: false, workers: 0 });
  }
  expect(isCharacterLifeSessionState(s)).toBe(true);
  return s;
}

export const reportRegion = (page: Page) => page.locator('[data-life-view="reports"] [aria-label="Weekly city report"]');

// Read the complete report from rendered text, including the calculation disclosure.
export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {
  const panel = reportRegion(page), u = reportUnits;
  await expect(panel.getByRole('heading', { name: `Week ${expected.week} report`, exact: true })).toBeVisible();
  for (const name of ['Needs and services', 'Gold and upkeep', 'Population and happiness']) await expect(panel.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(panel.getByText(`Food consumed: ${u(expected.foodConsumedMilli)} / ${u(expected.foodDemandMilli)}.`, { exact: true })).toBeVisible();
  await expect(panel.getByText(`Food unmet: ${u(expected.foodDemandMilli - expected.foodConsumedMilli)}.`, { exact: true })).toBeVisible();
  await expect(panel.getByText(`Goods unmet: ${u(expected.goods.demandMilli - expected.goods.servedMilli)}.`, { exact: true })).toBeVisible();
  const goods = panel.getByTestId('trial-goods');
  await expect(goods).toHaveText(`Goods service: ${u(expected.goods.servedMilli)} / ${u(expected.goods.demandMilli)} · ${expected.goods.fulfillmentBps / 100}% ${expected.goods.demandMilli === 0 ? '· No demand' : 'fulfilled'}. Materials used once: ${u(expected.goods.woodUsed)} Wood, ${u(expected.goods.ironUsed)} Iron. Revenue: ${u(expected.goods.revenueMilli)} Gold.`);
  const tax = panel.getByText(/^Tax:/);
  await expect(tax).toHaveText(`Tax: ${u(expected.taxMilli)} Gold. Upkeep covered: ${u(expected.upkeepPaidMilli)} Gold; unfunded: ${u(expected.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: ${u(expected.farmBatchGoldMilli)} Gold; extra Farm upkeep: ${u(expected.farmExtraUpkeepMilli)} Gold.`);
  await expect(tax).toBeVisible();
  const happiness = panel.getByText(/^Happiness:/);
  await expect(happiness).toHaveText(`Happiness: ${expected.happinessBefore} → ${expected.happinessAfter}.`);
  const table = panel.getByRole('table', { name: 'Weekly stock ledger', exact: true });
  await expect(table.getByRole('columnheader')).toHaveText(['Stock', 'Before', 'Stock change', 'After']);
  for (const th of await table.getByRole('columnheader').all()) await expect(th).toHaveAttribute('scope', 'col');
  const before = {} as TileTrialReport['before'], after = {} as TileTrialReport['after'];
  const milli = (text: string) => Math.round(Number(text) * 1000);
  for (const key of WEEKLY_RESOURCE_KEYS) {
    const row = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: key, exact: true }) });
    await expect(row.getByRole('rowheader')).toHaveAttribute('scope', 'row');
    await expect(row.locator('th,td')).toHaveText([key, u(expected.before[key]), u(expected.after[key] - expected.before[key]), u(expected.after[key])]);
    const cells = await row.getByRole('cell').allTextContents();
    before[key] = milli(cells[0]); after[key] = milli(cells[2]);
    expect(milli(cells[1])).toBe(after[key] - before[key]);
  }
  const activity = panel.locator('details').filter({ has: page.getByText('Building activity', { exact: true }) });
  const calculation = panel.locator('details').filter({ has: page.getByText('How this is calculated', { exact: true }) });
  const activityOpen = await activity.getAttribute('open') !== null, calculationOpen = await calculation.getAttribute('open') !== null;
  if (!activityOpen) await activity.locator('summary').click();
  await expect(activity.locator('li')).toHaveText([...expected.activities]);
  if (!expected.activities.length) await expect(activity.getByText('No building activity recorded.', { exact: true })).toBeVisible();
  if (!calculationOpen) await calculation.locator('summary').click();
  await expect(calculation.getByText('Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.', { exact: true })).toBeVisible();
  await expect(calculation.getByText(/^TRIAL: tax /)).toBeVisible();
  await expect(calculation.getByText(/^Goods earns /)).toBeVisible();
  const g = (await goods.textContent())!.match(/Goods service: ([\d.]+) \/ ([\d.]+) · ([\d.]+)% .*Materials used once: ([\d.]+) Wood, ([\d.]+) Iron. Revenue: ([\d.]+) Gold\./)!;
  const t = (await tax.textContent())!.match(/[\d.]+(?= Gold)/g)!, h = (await happiness.textContent())!.match(/\d+/g)!;
  const food = (await panel.getByText(/^Food consumed:/).textContent())!.match(/[\d.]+/g)!;
  const actual: TileTrialReport = {
    week: Number((await panel.getByRole('heading', { name: /^Week \d+ report$/ }).textContent())!.match(/\d+/)![0]), before, after,
    taxMilli: milli(t[0]), upkeepPaidMilli: milli(t[1]), unpaidUpkeepMilli: milli(t[2]), farmBatchGoldMilli: milli(t[3]), farmExtraUpkeepMilli: milli(t[4]),
    foodConsumedMilli: milli(food[0]), foodDemandMilli: milli(food[1]), happinessBefore: Number(h[0]), happinessAfter: Number(h[1]),
    goods: { servedMilli: milli(g[1]), demandMilli: milli(g[2]), fulfillmentBps: Math.round(Number(g[3]) * 100), woodUsed: milli(g[4]), ironUsed: milli(g[5]), revenueMilli: milli(g[6]) },
    activities: await activity.locator('li').allTextContents(),
  };
  if (expected.immigration) {
    const i = expected.immigration;
    const population = panel.getByTestId('trial-immigration');
    await expect(population).toHaveText(`Population: ${i.populationBefore} → ${i.populationAfter} · ${i.arrivals} arrivals · Available next week.`);
    const detail = calculation.getByText(/^Immigration target:/);
    await expect(detail).toHaveText(`Immigration target: ${i.target}. Useful worker slots: ${i.usefulWorkerSlots}. Renewable Food: ${u(i.renewableFoodMilli)}. Reason: ${i.reason}.`);
    const p = (await population.textContent())!.match(/\d+/g)!, d = (await detail.textContent())!.match(/Immigration target: (\d+). Useful worker slots: (\d+). Renewable Food: ([\d.]+). Reason: ([\w-]+)\./)!;
    actual.immigration = { populationBefore: Number(p[0]), populationAfter: Number(p[1]), arrivals: Number(p[2]), target: Number(d[1]), usefulWorkerSlots: Number(d[2]), renewableFoodMilli: milli(d[3]), reason: d[4] as typeof i.reason };
  } else await expect(panel.getByTestId('trial-immigration')).toHaveCount(0);
  if (!activityOpen) await activity.locator('summary').click();
  if (!calculationOpen) await calculation.locator('summary').click();
  expect(actual).toEqual(expected);
  return actual;
}

// Include hidden destinations and live form properties; exclude only checkpoint feedback and its error log.
export async function lifeUiSnapshot(page: Page) {
  return page.getByTestId('life-shell').evaluate(shell => {
    const copy = shell.cloneNode(true) as HTMLElement;
    copy.querySelectorAll(':scope > aside > [role="alert"], [aria-label="Planning checkpoints"] [role="status"], [aria-label="Error log"]').forEach(node => node.remove());
    return {
      markup: copy.outerHTML,
      controls: [...shell.querySelectorAll('input:not([type="file"]),select')].map(node => ({ id: node.id, value: (node as HTMLInputElement).value, disabled: (node as HTMLInputElement).disabled })),
    };
  });
}
