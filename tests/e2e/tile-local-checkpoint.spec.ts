import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const KEY = 'haven.tile-trial.checkpoint.v1';
const POPULATION_KEY = 'haven.tile-population.checkpoint.v1';
const MODES = [
  { mode: 'tiles', key: KEY, otherKey: POPULATION_KEY, ruleset: 'tile-trial-01', otherRuleset: 'tile-population-01' },
  { mode: 'population', key: POPULATION_KEY, otherKey: KEY, ruleset: 'tile-population-01', otherRuleset: 'tile-trial-01' },
] as const;
type StorageProbe = { readStored?: (key: string) => string | null; writeStored?: (key: string, text: string) => void; checkpointCalls?: string[][] };
const region = (page: Page) => page.getByRole('region', { name: 'Planning checkpoints', exact: true });
const slot = (page: Page, key: string = KEY) => page.evaluate(key => {
  const read = (window as unknown as StorageProbe).readStored;
  return read ? read(key) : localStorage.getItem(key);
}, key);
const setSlot = (page: Page, text: string, key: string = KEY) => page.evaluate(([key, value]) => {
  const write = (window as unknown as StorageProbe).writeStored;
  if (write) write(key, value); else localStorage.setItem(key, value);
}, [key, text]);
const saveLocally = (page: Page) => page.getByRole('button', { name: 'Save locally', exact: true }).click();
const continueLocally = (page: Page) => page.getByRole('button', { name: 'Continue locally', exact: true }).click();
const gold = (page: Page) => page.getByTestId('trial-stock-gold');
// Lets delayed reads and Svelte updates settle before asserting that nothing changed.
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));

async function checkpoint(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  return readFile((await (await download).path())!, 'utf8');
}
async function importText(page: Page, text: string) {
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'checkpoint.json', mimeType: 'application/json', buffer: Buffer.from(text) });
}
async function build(page: Page, id: string, type: string, workers?: number) {
  await page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
  await page.getByLabel('Building type').selectOption(type);
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  if (workers !== undefined) {
    await page.getByLabel('Assigned workers (WF)').fill(String(workers));
    await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  }
}
async function next(page: Page) {
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
}
async function delayReads(page: Page, reject = false) {
  await page.evaluate(reject => {
    const original = File.prototype.text;
    (window as unknown as { releaseReads: (() => void)[] }).releaseReads = [];
    File.prototype.text = async function () {
      const text = await original.call(this);
      await new Promise<void>((resolve, fail) => (window as unknown as { releaseReads: (() => void)[] }).releaseReads.push(() => reject ? fail(Error('raw/private/error')) : resolve()));
      return text;
    };
  }, reject);
}
const pending = (page: Page, n: number) => page.waitForFunction(n => (window as unknown as { releaseReads: unknown[] }).releaseReads.length === n, n);
const release = (page: Page, n: number) => page.evaluate(n => (window as unknown as { releaseReads: (() => void)[] }).releaseReads[n](), n);

test('saves a multiweek plan locally, continues after reload and resumes the same economics', async ({ page }) => {
  await page.goto('/?mode=tiles'); expect(await slot(page)).toBeNull();
  await build(page, 'forest-1', 'logging', 2); await build(page, 'ore-1', 'mine', 1);
  await build(page, 'plain-2', 'workshop', 1); await build(page, 'plain-3', 'market');
  await next(page); await page.getByRole('button', { name: 'Upgrade', exact: true }).click(); await next(page);
  await page.getByLabel('Building type').selectOption('processor');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByRole('button', { name: 'Select forest-1', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await saveLocally(page); await expect(region(page).getByRole('status')).toHaveText('Saved in this browser.');
  const text = (await slot(page))!, save = JSON.parse(text);
  expect(save).toMatchObject({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-trial-01', state: { phase: 'planning', world: { week: 3 } } });
  expect(await checkpoint(page)).toBe(text);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  const stocks = (await page.getByTestId('trial-stocks').textContent())!, goods = (await page.getByTestId('trial-goods').textContent())!;
  await expect(page.getByRole('button', { name: 'Save locally', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Continue locally', exact: true })).toBeDisabled();

  await page.reload(); await expect(gold(page)).toHaveText('30'); expect(await slot(page)).toBe(text);
  await build(page, 'forest-1', 'logging'); await next(page); expect(await slot(page)).toBe(text);
  await continueLocally(page); await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toHaveCount(0);
  await expect(page.locator('header')).toContainText('Week 3 · Planning');
  await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Paused');
  await expect(page.getByTestId('trial-tile-plain-3')).toContainText('Food Processor');
  await expect(page.getByTestId('trial-tile-ore-1')).toContainText('1 WF');
  const restored = JSON.parse(await checkpoint(page));
  expect(restored.state.world).toEqual(save.state.world); expect(restored.state.tiles).toEqual(save.state.tiles);
  expect(restored.state.happiness).toEqual(save.state.happiness); expect(restored.state.revision).toBeGreaterThan(save.state.revision);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-stocks')).toHaveText(stocks);
  await expect(page.getByTestId('trial-goods')).toHaveText(goods);
  expect(await slot(page)).toBe(text);
});

for (const { mode, key, otherKey, otherRuleset } of MODES) {
test(`explicit save replaces only its own slot and file import never writes it (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); await setSlot(page, '{broken', key); await setSlot(page, 'other-mode-bytes', otherKey);
  await saveLocally(page); await expect(region(page).getByRole('status')).toHaveText('Saved in this browser. Replaced the previous local checkpoint.');
  const first = (await slot(page, key))!; expect(await checkpoint(page)).toBe(first);
  await build(page, 'forest-1', 'logging'); await importText(page, first);
  await expect(region(page).getByRole('status')).toContainText('Checkpoint imported'); expect(await slot(page, key)).toBe(first);
  await build(page, 'forest-1', 'logging'); await saveLocally(page);
  await expect(region(page).getByRole('status')).toContainText('Replaced the previous local checkpoint');
  expect(JSON.parse((await slot(page, key))!).state.tiles.find((t: { id: string }) => t.id === 'forest-1').building.typeId).toBe('logging');
  expect(await slot(page, otherKey)).toBe('other-mode-bytes');
});

// Fresh pages keep state-preservation checks below Chromium's burst-download limit.
for (const kind of ['missing', 'malformed', 'empty object', 'opposite mode', 'version', 'ruleset', 'map', 'negative stock', 'report phase', 'oversize', 'revision overflow'] as const) {
test(`rejects ${kind} while preserving full state and both slots (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); await build(page, 'forest-1', 'logging');
  const valid = JSON.parse(await checkpoint(page)), other = JSON.stringify({ ...valid, rulesetId: otherRuleset });
  await setSlot(page, other, otherKey);
  const variant = (change: (save: typeof valid) => void) => { const save = structuredClone(valid); change(save); return JSON.stringify(save); };
  const text = {
    missing: null, malformed: '{', 'empty object': '{}', 'opposite mode': other,
    version: variant(s => { s.schemaVersion = 2; }), ruleset: variant(s => { s.rulesetId = 'future'; }),
    map: variant(s => { s.state.tiles[0].terrain = 'ore'; }),
    'negative stock': variant(s => { s.state.world.settlements.settlement_haven_01.inventory.gold = -1; }),
    'report phase': variant(s => { s.state.phase = 'report'; }), oversize: ' '.repeat(1024 * 1024 + 1),
    'revision overflow': variant(s => { s.state.revision = Number.MAX_SAFE_INTEGER; }),
  }[kind];
  if (text !== null) await setSlot(page, text, key);
  await continueLocally(page);
  const message = kind === 'missing' ? 'No local checkpoint' : kind === 'revision overflow' ? 'original state was preserved' : 'left unchanged';
  await expect(region(page).getByRole('alert')).toContainText(message);
  await expect(gold(page)).toHaveText('28'); await expect(page.getByTestId('trial-tile-forest-1')).toContainText('Logging Camp');
  await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeEnabled();
  expect(JSON.parse(await checkpoint(page)).state).toEqual(valid.state);
  expect(await slot(page, key)).toBe(text); expect(await slot(page, otherKey)).toBe(other);
});
}

test(`blocked or full storage preserves full state, both slots and file backups (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); await saveLocally(page); const prior = (await slot(page, key))!;
  await setSlot(page, 'other-mode-bytes', otherKey);
  await build(page, 'forest-1', 'logging');
  const before = JSON.parse(await checkpoint(page)).state;
  await page.evaluate(() => {
    const storage = localStorage, get = Storage.prototype.getItem;
    (window as unknown as StorageProbe).readStored = key => get.call(storage, key);
    Storage.prototype.setItem = () => { throw new DOMException('raw/private/error', 'QuotaExceededError'); };
  });
  await saveLocally(page); await expect(region(page).getByRole('alert')).toContainText('Could not save in this browser');
  expect(JSON.parse(await checkpoint(page)).state).toEqual(before); expect(await slot(page, key)).toBe(prior);
  await page.evaluate(() => { Storage.prototype.getItem = () => { throw new DOMException('raw/private/error', 'SecurityError'); }; });
  await continueLocally(page); await expect(region(page).getByRole('alert')).toContainText('Could not read browser storage');
  expect(JSON.parse(await checkpoint(page)).state).toEqual(before); expect(await slot(page, key)).toBe(prior); expect(await slot(page, otherKey)).toBe('other-mode-bytes');
  await page.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('raw/private/error', 'SecurityError'); } }));
  await saveLocally(page); await expect(region(page).getByRole('alert')).toContainText('Use Export checkpoint');
  await continueLocally(page); await expect(region(page).getByRole('alert')).toContainText('Use Import checkpoint');
  await expect(gold(page)).toHaveText('28'); await expect(page.getByText('raw/private/error', { exact: false })).toHaveCount(0);
  expect(JSON.parse(await checkpoint(page)).state).toEqual(before); expect(await slot(page, key)).toBe(prior); expect(await slot(page, otherKey)).toBe('other-mode-bytes');
  const backup = await checkpoint(page); await next(page);
  await importText(page, backup); await expect(region(page).getByRole('status')).toContainText('Checkpoint imported');
  await expect(gold(page)).toHaveText('28');

  expect(JSON.parse(await checkpoint(page)).state).toEqual({ ...before, revision: before.revision + 3 });
  await page.reload(); expect(await slot(page, key)).toBe(prior); expect(await slot(page, otherKey)).toBe('other-mode-bytes');
  const logger = await page.evaluate(() => localStorage.getItem('haven.runtime-errors.v1'));
  expect(logger ?? '').not.toContain('haven.tile-trial.save');
  await continueLocally(page); await expect(region(page).getByRole('status')).toContainText('Local checkpoint loaded');
});
}

test('both modes keep separate local saves and legacy still continues without growth', async ({ page }) => {
  await page.goto('/?mode=tiles'); await saveLocally(page); const legacy = (await slot(page))!;
  await page.goto('/?mode=population');
  await expect(page.getByRole('heading', { name: 'Population Trial', exact: true })).toBeVisible();
  await expect(region(page).getByRole('button', { name: 'Save locally' })).toBeEnabled();
  await expect(region(page).getByRole('button', { name: 'Continue locally' })).toBeEnabled();
  await build(page, 'forest-1', 'logging'); await next(page);
  const population = await checkpoint(page); expect(JSON.parse(population).rulesetId).toBe('tile-population-01');
  await saveLocally(page); const populationBytes = (await slot(page, POPULATION_KEY))!;
  await importText(page, population); await expect(region(page).getByRole('status')).toContainText('Checkpoint imported');
  expect(await slot(page)).toBe(legacy);
  await page.goto('/?mode=tiles'); await continueLocally(page);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await expect(page.locator('header')).toContainText('Week 1 · Planning'); await expect(gold(page)).toHaveText('30');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-immigration')).toHaveCount(0);
  expect(await slot(page, POPULATION_KEY)).toBe(populationBytes);
});

for (const { mode, key, otherKey, otherRuleset } of MODES) {
test(`a delayed file import cannot overwrite a successful Continue (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); await saveLocally(page);
  const saved = JSON.parse(await checkpoint(page)), other = structuredClone(saved); other.state.world.settlements.settlement_haven_01.inventory.gold = 41000;
  await build(page, 'forest-1', 'logging'); await delayReads(page);
  await importText(page, JSON.stringify(other)); await pending(page, 1);
  await continueLocally(page); await expect(gold(page)).toHaveText('30');
  await release(page, 0); await settle(page);
  await expect(gold(page)).toHaveText('30'); await expect(region(page).getByRole('alert')).toHaveCount(0);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  expect(JSON.parse(await checkpoint(page)).state).toEqual({ ...saved.state, revision: 2 });
  await importText(page, '{bad'); await pending(page, 2);
  await continueLocally(page); await release(page, 1); await settle(page);
  await expect(region(page).getByRole('alert')).toHaveCount(0);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  expect(JSON.parse(await checkpoint(page)).state).toEqual({ ...saved.state, revision: 3 });
  expect(await slot(page, key)).toBe(JSON.stringify(saved));
});

test(`a late file read rejection cannot replace Continue feedback (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); await saveLocally(page); const saved = JSON.parse(await checkpoint(page));
  await build(page, 'forest-1', 'logging'); await delayReads(page, true);
  await importText(page, JSON.stringify(saved)); await pending(page, 1);
  await continueLocally(page); await release(page, 0); await settle(page);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await expect(region(page).getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('raw/private/error', { exact: false })).toHaveCount(0);
  expect(JSON.parse(await checkpoint(page)).state).toEqual({ ...saved.state, revision: 2 });
  expect(await slot(page, key)).toBe(JSON.stringify(saved));
});

test(`failed Continue leaves a pending valid import usable (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); const saved = JSON.parse(await checkpoint(page));
  saved.state.world.settlements.settlement_haven_01.inventory.gold = 41000;
  await setSlot(page, '{broken', key); await delayReads(page);
  await importText(page, JSON.stringify(saved)); await pending(page, 1);
  await continueLocally(page); await expect(region(page).getByRole('alert')).toContainText('left unchanged');
  await release(page, 0); await expect(region(page).getByRole('status')).toHaveText('Checkpoint imported. Planning restored.');
  expect(JSON.parse(await checkpoint(page)).state).toEqual({ ...saved.state, revision: 1 });
  expect(await slot(page, key)).toBe('{broken');
});

test(`checkpoint IO stays manual, Planning-only and isolated (${mode})`, async ({ page }) => {
  await page.goto(`/?mode=${mode}`); const initial = await checkpoint(page), saved = JSON.parse(initial), other = JSON.parse(initial);
  saved.state.world.settlements.settlement_haven_01.inventory.gold = 41000;
  other.rulesetId = otherRuleset; other.state.world.settlements.settlement_haven_01.inventory.gold = 52000;
  const ownBytes = JSON.stringify(saved), otherBytes = JSON.stringify(other);
  await setSlot(page, ownBytes, key); await setSlot(page, otherBytes, otherKey);
  await page.addInitScript(({ keys }) => {
    const store = localStorage, get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    const probe = window as unknown as StorageProbe;
    probe.checkpointCalls = []; probe.readStored = key => get.call(store, key); probe.writeStored = (key, text) => set.call(store, key, text);
    Storage.prototype.getItem = function (key) { if (keys.includes(key)) probe.checkpointCalls!.push(['get', key]); return get.call(this, key); };
    Storage.prototype.setItem = function (key, text) { if (keys.includes(key)) probe.checkpointCalls!.push(['set', key]); set.call(this, key, text); };
    Storage.prototype.removeItem = function (key) { if (keys.includes(key)) probe.checkpointCalls!.push(['remove', key]); remove.call(this, key); };
    Storage.prototype.clear = function () { probe.checkpointCalls!.push(['clear', '*']); clear.call(this); };
  }, { keys: [KEY, POPULATION_KEY] });
  const calls = () => page.evaluate(() => (window as unknown as StorageProbe).checkpointCalls);
  await page.reload(); await expect(gold(page)).toHaveText('30'); expect(await calls()).toEqual([]);
  await build(page, 'forest-1', 'logging'); await page.getByRole('button', { name: 'End Week', exact: true }).click();
  for (const name of ['Save locally', 'Continue locally', 'Export checkpoint']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  await expect(page.getByLabel('Import checkpoint', { exact: true })).toBeDisabled();
  expect(await calls()).toEqual([]);
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await checkpoint(page); await importText(page, initial); await expect(region(page).getByRole('status')).toContainText('Checkpoint imported');
  expect(await calls()).toEqual([]); expect(await slot(page, key)).toBe(ownBytes); expect(await slot(page, otherKey)).toBe(otherBytes);
  await next(page); await setSlot(page, '{broken', key); await continueLocally(page);
  await expect(region(page).getByRole('alert')).toContainText('left unchanged');
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toBeVisible();
  await setSlot(page, ownBytes, key); await continueLocally(page);
  await expect(region(page).getByRole('status')).toContainText('Local checkpoint loaded');
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toHaveCount(0);
  const restored = JSON.parse(await checkpoint(page)).state;
  expect({ ...restored, revision: 0 }).toEqual({ ...saved.state, revision: 0 });
  expect(await calls()).toEqual([['get', key], ['get', key]]);
  await page.reload(); await expect(gold(page)).toHaveText('30'); expect(await calls()).toEqual([]);
  await build(page, 'forest-1', 'logging'); await saveLocally(page);
  const replacement = (await slot(page, key))!;
  expect(await calls()).toEqual([['get', key], ['set', key]]);
  await continueLocally(page); expect(await calls()).toEqual([['get', key], ['set', key], ['get', key]]);
  expect(await slot(page, key)).toBe(replacement); expect(await slot(page, otherKey)).toBe(otherBytes);
});

test(`the last explicit same-mode tab save wins without automatically loading (${mode})`, async ({ page, context }) => {
  await page.goto(`/?mode=${mode}`); await saveLocally(page); await setSlot(page, 'other-mode-bytes', otherKey);
  const before = JSON.parse(await checkpoint(page)).state, second = await context.newPage();
  await second.goto(`/?mode=${mode}`); await build(second, 'forest-1', 'logging'); await saveLocally(second);
  const latest = (await slot(second, key))!;
  expect(JSON.parse(await checkpoint(page)).state).toEqual(before);
  expect(await slot(page, key)).toBe(latest); expect(await slot(page, otherKey)).toBe('other-mode-bytes');
  await continueLocally(page);
  const restored = JSON.parse(await checkpoint(page)).state;
  expect({ ...restored, revision: 0 }).toEqual({ ...JSON.parse(latest).state, revision: 0 });
  await second.close();
});
}

for (const width of [1280, 390]) test(`population local checkpoint restores grown cohorts and next-week parity at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('/?mode=population');
  await build(page, 'forest-1', 'logging', 1); await build(page, 'ore-1', 'mine', 1);
  await build(page, 'plain-2', 'workshop', 1); await build(page, 'plain-3', 'market');
  for (const id of ['field-1', 'plain-1']) {
    await page.getByRole('button', { name: `Select ${id}`, exact: true }).click();
    await page.getByLabel('Assigned workers (WF)').fill('3'); await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  }
  await next(page); await expect(page.locator('header')).toContainText('102 residents');
  await saveLocally(page); const text = (await slot(page, POPULATION_KEY))!, saved = JSON.parse(text);
  expect(saved).toMatchObject({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-population-01', state: { phase: 'planning', world: { week: 2 } } });
  expect(await checkpoint(page)).toBe(text); expect(saved.state.world.settlements.settlement_haven_01.cohorts[0].count).toBe(102);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  const stocks = await page.getByTestId('trial-stocks').textContent(), goods = await page.getByTestId('trial-goods').textContent(), report = await page.getByRole('region', { name: 'Trial week report', exact: true }).textContent();
  await expect(page.getByTestId('trial-immigration')).toContainText('102 → 104');
  await expect(page.getByRole('button', { name: 'Save locally', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Continue locally', exact: true })).toBeDisabled();
  await page.reload(); await expect(page.locator('header')).toContainText('Week 1 · Planning · 100 residents');
  expect(await slot(page, POPULATION_KEY)).toBe(text);
  await build(page, 'forest-1', 'logging'); await next(page); await continueLocally(page);
  await expect(region(page).getByRole('status')).toHaveText('Local checkpoint loaded. Planning restored.');
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toHaveCount(0);
  await expect(page.locator('header')).toContainText('Week 2 · Planning · 102 residents');
  const restored = JSON.parse(await checkpoint(page)).state;
  expect(restored).toEqual({ ...saved.state, revision: saved.state.revision + 1 });
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(page.getByTestId('trial-stocks')).toHaveText(stocks!); await expect(page.getByTestId('trial-goods')).toHaveText(goods!);
  await expect(page.getByRole('region', { name: 'Trial week report', exact: true })).toHaveText(report!);
  expect(await slot(page, POPULATION_KEY)).toBe(text); expect(await slot(page, KEY)).toBeNull();
});
