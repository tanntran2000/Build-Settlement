import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateTuning } from '../data/validate.js';
import { applyDifficulty, difficultyProfile, type DifficultyId } from '../trial/difficulty.js';

import { mixSeed } from '../trial/crime.js';
import { createSeededRandom } from '../world/random.js';
import type { PlayerCharacter } from './types.js';

export const PURSE_TRIAL = deepFreeze(validateTuning(tuningJson).PURSE_TRIAL);

export function levySatisfactionCost(percent: number, creditedDonationGoldMilli = 0): number {
  const excessPercent = Math.max(0, percent - PURSE_TRIAL.levyFreePercent);
  const penalty = applyDifficulty(excessPercent, PURSE_TRIAL.levySatisfactionBpsPerPoint);
  const { donateSatisfactionCapPerWeek: cap, donateSatisfactionPerGoldMilli: rate } = PURSE_TRIAL;
  const offset = Math.min(cap, Math.floor(creditedDonationGoldMilli * rate));
  return Math.max(0, penalty - offset);
}

export function levyDueMilli(grossIncomeMilli: number, percent: number): number {
  return Number(BigInt(grossIncomeMilli) * BigInt(percent) / 100n);
}

export function donationGoldMilli(amountMilli: number, difficulty: DifficultyId): number {
  const { levyMoneyBps } = difficultyProfile(difficulty);
  if (amountMilli === 0 || levyMoneyBps === 10000) return amountMilli;
  return Number(BigInt(amountMilli) * 10000n / BigInt(levyMoneyBps));
}

export type HomeRobberyOption = 'pay' | 'chase' | 'let-go';

const homeRobberySalts = { 'home-robbery': 0x48524f42, 'home-robbery-chase': 0x48524348 } as const;

export function homeRobberyRoll(seed: number, week: number, stream: keyof typeof homeRobberySalts): number {
  return createSeededRandom(mixSeed(mixSeed(seed, week), homeRobberySalts[stream]))() * 10000;
}

export function safeAmountMilli(security: number, difficulty: DifficultyId): number {
  const base = PURSE_TRIAL.robberySafeBaseMilli + security * PURSE_TRIAL.robberySafePerSecurityMilli;
  return applyDifficulty(base, difficultyProfile(difficulty).robberySafeBps);
}

export function canSpendMoney(purse: PlayerCharacter['purse'], amountMilli: number): boolean {
  return purse.moneyMilli - amountMilli >= (purse.robbery?.excessMilli ?? 0);
}

export function homeRobberyChanceBps(excessMilli: number): number {
  if (excessMilli <= 0) return 0;
  const { robberyChanceBpsPerGold: rate, robberyChanceCapBps: cap } = PURSE_TRIAL;
  if (excessMilli >= Math.ceil(cap * 1000 / rate)) return cap;
  return Math.floor(excessMilli * rate / 1000);
}

export function homeRobberyChaseChanceBps(security: number): number {
  return Math.min(10000, security * PURSE_TRIAL.robberyChaseSuccessBpsPerSecurity);
}

export function homeRobberyLossMilli(
  excessMilli: number, option: 'pay' | 'let-go',
): number {
  const rate = option === 'pay' ? PURSE_TRIAL.robberyRansomBps : PURSE_TRIAL.robberyLossBps;
  return applyDifficulty(excessMilli, rate);
}
