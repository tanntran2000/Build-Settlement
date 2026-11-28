import {
  canMoveToMansionRoom, hasWeeklyKeys, isMansionRoomType, isMansionStaffRole, mansionLevel, mansionResidentRole, mansionRoleRefusal,
  MANSION_CATALOG, MANSION_ROLE_REFUSALS, MANSION_TILE_ID,
  type CharacterLifeSessionState, type NpcWorldSessionState, type RoomLevel, type WorldNpc,
} from '@haven/core';
import type { CharacterLifeCommandResult } from './character-life-command.js';
import { trialSafe } from './tile-trial-week.js';

export const MANSION_COMMAND_TYPES = ['BUILD_ROOM', 'UPGRADE_ROOM', 'MOVE_TO_ROOM', 'SET_ROLE'] as const;
export type MansionCommandType = typeof MANSION_COMMAND_TYPES[number];
export type RoomMoveErrorCode = 'INVALID_COMMAND' | 'SUITE_ROLE_ONLY' | 'MANSION_FULL' | 'ROOM_FULL';
const moveMessages = {
  SUITE_ROLE_ONLY: 'This room is closed to moves.',
  MANSION_FULL: 'The Mansion has no free bed.',
  ROOM_FULL: 'That room has no free bed.',
};
const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });

export function moveNpcToMansionRoom(state: NpcWorldSessionState, npc: WorldNpc, roomId: string): { code: RoomMoveErrorCode; message: string } | null {
  const room = state.city.society?.mansion.rooms.find(row => row.id === roomId);
  if (!room) return { code: 'INVALID_COMMAND', message: 'Select a Mansion room.' };
  const code = canMoveToMansionRoom(state.city, state.npcs, npc, room);
  if (code) return { code, message: moveMessages[code] };
  npc.household.home = MANSION_TILE_ID;
  npc.household.room = room.id;
  npc.postTileId = null;
  return null;
}

const fields = { BUILD_ROOM: ['typeId'], UPGRADE_ROOM: ['roomId'], MOVE_TO_ROOM: ['npcId', 'roomId'], SET_ROLE: ['npcId', 'role'] };

export function executeMansionCommand(state: CharacterLifeSessionState, type: MansionCommandType, raw: unknown): CharacterLifeCommandResult {
  if (!hasWeeklyKeys(raw, ['type', 'expectedRevision', ...fields[type]])) return fail('INVALID_COMMAND', 'Unknown Mansion command fields.');
  if (raw.expectedRevision !== state.city.revision) return fail('STALE_COMMAND', 'The plan changed. Refresh the action before retrying.');
  if (state.city.phase !== 'planning') return fail('FORBIDDEN', 'Read the report, then choose Plan next week.');
  try {
    const next = structuredClone(state);
    const { city } = next, mansion = city.society!.mansion;
    if (type === 'SET_ROLE') {
      const { npcId, role } = raw;
      if (typeof npcId !== 'string' || (role !== null && !isMansionStaffRole(role)))
        return fail('INVALID_COMMAND', 'Choose a Mansion staff role.');
      const npc = next.npcs.find(row => row.character.id === npcId);
      if (!npc) return fail('UNKNOWN_NPC', 'Select a known NPC.');
      const refusal = mansionRoleRefusal(city, next.npcs, npc, role);
      if (refusal) return fail(refusal, MANSION_ROLE_REFUSALS[refusal]);
      // A v15 checkpoint can carry an expired role until the next household action.
      for (const { household } of next.npcs) household.role = mansionResidentRole(household);
      npc.household.role = role;
    } else if (type === 'MOVE_TO_ROOM') {
      const npc = next.npcs.find(row => row.character.id === raw.npcId);
      if (typeof raw.roomId !== 'string' || typeof raw.npcId !== 'string') return fail('INVALID_COMMAND', 'Select an NPC and Mansion room.');
      if (!npc) return fail('UNKNOWN_NPC', 'Select a known NPC.');
      if (npc.household.home !== MANSION_TILE_ID) return fail('NOT_A_HOME', 'Choose a Mansion resident.');
      const failure = moveNpcToMansionRoom(next, npc, raw.roomId);
      if (failure) return { success: false, error: failure };
    } else {
      const room = type === 'UPGRADE_ROOM' ? mansion.rooms.find(row => row.id === raw.roomId) : undefined;
      const level = mansionLevel(city);
      const typeId = room?.typeId ?? raw.typeId;
      if (!level || !isMansionRoomType(typeId) || (type === 'UPGRADE_ROOM' && !room)) return fail('INVALID_COMMAND', 'Select a Mansion room type or room.');
      const config = MANSION_CATALOG.roomTypes[typeId];
      if (room?.level === 3) return fail('ROOM_MAX_LEVEL', 'That room is already level 3.');
      if (!room && config.unlockLevel > level) return fail('ROOM_LOCKED', 'Needs Mansion level ' + config.unlockLevel + '.');
      if (!room && mansion.rooms.filter(row => row.typeId === typeId).length >= config.maxCount[level - 1]) {
        return fail('ROOM_LIMIT', 'The Mansion has reached the limit for this room type.');
      }
      const nextLevel = (room ? room.level + 1 : 1) as RoomLevel;
      const inventory = city.world.settlements[city.world.activeSettlementId!].inventory;
      const { gold, wood, iron } = config.cost[nextLevel - 1];
      if (inventory.gold < gold) return fail('NOT_ENOUGH_GOLD', 'There is not enough Gold for that room.');
      if (inventory.wood < wood || inventory.iron < iron) return fail('INSUFFICIENT_RESOURCES', 'There is not enough Wood or Iron for that room.');
      inventory.gold -= gold;
      inventory.wood -= wood;
      inventory.iron -= iron;
      if (room) room.level = nextLevel;
      else {
        mansion.rooms.push({ id: 'room-' + mansion.nextRoomSeq, typeId, level: nextLevel, furniture: [] });
        mansion.nextRoomSeq = trialSafe(mansion.nextRoomSeq + 1);
      }
    }
    city.revision = trialSafe(city.revision + 1);
    return { success: true, next };
  } catch { return fail('EXECUTION_ERROR', 'The Mansion action failed; the original session was preserved.'); }
}
