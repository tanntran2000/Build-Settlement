import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { createGoodsStockState } from './goods-stock.js';
import type { TileTrialState } from './types.js';

export const SOCIETY_RULESET = 'tile-society-01';
export type SocietyGroupKey = 'makers' | 'luminaries' | 'merchants';
export type SocietyClassKey = 'free' | SocietyGroupKey;
export interface SocietyState {
  rulesetId: typeof SOCIETY_RULESET;
  classes: { free: number; makers: { common: number; elite: number }; luminaries: { common: number; elite: number }; merchants: { common: number; elite: number }; bound: Record<SocietyClassKey, number> };
  satisfaction: Record<SocietyClassKey | 'bound', number>;
  desperation: number;
  tension: number;
  debtPressure: Record<SocietyClassKey, number>;
  corruption: number;
  luxuryStockMilli: number;
  training: { target: SocietyGroupKey | null; progressMilli: number };
  wallRing: 1 | 2 | 3;
}
// Reversible TRIAL starting values from the approved society spec.
export const SOCIETY_TRIAL = Object.freeze({
  rulesetId: SOCIETY_RULESET,
  classes: Object.freeze({ free: 55, makers: Object.freeze({ common: 20, elite: 0 }), luminaries: Object.freeze({ common: 12, elite: 0 }), merchants: Object.freeze({ common: 13, elite: 0 }), bound: Object.freeze({ free: 0, makers: 0, luminaries: 0, merchants: 0 }) }),
  satisfaction: Object.freeze({ free: 80, makers: 80, luminaries: 80, merchants: 80, bound: 80 }),
  desperation: 0, tension: 0, debtPressure: Object.freeze({ free: 0, makers: 0, luminaries: 0, merchants: 0 }),
  corruption: 50, luxuryStockMilli: 0, training: Object.freeze({ target: null, progressMilli: 0 }), wallRing: 1,
} as const);
const groups = ['makers', 'luminaries', 'merchants'] as const;
const classes = ['free', ...groups] as const;
const count = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const score = (n: unknown): n is number => count(n) && n <= 100;

export function createSocietyState(): TileTrialState {
  return { ...createGoodsStockState(), society: structuredClone(SOCIETY_TRIAL) };
}
export function isSocietyState(raw: unknown): raw is SocietyState {
  try {
    if (!hasWeeklyKeys(raw, ['rulesetId', 'classes', 'satisfaction', 'desperation', 'tension', 'debtPressure', 'corruption', 'luxuryStockMilli', 'training', 'wallRing']) || raw.rulesetId !== SOCIETY_RULESET ||
        !hasWeeklyKeys(raw.classes, [...classes, 'bound']) || !count(raw.classes.free) ||
        !hasWeeklyKeys(raw.classes.bound, classes) || !Object.values(raw.classes.bound).every(count)) return false;
    for (const group of groups) {
      const tier = raw.classes[group];
      if (!hasWeeklyKeys(tier, ['common', 'elite']) || !count(tier.common) || !count(tier.elite)) return false;
    }
    return hasWeeklyKeys(raw.satisfaction, [...classes, 'bound']) && Object.values(raw.satisfaction).every(score) &&
      hasWeeklyKeys(raw.debtPressure, classes) && Object.values(raw.debtPressure).every(score) &&
      score(raw.desperation) && score(raw.tension) && score(raw.corruption) && count(raw.luxuryStockMilli) &&
      hasWeeklyKeys(raw.training, ['target', 'progressMilli']) &&
      (raw.training.target === null || groups.some(group => group === raw.training.target)) && count(raw.training.progressMilli) &&
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
