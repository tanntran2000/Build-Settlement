import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CrisisStage, TileTrialReport } from '@haven/core';
import type { LifeDestination, LifeWindow } from '../character-life-navigation.js';
import { CLASS_LABELS, crimeReportLine, crisisReportLines, garrisonReportLine, lawReportLines, orderReportLines, type ClassId } from '../society-view.js';
import { reportLetters, reportStamps, type LetterId, type LetterRow, type ReportLetterView, type Seal } from '../report-letters.js';

function report(overrides: Partial<TileTrialReport> = {}): TileTrialReport {
  return {
    week: 1,
    before: { gold: 10000, food: 2000, wheat: 0, wood: 0, iron: 0 },
    after: { gold: 10000, food: 1000, wheat: 0, wood: 0, iron: 0 },
    taxMilli: 1000, farmBatchGoldMilli: 0, farmExtraUpkeepMilli: 0,
    upkeepPaidMilli: 1000, unpaidUpkeepMilli: 0,
    foodDemandMilli: 1000, foodConsumedMilli: 1000,
    happinessBefore: 50, happinessAfter: 50,
    goods: { demandMilli: 1000, servedMilli: 1000, fulfillmentBps: 10000, woodUsed: 0, ironUsed: 0, revenueMilli: 0 },
    activities: [], ...overrides,
  };
}

function order(overrides: Partial<NonNullable<TileTrialReport['order']>> = {}): NonNullable<TileTrialReport['order']> {
  return {
    before: { security: 50, crime: 20, authority: 50 },
    after: { security: 50, crime: 20, authority: 50 },
    targets: { security: 50, crime: 20, authority: 50 },
    soldiers: 6, garrisonSecurity: 3, theftMilli: {}, tensionAdded: 0,
    satisfactionLost: 0, taxModifierBps: 0, taxDeltaMilli: 0,
    arrivalsBudgetBefore: 2, arrivalsBudgetAfter: 2, ...overrides,
  };
}

function immigration(overrides: Partial<NonNullable<TileTrialReport['immigration']>> = {}): NonNullable<TileTrialReport['immigration']> {
  return {
    populationBefore: 100, populationAfter: 100, arrivals: 0, target: 100,
    usefulWorkerSlots: 10, renewableFoodMilli: 1000, reason: 'arrivals', ...overrides,
  };
}

function outside(spoiledMilli: NonNullable<TileTrialReport['outside']>['spoiledMilli'] = {}): NonNullable<TileTrialReport['outside']> {
  return {
    producedMilli: { wood: 0, iron: 0, stone: 0, wool: 0, herbs: 0, cloth: 0 },
    stocksBefore: { stone: 0, wool: 0, cloth: 0, herbs: 0 },
    stocksAfter: { stone: 0, wool: 0, cloth: 0, herbs: 0 },
    hospitalsIdle: [], cleared: [], researchCompleted: [], exhausted: [], spoiledMilli,
  };
}

function crime(event: NonNullable<TileTrialReport['crimeEvent']>['event']): NonNullable<TileTrialReport['crimeEvent']> {
  return { standingBefore: 50, standingAfter: 50, chancePercent: 5, lordHealthLoss: 0, event };
}

function laws(overrides: Partial<NonNullable<TileTrialReport['laws']>> = {}): NonNullable<TileTrialReport['laws']> {
  return { inForce: [], costs: [], unfunded: [], incomeMilli: 0, promise: null, ...overrides };
}

function crisis(overrides: Partial<NonNullable<TileTrialReport['crisis']>> = {}): NonNullable<TileTrialReport['crisis']> {
  return {
    stageBefore: 'none', stageAfter: 'none', hungry: false, hungerStreak: 0,
    calmStreak: 0, weeksInStage: 0, promise: null, cardOpened: null,
    lastChoice: null, tensionBefore: 0, tensionAfter: 0, ...overrides,
  };
}

function society(tensionAfter = 0): NonNullable<TileTrialReport['society']> {
  const residentClass = () => ({
    foodBps: 10000, goodsBps: 10000, luxuryBps: null,
    satisfactionBefore: 50, satisfactionAfter: 50, arrivals: 0, trained: 0,
    enslaved: 0, debtBefore: null, debtAfter: null, notes: [],
  });
  return {
    classes: { free: residentClass(), makers: residentClass(), luminaries: residentClass(), merchants: residentClass(), bound: residentClass() },
    eliteArrived: null, desperationBefore: 0, desperationAfter: 0,
    tensionBefore: 0, tensionAfter, corruptionAfter: 0,
  };
}

function expectHeadline(input: Readonly<TileTrialReport>, id: LetterId, headline: string, seal: Seal): void {
  expect(reportLetters(input).find(letter => letter.id === id)).toMatchObject({ id, headline, seal });
}

describe('approved letter contracts and ordering', () => {
  it('exposes the Decision 8 types', () => {
    expectTypeOf<LetterId>().toEqualTypeOf<'steward' | 'quartermaster' | 'census' | 'captain' | 'council' | 'streets'>();
    expectTypeOf<Seal>().toEqualTypeOf<'Bad' | 'Watch' | 'News'>();
    expectTypeOf<LetterRow>().toEqualTypeOf<{ label: string; value: string; tone: 'gain' | 'loss' | 'muted' }>();
    expectTypeOf(reportLetters).toEqualTypeOf<(report: Readonly<TileTrialReport>) => ReportLetterView[]>();
    expectTypeOf(reportStamps).toEqualTypeOf<(report: Readonly<TileTrialReport>) => { label: 'Food' | 'Goods' | 'Happiness'; value: string }[]>();
  });

  it('keeps all six letters in spec order with their exact senders', () => {
    const input = report({ immigration: immigration(), order: order(), laws: laws({ inForce: ['curfew'] }), society: society() });
    expect(reportLetters(input).map(({ id, sender }) => ({ id, sender }))).toEqual([
      { id: 'steward', sender: 'Your steward' },
      { id: 'quartermaster', sender: 'Quartermaster' },
      { id: 'census', sender: 'Census clerk' },
      { id: 'captain', sender: 'Captain of the watch' },
      { id: 'council', sender: 'Clerk of the Council' },
      { id: 'streets', sender: 'Word from the streets' },
    ]);
  });

  it('omits absent optional letters without disturbing the remaining order', () => {
    expect(reportLetters(report({ immigration: immigration() })).map(letter => letter.id)).toEqual(['steward', 'quartermaster', 'census']);
  });

  it('keeps a crime-only Captain without inventing an Order snapshot', () => {
    expectHeadline(report({ crimeEvent: crime(null) }), 'captain', 'The streets are quiet', 'News');
  });

  it('does not mutate the report and returns independent projections', () => {
    const input = report({ immigration: immigration(), order: order(), laws: laws({ inForce: ['curfew'] }), society: society() });
    const before = structuredClone(input);
    const first = reportLetters(input);
    const stamps = reportStamps(input);
    first[0].headline = 'changed by caller';
    stamps[0].value = 'changed by caller';
    expect(input).toEqual(before);
    expectHeadline(input, 'steward', 'The treasury held', 'News');
    expect(reportStamps(input)[0]).toEqual({ label: 'Food', value: '100%' });
  });
});

describe('Steward first-match headlines', () => {
  it.each([
    [1, 9999, 'Upkeep went unpaid', 'Bad'],
    [1, 10001, 'Upkeep went unpaid', 'Bad'],
    [0, 9999, 'The treasury shrank', 'Bad'],
    [0, 10001, 'The treasury grew', 'News'],
    [0, 10000, 'The treasury held', 'News'],
  ] as const)('unpaid %i, closing Gold %i → %s', (unpaidUpkeepMilli, gold, headline, seal) => {
    const input = report({ unpaidUpkeepMilli });
    input.after.gold = gold;
    expectHeadline(input, 'steward', headline, seal);
  });
});

describe('Quartermaster first-match headlines', () => {
  it('puts a one-milli Food shortfall ahead of Goods and spoilage', () => {
    const input = report({ foodConsumedMilli: 999, outside: outside({ food: 1 }) });
    input.goods.servedMilli = 999;
    expectHeadline(input, 'quartermaster', 'Food ran short', 'Bad');
  });
  it('puts a one-milli Goods shortfall ahead of spoilage when Food is full', () => {
    const input = report({ outside: outside({ food: 1 }) });
    input.goods.servedMilli = 999;
    expectHeadline(input, 'quartermaster', 'Goods ran short', 'Watch');
  });
  it.each(['food', 'goods', 'herbs'] as const)('recognises positive %s spoilage', good => {
    expectHeadline(report({ outside: outside({ [good]: 1 }) }), 'quartermaster', 'Some stores spoiled', 'Watch');
  });
  it.each([undefined, outside(), outside({ food: 0, herbs: 0 })])('treats no positive spoilage as full stores', outsideReport => {
    expectHeadline(report({ outside: outsideReport }), 'quartermaster', 'The stores are full', 'News');
  });
  it('treats zero demand and zero consumption as no shortage', () => {
    const input = report({ foodDemandMilli: 0, foodConsumedMilli: 0 });
    input.goods.demandMilli = 0;
    input.goods.servedMilli = 0;
    expectHeadline(input, 'quartermaster', 'The stores are full', 'News');
  });
});

describe('Census first-match headlines', () => {
  it('puts population loss ahead of arrivals and turned-away newcomers', () => {
    expectHeadline(report({ immigration: immigration({ populationAfter: 99, arrivals: 2 }), order: order({ arrivalsBudgetAfter: 1 }) }), 'census', 'People left the city', 'Bad');
  });
  it.each([[1, 'One newcomer stayed'], [2, '2 newcomers stayed']] as const)('uses %i arrivals rather than net population growth', (arrivals, headline) => {
    expectHeadline(report({ immigration: immigration({ arrivals }), order: order({ arrivalsBudgetAfter: 1 }) }), 'census', headline, 'News');
  });
  it('uses the existing authority-budget reduction predicate for turned away', () => {
    expectHeadline(report({ immigration: immigration(), order: order({ arrivalsBudgetAfter: 1 }) }), 'census', 'Newcomers were turned away', 'Watch');
  });
  it.each(['food-shortage', 'no-capacity', 'target-unfunded'] as const)('does not invent turned-away newcomers from %s', reason => {
    expectHeadline(report({ immigration: immigration({ reason }) }), 'census', 'The census is unchanged', 'News');
  });
  it.each([[0, 0], [2, 2], [2, 3]])('does not call budget %i → %i a reduction', (arrivalsBudgetBefore, arrivalsBudgetAfter) => {
    expectHeadline(report({ immigration: immigration(), order: order({ arrivalsBudgetBefore, arrivalsBudgetAfter }) }), 'census', 'The census is unchanged', 'News');
  });
});

describe('Captain first-match headlines', () => {
  const wounded = crime({ kind: 'assassination', severity: 'severe', outcome: 'wounded', standingLoss: 10, authorityLoss: 5 });
  const foiled = crime({ kind: 'assassination', severity: 'minor', outcome: 'foiled' });
  const raid = crime({ kind: 'raid', severity: 'serious', soldiersKilled: 1 });
  const robbery = crime({ kind: 'robbery', severity: 'minor', target: 'gold', lossMilli: 1 });
  const smear = crime({ kind: 'smear', severity: 'minor', standingLoss: 5 });
  const killed = crime({ kind: 'assassination', severity: 'severe', outcome: 'killed', standingLoss: 10, authorityLoss: 5 });
  const highCrime = order({ after: { security: 50, crime: 67, authority: 50 }, theftMilli: { food: 1 } });
  const risingCrime = order({ after: { security: 50, crime: 21, authority: 50 }, theftMilli: { food: 1 } });
  const stolen = order({ theftMilli: { luxury: 1 } });

  it.each([
    ['wounded before high Crime', highCrime, wounded, 'An assassin struck the Lord', 'Bad'],
    ['raid before high Crime', highCrime, raid, 'The garrison was attacked', 'Bad'],
    ['high Crime before robbery', highCrime, robbery, 'Crime rules the streets', 'Bad'],
    ['high Crime before smear', highCrime, smear, 'Crime rules the streets', 'Bad'],
    ['robbery before rising Crime and theft', risingCrime, robbery, 'Thieves struck', 'Watch'],
    ['smear before rising Crime and theft', risingCrime, smear, 'Rumours spread', 'Watch'],
    ['rising Crime before theft and foiled', risingCrime, foiled, 'Crime is creeping up', 'Watch'],
    ['theft before foiled', stolen, foiled, 'Thieves took from the stores', 'Watch'],
    ['foiled otherwise', order(), foiled, 'Guards stopped an assassin', 'News'],
    ['quiet with a null event', order(), crime(null), 'The streets are quiet', 'News'],
    ['quiet with an absent event wrapper', order(), undefined, 'The streets are quiet', 'News'],
    ['killed reaches high Crime rule', highCrime, killed, 'Crime rules the streets', 'Bad'],
    ['killed has no invented rule', order(), killed, 'The streets are quiet', 'News'],
  ] as const)('%s', (_name, orderReport, crimeEvent, headline, seal) => {
    expectHeadline(report({ order: orderReport, crimeEvent }), 'captain', headline, seal);
  });

  it.each([[66, 'The streets are quiet', 'News'], [67, 'Crime rules the streets', 'Bad']] as const)('checks Crime after at %i', (crimeAfter, headline, seal) => {
    expectHeadline(report({ order: order({ before: { security: 50, crime: 90, authority: 50 }, after: { security: 50, crime: crimeAfter, authority: 50 } }) }), 'captain', headline, seal);
  });
  it.each([
    [order(), 'The streets are quiet', 'News'],
    [risingCrime, 'Crime is creeping up', 'Watch'],
    [stolen, 'Thieves took from the stores', 'Watch'],
  ] as const)('lets zero-loss robbery continue to later rules', (orderReport, headline, seal) => {
    expectHeadline(report({ order: orderReport, crimeEvent: crime({ kind: 'robbery', severity: 'minor', target: 'food', lossMilli: 0 }) }), 'captain', headline, seal);
  });
  it('treats zero theft as quiet', () => {
    expectHeadline(report({ order: order({ theftMilli: { gold: 0, food: 0 } }) }), 'captain', 'The streets are quiet', 'News');
  });
});

describe('Council first-match headlines and explicit presence', () => {
  it('puts a broken promise ahead of an unfunded law', () => {
    expectHeadline(report({ laws: laws({ unfunded: ['watch-levy'], promise: { group: 'free', lawId: 'curfew', outcome: 'broken' } }) }), 'council', 'A promise was broken', 'Bad');
  });
  it('puts an unfunded law ahead of a kept promise', () => {
    expectHeadline(report({ laws: laws({ unfunded: ['watch-levy'], promise: { group: 'free', lawId: 'curfew', outcome: 'kept' } }) }), 'council', 'A law went unfunded', 'Watch');
  });
  it('keeps a promise-only Council letter', () => {
    expectHeadline(report({ laws: laws({ promise: { group: 'makers', lawId: 'curfew', outcome: 'kept' } }) }), 'council', 'A promise was kept', 'News');
  });
  it('keeps an unfunded-only Council letter', () => {
    expectHeadline(report({ laws: laws({ unfunded: ['watch-levy'] }) }), 'council', 'A law went unfunded', 'Watch');
  });
  it.each([
    [laws({ inForce: ['curfew'] }), 'One law in force'],
    [laws({ inForce: ['curfew', 'free-assembly'] }), '2 laws in force'],
  ] as const)('uses the correct law count headline', (lawsReport, headline) => {
    expectHeadline(report({ laws: lawsReport }), 'council', headline, 'News');
  });
  it.each([undefined, laws()])('omits Council when nothing applies; parity location is deferred', lawsReport => {
    expect(reportLetters(report({ laws: lawsReport })).some(letter => letter.id === 'council')).toBe(false);
  });
});

describe('Streets first-match headlines and resolved snapshots', () => {
  it.each([
    ['none', 'warning', 'Unrest rose to Warning', 'Bad'],
    ['warning', 'demand', 'Unrest rose to Demand', 'Bad'],
    ['demand', 'protest', 'Unrest rose to Protest', 'Bad'],
    ['protest', 'rebellion', 'Unrest rose to Rebellion', 'Bad'],
    ['rebellion', 'fallen', 'Unrest rose to Fallen', 'Bad'],
    ['fallen', 'rebellion', 'Unrest eased to Rebellion', 'News'],
    ['rebellion', 'protest', 'Unrest eased to Protest', 'News'],
    ['protest', 'demand', 'Unrest eased to Demand', 'News'],
    ['demand', 'warning', 'Unrest eased to Warning', 'News'],
    ['warning', 'none', 'Unrest eased to Calm', 'News'],
  ] as const)('%s → %s wins over high Tension', (stageBefore: CrisisStage, stageAfter: CrisisStage, headline, seal) => {
    expectHeadline(report({ crisis: crisis({ stageBefore, stageAfter, tensionAfter: 90 }), society: society(90) }), 'streets', headline, seal);
  });
  it.each([[49, 'The streets are calm', 'News'], [50, 'Anger is growing', 'Watch']] as const)('uses society-only Tension after at %i', (tensionAfter, headline, seal) => {
    const societyReport = society(tensionAfter);
    societyReport.tensionBefore = 90;
    expectHeadline(report({ society: societyReport }), 'streets', headline, seal);
  });
  it.each([[49, 'The streets are calm', 'News'], [50, 'Anger is growing', 'Watch']] as const)('falls back to crisis-only Tension after at %i', (tensionAfter, headline, seal) => {
    expectHeadline(report({ crisis: crisis({ tensionBefore: 90, tensionAfter }) }), 'streets', headline, seal);
  });
  it.each([[0, 90, 'The streets are calm', 'News'], [50, 0, 'Anger is growing', 'Watch']] as const)('prefers final society Tension %i over crisis %i', (finalTension, crisisTension, headline, seal) => {
    expectHeadline(report({ society: society(finalTension), crisis: crisis({ tensionAfter: crisisTension }) }), 'streets', headline, seal);
  });
  it('keeps Streets when all available Tension and Desperation values are zero', () => {
    expectHeadline(report({ society: society() }), 'streets', 'The streets are calm', 'News');
  });
});

describe('summary stamps', () => {
  it('uses consumption and service, not closing stocks or Goods production', () => {
    const input = report({ foodConsumedMilli: 1, foodDemandMilli: 3, happinessAfter: 55,
      goodsStock: { openingMilli: 5000, producedMilli: 9000, distributedMilli: 7000, closingMilli: 7000, demandMilli: 7000, unmetMilli: 0, capacityMilli: 10000, limitedBy: 'none' } });
    input.goods.servedMilli = 51;
    input.goods.demandMilli = 1000;
    expect(reportStamps(input)).toEqual([
      { label: 'Food', value: '33.33%' },
      { label: 'Goods', value: '5.1%' },
      { label: 'Happiness', value: '+5' },
    ]);
  });
  it('preserves No demand for both Food and Goods', () => {
    const input = report({ foodConsumedMilli: 0, foodDemandMilli: 0 });
    input.goods.servedMilli = 0;
    input.goods.demandMilli = 0;
    expect(reportStamps(input)).toEqual([
      { label: 'Food', value: 'No demand' },
      { label: 'Goods', value: 'No demand' },
      { label: 'Happiness', value: '0' },
    ]);
  });
  it('preserves Unavailable for invalid fulfillment inputs', () => {
    const input = report({ foodConsumedMilli: -1 });
    input.goods.servedMilli = input.goods.demandMilli + 1;
    expect(reportStamps(input).slice(0, 2)).toEqual([
      { label: 'Food', value: 'Unavailable' }, { label: 'Goods', value: 'Unavailable' },
    ]);
  });
  it.each([[50, 51, '+1'], [50, 49, '−1'], [50, 50, '0'], [0, 100, '+100'], [100, 0, '−100']] as const)('formats Happiness %i → %i in plain units', (happinessBefore, happinessAfter, value) => {
    expect(reportStamps(report({ happinessBefore, happinessAfter }))[2]).toEqual({ label: 'Happiness', value });
  });
});

function rows(input: TileTrialReport, id: LetterId): LetterRow[] {
  return reportLetters(input).find(letter => letter.id === id)!.rows;
}

// Each case catches a missing row, wrong units/sign, incorrect city tone, or a lost optional value.
describe('Steward rows', () => {
  it.each([[9999, '10 → 9.999', 'loss'], [10000, '10 → 10', 'muted'], [10001, '10 → 10.001', 'gain']] as const)('Gold closing %i', (gold, value, tone) => {
    const input = report(); input.after.gold = gold;
    expect(rows(input, 'steward')[0]).toEqual({ label: 'Gold', value, tone });
  });
  it.each([[-1, '−0.001', 'muted'], [0, '0', 'muted'], [1, '+0.001', 'gain']] as const)('Tax %i', (taxMilli, value, tone) => {
    expect(rows(report({ taxMilli }), 'steward')[1]).toEqual({ label: 'Tax', value, tone });
  });
  it.each([[0, '0', 'muted'], [1, '−0.001', 'loss']] as const)('Upkeep paid %i', (upkeepPaidMilli, value, tone) => {
    expect(rows(report({ upkeepPaidMilli }), 'steward')[2]).toEqual({ label: 'Upkeep paid', value, tone });
  });
  it.each([0, 1])('Unpaid upkeep %i', unpaidUpkeepMilli => {
    expect(rows(report({ unpaidUpkeepMilli }), 'steward').filter(row => row.label === 'Unpaid upkeep')).toEqual(unpaidUpkeepMilli ? [{ label: 'Unpaid upkeep', value: '0.001', tone: 'loss' }] : []);
  });
  it.each([undefined, 0, 1])('Gold stolen %s uses only Order theft', amount => {
    const input = report({ order: amount === undefined ? undefined : order({ theftMilli: { gold: amount, food: 1000 } }), crimeEvent: crime({ kind: 'robbery', severity: 'minor', target: 'gold', lossMilli: 9000 }) });
    expect(rows(input, 'steward').filter(row => row.label === 'Gold stolen')).toEqual(amount ? [{ label: 'Gold stolen', value: '−0.001', tone: 'loss' }] : []);
  });
  it('keeps the four losses in a worst week and drops Tax', () => {
    const input = report({ unpaidUpkeepMilli: 1, order: order({ theftMilli: { gold: 1 } }) });
    input.after.gold = 0;
    expect(rows(input, 'steward').map(row => row.label)).toEqual(['Gold', 'Upkeep paid', 'Unpaid upkeep', 'Gold stolen']);
    expect(rows(input, 'steward').every(row => row.tone === 'loss')).toBe(true);
  });
});

describe('Quartermaster rows', () => {
  it.each([[0, 0, '0 of 0', 'muted'], [0, 1, '0 of 0.001', 'loss'], [1, 1, '0.001 of 0.001', 'muted']] as const)('Food %i of %i', (foodConsumedMilli, foodDemandMilli, value, tone) => {
    expect(rows(report({ foodConsumedMilli, foodDemandMilli }), 'quartermaster')[0]).toEqual({ label: 'Food eaten', value, tone });
  });
  it.each([[0, 0, '0 of 0', 'muted'], [0, 1, '0 of 0.001', 'loss'], [1, 1, '0.001 of 0.001', 'muted']] as const)('Goods %i of %i', (servedMilli, demandMilli, value, tone) => {
    const input = report(); Object.assign(input.goods, { servedMilli, demandMilli });
    expect(rows(input, 'quartermaster')[1]).toEqual({ label: 'Goods served', value, tone });
  });
  it.each([undefined, outside()])('omits absent or zero production and spoilage', outsideReport => {
    expect(rows(report({ outside: outsideReport }), 'quartermaster').map(row => row.label)).toEqual(['Food eaten', 'Goods served']);
  });
  it('lists each produced material in type order even when insertion order differs', () => {
    const o = outside(); o.producedMilli = { cloth: 6000, herbs: 5000, wool: 4000, stone: 3000, iron: 2000, wood: 1 };
    expect(rows(report({ outside: o }), 'quartermaster')[2]).toEqual({ label: 'Materials produced', value: 'Wood +0.001 · Iron +2 · Stone +3 · Wool +4 · Herbs +5 · Cloth +6', tone: 'gain' });
  });
  it('omits zero materials within production', () => {
    const o = outside(); o.producedMilli.iron = 1;
    expect(rows(report({ outside: o }), 'quartermaster')[2]).toEqual({ label: 'Materials produced', value: 'Iron +0.001', tone: 'gain' });
  });
  it('lists individual positive spoilage entries without adding unlike resources', () => {
    expect(rows(report({ outside: outside({ wood: 1, iron: 2000, food: 0 }) }), 'quartermaster')[2]).toEqual({ label: 'Spoiled', value: 'Wood −0.001 · Iron −2', tone: 'loss' });
  });
});

describe('Census rows', () => {
  it('keeps a legacy Census with zero rows and a headline', () => {
    expect(reportLetters(report()).find(letter => letter.id === 'census')).toMatchObject({ headline: 'The census is unchanged', rows: [] });
  });
  it.each([[0, 'loss'], [1, 'muted'], [2, 'gain']] as const)('Population after %i', (populationAfter, tone) => {
    expect(rows(report({ immigration: immigration({ populationBefore: 1, populationAfter, arrivals: 0 }) }), 'census')).toEqual([{ label: 'Population', value: `1 → ${populationAfter} · 0 arrivals · Available next week.`, tone }]);
  });
  it('keeps arrivals in the single unchanged immigration value', () => {
    expect(rows(report({ immigration: immigration({ populationBefore: 0, populationAfter: 1, arrivals: 1 }) }), 'census')).toEqual([{ label: 'Population', value: '0 → 1 · 1 arrivals · Available next week.', tone: 'gain' }]);
  });
  it.each(Object.keys(CLASS_LABELS) as ClassId[])('retains every %s satisfaction pair including zero', id => {
    const s = society(); s.classes[id].satisfactionBefore = 0; s.classes[id].satisfactionAfter = 1;
    const result = rows(report({ society: s }), 'census');
    const selected = (Object.keys(CLASS_LABELS) as ClassId[]).filter(candidate => candidate === id || candidate !== 'bound' && (id !== 'bound' || candidate !== 'merchants'));
    expect(result.map(row => row.label)).toEqual(selected.map(candidate => CLASS_LABELS[candidate]));
    expect(result.find(row => row.label === CLASS_LABELS[id])).toEqual({ label: CLASS_LABELS[id], value: '0 → 1', tone: 'gain' });
  });
  it.each([[49, 'loss'], [50, 'muted'], [51, 'gain']] as const)('satisfaction after %i', (after, tone) => {
    const s = society(); s.classes.free.satisfactionAfter = after;
    expect(rows(report({ society: s }), 'census')[0]).toEqual({ label: 'Free residents', value: `50 → ${after}`, tone });
  });
  it('breaks muted ties by candidate order and displays Population first', () => {
    expect(rows(report({ society: society(), immigration: immigration() }), 'census').map(row => row.label)).toEqual(['Population', 'Free residents', 'Makers', 'Luminaries']);
  });
  it('keeps a falling Bound pair over gains and muted classes in class order', () => {
    const s = society(); s.classes.bound.satisfactionAfter = 49;
    s.classes.makers.satisfactionAfter = 51; s.classes.merchants.satisfactionAfter = 51;
    expect(rows(report({ society: s }), 'census').map(row => [row.label, row.tone])).toEqual([
      ['Free residents', 'muted'], ['Makers', 'gain'], ['Merchants', 'gain'], ['The Bound', 'loss'],
    ]);
  });
});

describe('Captain rows', () => {
  it.each(['security', 'crime', 'authority'] as const)('%s directions use city benefit', metric => {
    for (const delta of [-1, 0, 1]) {
      const o = order(); o.after[metric] = o.before[metric] + delta;
      const label = metric[0].toUpperCase() + metric.slice(1);
      const tone = delta === 0 ? 'muted' : (metric === 'crime' ? delta < 0 : delta > 0) ? 'gain' : 'loss';
      expect(rows(report({ order: o }), 'captain').find(row => row.label === label)).toEqual({ label, value: `${o.before[metric]} → ${o.after[metric]}`, tone });
    }
  });
  it('keeps zero Order metrics and the unchanged garrison sentence', () => {
    const input = report({ order: order({ before: { security: 0, crime: 0, authority: 0 }, after: { security: 0, crime: 0, authority: 0 }, soldiers: 0, garrisonSecurity: 0 }) });
    expect(rows(input, 'captain')).toEqual([
      { label: 'Security', value: '0 → 0', tone: 'muted' }, { label: 'Crime', value: '0 → 0', tone: 'muted' }, { label: 'Authority', value: '0 → 0', tone: 'muted' },
      { label: garrisonReportLine(input), value: '', tone: 'muted' },
    ]);
  });
  it.each([
    [null, 'muted'],
    [{ kind: 'robbery', severity: 'minor', target: 'gold', lossMilli: 0 }, 'muted'],
    [{ kind: 'robbery', severity: 'minor', target: 'gold', lossMilli: 1 }, 'loss'],
    [{ kind: 'raid', severity: 'serious', soldiersKilled: 1 }, 'loss'],
    [{ kind: 'smear', severity: 'minor', standingLoss: 1 }, 'loss'],
    [{ kind: 'assassination', severity: 'severe', outcome: 'wounded', standingLoss: 1, authorityLoss: 1 }, 'loss'],
    [{ kind: 'assassination', severity: 'severe', outcome: 'killed' }, 'loss'],
    [{ kind: 'assassination', severity: 'minor', outcome: 'foiled' }, 'gain'],
  ] as const)('uses the complete helper sentence and event tone: %j', (event, tone) => {
    const input = report({ crimeEvent: crime(event) });
    expect(rows(input, 'captain')).toEqual([{ label: crimeReportLine(input), value: '', tone }]);
  });
  it.each([-1, 0, 1])('Authority tax modifier %i reuses the helper slot', taxModifierBps => {
    const input = report({ order: order({ taxModifierBps, theftMilli: { gold: 1 }, tensionAdded: 1, satisfactionLost: 1, arrivalsBudgetAfter: 1 }), crimeEvent: crime(null) });
    const result = rows(input, 'captain');
    expect(result.slice(0, 3).map(row => row.label)).toEqual(['Security', 'Crime', 'Authority']);
    expect(result.slice(3)).toEqual(taxModifierBps === 0
      ? [{ label: garrisonReportLine(input), value: '', tone: 'muted' }]
      : [{ label: orderReportLines(input)[6], value: '', tone: taxModifierBps > 0 ? 'gain' : 'loss' }]);
    expect(result.some(row => row.label === crimeReportLine(input))).toBe(false);
  });
  it.each([
    { kind: 'raid', severity: 'serious', soldiersKilled: 1 },
    { kind: 'assassination', severity: 'severe', outcome: 'wounded', standingLoss: 1, authorityLoss: 1 },
    { kind: 'assassination', severity: 'minor', outcome: 'foiled' },
  ] as const)('reserves the event sentence even against four losses: %j', event => {
    const input = report({ order: order({ after: { security: 49, crime: 21, authority: 49 }, taxModifierBps: -1 }), crimeEvent: crime(event) });
    expect(rows(input, 'captain')).toEqual([
      { label: 'Security', value: '50 → 49', tone: 'loss' },
      { label: 'Crime', value: '20 → 21', tone: 'loss' },
      { label: 'Authority', value: '50 → 49', tone: 'loss' },
      { label: crimeReportLine(input), value: '', tone: event.kind === 'assassination' && event.outcome === 'foiled' ? 'gain' : 'loss' },
    ]);
  });
});

describe('Council rows', () => {
  it('keeps the first four losses in helper order ahead of income and promise', () => {
    const input = report({ laws: laws({ inForce: ['curfew', 'licensed-vice'], costs: [{ lawId: 'watch-levy', goldMilli: 1 }, { lawId: 'poor-relief', goldMilli: 1500 }], unfunded: ['watch-levy', 'poor-relief'], incomeMilli: 1, promise: { group: 'free', lawId: 'curfew', outcome: 'kept' } }) });
    expect(rows(input, 'council')).toEqual(lawReportLines(input).slice(1, 5).map(label => ({ label, value: '', tone: 'loss' })));
  });
  it('leaves a later broken promise in Details when four earlier losses fill the summary', () => {
    const input = report({ laws: laws({ inForce: ['curfew'], costs: [{ lawId: 'watch-levy', goldMilli: 1 }, { lawId: 'poor-relief', goldMilli: 1 }], unfunded: ['watch-levy', 'poor-relief'], promise: { group: 'free', lawId: 'curfew', outcome: 'broken' } }) });
    expect(rows(input, 'council')).toEqual(lawReportLines(input).slice(1, 5).map(label => ({ label, value: '', tone: 'loss' })));
    expectHeadline(input, 'council', 'A promise was broken', 'Bad');
  });
  it.each(['kept', 'broken'] as const)('promise-only %s keeps No laws sentence', outcome => {
    const input = report({ laws: laws({ promise: { group: 'free', lawId: 'curfew', outcome } }) });
    expect(rows(input, 'council')).toEqual([{ label: lawReportLines(input)[0], value: '', tone: 'muted' }, { label: lawReportLines(input)[1], value: '', tone: outcome === 'kept' ? 'gain' : 'loss' }]);
  });
  it('does not pad a single free-law row', () => {
    const input = report({ laws: laws({ inForce: ['curfew'] }) });
    expect(rows(input, 'council')).toEqual([{ label: lawReportLines(input)[0], value: '', tone: 'muted' }]);
  });
  it('omits zero income and absent promise without losing a zero cost', () => {
    const input = report({ laws: laws({ inForce: ['curfew'], costs: [{ lawId: 'watch-levy', goldMilli: 0 }] }) });
    expect(rows(input, 'council')).toEqual([{ label: lawReportLines(input)[0], value: '', tone: 'muted' }, { label: lawReportLines(input)[1], value: '', tone: 'loss' }]);
  });
});

describe('Streets rows', () => {
  it.each([[0, 'muted'], [1, 'loss']] as const)('zero-based Tension and Desperation after %i', (after, tone) => {
    const s = society(after); s.desperationAfter = after;
    expect(rows(report({ society: s }), 'streets')).toEqual([{ label: 'Tension', value: `0 → ${after}`, tone }, { label: 'Desperation', value: `0 → ${after}`, tone }]);
  });
  it('uses final society pairs and marks decreases as gains', () => {
    const s = society(); s.tensionBefore = 1; s.desperationBefore = 1;
    expect(rows(report({ society: s, crisis: crisis({ tensionBefore: 90, tensionAfter: 99 }) }), 'streets')).toEqual([{ label: 'Tension', value: '1 → 0', tone: 'gain' }, { label: 'Desperation', value: '1 → 0', tone: 'gain' }]);
  });
  it('keeps a single crisis-only pair without inventing Desperation', () => {
    expect(rows(report({ crisis: crisis() }), 'streets')).toEqual([{ label: 'Tension', value: '0 → 0', tone: 'muted' }]);
  });
  it.each([['none', 'warning', 'loss'], ['warning', 'none', 'gain']] as const)('stage %s to %s reuses helper output', (stageBefore, stageAfter, tone) => {
    const input = report({ crisis: crisis({ stageBefore, stageAfter }) });
    expect(rows(input, 'streets')[1]).toEqual({ label: crisisReportLines(input)[0], value: '', tone });
  });
  it.each([0, 1])('hungry weeks %i picks the data-selected helper line', hungerStreak => {
    const input = report({ crisis: crisis({ hungerStreak, promise: { stage: 'demand', result: 'kept', tensionDelta: -1, authorityDelta: 1 }, lastChoice: { stage: 'demand', option: 'refuse', goldMilli: 0 } }) });
    expect(rows(input, 'streets').slice(1)).toEqual(hungerStreak ? [{ label: crisisReportLines(input)[0], value: '', tone: 'loss' }] : []);
  });
  it('keeps stage then hunger while leaving promise and answer in Details', () => {
    const input = report({ crisis: crisis({ stageAfter: 'warning', hungerStreak: 1 }) });
    expect(rows(input, 'streets').slice(1)).toEqual(crisisReportLines(input).map(label => ({ label, value: '', tone: 'loss' })));
  });
});

it('caps every letter at four rows for a worst-case report without mutating its Details data', () => {
  const o = outside({ wood: 1 }); o.producedMilli.iron = 1;
  const input = report({ unpaidUpkeepMilli: 1, outside: o, immigration: immigration(), society: society(1),
    order: order({ theftMilli: { gold: 1 }, taxModifierBps: -1 }),
    crimeEvent: crime({ kind: 'raid', severity: 'serious', soldiersKilled: 1 }),
    laws: laws({ inForce: ['curfew'], costs: [{ lawId: 'watch-levy', goldMilli: 1 }, { lawId: 'poor-relief', goldMilli: 1 }], unfunded: ['watch-levy', 'poor-relief'], incomeMilli: 1, promise: { group: 'free', lawId: 'curfew', outcome: 'broken' } }),
    crisis: crisis({ stageAfter: 'warning', hungerStreak: 1 }),
  });
  const original = structuredClone(input);
  const letters = reportLetters(input);
  expect(letters).toHaveLength(6);
  for (const letter of letters) expect(letter.rows.length, letter.id).toBeLessThanOrEqual(4);
  expect(input).toEqual(original);
});

it('B2 keeps Report as a destination and excludes it from modal windows', () => {
  expectTypeOf<LifeWindow>().toEqualTypeOf<'information' | 'player' | 'population' | null>();
  expectTypeOf<Extract<LifeDestination, 'reports'>>().toEqualTypeOf<'reports'>();
});
