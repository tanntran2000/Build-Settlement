import { createSocietyState,type TileTrialState } from '@haven/core';
import { expect,it } from 'vitest';
import { executeTileTrialCommand } from '../tile-trial.js';
const run = (s:TileTrialState,c:Record<string,unknown>) => executeTileTrialCommand(s,{...c,expectedRevision:s.revision});
const build=(tileId:string,typeId:string)=>({type:'BUILD',tileId,typeId});
it('builds a tavern with pinned cost',()=>{const s=createSocietyState();const r=run(s,build('service-1','tavern'));expect(r.success).toBe(true);if(!r.success)throw Error(r.error.code);const i=r.nextState.world.settlements[r.nextState.world.activeSettlementId!].inventory;expect(i.gold).toBe(41000);expect(i.wood).toBe(5000);});
it.each([['house-5','common-housing','LOCKED_PLOT'],['service-1','makers-rowhouses','WRONG_TIER'],['slum-1','brothel','NOT_AVAILABLE'],['plain-2','market','INVALID_PLACEMENT']])('rejects %s %s atomically',(tile,type,code)=>{const s=createSocietyState(),before=structuredClone(s);expect(run(s,build(tile,type))).toMatchObject({success:false,error:{code}});expect(s).toEqual(before);});
it('uses basic and Makers pools',()=>{const s=createSocietyState();expect(run(s,{type:'SET_WORKERS',tileId:'field-1',workers:5}).success).toBe(true);expect(run(s,{type:'SET_WORKERS',tileId:'field-1',workers:6})).toMatchObject({success:false,error:{code:'INVALID_PLAN'}});s.tiles.find(t=>t.id==='spec-2')!.building={typeId:'builders-yard',level:1,workers:0,enabled:true};expect(run(s,{type:'SET_WORKERS',tileId:'spec-2',workers:2})).toMatchObject({success:false,error:{code:'INVALID_PLAN'}});s.tiles[1].building!.workers=0;expect(run(s,{type:'SET_WORKERS',tileId:'spec-2',workers:2}).success).toBe(true);});
it('discounts construction by the operating Yard',()=>{const s=createSocietyState();Object.assign(s.world.settlements[s.world.activeSettlementId!].inventory,{gold:100000,wood:100000,iron:100000});s.tiles[1].building!.workers=0;s.tiles.find(t=>t.id==='spec-2')!.building={typeId:'builders-yard',level:1,workers:2,enabled:true};const r=run(s,build('service-1','tavern'));expect(r.success).toBe(true);if(!r.success)throw Error(r.error.code);const i=r.nextState.world.settlements[r.nextState.world.activeSettlementId!].inventory;expect(i.gold).toBe(96400);expect(i.wood).toBe(97300);});
it('extends the wall atomically with exact costs and unlocks ring two',()=>{const s=createSocietyState();Object.assign(s.world.settlements[s.world.activeSettlementId!].inventory,{gold:100000,wood:50000,iron:50000});s.tiles[1].building!.workers=0;s.tiles.find(t=>t.id==='spec-2')!.building={typeId:'builders-yard',level:1,workers:2,enabled:true};const r=run(s,{type:'EXTEND_WALL'});expect(r.success).toBe(true);if(!r.success)throw Error(r.error.code);expect(r.nextState.society!.wallRing).toBe(2);expect(r.nextState.revision).toBe(1);expect(r.nextState.world.settlements[r.nextState.world.activeSettlementId!].inventory).toMatchObject({gold:70000,wood:30000,iron:40000});expect(run(r.nextState,build('house-5','makers-rowhouses')).success).toBe(true);});
it.each([1,2,3] as const)('rejects wall extension at ring %s without prerequisites',ring=>{const s=createSocietyState();s.society!.wallRing=ring;const before=structuredClone(s);expect(run(s,{type:'EXTEND_WALL'})).toMatchObject({success:false,error:{code:ring===3?'WALL_COMPLETE':'PREREQUISITE_MISSING'}});expect(s).toEqual(before);});
it('rejects insufficient wall resources atomically',()=>{const s=createSocietyState();s.tiles[1].building!.workers=0;s.tiles.find(t=>t.id==='spec-2')!.building={typeId:'builders-yard',level:1,workers:2,enabled:true};const before=structuredClone(s);expect(run(s,{type:'EXTEND_WALL'})).toMatchObject({success:false,error:{code:'INSUFFICIENT_RESOURCES'}});expect(s).toEqual(before);});
it.each(['makers',null,'free','bound'])('validates training target %s',target=>{const s=createSocietyState(),before=structuredClone(s);const r=run(s,{type:'SET_TRAINING',target});if(target==='free'||target==='bound'){expect(r).toMatchObject({success:false,error:{code:'INVALID_COMMAND'}});}else{expect(r.success).toBe(true);if(r.success)expect(r.nextState.society!.training.target).toBe(target);}expect(s).toEqual(before);});
it.each(['EXTEND_WALL','SET_TRAINING'])('restricts %s to society Planning and exact keys',type=>{const s=createSocietyState();s.phase='report';expect(run(s,{type,...(type==='SET_TRAINING'?{target:null}:{})})).toMatchObject({success:false,error:{code:'FORBIDDEN'}});s.phase='planning';expect(run(s,{type,extra:1,...(type==='SET_TRAINING'?{target:null}:{})})).toMatchObject({success:false,error:{code:'INVALID_COMMAND'}});});

it('rejects REPLACE on a locked plot without mutation', () => {
  const s = createSocietyState(), before = structuredClone(s);
  expect(run(s, { type: 'REPLACE', tileId: 'house-5', typeId: 'common-housing' }))
    .toMatchObject({ success: false, error: { code: 'LOCKED_PLOT' } });
  expect(s).toEqual(before);
});
it('rejects a wrong-tier REPLACE without mutation', () => {
  const s = createSocietyState(), before = structuredClone(s);
  expect(run(s, { type: 'REPLACE', tileId: 'house-4', typeId: 'tavern' }))
    .toMatchObject({ success: false, error: { code: 'WRONG_TIER' } });
  expect(s).toEqual(before);
});
it('discounts the full level-two upgrade cost by ten percent', () => {
  const s = createSocietyState();
  const inventory = s.world.settlements[s.world.activeSettlementId!].inventory;
  Object.assign(inventory, { gold: 100000, wood: 100000, iron: 100000 });
  s.tiles[1].building!.workers = 0;
  s.tiles.find(t => t.id === 'spec-2')!.building = { typeId: 'builders-yard', level: 1, workers: 2, enabled: true };
  const before = structuredClone(s), r = run(s, { type: 'UPGRADE', tileId: 'house-4' });
  expect(r.success).toBe(true);
  if (!r.success) throw Error(r.error.code);
  expect(r.nextState.tiles.find(t => t.id === 'house-4')!.building!.level).toBe(2);
  expect(r.nextState.world.settlements[r.nextState.world.activeSettlementId!].inventory)
    .toMatchObject({ gold: 89200, wood: 91000, iron: 100000 });
  expect(s).toEqual(before);
});
it('combines separately floored Free and Bound workforce pools', () => {
  const s = createSocietyState();
  s.society!.classes.free = 45;
  s.society!.classes.bound.free = 10;
  const before = structuredClone(s);
  expect(run(s, { type: 'SET_WORKERS', tileId: 'field-1', workers: 5 }).success).toBe(true);
  expect(run(s, { type: 'SET_WORKERS', tileId: 'field-1', workers: 6 }))
    .toMatchObject({ success: false, error: { code: 'INVALID_PLAN' } });
  expect(s).toEqual(before);
});
it('excludes Makers elites and floors common workforce', () => {
  const s = createSocietyState();
  s.society!.classes.free = 51;
  s.society!.classes.makers = { common: 19, elite: 5 };
  s.tiles[1].building!.workers = 1;
  const before = structuredClone(s);
  expect(run(s, { type: 'SET_WORKERS', tileId: 'plain-1', workers: 1 }).success).toBe(true);
  expect(run(s, { type: 'SET_WORKERS', tileId: 'plain-1', workers: 2 }))
    .toMatchObject({ success: false, error: { code: 'INVALID_PLAN' } });
  expect(s).toEqual(before);
});
it.each([0, 1])('requires a fully staffed Town Hall for ring three: %s workers', workers => {
  const s = createSocietyState();
  s.society!.wallRing = 2;
  Object.assign(s.world.settlements[s.world.activeSettlementId!].inventory, { gold: 100000, wood: 100000, iron: 100000 });
  s.tiles.find(t => t.id === 'service-1')!.building = { typeId: 'town-hall', level: 1, workers, enabled: true };
  const before = structuredClone(s), r = run(s, { type: 'EXTEND_WALL' });
  if (workers === 0) expect(r).toMatchObject({ success: false, error: { code: 'PREREQUISITE_MISSING' } });
  else {
    expect(r.success).toBe(true);
    if (!r.success) throw Error(r.error.code);
    expect(r.nextState.society!.wallRing).toBe(3);
    expect(r.nextState.revision).toBe(s.revision + 1);
    expect(r.nextState.world.settlements[r.nextState.world.activeSettlementId!].inventory)
      .toMatchObject({ gold: 40000, wood: 60000, iron: 80000 });
  }
  expect(s).toEqual(before);
});

it('rejects UPGRADE at the validator boundary for an existing wrong-tier building', () => {
  const s = createSocietyState();
  s.tiles.find(t => t.id === 'house-4')!.building = { typeId: 'tavern', level: 1, workers: 0, enabled: true };
  const before = structuredClone(s);
  expect(run(s, { type: 'UPGRADE', tileId: 'house-4' }))
    .toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
  expect(s).toEqual(before);
});
