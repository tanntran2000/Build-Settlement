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
