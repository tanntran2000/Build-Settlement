import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {test,expect,type Page} from '@playwright/test';
import {societyPopulation,type CharacterLifeSessionState} from '../../packages/core/src/index.ts';
import {serializeCharacterLifeSave} from '../../packages/persistence/src/index.ts';
import {openReportDetails,makeLife,importLife,exportLife,go} from './character-life-navigation.helpers.ts';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
function seed(){const s=makeLife(20261028);Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000,food:40000});return s;}
function cohort(s:CharacterLifeSessionState){s.city.world.settlements[s.city.world.activeSettlementId!].cohorts[0].count=societyPopulation(s.city.society!);}
async function start(page:Page,s=makeLife(20261028)){cohort(s);await page.goto('/?mode=world-life');await importLife(page,s);await go(page,'city');}
async function week(page:Page){await button(page,'End Week').click();await expect(page.locator('[data-life-view="reports"]')).toBeVisible();await openReportDetails(page,'quartermaster');}
async function next(page:Page){await button(page,'Plan next week').click();await go(page,'city');}
async function build(page:Page,id:string,type:string,workers:number){await page.getByTestId(`trial-tile-${id}`).click();await page.locator('#trial-type').selectOption(type);await button(page,'Build').click();await page.locator('#trial-workers').fill(String(workers));await button(page,'Assign workers').click();}
test('outside starts with 30 plots, 10 open and 20 locked',async({page})=>{await page.goto('/?mode=world-life');await button(page,'New Game').click();await page.getByLabel('Name',{exact:true}).fill('Synthetic Keeper');await page.getByRole('tab',{name:'Review',exact:true}).click();await button(page,'Create character').click();await go(page,'city');const outside=page.getByRole('region',{name:'Outside tiles',exact:true});await expect(outside.locator('[data-outside-plot]')).toHaveCount(30);await expect(outside.getByRole('button',{name:/^Select /})).toHaveCount(10);await expect(outside.getByText(/^Locked/)).toHaveCount(20);});
test('wall extension opens ring 2 and clearing progress',async({page})=>{const s=seed();s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=0;s.city.tiles.find(t=>t.id==='spec-2')!.building={typeId:'builders-yard',level:1,workers:2,enabled:true};await start(page,s);await button(page,'Extend wall to Ring 2').click();await expect(page.locator('[data-outside-plot="pasture-1"]')).toContainText('Clearing 0 / 4');await expect(page.getByRole('region',{name:'Outside Ring 2',exact:true}).getByRole('button',{name:/^Select /})).toHaveCount(10);});
test('clears pasture and produces Cloth through Sheep Pasture and Weaver',async({page})=>{const s=seed();s.city.society!.wallRing=2;s.city.society!.classes.free=100;s.city.society!.classes.makers.common=100;await start(page,s);const plot=page.locator('[data-outside-plot="pasture-1"]');await plot.getByLabel('Clearing workers (WF)').fill('4');await plot.getByRole('button',{name:'Clear',exact:true}).click();await week(page);await expect(page.getByText('pasture-1 cleared.',{exact:true})).toBeVisible();await next(page);await build(page,'pasture-1','sheep-pasture',2);await build(page,'plain-2','weaver',1);await week(page);await expect(page.locator('[data-outside-produced="cloth"]')).toHaveText('1');});
test('research completes and Deep Shaft adds 60 deposit',async({page})=>{const s=seed();s.city.society!.stocksMilli.stone=20000;s.city.society!.research={topic:'deep-mining',paid:['deep-mining'],completed:[],progressMilli:{'deep-mining':7000,'watch-patrols':0,'barracks-drill':0}};s.city.tiles.find(t=>t.id==='spec-1')!.building={typeId:'library',level:1,workers:1,enabled:true};s.city.tiles.find(t=>t.id==='ore-1')!.building={typeId:'mine',level:1,workers:0,enabled:true};await start(page,s);await page.locator('#research-topic').selectOption('');await button(page,'Set research').click();await page.locator('#research-topic').selectOption('deep-mining');await button(page,'Set research').click();await week(page);await expect(page.getByText('Research completed: Deep Mining.',{exact:true})).toBeVisible();await next(page);const plot=page.locator('[data-outside-plot="ore-1"]');await expect(plot).toContainText('Iron 80 / 80');await plot.getByRole('button',{name:'Build Deep Shaft',exact:true}).click();await expect(plot).toContainText('Iron 140 / 140');});
test('full Wheat store spoils with exact report reason',async({page})=>{const s=seed();s.city.world.settlements[s.city.world.activeSettlementId!].inventory.wheat=50000;s.city.tiles.find(t=>t.id==='field-1')!.building!.enabled=false;s.city.tiles.find(t=>t.id==='field-1')!.building!.workers=0;s.city.tiles.find(t=>t.id==='plain-1')!.building!.enabled=false;s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=0;await start(page,s);await week(page);await expect(page.getByText('10 Wheat spoiled: storage full.',{exact:true})).toBeVisible();});
test('Save Continue Export Import preserves checkpoint bytes',async({page})=>{await start(page);const before=await exportLife(page);await button(page,'Save locally').click();await page.reload();await button(page,'Continue locally').click();expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(serializeCharacterLifeSave(before));await importLife(page,before);const imported=await exportLife(page),expected=structuredClone(before);expected.city.revision=before.city.revision+1;expect(serializeCharacterLifeSave(imported)).toEqual(serializeCharacterLifeSave(expected));});
test('navigation without End Week keeps export byte identical',async({page})=>{await start(page);const before=serializeCharacterLifeSave(await exportLife(page));for(const destination of ['city','characters','help','session'] as const)await go(page,destination);expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(before);});
test('outside has no horizontal overflow at mobile and desktop widths',async({page})=>{const s=seed();s.city.society!.wallRing=3;await start(page,s);for(const viewport of [{width:375,height:812},{width:1280,height:900}]){await page.setViewportSize(viewport);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#life-nav-information').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await button(page,'Close').click();}});
for(const raw of ['abc','','9007199254740992'])test(`invalid clearing draft ${JSON.stringify(raw)} stays local`,async({page})=>{
 const s=seed();s.city.society!.wallRing=2;await start(page,s);const before=serializeCharacterLifeSave(await exportLife(page));await go(page,'city');
 const plot=page.locator('[data-outside-plot="pasture-1"]');await plot.getByLabel('Clearing workers (WF)').fill(raw);await plot.getByRole('button',{name:'Clear',exact:true}).click();
 await expect(plot.getByRole('alert')).toHaveText('Use whole nonnegative workers.');expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(before);
});
test('above-pool clearing shows the engine error without changing the session',async({page})=>{
 const s=seed();s.city.society!.wallRing=2;await start(page,s);const before=await exportLife(page);const result=executeCharacterLifeCommand(before,{type:'CLEAR',tileId:'pasture-1',workers:999,expectedRevision:before.city.revision});if(result.success)throw Error('Expected above-pool rejection');
 await go(page,'city');const plot=page.locator('[data-outside-plot="pasture-1"]');await plot.getByLabel('Clearing workers (WF)').fill('999');await plot.getByRole('button',{name:'Clear',exact:true}).click();
 await expect(page.getByRole('region',{name:'Outside tiles',exact:true}).getByRole('alert')).toHaveText(result.error.message);expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(serializeCharacterLifeSave(before));
});
for(const draft of ['empty','filtered-text','zero'] as const)test(`assigned clearing workers handle ${draft} input`,async({page})=>{
 const s=seed();s.city.society!.wallRing=2;Object.assign(s.city.society!.outside['pasture-1'],{clearWorkers:2,clearPaid:true});await start(page,s);const before=await exportLife(page);await go(page,'city');
 const plot=page.locator('[data-outside-plot="pasture-1"]'),input=plot.getByLabel('Clearing workers (WF)');await expect(input).toHaveValue('2');await input.fill('');
 if(draft==='filtered-text'){await input.pressSequentially('abc');await expect(input).toHaveValue('');}
 if(draft==='zero')await input.fill('0');
 await plot.getByRole('button',{name:'Clear',exact:true}).click();
 if(draft!=='zero')await expect(plot.getByRole('alert')).toHaveText('Use whole nonnegative workers.');
 const after=await exportLife(page),expected=structuredClone(before);if(draft==='zero'){expected.city.revision++;expected.city.society!.outside['pasture-1'].clearWorkers=0;}
 expect(serializeCharacterLifeSave(after)).toEqual(serializeCharacterLifeSave(expected));expect(after.city.society!.outside['pasture-1'].clearWorkers).toBe(draft==='zero'?0:2);
});
for(const kind of ['clearing','building'] as const)test(`${kind} workers filter typing and paste before guarded dispatch`,async({page})=>{
 const s=seed();s.city.society!.wallRing=2;Object.assign(s.city.society!.outside['pasture-1'],{clearWorkers:2,clearPaid:true});await start(page,s);const before=await exportLife(page);await go(page,'city');
 if(kind==='building')await page.getByTestId('trial-tile-field-1').click();
 const host=kind==='clearing'?page.locator('[data-outside-plot="pasture-1"]'):page.getByRole('region',{name:'Manage tile',exact:true});
 const input=host.getByLabel(kind==='clearing'?'Clearing workers (WF)':'Assigned workers (WF)',{exact:true}),apply=host.getByRole('button',{name:kind==='clearing'?'Clear':'Assign workers',exact:true});
 await expect(input).toHaveAttribute('type','text');await expect(input).toHaveAttribute('inputmode','numeric');await expect(input).toHaveAttribute('pattern','[0-9]*');
 for(const [raw,digits] of [['1e','1'],['-2','2'],['1.5','15'],['abc',''],['+3','3'],['a12!b34','1234']]){
  await input.fill('');await input.pressSequentially(raw);await expect(input).toHaveValue(digits);
  await input.evaluate((node,text)=>{const field=node as HTMLInputElement;field.value=text;field.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}));},raw);await expect(input).toHaveValue(digits);
 }
 for(const raw of ['','9007199254740992']){await input.fill(raw);await apply.click();await expect(host.getByRole('alert')).toHaveText('Use whole nonnegative workers.');expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(serializeCharacterLifeSave(before));await go(page,'city');}
 await input.fill('0');await apply.click();const expected=structuredClone(before);expected.city.revision++;if(kind==='clearing')expected.city.society!.outside['pasture-1'].clearWorkers=0;else expected.city.tiles.find(t=>t.id==='field-1')!.building!.workers=0;
 expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(serializeCharacterLifeSave(expected));
});
test('city and Information test IDs are unique for all ten stored goods',async({page})=>{
 const s=seed();s.city.society!.wallRing=3;await start(page,s);await page.locator('#life-nav-information').click();
 const ids=await page.locator('[data-life-view="city"], [data-testid="trial-stocks"]').evaluateAll(roots=>roots.flatMap(root=>[root,...root.querySelectorAll('[data-testid]')]).map(node=>node.getAttribute('data-testid')).filter((id):id is string=>id!==null));
 expect(ids.filter((id,index)=>ids.indexOf(id)!==index)).toEqual([]);
 await expect(page.getByTestId('trial-stocks').locator('[data-testid^="trial-storage-"]')).toHaveCount(10);
 for(const good of ['food','wheat','wood','iron','stone','wool','cloth','herbs','goods','luxury'])await expect(page.getByTestId(`trial-storage-${good}`)).toHaveCount(1);
 await expect(page.getByTestId('trial-stock-food')).toHaveCount(1);await expect(page.getByTestId('trial-stock-goods')).toHaveCount(1);
});
