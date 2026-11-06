import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {deserializeCharacterLifeSave} from '../../packages/persistence/src/index.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {makeLife,importLife,exportLife,go,expectReport} from './character-life-navigation.helpers.ts';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
async function fits(page:Page){for(const width of [375,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
test('New Game shows zero soldiers and fits both widths',async({page})=>{
 await page.goto('/?mode=world-life');await button(page,'New Game').click();await page.getByLabel('Name',{exact:true}).fill('Garrison Keeper');await page.getByRole('tab',{name:'Review',exact:true}).click();await button(page,'Create character').click();await expect(page.getByTestId('life-shell')).toBeVisible();
 await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-soldiers')).toHaveText('Soldiers 0 \u00b7 Garrison +0 Security');await fits(page);
});
test('Watch House staffing, level-two capacity and three-worker refusal',async({page})=>{
 const s=makeLife();Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});
 await page.goto('/?mode=world-life');await importLife(page,s);await go(page,'city');await page.getByTestId('trial-tile-slum-1').click();await page.locator('#trial-type').selectOption('watch-house');await button(page,'Build').click();
 await page.locator('#trial-workers').fill('2');await button(page,'Assign workers').click();await page.locator('#life-nav-information').click();await expect(page.getByTestId('trial-soldiers')).toHaveText('Soldiers 2 \u00b7 Garrison +0 Security');await fits(page);await button(page,'Close').click();
 await button(page,'Upgrade').click();const manage=page.getByRole('region',{name:'Manage tile',exact:true});await expect(manage.getByText(/^Capacity:/)).toHaveText('Capacity: 2 WF.');
 const before=await exportLife(page);await go(page,'city');await page.locator('#trial-workers').fill('3');await button(page,'Assign workers').click();await expect(page.getByRole('alert')).toHaveText('The action exceeds building capacity or the shared workforce pool.');expect(await exportLife(page)).toEqual(before);
 await go(page,'city');await page.getByTestId('life-end-week').click();const result=executeCharacterLifeCommand(before,{type:'END_WEEK',expectedRevision:before.city.revision,expectedWeek:before.city.world.week});if(!result.success||!result.report)throw Error('Week failed');
 const actual=await expectReport(page,result.report);expect(actual.order).toEqual(result.report.order);await expect(page.getByText(`Garrison: ${result.report.order!.soldiers} soldiers, Security +${result.report.order!.garrisonSecurity}.`,{exact:true})).toBeVisible();await fits(page);
});
test('crafted raid reports garrison deaths with complete Order parity',async({page})=>{
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v7/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
 const result=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:s.city.world.week});if(!result.success||!result.report)throw Error('Week failed');
 await page.goto('/?mode=world-life');await importLife(page,s);await go(page,'city');await page.getByTestId('life-end-week').click();const actual=await expectReport(page,result.report);expect(actual.order).toEqual(result.report.order);
 const n=result.report.crimeEvent!.event!.soldiersKilled!;expect(n).toBeGreaterThan(0);await expect(page.getByRole('region',{name:'Crime',exact:true}).locator('p')).toHaveText(`A gang attacked the garrison: ${n} soldier${n===1?'':'s'} died.`);await fits(page);
});
