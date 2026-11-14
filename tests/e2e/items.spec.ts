import { test, expect, type Page, type Locator } from '@playwright/test';
import { ITEM_CATALOG, ITEM_TRIAL, buildItemWeekContext, itemRandom, drawItemRarity, type CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { deserializeCharacterLifeSave } from '../../packages/persistence/src/index.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { makeLife, importLife, exportLife, selectPerson, selectArea, go, reportRegion, openReportDetails, reportUnits, expectReport, tabTo } from './character-life-navigation.helpers.ts';

function act(s: CharacterLifeSessionState, type: string, fields: Record<string,unknown> = {}) {
  const r=executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields});
  if(!r.success)throw Error(`${type}: ${r.error.message}`); return r.next;
}
function funded(seed=12345) {
  const s=makeLife(seed); const stock=s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  stock.gold=1000000;stock.wood=1000000;stock.iron=1000000;stock.food=1000000;
  return s;
}
function purchased() {
  let s=funded();
  const i=s.city.society!.items.market.findIndex(o=>ITEM_CATALOG[o.defId].kind==='npc');
  if(i<0)throw Error('Seed needs an NPC offer');
  const defId=s.city.society!.items.market[i].defId;
  s=act(s,'BUY_ITEM',{offerIndex:i});
  return {s,item:s.city.society!.items.inventory.at(-1)!,def:ITEM_CATALOG[defId]};
}
async function inventory(page: Page, id='player') {
  await selectPerson(page,id); const panel=await selectArea(page,'Inventory');
  return panel.getByRole('region',{name:'Equipment',exact:true});
}
test.beforeEach(async({page})=>{await page.setViewportSize({width:1280,height:900});await page.goto('/?mode=world-life');});
test('C1 paper doll, totals, filters and Materials expose real item state',async({page})=>{
  const {s}=purchased();s.city.society!.items.materials.iron=7;
  await importLife(page,s);let panel=await inventory(page);
  await expect(panel.locator('[data-item-slot]')).toHaveCount(8);
  await expect(panel.getByRole('img',{name:'Character silhouette',exact:true})).toBeVisible();
  await expect(panel.getByRole('group',{name:'Inventory filters'}).getByRole('button')).toHaveText(['All','Player','NPC','This slot','Equipment','Accessory','Outfit']);
  await expect(panel.getByText(/^Regen \+/)).toBeVisible();
  for(const name of ['All','Player','NPC','This slot','Equipment','Accessory','Outfit'])await panel.getByRole('button',{name,exact:true}).click();
  await panel.getByRole('button',{name:'Materials',exact:true}).click();await expect(panel.getByRole('row',{name:'Iron Common 7',exact:true})).toBeVisible();
  panel=await inventory(page,s.npcs[0].character.id);
  await expect(panel.locator('[data-item-slot]')).toHaveCount(11);await expect(panel.locator('[data-locked="true"]')).toHaveCount(3);
  await expect(panel.getByText(/^Regen \+/)).toHaveCount(0);
});

const evidence='C:/Users/Admin/.t3/local-drafts/p6a-prC';
test('C3 Legendary cards describe their catalog effects',async({page})=>{
  const s=funded();
  s.city.society!.items.inventory=['wardens-oath','crown-of-embers','ironhide-gloves','ledger-of-plenty'].map((defId,k)=>({id:k+1,defId}));
  s.city.society!.items.nextItemId=5;
  await importLife(page,s);const panel=await inventory(page);
  const effects=ITEM_TRIAL.effects;
  for(const [name,text] of [
    ["Warden's Oath",`While worn: Watch House Security +${effects.wardenSecurity}.`],
    ['Crown of Embers',`While worn: Authority +${effects.crownAuthority}.`],
    ['Ironhide Gloves',`While worn: Wound damage −${effects.ironhideWoundReduction}.`],
    ['Ledger of Plenty',`While worn: Post output +${effects.ledgerOutputPercent}%.`],
  ])await expect(panel.getByRole('article',{name,exact:true}).getByText(text,{exact:true})).toBeVisible();
});

test('C3 Player and NPC silhouettes have their distinct accessible labels',async({page})=>{
  const s=funded();await importLife(page,s);
  await mkdir(`${evidence}/screenshots`,{recursive:true});
  for(const [id,label,name] of [
    [s.player.character.id,'Character silhouette','equipment-player'],
    [s.npcs[0].character.id,'NPC silhouette','equipment-npc'],
  ]){
    const panel=await inventory(page,id);
    await expect(panel.getByRole('img',{name:label,exact:true})).toBeVisible();
    await panel.evaluate(node=>{node.scrollIntoView({block:'start'});for(let p=node.parentElement;p;p=p.parentElement)if(p.scrollHeight>p.clientHeight&&/auto|scroll/.test(getComputedStyle(p).overflowY))p.scrollTop=Math.max(0,p.scrollTop-140);});
    await page.screenshot({path:`${evidence}/screenshots/${name}-1280.png`,fullPage:true});
  }
});

test('C2 UI buy, keyboard equip and next Farm report show the post effect',async({page})=>{
  let s=funded();s.npcs[0].character.skills.management=49;
  s=act(s,'ASSIGN_NPC',{npcId:s.npcs[0].character.id,tileId:'field-1'});
  const index=s.city.society!.items.market.findIndex(o=>o.defId==='rare-set');expect(index).toBeGreaterThanOrEqual(0);
  const expectedBuy=act(s,'BUY_ITEM',{offerIndex:index});
  await importLife(page,s);await go(page,'city');await page.getByRole('button',{name:'Select spec-1',exact:true}).click();
  const market=page.getByRole('region',{name:'Item Market',exact:true});await expect(market).toBeVisible();
  await expect(market.getByRole('group',{name:'Weekly offers'}).getByRole('article')).toHaveCount(8);
  await market.getByRole('group',{name:'Weekly offers'}).getByRole('article').nth(index).getByRole('button',{name:'Buy',exact:true}).focus();await page.keyboard.press('Enter');
  expect(await exportLife(page)).toEqual(expectedBuy);
  const panel=await inventory(page,s.npcs[0].character.id);await panel.getByRole('article',{name:'Steward Set',exact:true}).getByRole('button',{name:'Equip',exact:true}).click();
  const equipped=await exportLife(page),result=executeCharacterLifeCommand(equipped,{type:'END_WEEK',expectedRevision:equipped.city.revision,expectedWeek:1});if(!result.success||!result.report)throw Error('week');
  expect(result.report.after.wheat).toBeGreaterThan(0);
  await page.getByTestId('life-end-week').click();await expectReport(page,result.report);
});
test('C2 Market sells items and digit-only material quantities, with no Legendary Sell',async({page})=>{
  const {s,item,def}=purchased();const items=s.city.society!.items;items.materials={iron:7,ruby:1};items.inventory.push({id:items.nextItemId++,defId:'wardens-oath'});
  await importLife(page,s);await go(page,'city');await page.getByRole('button',{name:'Select spec-1',exact:true}).click();
  const market=page.getByRole('region',{name:'Item Market',exact:true});await expect(market).toBeVisible();
  const sell=market.getByRole('group',{name:'Sell inventory',exact:true});
  await expect(sell.getByRole('article',{name:"Warden's Oath",exact:true}).getByRole('button',{name:'Sell',exact:true})).toHaveCount(0);
  const ruby=market.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Ruby',exact:true})});await expect(ruby.getByRole('button',{name:'Sell material',exact:true})).toHaveCount(0);
  const iron=market.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Iron',exact:true})});const count=iron.getByRole('textbox',{name:'Sell Iron count',exact:true});
  await count.fill('1.5');await expect(count).not.toHaveValue('1.5');await count.fill('0');await iron.getByRole('button',{name:'Sell material',exact:true}).click();await expect(market.getByRole('alert')).toBeVisible();
  expect((await exportLife(page)).city.society!.items.materials.iron).toBe(7);
  await go(page,'city');await count.fill('3');await iron.getByRole('button',{name:'Sell material',exact:true}).click();
  const materialSold=act(s,'SELL_MATERIAL',{materialId:'iron',count:3});expect(await exportLife(page)).toEqual(materialSold);
  await go(page,'city');await sell.getByRole('article',{name:def.name,exact:true}).getByRole('button',{name:'Sell',exact:true}).click();
  expect(await exportLife(page)).toEqual(act(materialSold,'SELL_ITEM',{itemId:item.id}));
});
test('C2 claims temporary storage through the command path',async({page})=>{
  const s=funded();s.city.society!.items.storage=[{item:{id:1,defId:'common-ring'},expiresWeek:4}];s.city.society!.items.nextItemId=2;
  await importLife(page,s);const panel=await inventory(page);await panel.getByRole('button',{name:'Temporary storage',exact:true}).click();
  await panel.getByRole('button',{name:'Claim',exact:true}).focus();await page.keyboard.press('Enter');
  expect(await exportLife(page)).toEqual(act(s,'CLAIM_STORED_ITEM',{itemId:1}));
});
function clinic(s:CharacterLifeSessionState){s.city.society!.classes.free=47;s.city.society!.classes.luminaries.common=20;s.city.tiles.find(t=>t.id==='service-1')!.building={typeId:'hospital',level:1,workers:2,enabled:true};s.city.society!.stocksMilli.herbs=10000;return s;}
test('C2 operating Hospital and worker-free Drug Store sell potions; inventory Use restores Player health',async({page})=>{
  let s=clinic(funded());s.player.character.health=63;s=act(s,'BUILD',{tileId:'slum-1',typeId:'drug-store'});
  await importLife(page,s);await go(page,'city');await page.getByRole('button',{name:'Select service-1',exact:true}).click();
  let shop=page.getByRole('region',{name:'Potion shop',exact:true});await expect(shop).toBeVisible();await expect(shop.getByRole('button',{name:/^Buy Heal Potion/})).toHaveCount(3);
  await shop.getByRole('button',{name:'Buy Heal Potion I',exact:true}).click();s=act(s,'BUY_POTION',{tileId:'service-1',potion:1});
  const potions=page.getByRole('region',{name:'Potion inventory',exact:true});await potions.getByRole('button',{name:'Use Heal Potion I',exact:true}).click();s=act(s,'USE_CONSUMABLE',{itemId:s.city.society!.items.consumables[0].id});
  expect(await exportLife(page)).toEqual(s);await go(page,'city');await page.getByRole('button',{name:'Select slum-1',exact:true}).click();shop=page.getByRole('region',{name:'Potion shop',exact:true});
  await shop.getByRole('button',{name:'Buy Heal Potion III',exact:true}).click();expect(await exportLife(page)).toEqual(act(s,'BUY_POTION',{tileId:'slum-1',potion:3}));
});
function crowdedReport(){
  let seed=1;while(seed<200&&(!drawItemRarity(ITEM_TRIAL.materialOddsBps,itemRandom(seed,1,'material'))||!drawItemRarity(ITEM_TRIAL.findOddsBps,itemRandom(seed,1,'find'))))seed++;
  if(seed===200)throw Error('No seeded item report');let s=funded(seed);s=act(s,'BUILD',{tileId:'ore-1',typeId:'mine'});s=act(s,'ASSIGN_NPC',{npcId:s.npcs[0].character.id,tileId:'ore-1'});
  const i=s.city.society!.items;i.inventory=Array.from({length:50},(_,k)=>({id:k+1,defId:'common-ring'}));i.storage=Array.from({length:10},(_,k)=>({item:{id:k+51,defId:'rare-ring'},expiresWeek:k===0?1:99}));i.nextItemId=61;i.materials={iron:999,silver:999,gold:999,ruby:999};i.goals.rebellionSeen=true;i.goals.authorityStreak=3;s.city.society!.order.authority=100;return s;
}
test('C2 visible item letters include stack loss, storage-full loss, expiry, delivered and waiting Legendary rewards',async({page})=>{
  const s=crowdedReport();const r=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:1});if(!r.success||!r.report)throw Error('crowded report');
  expect(r.report.items.materials.some(m=>m.lost)).toBe(true);expect(r.report.items.found!.lost).toBe(true);expect(r.report.items.expired).toEqual(['rare-ring']);expect(r.report.items.legendary).not.toBeNull();expect(r.report.items.pendingLegendary).toEqual(['authority']);
  await importLife(page,s);await page.getByTestId('life-end-week').click();await openReportDetails(page,'quartermaster');await openReportDetails(page,'steward');
  await expect(page.getByRole('region',{name:'Quartermaster item details',exact:true})).toBeVisible();await expectReport(page,r.report);
});
test('C2 health line and wounds death letter use the exact approved copy',async({page})=>{
  const s=clinic(funded());s.player.character.health=63;s.city.society!.items.equipped.player={weapon:{id:1,defId:'common-weapon'},ring:{id:2,defId:'common-ring'}};s.city.society!.items.nextItemId=3;
  await importLife(page,s);await expect(page.getByText('Health 63 / 100 · Regen +4/week',{exact:true})).toBeVisible();
  const decoded=deserializeCharacterLifeSave(await readFile('packages/persistence/src/__tests__/fixtures/society-v8/life-crime-wound.json','utf8'));if(!decoded.success)throw Error('wound fixture');decoded.state.player.character.health=20;
  await importLife(page,decoded.state);await page.getByTestId('life-end-week').click();await expect(page.getByRole('heading',{name:'Your Lord Has Died',exact:true})).toBeVisible();await expect(page.getByText(/^Your wounds proved fatal\./)).toBeVisible();
  await mkdir(`${evidence}/screenshots`,{recursive:true});await page.screenshot({path:`${evidence}/screenshots/death-letter-1280.png`,fullPage:true});
});

async function auditItems(page:Page,root:Locator,name:string,width:number){
  await expect(root).toBeVisible();await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  const measured=await root.evaluate(node=>{
    const rgb=(s:string)=>s.match(/[\d.]+/g)!.map(Number);
    const over=(a:number[],b:number[])=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1)));
    const luminance=(a:number[])=>a.reduce((n,v,i)=>{const s=v/255;return n+(s<=.04045?s/12.92:((s+.055)/1.055)**2.4)*[.2126,.7152,.0722][i];},0);
    const visible=(e:Element)=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');
    const texts:{text:string;contrast:number;required:number}[]=[],clipped:string[]=[];
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text:Node|null;
    while((text=walker.nextNode())){
      const e=text.parentElement;if(!e||!visible(e)||!text.textContent?.trim()||['STYLE','SCRIPT'].includes(e.tagName))continue;
      const range=document.createRange();range.selectNodeContents(text);if(!range.getClientRects().length)continue;
      const ancestors:Element[]=[];for(let p:Element|null=e;p;p=p.parentElement)ancestors.unshift(p);
      let bg=[255,255,255];for(const p of ancestors)bg=over(rgb(getComputedStyle(p).backgroundColor),bg);
      const css=getComputedStyle(e),fg=over(rgb(css.color),bg),a=luminance(fg),b=luminance(bg);
      texts.push({text:text.textContent.trim(),contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),required:parseFloat(css.fontSize)>=24||(parseFloat(css.fontSize)>=18.66&&Number(css.fontWeight)>=700)?3:4.5});
      for(const r of range.getClientRects())if(r.left<-.5||r.right>innerWidth+.5)clipped.push(text.textContent.trim());
    }
    const controls=[...node.querySelectorAll('button,input,select')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')??e.textContent?.trim()??'',width:r.width,height:r.height};});
    return {texts,clipped,controls,pageOverflow:document.documentElement.scrollWidth>innerWidth};
  });
  await mkdir(`${evidence}/accessibility`,{recursive:true});await mkdir(`${evidence}/screenshots`,{recursive:true});
  await writeFile(`${evidence}/accessibility/${name}-${width}.json`,JSON.stringify(measured,null,2),'utf8');
  expect(measured.pageOverflow).toBe(false);expect(measured.clipped).toEqual([]);
  expect(measured.texts.filter(t=>t.contrast+.01<t.required)).toEqual([]);
  expect(measured.controls.filter(c=>c.width<24||c.height<24)).toEqual([]);
  for(const control of await root.locator('button:not(:disabled),input:not(:disabled),select:not(:disabled)').all()){
    if(!await control.isVisible())continue;await tabTo(page,control);await expect(control).toBeFocused();
  }
  if(width===1280){
    await root.evaluate(node=>{node.scrollIntoView({block:'start'});for(let p=node.parentElement;p;p=p.parentElement)if(p.scrollHeight>p.clientHeight&&/auto|scroll/.test(getComputedStyle(p).overflowY))p.scrollTop=Math.max(0,p.scrollTop-140);});
    await page.screenshot({path:`${evidence}/screenshots/${name}-${width}.png`,fullPage:true});
  }
}
for(const width of [1280,1600])for(const name of ['equipment','market','potions','letters'])test(`C2 accessibility ${name} at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});let root:Locator;
  if(name==='equipment'){
    const {s}=purchased();s.city.society!.items.materials.iron=7;const id=s.city.society!.items.nextItemId++;s.city.society!.items.storage=[{item:{id,defId:'common-ring'},expiresWeek:4}];
    await importLife(page,s);root=await inventory(page,s.npcs[0].character.id);await auditItems(page,root,name,width);
    for(const section of ['Materials','Temporary storage']){await root.getByRole('button',{name:section,exact:true}).click();await auditItems(page,root,section.toLowerCase().replaceAll(' ','-'),width);}return;
  }else if(name==='market'){
    const {s}=purchased();s.city.society!.items.materials={iron:7,ruby:1};await importLife(page,s);await go(page,'city');await page.getByRole('button',{name:'Select spec-1',exact:true}).click();root=page.getByRole('region',{name:'Item Market',exact:true});
  }else if(name==='potions'){
    let s=clinic(funded());s=act(s,'BUY_POTION',{tileId:'service-1',potion:1});await importLife(page,s);await go(page,'city');await page.getByRole('button',{name:'Select service-1',exact:true}).click();root=page.getByRole('region',{name:'Potion shop',exact:true});
  }else{
    await importLife(page,crowdedReport());await page.getByTestId('life-end-week').click();await openReportDetails(page,'quartermaster');await openReportDetails(page,'steward');root=page.getByRole('region',{name:'Quartermaster item details',exact:true});
    await auditItems(page,root,'quartermaster-items',width);await auditItems(page,page.getByRole('region',{name:'Steward item details',exact:true}),'steward-items',width);return;
  }
  await auditItems(page,root,name,width);
});
test('C1 card preview and keyboard equip on a posted NPC change the next report',async({page})=>{
  let {s,item,def}=purchased();const npc=s.npcs[0];
  npc.character.skills[def.mainStat!]=49;
  // Owner-authorized attempt 3: management affects the existing Farm's output.
  expect(def.mainStat).toBe('management');
  expect(s.city.tiles.find(t=>t.id==='field-1')!.building!.typeId).toBe('farm');
  s=act(s,'ASSIGN_NPC',{npcId:npc.character.id,tileId:'field-1'});
  const baseline=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:1});
  if(!baseline.success)throw Error('baseline');
  await importLife(page,s);const panel=await inventory(page,npc.character.id);
  const card=panel.getByRole('article',{name:def.name,exact:true});
  await expect(card.getByText(/Before → After/)).toBeVisible();
  const equip=card.getByRole('button',{name:'Equip',exact:true});await equip.focus();await page.keyboard.press('Enter');
  const after=await exportLife(page);expect(after.city.society!.items.equipped[npc.character.id][def.slot!]!.id).toBe(item.id);
  const effective=buildItemWeekContext(after).postSkills['field-1'].management;
  const percent=Math.min(ITEM_TRIAL.effects.outputCapPercent,Math.floor(Math.max(0,effective-ITEM_TRIAL.effects.threshold)/ITEM_TRIAL.effects.outputStep)*ITEM_TRIAL.effects.outputPercent);
  expect(percent).toBeGreaterThanOrEqual(1);
  const expected=executeCharacterLifeCommand(after,{type:'END_WEEK',expectedRevision:after.city.revision,expectedWeek:1});if(!expected.success||!expected.report)throw Error('expected');
  expect(expected.report).not.toEqual(baseline.report);
  const extraWheat=expected.report.after.wheat-baseline.report!.after.wheat;
  expect(extraWheat).toBeGreaterThan(0);
  const delta=expected.report.after.wheat-expected.report.before.wheat;
  console.log('C1 attempt 3 Farm proof',JSON.stringify({effective,percent,extraWheat,visibleWheatDelta:reportUnits(delta)}));
  await page.getByTestId('life-end-week').click();await go(page,'reports');await openReportDetails(page,'quartermaster');
  const wheat=reportRegion(page).getByRole('table',{name:'Weekly stock ledger',exact:true}).getByRole('row').filter({has:page.getByRole('rowheader',{name:'wheat',exact:true})});
  await expect(wheat.getByRole('cell').nth(1)).toHaveText(reportUnits(delta));
  const expectedPlanning=act(expected.next,'NEXT_WEEK');
  await reportRegion(page).getByRole('button',{name:'Plan next week',exact:true}).click();
  expect(await exportLife(page)).toEqual(expectedPlanning);
});
test('C1 Destroy confirms, cancels and accepts with the keyboard',async({page})=>{
  const {s,def,item}=purchased();await importLife(page,s);let panel=await inventory(page);
  await panel.getByRole('article',{name:def.name,exact:true}).getByRole('button',{name:'Destroy',exact:true}).click();
  let dialog=page.getByRole('dialog',{name:'Destroy item?',exact:true});await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();expect((await exportLife(page)).city.society!.items.inventory.some(i=>i.id===item.id)).toBe(true);
  panel=await inventory(page);await panel.getByRole('article',{name:def.name,exact:true}).getByRole('button',{name:'Destroy',exact:true}).click();
  dialog=page.getByRole('dialog',{name:'Destroy item?',exact:true});await dialog.getByRole('button',{name:'Destroy',exact:true}).focus();await page.keyboard.press('Enter');
  expect((await exportLife(page)).city.society!.items.inventory.some(i=>i.id===item.id)).toBe(false);
});
