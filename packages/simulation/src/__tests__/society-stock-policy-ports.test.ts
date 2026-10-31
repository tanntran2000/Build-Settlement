import { describe, expect, it } from 'vitest';
import { createSocietyState, isTileTrialState, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { allocateRequirements } from '../society-week.js';

const stocks = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].inventory;
function freeCity() {
  const s = createSocietyState(), c = s.society!.classes;
  c.free = 100; c.makers.common = 0; c.luminaries.common = 0; c.merchants.common = 0;
  for (const tile of s.tiles) if (tile.building) tile.building.workers = 0;
  s.tiles.find(t => t.id === 'house-2')!.building = { typeId: 'common-housing', level: 3, workers: 0, enabled: true };
  stocks(s).gold = 1000000;
  expect(isTileTrialState(s)).toBe(true);
  return s;
}
function end(s: TileTrialState) {
  const before = structuredClone(s), r = executeTileTrialCommand(s, { type: 'END_WEEK', expectedWeek: s.world.week, expectedRevision: s.revision });
  expect(r.success).toBe(true); expect(s).toEqual(before);
  if (!r.success) throw Error(r.error.message);
  expect(isTileTrialState(r.nextState)).toBe(true);
  return r;
}
function plan(s: TileTrialState) {
  const before = structuredClone(s), r = executeTileTrialCommand(s, { type: 'NEXT_WEEK', expectedRevision: s.revision });
  expect(r.success).toBe(true); expect(s).toEqual(before);
  if (!r.success) throw Error(r.error.message);
  return r.nextState;
}

describe('retained stock and needs branches in society', () => {
  it('starts a valid independent world with five physical stocks and equipped Food chain', () => {
    const s = createSocietyState(); expect(isTileTrialState(s)).toBe(true);
    expect(Object.keys(stocks(s))).toEqual(['gold', 'wheat', 'food', 'wood', 'iron']);
    expect(s.tiles[0].building).toEqual({ typeId: 'farm', level: 1, workers: 2, enabled: true });
    expect(s.tiles[1].building).toEqual({ typeId: 'processor', level: 1, workers: 2, enabled: true });
    expect(s.tiles.filter(t => t.building)).toHaveLength(7);
  });
  it('zero population consumes no materials or Food and mints no tax, revenue or class satisfaction', () => {
    const s = freeCity(); s.society!.classes.free = 0;
    s.world.settlements[s.world.activeSettlementId!].cohorts[0].count = 0;
    const before = structuredClone(s), r = end(s);
    expect(r.report!.goods).toMatchObject({ demandMilli: 0, servedMilli: 0, fulfillmentBps: 10000, woodUsed: 0, ironUsed: 0, revenueMilli: 0 });
    expect(r.report!.taxMilli).toBe(0); expect(r.report!.foodConsumedMilli).toBe(0);
    expect(r.nextState.society!.satisfaction).toEqual(s.society!.satisfaction);
    expect(s).toEqual(before);
  });
  it('never charges an incomplete Wood batch even while stored Goods can be distributed', () => {
    const s = createSocietyState(); s.tiles[1].building!.workers = 0;
    s.tiles.find(t => t.id === 'plain-2')!.building = { typeId: 'workshop', level: 1, workers: 1, enabled: true };
    stocks(s).wood = 1999; stocks(s).iron = 0;
    const r = end(s);
    expect(r.report!.goodsStock).toMatchObject({ producedMilli: 0, distributedMilli: 1450, closingMilli: 8550 });
    expect(r.report!.goods).toMatchObject({ woodUsed: 0, ironUsed: 0 });
    expect(stocks(r.nextState).wood).toBe(1999);
  });
  it('caps distribution at demand, charges complete production batches once and carries the remainder', () => {
    const s = createSocietyState(); s.tiles[1].building!.workers = 0;
    s.tiles.find(t => t.id === 'plain-2')!.building = { typeId: 'workshop', level: 2, workers: 2, enabled: true };
    s.tiles.find(t => t.id === 'spec-1')!.building!.level = 2;
    stocks(s).wood = 4000;
    const r = end(s);
    expect(r.report!.goods).toEqual({ demandMilli: 1450, servedMilli: 1450, fulfillmentBps: 10000, woodUsed: 4000, ironUsed: 0, revenueMilli: 1450 });
    expect(r.report!.goodsStock).toMatchObject({ producedMilli: 4000, distributedMilli: 1450, closingMilli: 12550, capacityMilli: 4000 });
    expect(stocks(r.nextState).wood).toBe(0); expect(Object.hasOwn(r.report!.after, 'goods')).toBe(false);
  });
  it.each([
    { name: 'full Food recovers below 80', food: 5000, happiness: 70, goodsBps: 0, consumed: 4000, remaining: 1000, after: 74 },
    { name: 'Food caps recovery before Goods', food: 4000, happiness: 79, goodsBps: 10000, consumed: 4000, remaining: 0, after: 82 },
    { name: 'Food recovers 79 to 80 without Goods', food: 4000, happiness: 79, goodsBps: 0, consumed: 4000, remaining: 0, after: 80 },
    { name: 'Food preserves an above-80 score', food: 4000, happiness: 83, goodsBps: 0, consumed: 4000, remaining: 0, after: 83 },
    { name: 'Goods raises an above-80 score', food: 4000, happiness: 83, goodsBps: 5000, consumed: 4000, remaining: 0, after: 84 },
    { name: 'partial shortage precedes Goods', food: 2000, happiness: 79, goodsBps: 5000, consumed: 2000, remaining: 0, after: 74 },
    { name: 'no Food subtracts twelve', food: 0, happiness: 80, goodsBps: 0, consumed: 0, remaining: 0, after: 68 },
    { name: 'shortage at zero clamps after Goods', food: 0, happiness: 0, goodsBps: 10000, consumed: 0, remaining: 0, after: 0 },
    { name: 'shortage near zero clamps after Goods', food: 0, happiness: 11, goodsBps: 10000, consumed: 0, remaining: 0, after: 1 },
    { name: 'Food plus Goods clamps at 100', food: 4000, happiness: 99, goodsBps: 10000, consumed: 4000, remaining: 0, after: 100 },
    { name: 'existing 100 is preserved', food: 4000, happiness: 100, goodsBps: 10000, consumed: 4000, remaining: 0, after: 100 },
  ])('ports the retained Food rule per class: $name', ({ food, happiness, goodsBps, consumed, remaining, after }) => {
    const s = freeCity(); stocks(s).food = food; s.society!.satisfaction.free = happiness; s.happiness = happiness;
    s.goodsStock!.amountMilli = goodsBps / 10;
    const r = end(s);
    expect(r.report).toMatchObject({ foodDemandMilli: 4000, foodConsumedMilli: consumed });
    expect(stocks(r.nextState).food).toBe(remaining);
    expect(r.nextState.society!.satisfaction.free).toBe(after); expect(r.nextState.happiness).toBe(after);
  });
  it('preserves Food shortage and recovery without Goods service', () => {
    const s = freeCity(); s.goodsStock!.amountMilli = 0; stocks(s).food = 2000;
    expect(end(s).nextState.happiness).toBe(74);
    stocks(s).food = 4000; s.happiness = 79; s.society!.satisfaction.free = 79;
    expect(end(s).nextState.happiness).toBe(80);
    s.happiness = 85; s.society!.satisfaction.free = 85; expect(end(s).nextState.happiness).toBe(85);
  });
  it('retains exact milli Food allocation at the last safe demand boundary', () => {
    const s = freeCity().society!; s.classes.free = 225179981368524;
    const before = structuredClone(s), input = { society: s, foodAvailableMilli: Number.MAX_SAFE_INTEGER, goodsServableMilli: 0, luxuryImportedMilli: 0 };
    const r = allocateRequirements(input);
    expect(r.foodConsumedMilli).toBe(9007199254740960);
    expect(Number.MAX_SAFE_INTEGER - r.foodConsumedMilli).toBe(31);
    s.classes.free = 1;
    expect(Number.MAX_SAFE_INTEGER - allocateRequirements(input).foodConsumedMilli).toBe(9007199254740951);
    s.classes.free = before.classes.free; expect(s).toEqual(before);
  });
  it('rejects overflowing per-class Food demand', () => {
    const s = freeCity().society!; s.classes.free = 225179981368525;
    const before = structuredClone(s);
    expect(() => allocateRequirements({ society: s, foodAvailableMilli: Number.MAX_SAFE_INTEGER, goodsServableMilli: 0, luxuryImportedMilli: 0 })).toThrow('Society arithmetic overflow.');
    expect(s).toEqual(before);
  });
  it('keeps Food/Goods resolution deterministic and preserves caller-owned state', () => {
    const s = freeCity(); stocks(s).food = 2500; s.goodsStock!.amountMilli = 250;
    s.happiness = 60; s.society!.satisfaction.free = 60;
    const before = structuredClone(s), a = end(s), b = end(s);
    expect(a.report).toMatchObject({ foodDemandMilli: 4000, foodConsumedMilli: 2500, happinessAfter: 56 });
    expect(stocks(a.nextState).food).toBe(0); expect(b).toEqual(a); expect(b).not.toBe(a); expect(s).toEqual(before);
  });
  it('sustains fifty weeks with exact stock conservation and no duplicate Food or free Goods', () => {
    let s = createSocietyState(); s.society!.classes.free = 50; s.society!.classes.makers.common = 50;
    s.society!.classes.luminaries.common = 0; s.society!.classes.merchants.common = 0;
    Object.assign(stocks(s), { gold: 1000000, wood: 1000000 });
    s.tiles[0].building!.workers = 3; s.tiles[1].building!.workers = 3;
    s.tiles.find(t => t.id === 'forest-1')!.building = { typeId: 'logging', level: 1, workers: 1, enabled: true };
    s.tiles.find(t => t.id === 'ore-1')!.building = { typeId: 'mine', level: 1, workers: 1, enabled: true };
    s.tiles.find(t => t.id === 'plain-2')!.building = { typeId: 'workshop', level: 2, workers: 2, enabled: true };
    s.tiles.find(t => t.id === 'spec-1')!.building!.level = 2;
    for (let i = 0; i < 50; i++) {
      const r = end(s), report = r.report!, goods = report.goodsStock!;
      expect(report.goods.fulfillmentBps).toBe(10000);
      expect(report.after.food).toBe(report.before.food + 6000 - report.foodConsumedMilli);
      expect(goods.producedMilli).toBe(4000); expect(goods.closingMilli).toBe(goods.openingMilli + 4000 - goods.distributedMilli);
      expect(report.after.wood).toBe(report.before.wood + 2000 - report.goods.woodUsed);
      expect(Object.values(report.after).every(v => Number.isSafeInteger(v) && v >= 0)).toBe(true);
      s = plan(r.nextState);
    }
    expect(s.world.week).toBe(51);
  });
});
