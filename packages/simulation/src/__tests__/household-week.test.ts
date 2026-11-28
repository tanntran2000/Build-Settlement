import { expect, it, vi } from 'vitest';
import {
  emptyHouseholdReport, isCharacterLifeSessionState, P7B_TRIAL, type CharacterLifeSessionState,
} from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { payNpcWages, runHouseholdWeek } from '../household-week.js';
import { command, stock, succeeded, town } from './acquisition-fixture.js';

// Keep the original balance inputs for the budget where wages, tile operations and only one home can be paid.
vi.mock('../../../core/src/data/tuning.json', async load => {
  const { legacyEconomyTuning } = await import('./fixtures/legacy-economy.js');
  return legacyEconomyTuning(load);
});

function recruit(count = 1) {
  let session = succeeded(town(), 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  for (let slot = 0; slot < count; slot++) {
    session = succeeded(session, 'BUY_NPC', { source: 'guild', slot, homeTileId: 'estate-2' }).next;
  }
  return session;
}

const end = (s: CharacterLifeSessionState) => succeeded(s, 'END_WEEK', { expectedWeek: s.city.world.week });
const answer = (s: CharacterLifeSessionState, choice: string) => command(s, 'ANSWER_NOTICE', { npcId: s.npcs[0].character.id, choice });

function roundTrip(s: CharacterLifeSessionState) {
  expect(isCharacterLifeSessionState(s)).toBe(true);
  const encoded = serializeCharacterLifeSave(s);
  if (!encoded.success) throw Error(encoded.error.message);
  expect(deserializeCharacterLifeSave(encoded.text)).toStrictEqual({ success: true, state: s });
  expect(JSON.parse(encoded.text).cityRulesetId).toBe('tile-society-15');
}

it('pays in NPC order before tile operations and home upkeep, clamps unpaid stats, and preserves input', () => {
  const state = recruit(2);
  stock(state).gold = 2000;
  for (const npc of state.npcs) npc.household.contract!.wageMilli = 2000;
  const second = state.npcs[1];
  second.household.obedience = 4;
  second.character.relationshipToPlayer.affection = 4;
  const before = JSON.stringify(state), wages = payNpcWages(state);
  expect(stock(wages.session).gold).toBe(0);
  expect(wages.report).toStrictEqual({ wagesPaidMilli: 2000, unpaid: [second.character.name] });
  expect(wages.session.npcs.map(npc => npc.household.contract!.unpaidWeeks)).toStrictEqual([0, 1]);
  expect(wages.session.npcs[1].household.obedience).toBe(0);
  expect(wages.session.npcs[1].character.relationshipToPlayer.affection).toBe(0);
  const result = end(state);
  expect(result.report?.before.gold).toBe(2000);
  expect(result.report?.after.gold).toBe(stock(result.next).gold);
  expect(result.report?.household).toStrictEqual({
    ...emptyHouseholdReport(), bought: state.npcs.map(npc => npc.character.name), wagesPaidMilli: 2000, unpaid: [second.character.name],
  });
  expect(result.report?.householdUpkeep).toStrictEqual({ paidMilli: 1000, unpaidMilli: 2000 });
  expect(JSON.stringify(state)).toBe(before);
});

it.each([
  [2, 0, 'renewal'], [3, 0, null], [0, 2, 'renewal'], [0, 3, null],
] as const)('at 1 → 0, unpaid %s and stress hits %s determine renewal', (unpaidWeeks, stressHits, notice) => {
  const state = recruit(), npc = state.npcs[0];
  const { name } = npc.character;
  Object.assign(npc.household.contract!, { weeksLeft: 1, unpaidWeeks, stressHits });
  const result = end(state);
  expect(result.next.npcs.map(n => n.household.contract?.weeksLeft)).toStrictEqual(notice ? [0] : []);
  expect(result.next.npcs.map(n => n.household.notice)).toStrictEqual(notice ? [notice] : []);
  expect(result.report?.household?.notices).toStrictEqual(notice ? [name] : []);
  expect(result.report?.household?.left).toStrictEqual(notice ? [] : [name]);
  expect(result.next.profiles.length).toBe(notice ? 1 : 0);
  roundTrip(succeeded(result.next, 'NEXT_WEEK').next);
});

it('counts reaching 100 once but applies -2 obedience on each week ending at 100', () => {
  const npc = recruit().npcs[0];
  npc.household.obedience = 10;
  npc.life.stress = 100;
  const opening = structuredClone(npc);
  opening.life.stress = 99;
  runHouseholdWeek([npc], { week: 2, opening: [opening] });
  expect([npc.household.obedience, npc.household.contract?.stressHits]).toStrictEqual([8, 1]);
  runHouseholdWeek([npc], { week: 3, opening: [structuredClone(npc)] });
  expect([npc.household.obedience, npc.household.contract?.stressHits]).toStrictEqual([6, 1]);
});

it.each([[74, 50, null], [75, 49, null], [75, 50, 'lifelong']] as const)(
  'affection %s and obedience %s determine lifelong eligibility', (affection, obedience, notice) => {
    const state = recruit(), npc = state.npcs[0];
    npc.character.relationshipToPlayer.affection = affection;
    npc.household.obedience = obedience;
    expect(end(state).next.npcs[0].household.notice).toBe(notice);
  },
);

it('runs the lifelong cooldown through week minus 10, and stamps an unanswered offer', () => {
  const npc = recruit().npcs[0];
  npc.character.relationshipToPlayer.affection = 75;
  npc.household.obedience = 50;
  npc.household.lifelongAskWeek = 2;
  runHouseholdWeek([npc], { week: 11, opening: [structuredClone(npc)] });
  expect(npc.household.notice).toBe(null);
  runHouseholdWeek([npc], { week: 12, opening: [structuredClone(npc)] });
  expect(npc.household.notice).toBe('lifelong');
  runHouseholdWeek([npc], { week: 13, opening: [structuredClone(npc)] });
  expect([npc.household.notice, npc.household.lifelongAskWeek]).toStrictEqual([null, 13]);
});

it.each([[1000, 2000], [2000, 3000]] as const)('renews 20 weeks at wage %s rounded up to %s, clears notice and counters', (previous, increased) => {
  const s = recruit(), { household, character } = s.npcs[0];
  household.contract = { weeksLeft: 0, wageMilli: previous, unpaidWeeks: 2, stressHits: 2 };
  household.notice = 'renewal';
  const renewed = succeeded(s, 'ANSWER_NOTICE', { npcId: character.id, choice: 'renew' }).next;
  expect(renewed.npcs[0].household.contract).toStrictEqual({ weeksLeft: 20, wageMilli: increased, unpaidWeeks: 0, stressHits: 0 });
  expect(renewed.npcs[0].household.notice).toBe(null);
  expect(renewed.city.revision).toBe(s.city.revision + 1);
  roundTrip(renewed);
});

it('accepts lifelong with no wage or term and declines with a current-week cooldown', () => {
  const s = recruit(), { household } = s.npcs[0];
  household.notice = 'lifelong';
  const accepted = answer(s, 'accept'), declined = answer(s, 'decline');
  if (!accepted.success || !declined.success) throw Error('Notice refusal.');
  const npc = accepted.next.npcs[0];
  expect([npc.household.status, npc.household.contract, npc.household.notice, npc.character.legalStatus])
    .toStrictEqual(['lifelong', null, null, 'contract_bound']);
  expect(payNpcWages(accepted.next).report).toStrictEqual({ wagesPaidMilli: 0, unpaid: [] });
  expect([declined.next.npcs[0].household.notice, declined.next.npcs[0].household.lifelongAskWeek]).toStrictEqual([null, s.city.world.week]);
  roundTrip(accepted.next);
});

it('adds Mansion +1 and clamps the top and bottom', () => {
  const npc = recruit().npcs[0];
  npc.household.home = 'estate-1';
  npc.household.room = 'room-3';
  npc.household.obedience = 99;
  runHouseholdWeek([npc], { week: 2, opening: [structuredClone(npc)] });
  expect(npc.household.obedience).toBe(100);
  runHouseholdWeek([npc], { week: 3, opening: [structuredClone(npc)] });
  expect(npc.household.obedience).toBe(100);
  npc.household.home = 'estate-2';
  npc.household.room = null;
  npc.life.stress = 100;
  npc.household.obedience = 1;
  runHouseholdWeek([npc], { week: 4, opening: [structuredClone(npc)] });
  expect(npc.household.obedience).toBe(0);
});

it('reports notice refusals atomically and uses B3 released for an explicit let-go', () => {
  const s = recruit(), npcId = s.npcs[0].character.id;
  expect(answer(s, 'renew')).toStrictEqual({ success: false, error: { code: 'NOTICE_MISSING', message: 'That NPC has no pending notice.' } });
  s.npcs[0].household.notice = 'renewal';
  s.npcs[0].household.contract!.weeksLeft = 0;
  const before = JSON.stringify(s);
  expect(answer(s, 'accept')).toStrictEqual({ success: false, error: { code: 'NOTICE_CHOICE', message: 'Choose a response for this notice.' } });
  expect(command(s, 'ANSWER_NOTICE', { npcId, choice: 'renew', expectedRevision: s.city.revision - 1 })).toStrictEqual({
    success: false, error: { code: 'STALE_COMMAND', message: 'The plan changed. Refresh the action before retrying.' },
  });
  expect(JSON.stringify(s)).toBe(before);
  const released = succeeded(s, 'ANSWER_NOTICE', { npcId, choice: 'release' }).next;
  expect(released.city.society?.acquisition.departures).toStrictEqual([{ kind: 'released', id: npcId, name: s.npcs[0].character.name }]);
  roundTrip(released);
});

it('keeps two term ends beside a crisis and the unanswered notices never prevent the next eligible End Week', () => {
  const s = recruit(2), society = s.city.society!;
  society.crisis.stage = 'warning';
  society.crisis.hungerStreak = 2;
  society.tension = 80;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 10;
  s.city.happiness = 10;
  stock(s).food = 0;
  for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
  for (const npc of s.npcs) npc.household.contract!.weeksLeft = 1;
  const names = s.npcs.map(npc => npc.character.name), first = end(s);
  expect(first.report?.household?.notices).toStrictEqual(names);
  const card = first.next.city.society!.pendingCard;
  if (!card) throw Error('Expected a coincident crisis card.');
  const cleared = succeeded(first.next, 'CHOOSE_CARD_OPTION', { cardId: card.id, option: 'pay' }).next;
  const planning = succeeded(cleared, 'NEXT_WEEK').next;
  expect(planning.npcs.map(npc => npc.household.notice)).toStrictEqual(['renewal', 'renewal']);
  const second = end(planning);
  expect(second.report?.household?.left).toStrictEqual(names);
  expect(second.next.npcs).toStrictEqual([]);
  expect(second.next.profiles).toStrictEqual([]);
  expect(end(structuredClone(planning))).toStrictEqual(second);
  expect(P7B_TRIAL.npcCap).toBe(100);
});
