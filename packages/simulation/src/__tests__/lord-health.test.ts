import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, TRIAL_BUILDINGS, SOCIETY_BUILDINGS, type CharacterLifeSessionState } from '@haven/core';
import { deserializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { ITEM_COMMAND_TYPES } from '../item-command.js';

function life() {
  const made = createCharacterLifeSession(42,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Keeper'});
  if (!made.success) throw Error(made.error.message); return made.value;
}
function command(s: CharacterLifeSessionState,type: string,fields: Record<string,unknown> = {}) {
  const before = structuredClone(s), r = executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields});
  expect(s).toEqual(before); expect(r.success).toBe(true); if (!r.success) throw Error(r.error.code); return r;
}
function hospital(s: CharacterLifeSessionState) {
  s.city.society!.classes.luminaries.common = 20; s.city.society!.classes.free = 47;
  s.city.society!.stocksMilli.herbs = 100_000;
  s.city.tiles.find(t => t.id === 'service-1')!.building = {typeId:'hospital',level:1,workers:2,enabled:true};
}
function gear(s: CharacterLifeSessionState) {
  const i = s.city.society!.items; i.inventory.push({id:i.nextItemId++,defId:'common-ring'});
  return command(s,'EQUIP_ITEM',{itemId:i.inventory.at(-1)!.id,characterId:'player'}).next;
}
function wound() {
  const r = deserializeCharacterLifeSave(readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-crime-wound.json',import.meta.url),'utf8'));
  if (!r.success) throw Error(r.error.message); return r.state;
}
it.each([[false,false,1],[true,false,2],[false,true,2],[true,true,3]] as const)('regens with Hospital %s and gear %s by exactly %i', (withHospital,withGear,regen) => {
  let s = life(); s.player.character.health = 50;
  if (withHospital) hospital(s); if (withGear) s = gear(s);
  const r = command(s,'END_WEEK',{expectedWeek:1});
  expect(r.report!.items).toMatchObject({hospitalOperated:withHospital,regen});
  expect(r.next.player.character.health).toBe(50+regen);
});
it('clamps regen to 100 and requires a fully staffed, funded, supplied Hospital', () => {
  let s = life(); hospital(s); s = gear(s); s.player.character.health = 99;
  expect(command(s,'END_WEEK',{expectedWeek:1}).next.player.character.health).toBe(100);
  for (const reason of ['workers','herbs','disabled','unfunded'] as const) {
    const idle = structuredClone(s); idle.player.character.health = 50;
    if (reason === 'workers') idle.city.tiles.find(t=>t.id==='service-1')!.building!.workers = 1;
    if (reason === 'herbs') idle.city.society!.stocksMilli.herbs = 0;
    if (reason === 'disabled') {
      idle.city.tiles.find(t=>t.id==='service-1')!.building!.enabled = false;
      idle.city.tiles.find(t=>t.id==='service-1')!.building!.workers = 0;
    }
    if (reason === 'unfunded') idle.city.world.settlements[idle.city.world.activeSettlementId!].inventory.gold = 0;
    const r = command(idle,'END_WEEK',{expectedWeek:1});
    expect(r.report!.items.hospitalOperated).toBe(false); expect(r.next.player.character.health).toBe(52);
  }
});
it('a wound to exactly zero kills before Hospital and gear regen', () => {
  let s = wound(); hospital(s); s = gear(s); s.player.character.health = 20;
  const r = command(s,'END_WEEK',{expectedWeek:1});
  expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20); expect(r.next.player.character.health).toBe(0);
  expect(r.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
  expect(r.next.city.society!.pendingCard).toBeNull(); expect(r.report!.items.regen).toBe(0);
});
it('a wound leaving exactly one survives and then receives Hospital and gear regen', () => {
  let s = wound(); hospital(s); s = gear(s); s.player.character.health = 21;
  const r = command(s,'END_WEEK',{expectedWeek:1});
  expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20); expect(r.next.player.character.health).toBe(4);
  expect(r.next.city.society!.crisis.stage).not.toBe('fallen'); expect(r.report!.items.regen).toBe(3);
});
it('CITY_FALLEN blocks every later city, NPC and item command without mutation', () => {
  const s = wound(); s.player.character.health = 20;
  const fallen = command(s,'END_WEEK',{expectedWeek:1}).next, before = structuredClone(fallen);
  for (const type of ['BUILD','REPLACE','UPGRADE','SET_WORKERS','SET_ENABLED','END_WEEK','NEXT_WEEK','ENACT_LAW','REPEAL_LAW','CHOOSE_CARD_OPTION','ASSIGN_NPC','UNASSIGN_NPC','EXTEND_WALL','SET_TRAINING','CLEAR','SET_RESEARCH','BUILD_DEEP_SHAFT',...ITEM_COMMAND_TYPES]) {
    expect(executeCharacterLifeCommand(fallen,{type,expectedRevision:fallen.city.revision})).toMatchObject({success:false,error:{code:'CITY_FALLEN'}});
  }
  expect(fallen).toEqual(before);
});
it('a Calm game below Crime 70 survives all 60 weeks from health one', () => {
  let s = life(); s.player.character.health = 1;
  const stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  for (const key of ['gold','food','wood','iron'] as const) stocks[key] = 1_000_000;
  s.city.goodsStock!.amountMilli = 1_000_000;
  for (let week = 1; week <= 60; week++) {
    const r = command(s,'END_WEEK',{expectedWeek:week}); s = r.next;
    expect(s.city.society!.order.crime).toBeLessThan(70); expect(s.city.society!.crisis.stage).toBe('none');
    expect(r.report!.crimeEvent!.lordHealthLoss).toBe(0); expect(s.player.character.health).toBe(week+1);
    s = command(s,'NEXT_WEEK').next;
  }
});
it('builds the worker-free Drug Store in the Slum at Hospital level-1 cost and upkeep and sells all potions', () => {
  let s = life(); const stocks = () => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  stocks().gold = 100_000;
  const before = {...stocks()}; s = command(s,'BUILD',{tileId:'slum-1',typeId:'drug-store'}).next;
  expect(s.city.tiles.find(t=>t.id==='slum-1')!.building).toEqual({typeId:'drug-store',level:1,workers:0,enabled:true});
  expect(TRIAL_BUILDINGS['drug-store']).toMatchObject({terrain:['town'],maxLevel:1,maxWorkers:0,cost:TRIAL_BUILDINGS.hospital.cost,upkeepMilli:TRIAL_BUILDINGS.hospital.upkeepMilli});
  expect(SOCIETY_BUILDINGS['drug-store']).toMatchObject({tier:'slum',reserved:false,staff:null});
  expect(stocks()).toEqual({...before,gold:before.gold-8000,wood:before.wood-4000,iron:before.iron-2000});
  for (const [potion,price] of [[1,3000],[2,8000],[3,15000]]) {
    const gold = stocks().gold; s = command(s,'BUY_POTION',{tileId:'slum-1',potion}).next;
    expect(stocks().gold).toBe(gold-price); expect(s.city.society!.items.consumables.at(-1)!.defId).toBe(`heal-potion-${potion}`);
  }
  const r = command(s,'END_WEEK',{expectedWeek:1});
  expect(r.report!.upkeepPaidMilli).toBeGreaterThanOrEqual(1000); expect(r.report!.items.hospitalOperated).toBe(false);
});
