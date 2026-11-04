import { standingAuthorityTerm } from './crime.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';

export interface OrderState { security: number; crime: number; authority: number }
export interface OrderFacts {
 standing: number;
 wallRing: 1|2|3; watchHouses: { level: 1|2; slum: boolean }[]; barracksWorkers: number;
 population: number; slumOther: number; corruption: number; desperation: number; tension: number;
 meanSatisfaction: number; townHallStaffed: boolean; patrols: boolean; drill: boolean;
}
// Reversible TRIAL values from the approved P8-A spec, sections 3–6.
export const ORDER_TRIAL = Object.freeze({
 newGame: Object.freeze({ security: 30, crime: 10, authority: 50 }),
 drift: Object.freeze({ security: 5, crime: 5, authority: 3 }),
 security: Object.freeze({ base: 10, perWallRing: 5, watchHouseByLevel: Object.freeze([10,15]), slumWatchHouseBonus: 5, patrolsNumerator: 3, patrolsDenominator: 2, barracksPerWorker: 2, drilledPerWorker: 3, residentsPerPoint: 20, slumPenalty: 3, darkPenalty: 5 }),
 crime: Object.freeze({ base: 10, perSlum: 5, desperationDivisor: 5, dark: 10, light: -5, securityDivisor: 2 }),
 authority: Object.freeze({ base: 40, securityDivisor: 5, crimeDivisor: 4, townHall: 10, satisfactionDivisor: 5, tensionDivisor: 10 }),
 theft: Object.freeze({ threshold: 20, bpsPerPoint: 10 }), tensionDivisor: 25,
 satisfactionLoss: Object.freeze([Object.freeze({ crime: 70, loss: 2 }), Object.freeze({ crime: 40, loss: 1 })]),
 tax: Object.freeze({ bpsPerPoint: 40 }), immigration: Object.freeze({ halveBelow: 30, bonusAtOrAbove: 70 }),
 bands: Object.freeze({ lowMax: 33, fairMax: 66 }),
});
const clamp = (n: bigint): number => Number(n < 0n ? 0n : n > 100n ? 100n : n);
export function securityTarget(f: OrderFacts): number {
 const b = ORDER_TRIAL.security;
 let target = BigInt(b.base) + BigInt(b.perWallRing)*BigInt(f.wallRing);
 for (const house of f.watchHouses) {
  const level = BigInt(b.watchHouseByLevel[house.level-1]);
  target += f.patrols ? level*BigInt(b.patrolsNumerator)/BigInt(b.patrolsDenominator) : level;
  if (house.slum) target += BigInt(b.slumWatchHouseBonus);
 }
 target += BigInt(f.barracksWorkers)*BigInt(f.drill ? b.drilledPerWorker : b.barracksPerWorker);
 target -= BigInt(f.population)/BigInt(b.residentsPerPoint) + BigInt(f.slumOther)*BigInt(b.slumPenalty);
 if (f.corruption > 60) target -= BigInt(b.darkPenalty);
 return clamp(target);
}
export function crimeTarget(f: OrderFacts, security: number): number {
 const b = ORDER_TRIAL.crime;
 return clamp(BigInt(b.base) + BigInt(f.slumOther)*BigInt(b.perSlum) + BigInt(f.desperation)/BigInt(b.desperationDivisor) + BigInt(f.corruption > 60 ? b.dark : f.corruption < 40 ? b.light : 0) - BigInt(security)/BigInt(b.securityDivisor));
}
export function authorityTarget(f: OrderFacts, security: number, crime: number): number {
 const b = ORDER_TRIAL.authority;
 return clamp(BigInt(b.base) + BigInt(standingAuthorityTerm(f.standing)) + (BigInt(security)-50n)/BigInt(b.securityDivisor) - BigInt(crime)/BigInt(b.crimeDivisor) + BigInt(f.townHallStaffed ? b.townHall : 0) + (BigInt(f.meanSatisfaction)-50n)/BigInt(b.satisfactionDivisor) - BigInt(f.tension)/BigInt(b.tensionDivisor));
}
export function driftToward(value: number, target: number, step: number): number {
 return value + Math.max(-step, Math.min(step, target-value));
}
export function orderBand(value: number): 'Low'|'Fair'|'High' {
 return value <= ORDER_TRIAL.bands.lowMax ? 'Low' : value <= ORDER_TRIAL.bands.fairMax ? 'Fair' : 'High';
}
export function isOrderState(raw: unknown): raw is OrderState {
 return hasWeeklyKeys(raw,['security','crime','authority']) && Object.values(raw).every(n => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= 100);
}
