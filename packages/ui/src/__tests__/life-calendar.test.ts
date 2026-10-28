import { describe, expect, it } from 'vitest';
import { formatLifeWeek } from '../life-calendar.js';

describe('Character Life calendar display', () => {
  it.each([
    [1, 'Week 1 · Year 1'],
    [40, 'Week 40 · Year 1'],
    [41, 'Week 1 · Year 2'],
    [80, 'Week 40 · Year 2'],
    [81, 'Week 1 · Year 3'],
    [Number.MAX_SAFE_INTEGER, 'Week 31 · Year 225179981368525'],
  ])('formats absolute week %s as %s', (week, expected) => {
    expect(formatLifeWeek(week as number)).toBe(expected);
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid week %s', (week) => {
      expect(formatLifeWeek(week)).toBe('Unavailable');
    },
  );
});
