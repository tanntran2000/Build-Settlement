import { createCharacterLifeSession, createSocietyState, DEFAULT_PLAYER_DRAFT, isTileTrialState, type ResearchTopic, type TileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { releaseSocietyWorkers } from '../society-facilities.js';

const tile = (s: TileTrialState, id: string) => s.tiles.find(t => t.id === id)!;
const inv = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].inventory;
function city() {
 const s = createSocietyState();
 Object.assign(inv(s), {gold:200000,wood:100000,iron:50000});
 tile(s,'field-1').building!.workers = 0;
 return s;
}
function next(s: TileTrialState, fields: Record<string,unknown>) {
 const before = structuredClone(s), r = executeTileTrialCommand(s,{...fields,expectedRevision:s.revision});
 expect(s).toEqual(before);
 if (!r.success) throw Error(JSON.stringify(r.error));
 expect(isTileTrialState(r.nextState)).toBe(true);
 expect(r.nextState.revision).toBe(s.revision+1);
 return r.nextState;
}
function reject(s: TileTrialState, fields: Record<string,unknown>, code: string) {
 expect(isTileTrialState(s)).toBe(true);
 const before = structuredClone(s), r = executeTileTrialCommand(s,{...fields,expectedRevision:s.revision});
 expect(r).toMatchObject({success:false,error:{code}});
 if (!r.success) expect(r.state).toBe(s);
 expect(s).toEqual(before);
}
const build = (s: TileTrialState, typeId: string, tileId = 'service-1') => next(s,{type:'BUILD',typeId,tileId});
it.each(['service-1','slum-1'])('builds Watch House on %s at the exact cost', tileId => {
 const s = build(city(),'watch-house',tileId);
 expect(tile(s,tileId).building).toEqual({typeId:'watch-house',level:1,workers:0,enabled:true});
 expect(inv(s)).toMatchObject({gold:195000,wood:96000,iron:49000});
});
it.each(['spec-1','house-5'])('rejects Watch House on %s atomically', tileId => {
 const s = city(); s.society!.wallRing = 2;
 reject(s,{type:'BUILD',typeId:'watch-house',tileId},'WRONG_TIER');
});
it('rejects a Watch House beyond the wall', () => reject(city(),{type:'BUILD',typeId:'watch-house',tileId:'slum-2'},'LOCKED_PLOT'));
it('replaces a Slum building with a Watch House', () => {
 const s = build(build(city(),'slave-quarters','slum-1'),'watch-house','service-1');
 const n = next(s,{type:'REPLACE',tileId:'slum-1',typeId:'watch-house'});
 expect(tile(n,'slum-1').building!.typeId).toBe('watch-house');
});
it('upgrades a Slum Watch House to level two and rejects level three without Stone charges', () => {
 const s = next(build(city(),'watch-house','slum-1'),{type:'UPGRADE',tileId:'slum-1'});
 expect(tile(s,'slum-1').building!.level).toBe(2);
 expect(inv(s)).toMatchObject({gold:185000,wood:88000,iron:47000});
 expect(s.society!.stocksMilli.stone).toBe(0);
 reject(s,{type:'UPGRADE',tileId:'slum-1'},'MAX_LEVEL');
});
it.each(['watch-house','military-barracks'])('applies the operating Yard discount to %s build and upgrade', typeId => {
 const s = city(); tile(s,'plain-1').building!.workers = 0;
 tile(s,'spec-2').building = {typeId:'builders-yard',level:1,workers:2,enabled:true};
 const n = next(build(s,typeId),{type:'UPGRADE',tileId:'service-1'});
 expect(inv(n)).toMatchObject(typeId === 'watch-house' ? {gold:186500,wood:89200,iron:47300} : {gold:178400,wood:83800,iron:39200});
});
it('builds Military Barracks on Service and rejects Slum', () => {
 const s = build(city(),'military-barracks');
 expect(tile(s,'service-1').building).toEqual({typeId:'military-barracks',level:1,workers:0,enabled:true});
 expect(inv(s)).toMatchObject({gold:192000,wood:94000,iron:46000});
 reject(city(),{type:'BUILD',typeId:'military-barracks',tileId:'slum-1'},'WRONG_TIER');
});
it.each([0,3,4])('assigns %s Barracks workers', workers => {
 const s = next(build(city(),'military-barracks'),{type:'SET_WORKERS',tileId:'service-1',workers});
 expect(tile(s,'service-1').building!.workers).toBe(workers);
});
it.each([[-1,'INVALID_WORKFORCE'],[2.5,'INVALID_WORKFORCE'],[5,'INVALID_PLAN'],[NaN,'INVALID_WORKFORCE'],[Infinity,'INVALID_WORKFORCE'],[Number.MAX_SAFE_INTEGER+1,'INVALID_WORKFORCE']])('rejects Barracks workers %s with %s', (workers,code) => {
 reject(build(city(),'military-barracks'),{type:'SET_WORKERS',tileId:'service-1',workers},String(code));
});
it('rejects Barracks staffing above the basic pool despite capacity', () => {
 const s = city(); tile(s,'field-1').building!.workers = 2;
 reject(build(s,'military-barracks'),{type:'SET_WORKERS',tileId:'service-1',workers:4},'INVALID_PLAN');
});
it('accepts eight level-two Barracks workers and rejects nine', () => {
 const s = city(); s.society!.classes.bound.free = 30; inv(s).food = 100000;
 s.world.settlements[s.world.activeSettlementId!].cohorts[0].count = 130;
 const n = next(next(build(s,'military-barracks'),{type:'UPGRADE',tileId:'service-1'}),{type:'SET_WORKERS',tileId:'service-1',workers:8});
 expect(tile(n,'service-1').building!.workers).toBe(8);
 reject(n,{type:'SET_WORKERS',tileId:'service-1',workers:9},'INVALID_PLAN');
});
it('releases Barracks workers in reverse map order when training shrinks the pool', () => {
 const s = city(); s.society!.classes.free = 20; s.society!.classes.luminaries.common = 20;
 s.world.settlements[s.world.activeSettlementId!].cohorts[0].count = 73;
 tile(s,'spec-2').building = {typeId:'academy',level:1,workers:2,enabled:true};
 for (const id of ['service-1','service-2']) tile(s,id).building = {typeId:'military-barracks',level:1,workers:1,enabled:true};
 s.society!.training.target = 'makers';
 const n = next(s,{type:'END_WEEK',expectedWeek:1});
 expect(n.society!.classes.free).toBe(18);
 expect(tile(n,'service-1').building!.workers).toBe(1);
 expect(tile(n,'service-2').building!.workers).toBe(0);
 expect(releaseSocietyWorkers(n)).toEqual([]);
});
it.each([['watch-patrols',6000],['barracks-drill',8000]] as const)('pays once for %s and preserves progress on switching', (topic,cost) => {
 let s = next(city(),{type:'SET_RESEARCH',topic});
 expect(inv(s).gold).toBe(200000-cost); expect(s.society!.research.paid).toEqual([topic]);
 s.society!.research.progressMilli[topic] = 1000;
 const other = topic === 'watch-patrols' ? 'barracks-drill' : 'watch-patrols';
 s = next(s,{type:'SET_RESEARCH',topic:other});
 s = next(s,{type:'SET_RESEARCH',topic:null});
 s = next(s,{type:'SET_RESEARCH',topic});
 expect(inv(s).gold).toBe(186000); expect(s.society!.research.progressMilli[topic]).toBe(1000);
});
it.each(['watch-patrols','barracks-drill'] as const)('rejects completed or unaffordable %s atomically', topic => {
 const s = city(); s.society!.research.completed = [topic];
 reject(s,{type:'SET_RESEARCH',topic},'ALREADY_RESEARCHED');
 const poor = city(); inv(poor).gold = 0;
 reject(poor,{type:'SET_RESEARCH',topic},'INSUFFICIENT_RESOURCES');
});
it('rejects an unknown topic', () => reject(city(),{type:'SET_RESEARCH',topic:'unknown'},'UNKNOWN_TOPIC'));
it.each(['watch-patrols','barracks-drill'] satisfies ResearchTopic[])('completes %s using the existing funded Library week', topic => {
 const s = city(); tile(s,'spec-2').building = {typeId:'library',level:1,workers:1,enabled:true};
 let n = next(s,{type:'SET_RESEARCH',topic});
 for (let i = 0; i < (topic === 'watch-patrols' ? 6 : 8); i++) {
  n = next(n,{type:'END_WEEK',expectedWeek:n.world.week});
  n = next(n,{type:'NEXT_WEEK'});
 }
 expect(n.society!.research.completed).toContain(topic);
 expect(n.society!.research.topic).toBeNull();
});
it.each(['watch-house','military-barracks'])('Character Life dispatches BUILD and SET_WORKERS for %s', typeId => {
 const created = createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});
 if (!created.success) throw Error(created.error.message);
 const s = created.value; s.city = city(); const before = structuredClone(s);
 const built = executeCharacterLifeCommand(s,{type:'BUILD',typeId,tileId:'service-1',expectedRevision:0});
 expect(s).toEqual(before); if (!built.success) throw Error(built.error.message);
 const assigned = executeCharacterLifeCommand(built.next,{type:'SET_WORKERS',tileId:'service-1',workers:typeId === 'watch-house' ? 2 : 3,expectedRevision:1});
 expect(assigned.success).toBe(true);
 if (assigned.success) expect(tile(assigned.next.city,'service-1').building!.workers).toBe(typeId === 'watch-house' ? 2 : 3);
});
it.each(['watch-patrols','barracks-drill'])('Character Life dispatches SET_RESEARCH %s', topic => {
 const created = createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});
 if (!created.success) throw Error(created.error.message);
 const s = created.value, before = structuredClone(s);
 const r = executeCharacterLifeCommand(s,{type:'SET_RESEARCH',topic,expectedRevision:0});
 expect(s).toEqual(before); expect(r.success).toBe(true);
 if (r.success) expect(r.next.city.society!.research.topic).toBe(topic);
});
it('activates weekly order and isolates its effects from the existing week', () => {
 const s = city(), other = structuredClone(s);
 other.society!.order = {security:99,crime:100,authority:0};
 const a = executeTileTrialCommand(s,{type:'END_WEEK',expectedWeek:1,expectedRevision:0});
 const b = executeTileTrialCommand(other,{type:'END_WEEK',expectedWeek:1,expectedRevision:0});
 if (!a.success || !b.success || !a.report || !b.report) throw Error('End Week failed');
 // 100 residents, ring 1: Security target 10+5-100/20=10.
 // Drift gives 25 / 94; Crime target clamps 10-floor(Security/2) to 0.
 // Crime drifts to 5 / 95. Satisfaction resolves to 82 and Tension to 0.
 // Authority targets: 40+trunc((25-50)/5)-floor(5/4)+trunc(32/5)=40;
 // 40+trunc((94-50)/5)-floor(95/4)+trunc(32/5)=31. Drift: 47 / 3.
 expect(a.nextState.society!.order).toEqual({security:25,crime:5,authority:47});
 expect(b.nextState.society!.order).toEqual({security:94,crime:95,authority:3});
 expect(a.report.order).toMatchObject({before:{security:30,crime:10,authority:50},targets:{security:10,crime:0,authority:40},after:{security:25,crime:5,authority:47}});
 expect(b.report.order).toMatchObject({before:{security:99,crime:100,authority:0},targets:{security:10,crime:0,authority:31},after:{security:94,crime:95,authority:3}});
 const ao=a.report.order!,bo=b.report.order!;
 expect(ao.taxDeltaMilli).toBe(0);expect(bo.taxDeltaMilli).toBe(-600);
 expect(ao.theftMilli).toEqual({});expect(bo.tensionAdded).toBe(3);expect(bo.satisfactionLost).toBe(2);
 expect(bo.arrivalsBudgetBefore).toBe(0);expect(bo.arrivalsBudgetAfter).toBe(0);
 const as=a.nextState,bs=structuredClone(b.nextState);
 const ai=as.world.settlements[as.world.activeSettlementId!].inventory,bi=bs.world.settlements[bs.world.activeSettlementId!].inventory;
 expect(bi.gold).toBe(ai.gold-600-bo.theftMilli.gold!);
 expect(bi.food).toBe(ai.food-bo.theftMilli.food!);
 bi.gold+=600+bo.theftMilli.gold!;bi.food+=bo.theftMilli.food!;
 expect(bs.goodsStock!.amountMilli).toBe(as.goodsStock!.amountMilli-bo.theftMilli.goods!);bs.goodsStock!.amountMilli+=bo.theftMilli.goods!;
 expect(bs.society!.tension).toBe(as.society!.tension+3);bs.society!.tension-=3;
 for(const key of ['free','makers','luminaries','merchants'] as const){expect(bs.society!.satisfaction[key]).toBe(as.society!.satisfaction[key]-2);bs.society!.satisfaction[key]+=2;}
 expect(bs.happiness).toBe(as.happiness-2);bs.happiness+=2;
 bs.society!.order=as.society!.order;expect(bs).toEqual(as);
 const {order: _ao,...ar}=a.report, {order: _bo,...br}=structuredClone(b.report);
 for(const key of ['gold','food'] as const){expect(br.after[key]).toBe(b.report.after[key]);br.after[key]=ar.after[key];}
 expect(br.taxMilli).toBe(ar.taxMilli-600);br.taxMilli+=600;
 br.goodsStock={...br.goodsStock!,closingMilli:br.goodsStock!.closingMilli+bo.theftMilli.goods!};
 for(const key of ['wood','iron'] as const)br.outside!.spoiledMilli[key]=br.outside!.spoiledMilli[key]!+bo.theftMilli[key]!;
 expect(br.happinessAfter).toBe(ar.happinessAfter-2);br.happinessAfter+=2;
 for(const key of ['free','makers','luminaries','merchants'] as const){expect(br.society!.classes[key].satisfactionAfter).toBe(ar.society!.classes[key].satisfactionAfter-2);br.society!.classes[key].satisfactionAfter+=2;}
 expect(br.society!.tensionAfter).toBe(ar.society!.tensionAfter+3);br.society!.tensionAfter-=3;
 expect(br.crisis!.tensionBefore).toBe(ar.crisis!.tensionBefore+3);br.crisis!.tensionBefore-=3;
 expect(br.crisis!.tensionAfter).toBe(ar.crisis!.tensionAfter+3);br.crisis!.tensionAfter-=3;
 expect(ar).toEqual(br);
});
