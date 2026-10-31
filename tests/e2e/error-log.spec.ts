import { test, expect, type Page } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import ts from 'typescript';
import {makeLife,importLife,exportLife,go} from './character-life-navigation.helpers.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
async function start(page:Page,url='/'){await page.goto(url);await importLife(page,makeLife());await go(page,'session');}
async function advance(page:Page){await page.getByTestId('life-end-week').click();await page.getByRole('button',{name:'Plan next week',exact:true}).click();await go(page,'session');}

const key = 'haven.runtime-errors.v1';
const regression = 'http://localhost:4174/';
const secret = 'TOKEN-SYNTHETIC https://private.invalid/?token=SYNTHETIC#save <b>save-payload</b>';
const panel = (page: Page) => page.getByRole('region', { name: 'Error log', exact: true });
async function invalid(page: Page) {
  await go(page,'city');await page.getByTestId('trial-tile-field-1').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('invalid');await page.getByRole('button',{name:'Assign workers',exact:true}).click();await go(page,'session');
}
async function download(page: Page) {
  const waiting = page.waitForEvent('download');
  await panel(page).getByRole('button', { name: 'Download error log', exact: true }).click();
  const file = await waiting; expect(file.suggestedFilename()).toBe('haven-error-log.json');
  const path = await file.path(); expect(path).not.toBeNull();
  expect((await stat(path!)).size).toBeLessThanOrEqual(8192);
  const text = await readFile(path!, 'utf8'); expect(text).not.toContain('TOKEN-SYNTHETIC'); expect(text).not.toContain('private.invalid'); expect(text).not.toContain('save-payload');
  return JSON.parse(text);
}
async function injectDispatcher(page: Page, mode: 'weekly' | 'r1', fault: 'throw' | 'unknown') {
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch(); const body = await response.text();
    const source = ts.createSourceFile('bundle.js', body, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const marker = 'This action is not supported in Character Life.';
    const matches: ts.FunctionDeclaration[] = [];
    function visit(node: ts.Node) { if (ts.isFunctionDeclaration(node) && node.body?.getText(source).includes(marker)) matches.push(node); ts.forEachChild(node, visit); }
    visit(source); expect(matches).toHaveLength(1);
    const fn = matches[0]; const argument = fn.parameters[0].name.getText(source); expect(/^[A-Za-z_$][\w$]*$/.test(argument)).toBe(true);
    const injected = fault === 'throw' ? `throw new Error(${JSON.stringify(secret)});` : `return {success:false,state:${argument},error:{code:"UNRECOGNIZED_SECRET",message:${JSON.stringify(secret)},extra:${JSON.stringify(secret)}}};`;
    const offset = fn.body!.getStart(source) + 1;
    await route.fulfill({ response, body: body.slice(0, offset) + injected + body.slice(offset) });
  });
}

test('both entries expose an English panel; real JSON download persists on its origin while games reset', async ({ page }) => {
  await page.addInitScript(() => {
    const original = URL.createObjectURL;
    URL.createObjectURL = function(blob) { (window as unknown as { blobMime: string }).blobMime = (blob as Blob).type; return original.call(URL, blob); };
  });
  await start(page);
  await expect(panel(page)).toHaveAttribute('lang', 'en'); await expect(panel(page)).toContainText('No errors recorded.');
  await expect(panel(page).getByRole('button', { name: 'Download error log' })).toBeDisabled();
  await invalid(page); await invalid(page);
  await expect(panel(page)).toContainText('INVALID_WORKFORCE_INPUT'); await expect(panel(page)).toContainText('Occurrences: 2');
  await page.reload();await importLife(page,makeLife());await go(page,'session'); await expect(panel(page)).toContainText('Occurrences: 2');
  await advance(page);
  await expect(page.locator('aside')).toContainText('Week 2');
  const data = await download(page);
  expect(data.schemaVersion).toBe(1); expect(data.entries).toHaveLength(1);
  expect(data.entries[0]).toMatchObject({ mode: 'weekly', clock: { week: 1 }, action: 'RUNTIME', code: 'INVALID_WORKFORCE_INPUT', kind: 'validation', occurrences: 2, appVersion: '0.1.0', buildId: null });
  expect(await page.evaluate(() => (window as unknown as { blobMime: string }).blobMime)).toBe('application/json');
  await expect(panel(page)).toContainText('Download requested');
  await page.reload();await importLife(page,makeLife());await go(page,'session'); await expect(page.locator('aside')).toContainText('Week 1'); await expect(panel(page)).toContainText('Occurrences: 2');
  await start(page); await expect(panel(page)).toHaveAttribute('lang', 'en'); await expect(panel(page)).toContainText('INVALID_WORKFORCE_INPUT');
  await expect(page.locator('aside')).toContainText('Week 1');
  await start(page,regression); await expect(panel(page)).toHaveAttribute('lang', 'en');
  await expect(panel(page)).toContainText('No errors recorded.');
  await expect(page.locator('aside')).toContainText('Week 1');
});

test('real guard failures and alternating global errors retain only the last five groups', async ({ page }) => {
  await start(page); await invalid(page);
  const overassign = async () => {
    await go(page,'city');await page.getByTestId('trial-tile-field-1').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('999');await page.getByRole('button',{name:'Assign workers',exact:true}).click();await go(page,'session');
  };
  await overassign();
  await page.evaluate(() => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'SYNTHETIC' }));
    window.dispatchEvent(new Event('unhandledrejection'));
  });
  await invalid(page); await overassign();
  await expect(panel(page).getByRole('listitem')).toHaveCount(5);
  const data = await download(page);
  expect(data.entries.map((entry: { code: string }) => entry.code)).toEqual(['INVALID_COMMAND','UNCAUGHT_ERROR','UNHANDLED_REJECTION','INVALID_WORKFORCE_INPUT','INVALID_COMMAND']);
  expect(data.entries[0]).toMatchObject({ kind: 'validation', action: 'RUNTIME', clock: { week: 1 }, occurrences: 1 });
  await expect(page.locator('aside')).toContainText('Week 1'); await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-stock-gold')).toHaveText('45');await go(page,'session');
});

for (const mode of ['weekly'] as const) {
  for (const fault of ['throw', 'unknown'] as const) {
    test(`${mode} ${fault} dispatcher failure never records or renders arbitrary error data`, async ({ page }) => {
      await injectDispatcher(page, mode, fault); await start(page,mode === 'weekly' ? '/' : regression);
      const consoleMessages: string[] = []; page.on('console', message => consoleMessages.push(message.text()));
      if (mode === 'weekly') { await page.getByTestId('life-end-week').click(); }
      else await page.locator('#btn-advance-day').click();
      const code = fault === 'throw' ? 'UNEXPECTED_ACTION_ERROR' : 'UNKNOWN_COMMAND_FAILURE';
      await expect(panel(page)).toContainText(code); expect(await page.locator('body').innerText()).not.toContain('TOKEN-SYNTHETIC');
      expect(await page.evaluate(key => localStorage.getItem(key), key)).not.toContain('TOKEN-SYNTHETIC');
      expect(consoleMessages.join('\n')).not.toContain('TOKEN-SYNTHETIC');
      const data = await download(page);
      expect(data.entries[0]).toMatchObject({ mode, code, clock: mode === 'weekly' ? { week: 1 } : { day: 1, week: 1, year: 1 } });
      if (mode === 'weekly') { await expect(page.locator('aside')).toContainText('Week 1'); await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-stock-gold')).toHaveText('45');await go(page,'session'); }
      else { await expect(page.locator('aside')).toContainText('Week 1'); await expect(page.locator('#resource-food')).toHaveText('100'); }
    });
  }
}

test('global capture ignores raw event objects and resources, bounds storms, and uses the latest mode clock without network', async ({ page }) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem; (window as unknown as { logWrites: number[] }).logWrites = [];
    Storage.prototype.setItem = function(key, value) { if (key === 'haven.runtime-errors.v1') (window as unknown as { logWrites: number[] }).logWrites.push(Date.now()); return set.call(this, key, value); };
  });
  await start(page,regression); await advance(page);
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  const prevented = await page.evaluate(secret => {
    window.dispatchEvent(new Event('error'));
    const event = new ErrorEvent('error', { message: secret, error: { stack: secret } });
    Object.defineProperty(event, 'message', { get() { throw new Error(secret); } });
    for (let i = 0; i < 10000; i++) window.dispatchEvent(event);
    const rejection = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(rejection, 'reason', { get() { throw new Error(secret); } });
    window.dispatchEvent(rejection);
    return [event.defaultPrevented, rejection.defaultPrevented];
  }, secret);
  expect(prevented).toEqual([false, false]); await expect(panel(page)).toContainText('Occurrences: 10000');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).entries.length, key)).toBe(2);
  const data = await download(page); expect(data.entries).toHaveLength(2);
  expect(data.entries[0]).toMatchObject({ code: 'UNCAUGHT_ERROR', occurrences: 10000, clock: { week: 2 } });
  expect(data.entries[1]).toMatchObject({ code: 'UNHANDLED_REJECTION', action: 'RUNTIME', kind: 'exception' });
  const writes = await page.evaluate(() => (window as unknown as { logWrites: number[] }).logWrites);
  expect(writes.length).toBeLessThanOrEqual(4); expect(requests).toEqual([]);
  expect(await page.locator('body').innerText()).not.toContain('TOKEN-SYNTHETIC');
  await start(page); await invalid(page); const mixed = await download(page);
  expect(mixed.entries).toHaveLength(1);
  expect(mixed.entries.at(-1)).toMatchObject({ mode: 'weekly', clock: { week: 1 } });
});

for (const mode of ['weekly'] as const) {
test(`${mode} native uncaught errors and rejected promises are captured after initialization without exporting their contents`, async ({ page }) => {
  await start(page,mode === 'weekly' ? '/' : regression);
  await page.evaluate(secret => {
    setTimeout(() => { throw new Error(secret); }, 0);
    setTimeout(() => { void Promise.reject(secret); }, 10);
  }, secret);
  await expect(panel(page)).toContainText('UNCAUGHT_ERROR'); await expect(panel(page)).toContainText('UNHANDLED_REJECTION');
  const data = await download(page); expect(data.entries.map((entry: { code: string }) => entry.code)).toEqual(['UNCAUGHT_ERROR', 'UNHANDLED_REJECTION']);
  expect(data.entries.every((entry: { action: string }) => entry.action === 'RUNTIME')).toBe(true);
  expect(data.entries.every((entry: { mode: string }) => entry.mode === mode)).toBe(true);
  expect(await page.locator('body').innerText()).not.toContain('TOKEN-SYNTHETIC');
});
}

test('production keeps old R1 log records on its origin and captures the new Weekly clock without bridging regression storage', async ({ page }) => {
  const legacy = { timestampUtc: '2026-10-19T00:00:00.000Z', lastSeenUtc: '2026-10-19T00:00:00.000Z', occurrences: 1,
    appVersion: '0.1.0', buildId: null, mode: 'r1', clock: { day: 2, week: 1, year: 1 }, action: 'RUNTIME',
    kind: 'exception', code: 'UNCAUGHT_ERROR', message: 'An unexpected runtime error occurred. Download this log for review.' };
  await start(page);
  await page.evaluate(({ key, legacy }) => localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, entries: [legacy] })), { key, legacy });
  await page.reload();await importLife(page,makeLife());await go(page,'session'); await expect(panel(page)).toContainText('r1 · RUNTIME · Day 2');
  await advance(page);
  await page.evaluate(() => {
    window.dispatchEvent(new ErrorEvent('error'));
    window.dispatchEvent(new Event('unhandledrejection'));
    window.dispatchEvent(new Event('pagehide'));
  });
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(stored.entries).toHaveLength(3); expect(stored.entries[0]).toEqual(legacy);
  expect(stored.entries.slice(1)).toMatchObject([
    { mode: 'weekly', clock: { week: 2 }, code: 'UNCAUGHT_ERROR', occurrences: 1 },
    { mode: 'weekly', clock: { week: 2 }, code: 'UNHANDLED_REJECTION', occurrences: 1 },
  ]);
  await start(page,regression); await expect(panel(page)).toContainText('No errors recorded.');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await start(page); await expect(panel(page).getByRole('listitem')).toHaveCount(3);
});

for (const failure of ['getter', 'quota'] as const) {
  test(`${failure} storage failure keeps export and gameplay working in RAM without retries`, async ({ page }) => {
    await page.addInitScript(failure => {
      if (failure === 'getter') Object.defineProperty(window, 'localStorage', { get() { throw new Error('SYNTHETIC storage blocked'); } });
      else Storage.prototype.setItem = function() { throw new DOMException('SYNTHETIC quota', 'QuotaExceededError'); };
    }, failure);
    await start(page); await invalid(page);
    await expect(panel(page)).toContainText('Not saved — this tab only. Download before closing.');
    const data = await download(page); expect(data.entries[0].code).toBe('INVALID_WORKFORCE_INPUT');
    const initial = await exportLife(page);
    const resolved = executeCharacterLifeCommand(initial, { type: 'END_WEEK', expectedRevision: initial.city.revision, expectedWeek: initial.city.world.week });
    if (!resolved.success) throw Error(resolved.error.message);
    const planned = executeCharacterLifeCommand(resolved.next, { type: 'NEXT_WEEK', expectedRevision: resolved.next.city.revision });
    if (!planned.success) throw Error(planned.error.message);
    await advance(page);
    await expect(page.locator('aside')).toContainText('Week 2');
    expect(await exportLife(page)).toEqual(planned.next);
  });
}

test('corrupt storage discards only the logger key; export failure keeps the in-memory log', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('unrelated-save', 'keep-me'); localStorage.setItem('haven.runtime-errors.v1', '{corrupt');
    URL.createObjectURL = () => { throw new Error('TOKEN-SYNTHETIC'); };
  });
  await start(page);
  await expect(panel(page)).toContainText('Stored error log was invalid and has been discarded.');
  expect(await page.evaluate(() => localStorage.getItem('unrelated-save'))).toBe('keep-me');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await invalid(page); await panel(page).getByRole('button', { name: 'Download error log' }).click();
  await expect(panel(page)).toContainText('Unable to request download. Your error log is unchanged.');
  await expect(panel(page)).toContainText('INVALID_WORKFORCE_INPUT'); expect(await panel(page).innerText()).not.toContain('TOKEN-SYNTHETIC');
});

test('panel remains usable with no active settlement and keyboard-triggered download',async({page})=>{
 await page.goto('/');await expect(page.getByTestId('life-shell')).toHaveCount(0);await expect(panel(page)).toContainText('No errors recorded.');
 await page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'SYNTHETIC'})));
 const button=panel(page).getByRole('button',{name:'Download error log'});await button.focus();const waiting=page.waitForEvent('download');await page.keyboard.press('Enter');expect((await waiting).suggestedFilename()).toBe('haven-error-log.json');
});
