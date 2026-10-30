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
