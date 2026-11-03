import { describe, expect, it } from 'vitest';
import { createSocietyState, societyPopulation, type TileTrialState } from '@haven/core';
import { runTileTrialWeek } from '../tile-trial-week.js';
import { resolveTrialImmigration } from '../tile-trial-immigration.js';

const tile=(s:TileTrialState,id:string)=>s.tiles.find(t=>t.id===id)!;
const inv=(s:TileTrialState)=>s.world.settlements[s.world.activeSettlementId!].inventory;
function city(){
 const s=createSocietyState();
 for(const t of s.tiles)if(t.building && t.building.workers>0)t.building=null;
 inv(s).gold=200000;s.society!.wallRing=3;
 return s;
}
function build(s:TileTrialState,id:string,typeId:string,workers:number,level=1){
 tile(s,id).building={typeId,workers,level,enabled:true};
 if(s.society!.outside[id])s.society!.outside[id].wild=false;
}
function sync(s:TileTrialState){s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=societyPopulation(s.society!);}

describe('outside extraction and chains',()=>{
 it('limits logging to the remaining deposit',()=>{
  const s=city();build(s,'forest-1','logging',2);s.society!.outside['forest-1'].depositMilli=3000;
  const r=runTileTrialWeek(s);expect(inv(s).wood).toBe(11000);expect(r.outside?.producedMilli.wood).toBe(3000);expect(s.society!.outside['forest-1'].depositMilli).toBe(0);
 });
 it('applies Deep Shaft output to Iron',()=>{
  const s=city();build(s,'ore-1','mine',2);s.society!.outside['ore-1'].deepShaft=true;
  const r=runTileTrialWeek(s);expect(inv(s).iron).toBe(7000);expect(s.society!.outside['ore-1'].depositMilli).toBe(77000);expect(r.outside?.producedMilli.iron).toBe(3000);
 });
 it.each([['rock-1','quarry','stone',2000],['pasture-1','sheep-pasture','wool',2000],['meadow-1','herb-garden','herbs',1000]] as const)('produces from %s', (id,type,good,amount)=>{
  const s=city();build(s,id,type,2);const r=runTileTrialWeek(s);expect(s.society!.stocksMilli[good]).toBe(amount);expect(r.outside?.producedMilli[good]).toBe(amount);
 });
 it('weaves two Wool into one Cloth',()=>{const s=city();build(s,'plain-2','weaver',1);s.society!.stocksMilli.wool=2000;const r=runTileTrialWeek(s);expect(s.society!.stocksMilli).toMatchObject({wool:0,cloth:1000});expect(r.outside?.producedMilli.cloth).toBe(1000);});
 it.each([true,false])('uses the Cloth recipe first when available=%s',cloth=>{
  const s=city();build(s,'plain-2','workshop',1);inv(s).wood=cloth?1000:2000;s.society!.stocksMilli.cloth=cloth?1000:0;
  const r=runTileTrialWeek(s);expect(r.goodsStock?.producedMilli).toBe(2000);expect(inv(s).wood).toBe(0);expect(s.society!.stocksMilli.cloth).toBe(0);
 });
 it('runs Weaver before Workshop independent of tile order',()=>{
  const s=city();build(s,'plain-2','workshop',1);build(s,'plain-3','weaver',1);s.society!.stocksMilli.wool=2000;inv(s).wood=1000;
  const r=runTileTrialWeek(s);expect(r.goodsStock?.producedMilli).toBe(2000);expect(s.society!.stocksMilli).toMatchObject({wool:0,cloth:0});
 });
 it('excludes Hospitals without Herbs and consumes Herbs when operating',()=>{
  const dry=city();dry.society!.classes.luminaries.common=20;sync(dry);build(dry,'service-1','hospital',2);
  const wet=structuredClone(dry);wet.society!.stocksMilli.herbs=1000;
  const a=runTileTrialWeek(dry),b=runTileTrialWeek(wet);
  expect(a.outside?.hospitalsIdle).toEqual(['service-1']);expect(b.outside?.hospitalsIdle).toEqual([]);expect(wet.society!.stocksMilli.herbs).toBe(0);
  expect(wet.society!.satisfaction.free).toBeGreaterThan(dry.society!.satisfaction.free);
 });
 it.each(['quarry','sheep-pasture','herb-garden','weaver'])('counts %s slots directly for immigration',type=>{
  const s=city(),id=type==='quarry'?'rock-1':type==='sheep-pasture'?'pasture-1':type==='herb-garden'?'meadow-1':'plain-2';build(s,id,type,0);
  const facts={fundedTileIds:[id],farmBatches:0,processorBatches:0,woodProducedMilli:0,ironProducedMilli:0,operatingDebitMilli:0,foodDemandMilli:0,foodConsumedMilli:0,unpaidUpkeepMilli:0};
  expect(resolveTrialImmigration(s,facts).usefulWorkerSlots).toBe(type==='weaver'?1:2);
 });
});
