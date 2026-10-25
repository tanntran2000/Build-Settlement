import { hasWeeklyKeys, isNpcWorldSessionState, outsideProvenance, WORLD_SESSION_CITY_RULESET, type NpcWorldSessionState } from '@haven/core';
import { TILE_SAVE_MAX_BYTES } from './tile-trial-save.js';
import { captureSaveData, type WorldSaveFailure } from './world-session-save.js';

// A separate format: world v1 files never gain NPCs and NPC files never load as v1.
export const WORLD_NPC_SESSION_SAVE_FORMAT = 'haven.world-npc-session.save';
const fail = (code: WorldSaveFailure['error']['code'], message: string): WorldSaveFailure => ({ success: false, error: { code, message } });
const tooLarge = (text: string) => text.length > TILE_SAVE_MAX_BYTES || new TextEncoder().encode(text).byteLength > TILE_SAVE_MAX_BYTES;

export function serializeNpcWorldSessionSave(session: unknown): { success: true; text: string } | WorldSaveFailure {
  try {
    const snapshot = captureSaveData(session);
    if (!isNpcWorldSessionState(snapshot)) return fail('INVALID_SAVE_STATE', 'Export requires a valid NPC world session in Planning.');
    const text = JSON.stringify({ format: WORLD_NPC_SESSION_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: WORLD_SESSION_CITY_RULESET, state: snapshot });
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    return { success: true, text };
  } catch { return fail('SAVE_FAILED', 'Could not export this checkpoint. Your game was preserved.'); }
}

export function deserializeNpcWorldSessionSave(text: unknown): { success: true; state: NpcWorldSessionState } | WorldSaveFailure {
  try {
    if (typeof text !== 'string') return fail('INVALID_SAVE', 'Choose an NPC world checkpoint JSON file.');
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    const value: unknown = JSON.parse(text);
    if (!hasWeeklyKeys(value, ['format', 'schemaVersion', 'cityRulesetId', 'state']) || value.format !== WORLD_NPC_SESSION_SAVE_FORMAT || value.schemaVersion !== 1 || value.cityRulesetId !== WORLD_SESSION_CITY_RULESET) {
      return fail('INCOMPATIBLE_SAVE', 'Not an NPC world checkpoint of a supported version. World checkpoints load in World Session; no migration was performed.');
    }
    const state = value.state;
    const provenance = state && typeof state === 'object' ? outsideProvenance(Object.getOwnPropertyDescriptor(state, 'outside')?.value) : 'malformed';
    if (provenance === 'malformed') return fail('INVALID_SAVE_STATE', 'Checkpoint has malformed outside world provenance.');
    if (provenance === 'unsupported') return fail('INCOMPATIBLE_SAVE', 'Unsupported outside world generator or scenario. No migration was performed.');
    if (!isNpcWorldSessionState(state)) return fail('INVALID_SAVE_STATE', 'Checkpoint must contain a valid complete NPC world session in Planning.');
    return { success: true, state };
  } catch { return fail('INVALID_SAVE', 'Could not read a valid checkpoint JSON. Your game was preserved.'); }
}
