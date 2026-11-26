import { expect, it } from 'vitest';
import tuningJson from '../../data/tuning.json' with { type: 'json' };
import { validateTuning } from '../../data/validate.js';
import { applyDifficulty, difficultyProfile } from '../difficulty.js';

it('keeps each Normal multiplier at 10000 bps', () => {
  expect(difficultyProfile('normal')).toStrictEqual({
    taxBps: 10000, goodsPriceBps: 10000, lawPayBps: 10000, upkeepBps: 10000, levyMoneyBps: 10000,
  });
});

it.each(['taxBps', 'goodsPriceBps', 'lawPayBps', 'upkeepBps', 'levyMoneyBps'] as const)(
  'rejects non-identity Normal %s at its catalog path', field => {
    const data = structuredClone(tuningJson);
    data.DIFFICULTY_TRIAL.profiles.normal[field] = 10001;
    let message: string | undefined;
    try {
      validateTuning(data);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      message = error.message;
    }
    expect(message).toBe('tuning.json#DIFFICULTY_TRIAL.profiles.normal.' + field + ': must be 10000');
  },
);

it('stores the Easy levy conversion for the later levy implementation', () => {
  expect(difficultyProfile('easy').levyMoneyBps).toBe(20000);
});

it('refuses a zero Easy levy divisor at its catalog path', () => {
  const data = structuredClone(tuningJson);
  data.DIFFICULTY_TRIAL.profiles.easy.levyMoneyBps = 0;
  let message: string | undefined;
  try {
    validateTuning(data);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    message = error.message;
  }
  expect(message).toBe('tuning.json#DIFFICULTY_TRIAL.profiles.easy.levyMoneyBps: expected integer > 0');
});

it('floors the scaled milli amount and keeps Normal exact', () => {
  expect(applyDifficulty(1001, 15000)).toBe(1501);
  expect(applyDifficulty(Number.MAX_SAFE_INTEGER, 10000)).toBe(Number.MAX_SAFE_INTEGER);
});
