import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { NPC_TEST_KEYS, seedFixtureMansionBeds, withNpcs } from '@haven/core/testing/npcs';
import * as view from '../mansion-view.js';

function state() {
  const made = createCharacterLifeSession(42, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
  if (!made.success) throw Error(made.error.message);
  return withNpcs(made.value, NPC_TEST_KEYS.slice(0, 1));
}

it('shows room levels, beds, and residents from the saved assignment', () => {
  expect(view.mansionView).toBeTypeOf('function');
  const { city, npcs } = state();
  seedFixtureMansionBeds(city);
  Object.assign(npcs[0].household, { home: 'estate-1', room: 'room-3' });
  const ledger = view.mansionView(city, npcs);
  expect(ledger.rooms.map(({ name, level, beds, residents }) => [name, level, beds, residents.length]))
    .toEqual([['Master Suite', 1, 5, 0], ['Throne Room', 1, 0, 0], ["Maids' Quarters", 1, 10, 1]]);
});

it('describes unavailable build, upgrade and room moves', () => {
  expect(view.mansionView).toBeTypeOf('function');
  const { city, npcs } = state();
  seedFixtureMansionBeds(city);
  const planning = view.mansionView(city, npcs);
  expect(planning.builds.find(row => row.id === 'guard-quarters')?.reason).toBe('Needs Mansion level 2');
  expect(planning.rooms[0].upgradeCost).toBe('2 Gold · 0.5 Wood · 0.2 Iron');
  expect(view.mansionRoomChoices(city, npcs, npcs[0]).map(row => [row.id, row.reason])).toEqual([
    ['room-1', 'The Master Suite requires a Wife, Concubine or Fucktoy.'],
    ['room-2', 'That room has no free bed.'],
    ['room-3', ''],
  ]);
  city.phase = 'report';
  expect(view.mansionView(city, npcs).rooms[0].upgradeReason).toBe('Plan next week to upgrade rooms.');
});
