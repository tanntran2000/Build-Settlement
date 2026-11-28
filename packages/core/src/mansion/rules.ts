import type { TileTrialState } from '../trial/types.js';
import type { WorldNpc } from '../world/npc.js';
import { homeBeds } from '../world/npc-household.js';
import { MANSION_CATALOG } from './catalog.js';
import type { MansionRoom, MansionState, PlayerNeeds, RoomLevel } from './types.js';

export const MANSION_TILE_ID = 'estate-1';

export function createMansionState(): MansionState {
  return {
    rooms: [
      { id: 'room-1', typeId: 'master-suite', level: 1, furniture: [] },
      { id: 'room-2', typeId: 'throne-room', level: 1, furniture: [] },
    ],
    nextRoomSeq: 3,
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
  return room.typeId === 'bedroom' ? beds + room.furniture.filter(id => id === 'single-bed').length : beds;
}

export function mansionResidents(state: { npcs: readonly WorldNpc[] }): WorldNpc[] {
  return state.npcs.filter(npc => npc.household.home === MANSION_TILE_ID);
}

export function roomOccupancy(npcs: readonly WorldNpc[], roomId: string): number {
  return npcs.filter(npc => npc.household.room === roomId).length;
}

export function canMoveToMansionRoom(city: TileTrialState, npcs: readonly WorldNpc[], npc: WorldNpc, room: MansionRoom) {
  if (room.typeId === 'master-suite' && !MANSION_CATALOG.roomTypes['master-suite'].fitRoles.some(role => npc.household.role === role)) return 'SUITE_ROLE_ONLY';
  if (npc.household.home !== MANSION_TILE_ID && mansionResidents({ npcs }).length >= homeBeds(city, MANSION_TILE_ID)) return 'MANSION_FULL';
  const occupiedByOthers = roomOccupancy(npcs, room.id) - Number(npc.household.room === room.id);
  return occupiedByOthers >= roomBeds(room) ? 'ROOM_FULL' : null;
}

export function mansionRecruitment(city: TileTrialState, npcs: readonly WorldNpc[]) {
  let firstRoomId: string | null = null;
  let free = 0;
  for (const room of city.society?.mansion.rooms ?? []) {
    if (room.typeId === 'master-suite') continue;
    const space = Math.max(0, roomBeds(room) - roomOccupancy(npcs, room.id));
    if (space > 0 && firstRoomId === null) firstRoomId = room.id;
    free += space;
  }
  free = Math.max(0, Math.min(free, homeBeds(city, MANSION_TILE_ID) - mansionResidents({ npcs }).length));
  return { free, roomId: free > 0 ? firstRoomId : null };
}
