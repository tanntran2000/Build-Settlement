import { expect, it } from 'vitest';
import {
  createCharacterLifeSession, CRISIS_TRIAL, DEFAULT_PLAYER_DRAFT, homeRobberyChanceBps,
  type CharacterLifeSessionState, type DifficultyId, type TileTrialReport,
} from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';

function make(seed = 40, difficulty: DifficultyId = 'normal') {
  const made = createCharacterLifeSession(seed, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, difficulty);
  if (!made.success) throw Error(made.error.message);
  return made.value;
}
const stocks = (s: CharacterLifeSessionState) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;

function dispatch(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  return executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
}
function act(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const result = dispatch(s, type, fields);
  if (!result.success) throw Error(result.error.code + ': ' + result.error.message);
  return result;
}
function close(s: CharacterLifeSessionState) {
  const closed = act(s, 'END_WEEK', { expectedWeek: s.city.world.week });
  if (!closed.report) throw Error('Expected weekly report.');
  return { ...closed, report: closed.report as Readonly<TileTrialReport> };
}
function refusal(s: CharacterLifeSessionState, code: string, message: string, type: string, fields: Record<string, unknown> = {}) {
  const before = structuredClone(s);
  expect(dispatch(s, type, fields)).toStrictEqual({ success: false, error: { code, message } });
  expect(s).toStrictEqual(before);
}
function reload(s: CharacterLifeSessionState) {
  const saved = serializeCharacterLifeSave(s);
  if (!saved.success) throw Error(saved.error.message);
  const decoded = deserializeCharacterLifeSave(saved.text);
  expect(decoded).toStrictEqual({ success: true, state: s });
  if (!decoded.success) throw Error(decoded.error.message);
  expect(serializeCharacterLifeSave(decoded.state)).toStrictEqual(saved);
  return decoded.state;
}

it('never robs at the exact post-levy safe amount against the same funded route', () => {
  const atSafe = make();
  atSafe.player.purse.moneyMilli = 19913;
  atSafe.player.purse.levyPercent = 5;
  const below = structuredClone(atSafe);
  below.player.purse.moneyMilli--;
  const control = close(below), exact = close(atSafe);
  expect(exact.next.city.society!.order.security).toBe(25);
  expect(exact.report.purse).toStrictEqual({
    levyPercent: 5, levyDueMilli: 1337, levyPaidMilli: 1337, donationsMilli: 0,
    donationGoldMilli: 0, moneyAfterMilli: 21250,
  });
  expect(exact.next.player.purse).toStrictEqual({
    moneyMilli: 21250, levyPercent: 5, donatedThisWeekMilli: 0, robbery: null,
  });
  expect(exact).toStrictEqual({
    ...control, next: { ...control.next, player: { ...control.next.player, purse: exact.next.player.purse } },
    report: { ...control.report, purse: exact.report.purse },
  });
});

it('leaves Easy unrobbed at the exact doubled post-levy safe amount', () => {
  const exact = make(40, 'easy');
  exact.player.purse.moneyMilli = 39646;
  exact.player.purse.levyPercent = 5;
  const below = structuredClone(exact);
  below.player.purse.moneyMilli--;
  const result = close(exact);
  expect(result.next.city.society!.order.security).toBe(25);
  expect(result.report.purse).toStrictEqual({
    levyPercent: 5, levyDueMilli: 1427, levyPaidMilli: 1427, donationsMilli: 0,
    donationGoldMilli: 0, moneyAfterMilli: 42500,
  });
  expect(result.next.player.purse).toStrictEqual({
    moneyMilli: 42500, levyPercent: 5, donatedThisWeekMilli: 0, robbery: null,
  });
  const control = close(below);
  expect(result).toStrictEqual({
    ...control, next: { ...control.next, player: { ...control.next.player, purse: result.next.player.purse } },
    report: { ...control.report, purse: result.report.purse },
  });
});

it('floors fractional exposure and caps the exact basis-point calculation', () => {
  expect([homeRobberyChanceBps(0), homeRobberyChanceBps(8), homeRobberyChanceBps(9),
    homeRobberyChanceBps(20833), homeRobberyChanceBps(20834), homeRobberyChanceBps(Number.MAX_SAFE_INTEGER)])
    .toStrictEqual([0, 0, 1, 2499, 2500, 2500]);
});

it.each([
  ['normal', 51338, 30088, 7522, 18052],
  ['easy', 52855, 10355, 2588, 6213],
] as const)('keeps the %s hit and exact losses across reload', (difficulty, balance, excess, ransom, loss) => {
  for (const [seed, option, outcome, debit] of [
    [40, 'pay', 'pay', ransom],
    [40, 'chase', 'chase-failure', loss],
    [93, 'chase', 'chase-success', 0],
    [40, 'let-go', 'let-go', loss],
  ] as const) {
    const s = make(seed, difficulty);
    s.player.purse.moneyMilli = 50001;
    s.player.purse.levyPercent = 5;
    const closed = close(s);
    expect(close(reload(s))).toStrictEqual(closed);
    expect(closed.report.purse?.robbery).toStrictEqual({ outcome: 'pending', excessMilli: excess });
    expect(closed.next.player.purse.robbery).toStrictEqual({ id: 'home-robbery-w1', week: 1, excessMilli: excess });
    refusal(closed.next, 'FORBIDDEN', 'Choose Plan next week to answer.', 'ANSWER_ROBBERY', { option });
    const planning = act(closed.next, 'NEXT_WEEK').next;
    refusal(planning, 'CARD_PENDING', 'Answer the robbery first.', 'END_WEEK', { expectedWeek: 2 });
    const answer = act(planning, 'ANSWER_ROBBERY', { option });
    expect(act(reload(planning), 'ANSWER_ROBBERY', { option })).toStrictEqual(answer);
    expect(answer.robberyResolution).toStrictEqual({ week: 1, outcome, excessMilli: excess, lossMilli: debit });
    const expected = structuredClone(planning);
    expected.city.revision++;
    expected.player.purse.moneyMilli = balance - debit;
    expected.player.purse.robbery = null;
    expect(answer.next).toStrictEqual(expected);
    expect(stocks(answer.next).gold).toBe(stocks(planning).gold);
    expect(close(answer.next).report.week).toBe(2);
  }
});

it('checks Money after levy and donations and then resets the donation tally', () => {
  const s = make();
  s.player.purse.moneyMilli = 20750;
  s.player.purse.levyPercent = 5;
  const donated = act(s, 'DONATE_MONEY', { amountMilli: 1000 }).next;
  const unchanged = structuredClone(s);
  stocks(unchanged).gold += 1000;
  const control = close(unchanged);
  expect(control.report.purse?.robbery).toStrictEqual({ outcome: 'pending', excessMilli: 837 });
  const result = close(donated);
  expect(result.report.purse).toStrictEqual({
    levyPercent: 5, levyDueMilli: 1337, levyPaidMilli: 1337, donationsMilli: 1000,
    donationGoldMilli: 1000, moneyAfterMilli: 21087,
  });
  expect(result.next.player.purse).toStrictEqual({ moneyMilli: 21087, levyPercent: 5, donatedThisWeekMilli: 0, robbery: null });
  expect(stocks(result.next)).toStrictEqual(stocks(control.next));
});

it('opens both cards, preserves both across checkpoint reload, and resolves crisis first', () => {
  const s = make();
  const society = s.city.society!;
  society.crisis.stage = 'warning';
  society.crisis.hungerStreak = CRISIS_TRIAL.demandHungerWeeks - 1;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 0;
  stocks(s).food = 0;
  stocks(s).wheat = 0;
  for (const id of ['field-1', 'plain-1']) {
    const building = s.city.tiles.find(tile => tile.id === id)!.building!;
    building.workers = 0;
  }
  s.player.purse.moneyMilli = 50001;
  const week = close(s);
  expect(week.report.crisis?.cardOpened).toBe('demand');
  const planning = reload(act(week.next, 'NEXT_WEEK').next);
  const card = planning.city.society!.pendingCard;
  expect(card).toStrictEqual({ id: 'crisis-demand-w2', kind: 'demand', source: 'crisis', week: 2 });
  expect(planning.player.purse.robbery?.id).toBe('home-robbery-w1');
  refusal(planning, 'CARD_PENDING', 'Answer the crisis first.', 'END_WEEK', { expectedWeek: 2 });
  refusal(planning, 'CARD_PENDING', 'Answer the crisis first.', 'ANSWER_ROBBERY', { option: 'pay' });
  const answered = reload(act(planning, 'CHOOSE_CARD_OPTION', { cardId: card!.id, option: 'refuse' }).next);
  expect(answered.player.purse.robbery).toStrictEqual(planning.player.purse.robbery);
  refusal(answered, 'CARD_PENDING', 'Answer the robbery first.', 'END_WEEK', { expectedWeek: 2 });
  expect(act(answered, 'ANSWER_ROBBERY', { option: 'pay' }).next.player.purse.robbery).toBeNull();
});

it('rejects exact invalid command shapes and unavailable chase without mutating state', () => {
  const s = make();
  refusal(s, 'UNKNOWN_CARD', 'No home robbery is pending.', 'ANSWER_ROBBERY', { option: 'pay' });
  s.player.purse = { moneyMilli: 22500, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4000 } };
  s.city.society!.order.security = 14;
  refusal(s, 'CHASE_UNAVAILABLE', 'Needs Security 15.', 'ANSWER_ROBBERY', { option: 'chase' });
  refusal(s, 'UNKNOWN_OPTION', 'Choose Pay, Chase or Let go.', 'ANSWER_ROBBERY', { option: 'send-guard' });
  refusal(s, 'INVALID_COMMAND', 'Command must contain plain data fields.', 'ANSWER_ROBBERY');
  refusal(s, 'INVALID_COMMAND', 'Command must contain plain data fields.', 'ANSWER_ROBBERY', { option: 'pay', extra: 1 });
  refusal(s, 'STALE_COMMAND', 'The purse changed. Try again.', 'ANSWER_ROBBERY', { option: 'pay', expectedRevision: -1 });
  s.city.society!.order.security = 15;
  expect(act(s, 'ANSWER_ROBBERY', { option: 'chase' }).robberyResolution)
    .toStrictEqual({ week: 1, outcome: 'chase-failure', excessMilli: 4000, lossMilli: 2400 });
});

it('preserves the exact robbery loss when a permitted Planning donation changes Money', () => {
  const s = make();
  s.player.purse = { moneyMilli: 26500, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4000 } };
  const donated = act(s, 'DONATE_MONEY', { amountMilli: 3000 }).next;
  const outcome = act(donated, 'ANSWER_ROBBERY', { option: 'let-go' });
  expect(outcome.robberyResolution).toStrictEqual({ week: 1, outcome: 'let-go', excessMilli: 4000, lossMilli: 2400 });
  expect(outcome.next.player.purse).toStrictEqual({
    moneyMilli: 21100, levyPercent: 0, donatedThisWeekMilli: 3000, robbery: null,
  });
  expect(stocks(outcome.next)).toStrictEqual(stocks(donated));
});

it.each(['DONATE_MONEY', 'BUY_ITEM', 'BUY_POTION', 'PLACE_CRAFT_ORDER'] as const)(
  'reserves exactly the outstanding excess for %s, including one milli below the boundary', type => {
    const s = make();
    const items = s.city.society!.items;
    s.city.tiles.find(tile => tile.id === 'slum-1')!.building =
      { typeId: 'drug-store', level: 1, workers: 0, enabled: true };
    items.materials['green-leaf'] = 2;
    const actions = {
      DONATE_MONEY: { fields: { amountMilli: 1000 }, cost: 1000, message: 'Not enough Money.' },
      BUY_ITEM: { fields: { offerIndex: 0 }, cost: items.market[0].priceMilli, message: 'NOT_ENOUGH_MONEY' },
      BUY_POTION: { fields: { tileId: 'slum-1', potion: 1 }, cost: 3000, message: 'NOT_ENOUGH_MONEY' },
      PLACE_CRAFT_ORDER: { fields: { tileId: 'slum-1', recipeId: 'brew-heal-potion-1' }, cost: 1000, message: 'NOT_ENOUGH_MONEY' },
    };
    const { fields, cost, message } = actions[type];
    const card = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
    s.player.purse = { moneyMilli: 3999 + cost, levyPercent: 0, donatedThisWeekMilli: 0, robbery: card };
    refusal(s, 'NOT_ENOUGH_MONEY', message, type, fields);
    s.player.purse.moneyMilli++;
    const spent = act(s, type, fields).next;
    expect(spent.player.purse).toStrictEqual({
      moneyMilli: 4000, levyPercent: 0, donatedThisWeekMilli: type === 'DONATE_MONEY' ? 1000 : 0, robbery: card,
    });
    expect(act(spent, 'ANSWER_ROBBERY', { option: 'let-go' }).robberyResolution)
      .toStrictEqual({ week: 1, outcome: 'let-go', excessMilli: 4000, lossMilli: 2400 });
    if (type === 'PLACE_CRAFT_ORDER') {
      const refund = act(spent, 'CANCEL_CRAFT_ORDER', { tileId: 'slum-1', index: 0 }).next;
      expect(refund.player.purse).toStrictEqual({
        moneyMilli: 5000, levyPercent: 0, donatedThisWeekMilli: 0, robbery: card,
      });
      expect(act(refund, 'ANSWER_ROBBERY', { option: 'let-go' }).robberyResolution)
        .toStrictEqual({ week: 1, outcome: 'let-go', excessMilli: 4000, lossMilli: 2400 });
    }
  },
);
