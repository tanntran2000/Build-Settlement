import { expect, it } from 'vitest';
import { parseDonationMilli, purseControls } from '../purse-view.js';
import { purseReportRows } from '../report-letters.js';
import { itemError } from '../items-view.js';

it.each(['', '0', ' 2', '2 ', '+2', '2.0', '1e2', '2x', '9007199254741'])('rejects donation input %j', input => {
  expect(parseDonationMilli(input)).toBeNull();
});

it('parses whole digits and explains all disabled purse actions', () => {
  const purse = { levyPercent: 0, donatedThisWeekMilli: 0, moneyMilli: 3000, robbery: null };
  expect(parseDonationMilli('03')).toBe(3000);
  expect(purseControls(purse, '3', false, 'normal')).toStrictEqual({
    amountMilli: 3000, goldMilli: 3000, happinessCost: 0, levyCost: 0, donationOffset: 0,
    decreaseReason: 'Weekly levy is at its minimum.', increaseReason: '', donateReason: '',
  });
  expect(purseControls(purse, '3', false, 'easy').goldMilli).toBe(1500);
  expect(purseControls({ ...purse, levyPercent: 20 }, '4', false, 'normal')).toStrictEqual({
    amountMilli: 4000, goldMilli: 4000, happinessCost: 21, levyCost: 21, donationOffset: 0,
    decreaseReason: '', increaseReason: 'Weekly levy is at its maximum.', donateReason: 'Not enough Money.',
  });
  expect(purseControls(purse, '3', true, 'normal')).toStrictEqual({
    amountMilli: 3000, goldMilli: 3000, happinessCost: 0, levyCost: 0, donationOffset: 0,
    decreaseReason: 'Plan next week before changing the purse.',
    increaseReason: 'Plan next week before changing the purse.',
    donateReason: 'Plan next week before changing the purse.',
  });
  expect(itemError('NOT_ENOUGH_MONEY')).toBe('Not enough Money.');
});

it.each([['normal', 1, 2], ['easy', 2, 1]] as const)(
  'previews the effective %s Happiness cost from saved donations', (difficulty, cost, offset) => {
    const purse = { levyPercent: 5, donatedThisWeekMilli: 2000, moneyMilli: 1000, robbery: null };
    const controls = purseControls(purse, '', false, difficulty);
    expect(controls.happinessCost).toBe(cost);
    expect(controls).toStrictEqual({
      amountMilli: null, goldMilli: null, happinessCost: cost, levyCost: 3, donationOffset: offset,
      decreaseReason: '', increaseReason: '', donateReason: 'Enter a positive whole amount.',
    });
  },
);

it('shows both purse transactions and the shortfall in the report', () => {
  const purse = { levyPercent: 5, levyDueMilli: 1200, levyPaidMilli: 400, donationsMilli: 3000, donationGoldMilli: 3000, moneyAfterMilli: 400 };
  expect(purseReportRows(purse, 'normal')).toEqual([
    { label: 'Levy', value: '+0.4 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall' },
    { label: 'Donation', value: '−3 Money · +3 Gold' },
    { label: 'Money after', value: '0.4 Money' },
  ]);
  const easy = purseReportRows({ ...purse, donationGoldMilli: 1500, moneyAfterMilli: 800 }, 'easy');
  expect(easy).toStrictEqual([
    { label: 'Levy', value: '+0.8 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall' },
    { label: 'Donation', value: '−3 Money · +1.5 Gold' },
    { label: 'Money after', value: '0.8 Money' },
  ]);
});
