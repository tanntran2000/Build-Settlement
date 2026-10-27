import { describe, expect, it } from 'vitest';
import { formatFulfillment, formatMilli } from '../milli-format.js';

describe('tile safe-integer milli display', () => {
  it.each([
    [0, '0'], [-0, '-0'], [1, '0.001'], [-1, '-0.001'], [10, '0.01'], [100, '0.1'],
    [999, '0.999'], [-999, '-0.999'], [1000, '1'], [-1000, '-1'], [1001, '1.001'],
    [1200, '1.2'], [-2500, '-2.5'], [12345, '12.345'], [30000, '30'], [30001, '30.001'],
    [1000000, '1,000'], [-1000000, '-1,000'], [1000000000, '1,000,000'],
    [8796093022207999, '8,796,093,022,207.999'], [8796093022208000, '8,796,093,022,208'],
    [8796093022208001, '8,796,093,022,208.001'], [8796093022208063, '8,796,093,022,208.063'],
    [-8796093022208001, '-8,796,093,022,208.001'],
    [Number.MAX_SAFE_INTEGER, '9,007,199,254,740.991'],
    [-Number.MAX_SAFE_INTEGER, '-9,007,199,254,740.991'],
  ])('formats %s milli as %s', (milli, expected) => {
    expect(formatMilli(milli as number)).toBe(expected);
  });
});

describe('fulfillment display', () => {
  it.each([
    [1, 2, '50%'],
    [51, 1000, '5.1%'],
    [0, 1, '0%'],
    [1, 1, '100%'],
    [1, 3, '33.33%'],
    [1, 10000, '0.01%'],
    [1, 10001, '0%'],
    [Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER, '99.99%'],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, '100%'],
    [0, 0, 'No demand'],
  ])('formats %s supplied / %s demand as %s', (supplied, demand, expected) => {
    expect(formatFulfillment(supplied, demand)).toBe(expected);
  });

  it.each([undefined, null, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1', true, {}, 1n])(
    'rejects invalid input %s in either position', (invalid) => {
      expect(formatFulfillment(invalid, 1)).toBe('Unavailable');
      expect(formatFulfillment(0, invalid)).toBe('Unavailable');
      expect(formatFulfillment(invalid, 0)).toBe('Unavailable');
    },
  );

  it.each([[1, 0], [2, 1]])('rejects supply %s above demand %s', (supplied, demand) => {
    expect(formatFulfillment(supplied, demand)).toBe('Unavailable');
  });
});
