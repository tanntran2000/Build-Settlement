import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { crisisOptions, societyPopulation } from '@haven/core';
import { deserializeCharacterLifeSave } from '@haven/persistence';
import { crisisFixture, crisisFixtureBytes, fixtureStep } from './crisis-fixture-helper.js';
it.each(['life-5-weeks','life-demand-card','life-rebellion-last-week'] as const)('pins production-generated %s bytes',name=>{
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v8/${name}.json`,import.meta.url);
 const bytes=crisisFixtureBytes(name);
 if(process.env.GENERATE_CRISIS_FIXTURES==='1')writeFileSync(url,bytes,'utf8');
 expect(readFileSync(url,'utf8')).toBe(bytes);
 expect(deserializeCharacterLifeSave(bytes)).toEqual({success:true,state:crisisFixture(name)});
});
it('funds Demand Pay and reaches fallen in one End Week from the Rebellion pin',()=>{
 const demand=crisisFixture('life-demand-card'),s=demand.city.society!;
 const gold=demand.city.world.settlements[demand.city.world.activeSettlementId!].inventory.gold;
 expect(crisisOptions('demand',{population:societyPopulation(s),goldMilli:gold,security:s.order.security,promisePending:false})[0].available).toBe(true);
 expect(gold).toBeGreaterThanOrEqual(societyPopulation(s)*20);
 const rebellion=crisisFixture('life-rebellion-last-week');
 expect(rebellion.city.world.settlements[rebellion.city.world.activeSettlementId!].inventory.food).toBe(0);
 expect(Object.values(rebellion.city.society!.satisfaction)).toEqual([10,10,10,10,10]);
 expect(fixtureStep(rebellion,'END_WEEK').city.society!.crisis.stage).toBe('fallen');
});
