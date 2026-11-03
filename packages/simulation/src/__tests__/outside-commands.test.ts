import { describe, expect, it } from 'vitest';
import { createSocietyState, isTileTrialState, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { releaseSocietyWorkers, societyEmployment } from '../society-facilities.js';

const city=()=>{const s=createSocietyState();Object.assign(s.world.settlements[s.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});return s;};
const tile=(s:TileTrialState,id:string)=>s.tiles.find(t=>t.id===id)!;
const inv=(s:TileTrialState)=>s.world.settlements[s.world.activeSettlementId!].inventory;
const send=(s:TileTrialState,c:Record<string,unknown>)=>executeTileTrialCommand(s,{...c,expectedRevision:s.revision});
const next=(s:TileTrialState,c:Record<string,unknown>)=>{const before=structuredClone(s),r=send(s,c);expect(s).toEqual(before);if(!r.success)throw Error(JSON.stringify(r.error));expect(isTileTrialState(r.nextState)).toBe(true);expect(r.nextState.revision).toBe(s.revision+1);return r.nextState;};
const reject=(s:TileTrialState,c:Record<string,unknown>,code:string)=>{expect(isTileTrialState(s)).toBe(true);const before=structuredClone(s);expect(send(s,c)).toMatchObject({success:false,error:{code}});expect(s).toEqual(before);};
function quarry(){const s=city();s.society!.wallRing=2;s.society!.outside['rock-1'].wild=false;tile(s,'rock-1').building={typeId:'quarry',level:2,workers:0,enabled:true};s.society!.stocksMilli.stone=20000;return s;}
function researched(){const s=quarry();s.society!.research.completed=['deep-mining'];s.society!.research.paid=['deep-mining'];s.society!.research.progressMilli['deep-mining']=8000;return s;}
function yard(s:TileTrialState){tile(s,'plain-1').building!.workers=0;tile(s,'spec-2').building={typeId:'builders-yard',level:1,workers:2,enabled:true};}

describe('CLEAR',()=>{
 it('rejects a locked plot',()=>reject(city(),{type:'CLEAR',tileId:'pasture-1',workers:2},'LOCKED_PLOT'));
 it('pays the fee once, allows reassignment and preserves paused progress',()=>{
  let s=city();s.society!.wallRing=2;
  s=next(s,{type:'CLEAR',tileId:'pasture-1',workers:2});expect(inv(s).gold).toBe(198000);expect(s.society!.outside['pasture-1']).toMatchObject({clearWorkers:2,clearPaid:true});
  s.society!.outside['pasture-1'].clearMilli=1000;
  s=next(s,{type:'CLEAR',tileId:'pasture-1',workers:1});expect(inv(s).gold).toBe(198000);
  s=next(s,{type:'CLEAR',tileId:'pasture-1',workers:0});expect(inv(s).gold).toBe(198000);expect(s.society!.outside['pasture-1'].clearMilli).toBe(1000);
 });
 it('does not charge a zero-worker first assignment',()=>{const s=city();s.society!.wallRing=2;const n=next(s,{type:'CLEAR',tileId:'pasture-1',workers:0});expect(inv(n).gold).toBe(200000);expect(n.society!.outside['pasture-1'].clearPaid).toBe(false);});
 it.each([-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])('rejects invalid workers %s',workers=>{const s=city();s.society!.wallRing=2;reject(s,{type:'CLEAR',tileId:'pasture-1',workers},'INVALID_WORKFORCE');});
 it('rejects an inside plot',()=>reject(city(),{type:'CLEAR',tileId:'house-1',workers:1},'NOT_OUTSIDE'));
 it('rejects a cleared plot',()=>reject(city(),{type:'CLEAR',tileId:'field-1',workers:1},'NOT_WILD'));
 it('rejects combined basic and clearing pool overflow without charging',()=>{const s=city();s.society!.wallRing=2;reject(s,{type:'CLEAR',tileId:'pasture-1',workers:4},'INVALID_PLAN');});
 it('rejects an unaffordable fee',()=>{const s=city();s.society!.wallRing=2;inv(s).gold=1999;reject(s,{type:'CLEAR',tileId:'pasture-1',workers:1},'INSUFFICIENT_RESOURCES');});
 it('counts clearing workers Free first then Bound',()=>{const s=city();s.society!.wallRing=2;s.society!.classes.free=20;s.society!.classes.bound.free=35;s.society!.outside['pasture-1'].clearWorkers=2;expect(societyEmployment(s).assigned).toEqual({free:2,bound:2,makers:2,luminaries:0,merchants:0});});
});
describe('outside build paths',()=>{
 it.each(['BUILD','REPLACE','UPGRADE','BUILD_DEEP_SHAFT'])('%s rejects locked then wild plots atomically',type=>{
  const s=city(), c={type,tileId:'pasture-1',...(type==='BUILD'||type==='REPLACE'?{typeId:'sheep-pasture'}:{})};
  reject(s,c,'LOCKED_PLOT');s.society!.wallRing=2;reject(s,c,'WILD_PLOT');
 });
 it('builds on a cleared pasture',()=>{const s=city();s.society!.wallRing=2;s.society!.outside['pasture-1'].wild=false;const n=next(s,{type:'BUILD',tileId:'pasture-1',typeId:'sheep-pasture'});expect(tile(n,'pasture-1').building).toEqual({typeId:'sheep-pasture',level:1,workers:0,enabled:true});expect(inv(n)).toMatchObject({gold:197000,wood:98000,iron:50000});});
 it('charges 5000 Stone for Quarry level three and rejects 4999',()=>{const s=quarry();s.society!.stocksMilli.stone=4999;reject(s,{type:'UPGRADE',tileId:'rock-1'},'INSUFFICIENT_RESOURCES');s.society!.stocksMilli.stone=5000;const n=next(s,{type:'UPGRADE',tileId:'rock-1'});expect(n.society!.stocksMilli.stone).toBe(0);expect(tile(n,'rock-1').building!.level).toBe(3);});
 it('discounts level-three Stone with an operating Yard',()=>{const s=quarry();yard(s);s.society!.stocksMilli.stone=4500;const n=next(s,{type:'UPGRADE',tileId:'rock-1'});expect(n.society!.stocksMilli.stone).toBe(0);expect(inv(n)).toMatchObject({gold:191900,wood:97300,iron:47300});});
 it('requires and debits 30000 Stone for wall ring three without Yard discount',()=>{
  const s=city();s.society!.wallRing=2;yard(s);tile(s,'service-1').building={typeId:'town-hall',level:1,workers:1,enabled:true};s.society!.stocksMilli.stone=29999;
  reject(s,{type:'EXTEND_WALL'},'INSUFFICIENT_RESOURCES');s.society!.stocksMilli.stone=30000;
  const n=next(s,{type:'EXTEND_WALL'});expect(n.society!.wallRing).toBe(3);expect(n.society!.stocksMilli.stone).toBe(0);expect(inv(n)).toMatchObject({gold:140000,wood:60000,iron:30000});
 });
 it('opens ring two without Stone',()=>{const s=city();yard(s);const n=next(s,{type:'EXTEND_WALL'});expect(n.society!.wallRing).toBe(2);expect(n.society!.stocksMilli.stone).toBe(0);});
});
describe('SET_RESEARCH',()=>{
 it('pays once and keeps progress through pause and reselection',()=>{let s=next(city(),{type:'SET_RESEARCH',topic:'deep-mining'});expect(inv(s).gold).toBe(190000);expect(s.society!.research.paid).toEqual(['deep-mining']);s.society!.research.progressMilli['deep-mining']=3000;s=next(s,{type:'SET_RESEARCH',topic:null});s=next(s,{type:'SET_RESEARCH',topic:'deep-mining'});expect(inv(s).gold).toBe(190000);expect(s.society!.research.progressMilli['deep-mining']).toBe(3000);});
 it('rejects completed research',()=>reject(researched(),{type:'SET_RESEARCH',topic:'deep-mining'},'ALREADY_RESEARCHED'));
 it('rejects unknown research',()=>reject(city(),{type:'SET_RESEARCH',topic:'toString'},'UNKNOWN_TOPIC'));
 it('rejects unaffordable research',()=>{const s=city();inv(s).gold=9999;reject(s,{type:'SET_RESEARCH',topic:'deep-mining'},'INSUFFICIENT_RESOURCES');});
});
describe('BUILD_DEEP_SHAFT',()=>{
 it('requires completed research',()=>reject(quarry(),{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'},'RESEARCH_REQUIRED'));
 it('rejects a Farm',()=>reject(researched(),{type:'BUILD_DEEP_SHAFT',tileId:'field-1'},'NOT_A_MINE'));
 it('rejects an exhausted deposit',()=>{const s=researched();s.society!.outside['rock-1'].depositMilli=0;tile(s,'rock-1').terrain='plain';tile(s,'rock-1').building=null;reject(s,{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'},'DEPOSIT_EXHAUSTED');});
 it('extends both remaining deposit and cap once',()=>{const s=researched();s.society!.outside['rock-1'].depositMilli=1000;const n=next(s,{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'});expect(n.society!.outside['rock-1']).toMatchObject({depositMilli:61000,capMilli:160000,deepShaft:true});expect(n.society!.stocksMilli.stone).toBe(10000);expect(inv(n)).toMatchObject({gold:190000,wood:95000,iron:50000});reject(n,{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'},'ALREADY_DEEP');});
 it('also extends an Iron Mine',()=>{const s=researched();tile(s,'ore-1').building={typeId:'mine',level:1,workers:0,enabled:true};const n=next(s,{type:'BUILD_DEEP_SHAFT',tileId:'ore-1'});expect(n.society!.outside['ore-1']).toMatchObject({depositMilli:140000,capMilli:140000,deepShaft:true});});
 it('discounts all three costs with the Yard',()=>{const s=researched();yard(s);const n=next(s,{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'});expect(n.society!.stocksMilli.stone).toBe(11000);expect(inv(n)).toMatchObject({gold:191000,wood:95500,iron:50000});});
 it.each(['stone','wood','gold'])('rejects insufficient %s atomically',resource=>{const s=researched();if(resource==='stone')s.society!.stocksMilli.stone=9999;else inv(s)[resource as 'wood'|'gold']=resource==='wood'?4999:9999;reject(s,{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'},'INSUFFICIENT_RESOURCES');});
 it('rejects cap overflow without spending',()=>{const s=researched();s.society!.outside['rock-1'].capMilli=Number.MAX_SAFE_INTEGER;reject(s,{type:'BUILD_DEEP_SHAFT',tileId:'rock-1'},'EXECUTION_ERROR');});
});
it('releases building workers first, then clearing workers in reverse plot order after pool shrink',()=>{
 const s=city();s.society!.wallRing=2;tile(s,'forest-1').building={typeId:'logging',level:1,workers:1,enabled:true};s.society!.outside['pasture-1'].clearWorkers=1;s.society!.outside['pasture-2'].clearWorkers=1;expect(isTileTrialState(s)).toBe(true);
 s.society!.classes.free=10;s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=55;
 const lines=releaseSocietyWorkers(s);
 expect(lines).toEqual(['forest-1: released 1 basic worker(s) after society population changes.','field-1: released 2 basic worker(s) after society population changes.','pasture-2: released 1 clearing worker(s) after society population changes.']);
 expect(s.society!.outside['pasture-1'].clearWorkers).toBe(1);expect(s.society!.outside['pasture-2'].clearWorkers).toBe(0);expect(isTileTrialState(s)).toBe(true);
});
it('End Week advances assigned clearing and leaves unstaffed research paused',()=>{
 const s=city();s.society!.wallRing=2;s.society!.outside['pasture-1'].clearWorkers=1;s.society!.outside['pasture-1'].clearPaid=true;s.society!.research={topic:'deep-mining',progressMilli:{'deep-mining':1000},paid:['deep-mining'],completed:[]};s.society!.stocksMilli={stone:50000,wool:50000,cloth:50000,herbs:50000};
 const before=structuredClone(s.society!);const n=next(s,{type:'END_WEEK',expectedWeek:1});
 before.outside['pasture-1'].clearMilli=1000;expect(n.society!.outside).toEqual(before.outside);expect(n.society!.research).toEqual(before.research);expect(n.society!.stocksMilli).toEqual({stone:40000,wool:40000,cloth:40000,herbs:40000});
});

it('End Week releases clearing workers when Academy training shrinks the basic pool',()=>{
 const s=city();s.society!.wallRing=2;s.society!.classes.free=20;s.society!.classes.luminaries.common=20;
 s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=73;
 tile(s,'field-1').building!.workers=0;tile(s,'spec-2').building={typeId:'academy',level:1,workers:2,enabled:true};
 s.society!.training.target='makers';
 for(const id of ['pasture-1','pasture-2']){s.society!.outside[id].clearWorkers=1;s.society!.outside[id].clearPaid=true;}
 const n=next(s,{type:'END_WEEK',expectedWeek:1});
 expect(n.society!.classes.free).toBe(18);
 expect(n.society!.outside['pasture-1'].clearWorkers).toBe(1);expect(n.society!.outside['pasture-2'].clearWorkers).toBe(0);
});

it('rejects Farm BUILD on a tampered pasture without changing the original state',()=>{
 const s=createSocietyState();s.society!.wallRing=2;s.society!.outside['pasture-1'].wild=false;
 expect(isTileTrialState(s)).toBe(true);
 tile(s,'pasture-1').terrain='fertile';
 const before=structuredClone(s), result=send(s,{type:'BUILD',tileId:'pasture-1',typeId:'farm'});
 expect(result).toMatchObject({success:false,state:s,error:{code:'INVALID_STATE'}});
 if(result.success)throw Error('Tampered pasture accepted');
 expect(result.state).toBe(s);expect(s).toEqual(before);
});
