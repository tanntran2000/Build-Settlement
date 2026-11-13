import {storedSaveText,readStoredRecords,writeStoredSaveText,writeRawRecord,clearStored,storeMarks,resetStoreMarks,injectWriteAbort} from './storage.helpers.ts';
import { test, expect } from '@playwright/test';

test.describe('B1 in-game Options', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); await importLife(page, makeLife()); });
  test('Options plaque opens the shared dialog', async ({ page }) => {
    await page.locator('[data-life-nav-zone="bottom"]').getByRole('button', { name: 'Options', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Options', exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(button(page, 'Options')).toBeFocused();
  });
  test('Options changes apply immediately in game', async ({ page }) => {
    await button(page, 'Options').click();
    await page.getByRole('radio', { name: 'Large', exact: true }).check();
    expect(await page.getByTestId('life-shell').evaluate(el => getComputedStyle(el).getPropertyValue('--px').trim())).toBe('3px');
    await page.getByRole('checkbox', { name: 'Reduce motion', exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
  });
  test('About downloads the real error log in game', async ({ page }) => {
    await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error')));
    await button(page, 'Options').click();
    const about = page.getByRole('region', { name: 'About', exact: true });
    await expect(about.getByText('v0.1.0 Alpha', { exact: true })).toBeVisible();
    const waiting = page.waitForEvent('download'); await about.getByRole('button', { name: 'Download error log', exact: true }).click();
    const download = await waiting; expect(download.suggestedFilename()).toBe('haven-error-log.json');
    const data = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(data.entries).toHaveLength(1); expect(data.entries[0].code).toBe('UNCAUGHT_ERROR');
  });
  test('Session no longer renders ErrorLog', async ({ page }) => {
    await go(page, 'session');
    await expect(page.locator('[data-life-view="session"] [aria-label="Error log"]')).toHaveCount(0);
    await button(page, 'Options').click();
    await expect(page.locator('[aria-label="Error log"]')).toHaveCount(1);
  });
});
const button = (page: import('@playwright/test').Page, name: string) => page.getByRole('button', { name, exact: true });
const title = (page: import('@playwright/test').Page) => page.getByRole('heading', { name: 'HAVEN', exact: true });
test('fallback and version position', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(page.locator('img')).toHaveCount(0);
  await expect(page.getByText('Sovereign Frontier', { exact: true })).toBeVisible();
  await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(58, 36, 20)');
  const version = page.locator('.version'); await expect(version).toHaveText('v0.1.0 Alpha'); await expect(version).toBeVisible();
  const box = await version.boundingBox(); expect(box!.x + box!.width).toBeGreaterThan(page.viewportSize()!.width * .8); expect(box!.y).toBeGreaterThan(page.viewportSize()!.height * .8);
});
test('keyboard wraps, Home End, focus ring and Enter', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(button(page, 'New Game')).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(button(page, 'Quit')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(button(page, 'New Game')).toBeFocused();
  await page.keyboard.press('End'); await expect(button(page, 'Quit')).toBeFocused();
  await page.keyboard.press('Home'); await expect(button(page, 'New Game')).toBeFocused();
  await expect(button(page, 'New Game')).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Character Creation', exact: true })).toBeVisible();
});
test('Options persist and Large uses 3px', async ({ page }) => {
  await page.goto('/'); await button(page, 'Options').click();
  await page.getByRole('radio', { name: 'Large', exact: true }).check();
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).getPropertyValue('--px').trim())).toBe('3px');
  await page.getByRole('checkbox', { name: 'Reduce motion', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Autosave', exact: true }).uncheck();
  await page.reload(); await button(page, 'Options').click();
  await expect(page.getByRole('radio', { name: 'Large', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Reduce motion', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Autosave', exact: true })).not.toBeChecked();
  await page.keyboard.press('Escape'); await expect(button(page, 'Options')).toBeFocused();
});
test('fullscreen refusal', async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(Error('refused')); });
  await page.goto('/'); await button(page, 'Options').click(); await page.getByRole('checkbox', { name: 'Fullscreen', exact: true }).click();
  await expect(page.getByText('Fullscreen is not available here.', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Fullscreen', exact: true })).not.toBeChecked();
});
test('About and error log', async ({ page }) => {
  await page.goto('/'); await button(page, 'Options').click(); const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('v0.1.0 Alpha', { exact: true })).toBeVisible(); await expect(dialog.getByText(/^Build /)).toBeVisible();
  await expect(dialog.getByText('Pixelify Sans — SIL Open Font License 1.1', { exact: true })).toBeVisible();
  await expect(button(page, 'Download error log')).toBeVisible();
});
test('Quit and return', async ({ page }) => {
  await page.goto('/'); await button(page, 'Quit').click(); await expect(page.getByText('You can close this tab now.', { exact: true })).toBeVisible();
  await button(page, 'Back to title').click(); await expect(title(page)).toBeVisible();
});
for (const reduced of [false, true]) test(`art integer scale and reduce motion ${reduced}`, async ({ page }) => {
  await page.addInitScript(reduceMotion => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion, autosave: true })), reduced);
  await page.route('**/title-art.webp', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="brown"/></svg>' }));
  await page.goto('/'); await expect(title(page)).toBeVisible(); const art = page.locator('img'); await expect(art).toBeVisible();
  const style = await art.evaluate(el => { const s = getComputedStyle(el); return { animation: s.animationName, duration: parseFloat(s.animationDuration), transition: parseFloat(s.transitionDuration), width: parseFloat(s.width), height: parseFloat(s.height), rendering: s.imageRendering }; });
  expect(style.rendering).toBe('pixelated'); const n = Math.max(Math.ceil(page.viewportSize()!.width / 960), Math.ceil(page.viewportSize()!.height / 540)); expect(style.width).toBe(960*n); expect(style.height).toBe(540*n);
  if (reduced) { expect(style.animation).toBe('none'); expect(style.transition).toBe(0); } else expect(style.duration).toBeLessThanOrEqual(.6);
});
for (const width of [320, 375, 1280, 1600]) for (const textSize of ['normal', 'large']) test(`layout ${width} ${textSize}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(textSize => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize, reduceMotion: false, autosave: true })), textSize);
  await page.goto('/'); await expect(title(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const target of await page.locator('main button').all()) { const b = await target.boundingBox(); if (b) { expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44); } }
  await test.info().attach('title-layout', { path: await persistScreenshot(page, 'title-layout'), contentType: 'image/png' });
  await button(page, 'Options').click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await test.info().attach('layout-metrics', { path: await persistJson(JSON.stringify(await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, size: document.documentElement.dataset.textSize })))), contentType: 'application/json' });
  await test.info().attach('options-layout', { path: await persistScreenshot(page, 'options-layout'), contentType: 'image/png' });
});

// A3 integration cases.
import { makeLife, importLife, exportLife, go } from './character-life-navigation.helpers.ts';
import { serializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
import { OLD_CHECKPOINT_MESSAGE } from '../../packages/ui/src/character-life-session.ts';
const KEY = 'haven.character-life-session-society.checkpoint.v1';
function bytes(state = makeLife()) { const result = serializeCharacterLifeSave(state); if (!result.success) throw Error(result.error.message); return result.text; }
test('empty slot disables Continue and focuses New Game', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(button(page, 'Continue')).toBeDisabled(); await expect(page.getByText('No local checkpoint', { exact: true })).toBeVisible(); await expect(button(page, 'New Game')).toBeFocused();
});
test('manual save enables cached Continue with exactly one mount read', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await importLife(page, makeLife()); await go(page, 'session'); await button(page, 'Save locally').click();
  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
   const saved = await exportLife(page);
  await page.addInitScript(key => { const original = Storage.prototype.getItem; Object.assign(window, { titleReads: 0 }); Storage.prototype.getItem = function(k) { if (k === key) (window as unknown as { titleReads: number }).titleReads++; return original.call(this, k); }; }, KEY);
  await page.reload(); await expect(button(page, 'Continue')).toBeEnabled(); await expect(button(page, 'Continue')).toBeFocused();
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await expect(page.getByTestId('life-shell')).toHaveCount(1);
  expect((await storeMarks(page)).filter(n=>n==='haven.store.read').length).toBe(1); expect(await exportLife(page)).toEqual(saved);
});
test('old checkpoint disables Continue with reason', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{}'), KEY); await page.goto('/'); await expect(title(page)).toBeVisible();
  await expect(button(page, 'Continue')).toBeDisabled(); await expect(page.getByText(OLD_CHECKPOINT_MESSAGE, { exact: true })).toBeVisible();
});
test('valid Load checkpoint replaces stale mount cache', async ({ page }) => {
  const cached = makeLife(), imported = makeLife(54321); imported.player.character.name = 'Imported Keeper';
  await page.addInitScript(({ key, text }) => localStorage.setItem(key, text), { key: KEY, text: bytes(cached) }); await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(button(page, 'Continue')).toBeEnabled();
  const chooser = page.waitForEvent('filechooser'); await button(page, 'Load checkpoint').click(); await (await chooser).setFiles({ name: 'life.json', mimeType: 'application/json', buffer: Buffer.from(bytes(imported)) });
  await expect(page.getByTestId('life-shell')).toBeVisible(); expect(await exportLife(page)).toEqual(imported);
});
for (const kind of ['oversize', 'old'] as const) test(`Load refuses ${kind} and keeps title`, async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(kind === 'oversize' ? ' '.repeat(1024*1024+1) : '{}') });
  await expect(page.getByRole('alert')).toHaveText(kind === 'oversize' ? 'Checkpoint exceeds the 1 MiB limit.' : OLD_CHECKPOINT_MESSAGE); await expect(title(page)).toBeVisible(); await expect(page.getByTestId('life-shell')).toHaveCount(0);
});
test('double New Game and Create produce one session', async ({ page }) => {
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(button(page, 'New Game')).toBeFocused(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await page.getByLabel('Name', { exact: true }).fill('New Keeper'); await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await button(page, 'Create character').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await expect(page.getByTestId('life-shell')).toHaveCount(1);
  expect((await exportLife(page)).player.character.name).toBe('New Keeper');
});
for (const kind of ['junk', 'throws'] as const) test(`options storage ${kind} still renders title`, async ({ page }) => {
  await page.addInitScript(kind => { if (kind === 'junk') localStorage.setItem('haven.options.v1', '{'); else { const get = Storage.prototype.getItem; Storage.prototype.getItem = function(k) { if (k === 'haven.options.v1') throw Error('blocked'); return get.call(this, k); }; } }, kind);
  await page.goto('/'); await expect(title(page)).toBeVisible(); await expect(title(page)).toBeVisible(); await button(page, 'Options').click(); await expect(page.getByRole('radio', { name: 'Normal', exact: true })).toBeChecked();
});


// Review Focus 4 is included before the A3 commit so A4 tests its final HEAD.
import { readFile, writeFile } from 'node:fs/promises';
import { deserializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
test('Large report at 320px keeps all six letters and stock ledger inside the page', async ({ page }) => {
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-laws.json', import.meta.url), 'utf8'));
  if (!parsed.success) throw Error(parsed.error.message);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'large', reduceMotion: true, autosave: true })));
  await page.goto('/'); await importLife(page, parsed.state); await page.getByTestId('life-end-week').click();
  const report = page.getByRole('region', { name: 'Weekly city report', exact: true });
  await expect(report.locator('[data-letter]')).toHaveCount(6);
  for (const letter of await report.locator('[data-letter]').all()) await expect(letter).toBeVisible();
  await report.locator('[data-letter="quartermaster"] > details > summary').click();
  const ledger = report.getByRole('region', { name: 'Weekly stock ledger scroll area', exact: true }); await expect(ledger).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const metrics = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, px: getComputedStyle(document.querySelector('main')!).getPropertyValue('--px').trim(), letters: [...document.querySelectorAll<HTMLElement>('[data-letter]')].map(el => ({ id: el.dataset.letter, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, scroll: el.scrollWidth, client: el.clientWidth })), ledger: (() => { const el = document.querySelector<HTMLElement>('.ledger')!; return { scroll: el.scrollWidth, client: el.clientWidth }; })() }));
  await test.info().attach('report-layout-metrics', { path: await persistJson(JSON.stringify(metrics, null, 2)), contentType: 'application/json' });
  await test.info().attach('report-large-320', { path: await persistScreenshot(page, 'report-large-320'), contentType: 'image/png' });
  expect(metrics.px).toBe('3px'); expect(metrics.document).toBeLessThanOrEqual(metrics.viewport);
  for (const letter of metrics.letters) { expect(letter.left).toBeGreaterThanOrEqual(0); expect(letter.right).toBeLessThanOrEqual(metrics.viewport); expect(letter.scroll).toBeLessThanOrEqual(letter.client); }
});

async function persistScreenshot(page: import('@playwright/test').Page, name: string) {
  const path = test.info().outputPath(name + '.png'); await page.screenshot({ path, fullPage: true }); return path;
}
async function persistJson(text: string) {
  const path = test.info().outputPath('metrics.json'); await writeFile(path, text, 'utf8'); return path;
}

test('Fullscreen reflects live document changes while Options stays open', async ({ page }) => {
  await page.goto('/'); await button(page, 'Options').click();
  const control = page.getByRole('checkbox', { name: 'Fullscreen', exact: true }); await expect(control).not.toBeChecked();
  await page.evaluate(() => { Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement }); document.dispatchEvent(new Event('fullscreenchange')); });
  await expect(control).toBeChecked(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => { Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null }); document.dispatchEvent(new Event('fullscreenchange')); });
  await expect(control).not.toBeChecked();
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('haven.options.v1')!)).sort())).toEqual(['autosave', 'reduceMotion', 'textSize']);
});

test('fallen city clears cached Continue after New Game and creation Cancel', async ({ page }) => {
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v8/life-rebellion-last-week.json', import.meta.url), 'utf8'));
  if (!parsed.success) throw Error(parsed.error.message);
  await page.goto('/'); await importLife(page, parsed.state); await go(page, 'session'); await button(page, 'Save locally').click();
  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  await page.reload(); await expect(button(page, 'Continue')).toBeEnabled(); await button(page, 'Continue').click();
  await page.getByTestId('life-end-week').click(); await expect(page.getByRole('heading', { name: 'The City Has Fallen', exact: true })).toBeVisible();
  expect(await storedSaveText(page)).toBeNull();
  await button(page, 'New Game').click(); await expect(page.getByRole('heading', { name: 'Character Creation', exact: true })).toBeVisible(); await button(page, 'Cancel').click();
  await expect(title(page)).toBeVisible(); await expect(button(page, 'Continue')).toBeDisabled();
  await expect(page.getByText('No local checkpoint', { exact: true })).toBeVisible();
});

test('Quit invalidates a pending checkpoint file read', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const original = File.prototype.text;
    (window as unknown as { releaseTitleReads: (() => void)[] }).releaseTitleReads = [];
    File.prototype.text = async function () {
      const text = await original.call(this);
      await new Promise<void>(resolve => (window as unknown as { releaseTitleReads: (() => void)[] }).releaseTitleReads.push(resolve));
      return text;
    };
  });
  await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'pending.json', mimeType: 'application/json', buffer: Buffer.from(bytes()) });
  await page.waitForFunction(() => (window as unknown as { releaseTitleReads: unknown[] }).releaseTitleReads.length === 1);
  await button(page, 'Quit').click(); await expect(page.getByText('You can close this tab now.', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    (window as unknown as { releaseTitleReads: (() => void)[] }).releaseTitleReads[0]();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expect(page.getByText('You can close this tab now.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('life-shell')).toHaveCount(0);
});

test.describe('B2 Main menu', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); await importLife(page, makeLife()); });
  test('Main menu saves and refreshes focused Continue on the title', async ({ page }) => {
    const menu = button(page, 'Main menu'); await expect(menu).toBeVisible();
    expect(await storedSaveText(page)).toBeNull();
    const before = await exportLife(page); await menu.click();
    await expect(title(page)).toBeVisible(); await expect(button(page, 'Continue')).toBeEnabled(); await expect(button(page, 'Continue')).toBeFocused();
    expect(JSON.parse((await storedSaveText(page))!).state).toEqual(before);
    await button(page, 'Continue').click(); expect(await exportLife(page)).toEqual(before);
  });
  test('Main menu is locked with its reason throughout Report', async ({ page }) => {
    const menu = button(page, 'Main menu'); await expect(menu).toBeVisible();
    await page.getByTestId('life-end-week').click();
    await expect(menu).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('Plan next week first.', { exact: true })).toBeVisible();
    await menu.click({ force: true }); await expect(page.getByTestId('life-shell')).toBeVisible();
    await expect(page.locator('[data-life-view="reports"]')).toBeVisible();
    expect(await storedSaveText(page)).toBeNull();
  });
  test('Main menu write failure keeps Planning, the session and the previous save', async ({ page }) => {
    const menu = button(page, 'Main menu'); await expect(menu).toBeVisible();
    const before = await exportLife(page), prior = bytes(makeLife(54321));
    await writeStoredSaveText(page,prior); await injectWriteAbort(page);
    await menu.click();
    await expect(page.getByRole('alert')).toContainText('Could not save in this browser');
    await expect(page.getByTestId('life-shell')).toBeVisible(); await expect(page.locator('aside')).toContainText('Planning');
    expect(await storedSaveText(page)).toBe(prior);
    expect(await exportLife(page)).toEqual(before);
  });
});
