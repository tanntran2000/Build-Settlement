import { readFileSync } from 'node:fs';
import { createSocietyState, LAW_IDS, lawTerms, type LawId } from '@haven/core';
import { deserializeCharacterLifeSave } from '@haven/persistence';
import { expect, it } from 'vitest';
import { resolveLawGold, resolveLawPromiseWeek } from '../law-week.js';
import { runTileTrialWeek } from '../tile-trial-week.js';
import { resolveCorruption } from '../society-week.js';
import { fixtureStep } from './crisis-fixture-helper.js';

it.each(LAW_IDS)('applies %s during End Week',id=>{
 const control=createSocietyState(),s=structuredClone(control);
 s.society!.laws.active=[id];
 const baseline=runTileTrialWeek(control),r=runTileTrialWeek(s),terms=lawTerms([id]);
 expect(r.laws).toMatchObject({inForce:[id],unfunded:[],promise:null});
 const clamp=(n:number)=>Math.max(0,Math.min(100,n));
 for(const group of ['free','makers','luminaries','merchants'] as const)
  expect(s.society!.satisfaction[group]).toBe(clamp(control.society!.satisfaction[group]+terms.satisfaction[group]));
 expect(s.society!.desperation).toBe(clamp(control.society!.desperation+terms.desperation));
 expect(s.society!.tension).toBe(clamp(control.society!.tension+terms.tension));
 expect(r.order!.targets.security).toBe(clamp(baseline.order!.targets.security+terms.securityTarget));
 // With New Game's drift, Security and Crime after are unchanged by these target terms.
 expect(r.order!.targets.crime).toBe(clamp(baseline.order!.targets.crime+terms.crimeTarget));
 if(id==='free-assembly')expect(r.order!.targets.authority).toBe(baseline.order!.targets.authority-5);
 if(id==='watch-levy')expect(r.laws!.costs).toEqual([{lawId:id,goldMilli:1000}]);
 if(id==='poor-relief')expect(r.laws!.costs).toEqual([{lawId:id,goldMilli:1500}]);
 if(id==='licensed-vice')expect(r.laws!.incomeMilli).toBe(1500);
 if(id==='war-tithe'){expect(r.taxMilli).toBe(baseline.taxMilli+300);expect(r.order!.taxModifierBps).toBe(1000);}
});
it.each(['watch-levy','poor-relief'] as const)('does not apply unfunded %s',id=>{
 const s=createSocietyState();s.society!.laws.active=[id];
 const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;stocks.gold=0;
 expect(resolveLawGold(s,stocks)).toEqual({applied:[],unfunded:[id],costs:[],incomeMilli:0});
 expect(stocks.gold).toBe(0);
});
it.each([['watch-levy','poor-relief',1000],['poor-relief','watch-levy',1500]] as const)('funds %s before %s with exactly %i milli',(first,second,gold)=>{
 const s=createSocietyState();s.society!.laws.active=[first,second];
 const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;stocks.gold=gold;
 expect(resolveLawGold(s,stocks)).toEqual({applied:[first],unfunded:[second],costs:[{lawId:first,goldMilli:gold}],incomeMilli:0});
 expect(stocks.gold).toBe(0);
});
it('credits unscaled Licensed Vice before building upkeep',()=>{
 const s=createSocietyState();s.society!.order.authority=0;s.society!.laws.active=['licensed-vice'];
 s.society!.classes.merchants.common=20;s.society!.classes.free=48;
 s.tiles.find(t=>t.id==='spec-2')!.building={typeId:'counting-house',level:1,workers:2,enabled:true};
 s.world.settlements[s.world.activeSettlementId!].inventory.gold=100;
 const r=runTileTrialWeek(s);
 // 100 opening + 2400 lower bound + 1500 Vice covers exactly 4000 operating debit.
 expect(r.upkeepPaidMilli).toBe(3000);expect(r.unpaidUpkeepMilli).toBe(0);
 expect(r.taxMilli).toBe(2640);expect(r.laws!.incomeMilli).toBe(1500);
 expect(r.after.gold).toBe(1760);
});
it('moves the corruption target by each Dark and Light tag',()=>{
 expect(resolveCorruption(30,0,lawTerms(['licensed-vice']).corruptionTarget)).toBe(32);
 expect(resolveCorruption(30,0,lawTerms(['poor-relief']).corruptionTarget)).toBe(28);
 expect(resolveCorruption(30,0,lawTerms(['licensed-vice','public-punishments','poor-relief']).corruptionTarget)).toBe(32);
 expect(resolveCorruption(0,0,-100)).toBe(0);
});
it.each([80,79])('resolves a repealed-law promise at satisfaction %i',satisfaction=>{
 const s=createSocietyState();s.society!.satisfaction.free=satisfaction;
 s.society!.laws.promise={group:'free',lawId:'poor-relief',satisfactionAtVote:80,weeksLeft:1};
 expect(resolveLawPromiseWeek(s)).toEqual({group:'free',lawId:'poor-relief',outcome:satisfaction===80?'kept':'broken'});
 expect(s.society!.laws.promise).toBeNull();
 expect(s.society!.order.authority).toBe(satisfaction===80?53:50);
 expect(s.society!.satisfaction.free).toBe(satisfaction===80?80:69);
 expect(s.society!.tension).toBe(satisfaction===80?0:10);
});
it.each([82,83])('syncs promise reports for satisfaction threshold %i',threshold=>{
 const s=createSocietyState();s.society!.laws.promise={group:'free',lawId:'poor-relief',satisfactionAtVote:threshold,weeksLeft:1};
 const r=runTileTrialWeek(s);
 expect(r.laws!.promise).toEqual({group:'free',lawId:'poor-relief',outcome:threshold===82?'kept':'broken'});
 expect(r.order!.after.authority).toBe(s.society!.order.authority);
 expect(r.society!.classes.free.satisfactionAfter).toBe(s.society!.satisfaction.free);
 expect(r.society!.tensionAfter).toBe(s.society!.tension);expect(r.happinessAfter).toBe(s.happiness);
});
it('decrements a pending promise once each week',()=>{
 const s=createSocietyState();s.society!.laws.promise={group:'free',lawId:'poor-relief',satisfactionAtVote:80,weeksLeft:4};
 expect(resolveLawPromiseWeek(s)).toBeNull();expect(s.society!.laws.promise!.weeksLeft).toBe(3);
});
it('preserves the law-free five-week gameplay pin and determinism',()=>{
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v8/life-new-game.json',import.meta.url),'utf8');
 const decoded=deserializeCharacterLifeSave(bytes);if(!decoded.success)throw Error(decoded.error.message);
 let s=decoded.state,other=structuredClone(s);
 for(let i=0;i<5;i++){
  s=fixtureStep(fixtureStep(s,'END_WEEK'),'NEXT_WEEK');other=fixtureStep(fixtureStep(other,'END_WEEK'),'NEXT_WEEK');
 }
 expect(s).toEqual(other);
 const old=JSON.parse(readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v5/life-5-weeks.json',import.meta.url),'utf8')).state;
 const {rulesetId:_ruleset,laws:_laws,...society}=s.city.society!;
 const {rulesetId:_oldRuleset,...oldSociety}=old.city.society;
 expect(society).toEqual(oldSociety);
 expect(s.city.world.settlements).toEqual(old.city.world.settlements);
});
it('is deterministic with three laws over five weeks',()=>{
 function run(){const s=createSocietyState();s.society!.laws.active=['poor-relief','watch-levy','licensed-vice'] as LawId[];for(let i=0;i<5;i++){runTileTrialWeek(s);s.phase='planning';}return s;}
 expect(run()).toEqual(run());
});
