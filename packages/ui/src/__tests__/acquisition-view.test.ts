import { expect, it } from 'vitest';
import { acquisitionNpc, npcValueMilli, type TileTrialReport } from '@haven/core';
import { cardFor, recruitReason } from '../acquisition-view.js';
import { householdReportRows } from '../report-letters.js';

it('renders age, origin, source, status, skills, Beauty, Mind, obedience and price from the seeded card', () => {
  const { npc } = acquisitionNpc(42, 1, 'guild', 0, 0);
  const price = npcValueMilli(npc, 'guild', false), view = cardFor(npc, price);
  expect(view).toStrictEqual({
    name: 'Ardis Frostmere', age: 34, title: 'Mature', origin: 'Frontier', source: 'Guild', status: 'Servant',
    skills: [{ label: 'Medical', value: 39 }, { label: 'Management', value: 36 }],
    beauty: 62, mind: 70, obedience: 63, priceMilli: 8000, wageMilli: 2000,
  });
  expect(view.skills).toHaveLength(2);
  expect(view.skills.map(skill => skill.value)).toStrictEqual(Object.values(npc.character.skills).sort((a, b) => b - a).slice(0, 2));
});

it('reports the exact disabled reason for locked, gone, one Gold short, no bed and cap', () => {
  expect(recruitReason(false, true, 5000, 5000, true, 99)).toBe('');
  expect(recruitReason(true, true, 5000, 5000, true, 99)).toBe('Plan next week to recruit.');
  expect(recruitReason(false, false, 5000, 5000, true, 99)).toBe('That offer is no longer available.');
  expect(recruitReason(false, true, 4000, 5000, true, 99)).toBe('There is not enough Gold.');
  expect(recruitReason(false, true, 5000, 5000, false, 99)).toBe('That home has no free bed.');
  expect(recruitReason(false, true, 5000, 5000, true, 100)).toBe('The NPC roster is full.');
});

it('renders named acquisition rows and a 55 Gold lot by source', () => {
  const report = { household: { bought: ['A'], sold: ['B'], released: ['C'], left: [], unpaid: [],
    notices: [], wagesPaidMilli: 0, lotsToRivals: [{ source: 'auction-house', priceMilli: 55000 }] } } satisfies Pick<TileTrialReport, 'household'>;
  expect(householdReportRows(report)).toStrictEqual([
    { kind: 'bought', label: 'Recruited', value: 'A' },
    { kind: 'sold', label: 'Sold', value: 'B' },
    { kind: 'released', label: 'Released', value: 'C' },
    { kind: 'lotsToRivals', label: 'Lot sold to a rival', value: 'Auction House · 55 Gold' },
  ]);
  expect(householdReportRows({})).toStrictEqual([]);
  const household = { ...report.household, wagesPaidMilli: 2500, unpaid: ['D'], notices: ['E'], left: ['F'] };
  expect(householdReportRows({ household }).slice(4)).toStrictEqual([
    { kind: 'wagesPaidMilli', label: 'Wages paid', value: '2.5 Gold' },
    { kind: 'unpaid', label: 'Wage unpaid', value: 'D' },
    { kind: 'notices', label: 'Contract notice', value: 'E' },
    { kind: 'left', label: 'Left', value: 'F' },
  ]);
});
