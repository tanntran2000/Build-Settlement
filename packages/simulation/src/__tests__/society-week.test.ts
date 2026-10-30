import { describe, it, expect } from 'vitest';
import { createSocietyState } from '@haven/core';
import { allocateRequirements, societyWorkforce } from '../society-week.js';
const society = () => createSocietyState().society!;
describe('requirements', () => {
  it('projects workforce', () => expect(societyWorkforce(society())).toEqual({free:5,makers:2,luminaries:1,merchants:1,bound:0}));
  it('fills starting demand and zero demand', () => {
    const a = allocateRequirements({society:society(),foodAvailableMilli:4000,goodsServableMilli:1450,luxuryImportedMilli:0});
    expect(a.foodConsumedMilli).toBe(4000); expect(a.goodsConsumedMilli).toBe(1450);
    for (const c of Object.values(a.perClass)) { expect(c.foodBps).toBe(10000); expect(c.goodsBps).toBe(10000); }
  });
  it('fills elites then commons then free then bound', () => {
    const s = society(); s.classes.free=44; s.classes.makers.elite=1; s.classes.bound.free=10;
    const a=allocateRequirements({society:s,foodAvailableMilli:1000,goodsServableMilli:0,luxuryImportedMilli:0});
    expect(Object.fromEntries(Object.entries(a.perClass).map(([k,v])=>[k,v.foodBps]))).toEqual({free:0,makers:10000,luminaries:2916,merchants:0,bound:0});
  });
  it('consumes imported luxury', () => {
    const s=society(); s.classes.makers.elite=2;
    const a=allocateRequirements({society:s,foodAvailableMilli:0,goodsServableMilli:0,luxuryImportedMilli:50});
    expect(a.perClass.makers.luxuryBps).toBe(5000); expect(a.luxuryAfterMilli).toBe(0); expect(a.luxuryConsumedMilli).toBe(50);
  });
});

import { resolveSatisfaction, cityHappiness, societyCounts, type SocietyFacilities } from '../society-week.js';
const facilities = ():SocietyFacilities => ({housing:{free:70,makers:25,luminaries:15,merchants:15,elite:5,bound:10},tavernLevels:[],hospitalLevels:[],academyLevels:0,countingHouseLevels:0,operatingSlumBuildings:0});
const allocation = (s= society()) => allocateRequirements({society:s,foodAvailableMilli:10000,goodsServableMilli:10000,luxuryImportedMilli:1000}).perClass;
describe('satisfaction',()=>{
  it.each([[70,0,60],[76,10000,82],[90,10000,92]])('applies food and goods at %s',(before,foodBps,expected)=>{
    const s=society(), a=allocation(); s.satisfaction.free=before; a.free.foodBps=foodBps;
    expect(resolveSatisfaction(s.satisfaction,a,facilities(),s.classes).free).toBe(expected);
  });
  it('weights luxury by elite share',()=>{
    const s=society(); s.classes.makers.elite=1; const a=allocation(s); a.makers.luxuryBps=5000;
    expect(resolveSatisfaction(s.satisfaction,a,facilities(),s.classes).makers).toBe(82);
    s.classes.makers.common=1;
    expect(resolveSatisfaction(s.satisfaction,a,facilities(),s.classes).makers).toBe(81);
  });
  it('applies tavern only when fed, hospital except bound, overcrowding last',()=>{
    const s=society(),a=allocation(),f=facilities(); f.tavernLevels=[2];
    expect(resolveSatisfaction(s.satisfaction,a,f,s.classes).free).toBe(85);
    a.free.foodBps=0; expect(resolveSatisfaction(s.satisfaction,a,f,s.classes).free).toBe(70);
    f.tavernLevels=[]; f.hospitalLevels=[1]; f.housing.merchants=12;
    const r=resolveSatisfaction(s.satisfaction,allocation(),f,s.classes);
    expect(r.free).toBe(83); expect(r.bound).toBe(80); expect(r.merchants).toBe(78);
  });
  it('weights citizens only and preserves previous at zero',()=>{
    const s=society(); const values={free:80,makers:70,luminaries:60,merchants:50,bound:0};
    expect(cityHappiness(values,societyCounts(s),80)).toBe(71.7);
    expect(cityHappiness(values,{free:0,makers:0,luminaries:0,merchants:0,bound:100},77)).toBe(77);
  });
});

import { distributeArrivals, eliteArrival } from '../society-week.js';
describe('arrivals',()=>{
  const counts={free:55,makers:20,luminaries:12,merchants:13,bound:0};
  const housing={free:70,makers:25,luminaries:12,merchants:13,elite:1,bound:0};
  const fed={free:10000,makers:10000,luminaries:10000,merchants:10000,bound:10000};
  it('splits proportionally with fixed remainder order',()=>expect(distributeArrivals(10,counts,housing,fed)).toEqual({free:8,makers:2,luminaries:0,merchants:0}));
  it('redistributes away from hungry classes and caps to room',()=>expect(distributeArrivals(10,counts,housing,{...fed,free:0})).toEqual({free:0,makers:5,luminaries:0,merchants:0}));
  it('has no arrivals without housing',()=>expect(distributeArrivals(10,counts,{...counts,elite:0},fed)).toEqual({free:0,makers:0,luminaries:0,merchants:0}));
  it.each([[30,'luminaries'],[50,'merchants'],[70,'makers']])('selects corruption band %s',(corruption,target)=>{
    const s=society(); s.corruption=corruption as number;
    expect(eliteArrival(s,housing,5000)).toBe(target); expect(eliteArrival(s,housing,4999)).toBeNull();
    expect(eliteArrival(s,{...housing,elite:0},10000)).toBeNull();
  });
});

import { resolveTraining, resolveDebt } from '../society-week.js';
const employment=()=>({workforce:societyWorkforce(society()),assigned:societyWorkforce(society())});
describe('transfers',()=>{
  it('trains within housing and gold limits without mutating the source',()=>{
    const s=society(),f=facilities(); s.training.target='makers'; f.academyLevels=1;
    const r=resolveTraining(s,f,10000); expect(r.trained).toBe(2); expect(r.goldSpentMilli).toBe(2000); expect(r.society.classes.free).toBe(53); expect(s.classes.free).toBe(55);
    const poor=resolveTraining(s,f,1000); expect(poor.trained).toBe(1); expect(poor.notes).toContain('training-no-gold');
    f.housing.makers=20; expect(resolveTraining(s,f,10000).notes).toContain('training-no-housing'); expect(resolveTraining(s,f,10000).trained).toBe(0);
    s.training.target=null; expect(resolveTraining(s,f,10000).goldSpentMilli).toBe(0);
  });
  it('computes unemployment, scarcity, tax and crowding pressure',()=>{
    const s=society(),f=facilities(),e=employment(),a=allocation(); e.assigned.free=3; a.free.foodBps=5000; f.countingHouseLevels=1; f.housing.free=54;
    expect(resolveDebt(s,a,f,e).society.debtPressure.free).toBe(20);
    s.debtPressure.free=3; expect(resolveDebt(s,allocation(),facilities(),employment()).society.debtPressure.free).toBe(0);
  });
  it('enslaves one in fifty and preserves origin or reports full quarters',()=>{
    const s=society(),f=facilities(),a=allocation(); s.debtPressure.free=48; a.free.foodBps=5000;
    const r=resolveDebt(s,a,f,employment()); expect(r.society.classes.free).toBe(54); expect(r.society.classes.bound.free).toBe(1); expect(r.society.debtPressure.free).toBe(33); expect(r.notes.free).toContain('debt-enslavement');
    f.housing.bound=0; const full=resolveDebt(s,a,f,employment()); expect(full.society.debtPressure.free).toBe(53); expect(full.society.classes.bound.free).toBe(0); expect(full.notes.free).toContain('no-slave-room');
    expect(full.society.classes.makers.elite).toBe(s.classes.makers.elite);
  });
});

import { isSocietyState, societyPopulation } from '@haven/core';
import { resolveDesperation, resolveTension, resolveCorruption, resolveSocietyWeek, type SocietyWeekInput } from '../society-week.js';
const input=():SocietyWeekInput=>({society:society(),facilities:facilities(),employment:employment(),foodAvailableMilli:4000,goodsServableMilli:1450,luxuryImportedMilli:0,arrivalsBudget:0,goldAvailableMilli:10000});
describe('weekly resolution',()=>{
  it('resolves desperation, clamps, and applies hospital',()=>{
    expect(resolveDesperation(10,5000,true,70,[1])).toBe(23); expect(resolveDesperation(10,10000,false,30,[])).toBe(5);
    expect(resolveDesperation(100,0,true,70,[])).toBe(100); expect(resolveDesperation(0,10000,false,30,[])).toBe(0);
  });
  it('resolves tension and corruption without overshoot',()=>{
    expect(resolveTension(0,0,40)).toBe(8); expect(resolveTension(0,10000,0)).toBe(0);
    expect(resolveCorruption(50,0)).toBe(48); expect(resolveCorruption(31,0)).toBe(30); expect(resolveCorruption(49,2)).toBe(50);
  });
  it('conserves the starting population and reports null Bound debt',()=>{
    const i=input(); i.facilities.housing.elite=0; const r=resolveSocietyWeek(i); expect(isSocietyState(r.society)).toBe(true); expect(societyPopulation(r.society)).toBe(100);
    expect(r.report.classes.bound.debtBefore).toBeNull(); expect(r.report.classes.bound.debtAfter).toBeNull(); expect(r.cityHappiness).toBe(82);
  });
  const cases=[
    [0,0,0,0],[1000,0,0,0],[4000,1450,10,0],[5000,2000,5,50],[4000,0,0,70],
    [2000,1000,3,30],[1,1,1,40],[8000,4000,100,60],[0,1450,0,50],[4000,1450,0,100],
    [3000,1000,5,0],[10000,10000,100,30],[999,999,2,70],[4001,1451,1,41],[3999,1449,9,61],
    [0,0,100,100],[7000,0,5,20],[6000,4000,0,80],[10000,10000,3,49],[5000,2000,7,51],
  ];
  it.each(cases)('is deterministic and conservative with Food %s Goods %s budget %s corruption %s',(food,goods,budget,corruption)=>{
    const i=input(); i.foodAvailableMilli=food; i.goodsServableMilli=goods; i.arrivalsBudget=budget; i.society.corruption=corruption;
    i.society.classes.free=44; i.society.classes.bound.free=10; i.society.classes.makers.elite=1;
    i.society.training.target='makers'; i.facilities.academyLevels=1; i.society.debtPressure.free=48;
    i.luxuryImportedMilli=50;
    const before=structuredClone(i),r=resolveSocietyWeek(i);
    expect(r).toEqual(resolveSocietyWeek(i)); expect(i).toEqual(before); expect(isSocietyState(r.society)).toBe(true);
    const arrivals=Object.values(r.report.classes).reduce((n,c)=>n+c.arrivals,0);
    expect(societyPopulation(r.society)).toBe(societyPopulation(i.society)+arrivals+(r.report.eliteArrived?1:0));
    expect(Object.values(societyCounts(r.society)).every(n=>n>=0)).toBe(true);
  });
  it('accepts maximum safe supply and rejects overflow atomically',()=>{
    const i=input(); i.foodAvailableMilli=Number.MAX_SAFE_INTEGER; expect(isSocietyState(resolveSocietyWeek(i).society)).toBe(true);
    i.society.classes.free=Number.MAX_SAFE_INTEGER; const before=structuredClone(i); expect(()=>resolveSocietyWeek(i)).toThrow(); expect(i).toEqual(before);
  });
  it('reports full housing and training limits and retains luxury stock',()=>{
    const i=input(); i.facilities.housing={free:55,makers:20,luminaries:12,merchants:13,elite:0,bound:0};
    i.society.training.target='makers'; i.facilities.academyLevels=1; i.arrivalsBudget=10; i.luxuryImportedMilli=100;
    const r=resolveSocietyWeek(i); expect(r.report.classes.free.notes).toContain('housing-full'); expect(r.report.classes.makers.notes).toContain('training-no-housing'); expect(r.society.luxuryStockMilli).toBe(100);
  });
});
