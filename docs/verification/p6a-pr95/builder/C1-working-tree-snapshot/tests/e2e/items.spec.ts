import { test, expect, type Page } from '@playwright/test';
import { ITEM_CATALOG, type CharacterLifeSessionState } from '../../packages/core/src/index.ts';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { makeLife, importLife, exportLife, selectPerson, selectArea, go, reportRegion, openReportDetails } from './character-life-navigation.helpers.ts';

function act(s: CharacterLifeSessionState, type: string, fields: Record<string,unknown> = {}) {
  const r=executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields});
  if(!r.success)throw Error(`${type}: ${r.error.message}`); return r.next;
}
function funded() {
  const s=makeLife(); const stock=s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
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
test('C1 card preview and keyboard equip on a posted NPC change the next report',async({page})=>{
  let {s,item,def}=purchased();const npc=s.npcs[0];
  npc.character.skills[def.mainStat!]=49;
  // Choose a post where this item's main skill contributes to an observable report term.
  const type=def.mainStat==='combat'?'watch-house':def.mainStat==='management'?'town-hall':def.mainStat==='negotiation'?'town-market':def.mainStat==='medical'?'hospital':'workshop';
  const tile=s.city.tiles.find(t=>t.building?.typeId===type);
  const tileId=tile?.id??'service-1';
  if(!tile)s=act(s,'BUILD',{tileId,typeId:type});
  s=act(s,'ASSIGN_NPC',{npcId:npc.character.id,tileId});
  const baseline=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:s.city.revision,expectedWeek:1});
  if(!baseline.success)throw Error('baseline');
  await importLife(page,s);const panel=await inventory(page,npc.character.id);
  const card=panel.getByRole('article',{name:def.name,exact:true});
  await expect(card.getByText(/Before → After/)).toBeVisible();
  const equip=card.getByRole('button',{name:'Equip',exact:true});await equip.focus();await page.keyboard.press('Enter');
  const after=await exportLife(page);expect(after.city.society!.items.equipped[npc.character.id][def.slot!]!.id).toBe(item.id);
  const expected=executeCharacterLifeCommand(after,{type:'END_WEEK',expectedRevision:after.city.revision,expectedWeek:1});if(!expected.success||!expected.report)throw Error('expected');
  expect(expected.report).not.toEqual(baseline.report);
  await page.getByTestId('life-end-week').click();await go(page,'reports');await openReportDetails(page,type==='watch-house'||type==='town-hall'?'captain':'quartermaster');
  await expect(reportRegion(page)).toContainText(type==='watch-house'?'Security':type==='town-hall'?'Authority':type==='town-market'?'Goods':'Food');
  expect(await exportLife(page)).toEqual(expected.next);
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
