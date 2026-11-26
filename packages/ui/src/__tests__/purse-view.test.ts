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
  expect(purseControls(purse, '3', false, 'normal')).toMatchObject({
    decreaseReason: 'Weekly levy is at its minimum.', increaseReason: '', donateReason: '', happinessCost: 0, goldMilli: 3000,
  });
  expect(purseControls(purse, '3', false, 'easy').goldMilli).toBe(1500);
  expect(purseControls({ ...purse, levyPercent: 20 }, '4', false, 'normal')).toMatchObject({
    increaseReason: 'Weekly levy is at its maximum.', donateReason: 'Not enough Money.',
  });
  expect(purseControls(purse, '3', true, 'normal')).toMatchObject({
    decreaseReason: 'Plan next week before changing the purse.',
    increaseReason: 'Plan next week before changing the purse.',
    donateReason: 'Plan next week before changing the purse.',
  });
  expect(itemError('NOT_ENOUGH_MONEY')).toBe('Not enough Money.');
});

it('shows both purse transactions and the shortfall in the report', () => {
  const purse = { levyPercent: 5, levyDueMilli: 1200, levyPaidMilli: 400, donationsMilli: 3000, donationGoldMilli: 3000, moneyAfterMilli: 400 };
  expect(purseReportRows(purse, 'normal')).toEqual([
    { label: 'Levy', value: '+0.4 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall' },
    { label: 'Donation', value: '−3 Money · +3 Gold' },
    { label: 'Money after', value: '0.4 Money' },
  ]);
  const easy = purseReportRows({ ...purse, donationGoldMilli: 1500, moneyAfterMilli: 800 }, 'easy');
  expect(easy[0].value).toBe('+0.8 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall');
  expect(easy[1]).toEqual({ label: 'Donation', value: '−3 Money · +1.5 Gold' });
});
