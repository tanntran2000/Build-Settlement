import { LEGACY_TILE_RULESET, type TileTrialState } from '@haven/core';
import { deserializeTileTrialSave, serializeTileTrialSave } from '@haven/persistence';

// One explicit manual slot in this browser profile/origin; same envelope as legacy tile-trial-01 Export checkpoint.
export const TILE_CHECKPOINT_KEY = 'haven.tile-trial.checkpoint.v1';
type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

export function saveLocalCheckpoint(state: unknown): { success: true; replaced: boolean } | Failure {
  const result = serializeTileTrialSave(state, LEGACY_TILE_RULESET);
  if (!result.success) return fail(result.error.message);
  try {
    const storage = window.localStorage;
    const replaced = storage.getItem(TILE_CHECKPOINT_KEY) !== null;
    storage.setItem(TILE_CHECKPOINT_KEY, result.text);
    return { success: true, replaced };
  } catch {
    return fail('Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.');
  }
}

export function readLocalCheckpoint(): { success: true; state: TileTrialState } | Failure {
  let text: string | null;
  try { text = window.localStorage.getItem(TILE_CHECKPOINT_KEY); } catch {
    return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.');
  }
  if (text === null) return fail('No local checkpoint in this browser yet. Choose Save locally first.');
  const result = deserializeTileTrialSave(text, LEGACY_TILE_RULESET);
  return result.success ? result : fail(`Local checkpoint not loaded; it was left unchanged. ${result.error.message}`);
}
