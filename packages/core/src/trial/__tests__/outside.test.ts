import { describe, expect, it } from 'vitest';
import { createSocietyState, isSocietyState, isTileTrialState, isTileTrialPlanningState, OUTSIDE_PLOTS, OUTSIDE_TRIAL, outsidePlot, trialBuilding, societyStaff, NPC_MANAGER_BUILDING_TYPES } from '../../index.js';

const rings = [
 'field-1 plain-1 forest-1 ore-1 plain-2 plain-3 forest-2 ore-2 field-2 plain-4',
 'field-3 field-4 pasture-1 pasture-2 meadow-1 meadow-2 forest-3 rock-1 rock-2 plain-5',
 'field-5 pasture-3 meadow-3 forest-4 forest-5 ore-3 ore-4 rock-3 plain-6 plain-7',
];
it('pins thirty ordered outside plots and terrain totals', () => {
 expect(OUTSIDE_PLOTS).toHaveLength(30);
 rings.forEach((ids,i)=>expect(OUTSIDE_PLOTS.filter(p=>p.ring===i+1).map(p=>p.id)).toEqual(ids.split(' ')));
 expect(Object.fromEntries(['fertile','pasture','meadow','forest','ore','rock','plain'].map(t=>[t,OUTSIDE_PLOTS.filter(p=>p.terrain===t).length]))).toEqual({fertile:5,pasture:3,meadow:3,forest:5,ore:4,rock:3,plain:7});
 expect(outsidePlot('pasture-1')).toEqual({terrain:'pasture',ring:2});
 expect(outsidePlot('toString')).toBeNull();
 expect(Object.isFrozen(OUTSIDE_TRIAL.deposit)).toBe(true);
});
it('creates isolated society v3 outside state, full deposits and zero stocks', () => {
 const city=createSocietyState(), s=city.society!;
 expect(city.tiles).toHaveLength(63);
 expect(city.tiles.slice(0,30).map(t=>t.id)).toEqual(OUTSIDE_PLOTS.map(p=>p.id));
 expect(s.rulesetId).toBe('tile-society-03');
 expect(s.stocksMilli).toEqual({stone:0,wool:0,cloth:0,herbs:0});
 expect(s.research).toEqual({topic:null,progressMilli:{'deep-mining':0,'watch-patrols':0,'barracks-drill':0},paid:[],completed:[]});
 for(const p of OUTSIDE_PLOTS) {
  const o=s.outside[p.id], deposit=p.terrain==='forest'?60000:p.terrain==='ore'?80000:p.terrain==='rock'?100000:null;
  expect(o).toEqual({wild:p.ring>1,clearMilli:0,clearWorkers:0,clearPaid:false,depositMilli:deposit,capMilli:deposit,deepShaft:false});
  if(p.ring>1) expect(city.tiles.find(t=>t.id===p.id)!.building).toBeNull();
 }
 s.outside['forest-1'].depositMilli=1;
 expect(createSocietyState().society!.outside['forest-1'].depositMilli).toBe(60000);
 expect(isTileTrialPlanningState(createSocietyState())).toBe(true);
});
const bad: [string,(s:ReturnType<typeof createSocietyState>)=>void][] = [
 ['wild building',s=>{s.society!.wallRing=2;s.tiles.find(t=>t.id==='pasture-1')!.building={typeId:'sheep-pasture',level:1,workers:0,enabled:true};}],
 ['cleared workers',s=>{s.society!.outside['field-1'].clearWorkers=1;}],
 ['locked workers',s=>{s.society!.outside['pasture-1'].clearWorkers=1;}],
 ['pool overflow',s=>{s.society!.wallRing=2;s.society!.outside['pasture-1'].clearWorkers=4;}],
 ['deposit overflow',s=>{s.society!.outside['ore-1'].depositMilli=80001;}],
 ['fertile deposit',s=>{s.society!.outside['field-1'].depositMilli=1;s.society!.outside['field-1'].capMilli=1;}],
 ['duplicate paid',s=>{s.society!.research.paid=['deep-mining','deep-mining'];}],
 ['duplicate completed',s=>{s.society!.research.completed=['deep-mining','deep-mining'];}],
 ['completed topic',s=>{s.society!.research.topic='deep-mining';s.society!.research.completed=['deep-mining'];}],
 ['old ruleset',s=>{Object.assign(s.society!,{rulesetId:'tile-society-01'});}],
 ['extra outside id',s=>{s.society!.outside.extra=structuredClone(s.society!.outside['field-1']);}],
 ['extra stock',s=>{Object.assign(s.society!.stocksMilli,{extra:0});}],
 ['unsafe stock',s=>{s.society!.stocksMilli.stone=Number.MAX_SAFE_INTEGER+1;}],
 ['negative progress',s=>{s.society!.research.progressMilli['deep-mining']=-1;}],
];
describe.each(bad)('%s',(_name,mutate)=>it('rejects atomically at both validation boundaries',()=>{
 const s=createSocietyState();mutate(s);expect(isTileTrialState(s)).toBe(false);expect(isTileTrialPlanningState(s)).toBe(false);
}));
it('accepts only the exhausted ore and rock terrain exception',()=>{
 for(const id of ['ore-1','rock-1']) {
  const s=createSocietyState(), tile=s.tiles.find(t=>t.id===id)!;
  s.society!.outside[id].depositMilli=0;
  expect(isTileTrialPlanningState(s)).toBe(false);expect(isTileTrialState(s)).toBe(false);
  tile.terrain='plain';expect(isTileTrialPlanningState(s)).toBe(true);expect(isTileTrialState(s)).toBe(true);
  s.society!.outside[id].depositMilli=1;expect(isTileTrialPlanningState(s)).toBe(false);expect(isTileTrialState(s)).toBe(false);
 }
});
it('rejects hostile outside fields without invoking getters',()=>{
 const s=createSocietyState().society!;let reads=0;
 Object.defineProperty(s.outside['field-1'],'wild',{enumerable:true,get(){reads++;return false;}});
 expect(isSocietyState(s)).toBe(false);expect(reads).toBe(0);
});
it('pins activated catalog costs and workforce classes',()=>{
 const rows=[['sheep-pasture','Sheep Pasture','wool','pasture',2,2,3000,2000,0,500,'basic'],['herb-garden','Herb Garden','herbs','meadow',2,2,2000,1000,0,500,'basic'],['quarry','Quarry','stone','rock',3,2,3000,1000,1000,500,'basic'],['weaver','Weaver','cloth','plain',2,1,3000,2000,0,500,'makers'],['library','Library','society','town',2,1,8000,6000,2000,1000,'luminaries'],['warehouse','Warehouse','society','town',3,1,6000,8000,0,500,'makers']] as const;
 for(const [id,name,operation,terrain,maxLevel,maxWorkers,gold,wood,iron,upkeepMilli,staff] of rows){
  expect(trialBuilding(id)).toEqual({name,operation,terrain:[terrain],maxLevel,maxWorkers,cost:{gold,wood,iron},upkeepMilli});expect(societyStaff(id)).toBe(staff);
 }
 for(const id of ['quarry','sheep-pasture','herb-garden','weaver']) expect(NPC_MANAGER_BUILDING_TYPES).toContain(id);
});

it.each(['paid','completed'] as const)('rejects research %s accessors without reading or mutating state', key=>{
 const s=createSocietyState();s.society!.research[key]=['deep-mining'];
 const before=structuredClone(s), values=s.society!.research[key], original=Object.getOwnPropertyDescriptor(values,'0')!;
 let reads=0;
 const getter=()=>{reads++;s.society!.stocksMilli.stone=123;return 'deep-mining';};
 Object.defineProperty(values,'0',{enumerable:true,configurable:true,get:getter});
 expect.soft(isSocietyState(s.society)).toBe(false);
 expect.soft(reads).toBe(0);
 expect.soft(Object.getOwnPropertyDescriptor(values,'0')!.get).toBe(getter);
 Object.defineProperty(values,'0',original);
 expect(s).toEqual(before);
});
it.each(['outside','plot','deposit'] as const)('rejects planning %s accessors before reading outside terrain state', key=>{
 const s=createSocietyState(), before=structuredClone(s);
 const object=key==='outside'?s.society!:key==='plot'?s.society!.outside:s.society!.outside['ore-1'];
 const property=key==='outside'?'outside':key==='plot'?'ore-1':'depositMilli';
 const original=Object.getOwnPropertyDescriptor(object,property)!;
 let reads=0;
 const getter=()=>{reads++;s.society!.stocksMilli.stone=123;return original.value;};
 Object.defineProperty(object,property,{enumerable:true,configurable:true,get:getter});
 expect.soft(isTileTrialPlanningState(s)).toBe(false);
 expect.soft(reads).toBe(0);
 expect.soft(Object.getOwnPropertyDescriptor(object,property)!.get).toBe(getter);
 Object.defineProperty(object,property,original);
 expect(s).toEqual(before);
});
it.each(['index','iterator'] as const)('rejects live tile %s accessors without reading or mutating state', key=>{
 const s=createSocietyState(), before=structuredClone(s), property=key==='index'?'0':Symbol.iterator;
 const original=Object.getOwnPropertyDescriptor(s.tiles,property);
 let reads=0;
 const getter=()=>{reads++;s.society!.stocksMilli.stone=123;return key==='index'?before.tiles[0]:Array.prototype[Symbol.iterator];};
 Object.defineProperty(s.tiles,property,{enumerable:true,configurable:true,get:getter});
 expect.soft(isTileTrialState(s)).toBe(false);
 expect.soft(reads).toBe(0);
 expect.soft(Object.getOwnPropertyDescriptor(s.tiles,property)!.get).toBe(getter);
 if(original)Object.defineProperty(s.tiles,property,original);else Reflect.deleteProperty(s.tiles,property);
 expect(s).toEqual(before);
});
it('rejects inherited cohort iterators without reading or mutating state',()=>{
 const s=createSocietyState(), before=structuredClone(s), cohorts=s.world.settlements[s.world.activeSettlementId!].cohorts;
 const original=Object.getPrototypeOf(cohorts), prototype=Object.create(original);
 let reads=0;
 Object.defineProperty(prototype,Symbol.iterator,{get(){reads++;s.society!.stocksMilli.stone=123;return Array.prototype[Symbol.iterator];}});
 Object.setPrototypeOf(cohorts,prototype);
 expect.soft(isTileTrialState(s)).toBe(false);expect.soft(reads).toBe(0);
 expect.soft(Object.getPrototypeOf(cohorts)).toBe(prototype);
 Object.setPrototypeOf(cohorts,original);
 expect(s).toEqual(before);
});

it.each([
 ['field-2','plain'],['pasture-1','fertile'],['meadow-1','plain'],['forest-1','plain'],['plain-2','forest'],
])('rejects non-catalog live terrain on %s changed to %s',(id,terrain)=>{
 const s=createSocietyState();s.society!.wallRing=2;s.society!.outside[id].wild=false;
 expect(isTileTrialState(s)).toBe(true);expect(isTileTrialPlanningState(s)).toBe(true);
 s.tiles.find(t=>t.id===id)!.terrain=terrain;
 expect(isTileTrialState(s)).toBe(false);expect(isTileTrialPlanningState(s)).toBe(false);
});
