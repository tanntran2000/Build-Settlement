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
