import { expect, it } from 'vitest';
import { PURSE_TRIAL } from '../index.js';
import tuning from '../data/tuning.json' with { type: 'json' };
import { validateTuning } from '../data/validate.js';

it('publishes every purse tuning key in the frozen whole-catalog view', () => {
  expect(Object.keys(PURSE_TRIAL)).toEqual([
    'marker', 'levyMaxPercent', 'levyFreePercent', 'levySatisfactionBpsPerPoint',
    'donateSatisfactionPerGoldMilli', 'donateSatisfactionCapPerWeek',
    'robberySafeBaseMilli', 'robberySafePerSecurityMilli', 'robberyChanceBpsPerGold', 'robberyChanceCapBps',
    'robberyRansomBps', 'robberyLossBps', 'robberyChaseSecurityMin', 'robberyChaseSuccessBpsPerSecurity',
  ]);
  expect(PURSE_TRIAL).toStrictEqual(tuning.PURSE_TRIAL);
  expect(Object.isFrozen(PURSE_TRIAL)).toBe(true);
});

it.each([
  ['levyMaxPercent', 21, 'expected 20'],
  ['levyFreePercent', 3, 'expected 2'],
  ['levySatisfactionBpsPerPoint', 0.5, 'expected integer >= 0'],
  ['donateSatisfactionPerGoldMilli', -1, 'expected number in [0, 1]'],
  ['donateSatisfactionCapPerWeek', 101, 'expected integer in [0, 100]'],
] as const)('validates %s with an exact field diagnostic', (key, value, message) => {
  const candidate = structuredClone(tuning);
  candidate.PURSE_TRIAL[key] = value;
  let error: unknown;
  try { validateTuning(candidate); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe('tuning.json#PURSE_TRIAL.' + key + ': ' + message);
});
