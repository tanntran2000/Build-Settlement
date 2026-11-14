import { expect, it } from 'vitest';
import { buildingWorkerCap, createCharacterLifeSession, createSocietyState, DEFAULT_PLAYER_DRAFT, ITEM_TRIAL, lawTerms, type CharacterLifeSessionState, type ItemWeekContext, type TileTrialState } from '@haven/core';
import { runTileTrialWeek } from '../tile-trial-week.js';
import { resolveOrderWeek } from '../order-week.js';
import { resolveCrimeWeek } from '../crime-week.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';

const skills = { management: 50, technical: 50, medical: 50, combat: 50, negotiation: 50 };
function context(tileId?: string, skill = 50): ItemWeekContext {
  return { postSkills: tileId ? { [tileId]: { management: skill, technical: skill, medical: skill, combat: skill, negotiation: skill } } : {}, postTraits: {}, playerSkills: { ...skills }, playerTraits: [], playerRegen: 0 };
}
function fundedCity() {
  const s = createSocietyState(), stocks = s.world.settlements[s.world.activeSettlementId!].inventory;
  for (const key of ['gold','wheat','food','wood','iron'] as const) stocks[key] = 1_000_000;
  s.goodsStock!.amountMilli = 1_000_000; s.society!.stocksMilli.wool = 100_000;
  return s;
}
const production = [
  ['farm','field-1','management','wheat'], ['processor','plain-1','management','food'],
  ['sheep-pasture','pasture-1','management','wool'], ['herb-garden','meadow-1','management','herbs'],
  ['logging','forest-1','technical','wood'], ['mine','ore-1','technical','iron'],
  ['workshop','plain-2','technical','goods'], ['quarry','rock-1','technical','stone'], ['weaver','plain-3','technical','cloth'],
] as const;
function output(typeId: string, tileId: string, good: string, ctx?: ItemWeekContext) {
  const s = fundedCity();
  for (const tile of s.tiles) if (tile.building) tile.building.enabled = false;
  s.tiles.find(t => t.id === tileId)!.building = { typeId, level: 1, workers: buildingWorkerCap(typeId,1), enabled: true };
  const r = runTileTrialWeek(s,ctx);
  if (good === 'wheat') return r.after.wheat-r.before.wheat+(r.outside!.spoiledMilli.wheat??0);
  if (good === 'food') return r.after.food-r.before.food+r.foodConsumedMilli+(r.outside!.spoiledMilli.food??0);
  if (good === 'goods') return r.goodsStock!.producedMilli;
  const outside = r.outside!;
  return outside.producedMilli[good as keyof typeof outside.producedMilli];
}
for (const [typeId,tileId,skillName,good] of production) {
  it.each([[50,0],[55,1],[100,10]])(`${typeId} uses ${skillName} %i for exactly +%i percent output`, (skill,percent) => {
    const ctx = context(tileId); ctx.postSkills[tileId][skillName] = skill;
    const base = output(typeId,tileId,good);
    expect(base).toBeGreaterThan(0);
    expect(output(typeId,tileId,good,ctx)).toBe(Math.floor(base*(100+percent)/100));
  });
}

function order(s: TileTrialState, ids: string[], ctx?: ItemWeekContext) {
  return resolveOrderWeek(s,new Set(ids),{ before: { ...s.society!.order }, taxModifierBps: 0, taxDeltaMilli: 0, arrivalsBudgetBefore: 0, arrivalsBudgetAfter: 0 },lawTerms([]),ctx);
}
it.each(['watch-house','military-barracks'])('applies the %s combat Security term at 50, 60 and 100', typeId => {
  for (const [skill,bonus] of [[50,0],[60,1],[100,5]]) {
    const s = fundedCity(); s.tiles.find(t => t.id === 'service-1')!.building = { typeId, level: 1, workers: 2, enabled: true };
    const base = order(structuredClone(s),['service-1']);
    expect(order(s,['service-1'],context('service-1',skill)).targets.security).toBe(base.targets.security+bonus);
  }
});
it.each([[50,0],[60,1],[100,5]])('Town Hall negotiation %i adds Authority %i', (skill,bonus) => {
  const s = fundedCity(); s.tiles.find(t => t.id === 'service-1')!.building = { typeId: 'town-hall', level: 1, workers: 1, enabled: true };
  const base = order(structuredClone(s),['service-1']);
  expect(order(s,['service-1'],context('service-1',skill)).targets.authority).toBe(base.targets.authority+bonus);
});
it.each([[50,0],[60,1],[100,5]])('Player management %i adds Authority %i', (skill,bonus) => {
  const s = fundedCity(), base = order(structuredClone(s),[]), ctx = context(); ctx.playerSkills.management = skill;
  expect(order(s,[],ctx).targets.authority).toBe(base.targets.authority+bonus);
});
it.each([[50,0],[55,1],[100,10]])('Market negotiation %i discounts the shared next-week offers by %i percent', (skill,percent) => {
  const a = fundedCity(), b = structuredClone(a);
  runTileTrialWeek(a); runTileTrialWeek(b,context('spec-1',skill));
  expect(b.society!.items.market).toEqual(a.society!.items.market.map(o => ({ ...o, priceMilli: Math.floor(o.priceMilli*(100-percent)/100) })));
});
it('uses one shared list and the strongest active Market negotiation rather than stacking posts', () => {
  const s = fundedCity(); s.tiles.find(t => t.id === 'spec-2')!.building = { typeId: 'town-market', level: 1, workers: 0, enabled: true };
  const ctx = context('spec-1',100); ctx.postSkills['spec-2'] = { ...ctx.postSkills['spec-1'] };
  const control = structuredClone(s); runTileTrialWeek(control); runTileTrialWeek(s,ctx);
  expect(s.society!.items.market.map(o => o.priceMilli)).toEqual(control.society!.items.market.map(o => o.priceMilli*9/10));
});

function assassination(ctx: ItemWeekContext | undefined, fatalRoll: number, crime = 100) {
  const s = fundedCity(); s.society!.order.crime = crime; s.society!.order.security = 0;
  const rolls = [0,0.999,0.99,fatalRoll];
  return resolveCrimeWeek(s,new Set(),() => rolls.shift()!,ctx);
}
it.each([[50,50],[55,49],[100,40]])('Player combat %i gives exactly %i percent fatal chance', (skill,chance) => {
  const ctx = context(); ctx.playerSkills.combat = skill;
  expect(assassination(ctx,chance/100-0.0001).event?.outcome).toBe('killed');
  expect(assassination(ctx,chance/100+0.0001).event?.outcome).toBe('wounded');
});
it.each([[50,20],[60,19],[100,15]])('Player medical %i gives wound damage %i', (skill,damage) => {
  const ctx = context(); ctx.playerSkills.medical = skill;
  expect(assassination(ctx,0.99,80).lordHealthLoss).toBe(damage);
});
it('Warden adds Security 3 only at her operating Watch House', () => {
  for (const typeId of ['watch-house','military-barracks']) {
    const s = fundedCity(); s.tiles.find(t => t.id === 'service-1')!.building = { typeId, level: 1, workers: 2, enabled: true };
    const ctx = context('service-1'); ctx.postTraits['service-1'] = ['warden'];
    const base = order(structuredClone(s),['service-1']);
    expect(order(s,['service-1'],ctx).targets.security).toBe(base.targets.security+(typeId==='watch-house'?3:0));
  }
});
it('Crown adds Player Authority 3', () => {
  const s = fundedCity(), base = order(structuredClone(s),[]), ctx = context(); ctx.playerTraits = ['crown'];
  expect(order(s,[],ctx).targets.authority).toBe(base.targets.authority+3);
});
it('Ironhide removes 5 wound damage and combined medical never lowers damage below 10', () => {
  const ctx = context(); ctx.playerTraits = ['ironhide'];
  expect(assassination(ctx,0.99,80).lordHealthLoss).toBe(15);
  ctx.playerSkills.medical = 100; expect(assassination(ctx,0.99,80).lordHealthLoss).toBe(10);
});
it('Ledger adds 5 percent at her own production post', () => {
  const ctx = context('field-1'); ctx.postTraits['field-1'] = ['ledger'];
  expect(output('farm','field-1','wheat',ctx)).toBe(output('farm','field-1','wheat')*105/100);
  expect(output('processor','plain-1','food',ctx)).toBe(output('processor','plain-1','food'));
});
it('preserves existing quantities with ctx absent and with skills at or below 50', () => {
  const a = fundedCity(), b = structuredClone(a), ctx = context('field-1',0); ctx.playerSkills = { management:0, technical:0, medical:0, combat:0, negotiation:0 };
  expect(runTileTrialWeek(b,ctx)).toEqual(runTileTrialWeek(a)); expect(b).toEqual(a);
  expect(assassination(undefined,0.49).event?.outcome).toBe('killed');
  expect(assassination(undefined,0.51).lordHealthLoss).toBe(20);
});

function life() { const r = createCharacterLifeSession(0,{ ...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Keeper' }); if (!r.success) throw Error(r.error.message); return r.value; }
function command(s: CharacterLifeSessionState, type: string, fields: Record<string,unknown> = {}) {
  const r = executeCharacterLifeCommand(s,{ type,expectedRevision:s.city.revision,...fields });
  expect(r.success).toBe(true); if (!r.success) throw Error(r.error.code); return r;
}
it.each(['watch-house','military-barracks'])('accepts ASSIGN_NPC at %s through the real session path', typeId => {
  let s = command(life(),'BUILD',{ tileId:'service-1',typeId }).next;
  s = command(s,'ASSIGN_NPC',{ npcId:s.npcs[0].character.id,tileId:'service-1' }).next;
  expect(s.npcs[0].postTileId).toBe('service-1');
  s.npcs[0].character.skills.combat = 100;
  const r = command(s,'END_WEEK',{ expectedWeek:1 });
  const control = structuredClone(s); control.npcs[0].character.skills.combat = 50;
  const base = command(control,'END_WEEK',{ expectedWeek:1 });
  expect(r.report!.order!.targets.security).toBe(base.report!.order!.targets.security+5);
});
it('replacement and unassignment clear post effects while keeping worn items equipped', () => {
  let s = life(); s.npcs[0].character.skills.management = 100;
  s.city.society!.items.nextItemId = 2; s.city.society!.items.inventory.push({id:1,defId:'ledger-of-plenty'});
  s = command(s,'EQUIP_ITEM',{itemId:1,characterId:s.npcs[0].character.id}).next;
  s = command(s,'ASSIGN_NPC',{npcId:s.npcs[0].character.id,tileId:'field-1'}).next;
  const worn = structuredClone(s.city.society!.items.equipped);
  const replaced = command(s,'REPLACE',{tileId:'field-1',typeId:'farm'}).next;
  const unassigned = command(s,'UNASSIGN_NPC',{npcId:s.npcs[0].character.id}).next;
  for (const next of [replaced,unassigned]) {
    expect(next.npcs[0].postTileId).toBeNull(); expect(next.city.society!.items.equipped).toEqual(worn);
    const r = command(next,'END_WEEK',{expectedWeek:1});
    expect(r.report!.after.wheat).toBe(command(life(),'END_WEEK',{expectedWeek:1}).report!.after.wheat);
  }
});
it('uses the equipped Player skills in the real End Week context', () => {
  let s = life(); s.player.character.skills.management = 50;
  s.city.society!.items.nextItemId = 2; s.city.society!.items.inventory.push({id:1,defId:'crown-of-embers'});
  const base = command(s,'END_WEEK',{expectedWeek:1});
  s = command(s,'EQUIP_ITEM',{itemId:1,characterId:'player'}).next;
  const r = command(s,'END_WEEK',{expectedWeek:1});
  expect(r.report!.order!.targets.authority).toBe(base.report!.order!.targets.authority+4);
  expect(ITEM_TRIAL.effects.crownAuthority).toBe(3);
});
