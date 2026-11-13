import tuningJson from '../data/tuning.json';
import { deepFreeze, validateTuning } from '../data/validate.js';
import type { TileTrialState } from './types.js';
import { standingAuthorityTerm } from './crime.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';

export interface OrderState { security: number; crime: number; authority: number }
export interface OrderFacts {
 lawSecurity: number; lawCrime: number; lawAuthority: number;
 standing: number; soldiers: number;
 wallRing: 1|2|3; watchHouses: { level: 1|2; slum: boolean; workers: number }[]; barracksWorkers: number;
 population: number; slumOther: number; corruption: number; desperation: number; tension: number;
 meanSatisfaction: number; townHallStaffed: boolean; patrols: boolean; drill: boolean;
}
// Reversible TRIAL values from the approved P8-A spec, sections 3–6.
export const ORDER_TRIAL = deepFreeze(validateTuning(tuningJson).ORDER_TRIAL);
const clamp = (n: bigint): number => Number(n < 0n ? 0n : n > 100n ? 100n : n);
export function securityTarget(f: OrderFacts): number {
 const b = ORDER_TRIAL.security;
 let target = BigInt(b.base) + BigInt(b.perWallRing)*BigInt(f.wallRing);
 for (const house of f.watchHouses) {
  const level = BigInt(b.watchHouseByLevel[house.level-1]);
  const patrolled = f.patrols ? level*BigInt(b.patrolsNumerator)/BigInt(b.patrolsDenominator) : level;
  target += (patrolled + BigInt(house.slum ? b.slumWatchHouseBonus : 0))*BigInt(house.workers)/2n;
 }
 target += BigInt(f.barracksWorkers)*BigInt(f.drill ? b.drilledPerWorker : b.barracksPerWorker);
 target -= BigInt(f.population)/BigInt(b.residentsPerPoint) + BigInt(f.slumOther)*BigInt(b.slumPenalty);
 if (f.corruption > 60) target -= BigInt(b.darkPenalty);
 return clamp(target+BigInt(f.lawSecurity)+BigInt(garrisonSecurity(f.soldiers)));
}
export function crimeTarget(f: OrderFacts, security: number): number {
 const b = ORDER_TRIAL.crime;
 return clamp(BigInt(b.base) + BigInt(f.slumOther)*BigInt(b.perSlum) + BigInt(f.desperation)/BigInt(b.desperationDivisor) + BigInt(f.corruption > 60 ? b.dark : f.corruption < 40 ? b.light : 0) - BigInt(security)/BigInt(b.securityDivisor)+BigInt(f.lawCrime));
}
export function authorityTarget(f: OrderFacts, security: number, crime: number): number {
 const b = ORDER_TRIAL.authority;
 return clamp(BigInt(b.base) + BigInt(standingAuthorityTerm(f.standing)) + (BigInt(security)-50n)/BigInt(b.securityDivisor) - BigInt(crime)/BigInt(b.crimeDivisor) + BigInt(f.townHallStaffed ? b.townHall : 0) + (BigInt(f.meanSatisfaction)-50n)/BigInt(b.satisfactionDivisor) - BigInt(f.tension)/BigInt(b.tensionDivisor)+BigInt(f.lawAuthority));
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

export const GARRISON_TRIAL = deepFreeze(validateTuning(tuningJson).GARRISON_TRIAL);
export function garrisonSecurity(soldiers: number): number {
 return Math.min(GARRISON_TRIAL.cap, GARRISON_TRIAL.securityPerStep*Math.floor(soldiers/GARRISON_TRIAL.soldiersPerStep));
}
export function soldierTiles(state: TileTrialState) {
 return ['watch-house','military-barracks'].flatMap(typeId => state.tiles.filter(t => t.building?.enabled && t.building.typeId === typeId));
}
export function societySoldiers(state: TileTrialState, operatingIds?: ReadonlySet<string>): number {
 return soldierTiles(state).reduce((n,t) => n + (!operatingIds || operatingIds.has(t.id) ? t.building!.workers : 0),0);
}
