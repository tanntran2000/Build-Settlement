import { hasWeeklyKeys, isWorldSessionState, outsideProvenance, WORLD_SESSION_CITY_RULESET, type WorldSessionState } from '@haven/core';
import { TILE_SAVE_MAX_BYTES } from './tile-trial-save.js';

export const WORLD_SESSION_SAVE_FORMAT = 'haven.world-session.save';
export type WorldSaveFailure = { success: false; error: { code: 'INVALID_SAVE' | 'INCOMPATIBLE_SAVE' | 'INVALID_SAVE_STATE' | 'SAVE_TOO_LARGE' | 'SAVE_FAILED'; message: string } };
const fail = (code: WorldSaveFailure['error']['code'], message: string): WorldSaveFailure => ({ success: false, error: { code, message } });
const tooLarge = (text: string) => text.length > TILE_SAVE_MAX_BYTES || new TextEncoder().encode(text).byteLength > TILE_SAVE_MAX_BYTES;

export function serializeWorldSessionSave(session: unknown): { success: true; text: string } | WorldSaveFailure {
  try {
    if (!isWorldSessionState(session)) return fail('INVALID_SAVE_STATE', 'Export requires a valid world session in Planning.');
    const text = JSON.stringify({ format: WORLD_SESSION_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: WORLD_SESSION_CITY_RULESET, state: session });
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    return { success: true, text };
  } catch { return fail('SAVE_FAILED', 'Could not export this checkpoint. Your game was preserved.'); }
}

export function deserializeWorldSessionSave(text: unknown): { success: true; state: WorldSessionState } | WorldSaveFailure {
  try {
    if (typeof text !== 'string') return fail('INVALID_SAVE', 'Choose a world session checkpoint JSON file.');
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    const value: unknown = JSON.parse(text);
    if (!hasWeeklyKeys(value, ['format', 'schemaVersion', 'cityRulesetId', 'state']) || value.format !== WORLD_SESSION_SAVE_FORMAT || value.schemaVersion !== 1 || value.cityRulesetId !== WORLD_SESSION_CITY_RULESET) {
      return fail('INCOMPATIBLE_SAVE', 'Unsupported world checkpoint format, version or city ruleset. No migration was performed.');
    }
    const state = value.state;
    const provenance = state && typeof state === 'object' ? outsideProvenance(Object.getOwnPropertyDescriptor(state, 'outside')?.value) : 'malformed';
    if (provenance === 'malformed') return fail('INVALID_SAVE_STATE', 'Checkpoint has malformed outside world provenance.');
    if (provenance === 'unsupported') return fail('INCOMPATIBLE_SAVE', 'Unsupported outside world generator or scenario. No migration was performed.');
    if (!isWorldSessionState(state)) return fail('INVALID_SAVE_STATE', 'Checkpoint must contain a valid complete world session in Planning.');
    return { success: true, state };
  } catch { return fail('INVALID_SAVE', 'Could not read a valid checkpoint JSON. Your game was preserved.'); }
}
