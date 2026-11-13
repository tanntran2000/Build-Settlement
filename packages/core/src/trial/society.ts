import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateTuning } from '../data/validate.js';
import { isLawsState, type LawsState } from './law.js';
import { isCrisisState, type CrisisState } from './crisis.js';
import type { PendingCard } from './event-card.js';
import { isOrderState, type OrderState } from './order.js';
import { isOutsideState, isOutsideResearch, OUTSIDE_PLOTS, type OutsidePlotState, type OutsideResearch } from './outside.js';
import { TILE_TRIAL_BALANCE as B } from './catalog.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { GOODS_STOCK_RULESET,GOODS_STOCK_TRIAL } from './goods-stock.js';
import type { TileTrialState } from './types.js';
import { createItemsState, isItemsState, type ItemsState } from './items.js';

export const SOCIETY_RULESET = 'tile-society-08';
export type SocietyGroupKey = 'makers' | 'luminaries' | 'merchants';
export type SocietyClassKey = 'free' | SocietyGroupKey;
export interface SocietyState {
  items: ItemsState;
  rulesetId: typeof SOCIETY_RULESET;
  standing: number;
  laws: LawsState;
  order: OrderState;
  crisis: CrisisState;
  pendingCard: PendingCard | null;
  classes: { free: number; makers: { common: number; elite: number }; luminaries: { common: number; elite: number }; merchants: { common: number; elite: number }; bound: Record<SocietyClassKey, number> };
  satisfaction: Record<SocietyClassKey | 'bound', number>;
  desperation: number;
  tension: number;
  debtPressure: Record<SocietyClassKey, number>;
  corruption: number;
  luxuryStockMilli: number;
  training: { target: SocietyGroupKey | null; progressMilli: number };
  wallRing: 1 | 2 | 3;
  stocksMilli: { stone:number; wool:number; cloth:number; herbs:number };
  outside: Record<string,OutsidePlotState>;
  research: OutsideResearch;
}
// Reversible TRIAL starting values from the approved society spec.
export const SOCIETY_TRIAL = deepFreeze(validateTuning(tuningJson).SOCIETY_TRIAL);
const groups = ['makers', 'luminaries', 'merchants'] as const;
const classes = ['free', ...groups] as const;
const count = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const score = (n: unknown): n is number => count(n) && n <= 100;

export function createSocietyState(): TileTrialState {
  const state: TileTrialState = {
    world: {"week":1,"worldMetadata":{"worldSeed":2026,"gameVersion":"0.1.0"},"activeSettlementId":"settlement_haven_01","settlements":{"settlement_haven_01":{"id":"settlement_haven_01","name":"Haven","status":"active","foodProcessorOperational":true,"inventory":{"gold":GOODS_STOCK_TRIAL.initialGoldMilli,"wheat":0,"food":GOODS_STOCK_TRIAL.initialFoodMilli,"wood":B.initialWoodMilli,"iron":B.initialIronMilli},"cohorts":[{"id":"weekly_middle","occupation":"worker","socialClass":"common","legalStatus":"citizen","count":100,"averageHealth":80,"morale":80,"productivity":80,"resentment":0,"loyalty":80,"livingStandard":"decent"}]}}},
    revision: 0, phase: 'planning',
    tiles: [{"id":"field-1","terrain":"fertile","building":{"typeId":"farm","level":1,"workers":2,"enabled":true}},{"id":"plain-1","terrain":"plain","building":{"typeId":"processor","level":1,"workers":2,"enabled":true}},{"id":"forest-1","terrain":"forest","building":null},{"id":"ore-1","terrain":"ore","building":null},{"id":"plain-2","terrain":"plain","building":null},{"id":"plain-3","terrain":"plain","building":null},{"id":"forest-2","terrain":"forest","building":null},{"id":"ore-2","terrain":"ore","building":null},{"id":"field-2","terrain":"fertile","building":null},{"id":"plain-4","terrain":"plain","building":null},{"id":"house-1","terrain":"town","building":{"typeId":"common-housing","level":3,"workers":0,"enabled":true}},{"id":"house-2","terrain":"town","building":{"typeId":"makers-rowhouses","level":2,"workers":0,"enabled":true}},{"id":"house-3","terrain":"town","building":{"typeId":"scholars-quarters","level":2,"workers":0,"enabled":true}},{"id":"house-4","terrain":"town","building":{"typeId":"merchant-townhouses","level":1,"workers":0,"enabled":true}},{"id":"house-5","terrain":"town","building":null},{"id":"house-6","terrain":"town","building":null},{"id":"house-7","terrain":"town","building":null},{"id":"house-8","terrain":"town","building":null},{"id":"house-9","terrain":"town","building":null},{"id":"house-10","terrain":"town","building":null},{"id":"house-11","terrain":"town","building":null},{"id":"service-1","terrain":"town","building":null},{"id":"service-2","terrain":"town","building":null},{"id":"service-3","terrain":"town","building":null},{"id":"service-4","terrain":"town","building":null},{"id":"service-5","terrain":"town","building":null},{"id":"service-6","terrain":"town","building":null},{"id":"spec-1","terrain":"town","building":{"typeId":"town-market","level":1,"workers":0,"enabled":true}},{"id":"spec-2","terrain":"town","building":null},{"id":"spec-3","terrain":"town","building":null},{"id":"spec-4","terrain":"town","building":null},{"id":"spec-5","terrain":"town","building":null},{"id":"spec-6","terrain":"town","building":null},{"id":"spec-7","terrain":"town","building":null},{"id":"spec-8","terrain":"town","building":null},{"id":"spec-9","terrain":"town","building":null},{"id":"spec-10","terrain":"town","building":null},{"id":"slum-1","terrain":"town","building":null},{"id":"slum-2","terrain":"town","building":null},{"id":"slum-3","terrain":"town","building":null},{"id":"slum-4","terrain":"town","building":null},{"id":"slum-5","terrain":"town","building":null},{"id":"slum-6","terrain":"town","building":null}],
    happiness: B.initialHappiness,
    goodsStock: { rulesetId: GOODS_STOCK_RULESET, amountMilli: GOODS_STOCK_TRIAL.initialGoodsMilli },
    society: { ...structuredClone(SOCIETY_TRIAL), items:createItemsState(2026) },
  };
  state.tiles.splice(10,0,...OUTSIDE_PLOTS.slice(10).map(p=>({id:p.id,terrain:p.terrain,building:null})));
  return state;
}
export function isSocietyState(raw: unknown): raw is SocietyState {
  try {
    if (!hasWeeklyKeys(raw, ['rulesetId', 'standing', 'laws', 'crisis', 'pendingCard', 'order', 'classes', 'satisfaction', 'desperation', 'tension', 'debtPressure', 'corruption', 'luxuryStockMilli', 'training', 'wallRing', 'stocksMilli', 'outside', 'research','items']) || raw.rulesetId !== SOCIETY_RULESET || !isLawsState(raw.laws) ||
        !hasWeeklyKeys(raw.classes, [...classes, 'bound']) || !count(raw.classes.free) ||
        !hasWeeklyKeys(raw.classes.bound, classes) || !Object.values(raw.classes.bound).every(count)) return false;
    for (const group of groups) {
      const tier = raw.classes[group];
      if (!hasWeeklyKeys(tier, ['common', 'elite']) || !count(tier.common) || !count(tier.elite)) return false;
    }
    return hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals']) &&
      raw.items.equipped!==null && typeof raw.items.equipped==='object' && isItemsState(raw.items,['player',...Object.keys(raw.items.equipped)]) &&
      hasWeeklyKeys(raw.stocksMilli,['stone','wool','cloth','herbs']) && Object.values(raw.stocksMilli).every(count) &&
      isCrisisState(raw.crisis, raw.pendingCard) && isOrderState(raw.order) && isOutsideState(raw.outside) && isOutsideResearch(raw.research) &&
      hasWeeklyKeys(raw.satisfaction, [...classes, 'bound']) && Object.values(raw.satisfaction).every(score) &&
      hasWeeklyKeys(raw.debtPressure, classes) && Object.values(raw.debtPressure).every(score) &&
      score(raw.standing) && score(raw.desperation) && score(raw.tension) && score(raw.corruption) && count(raw.luxuryStockMilli) &&
      hasWeeklyKeys(raw.training, ['target', 'progressMilli']) &&
      (raw.training.target === null || (groups as readonly unknown[]).includes(raw.training.target)) && count(raw.training.progressMilli) &&
      (raw.wallRing === 1 || raw.wallRing === 2 || raw.wallRing === 3);
  } catch { return false; }
}
export function societyPopulation(s: SocietyState): number {
  const values = [s.classes.free, ...groups.flatMap(group => [s.classes[group].common, s.classes[group].elite]), ...classes.map(key => s.classes.bound[key])];
  let total = 0;
  for (const value of values) {
    if (!count(value) || !Number.isSafeInteger(total + value)) throw Error('Unsafe society population.');
    total += value;
  }
  return total;
}
