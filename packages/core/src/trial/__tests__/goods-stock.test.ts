import { describe, expect, it } from 'vitest';
import * as core from '../../index.js';

const ruleset = 'tile-population-goods-01';
describe('Goods stock version boundary', () => {
  it('exports the explicit ruleset and a new city factory', () => {
    expect(core).toHaveProperty('GOODS_STOCK_RULESET', ruleset);
    expect(core).toHaveProperty('createGoodsStockState', expect.any(Function));
  });
  it('starts with 20 Food, 10 Goods, 45 Gold and an ordinary Market', () => {
    const factory = Reflect.get(core, 'createGoodsStockState') as (() => core.TileTrialState) | undefined;
    expect(factory).toBeTypeOf('function');
    const state = factory!();
    expect(state.world.settlements[state.world.activeSettlementId!].inventory).toMatchObject({ food: 20000, gold: 45000, wood: 8000, iron: 4000, wheat: 0 });
    expect(state).toHaveProperty('goodsStock', { rulesetId: ruleset, amountMilli: 10000 });
    expect(state.tiles.find(t => t.id === 'plain-2')!.building).toEqual({ typeId: 'market', level: 1, workers: 0, enabled: true });
  });
  it('accepts exactly the new marker while keeping old states unchanged', () => {
    const old = core.createTileTrialState();
    expect(core.isTileTrialPlanningState(old)).toBe(true);
    expect(old).not.toHaveProperty('goodsStock');
    const state = { ...old, goodsStock: { rulesetId: ruleset, amountMilli: 10000 } };
    expect(core.isTileTrialState(state)).toBe(true);
    expect(core.isTileTrialPlanningState(state)).toBe(true);
    for (const goodsStock of [{ rulesetId: 'unknown', amountMilli: 0 }, { rulesetId: ruleset, amountMilli: -1 }, { rulesetId: ruleset, amountMilli: 0, extra: 1 }, undefined]) {
      expect(core.isTileTrialState({ ...old, goodsStock })).toBe(false);
    }
  });
});

it('resolves families only after strict validation, and preserves seeded outside/NPC/player data', () => {
  const old = core.createTileTrialState(), goods = core.createGoodsStockState();
  expect(core.cityEconomyRuleset(old, core.LEGACY_TILE_RULESET)).toBe(core.LEGACY_TILE_RULESET);
  expect(core.cityEconomyRuleset(old, core.POPULATION_TILE_RULESET)).toBe(core.POPULATION_TILE_RULESET);
  expect(core.cityEconomyRuleset(goods, core.POPULATION_TILE_RULESET)).toBe(core.GOODS_STOCK_RULESET);
  expect(core.cityEconomyRuleset(goods, core.LEGACY_TILE_RULESET)).toBeNull();
  for (const amountMilli of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(core.cityEconomyRuleset({ ...goods, goodsStock: { rulesetId: core.GOODS_STOCK_RULESET, amountMilli } }, core.POPULATION_TILE_RULESET)).toBeNull();
  }
  const draft = { ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' };
  for (const seed of [0, 20261028, 4294967295]) {
    const a = core.createCharacterLifeSession(seed, draft), b = core.createCharacterLifeSession(seed, draft, core.GOODS_STOCK_RULESET);
    expect(a.success && b.success).toBe(true); if (!a.success || !b.success) throw Error('Factory failed');
    expect({ ...b.value, city: a.value.city }).toEqual(a.value);
    expect(core.isCharacterLifeSessionState(b.value)).toBe(true);
    expect(core.isLiveCharacterLifeSessionState(b.value)).toBe(true);
    expect(core.managerSlotTileIds(a.value.city)).toEqual(['field-1', 'plain-1']);
    expect(core.managerSlotTileIds(b.value.city)).toEqual(['field-1', 'plain-1', 'plain-2']);
  }
});

it('rejects marker accessors, non-enumerable fields and extra keys without invoking code', () => {
  let reads = 0;
  for (const change of [
    (s: core.TileTrialState) => Object.defineProperty(s, 'goodsStock', { enumerable: true, get() { reads++; return {}; } }),
    (s: core.TileTrialState) => Object.defineProperty(s.goodsStock!, 'amountMilli', { enumerable: true, get() { reads++; return 0; } }),
    (s: core.TileTrialState) => Object.defineProperty(s.goodsStock!, 'amountMilli', { value: 0, enumerable: false }),
    (s: core.TileTrialState) => Object.assign(s.goodsStock!, { surprise: true }),
    (s: core.TileTrialState) => Object.assign(s, { rulesetId: core.GOODS_STOCK_RULESET }),
  ]) {
    const s = core.createGoodsStockState(); change(s);
    expect(core.isTileTrialState(s)).toBe(false); expect(core.isTileTrialPlanningState(s)).toBe(false);
    expect(core.cityEconomyRuleset(s, core.POPULATION_TILE_RULESET)).toBeNull();
  }
  expect(reads).toBe(0);
});
