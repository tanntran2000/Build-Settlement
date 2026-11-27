import { expect, it } from 'vitest';
import tuning from '../../data/tuning.json' with { type: 'json' };
import { validateTuning } from '../../data/validate.js';

it.each([
  ['robberySafeBaseMilli', -1, 'expected integer >= 0'],
  ['robberySafePerSecurityMilli', 0.5, 'expected integer >= 0'],
  ['robberySafePerSecurityMilli', Number.MAX_SAFE_INTEGER, 'expected a safe integer amount at Security 100'],
  ['robberySafePerSecurityMilli', 50_000_000_000_000, 'expected a safe integer amount at Security 100'],
  ['robberyChanceBpsPerGold', 0, 'expected integer in [1, 10000]'],
  ['robberyChanceCapBps', 10001, 'expected integer in [1, 10000]'],
  ['robberyRansomBps', 6000, 'expected less than robberyLossBps'],
  ['robberyLossBps', 0, 'expected integer in [1, 10000]'],
  ['robberyChaseSecurityMin', 101, 'expected integer in [0, 100]'],
  ['robberyChaseSuccessBpsPerSecurity', 10001, 'expected integer in [1, 10000]'],
] as const)('rejects %s = %s with exact catalog error', (key, value, rule) => {
  const copy = structuredClone(tuning);
  Object.assign(copy.PURSE_TRIAL, { [key]: value });
  let message: string | undefined;
  try { validateTuning(copy); }
  catch (error) { if (error instanceof Error) message = error.message; }
  expect(message).toBe('tuning.json#PURSE_TRIAL.' + key + ': ' + rule);
});
