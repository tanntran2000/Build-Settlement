import { createSocietyState, isTileTrialState, societyPopulation, type TileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { executeTileTrialCommand } from '../tile-trial.js';
import { resolveTrialImmigration } from '../tile-trial-immigration.js';

const tile=(s:TileTrialState,id:string)=>s.tiles.find(t=>t.id===id)!;
const settlement=(s:TileTrialState)=>s.world.settlements[s.world.activeSettlementId!];
function expanded(){
 const s=createSocietyState();s.society!.order.authority=70;
 Object.assign(s.society!.classes,{free:55,makers:{common:40,elite:0},luminaries:{common:0,elite:0},merchants:{common:5,elite:0}});
 settlement(s).inventory.gold=1000000;
 for(const [id,typeId] of [['forest-1','logging'],['ore-1','mine'],['plain-2','workshop']] as const)tile(s,id).building={typeId,level:1,workers:1,enabled:true};
 tile(s,'field-1').building!.workers=3;tile(s,'plain-1').building!.workers=3;
 return s;
}
function refused(reason:string){
 const s=expanded();
 if(reason==='liquidity')settlement(s).inventory.gold=2500;
 if(reason==='target-unfunded'||reason==='upkeep-unpaid'){
  tile(s,'service-1').building={typeId:'town-hall',level:1,workers:0,enabled:true};
  if(reason==='upkeep-unpaid')settlement(s).inventory.gold=2500;
 }
 if(reason==='no-capacity'){const city=createSocietyState();city.society!.order.authority=70;return city;}
 if(reason==='zero-population'){
  s.society!.classes.free=0;
  for(const key of ['makers','luminaries','merchants'] as const)s.society!.classes[key]={common:0,elite:0};
  settlement(s).cohorts[0].count=0;
  for(const t of s.tiles)if(t.building)t.building.workers=0;
 }
 if(reason==='food-shortage'){
  const c=s.society!.classes;c.free=20;c.makers={common:20,elite:41};c.luminaries={common:0,elite:0};c.merchants={common:0,elite:0};
  settlement(s).cohorts[0].count=81;settlement(s).inventory.food=0;
  tile(s,'field-1').building!.workers=2;tile(s,'plain-1').building!.workers=2;
  for(const id of ['forest-1','ore-1','plain-2'])tile(s,id).building=null;
 }
 return s;
}
it.each(['liquidity','upkeep-unpaid','target-unfunded','food-shortage','no-capacity','zero-population'])('preserves %s refusal at Authority 70 without admitting a bonus resident',reason=>{
 const s=refused(reason),before=structuredClone(s),population=societyPopulation(s.society!);
 expect(isTileTrialState(s)).toBe(true);
 const r=executeTileTrialCommand(s,{type:'END_WEEK',expectedRevision:s.revision,expectedWeek:s.world.week});
 expect(s).toEqual(before);expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.report!.immigration).toMatchObject({reason,arrivals:0,populationBefore:population,populationAfter:population});
 expect(r.report!.order).toMatchObject({arrivalsBudgetBefore:0,arrivalsBudgetAfter:0});
 expect(societyPopulation(r.nextState.society!)).toBe(population);
 expect(isTileTrialState(r.nextState)).toBe(true);
});
it('reports cohort-unavailable before calculating capacity and rejects the whole End Week atomically',()=>{
 const s=expanded();settlement(s).cohorts[0].id='different';const before=structuredClone(s);
 const r=resolveTrialImmigration(s,{fundedTileIds:s.tiles.filter(t=>t.building).map(t=>t.id),farmBatches:3,processorBatches:3,woodProducedMilli:2000,ironProducedMilli:1000,operatingDebitMilli:5500,foodDemandMilli:4000,foodConsumedMilli:4000,unpaidUpkeepMilli:0});
 expect(r).toMatchObject({reason:'cohort-unavailable',target:100,populationAfter:100,arrivals:0});
 const end=executeTileTrialCommand(s,{type:'END_WEEK',expectedRevision:s.revision,expectedWeek:s.world.week});
 expect(end).toMatchObject({success:false,error:{code:'EXECUTION_ERROR'}});expect(s).toEqual(before);
});
