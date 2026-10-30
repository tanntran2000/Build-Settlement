import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const KEY = 'haven.world-session-goods.checkpoint.v1';
const OLD_KEYS = ['haven.tile-trial.checkpoint.v1', 'haven.tile-population.checkpoint.v1'];
const controls = (page: Page) => page.getByRole('region', { name: 'Planning checkpoints', exact: true });
const outside = (page: Page) => page.getByRole('region', { name: 'Outside world', exact: true });
const save = (page: Page) => page.getByRole('button', { name: 'Save locally', exact: true }).click();
const resume = (page: Page) => page.getByRole('button', { name: 'Continue locally', exact: true }).click();
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));
const slots = (page: Page) => page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [KEY, ...OLD_KEYS]);
const writeSlot = (page: Page, text: string, key = KEY) => page.evaluate(([k, t]) => localStorage.setItem(k, t), [key, text]);
async function checkpoint(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  const file = await download; expect(file.suggestedFilename()).toMatch(/^haven-(world|tile|population)-week-\d+\.json$/);
  return readFile((await file.path())!, 'utf8');
}
const importText = (page: Page, text: string) => page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'world.json', mimeType: 'application/json', buffer: Buffer.from(text) });
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
      await new Promise<void>((resolve, fail) => (window as unknown as { releaseReads: (() => void)[] }).releaseReads.push(() => reject ? fail(Error('private/read')) : resolve()));
      return text;
    };
  }, reject);
}
const pending = (page: Page, n: number) => page.waitForFunction(n => (window as unknown as { releaseReads: unknown[] }).releaseReads.length === n, n);
const release = (page: Page, n: number) => page.evaluate(n => (window as unknown as { releaseReads: (() => void)[] }).releaseReads[n](), n);
async function observed(page: Page) {
  return { header: await page.locator('header').innerText(), stocks: await page.getByTestId('trial-stocks').innerText(), outside: await outside(page).innerText() };
}
async function seedOldSlots(page: Page) {
  await page.evaluate(keys => keys.forEach((key, i) => localStorage.setItem(key, `old-preserved-${i}`)), OLD_KEYS);
}
test('U7: fresh seeds differ but summary and rendered metadata reveal no hidden world data', async ({ page }) => {
  await page.addInitScript(() => {
    // test-only fixture; not balance. Two reproducible ambient UI seed draws.
    Object.defineProperty(crypto, 'getRandomValues', { value: (array: Uint32Array) => {
      const draw = Number(sessionStorage.getItem('test-world-seed-draw') ?? '0');
      sessionStorage.setItem('test-world-seed-draw', String(draw + 1));
      array[0] = draw === 0 ? 0 : 4294967295; return array;
    } });
  });
  await page.goto('/?mode=world'); await expect(page.getByRole('heading', { name: 'World Session', exact: true })).toBeVisible();
  const summary = await outside(page).innerText(), a = JSON.parse(await checkpoint(page));
  expect(summary).toContain('90'); expect(summary).toContain('80');
  expect(summary).toContain('Exploration, claiming and extraction are not available yet.');
  expect(a.cityRulesetId).toBe('tile-population-goods-01');
  expect(a.state.city.goodsStock.amountMilli).toBe(10000);
  expect(a.state.outside.tiles.filter((t: { owner: string | null }) => t.owner !== null)).toHaveLength(10);
  const metadata = await outside(page).evaluate(root => [root, ...root.querySelectorAll('*')].flatMap(el => [...el.attributes].filter(a => a.name.startsWith('data-') || a.name.startsWith('aria-') || a.name === 'title').map(a => a.value)));
  expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);
  expect(metadata).not.toContain(String(a.state.outside.seed));
  expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);
  await page.reload(); expect(await outside(page).innerText()).toBe(summary);
  const b = JSON.parse(await checkpoint(page)); expect(b.state.outside.seed).not.toBe(a.state.outside.seed);
});
test('U2: End Week while import is pending rejects both halves and preserves all three slots', async ({ page }) => {
  await page.goto('/?mode=world'); await seedOldSlots(page); await save(page); const text = JSON.parse(await checkpoint(page));
  text.state.outside.tiles[10].owner = 'player'; text.state.outside.tiles[10].knownBy = ['player'];
  await delayReads(page); await importText(page, JSON.stringify(text)); await pending(page, 1);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  const before = await observed(page), bytes = await slots(page);
  await release(page, 0); await expect(controls(page).getByRole('alert')).toBeVisible();
  expect(await observed(page)).toEqual(before); expect(await slots(page)).toEqual(bytes);
});
for (const late of ['success', 'invalid JSON', 'read rejection']) {
  test(`U3: successful Continue invalidates pending ${late} and its feedback`, async ({ page }) => {
    await page.goto('/?mode=world'); await seedOldSlots(page); await save(page); const a = JSON.parse(await checkpoint(page));
    a.state.city.world.settlements.settlement_haven_01.inventory.gold = 99000;
    a.state.outside.tiles[10].owner = 'player'; a.state.outside.tiles[10].knownBy = ['player'];
    await next(page); await delayReads(page, late === 'read rejection');
    await importText(page, late === 'invalid JSON' ? '{' : JSON.stringify(a)); await pending(page, 1);
    await resume(page); await expect(controls(page).getByRole('status')).toContainText('Local checkpoint loaded');
    const before = await observed(page), bytes = await slots(page), feedback = await controls(page).innerText();
    await release(page, 0); await settle(page);
    expect(await observed(page)).toEqual(before); expect(await slots(page)).toEqual(bytes); expect(await controls(page).innerText()).toBe(feedback);
  });
}
test('U3: failed Continue leaves a pending valid import eligible', async ({ page }) => {
  await page.goto('/?mode=world'); const text = JSON.parse(await checkpoint(page));
  text.state.city.world.settlements.settlement_haven_01.inventory.gold = 41000;
  text.state.outside.tiles[10].owner = 'player'; text.state.outside.tiles[10].knownBy = ['player'];
  await delayReads(page); await importText(page, JSON.stringify(text)); await pending(page, 1);
  await resume(page); await expect(controls(page).getByRole('alert')).toContainText('No local checkpoint');
  await release(page, 0); await expect(page.getByTestId('trial-stock-gold')).toHaveText('41');
  await expect(controls(page).getByRole('status')).toContainText('Checkpoint imported');
  const saved = JSON.parse(await checkpoint(page)); expect(saved.state.outside).toEqual(text.state.outside);
});
test('U4: only newest reversed import publishes city and outside; older failures cannot replace feedback', async ({ page }) => {
  await page.goto('/?mode=world'); const a = JSON.parse(await checkpoint(page)), b = structuredClone(a);
  a.state.city.world.settlements.settlement_haven_01.inventory.gold = 41000;
  b.state.city.world.settlements.settlement_haven_01.inventory.gold = 52000;
  b.state.outside.tiles[10].owner = 'player'; b.state.outside.tiles[10].knownBy = ['player'];
  await delayReads(page);
  await importText(page, JSON.stringify(a)); await pending(page, 1);
  await importText(page, JSON.stringify(b)); await pending(page, 2);
  await release(page, 1); await expect(page.getByTestId('trial-stock-gold')).toHaveText('52');
  await release(page, 0); await settle(page);
  let current = JSON.parse(await checkpoint(page)); expect(current.state.outside).toEqual(b.state.outside); expect(current.state.city.world).toEqual(b.state.city.world);
  await importText(page, '{'); await pending(page, 3);
  await importText(page, JSON.stringify(b)); await pending(page, 4); await release(page, 3);
  await expect(controls(page).getByRole('status')).toContainText('Checkpoint imported');
  const feedback = await controls(page).innerText(); await release(page, 2); await settle(page);
  expect(await controls(page).innerText()).toBe(feedback); current = JSON.parse(await checkpoint(page)); expect(current.state.outside).toEqual(b.state.outside);
});
test('U5/U6b: wrong-slot bytes never overwrite or fall back in any of the three modes', async ({ page }) => {
  const old: string[] = [];
  for (const mode of ['tiles', 'population']) { await page.goto(`/?mode=${mode}`); old.push(await checkpoint(page)); }
  await page.goto('/?mode=world'); const world = await checkpoint(page), wrong = JSON.parse(world); wrong.cityRulesetId = 'tile-trial-01';
  await seedOldSlots(page);
  for (const bytes of [...old, JSON.stringify(wrong)]) {
    await writeSlot(page, bytes); const before = await observed(page), stored = await slots(page);
    await resume(page); await expect(controls(page).getByRole('alert')).toContainText('Unsupported');
    expect(await observed(page)).toEqual(before); expect(await slots(page)).toEqual(stored);
  }
  for (const [i, mode] of ['tiles', 'population'].entries()) {
    await page.goto(`/?mode=${mode}`); const before = JSON.parse(await checkpoint(page));
    await writeSlot(page, world, OLD_KEYS[i]); const bytes = await slots(page);
    await resume(page); await expect(controls(page).getByRole('alert')).toContainText('Unsupported');
    await importText(page, world); await expect(controls(page).getByRole('alert')).toContainText('Unsupported');
    await expect(page.getByTestId('trial-stock-gold')).toHaveText(mode === 'tiles' ? '30' : '45'); expect(await slots(page)).toEqual(bytes);
    expect(JSON.parse(await checkpoint(page)).state).toEqual(before.state);
  }
});
test('U8: Report locks all four checkpoint controls', async ({ page }) => {
  await page.goto('/?mode=world'); await page.getByRole('button', { name: 'End Week', exact: true }).click();
  for (const name of ['Save locally', 'Continue locally', 'Export checkpoint']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  await expect(page.getByLabel('Import checkpoint', { exact: true })).toBeDisabled();
});
test('U9: local and portable saves restore the whole populated session and uninterrupted next week', async ({ page }) => {
  await page.goto('/?mode=world'); await seedOldSlots(page);
  await importText(page, await readFile('packages/persistence/src/__tests__/fixtures/legacy-v1/world.json', 'utf8'));
  expect(JSON.parse(await checkpoint(page)).cityRulesetId).toBe('tile-population-01');
  // Existing population rules: a complete chain plus 3 WF on farm/processor attracts passive arrivals.
  for (const [id, type] of [['forest-1', 'logging'], ['ore-1', 'mine'], ['plain-2', 'workshop'], ['plain-3', 'market']]) {
    await page.getByRole('button', { name: `Select ${id}`, exact: true }).click(); await page.getByLabel('Building type').selectOption(type); await page.getByRole('button', { name: 'Build', exact: true }).click();
  }
  for (const [id, n] of [['field-1', 3], ['plain-1', 3], ['forest-1', 1], ['ore-1', 1], ['plain-2', 1]]) {
    await page.getByRole('button', { name: `Select ${id}`, exact: true }).click(); await page.getByLabel('Assigned workers (WF)').fill(String(n)); await page.getByRole('button', { name: 'Assign workers', exact: true }).click();
  }
  await next(page); await expect(page.locator('header')).toContainText('102 residents');
  const data = JSON.parse(await checkpoint(page)); data.state.outside.tiles[10].owner = 'player'; data.state.outside.tiles[10].knownBy = ['player'];
  await importText(page, JSON.stringify(data)); await expect(controls(page).getByRole('status')).toContainText('Checkpoint imported');
  await save(page); const text = await checkpoint(page), saved = JSON.parse(text), bytes = await slots(page);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  const stocks = await page.getByTestId('trial-stocks').innerText(), report = await page.getByRole('region', { name: 'Trial week report', exact: true }).innerText();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click(); await next(page); await resume(page);
  await expect(controls(page).getByRole('status')).toContainText('Local checkpoint loaded');
  let restored = JSON.parse(await checkpoint(page));
  expect(restored.state.outside).toEqual(saved.state.outside); expect(restored.state.city.world).toEqual(saved.state.city.world); expect(restored.state.city.tiles).toEqual(saved.state.city.tiles);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  expect(await page.getByTestId('trial-stocks').innerText()).toBe(stocks); expect(await page.getByRole('region', { name: 'Trial week report', exact: true }).innerText()).toBe(report);
  await page.reload(); await importText(page, text); await expect(controls(page).getByRole('status')).toContainText('Checkpoint imported');
  restored = JSON.parse(await checkpoint(page)); expect(restored.state.outside).toEqual(saved.state.outside); expect(restored.state.city.world).toEqual(saved.state.city.world);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  expect(await page.getByTestId('trial-stocks').innerText()).toBe(stocks); expect(await page.getByRole('region', { name: 'Trial week report', exact: true }).innerText()).toBe(report);
  expect(await slots(page)).toEqual(bytes);
});
