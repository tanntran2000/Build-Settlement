import { expect, it } from 'vitest';
import {
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type CharacterLifeSessionState, type DifficultyId,
} from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';

function make(difficulty: DifficultyId = 'normal') {
  const r = createCharacterLifeSession(2026, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Keeper' }, difficulty);
  if (!r.success) throw Error(r.error.message);
  return r.value;
}
function dispatch(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  return executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
}
function act(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const r = dispatch(s, type, fields);
  if (!r.success) throw Error(type + ' ' + r.error.code);
  return r;
}
const stock = (s: CharacterLifeSessionState) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;

function close(s: CharacterLifeSessionState) {
  const result = act(s, 'END_WEEK', { expectedWeek: s.city.world.week });
  if (!result.report) throw Error('Expected End Week report');
  return { ...result, report: result.report };
}

function refused(s: CharacterLifeSessionState, command: object, code: string, message: string) {
  const before = structuredClone(s);
  expect(executeCharacterLifeCommand(s, command)).toStrictEqual({ success: false, error: { code, message } });
  expect(s).toStrictEqual(before);
}

it.each([21, 2.5, -1, '5', Infinity])('refuses levy %s without mutation', percent => {
  const s = make();
  refused(s, { type: 'SET_LEVY', expectedRevision: s.city.revision, percent },
    'INVALID_AMOUNT', 'Enter a whole levy percent from 0 to 20.');
});

it.each([
  [0, 'INVALID_AMOUNT', 'Enter a positive whole amount.'],
  [1500, 'INVALID_AMOUNT', 'Enter a positive whole amount.'],
  [3000, 'NOT_ENOUGH_MONEY', 'Not enough Money.'],
] as const)('refuses donation %i without mutation', (amountMilli, code, message) => {
  const s = make();
  refused(s, { type: 'DONATE_MONEY', expectedRevision: s.city.revision, amountMilli }, code, message);
});

it.each([
  ['SET_LEVY', { percent: 5 }],
  ['DONATE_MONEY', { amountMilli: 1000 }],
] as const)('refuses %s in Report or with an invalid command envelope', (type, fields) => {
  const s = act(make(), 'SET_LEVY', { percent: 2 }).next;
  s.player.purse.moneyMilli = 1000;
  const report = close(s).next;
  refused(report, { type, expectedRevision: report.city.revision, ...fields },
    'FORBIDDEN', 'Plan next week before changing the purse.');
  refused(s, { type, expectedRevision: s.city.revision - 1, ...fields },
    'STALE_COMMAND', 'The purse changed. Try again.');
  for (const command of [
    { type, expectedRevision: s.city.revision },
    { type, ...fields },
    { type, expectedRevision: s.city.revision, ...fields, extra: true },
  ]) refused(s, command, 'INVALID_COMMAND', 'Command must contain plain data fields.');
});

it.each([['normal', 3000], ['easy', 1500]] as const)('donates 3 Money on %s and reports both currencies before resetting', (difficulty, gold) => {
  const s = make(difficulty);
  s.player.purse.moneyMilli = 3000;
  const { next } = act(s, 'DONATE_MONEY', { amountMilli: 3000 });
  expect(stock(next).gold).toBe(stock(s).gold + gold);
  expect(next.player.purse.moneyMilli).toBe(0);
  expect(next.player.purse.donatedThisWeekMilli).toBe(3000);
  expect(next.city.society!.satisfaction).toStrictEqual(s.city.society!.satisfaction);
  expect(next.city.happiness).toBe(s.city.happiness);
  const resolved = act(next, 'END_WEEK', { expectedWeek: 1 });
  expect(resolved.report!.purse!.donationsMilli).toBe(3000);
  expect(resolved.report!.purse!.donationGoldMilli).toBe(gold);
  expect(resolved.next.player.purse.donatedThisWeekMilli).toBe(0);
});

function fundedControl(s: CharacterLifeSessionState, goldMilli: number, percent = 0) {
  const control = act(s, 'SET_LEVY', { percent }).next;
  stock(control).gold += goldMilli;
  return control;
}

it.each([2, 5, 10, 20].flatMap(percent => (['normal', 'easy'] as const).map(difficulty => ({ percent, difficulty }))))(
  'returning the whole levy at percent $percent in $difficulty creates no Gold or Happiness', ({ percent, difficulty }) => {
    const initial = make(difficulty);
    const world = initial.city.world;
    // 1,250 residents at 240 milli each give 300 Gold with no Goods or law revenue.
    initial.city.society!.classes.free += 1150;
    world.settlements[world.activeSettlementId!].cohorts[0].count = 1250;
    stock(initial).food = 200000;
    stock(initial).gold = 1000000;
    const noMarket = act(initial, 'SET_ENABLED', { tileId: 'spec-1', enabled: false }).next;
    const closed = close(act(noMarket, 'SET_LEVY', { percent }).next);
    const paid = 3000 * percent;
    const receipt = paid * (difficulty === 'easy' ? 2 : 1);
    expect(closed.report.taxMilli).toBe(300000);
    expect(closed.report.purse!.levyPaidMilli).toBe(paid);
    expect(closed.next.player.purse.moneyMilli).toBe(receipt);
    const planning = act(closed.next, 'NEXT_WEEK').next;
    const control = fundedControl(planning, paid);
    const donated = act(planning, 'DONATE_MONEY', { amountMilli: receipt }).next;
    expect(donated.player.purse.moneyMilli).toBe(0);
    expect(stock(donated).gold).toBe(closed.report.after.gold + paid);
    expect(stock(donated)).toStrictEqual(stock(control));
    expect(donated.city.happiness).toBe(planning.city.happiness);
    const unlevied = close(control), afterDonation = close(donated);
    expect(unlevied.report.purse!.donationsMilli).toBe(0);
    expect(afterDonation.next.city.happiness).toBeLessThanOrEqual(unlevied.next.city.happiness);
    if (percent === 2)
      expect(afterDonation.next.city.society!.satisfaction).toStrictEqual(unlevied.next.city.society!.satisfaction);
  });

it.each([0, 1, 2].flatMap(percent => (['normal', 'easy'] as const).map(difficulty => ({ percent, difficulty }))))(
  'at $percent percent, a positive $difficulty donation leaves Happiness and class scores at the zero-levy control', ({ percent, difficulty }) => {
    const s = make(difficulty);
    s.player.purse.moneyMilli = 4000;
    const gold = difficulty === 'easy' ? 2000 : 4000;
    const control = fundedControl(s, gold);
    const levied = act(s, 'SET_LEVY', { percent }).next;
    const donated = act(levied, 'DONATE_MONEY', { amountMilli: 4000 }).next;
    expect(stock(donated)).toStrictEqual(stock(control));
    const afterDonation = close(donated), baseline = close(control);
    expect(afterDonation.report.purse!.donationGoldMilli).toBe(gold);
    expect(baseline.report.purse!.donationsMilli).toBe(0);
    expect(afterDonation.next.city.society!.satisfaction).toStrictEqual(baseline.next.city.society!.satisfaction);
    expect(afterDonation.next.city.happiness).toBe(baseline.next.city.happiness);
    expect(afterDonation.report.happinessAfter).toBe(baseline.report.happinessAfter);
  });

it('keeps a funded citizen class at zero through the combined adjustment and compares the aggregate', () => {
  let s = make();
  s.city.society!.satisfaction.free = 0;
  s.player.purse.moneyMilli = 2000;
  stock(s).food = 0;
  stock(s).gold = 1000000;
  for (const tileId of ['field-1', 'plain-1', 'spec-1']) s = act(s, 'SET_ENABLED', { tileId, enabled: false }).next;
  const zero = fundedControl(s, 2000);
  const levy = act(s, 'SET_LEVY', { percent: 5 }).next;
  const donated = act(levy, 'DONATE_MONEY', { amountMilli: 2000 }).next;
  expect(stock(donated)).toStrictEqual(stock(zero));
  const baseline = close(zero), result = close(donated);
  const baseFree = baseline.report.society!.classes.free;
  expect(baseFree.foodBps).toBe(0);
  expect(baseFree.goodsBps).toBe(0);
  expect(baseFree.satisfactionBefore).toBe(0);
  expect(baseFree.satisfactionAfter).toBe(0);
  expect(baseline.report.order!.satisfactionLost).toBe(0);
  expect(result.report.society!.classes.free.satisfactionAfter).toBe(0);
  const scores = baseline.next.city.society!.satisfaction;
  const expected = { ...scores, free: 0, makers: scores.makers - 1, luminaries: scores.luminaries - 1, merchants: scores.merchants - 1 };
  expect(result.next.city.society!.satisfaction).toStrictEqual(expected);
  const { free, makers, luminaries, merchants } = baseline.next.city.society!.classes;
  const counts = [free, ...[makers, luminaries, merchants].map(group => group.common + group.elite)];
  const score = [expected.free, expected.makers, expected.luminaries, expected.merchants]
    .reduce((sum, value, index) => sum + value * counts[index], 0);
  const happiness = Number((score / counts.reduce((sum, n) => sum + n, 0)).toFixed(2));
  expect(result.next.city.happiness).toBe(happiness);
  expect(result.report.happinessAfter).toBe(happiness);
  expect(happiness).toBeLessThan(baseline.next.city.happiness);
});

it.each([['normal', 3000, 2, 1], ['easy', 1500, 1, 2]] as const)(
  'uses shipped %s Gold conversion and the capped offset including after save and reload', (difficulty, gold, offset, cost) => {
    const s = make(difficulty);
    s.player.purse.moneyMilli = 3000;
    const zero = fundedControl(s, gold);
    const withoutOffset = fundedControl(s, gold, 5);
    const levied = act(s, 'SET_LEVY', { percent: 5 }).next;
    const first = act(levied, 'DONATE_MONEY', { amountMilli: 1000 }).next;
    const saved = serializeCharacterLifeSave(first);
    if (!saved.success) throw Error(saved.error.message);
    const loaded = deserializeCharacterLifeSave(saved.text);
    if (!loaded.success) throw Error(loaded.error.message);
    expect(loaded.state).toStrictEqual(first);
    const donated = act(loaded.state, 'DONATE_MONEY', { amountMilli: 2000 }).next;
    expect(donated.player.purse.donatedThisWeekMilli).toBe(3000);
    expect(donated.city.society!.satisfaction).toStrictEqual(s.city.society!.satisfaction);
    expect(stock(donated)).toStrictEqual(stock(withoutOffset));
    const regular = close(withoutOffset).next;
    const unlevied = close(zero).next;
    const offsetWeek = close(donated);
    expect(offsetWeek.report.purse!.donationGoldMilli).toBe(gold);
    for (const key of ['free', 'makers', 'luminaries', 'merchants'] as const) {
      expect(offsetWeek.next.city.society!.satisfaction[key]).toBe(regular.city.society!.satisfaction[key] + offset);
      expect(offsetWeek.next.city.society!.satisfaction[key]).toBe(unlevied.city.society!.satisfaction[key] - cost);
    }
    expect(offsetWeek.next.city.society!.satisfaction.bound).toBe(regular.city.society!.satisfaction.bound);
    expect(offsetWeek.report.happinessAfter).toBe(Number((unlevied.city.happiness - cost).toFixed(2)));
  },
);

it('keeps NPC acquisition on Gold even when the Player has Money', () => {
  const s = make();
  s.player.purse.moneyMilli = 15000;
  const guild = act(s, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  const { next } = act(guild, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId: 'estate-2' });
  expect(next.npcs).toHaveLength(1);
  expect(stock(next).gold).toBeLessThan(stock(guild).gold);
  expect(next.player.purse).toStrictEqual(guild.player.purse);
});
