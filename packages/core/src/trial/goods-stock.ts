import { SOCIETY_RULESET } from './society.js';
import { LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type TileTrialRuleset } from './catalog.js';
import { createTileTrialState, isTileTrialState } from './state.js';
import type { TileTrialState } from './types.js';

export const GOODS_STOCK_RULESET = 'tile-population-goods-01';
// Reversible IMPLEMENTATION TRIAL values, not owner-selected balance.
export const GOODS_STOCK_TRIAL = Object.freeze({
  initialFoodMilli: 20000, initialGoodsMilli: 10000, initialGoldMilli: 45000,
  woodPerBatchMilli: 2000, goodsPerBatchMilli: 2000,
  demandPerResidentMilli: 20, capacityPerLevelMilli: 2000, goldPerGoodsMilli: 1000,
});
export interface GoodsStock { rulesetId: typeof GOODS_STOCK_RULESET; amountMilli: number }
export type CityEconomyRuleset = TileTrialRuleset | typeof GOODS_STOCK_RULESET | typeof SOCIETY_RULESET;

export function cityEconomyRuleset(state: TileTrialState, family: TileTrialRuleset): CityEconomyRuleset | null {
  if (!isTileTrialState(state)) return null;
  if (family === LEGACY_TILE_RULESET) return state.goodsStock ? null : LEGACY_TILE_RULESET;
  if (family === POPULATION_TILE_RULESET) return state.society ? SOCIETY_RULESET : state.goodsStock ? GOODS_STOCK_RULESET : POPULATION_TILE_RULESET;
  return null;
}

export function createGoodsStockState(): TileTrialState {
  const state = createTileTrialState();
  const inventory = state.world.settlements[state.world.activeSettlementId!].inventory;
  inventory.food = GOODS_STOCK_TRIAL.initialFoodMilli;
  inventory.gold = GOODS_STOCK_TRIAL.initialGoldMilli;
  state.goodsStock = { rulesetId: GOODS_STOCK_RULESET, amountMilli: GOODS_STOCK_TRIAL.initialGoodsMilli };
  state.tiles.find(t => t.id === 'plain-2')!.building = { typeId: 'market', level: 1, workers: 0, enabled: true };
  return state;
}
