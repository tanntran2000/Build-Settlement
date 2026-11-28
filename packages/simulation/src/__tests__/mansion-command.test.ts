import { expect, it } from 'vitest';
import { acquisitionNpc, createMansionState, emptyAcquisition, type CharacterLifeSessionState, type MansionRoom } from '@haven/core';
import { NPC_TEST_KEYS, seedFixtureMansionBeds, withNpcs } from '@haven/core/testing/npcs';
import { command, populate, stock, town as seededTown } from './acquisition-fixture.js';

function town() {
  const state = seededTown();
  state.city.society!.mansion = createMansionState();
  return state;
}

function success(state: CharacterLifeSessionState, type: string, fields: Record<string, unknown>) {
  const result = command(state, type, fields);
  if (!result.success) throw Error(result.error.code + ': ' + result.error.message);
  return result.next;
}
function refuses(state: CharacterLifeSessionState, type: string, fields: Record<string, unknown>, code: string) {
  const before = structuredClone(state);
  expect(command(state, type, fields)).toMatchObject({ success: false, error: { code } });
  expect(state).toEqual(before);
}
function addRoom(state: CharacterLifeSessionState, typeId: MansionRoom['typeId'], level: MansionRoom['level'] = 1) {
  const mansion = state.city.society!.mansion;
  const room = { id: 'room-' + mansion.nextRoomSeq++, typeId, level, furniture: [] };
  mansion.rooms.push(room);
  return room.id;
}
function household() {
  const state = withNpcs(town(), NPC_TEST_KEYS.slice(0, 2));
  seedFixtureMansionBeds(state.city);
  return state;
}

it('unlocks Guard Quarters with Mansion level 2 and charges all three resources', () => {
  const state = town(), fields = { typeId: 'guard-quarters' };
  refuses(state, 'BUILD_ROOM', fields, 'ROOM_LOCKED');
  state.city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = 2;
  const before = structuredClone(stock(state));
  const next = success(state, 'BUILD_ROOM', fields);
  expect(next.city.society!.mansion.rooms.at(-1)).toEqual({ id: 'room-3', typeId: 'guard-quarters', level: 1, furniture: [] });
  expect(stock(next)).toEqual({ ...before, gold: before.gold - 1000, wood: before.wood - 250, iron: before.iron - 100 });
  expect(stock(state)).toEqual(before);
});

it.each([['gold', 'NOT_ENOUGH_GOLD'], ['wood', 'INSUFFICIENT_RESOURCES'], ['iron', 'INSUFFICIENT_RESOURCES']] as const)('refuses when there is no %s', (resource, code) => {
  const state = town();
  stock(state)[resource] = 0;
  refuses(state, 'BUILD_ROOM', { typeId: 'bedroom' }, code);
});

it('refuses a third Bedroom at Mansion level 1', () => {
  const state = town();
  addRoom(state, 'bedroom');
  addRoom(state, 'bedroom');
  refuses(state, 'BUILD_ROOM', { typeId: 'bedroom' }, 'ROOM_LIMIT');
});

it('upgrades a Bedroom, charges level costs, and refuses level 4', () => {
  const state = town(), roomId = addRoom(state, 'bedroom');
  const before = structuredClone(stock(state));
  const second = success(state, 'UPGRADE_ROOM', { roomId });
  expect(second.city.society!.mansion.rooms.at(-1)?.level).toBe(2);
  expect(stock(second)).toEqual({ ...before, gold: before.gold - 2000, wood: before.wood - 500, iron: before.iron - 200 });
  const third = success(second, 'UPGRADE_ROOM', { roomId });
  refuses(third, 'UPGRADE_ROOM', { roomId }, 'ROOM_MAX_LEVEL');
});

it('requires a room on Mansion entry, clears the post, and clears the household fields on exit', () => {
  const state = household(), npcId = state.npcs[0].character.id;
  state.npcs[0].postTileId = 'field-1';
  const fields = { npcId, homeTileId: 'estate-1' };
  refuses(state, 'MOVE_NPC_HOME', fields, 'INVALID_COMMAND');
  refuses(state, 'MOVE_NPC_HOME', { ...fields, roomId: 'room-1' }, 'SUITE_ROLE_ONLY');
  const inMansion = success(state, 'MOVE_NPC_HOME', { ...fields, roomId: 'room-3' });
  expect(inMansion.npcs[0].postTileId).toBeNull();
  expect(inMansion.npcs[0].household).toMatchObject({ home: 'estate-1', room: 'room-3' });
  inMansion.npcs[0].household.role = 'maid';
  inMansion.npcs[0].household.training = 'management';
  const exit = success(inMansion, 'MOVE_NPC_HOME', { npcId, homeTileId: 'estate-2' });
  expect(exit.npcs[0].household).toMatchObject({ home: 'estate-2', room: null, role: null, training: null });
});

it('counts the moving NPC once when keeping a full room and refuses another occupant', () => {
  const state = household();
  const roomId = addRoom(state, 'bedroom');
  const [first, second] = state.npcs.map(npc => npc.character.id);
  const entry = success(state, 'MOVE_NPC_HOME', { npcId: first, homeTileId: 'estate-1', roomId });
  const moved = success(entry, 'MOVE_TO_ROOM', { npcId: first, roomId });
  expect(moved.npcs[0].household.room).toBe(roomId);
  refuses(moved, 'MOVE_NPC_HOME', { npcId: second, homeTileId: 'estate-1', roomId }, 'ROOM_FULL');
  const inMansion = success(moved, 'MOVE_NPC_HOME', { npcId: second, homeTileId: 'estate-1', roomId: 'room-3' });
  refuses(inMansion, 'MOVE_TO_ROOM', { npcId: second, roomId: 'room-1' }, 'SUITE_ROLE_ONLY');
  refuses(inMansion, 'MOVE_TO_ROOM', { npcId: second, roomId }, 'ROOM_FULL');
});

it('refuses a Hall resident entering a full Mansion with an unused Bedroom', () => {
  const state = town();
  populate(state, [...Array<string>(10).fill('estate-1'), 'estate-2']);
  state.city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = 1;
  const roomId = addRoom(state, 'bedroom'), npcId = state.npcs.at(-1)!.character.id;
  refuses(state, 'MOVE_NPC_HOME', { npcId, homeTileId: 'estate-1', roomId }, 'MANSION_FULL');
});

it('transfers one of 100 residents and refuses commands against a 101-NPC roster', () => {
  const state = town();
  const homes = [...Array<string>(29).fill('estate-1'), ...Array<string>(50).fill('estate-2'), ...Array<string>(21).fill('house-5')];
  populate(state, homes);
  const roomId = addRoom(state, 'bedroom'), npcId = state.npcs.at(-1)!.character.id;
  const fields = { npcId, homeTileId: 'estate-1', roomId };
  expect(success(state, 'MOVE_NPC_HOME', fields).npcs).toHaveLength(100);
  const oversized = town();
  populate(oversized, [...homes, 'house-5']);
  addRoom(oversized, 'bedroom');
  refuses(oversized, 'MOVE_NPC_HOME', fields, 'INVALID_STATE');
});

it('recruits into the first available furnished Mansion bed and keeps the existing payload', () => {
  const state = success(town(), 'BUILD', { tileId: 'service-1', typeId: 'guild' });
  const fields = { source: 'guild', slot: 0, homeTileId: 'estate-1' };
  refuses(state, 'BUY_NPC', fields, 'NO_BED');
  const roomId = addRoom(state, 'bedroom');
  addRoom(state, 'maids-quarters');
  const bought = success(state, 'BUY_NPC', fields);
  expect(bought.npcs[0].household.room).toBe(roomId);
  expect(success(bought, 'BUY_NPC', { ...fields, slot: 1 }).npcs[1].household.room).toBe('room-4');
});

it('processes a loaded died departure when resolving the week', () => {
  const state = town();
  const { npc } = acquisitionNpc(state.outside.seed, 1, 'guild', 0, 0);
  state.city.world.week = 2;
  state.city.society!.acquisition = { ...emptyAcquisition(), week: 2, departures: [{ kind: 'died', id: npc.character.id, name: npc.character.name }] };
  expect(command(state, 'END_WEEK', { expectedWeek: 2 }).success).toBe(true);
});
