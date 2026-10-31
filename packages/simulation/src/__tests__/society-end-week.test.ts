import { expect, it } from 'vitest';
import { createSocietyState, societyPopulation, TILE_TRIAL_BALANCE, POPULATION_TILE_RULESET } from '@haven/core';
import { societyFacilities } from '../society-facilities.js';
import { runTileTrialWeek } from '../tile-trial-week.js';
it('resolves society needs, housing and happiness deterministically', () => {
 const before=createSocietyState(), a=structuredClone(before), b=structuredClone(before);
 const report=runTileTrialWeek(a, POPULATION_TILE_RULESET);
 expect(report.goods.servedMilli).toBe(1450);
 expect(report.goods.revenueMilli).toBe(1450);
 expect(report.goodsStock?.capacityMilli).toBe(2000);
 expect(a.society!.satisfaction).toEqual({free:82,makers:82,luminaries:82,merchants:82,bound:80});
 expect(a.happiness).toBe(82);
 for(const [id,room] of Object.entries({free:15,makers:5,luminaries:6,merchants:2,bound:0})) {
  expect(report.society!.classes[id as 'free'|'makers'|'luminaries'|'merchants'|'bound'].foodBps).toBe(10000);
  expect(report.society!.classes[id as 'free'|'makers'|'luminaries'|'merchants'|'bound'].arrivals).toBeLessThanOrEqual(room);
 }
 expect(a.world.settlements[a.world.activeSettlementId!].cohorts.reduce((n,c)=>n+c.count,0)).toBe(societyPopulation(a.society!));
 const arrivals=Object.values(report.society!.classes).reduce((total,c)=>total+c.arrivals,0);
 expect(a.world.settlements[a.world.activeSettlementId!].cohorts.reduce((n,c)=>n+c.count,0)).toBe(100+arrivals);
 expect(report.society!.eliteArrived).toBeNull();
 expect(runTileTrialWeek(b, POPULATION_TILE_RULESET)).toEqual(report); expect(a).toEqual(b); expect(before).toEqual(createSocietyState());
});
it.each([{gold:3999,imported:0,closing:2999},{gold:4000,imported:2000,closing:0}])('imports Luxury only with the full 3000 Gold milli after upkeep ($gold)', ({gold,imported,closing}) => {
 const city=createSocietyState();
 for(const tile of city.tiles) tile.building=null;
 city.tiles.find(t=>t.id==='spec-2')!.building={typeId:'trading-post',level:1,workers:2,enabled:true};
 city.society!.classes={free:0,makers:{common:0,elite:0},luminaries:{common:0,elite:0},merchants:{common:20,elite:0},bound:{free:0,makers:0,luminaries:0,merchants:0}};
 const settlement=city.world.settlements[city.world.activeSettlementId!];
 settlement.cohorts.find(c=>c.id==='weekly_middle')!.count=20;
 // Offset the existing base tax so opening Gold plus tax equals the table's pre-upkeep budget.
 settlement.inventory.gold=gold-20*TILE_TRIAL_BALANCE.taxGoldPerResident;
 const report=runTileTrialWeek(city,POPULATION_TILE_RULESET);
 expect(report.taxMilli).toBe(20*TILE_TRIAL_BALANCE.taxGoldPerResident);
 expect(report.upkeepPaidMilli).toBe(1000);
 expect(report.luxuryImportedMilli).toBe(imported);
 expect(city.society!.luxuryStockMilli).toBe(imported);
 expect(settlement.inventory.gold).toBe(closing);
});

it('credits the Counting House bonus after upkeep, leaving Slave Quarters unfunded', () => {
 const city=createSocietyState();
 for(const tile of city.tiles) tile.building=null;
 city.society!.classes={free:40,makers:{common:0,elite:0},luminaries:{common:20,elite:0},merchants:{common:40,elite:0},bound:{free:0,makers:0,luminaries:0,merchants:0}};
 const settlement=city.world.settlements[city.world.activeSettlementId!];
 settlement.cohorts.find(c=>c.id==='weekly_middle')!.count=100;
 settlement.inventory.gold=0;
 for(const [id,typeId,workers] of [['spec-1','academy',2],['spec-2','counting-house',2],['spec-3','trading-post',2],['slum-1','slave-quarters',0]] as const)
  city.tiles.find(t=>t.id===id)!.building={typeId,level:1,workers,enabled:true};
 const report=runTileTrialWeek(city,POPULATION_TILE_RULESET);
 // 100 residents ? 30 base tax; three 1000 upkeep bills exhaust it.
 // The funded L1 Counting House then adds 10% (300), too late for 200 upkeep.
 expect(report.taxMilli).toBe(3300);
 expect(report.upkeepPaidMilli).toBe(3000);
 expect(report.unpaidUpkeepMilli).toBe(200);
 expect(report.activities).toContain('slum-1: Slave Quarters idle; upkeep unfunded.');
 const fundedIds=new Set(city.tiles.filter(t=>t.building && !report.activities.some(a=>a.startsWith(`${t.id}:`) && a.endsWith('upkeep unfunded.'))).map(t=>t.id));
 expect(societyFacilities(city,fundedIds).housing.bound).toBe(0);
 expect(report.luxuryImportedMilli).toBe(0);
 expect(city.society!.luxuryStockMilli).toBe(0);
 expect(report.trainingGoldMilli).toBe(0);
 expect(settlement.inventory.gold).toBe(300);
});
