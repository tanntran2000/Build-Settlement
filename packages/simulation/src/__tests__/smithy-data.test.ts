import { createSocietyState, SOCIETY_BUILDINGS, TRIAL_BUILDINGS, buildingWorkerCap, type TileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { executeTileTrialCommand } from '../tile-trial.js';

const funded=()=>{
  const state=createSocietyState();
  const inventory=state.world.settlements[state.world.activeSettlementId!].inventory;
  for(const key of ['gold','wood','iron'] as const)inventory[key]=100000;
  return state;
};
function act(state:TileTrialState,command:Record<string,unknown>){
  const result=executeTileTrialCommand(state,{...command,expectedRevision:state.revision});
  expect(result.success).toBe(true);if(!result.success)throw Error(`${result.error.code}: ${result.error.message}`);
  return result.nextState;
}
function refused(state:TileTrialState,command:Record<string,unknown>,code:string){
  const before=structuredClone(state),result=executeTileTrialCommand(state,{...command,expectedRevision:state.revision});
  expect(result).toMatchObject({success:false,error:{code}});expect(state).toEqual(before);
}
// Catches reserved Smithy, wrong tier/cost, and caps that do not follow level.
it('starts ruleset 09 with the exact active Specialist Smithy staffed by Makers',()=>{
  expect(createSocietyState().society!.rulesetId).toBe('tile-society-15');
  expect(TRIAL_BUILDINGS.smithy).toEqual({name:'Smithy',operation:'society',terrain:['town'],maxLevel:2,maxWorkers:1,cost:{gold:10000,wood:6000,iron:6000},upkeepMilli:1000});
  expect(SOCIETY_BUILDINGS.smithy).toEqual({tier:'specialist',staff:'makers',reserved:false});
});
it('builds through the real dispatcher for 10 Gold, 6 Wood and 6 Iron without mutating input',()=>{
  const state=funded(),before=structuredClone(state),next=act(state,{type:'BUILD',tileId:'spec-2',typeId:'smithy'});
  expect(state).toEqual(before);
  expect(next.tiles.find(t=>t.id==='spec-2')!.building).toEqual({typeId:'smithy',level:1,workers:0,enabled:true});
  const inventory=next.world.settlements[next.world.activeSettlementId!].inventory;
  expect({gold:inventory.gold,wood:inventory.wood,iron:inventory.iron}).toEqual({gold:90000,wood:94000,iron:94000});
});
it('enforces one worker at level 1 and two at level 2 through BUILD, UPGRADE and SET_WORKERS',()=>{
  // The starting Processor occupies both available Makers workforce units.
  let state=act(funded(),{type:'SET_WORKERS',tileId:'plain-1',workers:0});
  state=act(state,{type:'BUILD',tileId:'spec-2',typeId:'smithy'});
  expect(buildingWorkerCap('smithy',1)).toBe(1);expect(buildingWorkerCap('smithy',2)).toBe(2);
  state=act(state,{type:'SET_WORKERS',tileId:'spec-2',workers:1});
  refused(state,{type:'SET_WORKERS',tileId:'spec-2',workers:2},'INVALID_PLAN');
  state=act(state,{type:'UPGRADE',tileId:'spec-2'});
  state=act(state,{type:'SET_WORKERS',tileId:'spec-2',workers:2});
  expect(state.tiles.find(t=>t.id==='spec-2')!.building).toEqual({typeId:'smithy',level:2,workers:2,enabled:true});
  refused(state,{type:'SET_WORKERS',tileId:'spec-2',workers:3},'INVALID_PLAN');
  refused(state,{type:'UPGRADE',tileId:'spec-2'},'MAX_LEVEL');
});
it('refuses a service plot and outside terrain atomically',()=>{
  refused(funded(),{type:'BUILD',tileId:'service-1',typeId:'smithy'},'WRONG_TIER');
  refused(funded(),{type:'BUILD',tileId:'plain-2',typeId:'smithy'},'INVALID_PLACEMENT');
});
it.each([['gold',9999],['wood',5999],['iron',5999]] as const)('refuses Smithy when %s is one milli short without partial charging', (resource,amount)=>{
  const state=funded();state.world.settlements[state.world.activeSettlementId!].inventory[resource]=amount;
  refused(state,{type:'BUILD',tileId:'spec-2',typeId:'smithy'},'INSUFFICIENT_RESOURCES');
});
