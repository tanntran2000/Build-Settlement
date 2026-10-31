import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {societyPopulation,createWorldSession} from '../../packages/core/src/index.ts';
import {serializeWorldSessionSave} from '../../packages/persistence/src/world-session-save.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {makeLife,importLife,exportLife,go,selectPerson,selectArea,characterWindow} from './character-life-navigation.helpers.ts';
const OLD='This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
const key='haven.character-life-session-society.checkpoint.v1';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
async function start(page:Page){await page.goto('/');await importLife(page,makeLife(20261028));}
async function population(page:Page){await go(page,'city');await page.locator('#life-nav-population').click();return page.getByRole('dialog',{name:'Population',exact:true});}
function rich(){const s=makeLife(20261028);Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});return s;}
for(const url of ['/','/?mode=weekly','/?mode=tiles','/?mode=population','/?mode=world','/?mode=world-npc','/?mode=world-life']){
 test(`one society New Game at ${url}`,async({page})=>{
  await page.goto(url);await expect(button(page,'New Game')).toBeVisible();await button(page,'New Game').click();await page.getByLabel('Name',{exact:true}).fill('Synthetic Keeper');await page.getByRole('tab',{name:'Review',exact:true}).click();await button(page,'Create character').click();
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-01');
  const dialog=await population(page);
  for(const [id,count,limit] of [['free',55,70],['makers',20,25],['luminaries',12,18],['merchants',13,15],['bound',0,0]] as const){const row=dialog.getByTestId(`society-class-${id}`);await expect(row).toContainText(`Count: ${count}`);await expect(row).toContainText('Satisfaction: 80 / 100');await expect(row).toContainText(`Housing (planned): ${count} / ${limit}`);}
 });
}
test('tier lists and locked plots enforce the engine rules',async({page})=>{
 await start(page);await go(page,'city');
 for(const id of ['house-1','house-2','house-3','house-4']){await page.getByTestId(`trial-tile-${id}`).click();await expect(page.getByLabel('Building type').locator('option[value="makers-rowhouses"]')).toHaveCount(1);}
 await page.getByTestId('trial-tile-service-1').click();await expect(page.getByLabel('Building type').locator('option[value="makers-rowhouses"]')).toHaveCount(0);await expect(page.getByLabel('Building type').locator('option[value="watch-house"]')).toBeDisabled();await expect(page.getByTestId('trial-tile-house-5')).toHaveCount(0);await expect(page.getByText('Locked · opens with Ring 2',{exact:true}).first()).toBeVisible();
 const s=makeLife(),before=structuredClone(s);expect(executeCharacterLifeCommand(s,{type:'BUILD',tileId:'service-1',typeId:'makers-rowhouses',expectedRevision:0}).success).toBe(false);expect(s).toEqual(before);
});
test('Builders Yard opens Ring 2 and its plots',async({page})=>{
 const s=rich();s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=0;await page.goto('/');await importLife(page,s);await page.getByTestId('trial-tile-spec-2').click();await page.getByLabel('Building type').selectOption('builders-yard');await button(page,'Build').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('2');await button(page,'Assign workers').click();await button(page,'Extend wall to Ring 2').click();await expect(page.getByText('Wall: Ring 2 of 3 · 22 / 33 plots open',{exact:true})).toBeVisible();await expect(page.getByTestId('trial-tile-house-5')).toBeVisible();
});
test('Academy trains exactly two residents each of two weeks',async({page})=>{
 const s=rich();s.city.society!.classes.luminaries.common=20;s.city.world.settlements[s.city.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(s.city.society!);await page.goto('/');await importLife(page,s);await page.getByTestId('trial-tile-spec-2').click();await page.getByLabel('Building type').selectOption('academy');await button(page,'Build').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('2');await button(page,'Assign workers').click();await page.getByLabel('Training target').selectOption('makers');await button(page,'Set training').click();
 for(let week=0;week<2;week++){const before=await exportLife(page);await page.getByTestId('life-end-week').click();await expect(page.getByTestId('society-report-makers').getByRole('cell').nth(5)).toHaveText('2');await button(page,'Plan next week').click();const after=await exportLife(page);expect(before.city.society!.classes.free-after.city.society!.classes.free).toBe(2);expect(after.city.society!.classes.makers.common-before.city.society!.classes.makers.common).toBe(2);}
});
test('hungry Bound report matches the seeded executor result',async({page})=>{
 const s=rich();s.city.society!.classes.bound.free=20;const settlement=s.city.world.settlements[s.city.world.activeSettlementId!];settlement.inventory.food=0;settlement.cohorts[0].count=societyPopulation(s.city.society!);const expected=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:0,expectedWeek:1});if(!expected.success)throw Error(expected.error.message);await page.goto('/');await importLife(page,s);await page.getByTestId('life-end-week').click();await expect(page.getByTestId('society-why')).toContainText('The Bound went short of Food.');await expect(page.getByText(`Bound Desperation: 0 → ${expected.next.city.society!.desperation}`,{exact:true})).toBeVisible();expect(expected.next.city.society!.desperation).toBeGreaterThan(0);
});
test('one slot round-trips and rejects older or other-mode imports atomically',async({page})=>{
 await page.goto('/');const oldKeys=['haven.character-life-session.checkpoint.v1','haven.character-life-session-goods.checkpoint.v1'];const oldFiles=await Promise.all(['legacy-v1','goods-v1'].map(v=>readFile(`packages/persistence/src/__tests__/fixtures/${v}/life.json`,'utf8')));await page.evaluate(({keys,files})=>keys.forEach((k,i)=>localStorage.setItem(k,files[i])),{keys:oldKeys,files:oldFiles});await button(page,'Continue locally').click();await expect(page.getByRole('alert')).toContainText('No local checkpoint');await importLife(page,makeLife());await go(page,'session');await button(page,'Save locally').click();const saved=await exportLife(page);expect(await page.evaluate(k=>localStorage.getItem(k),key)).not.toBeNull();await page.reload();await button(page,'Continue locally').click();expect(await exportLife(page)).toEqual(saved);
 const world=createWorldSession(1);if(!world.success)throw Error();const foreign=serializeWorldSessionSave(world.value);if(!foreign.success)throw Error();
 for(const text of [...oldFiles,foreign.text]){await go(page,'session');await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect(page.getByRole('alert')).toHaveText(OLD);expect(await exportLife(page)).toEqual(saved);}
 expect(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),oldKeys)).toEqual(oldFiles);
 await page.getByTestId('life-end-week').click();await button(page,'Plan next week').click();await importLife(page,saved);await go(page,'reports');await expect(page.getByText('No resolved week yet',{exact:true}).last()).toBeVisible();
});
for(const width of [375,1280])test(`navigation preserves bytes and full-ring layout at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width===375?812:900});const s=rich();s.city.society!.wallRing=3;await page.goto('/');await importLife(page,s);const before=JSON.stringify(await exportLife(page));await go(page,'city');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const id of ['population','information','report']){await page.locator(`#life-nav-${id}`).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await button(page,'Close').click();}expect(JSON.stringify(await exportLife(page))).toBe(before);await page.getByTestId('life-end-week').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('NPC choices include the inside Market and a built Town Hall',async({page})=>{
 const s=rich();await page.goto('/');await importLife(page,s);await selectPerson(page,'npc_starter_1');await selectArea(page,'Work');await expect(characterWindow(page).getByLabel('Manager post',{exact:false}).locator('option[value="spec-1"]')).toHaveCount(1);await go(page,'city');await page.getByTestId('trial-tile-service-1').click();await page.getByLabel('Building type').selectOption('town-hall');await button(page,'Build').click();await selectPerson(page,'npc_starter_1');await selectArea(page,'Work');await expect(characterWindow(page).getByLabel('Manager post',{exact:false}).locator('option[value="service-1"]')).toHaveCount(1);
});
