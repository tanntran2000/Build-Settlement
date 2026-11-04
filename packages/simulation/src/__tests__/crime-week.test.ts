import * as core from '@haven/core';
import { expect, it, vi } from 'vitest';
import { createSocietyState, crimeRandom } from '@haven/core';
import { resolveCrimeWeek } from '../crime-week.js';
import { runTileTrialWeek } from '../tile-trial-week.js';
const draws=(...values:number[])=>()=>values.shift()!;
it.each([[0.0499,true],[0.05,false]])('crime zero roll %s', (roll,event)=>{
 const s=createSocietyState();s.society!.order.crime=0;
 expect(resolveCrimeWeek(s,new Set(),draws(roll,0,0)).event!==null).toBe(event);
});
it.each([[49,50],[51,50],[50,50],[0,1],[100,99]])('Standing %s drifts to %s',(before,after)=>{
 const s=createSocietyState();s.society!.standing=before;
 expect(resolveCrimeWeek(s,new Set(),()=>1)).toMatchObject({standingBefore:before,standingAfter:after});
});
it('seeds End Week N with N rather than N+1',()=>{
 const spy=vi.spyOn(core,'crimeRandom');
 const s=createSocietyState();s.world.week=7;
 const r=runTileTrialWeek(s),copy=structuredClone(s);
 expect(spy).toHaveBeenCalledWith(s.world.worldMetadata.worldSeed,7);spy.mockRestore();
 copy.society!.standing=r.crimeEvent!.standingBefore;
 expect(resolveCrimeWeek(copy,new Set(),crimeRandom(s.world.worldMetadata.worldSeed,7))).toEqual(r.crimeEvent);
});

it.each([33,34,66,67,100])('robbery severity and floor at crime %s',crime=>{
 const s=createSocietyState();s.society!.order.crime=crime;
 const inventory=s.world.settlements[s.world.activeSettlementId!].inventory;inventory.gold=1;
 const r=resolveCrimeWeek(s,new Set(),draws(0,0,0));
 expect(r.chancePercent).toBe(5+Math.trunc(crime/2));
 expect(r.event).toEqual({kind:'robbery',severity:crime<=33?'minor':crime<=66?'serious':'severe',target:'gold',lossMilli:0});expect(inventory.gold).toBe(1);
});
it.each([[0,3],[50,6],[100,10]])('smear at crime %s',(crime,loss)=>{
 const s=createSocietyState();s.society!.order.crime=crime;
 expect(resolveCrimeWeek(s,new Set(),draws(0,0.6))).toMatchObject({standingAfter:50-loss,event:{kind:'smear',standingLoss:loss}});
});
it.each([[69,0.99,'smear'],[70,0.99,'assassination']])('availability %s',(crime,pick,kind)=>{
 const s=createSocietyState();s.society!.order.crime=Number(crime);
 expect(resolveCrimeWeek(s,new Set(),draws(0,Number(pick),0)).event!.kind).toBe(kind);
});
it.each([[33,1],[50,2],[100,3]])('raid at crime %s',(crime,deaths)=>{
 const s=createSocietyState();s.society!.order.crime=crime;
 s.tiles[0].building={typeId:'military-barracks',level:1,enabled:true,workers:3};
 const before=s.society!.classes.free;
 expect(resolveCrimeWeek(s,new Set(),draws(0,0.85)).event).toMatchObject({kind:'raid',soldiersKilled:deaths});
 expect(s.society!.classes.free).toBe(before-deaths);expect(s.tiles[0].building.workers).toBe(3-deaths);
});
it('caps a raid and removes Bound after Free',()=>{
 const s=createSocietyState();s.society!.order.crime=100;s.society!.classes.free=0;s.society!.classes.bound.free=1;
 s.tiles.forEach(t=>{t.building=null;});s.tiles[0].building={typeId:'military-barracks',level:1,enabled:true,workers:1};
 expect(resolveCrimeWeek(s,new Set(),draws(0,0.85)).event!.soldiersKilled).toBe(1);
 expect(s.society!.classes.bound.free).toBe(0);expect(s.tiles[0].building.workers).toBe(0);
});
it.each([[90,29,0.29,0,'foiled'],[90,29,0.3,0,'killed'],[90,30,0.3,0,'wounded'],[89,0,0,0,'wounded'],[90,0,0,0.5,'wounded']])('assassination %s/%s/%s/%s',(crime,security,foil,fatal,outcome)=>{
 const s=createSocietyState();s.society!.order={crime,security,authority:3};s.society!.standing=0;
 const r=resolveCrimeWeek(s,new Set(),draws(0,0.99,foil,fatal));expect(r.event!.outcome).toBe(outcome);
 if(outcome==='killed'){expect(s.society!.crisis).toMatchObject({stage:'fallen',fallCause:'assassination'});expect(s.society!.pendingCard).toBeNull();}
 if(outcome==='wounded'){expect(r.lordHealthLoss).toBe(20);expect(s.society!.order.authority).toBe(0);expect(r.standingAfter).toBe(0);}
});
it('replays five complete weeks and separates two seeds over twenty crime steps',()=>{
 const a=createSocietyState(),b=structuredClone(a);
 for(let i=0;i<5;i++){expect(runTileTrialWeek(a)).toEqual(runTileTrialWeek(b));expect(a).toEqual(b);}
 const sequence=(seed:number)=>Array.from({length:20},(_,week)=>{const s=createSocietyState();s.society!.order.crime=80;return resolveCrimeWeek(s,new Set(),crimeRandom(seed,week));});
 expect(sequence(1)).toEqual(sequence(1));expect(sequence(1)).not.toEqual(sequence(2));
});

it.each([[0,500],[50,1000],[100,2000]])('robs the approved basis points at %s',(crime,bps)=>{
 const s=createSocietyState();s.society!.order.crime=crime;
 const stock=s.world.settlements[s.world.activeSettlementId!].inventory;stock.gold=12345;
 expect(resolveCrimeWeek(s,new Set(),draws(0,0,0)).event!.lossMilli).toBe(Math.floor(12345*bps/10000));
 expect(stock.gold).toBe(12345-Math.floor(12345*bps/10000));
});