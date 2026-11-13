import {storedSaveText,readStoredRecords,writeStoredSaveText,writeRawRecord,clearStored,storeMarks,resetStoreMarks,injectWriteAbort} from './storage.helpers.ts';
import { test, expect, type Page } from '@playwright/test';
import { serializeCharacterLifeSave } from '../../packages/persistence/src/character-life-save.ts';
import { makeLife, importLife, exportLife } from './character-life-navigation.helpers.ts';

const KEY = 'haven.character-life-session-society.checkpoint.v1';
type WatchedWindow = { autosaveCalls: string[][]; rawSlot: () => string | null };
function bytes(state = makeLife()) {
  const encoded = serializeCharacterLifeSave(state);
  if (!encoded.success) throw Error(encoded.error.message);
  return encoded.text;
}
async function start(page: Page, off = false) {
  if (off) await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false })));
  await page.goto('/'); await importLife(page, makeLife());
}
async function watch(page: Page) {
 await resetStoreMarks(page);
 await page.evaluate(key=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem,calls:string[][]=[];Object.assign(window,{autosaveCalls:calls});Storage.prototype.getItem=function(k){if(k===key)calls.push(['get',k]);return get.call(this,k);};Storage.prototype.setItem=function(k,value){if(k===key)calls.push(['set',k]);return set.call(this,k,value);};},KEY);
}
const calls = async(page: Page) => [...(await storeMarks(page)).map(name=>[name==='haven.store.write'?'set':name==='haven.store.read'?'get':'remove',KEY]),...await page.evaluate(()=>(window as unknown as WatchedWindow).autosaveCalls)];
const slot = (page: Page) => storedSaveText(page);
async function nextWeek(page: Page) {
  await page.getByTestId('life-end-week').click();
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
}

test('On by default: Plan next week writes one checkpoint equal to the real export', async ({ page }) => {
  await start(page); await watch(page);
  await page.getByTestId('life-end-week').click(); expect(await calls(page)).toEqual([]);
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  const after = await exportLife(page);
  await expect.poll(() => storedSaveText(page)).toBe(bytes(after));
  expect((await calls(page)).filter(([kind]) => kind === 'set')).toEqual([['set', KEY]]);
  expect(await slot(page)).toBe(bytes(after));
  expect(JSON.parse((await slot(page))!).state).toEqual(after);
});
test('Off: End Week and Plan next week leave the slot and checkpoint IO unchanged', async ({ page }) => {
  await start(page, true); const prior = bytes(makeLife(54321));
  await writeStoredSaveText(page,prior); await watch(page);
  await nextWeek(page);
  expect(await calls(page)).toEqual([]); expect(await slot(page)).toBe(prior);
  expect((await exportLife(page)).city.world.week).toBe(2);
});
test('Write failure: the exact autosave status appears and previous bytes survive', async ({ page }) => {
  await start(page); const prior = bytes(makeLife(54321));
  await writeStoredSaveText(page,prior); await watch(page);
  await injectWriteAbort(page);
  await nextWeek(page);
  await expect(page.locator('aside p[aria-atomic="true"]')).toHaveText('Autosave failed. Your last save is kept.');
  expect(await slot(page)).toBe(prior); expect((await exportLife(page)).city.world.week).toBe(2);
});
test('Never: creating a New Game and importing a checkpoint do not autosave', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'HAVEN', exact: true })).toBeVisible(); await watch(page);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('New Keeper'); await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await page.getByRole('button', { name: 'Create character', exact: true }).click(); await expect(page.getByTestId('life-shell')).toBeVisible();
  expect((await calls(page)).filter(([kind]) => kind === 'set')).toEqual([]); expect(await slot(page)).toBeNull();
  await importLife(page, makeLife());
  expect((await calls(page)).filter(([kind]) => kind === 'set')).toEqual([]); expect(await slot(page)).toBeNull();
});
