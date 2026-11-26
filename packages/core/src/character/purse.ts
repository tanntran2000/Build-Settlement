import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateTuning } from '../data/validate.js';
import { applyDifficulty, difficultyProfile, type DifficultyId } from '../trial/difficulty.js';

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
