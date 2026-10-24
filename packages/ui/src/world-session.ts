import { isWorldSessionState, WORLD_SESSION_CITY_RULESET, type WorldSessionState } from '@haven/core';
import { deserializeWorldSessionSave, serializeWorldSessionSave } from '@haven/persistence';
import { executeTileTrialCommand } from '@haven/simulation';

export const WORLD_SESSION_CHECKPOINT_KEY = 'haven.world-session.checkpoint.v1';
type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

export function prepareWorldSessionLoad(live: WorldSessionState, loaded: WorldSessionState, expectedRevision: number): { success: true; next: WorldSessionState } | Failure {
  try {
    // LOAD_TRIAL validates city only; the entire loaded session is our boundary.
    if (!isWorldSessionState(loaded)) return fail('Checkpoint must contain a valid complete world session in Planning.');
    const result = executeTileTrialCommand(live.city, { type: 'LOAD_TRIAL', expectedRevision, snapshot: loaded.city }, WORLD_SESSION_CITY_RULESET);
    return result.success ? { success: true, next: { city: result.nextState, outside: loaded.outside } } : fail(result.error.message);
  } catch { return fail('Could not prepare the world checkpoint. Your game was preserved.'); }
}

export function saveLocalWorldSession(session: unknown): { success: true; replaced: boolean } | Failure {
  const result = serializeWorldSessionSave(session);
  if (!result.success) return fail(result.error.message);
  try {
    const storage = window.localStorage;
    const replaced = storage.getItem(WORLD_SESSION_CHECKPOINT_KEY) !== null;
    storage.setItem(WORLD_SESSION_CHECKPOINT_KEY, result.text);
    return { success: true, replaced };
  } catch {
    return fail('Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.');
  }
}

export function readLocalWorldSession(): { success: true; state: WorldSessionState } | Failure {
  let text: string | null;
  try { text = window.localStorage.getItem(WORLD_SESSION_CHECKPOINT_KEY); } catch {
    return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.');
  }
  if (text === null) return fail('No local checkpoint in this browser yet. Choose Save locally first.');
  const result = deserializeWorldSessionSave(text);
  return result.success ? result : fail(`Local checkpoint not loaded; it was left unchanged. ${result.error.message}`);
}
