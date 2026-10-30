import { expect, it } from 'vitest';
import { createSocietyState, societyPopulation, TILE_TRIAL_BALANCE, POPULATION_TILE_RULESET } from '@haven/core';
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
