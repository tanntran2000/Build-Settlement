import { expect, it } from 'vitest';
import { createSocietyState, societyPopulation, POPULATION_TILE_RULESET } from '@haven/core';
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
