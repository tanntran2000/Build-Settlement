import {test,expect,type Page} from '@playwright/test';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {serializeCharacterLifeSave} from '../../packages/persistence/src/index.ts';
import {makeLife,importLife,exportLife,go,expectReport} from './character-life-navigation.helpers.ts';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
async function start(page:Page,security=30){const s=makeLife(20261028);s.city.society!.order.security=security;Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});await page.goto('/?mode=world-life');await importLife(page,s);await go(page,'city');}
test('Information order rows are unique and fit mobile and desktop',async({page})=>{
 await start(page);await page.locator('#life-nav-information').click();
 for(const [key,value] of [['security',30],['crime',10],['authority',50]])await expect(page.getByTestId(`trial-order-${key}`)).toContainText(`${String(key)[0].toUpperCase()+String(key).slice(1)} ${value} →`);
 const ids=await page.locator('[data-testid]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-testid')));expect(ids.filter((id,i)=>ids.indexOf(id)!==i)).toEqual([]);
 for(const width of [375,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('Slum Watch House is staffed and Order report matches engine',async({page})=>{
 await start(page,10);await page.getByTestId('trial-tile-slum-1').click();await page.locator('#trial-type').selectOption('watch-house');await expect(page.locator('#trial-type')).toContainText('+5 Security in the Slum');await button(page,'Build').click();await page.locator('#trial-workers').fill('2');await button(page,'Assign workers').click();
 const before=await exportLife(page);const result=executeCharacterLifeCommand(before,{type:'END_WEEK',expectedRevision:before.city.revision,expectedWeek:before.city.world.week});if(!result.success||!result.report)throw Error('Engine week failed');
 expect(result.report.order!.after.security).toBeGreaterThan(before.city.society!.order.security);
 await go(page,'city');await button(page,'End Week').click();await expectReport(page,result.report);
 await expect(page.getByRole('region',{name:'Order',exact:true})).toBeVisible();
});
test('Barracks worker digits reject empty and unsafe drafts without dispatch',async({page})=>{
 await start(page);await page.getByTestId('trial-tile-service-1').click();await page.locator('#trial-type').selectOption('military-barracks');await button(page,'Build').click();const before=serializeCharacterLifeSave(await exportLife(page));await go(page,'city');
 const input=page.locator('#trial-workers');await expect(input).toHaveAttribute('type','text');await expect(input).toHaveAttribute('inputmode','numeric');await expect(input).toHaveAttribute('pattern','[0-9]*');await input.fill('');await input.pressSequentially('a2b');await expect(input).toHaveValue('2');
 for(const raw of ['','9007199254740992']){await input.fill(raw);await button(page,'Assign workers').click();await expect(page.getByRole('alert')).toHaveText('Use whole nonnegative workers.');expect(serializeCharacterLifeSave(await exportLife(page))).toEqual(before);await go(page,'city');}
});
test('Library offers all topics and order survives Save Continue Export Import',async({page})=>{
 await start(page);await expect(page.locator('#research-topic option')).toHaveText(['None','Deep Mining','Watch Patrols','Barracks Drill']);const before=await exportLife(page);await button(page,'Save locally').click();await page.reload();await button(page,'Continue locally').click();expect((await exportLife(page)).city.society!.order).toEqual(before.city.society!.order);await importLife(page,before);expect((await exportLife(page)).city.society!.order).toEqual(before.city.society!.order);
});
