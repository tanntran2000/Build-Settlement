import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { NPC_TEST_KEYS, seedFixtureMansionBeds, withNpcs } from '@haven/core/testing/npcs';
import { executeCharacterLifeCommand } from '@haven/simulation';
import * as view from '../mansion-view.js';
import { homeRobberyOptions } from '../purse-view.js';
import { reportLetters } from '../report-letters.js';

function state() {
  const made = createCharacterLifeSession(42, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
  if (!made.success) throw Error(made.error.message);
  return made.value;
}

it('labels the fit rooms and derives the same capped role reason as dispatch', () => {
  const s = withNpcs(state(), NPC_TEST_KEYS.slice(0, 2));
  seedFixtureMansionBeds(s.city);
  for (const { household } of s.npcs) Object.assign(household, { home: 'estate-1', room: 'room-3' });
  s.npcs[0].household.role = 'head-maid';
  expect(view.mansionRoleOptions).toBeTypeOf('function');
  expect(view.mansionRoleOptions(s.city, s.npcs, s.npcs[1])).toStrictEqual([
    { role: null, name: 'None', fitRoom: null, reason: '' },
    { role: 'maid', name: 'Maid', fitRoom: "Maids' Quarters", reason: '' },
    { role: 'head-maid', name: 'Head Maid', fitRoom: "Maids' Quarters", reason: 'That Mansion role is full.' },
    { role: 'guard', name: 'Guard', fitRoom: 'Guard Quarters', reason: '' },
    { role: 'captain', name: 'Captain', fitRoom: 'Guard Quarters', reason: '' },
    { role: 'accountant', name: 'Accountant', fitRoom: 'Vault', reason: '' },
  ]);
  expect(executeCharacterLifeCommand(s, {
    type: 'SET_ROLE', expectedRevision: s.city.revision, npcId: s.npcs[1].character.id, role: 'head-maid',
  })).toStrictEqual({ success: false, error: { code: 'ROLE_CAP', message: 'That Mansion role is full.' } });
});

it('shows exact neutral Comfort, Gold upkeep and Money safe amount breakdowns', () => {
  const { city, npcs } = state();
  expect(view.mansionView(city, npcs).summary).toStrictEqual({
    comfort: '0 / 0',
    upkeep: [
      { label: 'Mansion building', value: '2 Gold' },
      { label: 'Total due', value: '2 Gold' },
    ],
    safeAmount: [
      { label: 'Security and difficulty', value: '22.5 Money' },
      { label: 'Guards', value: '0 Money' }, { label: 'Captain', value: '0 Money' },
      { label: 'Vault', value: '0 Money' }, { label: 'Accountant', value: '0 Money' },
      { label: 'Total safe', value: '22.5 Money' },
    ],
  });
});

it('reserves one exact Mansion row on the Steward letter even with no occupants', () => {
  const s = state();
  const result = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: 1 });
  if (!result.success || !result.report) throw Error('Missing End Week report.');
  const rows = reportLetters(result.report).find(letter => letter.id === 'steward')!.rows;
  expect(rows.find(row => row.label === 'Mansion'))
    .toStrictEqual({ label: 'Mansion', value: 'Comfort 0 / 0 · Upkeep 2 Gold paid · Authority +0', tone: 'muted' });
  expect(rows.length).toBeLessThanOrEqual(4);
});

it('itemizes both upgraded rooms in the Homes upkeep breakdown', () => {
  const { city, npcs } = state();
  city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = 3;
  const [suite, throne] = city.society!.mansion.rooms;
  suite.level = 2;
  throne.level = 3;
  expect(view.mansionView(city, npcs).summary?.upkeep).toStrictEqual([
    { label: 'Mansion building', value: '6 Gold' },
    { label: 'Master Suite · Level 2 (room-1)', value: '0.1 Gold' },
    { label: 'Throne Room · Level 3 (room-2)', value: '0.2 Gold' },
    { label: 'Total due', value: '6.3 Gold' },
  ]);
});

it('shows Pay, Chase and Let go loss with the same live Vault cap as the command', () => {
  const purse = { moneyMilli: 20000, levyPercent: 0, donatedThisWeekMilli: 0, robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 10000 } };
  const effects = { safeAmount: { guard: 0, captain: 0, vault: 1500, accountant: 0 }, chaseSuccessBps: 0,
    robberyChanceBps: 0, vaultLossCapBps: 4000 };
  expect(homeRobberyOptions(purse, 30, false, effects)).toStrictEqual([
    { option: 'pay', label: 'Pay', lossMilli: 2500, reason: '' },
    { option: 'chase', label: 'Chase', lossMilli: 4000, reason: '' },
    { option: 'let-go', label: 'Let go', lossMilli: 4000, reason: '' },
  ]);
});
