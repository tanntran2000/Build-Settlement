import { hasWeeklyKeys, isLiveCharacterLifeSessionState, type CharacterLifeSessionState, type TileTrialReport } from '@haven/core';
import { executeWorldNpcCityCommand, executeWorldNpcCommand } from './world-npc.js';

export type CharacterLifeActionType = 'BUILD' | 'REPLACE' | 'UPGRADE'
  | 'SET_WORKERS' | 'SET_ENABLED' | 'END_WEEK' | 'NEXT_WEEK'
  | 'ASSIGN_NPC' | 'UNASSIGN_NPC' | 'EXTEND_WALL' | 'SET_TRAINING';
export type CharacterLifeCommandResult =
  | { success: true; next: CharacterLifeSessionState; report?: Readonly<TileTrialReport> }
  | { success: false; error: { code: string; message: string } };

const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });

export function executeCharacterLifeCommand(session: unknown, raw: unknown): CharacterLifeCommandResult {
  let type: unknown;
  try {
    if (!raw || typeof raw !== 'object' || !hasWeeklyKeys(raw, Object.keys(raw))) {
      return fail('INVALID_COMMAND', 'Command must contain plain data fields.');
    }
    type = Object.getOwnPropertyDescriptor(raw, 'type')?.value;
  } catch { return fail('INVALID_COMMAND', 'Command must contain plain data fields.'); }
  if (typeof type !== 'string') return fail('INVALID_COMMAND', 'Command must contain plain data fields.');
  if (type === 'LOAD_TRIAL') return fail('INVALID_COMMAND', 'Load an NPC world checkpoint through Continue or Import.');
  const societyAction = (type === 'EXTEND_WALL' || type === 'SET_TRAINING') &&
    isLiveCharacterLifeSessionState(session) && !!session.city.society;
  if (!['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED', 'END_WEEK', 'NEXT_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC'].includes(type) && !societyAction) {
    return fail('UNSUPPORTED_ACTION', 'This action is not supported in Character Life.');
  }
  if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');

  const world = { city: session.city, outside: session.outside, npcs: session.npcs };
  const result = type === 'ASSIGN_NPC' || type === 'UNASSIGN_NPC'
    ? executeWorldNpcCommand(world, raw) : executeWorldNpcCityCommand(world, raw);
  if (!result.success) return result;

  try {
    const next = { city: result.next.city, outside: result.next.outside, npcs: result.next.npcs,
      player: structuredClone(session.player), profiles: structuredClone(session.profiles) };
    if (isLiveCharacterLifeSessionState(next)) return { ...result, next };
  } catch { return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.'); }
  return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.');
}
