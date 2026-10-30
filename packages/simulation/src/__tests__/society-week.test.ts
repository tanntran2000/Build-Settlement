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
