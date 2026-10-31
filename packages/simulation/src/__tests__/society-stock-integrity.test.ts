import { describe, expect, it } from 'vitest';
import { createCharacterLifeSession, createSocietyState, DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { observeCharacterLife } from '../character-life-observation.js';
import { resolveTrialImmigration, type ImmigrationFacts } from '../tile-trial-immigration.js';

const stocks = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].inventory;
const cohort = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].cohorts[0];
function command(s: TileTrialState, type: string, fields: Record<string, unknown> = {}) {
  const r = executeTileTrialCommand(s, { type, expectedRevision: s.revision, ...fields });
  if (!r.success) throw Error(r.error.message);
  return r;
}
const end = (s: TileTrialState) => command(s, 'END_WEEK', { expectedWeek: s.world.week });
function workshop() {
  let s = createSocietyState();
  s = command(s, 'SET_WORKERS', { tileId: 'plain-1', workers: 0 }).nextState;
  s = command(s, 'BUILD', { tileId: 'plain-3', typeId: 'workshop' }).nextState;
  return command(s, 'SET_WORKERS', { tileId: 'plain-3', workers: 1 }).nextState;
}
function makersOnly(s: TileTrialState, count: number) {
  s.society!.classes.free = 0;
  for (const id of ['makers', 'luminaries', 'merchants'] as const) s.society!.classes[id].common = id === 'makers' ? count : 0;
  cohort(s).count = count;
}

describe('retained society Goods stock flow', () => {
  it('preserves five default weeks, population, normal upkeep and no hidden grants', () => {
    let s = createSocietyState(), debit = 0;
    for (let week = 1; week <= 5; week++) {
      const before = structuredClone(s), r = end(s), report = r.report!;
      expect(s).toEqual(before); expect(end(s)).toEqual(r);
      expect(report.goodsStock).toEqual({ openingMilli: 10000 - 1450 * (week - 1), producedMilli: 0, distributedMilli: 1450, closingMilli: 10000 - 1450 * week, demandMilli: 1450, unmetMilli: 0, capacityMilli: 2000, limitedBy: 'none' });
      expect(report).toMatchObject({ unpaidUpkeepMilli: 0, farmBatchGoldMilli: 2000, farmExtraUpkeepMilli: 0, taxMilli: 3000, foodDemandMilli: 4000, foodConsumedMilli: 4000, goods: { servedMilli: 1450, revenueMilli: 1450, ironUsed: 0 }, immigration: { populationBefore: 100, populationAfter: 100, target: 90, reason: 'no-capacity' } });
      expect(stocks(r.nextState)).toMatchObject({ food: 20000, gold: 45000 + 1450 * week });
      debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;
      s = command(r.nextState, 'NEXT_WEEK').nextState;
    }
    expect(debit).toBe(15000); expect(s.goodsStock!.amountMilli).toBe(2750);
  });
  it('consumes reserves without production for five weeks and reports the sixth-week Food shortage', () => {
    let s = createSocietyState(), debit = 0;
    for (const tileId of ['field-1', 'plain-1']) s = command(s, 'SET_WORKERS', { tileId, workers: 0 }).nextState;
    for (let week = 1; week <= 5; week++) {
      const r = end(s), report = r.report!;
      expect(report.foodConsumedMilli).toBe(4000); expect(report.goods.servedMilli).toBe(1450); expect(report.unpaidUpkeepMilli).toBe(0);
      debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;
      expect(stocks(r.nextState).food).toBe(20000 - 4000 * week);
      expect(r.nextState.goodsStock!.amountMilli).toBe(10000 - 1450 * week);
      s = command(r.nextState, 'NEXT_WEEK').nextState;
    }
    expect(debit).toBe(10000); expect(debit).toBeLessThanOrEqual(15000);
    expect(end(s).report).toMatchObject({ foodConsumedMilli: 0, goods: { servedMilli: 1450 }, goodsStock: { closingMilli: 1300 } });
  });
  it.each(['missing', 'disabled', 'unfunded'])('produces and carries stock without a %s Market; no production revenue', kind => {
    let s = workshop(); const market = s.tiles.find(t => t.id === 'spec-1')!;
    s.goodsStock!.amountMilli = 0; stocks(s).iron = 0;
    if (kind === 'missing') market.building = null;
    if (kind === 'disabled') market.building!.enabled = false;
    if (kind === 'unfunded') {
      for (const t of s.tiles) if (t.building && ['farm', 'processor'].includes(t.building.typeId)) { t.building.enabled = false; t.building.workers = 0; }
      makersOnly(s, 10); stocks(s).gold = 200;
    }
    const r = end(s);
    expect(r.report).toMatchObject({ goods: { woodUsed: 2000, ironUsed: 0, servedMilli: 0, revenueMilli: 0 }, goodsStock: { openingMilli: 0, producedMilli: 2000, closingMilli: 2000, capacityMilli: 0, limitedBy: 'capacity' } });
    expect(stocks(r.nextState).wood).toBe(stocks(s).wood - 2000); expect(stocks(r.nextState).iron).toBe(0);
    if (kind !== 'unfunded') {
      s = command(r.nextState, 'NEXT_WEEK').nextState;
      expect(end(s).report!.goodsStock!.closingMilli).toBe(4000);
    }
  });
  it.each([[1000, 100, 'stock', 1000], [2000, 150, 'capacity', 2000], [10000, 150, 'capacity', 2000], [666, 37, 'stock', 666], [10000, 37, 'none', 740]] as const)('distributes stock %i at population %i with %s limit', (amount, population, limit, served) => {
    const s = createSocietyState(); s.goodsStock!.amountMilli = amount; makersOnly(s, population);
    for (const t of s.tiles) if (t.building) t.building.workers = 0;
    const r = end(s), report = r.report!;
    expect(report.goodsStock).toMatchObject({ distributedMilli: served, closingMilli: amount - served, unmetMilli: population * 20 - served, limitedBy: limit });
    expect(report.goods.revenueMilli).toBe(served);
    expect(report.after.gold).toBe(report.before.gold + report.taxMilli + served - 2000);
  });
  it('keeps production independent of demand and capacity, bounded by Wood and whole workers', () => {
    const s = workshop(); const b = s.tiles.find(t => t.id === 'plain-3')!.building!; b.level = 3; b.workers = 3;
    s.society!.classes.free -= 10; s.society!.classes.makers.common += 10;
    stocks(s).wood = 5999; stocks(s).iron = 0;
    const r = end(s);
    expect(r.report!.goodsStock).toMatchObject({ producedMilli: 4000, distributedMilli: 1550, closingMilli: 12450 });
    expect(stocks(r.nextState).wood).toBe(1999);
  });
  it('retains the no-production/no-revenue convention for zero demand', () => {
    const s = workshop(); makersOnly(s, 0);
    for (const t of s.tiles) if (t.building) t.building.workers = 0;
    const r = end(s);
    expect(r.report).toMatchObject({ goodsStock: { producedMilli: 0, distributedMilli: 0, closingMilli: 10000, limitedBy: 'none' }, goods: { fulfillmentBps: 10000, revenueMilli: 0 } });
  });
  it('rejects stock overflow atomically', () => {
    const s = workshop(); s.goodsStock!.amountMilli = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(s);
    expect(executeTileTrialCommand(s, { type: 'END_WEEK', expectedRevision: s.revision, expectedWeek: s.world.week }))
      .toMatchObject({ success: false, error: { code: 'EXECUTION_ERROR' } });
    expect(s).toEqual(before);
  });
  it('does not grant stored stock sustainable target or useful-work bonuses', () => {
    let s = workshop(); s = command(s, 'BUILD', { tileId: 'forest-1', typeId: 'logging' }).nextState;
    const facts: ImmigrationFacts = { fundedTileIds: ['field-1', 'plain-1', 'forest-1', 'plain-3', 'spec-1'], farmBatches: 3, processorBatches: 3, woodProducedMilli: 2000, ironProducedMilli: 0, operatingDebitMilli: 3500, foodDemandMilli: 4000, foodConsumedMilli: 4000, unpaidUpkeepMilli: 0 };
    s.goodsStock!.amountMilli = 0; const empty = resolveTrialImmigration(s, facts);
    s.goodsStock!.amountMilli = 10000; const stocked = resolveTrialImmigration(s, facts);
    expect(stocked).toEqual(empty); expect(stocked.usefulWorkerSlots).toBe(13); expect(stocked.reason).not.toBe('target-unfunded');
    stocks(s).gold = 0; expect(resolveTrialImmigration(s, facts).reason).toBe('liquidity');
    stocks(s).gold = 2000; expect(resolveTrialImmigration(s, facts).reason).toBe('arrivals');
  });
  it('projects detached stock flow without assigning manager buffs', () => {
    const r = createCharacterLifeSession(42, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
    if (!r.success) throw Error('Factory failed');
    expect(observeCharacterLife(r.value, null).freeManagerSlots).toHaveLength(3);
    const next = executeCharacterLifeCommand(r.value, { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 });
    if (!next.success) throw Error(next.error.message);
    const observation = observeCharacterLife(next.next, next.report!);
    expect(observation.lastReport!.goodsStock).toEqual(next.report!.goodsStock);
    expect(observation.settlement.goodsStock).toEqual({ rulesetId: GOODS_STOCK_RULESET, amountMilli: 8550 });
    expect(observation.lastReport!.goodsStock).not.toBe(next.report!.goodsStock);
    expect(next.next.npcs).toEqual(r.value.npcs);
  });
});

it('upgrades and replaces at full cost without refunds while preserving placement rules', () => {
  let s = command(createSocietyState(), 'BUILD', { tileId: 'forest-1', typeId: 'logging' }).nextState;
  const gold = stocks(s).gold;
  s = command(s, 'UPGRADE', { tileId: 'forest-1' }).nextState;
  expect(s.tiles.find(t => t.id === 'forest-1')!.building!.level).toBe(2);
  expect(stocks(s).gold).toBe(gold - 4000);
  const before = structuredClone(s);
  expect(executeTileTrialCommand(s, { type: 'REPLACE', tileId: 'forest-1', typeId: 'mine', expectedRevision: s.revision }).success).toBe(false);
  expect(s).toEqual(before);
  const opening = stocks(s).gold;
  s = command(s, 'REPLACE', { tileId: 'forest-1', typeId: 'logging' }).nextState;
  expect(stocks(s).gold).toBe(opening - 2000);
  expect(s.tiles.find(t => t.id === 'forest-1')!.building).toMatchObject({ typeId: 'logging', level: 1, workers: 0 });
});
it('pausing releases workers and disallows assignment until resumed', () => {
  let s = command(createSocietyState(), 'BUILD', { tileId: 'forest-1', typeId: 'logging' }).nextState;
  s = command(s, 'SET_WORKERS', { tileId: 'forest-1', workers: 2 }).nextState;
  s = command(s, 'SET_ENABLED', { tileId: 'forest-1', enabled: false }).nextState;
  expect(s.tiles.find(t => t.id === 'forest-1')!.building!.workers).toBe(0);
  const before = structuredClone(s);
  expect(executeTileTrialCommand(s, { type: 'SET_WORKERS', tileId: 'forest-1', workers: 1, expectedRevision: s.revision }).success).toBe(false);
  expect(s).toEqual(before);
});
it('reports unfunded buildings without negative stocks and recovers by pausing', () => {
  let s = command(createSocietyState(), 'BUILD', { tileId: 'forest-1', typeId: 'logging' }).nextState;
  s.tiles.find(t => t.id === 'forest-1')!.building!.level = 3;
  stocks(s).gold = 0;
  const r = end(s);
  expect(r.report!.unpaidUpkeepMilli).toBeGreaterThan(0);
  expect(r.report!.after.gold).toBeGreaterThanOrEqual(0);
  s = command(r.nextState, 'NEXT_WEEK').nextState;
  for (const t of s.tiles) if (t.building) s = command(s, 'SET_ENABLED', { tileId: t.id, enabled: false }).nextState;
  expect(end(s).report!.after.gold).toBeGreaterThanOrEqual(3000);
});

it('Market upgrades do not change demand or double multiply revenue', () => {
  let s = command(end(createSocietyState()).nextState, 'NEXT_WEEK').nextState;
  s = command(s, 'UPGRADE', { tileId: 'spec-1' }).nextState;
  const report = end(s).report!;
  expect(report.goods.demandMilli).toBe(1450);
  expect(report.goods.revenueMilli).toBe(1450);
});
it('extracts before Goods processing and charges each input once regardless of tile order', () => {
  let s = workshop();
  s = command(s, 'BUILD', { tileId: 'forest-1', typeId: 'logging' }).nextState;
  s = command(s, 'SET_WORKERS', { tileId: 'forest-1', workers: 2 }).nextState;
  stocks(s).wood = 0;
  const before = structuredClone(s), r = end(s);
  const reordered = structuredClone(s);
  reordered.tiles = [reordered.tiles.find(t => t.id === 'plain-3')!, ...reordered.tiles.filter(t => t.id !== 'plain-3')];
  const replay = end(reordered);
  expect(s).toEqual(before);
  expect(r.report!.goodsStock).toMatchObject({ producedMilli: 2000, distributedMilli: 1450, closingMilli: 10550 });
  expect(r.report!.goods).toMatchObject({ woodUsed: 2000, ironUsed: 0 });
  expect(stocks(r.nextState).wood).toBe(2000);
  expect(replay.report!.goodsStock).toEqual(r.report!.goodsStock);
  expect(stocks(replay.nextState)).toEqual(stocks(r.nextState));
});
