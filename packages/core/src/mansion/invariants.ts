import { hasWeeklyKeys } from '../domain/canonical-state.js';
import type { TileTrialState } from '../trial/types.js';
import { readDenseArray } from '../world/arrays.js';
import type { WorldNpc } from '../world/npc.js';
import { isMansionFurniture, isMansionRoomType, isRoomLevel, isSkillKey, MANSION_CATALOG } from './catalog.js';
import { isMansionBedForRoom, MANSION_TILE_ID, mansionLevel, roomBeds } from './rules.js';
import type { MansionRole, MansionRoom, MansionRoomTypeId, MansionState, PlayerNeeds } from './types.js';

export function isPlayerNeeds(raw: unknown): raw is PlayerNeeds {
  return hasWeeklyKeys(raw, ['lust', 'arousal', 'graceEndsWeek', 'trainingSkill']) &&
    [raw.lust, raw.arousal].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) &&
    typeof raw.graceEndsWeek === 'number' && Number.isSafeInteger(raw.graceEndsWeek) && raw.graceEndsWeek >= 1 &&
    (raw.trainingSkill === null || isSkillKey(raw.trainingSkill));
}

function isRoom(raw: unknown): raw is MansionRoom {
  if (!hasWeeklyKeys(raw, ['id', 'typeId', 'level', 'furniture']) || typeof raw.id !== 'string' ||
      !/^room-[1-9]\d*$/.test(raw.id) || !isMansionRoomType(raw.typeId) || !isRoomLevel(raw.level)) return false;
  const furniture = readDenseArray(raw.furniture);
  if (!furniture || !furniture.every(isMansionFurniture)) return false;
  const typeId = raw.typeId;
  const furnishings = furniture.filter(id => !MANSION_CATALOG.furniture[id].addsBed);
  if (furniture.some(id => MANSION_CATALOG.furniture[id].addsBed && !isMansionBedForRoom(id, typeId))) return false;
  const type = MANSION_CATALOG.roomTypes[typeId];
  return furniture.length - furnishings.length <= type.maxSingleBeds &&
    furnishings.length <= type.furnitureSlots[raw.level - 1] && furnishings.length === new Set(furnishings).size;
}

export function isMansionStructure(raw: unknown): raw is MansionState {
  if (!hasWeeklyKeys(raw, ['rooms', 'nextRoomSeq']) || typeof raw.nextRoomSeq !== 'number' ||
      !Number.isSafeInteger(raw.nextRoomSeq)) return false;
  const rooms = readDenseArray(raw.rooms);
  if (!rooms || !rooms.every(isRoom)) return false;
  const roomsById = new Map<string, MansionRoom>();
  for (const room of rooms) {
    if (roomsById.has(room.id) || Number(room.id.slice(5)) >= raw.nextRoomSeq) return false;
    roomsById.set(room.id, room);
  }
  return Object.entries(MANSION_CATALOG.roomTypes).every(([typeId, type]) =>
    type.starter === null || roomsById.get('room-' + type.starter)?.typeId === typeId);
}

export function isMansionState(raw: unknown, city: TileTrialState, npcs: readonly WorldNpc[]): raw is MansionState {
  if (!isMansionStructure(raw)) return false;
  const level = mansionLevel(city);
  // City-only simulations can omit the estate. Planning saves require it.
  const roomCountLevel = level ?? 1;
  const roomsById = new Map<string, MansionRoom>(), counts = new Map<MansionRoomTypeId, number>();
  for (const room of raw.rooms) {
    const type = MANSION_CATALOG.roomTypes[room.typeId];
    const count = (counts.get(room.typeId) ?? 0) + 1;
    if (type.unlockLevel > roomCountLevel || count > type.maxCount[roomCountLevel - 1]) return false;
    counts.set(room.typeId, count);
    roomsById.set(room.id, room);
  }
  const occupants = new Map<string, number>(), roles = new Map<MansionRole, number>();
  for (const { household } of npcs) {
    if (household.home !== MANSION_TILE_ID) {
      if (household.room !== null || household.role !== null) return false;
      continue;
    }
    const room = household.room === null ? undefined : roomsById.get(household.room);
    if (!level || !room) return false;
    const used = (occupants.get(room.id) ?? 0) + 1;
    if (used > roomBeds(room)) return false;
    occupants.set(room.id, used);
    const role = household.role;
    const { suiteRoles } = MANSION_CATALOG.roomTypes[room.typeId];
    if (suiteRoles !== null && (role === null || !suiteRoles.includes(role))) return false;
    if (role !== null) {
      const count = (roles.get(role) ?? 0) + 1, cap = MANSION_CATALOG.roles[role].cap;
      if (cap !== null && count > cap) return false;
      roles.set(role, count);
    }
  }
  return true;
}
