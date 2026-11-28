# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tile-local-checkpoint.spec.ts >> rejects ruleset while preserving full state and both slots (tiles)
- Location: tests\e2e\tile-local-checkpoint.spec.ts:32:164

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "left unchanged"
Received string:    "This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('alert') with timeout 5000ms
  - waiting for getByRole('alert')
    14 × locator resolved to <p role="alert" data-life-error="" class="svelte-w9sbey">This checkpoint file is damaged or was changed an…</p>
       - unexpected value "This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved."

```

```yaml
- alert: This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.
```

# Test source

```ts
  1  | import {storedSaveText,readStoredRecords,writeStoredSaveText,writeRawRecord,clearStored,storeMarks,resetStoreMarks,injectWriteAbort} from './storage.helpers.ts';
  2  | ﻿import {test,expect,type Page} from '@playwright/test';
  3  | import {societyPopulation} from '../../packages/core/src/index.ts';
  4  | import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
  5  | import {act,boot,encoded,fundedLife,notice,put,week} from './society-command.helpers.ts';
  6  | import { withBrowserNpcs,expectReport,exportLife,go,importLife,makeLife} from './character-life-navigation.helpers.ts';
  7  | test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('haven.options.v1', JSON.stringify({ textSize: 'normal', reduceMotion: null, autosave: false }))); });
  8  | const KEY='haven.character-life-session-society.checkpoint.v1';
  9  | const OLD=['haven.tile-trial.checkpoint.v1','haven.tile-population.checkpoint.v1','haven.tile-population-goods.checkpoint.v1'];
  10 | const save=async(page:Page)=>{await go(page,'session');await page.getByRole('button',{name:'Save locally',exact:true}).click();};
  11 | const resume=async(page:Page)=>{if(await page.getByTestId('life-shell').count())await go(page,'session');await page.getByRole('button',{name:await page.getByTestId('life-shell').count()?'Continue locally':'Continue',exact:true}).click();};
  12 | const slot=(page:Page,key=KEY)=>key===KEY?storedSaveText(page):page.evaluate(key=>localStorage.getItem(key),key);
  13 | const setSlot=(page:Page,text:string,key=KEY)=>key===KEY?writeStoredSaveText(page,text):page.evaluate(({key,text})=>localStorage.setItem(key,text),{key,text});
  14 | const checkpointCalls=async(page:Page)=>{
  15 |  const legacy=await page.evaluate(()=>(window as unknown as {checkpointCalls:string[][]}).checkpointCalls);
  16 |  expect(legacy.filter(([,key])=>key===KEY)).toEqual([['get',KEY]]);
  17 |  return [...(await storeMarks(page)).map(n=>[n==='haven.store.read'?'get':n==='haven.store.write'?'set':'remove',KEY]),...legacy.filter(([,key])=>key!==KEY)];
  18 | };
  19 | async function delayReads(page:Page,reject=false){await page.evaluate(reject=>{const original=File.prototype.text;(window as unknown as {releaseReads:(()=>void)[]}).releaseReads=[];File.prototype.text=async function(){const text=await original.call(this);await new Promise<void>((resolve,fail)=>(window as unknown as {releaseReads:(()=>void)[]}).releaseReads.push(()=>reject?fail(Error('raw/private/error')):resolve()));return text;};},reject);}
  20 | const pending=(page:Page,n:number)=>page.waitForFunction(n=>(window as unknown as {releaseReads:unknown[]}).releaseReads.length===n,n);
  21 | const release=(page:Page,n:number)=>page.evaluate(n=>(window as unknown as {releaseReads:(()=>void)[]}).releaseReads[n](),n);
  22 | const settle=(page:Page)=>page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
  23 | test('saves a multiweek plan locally, continues after reload and resumes the same economics',async({page})=>{
  24 |  let s=await boot(page,withBrowserNpcs(fundedLife()));for(const [tileId,typeId,workers] of [['forest-1','logging',2],['ore-1','mine',1],['plain-2','workshop',1],['spec-2','town-market',0]] as const){s=await act(page,s,'BUILD',{tileId,typeId});if(workers)s=await act(page,s,'SET_WORKERS',{tileId,workers});}s=await week(page,s);s=await act(page,s,'UPGRADE',{tileId:'spec-2'});s=await week(page,s);s=await act(page,s,'REPLACE',{tileId:'spec-2',typeId:'counting-house'});s=await act(page,s,'SET_ENABLED',{tileId:'forest-1',enabled:false});await save(page);await expect(notice(page)).toHaveText('Saved in this browser.');const text=(await slot(page))!;expect(await encoded(page)).toBe(text);const result=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:s.city.world.week});if(!result.success||!result.report)throw Error();await page.getByTestId('life-end-week').click();await expectReport(page,result.report);await go(page,'session');for(const name of ['Save locally','Continue locally'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();await page.reload();expect(await slot(page)).toBe(text);await importLife(page,makeLife());await act(page,makeLife(),'BUILD',{tileId:'forest-1',typeId:'logging'});expect(await slot(page)).toBe(text);await resume(page);await expect(notice(page)).toContainText('Local checkpoint loaded');const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:s.city.revision}}).toEqual(s);await page.getByTestId('life-end-week').click();await expectReport(page,result.report);expect(await slot(page)).toBe(text);
  25 | });
  26 | for(const mode of ['tiles','population']){
  27 |  const other=mode==='tiles'?OLD[1]:OLD[0];
  28 |  async function start(page:Page){await page.goto(`/?mode=${mode}`);await importLife(page,makeLife());}
  29 |  test(`explicit save replaces only its own slot and file import never writes it (${mode})`,async({page})=>{
  30 |   await start(page);await setSlot(page,'{broken');await setSlot(page,'other-mode-bytes',other);await save(page);await expect(notice(page)).toHaveText('Saved in this browser. Replaced the previous local checkpoint.');const first=(await slot(page))!;expect(await encoded(page)).toBe(first);let s=await exportLife(page);s=await act(page,s,'BUILD',{tileId:'forest-1',typeId:'logging'});await put(page,first);await expect(notice(page)).toContainText('Checkpoint imported');expect(await slot(page)).toBe(first);s=await exportLife(page);await act(page,s,'BUILD',{tileId:'forest-1',typeId:'logging'});await save(page);await expect(notice(page)).toContainText('Replaced the previous local checkpoint');expect(JSON.parse((await slot(page))!).state.city.tiles.find((t:{id:string})=>t.id==='forest-1').building.typeId).toBe('logging');expect(await slot(page,other)).toBe('other-mode-bytes');
  31 |  });
  32 |  for(const kind of ['missing','malformed','empty object','opposite mode','version','ruleset','map','negative stock','report phase','oversize','revision overflow'])test(`rejects ${kind} while preserving full state and both slots (${mode})`,async({page})=>{
  33 |   await start(page);await act(page,makeLife(),'BUILD',{tileId:'forest-1',typeId:'logging'});const valid=JSON.parse(await encoded(page));const foreign=JSON.stringify({...valid,format:'haven.world-session.save'});await setSlot(page,foreign,other);const variant=(change:(s:typeof valid)=>void)=>{const s=structuredClone(valid);change(s);return JSON.stringify(s);};
> 34 |   const text:Record<string,string|null>={missing:null,malformed:'{','empty object':'{}','opposite mode':foreign,version:variant(s=>{s.schemaVersion=2;}),ruleset:variant(s=>{s.cityRulesetId='future';}),map:variant(s=>{s.state.city.tiles[0].terrain='ore';}),'negative stock':variant(s=>{s.state.city.world.settlements.settlement_haven_01.inventory.gold=-1;}),'report phase':variant(s=>{s.state.city.phase='report';}),oversize:' '.repeat(1024*1024+1),'revision overflow':variant(s=>{s.state.city.revision=Number.MAX_SAFE_INTEGER;})};if(text[kind]!==null)await setSlot(page,text[kind]!);const seededRecords=await readStoredRecords(page);await resume(page);await expect(page.getByRole('alert')).toContainText(kind==='missing'?'No local checkpoint':kind==='revision overflow'?'original state was preserved':'left unchanged');expect(await exportLife(page)).toEqual(valid.state);expect(await readStoredRecords(page)).toEqual(seededRecords);expect(await slot(page,other)).toBe(foreign);await expect(page.getByTestId('life-end-week')).toHaveAttribute('aria-disabled','false');
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ^ Error: expect(locator).toContainText(expected) failed
  35 |  });
  36 |  test(`blocked or full storage preserves full state, both slots and file backups (${mode})`,async({page})=>{
  37 |   await start(page);await save(page);
  38 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  39 |   const prior=(await slot(page))!;await setSlot(page,'other-mode-bytes',other);await act(page,makeLife(),'BUILD',{tileId:'forest-1',typeId:'logging'});
  40 |   for(const fault of ['quota','getter']){
  41 |    const before=await exportLife(page);
  42 |    await injectWriteAbort(page,fault==='getter'?'throw':'abort');
  43 |    await save(page);await expect(page.getByRole('alert')).toContainText('Export checkpoint');expect(await exportLife(page)).toEqual(before);expect([await slot(page),await slot(page,other)]).toEqual([prior,'other-mode-bytes']);await put(page,await encoded(page));await expect(notice(page)).toContainText('Checkpoint imported');
  44 |   }
  45 |  });
  46 |  for(const late of ['success','read rejection'])test(`${late==='success'?'a delayed file import cannot overwrite a successful Continue':'a late file read rejection cannot replace Continue feedback'} (${mode})`,async({page})=>{
  47 |   await start(page);await save(page);
  48 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  49 |   const saved=JSON.parse((await slot(page))!);const changed=structuredClone(saved);changed.state.city.world.settlements.settlement_haven_01.inventory.gold=99000;await delayReads(page,late==='read rejection');await put(page,JSON.stringify(changed));await pending(page,1);await resume(page);await expect(notice(page)).toContainText('Local checkpoint loaded');const restored=await exportLife(page),feedback=await notice(page).textContent();await release(page,0);await settle(page);expect(await notice(page).textContent()).toBe(feedback);expect(await exportLife(page)).toEqual(restored);expect(await slot(page)).toBe(JSON.stringify(saved));await expect(page.getByText('raw/private/error',{exact:false})).toHaveCount(0);
  50 |  });
  51 |  test(`failed Continue leaves a pending valid import usable (${mode})`,async({page})=>{
  52 |   await start(page);const data=JSON.parse(await encoded(page));data.state.city.world.settlements.settlement_haven_01.inventory.gold=41000;await delayReads(page);await put(page,JSON.stringify(data));await pending(page,1);await resume(page);await expect(page.getByRole('alert')).toContainText('No local checkpoint');await release(page,0);await expect(notice(page)).toContainText('Checkpoint imported');const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:data.state.city.revision}}).toEqual(data.state);expect(await slot(page)).toBeNull();
  53 |  });
  54 |  test(`checkpoint IO stays manual, Planning-only and isolated (${mode})`,async({page})=>{
  55 |   await page.addInitScript(({key,old})=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem,calls:string[][]=[];Object.assign(window,{checkpointCalls:calls,rawRead:(k:string)=>get.call(localStorage,k)});for(const k of old)set.call(localStorage,k,'protected');Storage.prototype.getItem=function(k){if(k===key||old.includes(k))calls.push(['get',k]);return get.call(this,k);};Storage.prototype.setItem=function(k,v){if(k===key||old.includes(k))calls.push(['set',k]);return set.call(this,k,v);};},{key:KEY,old:OLD});
  56 |   await start(page);const s=await act(page,makeLife(),'BUILD',{tileId:'forest-1',typeId:'logging'});await encoded(page);for(const dest of ['city','characters','session','help'] as const)await go(page,dest);expect(await checkpointCalls(page)).toEqual([['get',KEY],['set',KEY]]);await save(page);
  57 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  58 |   expect(await checkpointCalls(page)).toEqual([['get',KEY],['set',KEY],['get',KEY],['set',KEY]]);await page.getByTestId('life-end-week').click();expect(await checkpointCalls(page)).toEqual([['get',KEY],['set',KEY],['get',KEY],['set',KEY]]);await go(page,'session');for(const name of ['Save locally','Continue locally','Export checkpoint'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();await expect(page.getByLabel('Import checkpoint',{exact:true})).toBeDisabled();await go(page,'reports');await page.getByRole('button',{name:'Plan next week',exact:true}).click();expect(await checkpointCalls(page)).toEqual([['get',KEY],['set',KEY],['get',KEY],['set',KEY]]);await resume(page);const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:s.city.revision}}).toEqual(s);expect(await page.evaluate(old=>old.map(k=>(window as unknown as {rawRead:(k:string)=>string}).rawRead(k)),OLD)).toEqual(OLD.map(()=> 'protected'));
  59 |  });
  60 |  test(`the last explicit same-mode tab save wins without automatically loading (${mode})`,async({page,context})=>{
  61 |   await start(page);const first=await exportLife(page);await save(page);
  62 |   await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  63 |   const second=await context.newPage();try{await second.goto(`/?mode=${mode}`);const s=makeLife();s.player.character.name='Second Keeper';s.city.world.settlements[s.city.world.activeSettlementId!].inventory.gold=55000;await importLife(second,s);await save(second);
  64 |   await expect(second.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  65 |   expect(await exportLife(page)).toEqual(first);await resume(page);const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:s.city.revision}}).toEqual(s);}finally{await second.close();}
  66 |  });
  67 | }
  68 | for(const width of [1280,390])test(`population local checkpoint restores grown cohorts and next-week parity at ${width}px`,async({page})=>{
  69 |  await page.setViewportSize({width,height:900});const s=fundedLife();s.city.society!.classes.makers.common=40;s.city.society!.wallRing=2;s.city.tiles.find(t=>t.id==='house-5')!.building={typeId:'makers-rowhouses',level:1,workers:0,enabled:true};for(const [id,typeId,workers] of [['forest-1','logging',1],['ore-1','mine',1],['plain-2','workshop',1]] as const)s.city.tiles.find(t=>t.id===id)!.building={typeId,level:1,workers,enabled:true};s.city.tiles.find(t=>t.id==='field-1')!.building!.workers=3;s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=3;s.city.world.settlements[s.city.world.activeSettlementId!].cohorts[0].count=societyPopulation(s.city.society!);await boot(page,s);const grown=await week(page,s);expect(societyPopulation(grown.city.society!)).toBeGreaterThan(societyPopulation(s.city.society!));await save(page);
  70 |  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  71 |  const text=(await slot(page))!;const next=await week(page,grown);await page.reload();await resume(page);expect(await exportLife(page)).toEqual(grown);const resumed=await week(page,grown);expect(resumed).toEqual(next);expect(await slot(page)).toBe(text);
  72 | });
  73 | 
```