import { createSeededRandom } from '../world/random.js';

export const CRIME_TRIAL = Object.freeze({
 baseChance: 5,
 bands: Object.freeze({ minorMax: 33, seriousMax: 66 }),
 weights: Object.freeze({ robbery: 4, smear: 3, raid: 2, assassination: 1 }),
 assassinationMinCrime: 70,
 robberyBps: Object.freeze({ minor: 500, serious: 1000, severe: 2000 }),
 smear: Object.freeze({ minor: 3, serious: 6, severe: 10 }),
 raidDeaths: Object.freeze({ minor: 1, serious: 2, severe: 3 }),
 fatal: Object.freeze({ minCrime: 90, maxSecurity: 30, chance: 0.5 }),
 wound: Object.freeze({ health: 20, standing: 5, authority: 5 }),
 standing: Object.freeze({ newGame: 50, drift: 1, authorityDivisor: 5 }),
});
export function crimeChancePercent(crime: number): number { return CRIME_TRIAL.baseChance + Math.trunc(crime / 2); }
export function crimeSeverity(crime: number): 'minor' | 'serious' | 'severe' {
 return crime <= CRIME_TRIAL.bands.minorMax ? 'minor' : crime <= CRIME_TRIAL.bands.seriousMax ? 'serious' : 'severe';
}
export function mixSeed(seed: number, week: number): number {
 return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(week + 1, 0xc2b2ae35)) >>> 0;
}
export function crimeRandom(seed: number, week: number): () => number { return createSeededRandom(mixSeed(seed, week)); }
export function standingAuthorityTerm(standing: number): number { return Math.trunc((standing - CRIME_TRIAL.standing.newGame) / CRIME_TRIAL.standing.authorityDivisor) || 0; }
