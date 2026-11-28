import { expect, it } from 'vitest';
import * as core from '../../index.js';
import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';

function newGame() {
  const made = core.createCharacterLifeSession(42, { ...core.DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
  if (!made.success) throw Error(made.error.message);
  return made.value;
}

it('starts v15 with two empty rooms and eight weeks of grace', () => {
  const state = newGame();
  expect(state.city.society!.rulesetId).toBe('tile-society-15');
  expect(state.city.society!.mansion).toEqual({
    rooms: [
      { id: 'room-1', typeId: 'master-suite', level: 1, furniture: [] },
      { id: 'room-2', typeId: 'throne-room', level: 1, furniture: [] },
    ],
    nextRoomSeq: 3,
  });
  expect(state.player.needs).toEqual({ lust: 0, arousal: 0, graceEndsWeek: state.city.world.week + 8, trainingSkill: null });
});

function bedroom() {
  const state = withNpcs(newGame(), NPC_TEST_KEYS);
  expect(state.city.society!.rulesetId).toBe('tile-society-15');
  const room: core.MansionRoom = { id: 'room-3', typeId: 'bedroom', level: 1, furniture: ['single-bed', 'single-bed', 'single-bed', 'bookshelf', 'armchair'] };
  state.city.society!.mansion.rooms.push(room);
  state.city.society!.mansion.nextRoomSeq = 4;
  for (const { household } of state.npcs) {
    household.home = 'estate-1';
    household.room = room.id;
  }
  expect(core.isCharacterLifeSessionState(state)).toBe(true);
  return { state, room };
}

it('keeps bed capacity independent of furnishing slots and round-trips exact bytes', () => {
  const { state, room } = bedroom();
  expect(core.roomBeds(room)).toBe(4);
  const save = serializeCharacterLifeSave(state);
  if (!save.success) throw Error(save.error.message);
  const load = deserializeCharacterLifeSave(save.text);
  if (!load.success) throw Error(load.error.message);
  expect(serializeCharacterLifeSave(load.state)).toEqual(save);
});

it.each(['hall-with-room', 'estate-without-room', 'unknown-room', 'too-many-residents', 'too-many-beds', 'too-many-furnishings', 'two-wives', 'needs-out-of-range'])('rejects %s in v15', problem => {
  const { state, room } = bedroom();
  const household = state.npcs[0].household;
  if (problem === 'hall-with-room') household.home = 'estate-2';
  if (problem === 'estate-without-room') household.room = null;
  if (problem === 'unknown-room') household.room = 'room-99';
  if (problem === 'too-many-residents') room.furniture = [];
  if (problem === 'too-many-beds') room.furniture.push('single-bed');
  if (problem === 'too-many-furnishings') room.furniture.push('sofa');
  if (problem === 'two-wives') household.role = state.npcs[1].household.role = 'wife';
  if (problem === 'needs-out-of-range') state.player.needs.lust = 101;
  expect(core.isCharacterLifeSessionState(state)).toBe(false);
});

it('rejects five Concubines in a valid Maids’ Quarters placement', () => {
  const state = newGame();
  expect(state.city.society!.rulesetId).toBe('tile-society-15');
  const history = Array.from({ length: 5 }, (_, i) => ({ week: i + 1, source: 'guild' as const, slot: 0 as const }));
  state.city.world.week = 9;
  const populated = withNpcs(state, history);
  populated.city.society!.mansion.rooms.push({ id: 'room-3', typeId: 'maids-quarters', level: 1, furniture: [] });
  populated.city.society!.mansion.nextRoomSeq = 4;
  for (const { household } of populated.npcs) Object.assign(household, { home: 'estate-1', room: 'room-3', role: 'concubine' });
  expect(core.isCharacterLifeSessionState(populated)).toBe(false);
  populated.npcs[0].household.role = null;
  expect(core.isCharacterLifeSessionState(populated)).toBe(true);
});

it.each(['guild', 'auction-house', 'slave-market'] as const)('accepts a proven died departure from %s', source => {
  const state = newGame();
  const { npc } = core.acquisitionNpc(state.outside.seed, 1, source, 0, 0);
  state.city.world.week = 2;
  state.city.society!.acquisition = { ...core.emptyAcquisition(), week: 2, departures: [{ kind: 'died', id: npc.character.id, name: npc.character.name }] };
  expect(core.isCharacterLifeSessionState(state)).toBe(true);
});
