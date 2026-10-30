import { describe, expect, it } from 'vitest';
import { createGoodsStockState, createTileTrialState, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET, LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { observeCharacterLife } from '../character-life-observation.js';
import { resolveTrialImmigration, type ImmigrationFacts } from '../tile-trial-immigration.js';

const stocks = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].inventory;
const cohort = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].cohorts[0];
function command(s: TileTrialState, type: string, fields: Record<string, unknown> = {}) {
  const r = executeTileTrialCommand(s, { type, expectedRevision: s.revision, ...fields }, POPULATION_TILE_RULESET);
  if (!r.success) throw Error(r.error.message); return r;
}
const end = (s: TileTrialState) => command(s, 'END_WEEK', { expectedWeek: s.world.week });
function workshop() {
  let s = createGoodsStockState();
  s = command(s, 'BUILD', { tileId: 'plain-3', typeId: 'workshop' }).nextState;
  return command(s, 'SET_WORKERS', { tileId: 'plain-3', workers: 1 }).nextState;
}
describe('stored Goods weekly flow', () => {
  it('proves five default weeks, fixed population, normal upkeep, no hidden grants', () => {
    let s = createGoodsStockState(), debit = 0;
    for (let week = 1; week <= 5; week++) {
      const before = structuredClone(s), r = end(s), report = r.report!;
      expect(s).toEqual(before); expect(end(s)).toEqual(r);
      expect(report.goodsStock).toEqual({ openingMilli: 12000 - 2000 * week, producedMilli: 0, distributedMilli: 2000, closingMilli: 10000 - 2000 * week, demandMilli: 2000, unmetMilli: 0, capacityMilli: 2000, limitedBy: 'none' });
      expect(report).toMatchObject({ unpaidUpkeepMilli: 0, foodDemandMilli: 4000, foodConsumedMilli: 4000, goods: { servedMilli: 2000, revenueMilli: 2000, ironUsed: 0 }, immigration: { populationBefore: 100, populationAfter: 100, target: 90, reason: 'no-capacity' } });
      expect(stocks(r.nextState)).toMatchObject({ food: 20000, gold: 45000 + 2000 * week });
      debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;
      s = command(r.nextState, 'NEXT_WEEK').nextState;
    }
    expect(debit).toBe(15000); expect(s.goodsStock!.amountMilli).toBe(0);
  });
  it('proves five stock-only weeks without relying on production or income; week six is short', () => {
    let s = createGoodsStockState(), debit = 0;
    for (const tileId of ['field-1', 'plain-1']) s = command(s, 'SET_WORKERS', { tileId, workers: 0 }).nextState;
    for (let week = 1; week <= 5; week++) {
      const r = end(s), report = r.report!;
      expect(report.foodConsumedMilli).toBe(4000); expect(report.goods.servedMilli).toBe(2000); expect(report.unpaidUpkeepMilli).toBe(0);
      debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;
      expect(stocks(r.nextState).food).toBe(20000 - 4000 * week);
      expect(r.nextState.goodsStock!.amountMilli).toBe(10000 - 2000 * week);
      s = command(r.nextState, 'NEXT_WEEK').nextState;
    }
    expect(debit).toBe(10000); expect(debit).toBeLessThanOrEqual(15000);
    expect(end(s).report).toMatchObject({ foodConsumedMilli: 0, goods: { servedMilli: 0 }, goodsStock: { unmetMilli: 2000, limitedBy: 'stock' } });
  });
  it.each(['missing', 'disabled', 'unfunded'])('produces and carries stock without a %s Market; no production revenue', kind => {
    let s = workshop(); const market = s.tiles.find(t => t.id === 'plain-2')!;
    s.goodsStock!.amountMilli = 0; stocks(s).iron = 0;
    if (kind === 'missing') market.building = null;
    if (kind === 'disabled') market.building!.enabled = false;
    if (kind === 'unfunded') {
      // Fund Workshop before the ordinary Market, with only 0.5 Gold after tax.
      s.tiles = [s.tiles.find(t => t.id === 'plain-3')!, ...s.tiles.filter(t => t.id !== 'plain-3')];
      for (const t of s.tiles) if (t.building && ['farm', 'processor'].includes(t.building.typeId)) { t.building.enabled = false; t.building.workers = 0; }
      cohort(s).count = 10; stocks(s).gold = 200;
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
    const s = createGoodsStockState(); s.goodsStock!.amountMilli = amount; cohort(s).count = population;
    for (const t of s.tiles) if (t.building) t.building.workers = 0;
    const r = end(s), report = r.report!;
    expect(report.goodsStock).toMatchObject({ distributedMilli: served, closingMilli: amount - served, unmetMilli: population * 20 - served, limitedBy: limit });
    expect(report.goods.revenueMilli).toBe(served);
    expect(report.after.gold).toBe(report.before.gold + report.taxMilli + served - 2000);
  });
  it('keeps production independent of demand and Market capacity, bounded by Wood/funded whole workers', () => {
    const s = workshop(); const b = s.tiles.find(t => t.id === 'plain-3')!.building!; b.level = 3; b.workers = 3;
    stocks(s).wood = 5999; stocks(s).iron = 0;
    const r = end(s);
    expect(r.report!.goodsStock).toMatchObject({ producedMilli: 4000, distributedMilli: 2000, closingMilli: 12000 });
    expect(stocks(r.nextState).wood).toBe(1999);
  });
  it('retains the no-production/no-revenue convention for zero demand', () => {
    const s = workshop(); cohort(s).count = 0;
    for (const t of s.tiles) if (t.building) t.building.workers = 0;
    const r = end(s);
    expect(r.report).toMatchObject({ goodsStock: { producedMilli: 0, distributedMilli: 0, closingMilli: 10000, limitedBy: 'none' }, goods: { fulfillmentBps: 10000, revenueMilli: 0 } });
  });
  it('rejects stock overflow atomically, plus incompatible family/LOAD markers', () => {
    const s = workshop(); s.goodsStock!.amountMilli = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(s);
    expect(executeTileTrialCommand(s, { type: 'END_WEEK', expectedRevision: s.revision, expectedWeek: s.world.week }, POPULATION_TILE_RULESET)).toMatchObject({ success: false, error: { code: 'EXECUTION_ERROR' } });
    expect(s).toEqual(before);
    expect(executeTileTrialCommand(s, {}, LEGACY_TILE_RULESET)).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
    const old = createTileTrialState();
    for (const goodsStock of [{ rulesetId: 'future', amountMilli: 0 }, { rulesetId: GOODS_STOCK_RULESET, amountMilli: -1 }, undefined]) {
      expect(executeTileTrialCommand(old, { type: 'LOAD_TRIAL', expectedRevision: 0, snapshot: { ...old, goodsStock } }, POPULATION_TILE_RULESET)).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
    }
    expect(executeTileTrialCommand(old, { type: 'LOAD_TRIAL', expectedRevision: 0, snapshot: createGoodsStockState() }, LEGACY_TILE_RULESET)).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
    expect(command(old, 'LOAD_TRIAL', { snapshot: createGoodsStockState() }).nextState.goodsStock).toBeDefined();
    expect(command(createGoodsStockState(), 'LOAD_TRIAL', { snapshot: old }).nextState.goodsStock).toBeUndefined();
  });
  it('does not grant stored stock any sustainable target or useful-work bonus', () => {
    let s = workshop();
    s = command(s, 'BUILD', { tileId: 'forest-1', typeId: 'logging' }).nextState;
    const facts: ImmigrationFacts = { fundedTileIds: ['field-1', 'plain-1', 'forest-1', 'plain-3', 'plain-2'], farmBatches: 3, processorBatches: 3, woodProducedMilli: 2000, ironProducedMilli: 0, operatingDebitMilli: 3500, foodDemandMilli: 4000, foodConsumedMilli: 4000, unpaidUpkeepMilli: 0 };
    s.goodsStock!.amountMilli = 0; const empty = resolveTrialImmigration(s, facts);
    s.goodsStock!.amountMilli = 10000; const stocked = resolveTrialImmigration(s, facts);
    expect(stocked).toEqual(empty); expect(stocked.usefulWorkerSlots).toBe(13); expect(stocked.reason).not.toBe('target-unfunded');
    const old = structuredClone(s); delete old.goodsStock;
    expect(resolveTrialImmigration(old, facts).usefulWorkerSlots).toBe(12);
    // Only actual Gold participates in the unchanged cash-on-hand gate.
    stocks(s).gold = 0; expect(resolveTrialImmigration(s, facts).reason).toBe('liquidity');
    stocks(s).gold = 2000; expect(resolveTrialImmigration(s, facts).reason).toBe('arrivals');
  });
  it('projects optional stock flow without altering old observations or assigning manager buffs', () => {
    const r = createCharacterLifeSession(42, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, GOODS_STOCK_RULESET);
    if (!r.success) throw Error('Factory failed');
    expect(observeCharacterLife(r.value, null).freeManagerSlots).toHaveLength(3);
    const next = executeCharacterLifeCommand(r.value, { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 });
    if (!next.success) throw Error(next.error.message);
    const observation = observeCharacterLife(next.next, next.report!);
    expect(observation.lastReport!.goodsStock).toEqual(next.report!.goodsStock);
    expect(observation.settlement.goodsStock).toEqual({ rulesetId: GOODS_STOCK_RULESET, amountMilli: 8000 });
    expect(observation.lastReport!.goodsStock).not.toBe(next.report!.goodsStock);
    expect(next.next.npcs).toEqual(r.value.npcs);
  });
});
