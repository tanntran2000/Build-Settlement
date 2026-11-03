import { describe, expect, it } from 'vitest';
import { createSocietyState, isTileTrialState, isTileTrialPlanningState, societyPopulation, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
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
  const r=runTileTrialWeek(s);expect(inv(s).wood).toBe(11000);expect(r.outside?.producedMilli.wood).toBe(3000);expect(s.society!.outside['forest-1'].depositMilli).toBe(3000);
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

describe('soft storage limits after the complete week',()=>{
 it.each([40000,40001])('caps Wheat %s with exact spoilage',amount=>{
  const s=city();inv(s).wheat=amount;const r=runTileTrialWeek(s);expect(inv(s).wheat).toBe(40000);expect(r.outside?.spoiledMilli.wheat).toBe(amount===40000?undefined:1);
 });
 it.each(['operating','disabled','understaffed','unfunded'] as const)('Warehouse L2 adds capacity only when %s',mode=>{
  const s=city();build(s,'spec-2','warehouse',mode==='understaffed'?1:2,2);
  if(mode==='disabled'){tile(s,'spec-2').building!.enabled=false;tile(s,'spec-2').building!.workers=0;}
  if(mode==='unfunded'){inv(s).gold=0;s.society!.classes.free=0;s.society!.classes.makers.common=0;s.society!.classes.luminaries.common=0;s.society!.classes.merchants.common=0;sync(s);}
  inv(s).wheat=120001;const r=runTileTrialWeek(s);const cap=mode==='operating'?120000:40000;
  expect(inv(s).wheat).toBe(cap);expect(r.outside?.spoiledMilli.wheat).toBe(120001-cap);
 });
 it('caps all ten stored goods after consumption and excludes Gold',()=>{
  const s=city();for(const key of ['food','wheat','wood','iron'] as const)inv(s)[key]=100000;
  s.goodsStock!.amountMilli=100000;s.society!.luxuryStockMilli=100000;
  Object.assign(s.society!.stocksMilli,{stone:100000,wool:100000,cloth:100000,herbs:100000});
  const r=runTileTrialWeek(s);expect(r.outside?.spoiledMilli).toEqual({food:56000,wheat:60000,wood:60000,iron:60000,goods:58550,luxury:60000,stone:60000,wool:60000,cloth:60000,herbs:60000});
  expect(inv(s)).toMatchObject({food:40000,wheat:40000,wood:40000,iron:40000});expect(inv(s).gold).toBeGreaterThan(200000);
  expect(s.goodsStock!.amountMilli).toBe(40000);expect(s.society!.luxuryStockMilli).toBe(40000);expect(r.outside?.stocksAfter).toEqual({stone:40000,wool:40000,cloth:40000,herbs:40000});
  expect(r.goodsStock?.closingMilli).toBe(40000);
 });
 it('spoilage follows clearing rewards and current-week production',()=>{
  const s=city();inv(s).wood=39000;Object.assign(s.society!.outside['forest-3'],{clearMilli:5000,clearWorkers:1,clearPaid:true});
  const r=runTileTrialWeek(s);expect(inv(s).wood).toBe(40000);expect(r.outside?.spoiledMilli.wood).toBe(4000);
 });
});

describe('outside weekly land and research',()=>{
 it('clears a pasture in two weeks and releases its workers',()=>{
  const s=city(),p=s.society!.outside['pasture-1'];p.clearWorkers=2;p.clearPaid=true;
  expect(runTileTrialWeek(s).outside?.cleared).toEqual([]);expect(s.society!.outside['pasture-1'].clearMilli).toBe(2000);
  const r=runTileTrialWeek(s);expect(r.outside?.cleared).toEqual(['pasture-1']);expect(s.society!.outside['pasture-1']).toMatchObject({wild:false,clearMilli:4000,clearWorkers:0});
 });
 it('preserves paused clearing and resumes without losing work',()=>{
  const s=city();s.society!.outside['pasture-1'].clearMilli=2000;runTileTrialWeek(s);expect(s.society!.outside['pasture-1'].clearMilli).toBe(2000);
  s.society!.outside['pasture-1'].clearWorkers=2;expect(runTileTrialWeek(s).outside?.cleared).toEqual(['pasture-1']);
 });
 it('awards forest clearing Wood once and caps clearing progress',()=>{
  const s=city();Object.assign(s.society!.outside['forest-3'],{clearWorkers:2,clearMilli:5000,clearPaid:true});
  const a=runTileTrialWeek(s);expect(a.outside?.cleared).toEqual(['forest-3']);expect(inv(s).wood).toBe(13000);expect(s.society!.outside['forest-3'].clearMilli).toBe(6000);
  runTileTrialWeek(s);expect(inv(s).wood).toBe(13000);
 });
 it('completes Deep Mining once after eight operating Library weeks',()=>{
  const s=city();build(s,'spec-2','library',1);s.society!.research.topic='deep-mining';s.society!.research.paid=['deep-mining'];
  for(let i=0;i<7;i++){expect(runTileTrialWeek(s).outside?.researchCompleted).toEqual([]);expect(s.society!.research.progressMilli['deep-mining']).toBe((i+1)*1000);}
  expect(runTileTrialWeek(s).outside?.researchCompleted).toEqual(['deep-mining']);expect(s.society!.research).toMatchObject({topic:null,completed:['deep-mining']});
  expect(runTileTrialWeek(s).outside?.researchCompleted).toEqual([]);
 });
 it.each(['disabled','understaffed','unfunded'] as const)('does not research with a %s Library',mode=>{
  const s=city();build(s,'spec-2','library',mode==='understaffed'?0:1);if(mode==='disabled')tile(s,'spec-2').building!.enabled=false;
  if(mode==='unfunded'){inv(s).gold=0;s.society!.classes.free=0;s.society!.classes.makers.common=0;s.society!.classes.luminaries.common=0;s.society!.classes.merchants.common=0;sync(s);}
  s.society!.research.topic='deep-mining';runTileTrialWeek(s);expect(s.society!.research.progressMilli['deep-mining']).toBe(0);
 });
 it('caps forest regrowth at its deposit cap',()=>{const s=city();s.society!.outside['forest-1'].depositMilli=58000;runTileTrialWeek(s);expect(s.society!.outside['forest-1'].depositMilli).toBe(60000);});
 it.each([['ore-1','mine'],['rock-1','quarry']] as const)('exhausts %s, closes it, releases workers and permits a Processor', (id,type)=>{
  const s=city();build(s,id,type,2);s.society!.outside[id].depositMilli=1000;expect(isTileTrialState(s)).toBe(true);
  const r=runTileTrialWeek(s);expect(r.outside?.exhausted).toEqual([id]);expect(tile(s,id)).toMatchObject({terrain:'plain',building:null});expect(isTileTrialState(s)).toBe(true);
  s.phase='planning';expect(isTileTrialPlanningState(s)).toBe(true);
  const built=executeTileTrialCommand(s,{type:'BUILD',tileId:id,typeId:'processor',expectedRevision:s.revision});expect(built.success).toBe(true);
 });
});
