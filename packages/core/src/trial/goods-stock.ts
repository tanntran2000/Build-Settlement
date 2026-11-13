import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateTuning } from '../data/validate.js';
export const GOODS_STOCK_RULESET = 'tile-population-goods-01';
// Reversible IMPLEMENTATION TRIAL values, not owner-selected balance.
export const GOODS_STOCK_TRIAL = deepFreeze(validateTuning(tuningJson).GOODS_STOCK_TRIAL);
export interface GoodsStock { rulesetId: typeof GOODS_STOCK_RULESET; amountMilli: number }
