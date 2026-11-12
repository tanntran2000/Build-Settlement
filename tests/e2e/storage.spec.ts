import { test,expect,type Page } from '@playwright/test';
import { readFile,writeFile } from 'node:fs/promises';
import { deserializeCharacterLifeSave,serializeCharacterLifeSave,GAME_DB } from '../../packages/persistence/src/index.ts';
import { makeLife,importLife,exportLife,go } from './character-life-navigation.helpers.ts';
import { readStoredRecords,storedSaveText,storeMarks,injectWriteAbort,writeRecords,holdStoreCompletion,waitStoreCompletion,releaseStoreCompletion,writeStoredSaveText } from './storage.helpers.ts';
import { act } from './society-command.helpers.ts';
const KEY='haven.character-life-session-society.checkpoint.v1';
const BLOCKED='Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.';
const marker={slotId:'_',id:'migration:legacy-local-checkpoint',table:'system',schemaVersion:1,value:true};
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
function bytes(session=makeLife()){const r=serializeCharacterLifeSave(session);if(!r.success)throw Error(r.error.message);return r.text;}
async function save(page:Page){await go(page,'session');await button(page,'Save locally').click();await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');}
async function start(page:Page){await page.goto('/');await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toBeVisible();await importLife(page,makeLife());}
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
async function expectCleared(page:Page){
 await expect.poll(()=>readStoredRecords(page)).toEqual([marker]);
 const rows=await readStoredRecords(page);for(const table of GAME_DB.stores.filter(t=>t!=='system'))expect(rows.filter(r=>r.slotId==='main'&&r.table===table)).toHaveLength(0);
 expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBeNull();
}
test('Save locally reload and Continue preserve the identical exportLife',async({page})=>{
 await start(page);const before=await exportLife(page);await save(page);await page.reload();await button(page,'Continue').click();expect(await exportLife(page)).toEqual(before);expect(await storedSaveText(page)).toBe(bytes(before));
});
test('autosave stores exactly the exported live session',async({page})=>{
 await start(page);await page.getByTestId('life-end-week').click();await button(page,'Plan next week').click();const after=await exportLife(page);await expect.poll(()=>storedSaveText(page)).toBe(bytes(after));
});
test('legacy addInitScript seed migrates once and keeps the legacy bytes',async({page})=>{
 const seed=bytes();await page.addInitScript(({key,seed})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,seed);sessionStorage.setItem('seeded','yes');}},{key:KEY,seed});
 await page.goto('/');await button(page,'Continue').click();expect(await exportLife(page)).toEqual(makeLife());expect(await storedSaveText(page)).toBe(seed);expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(seed);
 await page.reload();await button(page,'Continue').click();expect(await exportLife(page)).toEqual(makeLife());expect((await storeMarks(page)).filter(n=>n==='haven.store.write')).toEqual([]);
});
test('fallen migrated city clears every table and legacy and cannot resurrect after reload',async({page})=>{
 const seed=bytes(await fallenFixture());await page.addInitScript(({key,seed})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,seed);sessionStorage.setItem('seeded','yes');}},{key:KEY,seed});
 await page.goto('/');await button(page,'Continue').click();await page.getByTestId('life-end-week').click();await expect(page.getByRole('heading',{name:'The City Has Fallen',exact:true})).toBeVisible();await expectCleared(page);
 await page.reload();await expect(button(page,'Continue')).toBeDisabled();await expect(page.getByText('No local checkpoint',{exact:true})).toBeVisible();await expectCleared(page);
});
test('an injected write abort keeps the last save and exact failure message',async({page})=>{
 await start(page);await save(page);const prior=await readStoredRecords(page);await importLife(page,makeLife(54321));await injectWriteAbort(page);await go(page,'session');await button(page,'Save locally').click();await expect(page.getByRole('alert')).toHaveText(BLOCKED);expect(await readStoredRecords(page)).toEqual(prior);expect(await exportLife(page)).toEqual({...makeLife(54321),city:{...makeLife(54321).city,revision:1}});
});
test('two tabs saving A B A leave exactly the last A session',async({page,context})=>{
 await start(page);await save(page);const second=await context.newPage();try{await second.goto('/');await importLife(second,makeLife(22));await save(second);const a=await exportLife(page);await save(page);expect(await storedSaveText(second)).toBe(bytes(a));expect(await exportLife(second)).toEqual(makeLife(22));}finally{await second.close();}
});
test('blocked IndexedDB stays playable warns once and exports',async({page})=>{
 await page.addInitScript(()=>{indexedDB.open=()=>{throw Error('blocked');};});await page.goto('/');await expect(page.getByRole('alert')).toHaveText(BLOCKED);await importLife(page,makeLife());expect(await exportLife(page)).toEqual(makeLife());await button(page,'Main menu').click();await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);await button(page,'Continue').click();expect(await exportLife(page)).toEqual(makeLife());
});
test('title menu waits for the initial async storage read',async({page})=>{
 await page.addInitScript(()=>{const open=IDBFactory.prototype.open;IDBFactory.prototype.open=function(...args:Parameters<typeof open>){const r=open.apply(this,args);if(args[0]==='haven'){Object.defineProperty(r,'onsuccess',{set(handler){r.addEventListener('success',event=>{Object.assign(window,{releaseStoreRead:()=>handler.call(r,event)});});}});}return r;};});
 await page.goto('/');await page.waitForFunction(()=>typeof (window as unknown as {releaseStoreRead?:unknown}).releaseStoreRead==='function');await expect(page.getByRole('region',{name:'Start',exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toHaveCount(0);
 await page.evaluate(()=>(window as unknown as {releaseStoreRead:()=>void}).releaseStoreRead());await expect(button(page,'New Game')).toBeFocused();
});
test('three started saved and fallen games retain only one marker without record growth',async({page})=>{
 await page.goto('/');const totals:number[]=[],seeds:number[]=[],runs:unknown[]=[];
 for(let i=0;i<3;i++){
  await button(page,'New Game').click();await page.getByLabel('Name',{exact:true}).fill('Keeper '+i);await page.getByRole('tab',{name:'Review',exact:true}).click();await button(page,'Create character').click();const started=await exportLife(page);seeds.push(started.outside.seed);
  const fallen=await fallenFixture();fallen.outside=started.outside;await importLife(page,fallen);await save(page);expect((await readStoredRecords(page)).length).toBeGreaterThan(1);const savedRows=(await readStoredRecords(page)).filter(r=>r.table!=='system');await writeRecords(page,[...savedRows,...(['reports','history','items'] as const).map(table=>({slotId:'main',id:'seed-'+started.outside.seed,table,schemaVersion:1 as const,value:{seed:started.outside.seed}}))]);for(const table of GAME_DB.stores.filter(t=>t!=='system'))expect((await readStoredRecords(page)).filter(r=>r.table===table).length).toBeGreaterThan(0);
  await go(page,'city');await page.getByTestId('life-end-week').click();await expect(page.getByRole('heading',{name:'The City Has Fallen',exact:true})).toBeVisible();await expectCleared(page);const rows=await readStoredRecords(page);totals.push(rows.length);runs.push({seed:started.outside.seed,total:rows.length,tables:Object.fromEntries(GAME_DB.stores.map(table=>[table,rows.filter(r=>r.table===table).length]))});await page.reload();await expect(button(page,'Continue')).toBeDisabled();
 }expect(totals).toEqual([1,1,1]);expect(new Set(seeds).size).toBe(3);const countsPath=test.info().outputPath('three-game-record-counts.json');await writeFile(countsPath,JSON.stringify(runs,null,2),'utf8');await test.info().attach('three-game-record-counts',{path:countsPath,contentType:'application/json'});
});

test('fix1 F2: pending Continue cannot overwrite a newer Planning command',async({page})=>{
 await start(page);const initial=await exportLife(page);await save(page);
 await holdStoreCompletion(page,'readonly',1);await button(page,'Continue locally').click();await waitStoreCompletion(page);
 const newer=await act(page,initial,'SET_ENABLED',{tileId:'field-1',enabled:false});
 await releaseStoreCompletion(page);expect(await exportLife(page)).toEqual(newer);
});
test('fix1 F2: pending Main menu cannot exit after a newer Planning command',async({page})=>{
 await start(page);const initial=await exportLife(page);await holdStoreCompletion(page,'readwrite');
 await button(page,'Main menu').click();await waitStoreCompletion(page);
 const newer=await act(page,initial,'SET_ENABLED',{tileId:'field-1',enabled:false});
 const status=page.locator('[aria-label="Planning checkpoints"] [role="status"]'),before=await status.textContent();
 await releaseStoreCompletion(page);await expect(page.getByTestId('life-shell')).toBeVisible();await expect(status).toHaveText(before!);
 expect(await exportLife(page)).toEqual(newer);
});
test('fix1 F2: a newer rejected Import keeps its feedback over pending Continue',async({page})=>{
 await start(page);const initial=await exportLife(page);await save(page);
 await holdStoreCompletion(page,'readonly',1);await button(page,'Continue locally').click();await waitStoreCompletion(page);
 await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});
 const message='This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
 await expect(page.getByRole('alert')).toHaveText(message);await releaseStoreCompletion(page);
 await expect(page.getByRole('alert')).toHaveText(message);expect(await exportLife(page)).toEqual(initial);
});
test('fix1 F2: the latest Continue supersedes an earlier held result',async({page})=>{
 await start(page);await save(page);await holdStoreCompletion(page,'readonly',1);
 await button(page,'Continue locally').click();await waitStoreCompletion(page);
 const latest=makeLife(54321);await writeStoredSaveText(page,bytes(latest));await button(page,'Continue locally').click();
 await releaseStoreCompletion(page);await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Local checkpoint loaded. Planning restored.');
 expect(await exportLife(page)).toEqual({...latest,city:{...latest.city,revision:1}});
});

test('fix1 F3: temporarily blocked localStorage retries legacy migration without a marker',async({page})=>{
 const seed=bytes();await page.addInitScript(({key,seed})=>{
  const storage=localStorage;storage.setItem(key,seed);
  Object.defineProperty(window,'localStorage',{configurable:true,get(){throw Error('temporarily blocked');}});
  Object.assign(window,{restoreLegacyStorage:()=>Object.defineProperty(window,'localStorage',{configurable:true,get:()=>storage})});
 },{key:KEY,seed});
 await page.goto('/');await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toBeVisible();
 expect((await readStoredRecords(page)).filter(r=>r.table==='system')).toEqual([]);
 await page.evaluate(()=>(window as unknown as {restoreLegacyStorage:()=>void}).restoreLegacyStorage());
 await importLife(page,makeLife(54321));await go(page,'session');await button(page,'Continue locally').click();
 await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Local checkpoint loaded. Planning restored.');
 expect(await exportLife(page)).toEqual({...makeLife(),city:{...makeLife().city,revision:1}});
 expect(await storedSaveText(page)).toBe(seed);expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(seed);
 expect((await readStoredRecords(page)).filter(r=>r.table==='system')).toEqual([marker]);
});

test('fix2 F1: recovered legacy A cannot replace B saved while migration was blocked',async({page})=>{
 const legacy=bytes(),b=makeLife(54321);await page.addInitScript(({key,legacy})=>{
  const storage=localStorage;storage.setItem(key,legacy);
  Object.defineProperty(window,'localStorage',{configurable:true,get(){throw Error('temporarily blocked');}});
  Object.assign(window,{restoreLegacyStorage:()=>Object.defineProperty(window,'localStorage',{configurable:true,get:()=>storage})});
 },{key:KEY,legacy});
 await page.goto('/');await expect(page.getByRole('heading',{name:'HAVEN',exact:true})).toBeVisible();
 expect((await readStoredRecords(page)).filter(r=>r.table==='system')).toEqual([]);
 await importLife(page,b);await save(page);const before=(await readStoredRecords(page)).filter(r=>r.table!=='system');expect(before).toHaveLength(7);
 await page.evaluate(()=>(window as unknown as {restoreLegacyStorage:()=>void}).restoreLegacyStorage());
 await button(page,'Continue locally').click();await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Local checkpoint loaded. Planning restored.');
 expect(await exportLife(page)).toEqual({...b,city:{...b.city,revision:1}});
 expect((await readStoredRecords(page)).filter(r=>r.table!=='system')).toEqual(before);expect(await storedSaveText(page)).toBe(bytes(b));
 expect((await readStoredRecords(page)).filter(r=>r.table==='system')).toEqual([marker]);expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(legacy);
});
