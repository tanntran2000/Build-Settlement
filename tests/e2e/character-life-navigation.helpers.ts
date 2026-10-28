import { expect, type Locator, type Page } from '@playwright/test';
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

// Traverse the real tab order; never manufacture focus or skip hidden-view checks.
export async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  for (let step = 0; step < 160; step++) {
    if (await target.evaluate(node => node === document.activeElement)) return;
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[hidden], [aria-hidden="true"]'))).toBe(false);
  }
  throw Error(`Control unreachable after 160 Tabs: ${await target.getAttribute('id') ?? await target.textContent()}`);
}

export async function keyActivate(page: Page, target: Locator) {
  await tabTo(page, target); await page.keyboard.press('Enter');
}

export async function keyGo(page: Page, destination: LifeDestination) {
  if (await page.locator('dialog:modal').count()) await keyActivate(page, page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }));
  await keyActivate(page, page.locator(`#life-nav-${destination === 'reports' ? 'report' : destination}`));
  await expect(destination === 'reports' ? page.getByRole('dialog', { name: 'Report', exact: true }) : page.locator(`[data-life-view="${destination}"]`)).toBeVisible();
}

export async function keyText(page: Page, target: Locator, value: string) {
  await tabTo(page, target); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type(value);
}

export async function keyPost(page: Page, target: Locator, value: string) {
  await tabTo(page, target);
  const values = await target.locator('option').evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value));
  expect(values).toContain(value);
  await page.keyboard.press('Home');
  for (let i = 0; i < values.indexOf(value); i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(target).toHaveValue(value);
}

export async function watchTurnStatus(page: Page) {
  await page.locator('#life-modal-status').evaluate(node => {
    const texts: string[] = [];
    const modal: boolean[] = [];
    const watched = node as HTMLElement & { mutations: string[]; modalAtMutation: boolean[] };
    watched.mutations = texts; watched.modalAtMutation = modal;
    new MutationObserver(() => { texts.push(node.textContent ?? ''); modal.push(!!node.closest('dialog:modal')); }).observe(node, { childList: true, characterData: true, subtree: true });
  });
}

export async function turnStatuses(page: Page) {
  return page.locator('#life-modal-status').evaluate(node => (node as HTMLElement & { mutations: string[] }).mutations);
}
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
  if (await page.locator('dialog:modal').count()) await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator(`#life-nav-${destination === 'reports' ? 'report' : destination}`).click();
  await expect(destination === 'reports' ? page.getByRole('dialog', { name: 'Report', exact: true }) : page.locator(`[data-life-view="${destination}"]`)).toBeVisible();
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
  expect(download.suggestedFilename()).toBe(`haven-world-life-week-${state.city.world.week}.json`);
  return state;
}

// Independent integer formatter: report expectations must not share the production formatter.
export function reportUnits(value: number): string {
  expect(Number.isSafeInteger(value)).toBe(true);
  const milli = BigInt(Math.abs(value));
  const fraction = String(milli % 1000n).padStart(3, '0').replace(/0+$/, '');
  return `${value < 0 || Object.is(value, -0) ? '-' : ''}${(milli / 1000n).toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`;
}

export function reportMilli(text: string): number {
  expect(text).toMatch(/^-?(?:0|[1-9]\d{0,2}(?:,\d{3})*)(?:\.\d{1,3})?$/);
  const [whole, fraction = ''] = text.replace(/^-/, '').replaceAll(',', '').split('.');
  const milli = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'));
  expect(milli <= BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  return (text.startsWith('-') ? -1 : 1) * Number(milli);
}

// Independent UI oracles; never import the production calendar or fulfillment projection.
export function reportWeek(text: string): number {
  const match = text.match(/^Week (\d+) · Year (\d+) report$/);
  expect(match).not.toBeNull();
  const weekOfYear = Number(match![1]), year = Number(match![2]);
  expect(Number.isSafeInteger(year) && year >= 1).toBe(true);
  expect(Number.isInteger(weekOfYear) && weekOfYear >= 1 && weekOfYear <= 40).toBe(true);
  const absolute = (year - 1) * 40 + weekOfYear;
  expect(Number.isSafeInteger(absolute)).toBe(true);
  return absolute;
}

export function reportFulfillment(supplied: number, demand: number): string {
  if (demand === 0) return 'No demand';
  return `${Number(BigInt(supplied) * 10000n / BigInt(demand)) / 100}%`;
}

export const requirementsRegion = (page: Page) => page.getByRole('region', { name: 'City Requirements', exact: true });

export async function expectRequirements(page: Page, report: Readonly<TileTrialReport> | null) {
  const strip = requirementsRegion(page);
  await expect(strip).toBeVisible();
  if (!report) {
    await expect(strip.getByText('No resolved week yet', { exact: true })).toBeVisible();
    expect(await strip.textContent()).not.toContain('%');
    await expect(strip.locator('[data-fulfillment-track]')).toHaveCount(0);
    return;
  }
  const label = strip.getByText(/^Last resolved week:/);
  expect(reportWeek((await label.textContent())!.replace('Last resolved week: ', '') + ' report')).toBe(report.week);
  for (const [key, supplied, demand] of [['food', report.foodConsumedMilli, report.foodDemandMilli], ['goods', report.goods.servedMilli, report.goods.demandMilli]] as const) {
    const row = strip.getByTestId(`life-requirement-${key}`);
    await expect(row).toHaveText(`${reportUnits(supplied)} / ${reportUnits(demand)} · ${reportFulfillment(supplied, demand)}`);
    const track = strip.locator(`[data-fulfillment-track="${key}"]`);
    if (demand === 0) {
      expect(await row.textContent()).not.toContain('%');
      await expect(track).toHaveCount(0);
    } else {
      await expect(track).toHaveAttribute('aria-hidden', 'true');
      await expect(track).toHaveCSS('height', '8px');
      expect(await track.locator('span').evaluate(node => node.style.width)).toBe(reportFulfillment(supplied, demand));
    }
  }
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
    settlement.inventory.wood = 1000001;
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

export const reportRegion = (page: Page) => page.locator('[data-life-window="report"] [aria-label="Weekly city report"]');

// Read the complete report from rendered text, including the calculation disclosure.
export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {
  const panel = reportRegion(page), u = reportUnits;
  const heading = panel.getByRole('heading', { name: /^Week .* report$/ });
  await expect(heading).toBeVisible();
  const absoluteWeek = reportWeek((await heading.textContent())!);
  expect(absoluteWeek).toBe(expected.week);
  for (const name of ['Needs and services', 'Gold and upkeep', 'Population and happiness']) await expect(panel.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(panel.getByText(`Food consumed: ${u(expected.foodConsumedMilli)} / ${u(expected.foodDemandMilli)} · ${reportFulfillment(expected.foodConsumedMilli, expected.foodDemandMilli)}.`, { exact: true })).toBeVisible();
  await expect(panel.getByText(`Food unmet: ${u(expected.foodDemandMilli - expected.foodConsumedMilli)}.`, { exact: true })).toBeVisible();
  await expect(panel.getByText(`Goods unmet: ${u(expected.goods.demandMilli - expected.goods.servedMilli)}.`, { exact: true })).toBeVisible();
  const goods = panel.getByTestId('trial-goods');
  await expect(goods).toHaveText(`Goods service: ${u(expected.goods.servedMilli)} / ${u(expected.goods.demandMilli)} · ${expected.goods.demandMilli === 0 ? 'No demand' : `${expected.goods.fulfillmentBps / 100}%`}. Materials used once: ${u(expected.goods.woodUsed)} Wood, ${u(expected.goods.ironUsed)} Iron. Revenue: ${u(expected.goods.revenueMilli)} Gold.`);
  const tax = panel.getByText(/^Tax:/);
  await expect(tax).toHaveText(`Tax: ${u(expected.taxMilli)} Gold. Upkeep covered: ${u(expected.upkeepPaidMilli)} Gold; unfunded: ${u(expected.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: ${u(expected.farmBatchGoldMilli)} Gold; extra Farm upkeep: ${u(expected.farmExtraUpkeepMilli)} Gold.`);
  await expect(tax).toBeVisible();
  const happiness = panel.getByText(/^Happiness:/);
  await expect(happiness).toHaveText(`Happiness: ${expected.happinessBefore} → ${expected.happinessAfter}.`);
  const table = panel.getByRole('table', { name: 'Weekly stock ledger', exact: true });
  await expect(table.getByRole('columnheader')).toHaveText(['Stock', 'Before', 'Stock change', 'After']);
  for (const th of await table.getByRole('columnheader').all()) await expect(th).toHaveAttribute('scope', 'col');
  const before = {} as TileTrialReport['before'], after = {} as TileTrialReport['after'];
  const milli = reportMilli;
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
  const g = (await goods.textContent())!.match(/Goods service: ([\d,]+(?:\.\d+)?) \/ ([\d,]+(?:\.\d+)?) · (No demand|[\d.]+%). Materials used once: ([\d,]+(?:\.\d+)?) Wood, ([\d,]+(?:\.\d+)?) Iron. Revenue: ([\d,]+(?:\.\d+)?) Gold\./)!;
  const t = (await tax.textContent())!.match(/[\d,]+(?:\.\d+)?(?= Gold)/g)!, h = (await happiness.textContent())!.match(/\d+/g)!;
  const food = (await panel.getByText(/^Food consumed:/).textContent())!.match(/[\d,]+(?:\.\d+)?/g)!;
  if (expected.goods.demandMilli === 0) {
    expect(g[3]).toBe('No demand');
    expect(milli(g[1])).toBe(0); expect(milli(g[2])).toBe(0);
    expect(await goods.textContent()).not.toContain('%');
  }
  if (expected.foodDemandMilli === 0) {
    const foodRow = panel.getByText(/^Food consumed:/);
    await expect(foodRow).toContainText('No demand');
    expect(await foodRow.textContent()).not.toContain('%');
    expect(food.slice(0, 2).map(milli)).toEqual([0, 0]);
  }
  // Zero-demand BPS comes only from the executor, not an invented UI percentage.
  const actual: TileTrialReport = {
    week: absoluteWeek, before, after,
    taxMilli: milli(t[0]), upkeepPaidMilli: milli(t[1]), unpaidUpkeepMilli: milli(t[2]), farmBatchGoldMilli: milli(t[3]), farmExtraUpkeepMilli: milli(t[4]),
    foodConsumedMilli: milli(food[0]), foodDemandMilli: milli(food[1]), happinessBefore: Number(h[0]), happinessAfter: Number(h[1]),
    goods: { servedMilli: milli(g[1]), demandMilli: milli(g[2]), fulfillmentBps: expected.goods.demandMilli === 0 ? expected.goods.fulfillmentBps : milli(g[3].slice(0, -1)) / 10, woodUsed: milli(g[4]), ironUsed: milli(g[5]), revenueMilli: milli(g[6]) },
    activities: await activity.locator('li').allTextContents(),
  };
  if (expected.immigration) {
    const i = expected.immigration;
    const population = panel.getByTestId('trial-immigration');
    await expect(population).toHaveText(`Population: ${i.populationBefore} → ${i.populationAfter} · ${i.arrivals} arrivals · Available next week.`);
    const detail = calculation.getByText(/^Immigration target:/);
    await expect(detail).toHaveText(`Immigration target: ${i.target}. Useful worker slots: ${i.usefulWorkerSlots}. Renewable Food: ${u(i.renewableFoodMilli)}. Reason: ${i.reason}.`);
    const p = (await population.textContent())!.match(/\d+/g)!, d = (await detail.textContent())!.match(/Immigration target: (\d+). Useful worker slots: (\d+). Renewable Food: ([\d,]+(?:\.\d+)?). Reason: ([\w-]+)\./)!;
    actual.immigration = { populationBefore: Number(p[0]), populationAfter: Number(p[1]), arrivals: Number(p[2]), target: Number(d[1]), usefulWorkerSlots: Number(d[2]), renewableFoodMilli: milli(d[3]), reason: d[4] as typeof i.reason };
  } else await expect(panel.getByTestId('trial-immigration')).toHaveCount(0);
  if (!activityOpen) await activity.locator('summary').click();
  if (!calculationOpen) await calculation.locator('summary').click();
  expect(actual).toEqual(expected);
  return actual;
}

// Include hidden destinations, live controls and the entire diagnostic region.
export async function lifeUiSnapshot(page: Page) {
  await expect(page.locator('[aria-label="Error log"] [role="status"]').filter({ hasText: /^Saving recent errors/ })).toHaveCount(0);
  return page.getByTestId('life-shell').evaluate(shell => {
    const copy = shell.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-life-error], [aria-label="Planning checkpoints"] [role="status"]').forEach(node => node.remove());
    return {
      markup: copy.outerHTML,
      controls: [...shell.querySelectorAll('input:not([type="file"]),select')].map(node => ({ id: node.id, value: (node as HTMLInputElement).value, disabled: (node as HTMLInputElement).disabled })),
    };
  });
}

// A current rejection may log exactly one RUNTIME/INVALID_COMMAND; superseded reads get no exception.
export async function expectCheckpointRejectionPreservesUi(page: Page, before: Awaited<ReturnType<typeof lifeUiSnapshot>>, expectedAbsoluteWeek: number) {
  const after = await lifeUiSnapshot(page);
  const { version } = JSON.parse(await readFile(new URL('../../packages/ui/package.json', import.meta.url), 'utf8'));
  const normalized = await page.evaluate(({ before, after, version, expectedAbsoluteWeek }) => {
    const prior = document.createElement('div'), current = document.createElement('div');
    prior.innerHTML = before; current.innerHTML = after;
    const oldLog = prior.querySelector('[aria-label="Error log"]')!, newLog = current.querySelector('[aria-label="Error log"]')!;
    const check = (condition: boolean, message: string) => { if (!condition) throw new Error(`Unexpected diagnostic delta: ${message}`); };
    const canonical = (element: Element) => {
      const copy = element.cloneNode(true);
      const trim = (node: Node) => { for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.COMMENT_NODE || child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) child.remove(); else trim(child);
      } };
      trim(copy); return (copy as Element).outerHTML;
    };
    const oldEntries = [...oldLog.querySelectorAll('ol > li')], newEntries = [...newLog.querySelectorAll('ol > li')];
    const last = newEntries.at(-1)!;
    check(!!last, 'missing checkpoint entry');
    const paragraphs = [...last.children];
    check(paragraphs.length === 5 && paragraphs.every(node => node.tagName === 'P'), 'entry structure');
    const heading = 'validation · INVALID_COMMAND', message = 'The action input was rejected. Check the form and try again.', context = `weekly · RUNTIME · Week ${expectedAbsoluteWeek}`;
    check(paragraphs[0].textContent === heading && paragraphs[1].textContent === message && paragraphs[2].textContent === context, 'checkpoint code/message/context');
    const times = [...last.querySelectorAll('time')];
    check(times.length === 2 && times.every(node => node.textContent === node.getAttribute('datetime')), 'UTC representation');
    const first = times[0].textContent!, latest = times[1].textContent!;
    check(Number.isFinite(Date.parse(latest)) && new Date(latest).toISOString() === latest && Date.now() - Date.parse(latest) >= 0 && Date.now() - Date.parse(latest) < 10000, 'checkpoint UTC');
    const oldLast = oldEntries.at(-1), oldParagraphs = oldLast ? [...oldLast.children] : [];
    const coalesced = !!oldLast && oldParagraphs[0].textContent === heading && oldParagraphs[2].textContent === context && oldParagraphs[4].textContent!.endsWith(` · App version: ${version} · Build unavailable`);
    const oldCount = coalesced ? Number(oldParagraphs[4].textContent!.match(/^Occurrences: (\d+)/)![1]) : 0;
    const count = Math.min(Number.MAX_SAFE_INTEGER, oldCount + 1);
    check(paragraphs[4].textContent === `Occurrences: ${count} · App version: ${version} · Build unavailable`, 'occurrence/version');
    const history = coalesced ? oldEntries.slice(0, -1) : oldEntries.slice(-4);
    check(newEntries.length === history.length + 1, 'extra/missing diagnostic group');
    history.forEach((entry, index) => check(canonical(entry) === canonical(newEntries[index]), 'pre-existing history'));
    if (coalesced) {
      const expected = oldLast!.cloneNode(true) as Element;
      const lastTime = expected.querySelectorAll('time')[1];
      lastTime.textContent = latest; lastTime.setAttribute('datetime', latest);
      expected.children[4].textContent = `Occurrences: ${count} · App version: ${version} · Build unavailable`;
      check(canonical(expected) === canonical(last), 'coalesced entry changed beyond last UTC/count');
    } else {
      check(first === latest, 'new entry UTC');
      check(paragraphs[0].children.length === 1 && paragraphs[0].firstElementChild?.tagName === 'STRONG' && paragraphs[1].children.length === 0 && paragraphs[2].children.length === 0 && paragraphs[4].children.length === 0, 'new entry content');
      check([...paragraphs[3].children].map(node => node.tagName).join(',') === 'TIME,BR,TIME' && paragraphs[3].textContent === `First UTC: ${first}Last UTC: ${latest}`, 'new entry dates');
    }
    const oldFrame = oldLog.cloneNode(true) as Element, newFrame = newLog.cloneNode(true) as Element;
    const paragraph = (frame: Element, text: string) => [...frame.children].find(node => node.tagName === 'P' && node.textContent === text);
    const records = newFrame.querySelector('ol')!;
    check(records.getAttribute('aria-label') === 'Recorded errors', 'records label');
    const oldRecords = oldFrame.querySelector('ol');
    if (oldRecords) oldRecords.replaceChildren();
    else {
      const empty = paragraph(oldFrame, 'No errors recorded.'); check(!!empty, 'empty records');
      empty!.replaceWith(records.cloneNode(false));
    }
    records.replaceChildren();
    if (!oldEntries.length) (oldFrame.querySelector('button') as HTMLButtonElement).disabled = false;
    if (!paragraph(oldFrame, 'Saved locally in this browser.') && !paragraph(oldFrame, 'Not saved — this tab only. Download before closing.')) {
      const saved = paragraph(newFrame, 'Saved locally in this browser.'); check(!!saved, 'persistence transition'); saved!.remove();
    }
    for (const text of ['Download requested.', 'Unable to request download. Your error log is unchanged.']) {
      check(!paragraph(newFrame, text), 'new checkpoint must clear previous download feedback');
      paragraph(oldFrame, text)?.remove();
    }
    check(canonical(oldFrame) === canonical(newFrame), 'diagnostic status/control/frame');
    // Replace only after independently verifying every permitted log change and all unrelated history/UI.
    newLog.replaceWith(oldLog.cloneNode(true));
    return current.firstElementChild!.outerHTML;
  }, { before: before.markup, after: after.markup, version, expectedAbsoluteWeek });
  expect({ ...after, markup: normalized }).toEqual(before);
}
