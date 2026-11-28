import type { TileTrialState } from '../trial/types.js';
import type { WorldNpc } from '../world/npc.js';
import { homeBeds } from '../world/npc-household.js';
import { MANSION_CATALOG } from './catalog.js';
import type { MansionRoom, MansionState, PlayerNeeds, RoomLevel } from './types.js';

export const MANSION_TILE_ID = 'estate-1';

const starterTypes = Object.entries(MANSION_CATALOG.roomTypes)
  .flatMap(([typeId, type]) => type.starter === null ? [] : [{ id: 'room-' + type.starter, typeId, seq: type.starter }])
  .sort((a, b) => a.seq - b.seq);

export function createMansionState(): MansionState {
  return {
    rooms: starterTypes.map(({ id, typeId }) => ({ id, typeId, level: 1, furniture: [] })),
    nextRoomSeq: starterTypes.length + 1,
  };
}

export function createPlayerNeeds(week: number): PlayerNeeds {
  return { lust: 0, arousal: 0, graceEndsWeek: week + MANSION_CATALOG.needsGraceWeeks, trainingSkill: null };
}

export function mansionLevel(city: TileTrialState): RoomLevel | undefined {
  const building = city.tiles.find(tile => tile.id === MANSION_TILE_ID)?.building;
  return building?.typeId === 'mansion' ? building.level as RoomLevel : undefined;
}

export function roomBeds(room: MansionRoom): number {
  const { beds } = MANSION_CATALOG.roomTypes[room.typeId];
  return beds + room.furniture.filter(id => MANSION_CATALOG.furniture[id]?.addsBed).length;
}

export function mansionResidents(state: { npcs: readonly WorldNpc[] }): WorldNpc[] {
  return state.npcs.filter(npc => npc.household.home === MANSION_TILE_ID);
}

export function roomOccupancy(npcs: readonly WorldNpc[], roomId: string): number {
  return npcs.filter(npc => npc.household.room === roomId).length;
}

export function canMoveToMansionRoom(city: TileTrialState, npcs: readonly WorldNpc[], npc: WorldNpc, room: MansionRoom) {
  if (MANSION_CATALOG.roomTypes[room.typeId].suiteRoles !== null) return 'SUITE_ROLE_ONLY';
  if (npc.household.home !== MANSION_TILE_ID && mansionResidents({ npcs }).length >= homeBeds(city, MANSION_TILE_ID)) return 'MANSION_FULL';
  const occupiedByOthers = roomOccupancy(npcs, room.id) - Number(npc.household.room === room.id);
  return occupiedByOthers >= roomBeds(room) ? 'ROOM_FULL' : null;
}

export function mansionRecruitment(city: TileTrialState, npcs: readonly WorldNpc[]) {
  let firstRoomId: string | null = null;
  let free = 0;
  for (const room of city.society?.mansion.rooms ?? []) {
    if (MANSION_CATALOG.roomTypes[room.typeId].suiteRoles !== null) continue;
    const space = Math.max(0, roomBeds(room) - roomOccupancy(npcs, room.id));
    if (space > 0 && firstRoomId === null) firstRoomId = room.id;
    free += space;
  }
  free = Math.max(0, Math.min(free, homeBeds(city, MANSION_TILE_ID) - mansionResidents({ npcs }).length));
  return { free, roomId: free > 0 ? firstRoomId : null };
}
