import { createSocietyState, isTileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { runTileTrialWeek } from '../tile-trial-week.js';
import { executeTileTrialCommand } from '../tile-trial.js';

it.each([[0,2424,-606],[50,3030,0],[100,3636,606]])('applies Authority %i without a Counting House',(authority,tax,delta)=>{
 const s=createSocietyState();s.society!.order.authority=authority;s.society!.classes.free=56;
 s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=101;
 const r=runTileTrialWeek(s);expect(r.taxMilli).toBe(tax);
 expect(r.order).toMatchObject({taxModifierBps:(authority-50)*40,taxDeltaMilli:delta});
});
it('funds Counting House upkeep from the guaranteed credit before adding the nonnegative tax remainder',()=>{
 const s=createSocietyState();s.society!.order.authority=0;
 s.society!.classes.merchants.common=20;s.society!.classes.free=48;
 s.world.settlements[s.world.activeSettlementId!].inventory.gold=1600;
 s.tiles.find(t=>t.id==='spec-2')!.building={typeId:'counting-house',level:1,workers:2,enabled:true};
 expect(isTileTrialState(s)).toBe(true);const before=structuredClone(s);
 const r=executeTileTrialCommand(s,{type:'END_WEEK',expectedRevision:s.revision,expectedWeek:s.world.week});
 expect(s).toEqual(before);expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(isTileTrialState(r.nextState)).toBe(true);
 // 1600 opening + 2400 guaranteed tax funds all 4000 operating debits, leaving 0.
 // Final tax floor(3300*8000/10000)=2640 adds 240; Goods revenue adds 1520.
 expect(r.report!.taxMilli).toBe(2640);expect(r.report!.order!.taxDeltaMilli).toBe(-660);
 expect(r.report!.upkeepPaidMilli).toBe(3000);expect(r.report!.unpaidUpkeepMilli).toBe(0);
 expect(r.report!.after.gold).toBe(1760);
 expect(Object.values(r.nextState.world.settlements[s.world.activeSettlementId!].inventory).every(n=>n>=0)).toBe(true);
});
it.each(Array.from({length:101},(_,authority)=>authority))('matches the spec and has a nonnegative tax top-up at Authority %i',authority=>{
 // Exercise production End Week on valid cities: 101 * 5 * 4 * 2 = 4040 cases, including War Tithe.
 for(const taxBps of [0,1000])for(let levels=0;levels<=4;levels++)for(const population of [80,101,333,1000]){
  const s=createSocietyState(),society=s.society!,settlement=s.world.settlements[s.world.activeSettlementId!];
  society.order.authority=authority;society.laws.active=taxBps?['war-tithe']:[];society.classes.free=population-80;
  society.classes.makers={common:0,elite:0};society.classes.luminaries={common:0,elite:0};society.classes.merchants={common:80,elite:0};
  settlement.cohorts[0].count=population;settlement.inventory.gold=1000000;
  for(const tile of s.tiles)if(tile.building)tile.building.workers=0;
  let remaining=levels;
  for(const id of ['spec-2','spec-3']){
   const level=Math.min(2,remaining);remaining-=level;
   if(level>0)s.tiles.find(t=>t.id===id)!.building={typeId:'counting-house',level,workers:2*level,enabled:true};
  }
  expect(isTileTrialState(s)).toBe(true);
  const base=BigInt(population)*30n,factor=10000n+BigInt(authority-50)*40n+BigInt(taxBps);
  const credited=factor<10000n?base*factor/10000n:base;
  const withCH=base*BigInt(100+10*levels)/100n,final=withCH*factor/10000n;
  const report=runTileTrialWeek(s);
  expect(final-credited>=0n).toBe(true);
  expect(BigInt(report.taxMilli)-credited>=0n).toBe(true);
  expect(report.taxMilli).toBe(Number(final));
  expect(report.order!.taxDeltaMilli).toBe(Number(final-withCH));
  expect(report.upkeepPaidMilli).toBe(2000+1000*levels);expect(report.unpaidUpkeepMilli).toBe(0);
 }
});
