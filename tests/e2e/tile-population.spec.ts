import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {societyPopulation} from '../../packages/core/src/index.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {act,boot,encoded,fundedLife,notice,put} from './society-command.helpers.ts';
import {expectReport,exportLife,go} from './character-life-navigation.helpers.ts';
for(const width of [1280,390])test(`society population grows once, preserves workforce and roundtrips at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let s=fundedLife();s.city.society!.classes.makers.common=40;s.city.society!.wallRing=2;s.city.tiles.find(t=>t.id==='house-5')!.building={typeId:'makers-rowhouses',level:1,workers:0,enabled:true};s.city.world.settlements[s.city.world.activeSettlementId!].cohorts[0].count=societyPopulation(s.city.society!);s=await boot(page,s);
 for(const [tileId,typeId,workers] of [['forest-1','logging',1],['ore-1','mine',1],['plain-2','workshop',1]] as const){s=await act(page,s,'BUILD',{tileId,typeId});s=await act(page,s,'SET_WORKERS',{tileId,workers});}
 s=await act(page,s,'SET_WORKERS',{tileId:'field-1',workers:3});s=await act(page,s,'SET_WORKERS',{tileId:'plain-1',workers:3});const before=structuredClone(s);
 for(let i=0;i<2;i++){const resolved=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:s.city.world.week});if(!resolved.success||!resolved.report)throw Error();expect(resolved.report.immigration!.arrivals).toBeGreaterThan(0);await page.getByTestId('life-end-week').click();await expectReport(page,resolved.report);await page.getByRole('button',{name:'Plan next week',exact:true}).dblclick();const next=executeCharacterLifeCommand(resolved.next,{type:'NEXT_WEEK',expectedRevision:resolved.next.city.revision});if(!next.success)throw Error();s=next.next;expect(await exportLife(page)).toEqual(s);expect(s.city.tiles).toEqual(before.city.tiles);const text=await encoded(page);await put(page,text);await expect(notice(page)).toContainText('Checkpoint imported');const restored=await exportLife(page);expect({...restored,city:{...restored.city,revision:s.city.revision}}).toEqual(s);s=restored;await go(page,'city');}
 await page.getByTestId('trial-tile-field-1').click();await expect(page.getByLabel('Assigned workers (WF)',{exact:true})).toHaveValue('3');expect(errors).toEqual([]);
});
test('older ruleset files cannot replace the society game',async({page})=>{
 const s=await boot(page);for(const path of ['legacy-v1/population.json','goods-v1/life.json']){await put(page,await readFile(`packages/persistence/src/__tests__/fixtures/${path}`,'utf8'));await expect(page.getByRole('alert')).toHaveText('This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.');expect(await exportLife(page)).toEqual(s);}
});
