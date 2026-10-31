import { expect, it } from 'vitest';
import { createSocietyState, societyPopulation, isTileTrialState, TILE_TRIAL_BALANCE, POPULATION_TILE_RULESET } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
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

function endSociety(city: ReturnType<typeof createSocietyState>) {
 expect(isTileTrialState(city)).toBe(true);
 const result=executeTileTrialCommand(city,{type:'END_WEEK',expectedWeek:city.world.week,expectedRevision:city.revision},POPULATION_TILE_RULESET);
 expect(result.success).toBe(true); if(!result.success) throw Error(JSON.stringify(result.error));
 expect(isTileTrialState(result.nextState)).toBe(true);
 return result;
}
it('releases the last basic assignment after Academy training shrinks the Free pool', () => {
 const city=createSocietyState(); city.society!.classes.free=50;
 city.tiles.find(t=>t.building?.typeId==='farm')!.building!.workers=4;
 city.tiles.find(t=>t.id==='service-1')!.building={typeId:'tavern',level:1,workers:1,enabled:true};
 city.society!.classes.luminaries.common=20;
 city.world.settlements[city.world.activeSettlementId!].cohorts[0].count=103;
 city.tiles.find(t=>t.id==='spec-2')!.building={typeId:'academy',level:1,workers:2,enabled:true};
 city.society!.training.target='makers';
 const result=endSociety(city);
 expect(result.nextState.society!.classes.free).toBe(48);
 expect(result.nextState.tiles.find(t=>t.id==='service-1')!.building).toMatchObject({workers:0,enabled:true});
 expect(result.nextState.tiles.find(t=>t.building?.typeId==='farm')!.building!.workers).toBe(4);
 expect(result.report!.activities).toContain('service-1: released 1 basic worker(s) after society population changes.');
});
it('releases basic staff when enslavement reduces the sum of rounded pools', () => {
 const city=createSocietyState();
 city.society!.classes.free=50; city.society!.classes.bound.free=8;
 city.society!.debtPressure.free=100;
 city.world.settlements[city.world.activeSettlementId!].cohorts[0].count=103;
 city.tiles.find(t=>t.building?.typeId==='farm')!.building!.workers=5;
 city.tiles.find(t=>t.id==='slum-1')!.building={typeId:'slave-quarters',level:1,workers:0,enabled:true};
 const result=endSociety(city);
 expect(result.report!.society!.classes.free.enslaved).toBe(1);
 expect(result.nextState.society!.classes.free).toBe(49);
 expect(result.nextState.society!.classes.bound.free).toBe(9);
 expect(result.nextState.tiles.find(t=>t.building?.typeId==='farm')!.building).toMatchObject({workers:4,enabled:true});
});
it.each([false,true])('reports resolved immigration with Elite Manor=%s', elite => {
 const city=createSocietyState();
 if(elite) city.tiles.find(t=>t.id==='house-4')!.building={typeId:'elite-manor',level:1,workers:0,enabled:true};
 else {
  for(const tile of city.tiles) if(tile.id.startsWith('house-')) tile.building=null;
  city.society!.classes.free=40; city.society!.classes.makers.common=40;
  city.society!.classes.luminaries.common=10; city.society!.classes.merchants.common=10;
  city.tiles.find(t=>t.building?.typeId==='farm')!.building!.workers=3;
  city.tiles.find(t=>t.id==='plain-3')!.building={typeId:'workshop',level:1,workers:1,enabled:true};
  city.tiles.find(t=>t.building?.typeId==='processor')!.building!.workers=3;
  city.tiles.find(t=>t.terrain==='forest')!.building={typeId:'logging',level:1,workers:1,enabled:true};
 }
 const result=endSociety(city), immigration=result.report!.immigration!;
 if(!elite) { expect(immigration.target).toBeGreaterThan(100); expect(immigration.reason).toBe('arrivals'); }
 expect(immigration.arrivals).toBe(elite?1:0);
 expect(immigration.populationAfter).toBe(elite?101:100);
 expect(immigration.arrivals).toBe(immigration.populationAfter-immigration.populationBefore);
});
