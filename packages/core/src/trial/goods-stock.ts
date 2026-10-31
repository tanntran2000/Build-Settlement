export const GOODS_STOCK_RULESET = 'tile-population-goods-01';
// Reversible IMPLEMENTATION TRIAL values, not owner-selected balance.
export const GOODS_STOCK_TRIAL = Object.freeze({
  initialFoodMilli: 20000, initialGoodsMilli: 10000, initialGoldMilli: 45000,
  woodPerBatchMilli: 2000, goodsPerBatchMilli: 2000,
  capacityPerLevelMilli: 2000, goldPerGoodsMilli: 1000,
});
export interface GoodsStock { rulesetId: typeof GOODS_STOCK_RULESET; amountMilli: number }
