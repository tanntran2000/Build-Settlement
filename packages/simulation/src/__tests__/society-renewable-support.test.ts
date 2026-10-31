import { describe, expect, it } from 'vitest';
import { createSocietyState, isTileTrialState, societyPopulation, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { resolveTrialImmigration, type ImmigrationFacts } from '../tile-trial-immigration.js';

const settlement = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!];
const count = (s: TileTrialState) => settlement(s).cohorts.reduce((n, c) => n + c.count, 0);
const gameplay = (s: TileTrialState) => ({ ...s, revision: 0 });
function population(free: number, makers: number, luminaries = 0, merchants = 0) {
  const s = createSocietyState(), c = s.society!.classes;
  c.free = free; c.makers.common = makers; c.luminaries.common = luminaries; c.merchants.common = merchants;
  settlement(s).cohorts[0].count = free + makers + luminaries + merchants;
  for (const t of s.tiles) if (t.building) t.building.workers = 0;
  Object.assign(settlement(s).inventory, { gold: 1000000, wood: 1000000, iron: 1000000 });
  expect(isTileTrialState(s)).toBe(true);
  return s;
}
function act(s: TileTrialState, command: Record<string, unknown>) {
  const before = structuredClone(s);
  const r = executeTileTrialCommand(s, { expectedRevision: s.revision, ...command });
  expect(r.success).toBe(true); expect(s).toEqual(before);
  if (!r.success) throw Error(r.error.message);
  expect(isTileTrialState(r.nextState)).toBe(true);
  expect(count(r.nextState)).toBe(societyPopulation(r.nextState.society!));
  expect(r.nextState.revision).toBe(s.revision + 1);
  return r;
}
const week = (s: TileTrialState) => act(s, { type: 'END_WEEK', expectedWeek: s.world.week });
const plan = (s: TileTrialState) => act(s, { type: 'NEXT_WEEK' }).nextState;
function expanded(free = 55, makers = 40, luminaries = 0, merchants = 5) {
  let s = population(free, makers, luminaries, merchants);
  for (const [tileId, typeId] of [['forest-1', 'logging'], ['ore-1', 'mine'], ['plain-2', 'workshop']] as const)
    s = act(s, { type: 'BUILD', tileId, typeId }).nextState;
  for (const [tileId, workers] of [['field-1', 3], ['plain-1', 3], ['forest-1', 1], ['ore-1', 1], ['plain-2', 1]] as const)
    s = act(s, { type: 'SET_WORKERS', tileId, workers }).nextState;
  return s;
}

describe('society renewable support and transaction ports', () => {
  it.each([
    { processors: 1, usefulWorkerSlots: 20, target: 200, debit: 7500 },
    { processors: 2, usefulWorkerSlots: 25, target: 227, debit: 8000 },
  ])('two funded Farms retain independent recipe caps with $processors funded Processor(s)', ({ processors, usefulWorkerSlots, target, debit }) => {
    // Seed the old 136-person checkpoint directly with valid class pools: 7 basic and 6 Makers WF.
    let s = expanded(76, 60, 0, 0);
    s = act(s, { type: 'BUILD', tileId: 'field-2', typeId: 'farm' }).nextState;
    for (const [tileId, workers] of [['field-1', 4], ['plain-1', 5], ['field-2', 1]] as const)
      s = act(s, { type: 'SET_WORKERS', tileId, workers }).nextState;
    if (processors === 2) s = act(s, { type: 'BUILD', tileId: 'plain-4', typeId: 'processor' }).nextState;
    const before = structuredClone(s), r = week(s), report = r.report!;
    expect(report.immigration).toEqual({ populationBefore: 136, arrivals: 2, populationAfter: 138,
      usefulWorkerSlots, renewableFoodMilli: 10000, target, reason: 'arrivals' });
    expect(report).toMatchObject({ taxMilli: 4080, foodDemandMilli: 5440, foodConsumedMilli: 5440, unpaidUpkeepMilli: 0 });
    expect(report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold).toBe(debit);
    expect(count(r.nextState)).toBe(138); expect(r.nextState.tiles).toEqual(s.tiles); expect(s).toEqual(before);
    expect(r.nextState.world.week).toBe(s.world.week + 1); expect(r.nextState.phase).toBe('report');
    expect(week(s)).toEqual(r);
  });
  it('does not mistake 30 weeks of stored Wheat liquidation for renewable Food', () => {
    let s = expanded(); Object.assign(settlement(s).inventory, { gold: 100000, wheat: 1000000, food: 100000 });
    s = act(s, { type: 'SET_ENABLED', tileId: 'field-1', enabled: false }).nextState;
    for (let i = 0; i < 30; i++) {
      const before = structuredClone(s), r = week(s), report = r.report!;
      expect(report.foodConsumedMilli).toBe(4000);
      expect(report.immigration).toMatchObject({ renewableFoodMilli: 0, arrivals: 0, target: 0, reason: 'no-capacity' });
      expect(report.after.wheat).toBe(report.before.wheat - 6000);
      expect(report.after.food).toBe(report.before.food + 6000 - 4000);
      expect(r.nextState.tiles).toEqual(s.tiles); expect(s).toEqual(before);
      expect(r.nextState.phase).toBe('report'); expect(r.nextState.world.week).toBe(s.world.week + 1);
      s = plan(r.nextState); expect(count(s)).toBe(100);
    }
    expect(settlement(s).inventory.wheat).toBe(820000);
    expect(settlement(s).inventory.food).toBe(160000);
  });
  it('settles the opening population before applying society arrivals without changing assignments', () => {
    const s = expanded(), before = structuredClone(s), r = week(s);
    expect(count(r.nextState)).toBe(102);
    expect(r.report!.immigration).toMatchObject({ populationBefore: 100, arrivals: 2, populationAfter: 102, target: 136, usefulWorkerSlots: 15 });
    expect(r.report!.taxMilli).toBe(3000); expect(r.report!.foodDemandMilli).toBe(4000);
    expect(r.report!.goods.demandMilli).toBe(1450); expect(r.nextState.tiles).toEqual(s.tiles); expect(s).toEqual(before);
    const next = plan(r.nextState), opening = next.society!.classes, second = week(next);
    expect(second.report!.taxMilli).toBe(3060); expect(second.report!.foodDemandMilli).toBe(4080);
    expect(second.report!.goods.demandMilli).toBe(opening.free * 10 + (opening.makers.common + opening.luminaries.common + opening.merchants.common) * 20);
    expect(count(second.nextState)).toBe(104);
  });
  it('starter reserves and stored Wheat liquidation do not create renewable support', () => {
    for (const food of [4000, 1000000]) {
      const s = createSocietyState(); settlement(s).inventory.food = food;
      expect(count(week(s).nextState)).toBe(100);
    }
    let s = expanded(); s = act(s, { type: 'SET_WORKERS', tileId: 'field-1', workers: 0 }).nextState;
    settlement(s).inventory.wheat = 1000000;
    const r = week(s); expect(count(r.nextState)).toBe(100); expect(r.report!.immigration!.renewableFoodMilli).toBe(0);
  });
  it('duplicate idle Processor cannot reuse the same Wheat capacity', () => {
    let s = population(70, 30);
    for (const tileId of ['field-1', 'plain-1']) s = act(s, { type: 'SET_WORKERS', tileId, workers: 3 }).nextState;
    s = act(s, { type: 'BUILD', tileId: 'plain-2', typeId: 'processor' }).nextState;
    const r = week(s); expect(count(r.nextState)).toBe(100); expect(r.report!.immigration!.usefulWorkerSlots).toBe(10);
  });
  it('one funded Farm shares its five supply slots across two funded Processors', () => {
    const s = act(expanded(), { type: 'BUILD', tileId: 'plain-4', typeId: 'processor' }).nextState;
    const before = structuredClone(s), r = week(s);
    expect(r.report!.unpaidUpkeepMilli).toBe(0);
    expect(r.report!.immigration).toEqual({ populationBefore: 100, arrivals: 2, populationAfter: 102,
      usefulWorkerSlots: 15, renewableFoodMilli: 6000, target: 136, reason: 'arrivals' });
    expect(count(r.nextState)).toBe(102); expect(r.nextState.tiles).toEqual(s.tiles); expect(s).toEqual(before);
  });
  it('duplicate idle Workshop cannot reuse Market distribution capacity', () => {
    const base = expanded(), extra = act(base, { type: 'BUILD', tileId: 'plain-4', typeId: 'workshop' }).nextState;
    const a = week(base), b = week(extra);
    expect(b.report!.immigration!.usefulWorkerSlots).toBe(15);
    expect(b.report!.immigration!.target).toBe(a.report!.immigration!.target);
    expect(b.report!.goods).toEqual(a.report!.goods); expect(count(b.nextState)).toBe(102);
  });
  it('never revives a zero city or introduces departures when support is below population', () => {
    const zero = population(0, 0); expect(count(week(zero).nextState)).toBe(0);
    const crowded = expanded(155, 40, 0, 5);
    expect(count(week(crowded).nextState)).toBe(200);
    const other = expanded(); settlement(other).cohorts[0].id = 'different';
    const facts: ImmigrationFacts = { fundedTileIds: other.tiles.filter(t => t.building).map(t => t.id), farmBatches: 3, processorBatches: 3, woodProducedMilli: 2000, ironProducedMilli: 1000, operatingDebitMilli: 5500, foodDemandMilli: 4000, foodConsumedMilli: 4000, unpaidUpkeepMilli: 0 };
    const before = structuredClone(other);
    expect(resolveTrialImmigration(other, facts)).toMatchObject({ reason: 'cohort-unavailable', arrivals: 0, populationAfter: 100 });
    // Society writes its derived total to weekly_middle; an absent target rejects the complete transaction.
    const r = executeTileTrialCommand(other, { type: 'END_WEEK', expectedWeek: 1, expectedRevision: other.revision });
    expect(r).toMatchObject({ success: false, error: { code: 'EXECUTION_ERROR' } });
    if (!r.success) expect(r.state).toBe(other); expect(other).toEqual(before);
  });
  it('does not admit during shortage, unpaid upkeep or tight liquidity', () => {
    let food = expanded(); settlement(food).inventory.food = 0;
    food = act(food, { type: 'SET_WORKERS', tileId: 'plain-1', workers: 1 }).nextState;
    expect(count(week(food).nextState)).toBe(100);
    const poor = expanded(); settlement(poor).inventory.gold = 0;
    expect(count(week(poor).nextState)).toBe(100);
    const tight = expanded(); settlement(tight).inventory.gold = 2500;
    const r = week(tight); expect(r.report!.unpaidUpkeepMilli).toBe(0); expect(count(r.nextState)).toBe(100);
  });
  it('rejects stale or repeated End Week and overflow atomically', () => {
    const s = expanded(), command = { type: 'END_WEEK', expectedWeek: s.world.week, expectedRevision: s.revision };
    const r = executeTileTrialCommand(s, command); expect(r.success).toBe(true); if (!r.success) throw Error();
    const after = structuredClone(r.nextState), bad = executeTileTrialCommand(r.nextState, command);
    expect(bad).toMatchObject({ success: false, state: after }); if (!bad.success) expect(bad.state).toBe(r.nextState);
    const huge = expanded(); settlement(huge).inventory.gold = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(huge), overflow = executeTileTrialCommand(huge, { ...command, expectedRevision: huge.revision });
    expect(overflow.success).toBe(false); expect(huge).toEqual(before); if (!overflow.success) expect(overflow.state).toBe(huge);
  });
  it('preserves complete gameplay and assignments through sixty weeks of snapshot restores', () => {
    let s = expanded(), resumed = structuredClone(s);
    const assignments = s.tiles.map(t => t.building?.workers ?? 0);
    for (let i = 0; i < 60; i++) {
      const a = week(s), b = week(resumed); expect(a.report).toEqual(b.report);
      s = plan(a.nextState); resumed = plan(b.nextState);
      resumed = act(resumed, { type: 'LOAD_TRIAL', snapshot: structuredClone(resumed) }).nextState;
      expect(gameplay(resumed)).toEqual(gameplay(s)); expect(s.tiles.map(t => t.building?.workers ?? 0)).toEqual(assignments);
      for (const stock of Object.values(settlement(s).inventory)) expect(Number.isSafeInteger(stock) && stock >= 0).toBe(true);
    }
  });
  it('stops and resumes immigration over forty-five weeks when renewable support changes', () => {
    let s = expanded(), pausedPopulation = 0, resumedArrivals = 0;
    for (let i = 0; i < 45; i++) {
      if (i === 10) { pausedPopulation = count(s); s = act(s, { type: 'SET_ENABLED', tileId: 'forest-1', enabled: false }).nextState; }
      if (i === 15) {
        s = act(s, { type: 'SET_ENABLED', tileId: 'forest-1', enabled: true }).nextState;
        expect(s.tiles.find(t => t.id === 'forest-1')!.building!.workers).toBe(0);
        s = act(s, { type: 'SET_WORKERS', tileId: 'forest-1', workers: 1 }).nextState;
      }
      const before = count(s), r = week(s); s = plan(r.nextState);
      expect(count(s)).toBeGreaterThanOrEqual(before);
      if (i >= 10 && i < 15) { expect(count(s)).toBe(pausedPopulation); expect(r.report!.immigration!.arrivals).toBe(0); }
      if (i >= 15) resumedArrivals += r.report!.immigration!.arrivals;
      for (const stock of Object.values(settlement(s).inventory)) expect(Number.isSafeInteger(stock) && stock >= 0).toBe(true);
    }
    expect(resumedArrivals).toBeGreaterThan(0);
  });
});
it.each(['food-shortage', 'upkeep-unpaid', 'target-unfunded', 'liquidity'])('retains the live immigration refusal branch: %s', reason => {
  const s = expanded();
  const facts: ImmigrationFacts = { fundedTileIds: s.tiles.filter(t => t.building).map(t => t.id), farmBatches: 3, processorBatches: 3, woodProducedMilli: 2000, ironProducedMilli: 1000, operatingDebitMilli: 5500, foodDemandMilli: 4000, foodConsumedMilli: 4000, unpaidUpkeepMilli: 0 };
  if (reason === 'food-shortage') facts.foodConsumedMilli = 0;
  if (reason === 'upkeep-unpaid') facts.unpaidUpkeepMilli = 1;
  if (reason === 'target-unfunded') facts.operatingDebitMilli = 7000;
  if (reason === 'liquidity') settlement(s).inventory.gold = 0;
  const before = structuredClone(s), factsBefore = structuredClone(facts);
  expect(resolveTrialImmigration(s, facts)).toMatchObject({ reason, arrivals: 0, populationAfter: 100 });
  expect(s).toEqual(before); expect(facts).toEqual(factsBefore);
});
