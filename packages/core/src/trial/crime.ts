import tuningJson from '../data/tuning.json';
import { deepFreeze, validateTuning } from '../data/validate.js';
import type { TileTrialState } from './types.js';
import { createSeededRandom } from '../world/random.js';

export const CRIME_TRIAL = deepFreeze(validateTuning(tuningJson).CRIME_TRIAL);
export function crimeChancePercent(crime: number, idleWatchHouse = false): number { return CRIME_TRIAL.baseChance + Math.trunc(crime / 2) + (idleWatchHouse ? CRIME_TRIAL.idleWatchHouse : 0); }
export function crimeSeverity(crime: number): 'minor' | 'serious' | 'severe' {
 return crime <= CRIME_TRIAL.bands.minorMax ? 'minor' : crime <= CRIME_TRIAL.bands.seriousMax ? 'serious' : 'severe';
}
export function mixSeed(seed: number, week: number): number {
 return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(week + 1, 0xc2b2ae35)) >>> 0;
}
export function crimeRandom(seed: number, week: number): () => number { return createSeededRandom(mixSeed(seed, week)); }
export function standingAuthorityTerm(standing: number): number { return Math.trunc((standing - CRIME_TRIAL.standing.newGame) / CRIME_TRIAL.standing.authorityDivisor) || 0; }

export function idleWatchHouse(state: TileTrialState, operatingIds?: ReadonlySet<string>): boolean {
 return state.tiles.some(t => t.building?.typeId === 'watch-house' && (!t.building.enabled || t.building.workers === 0 || (operatingIds !== undefined && !operatingIds.has(t.id))));
}
