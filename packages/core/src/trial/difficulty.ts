import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateTuning } from '../data/validate.js';

export type DifficultyId = 'normal' | 'easy';
export const DIFFICULTY_TRIAL = deepFreeze(validateTuning(tuningJson).DIFFICULTY_TRIAL);

export function difficultyProfile(id: DifficultyId) {
  return DIFFICULTY_TRIAL.profiles[id];
}

export function applyDifficulty(valueMilli: number, bps: number): number {
  if (bps === 10000) return valueMilli;
  const product = valueMilli * bps;
  if (Number.isSafeInteger(product)) return Math.floor(product / 10000);
  const rounded = Number(BigInt(valueMilli) * BigInt(bps) / 10000n);
  if (!Number.isSafeInteger(rounded)) throw Error('Difficulty arithmetic overflow.');
  return rounded;
}
