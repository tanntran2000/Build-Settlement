import { describe,expect,it } from 'vitest';
import { createCharacterLifeSession,createWorldSession,DEFAULT_PLAYER_DRAFT,isLiveCharacterLifeSessionState,isTileTrialPlanningState,isTileTrialState } from '../../index.js';
import { createSocietyState,isSocietyState,SOCIETY_TRIAL,societyPopulation } from '../society.js';

it('creates the spec section 3 new game', () => {
  const s = createSocietyState();
  expect(s.society).toEqual({
    rulesetId: 'tile-society-01',
    classes: { free: 55, makers: { common: 20, elite: 0 }, luminaries: { common: 12, elite: 0 }, merchants: { common: 13, elite: 0 }, bound: { free: 0, makers: 0, luminaries: 0, merchants: 0 } },
    satisfaction: { free: 80, makers: 80, luminaries: 80, merchants: 80, bound: 80 },
    desperation: 0, tension: 0, debtPressure: { free: 0, makers: 0, luminaries: 0, merchants: 0 },
    corruption: 50, luxuryStockMilli: 0, training: { target: null, progressMilli: 0 }, wallRing: 1,
  });
  expect(societyPopulation(s.society!)).toBe(100);
  expect(isTileTrialState(s)).toBe(true);
  expect(isTileTrialPlanningState(s)).toBe(true);
  const { society: extension, ...goods } = s;
  expect(extension).toBeDefined();
  expect(Object.isFrozen(SOCIETY_TRIAL)).toBe(true);
  s.society!.classes.makers.common = 0;
  expect(createSocietyState().society!.classes.makers.common).toBe(20);
});
const malformed: [string, (s: ReturnType<typeof createSocietyState>) => void][] = [
  ['population mismatch', s => { s.society!.classes.makers.common = 21; }],
  ['missing goods', s => { delete s.goodsStock; }],
  ['extra society key', s => { Object.assign(s.society!, { extra: 1 }); }],
  ['extra classes key', s => { Object.assign(s.society!.classes, { extra: 1 }); }],
  ['extra bound origin', s => { Object.assign(s.society!.classes.bound, { slaves: 0 }); }],
  ['negative count', s => { s.society!.classes.free = -1; }],
  ['fractional count', s => { s.society!.classes.free = 1.5; }],
  ['high satisfaction', s => { s.society!.satisfaction.bound = 101; }],
  ['extra satisfaction', s => { Object.assign(s.society!.satisfaction, { extra: 80 }); }],
  ['NaN corruption', s => { s.society!.corruption = NaN; }],
  ['invalid target', s => { Object.assign(s.society!.training, { target: 'free' }); }],
  ['extra training key', s => { Object.assign(s.society!.training, { extra: 0 }); }],
  ['invalid wall', s => { Object.assign(s.society!, { wallRing: 4 }); }],
  ['future ruleset', s => { Object.assign(s.society!, { rulesetId: 'future' }); }],
];
describe.each(malformed)('rejects malformed society: %s', (_name, mutate) => {
  it('rejects the whole city in both validators and economy detection', () => {
    const s = createSocietyState(); mutate(s);
    expect(isTileTrialState(s)).toBe(false);
    expect(isTileTrialPlanningState(s)).toBe(false);
  });
});
it('creates a society world session', () => {
  const result = createWorldSession(20261028);
  expect(result.success).toBe(true);
  if (!result.success) throw Error('Factory failed');
  expect(result.value.city.society).toEqual(createSocietyState().society);
});
it('rejects accessors and non-plain society objects without reading getters', () => {
  let reads = 0;
  const s = createSocietyState().society!;
  Object.defineProperty(s, 'corruption', { enumerable: true, get() { reads++; return 50; } });
  expect(isSocietyState(s)).toBe(false); expect(reads).toBe(0);
  expect(isSocietyState(Object.create({ ...createSocietyState().society }))).toBe(false);
});
it('rejects unsafe population sums', () => {
  const s = createSocietyState().society!;
  s.classes.free = Number.MAX_SAFE_INTEGER;
  expect(() => societyPopulation(s)).toThrow();
});

it('accepts live society Character Life sessions and rejects society without Goods', () => {
  const result = createCharacterLifeSession(20261028, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
  expect(result.success).toBe(true);
  if (!result.success) throw Error('Factory failed');
  expect(isLiveCharacterLifeSessionState(result.value)).toBe(true);
  const malformed = structuredClone(result.value);
  delete malformed.city.goodsStock;
  expect(isLiveCharacterLifeSessionState(malformed)).toBe(false);
});