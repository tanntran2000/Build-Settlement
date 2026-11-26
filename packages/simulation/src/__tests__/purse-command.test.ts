import { expect, it, vi } from 'vitest';
import {
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type CharacterLifeSessionState, type DifficultyId,
} from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';

vi.mock('../../../core/src/data/tuning.json', async importOriginal => {
  const { default: tuning } = await importOriginal<{ default: typeof import('../../../core/src/data/tuning.json') }>();
  if (!Object.hasOwn(tuning.PURSE_TRIAL, 'levyFreePercent')) return { default: tuning };
  return { default: { ...tuning, PURSE_TRIAL: {
    ...tuning.PURSE_TRIAL, donateSatisfactionPerGoldMilli: 0.001, donateSatisfactionCapPerWeek: 2,
  } } };
});

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

it.each([21, 2.5, -1, '5', Infinity])('refuses levy %s without mutation', percent => {
  const s = make(), before = structuredClone(s);
  expect(dispatch(s, 'SET_LEVY', { percent })).toMatchObject({ success: false, error: { code: 'INVALID_AMOUNT' } });
  expect(s).toStrictEqual(before);
});

it.each([[0, 'INVALID_AMOUNT'], [1500, 'INVALID_AMOUNT'], [3000, 'NOT_ENOUGH_MONEY']] as const)(
  'refuses donation %i without mutation', (amountMilli, code) => {
    const s = make(), before = structuredClone(s);
    expect(dispatch(s, 'DONATE_MONEY', { amountMilli })).toMatchObject({ success: false, error: { code } });
    expect(s).toStrictEqual(before);
  },
);

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

it.each([2, 5, 10, 20].flatMap(percent => (['normal', 'easy'] as const).map(difficulty => ({ percent, difficulty }))))(
  'returning the whole levy at percent $percent in $difficulty creates no Gold or Happiness', async ({ percent, difficulty }) => {
  const initial = make(difficulty), levied = act(initial, 'SET_LEVY', { percent }).next;
  const resolved = act(levied, 'END_WEEK', { expectedWeek: 1 }).next;
  // Exercise a wholly donatable receipt even when the seeded week's actual receipt is fractional.
  const withExactLevy = structuredClone(resolved);
  withExactLevy.player.purse.moneyMilli = 0;
  const stockBefore = stock(withExactLevy).gold;
  const { runLevyWeek } = await import('../purse-week.js');
  const receipt = runLevyWeek(withExactLevy, 100000).moneyAfterMilli;
  const planning = act(withExactLevy, 'NEXT_WEEK').next;
  const donated = act(planning, 'DONATE_MONEY', { amountMilli: receipt }).next;
  expect(stock(donated).gold).toBe(stockBefore);
  expect(donated.city.happiness).toBe(planning.city.happiness);
  const zero = act(donated, 'SET_LEVY', { percent: 0 }).next;
  const unlevied = act(zero, 'END_WEEK', { expectedWeek: 2 }).next;
  const closed = act(donated, 'END_WEEK', { expectedWeek: 2 }).next;
  expect(closed.city.happiness).toBeLessThanOrEqual(unlevied.city.happiness);
  if (percent === 2) expect(closed.city.society!.satisfaction).toStrictEqual(unlevied.city.society!.satisfaction);
});

it.each([['normal', 2], ['easy', 1]] as const)('offsets the levy at End Week using capped credited Gold in %s, including after save and reload', (difficulty, offset) => {
  const s = act(make(difficulty), 'SET_LEVY', { percent: 5 }).next;
  s.player.purse.moneyMilli = 3000;
  const first = act(s, 'DONATE_MONEY', { amountMilli: 1000 }).next;
  const saved = serializeCharacterLifeSave(first);
  if (!saved.success) throw Error(saved.error.message);
  const loaded = deserializeCharacterLifeSave(saved.text);
  if (!loaded.success) throw Error(loaded.error.message);
  const donated = act(loaded.state, 'DONATE_MONEY', { amountMilli: 2000 }).next;
  expect(donated.player.purse.donatedThisWeekMilli).toBe(3000);
  expect(donated.city.society!.satisfaction).toStrictEqual(s.city.society!.satisfaction);
  const control = structuredClone(donated);
  control.player.purse.donatedThisWeekMilli = 0;
  const regular = act(control, 'END_WEEK', { expectedWeek: 1 }).next;
  const offsetWeek = act(donated, 'END_WEEK', { expectedWeek: 1 }).next;
  for (const key of ['free', 'makers', 'luminaries', 'merchants'] as const)
    expect(offsetWeek.city.society!.satisfaction[key]).toBe(regular.city.society!.satisfaction[key] + offset);
  expect(offsetWeek.city.society!.satisfaction.bound).toBe(regular.city.society!.satisfaction.bound);
});

it('keeps NPC acquisition on Gold even when the Player has Money', () => {
  const s = make();
  s.player.purse.moneyMilli = 15000;
  const guild = act(s, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  const { next } = act(guild, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId: 'estate-2' });
  expect(next.npcs).toHaveLength(1);
  expect(stock(next).gold).toBeLessThan(stock(guild).gold);
  expect(next.player.purse).toStrictEqual(guild.player.purse);
});
