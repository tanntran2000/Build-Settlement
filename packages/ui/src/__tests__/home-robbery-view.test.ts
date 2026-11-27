import { expect, it } from 'vitest';
import { heldMoneyNotice, homeRobberyOptions, purseControls, purseRisk } from '../purse-view.js';
import { purseReportRows } from '../report-letters.js';

it('shows exact exposure, option costs and chase restriction', () => {
  expect(purseRisk(22500, 30, 'normal')).toStrictEqual({ safeMilli: 22500, atRiskMilli: 0 });
  expect(purseRisk(26501, 30, 'normal')).toStrictEqual({ safeMilli: 22500, atRiskMilli: 4001 });
  expect(purseRisk(49001, 30, 'easy')).toStrictEqual({ safeMilli: 45000, atRiskMilli: 4001 });
  const purse = { moneyMilli: 26501, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4001 } };
  expect(homeRobberyOptions(purse, 14, false)).toStrictEqual([
    { option: 'pay', label: 'Pay', lossMilli: 1000, reason: '' },
    { option: 'chase', label: 'Chase', lossMilli: 2400, reason: 'Needs Security 15.' },
    { option: 'let-go', label: 'Let go', lossMilli: 2400, reason: '' },
  ]);
  expect(homeRobberyOptions(purse, 30, true).map(view => view.reason))
    .toStrictEqual(Array(3).fill('Choose Plan next week to answer.'));
});

it('describes the held amount and keeps the same losses after a debit or credit', () => {
  const held = { moneyMilli: 5001, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4001 } };
  const notice = '4.001 Money is held until the robbery is answered.';
  expect(heldMoneyNotice(held)).toBe(notice);
  expect(purseControls(held, '2', false, 'normal').donateReason).toBe(notice);
  expect(purseControls(held, '1', false, 'normal').donateReason).toBe('');
  expect(homeRobberyOptions({ ...held, moneyMilli: 4001 }, 30, false)).toStrictEqual([
    { option: 'pay', label: 'Pay', lossMilli: 1000, reason: '' },
    { option: 'chase', label: 'Chase', lossMilli: 2400, reason: '' },
    { option: 'let-go', label: 'Let go', lossMilli: 2400, reason: '' },
  ]);
  expect(homeRobberyOptions({ ...held, moneyMilli: 25001 }, 30, false))
    .toStrictEqual(homeRobberyOptions(held, 30, false));
});

it.each(['normal', 'easy'] as const)('renders the %s Robbery row independently from the levy rate', difficulty => {
  const purse = { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0,
    donationGoldMilli: 0, moneyAfterMilli: 26501 };
  expect(purseReportRows({ ...purse, robbery: { outcome: 'pending', excessMilli: 4001 } }, difficulty)).toStrictEqual([
    { label: 'Levy', value: '0 Money · 0% · 0 of 0 Gold paid' },
    { label: 'Donation', value: '0 Money · 0 Gold' },
    { label: 'Money after', value: '26.501 Money' },
    { label: 'Robbery', value: 'Awaiting answer · 4.001 Money at risk' },
  ]);
  expect(purseReportRows({ ...purse, robbery: { outcome: 'pay', excessMilli: 4001, lossMilli: 1000 } }, difficulty).at(-1))
    .toStrictEqual({ label: 'Robbery', value: 'Paid · −1 Money · 4.001 Money at risk' });
});
