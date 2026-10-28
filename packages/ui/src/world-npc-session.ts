import { isNpcWorldSessionState, isWorldNpcList, type NpcWorldSessionState } from '@haven/core';
import { captureSaveData, deserializeNpcWorldSessionSave, serializeNpcWorldSessionSave } from '@haven/persistence';
import { prepareWorldSessionLoad } from './world-session.js';

export const WORLD_NPC_CHECKPOINT_KEY = 'haven.world-npc-session.checkpoint.v1';
type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

// One detached capture feeds city, outside and npcs, so all three come from the same validated data.
export function prepareNpcWorldSessionLoad(live: NpcWorldSessionState, loaded: unknown, expectedRevision: number): { success: true; next: NpcWorldSessionState } | Failure {
  try {
    const captured = captureSaveData(loaded);
    if (!isNpcWorldSessionState(captured)) return fail('Checkpoint must contain a valid complete NPC world session in Planning.');
    const prepared = prepareWorldSessionLoad({ city: live.city, outside: live.outside }, { city: captured.city, outside: captured.outside }, expectedRevision);
    if (!prepared.success) return prepared;
    const npcs = structuredClone(captured.npcs);
    return isWorldNpcList(npcs, prepared.next.city) ? { success: true, next: { ...prepared.next, npcs } } : fail('Checkpoint NPC posts do not match its city.');
  } catch { return fail('Could not prepare the NPC world checkpoint. Your game was preserved.'); }
}

export function saveLocalNpcWorldSession(session: unknown): { success: true; replaced: boolean } | Failure {
  const result = serializeNpcWorldSessionSave(session);
  if (!result.success) return fail(result.error.message);
  try {
    const storage = window.localStorage;
    const replaced = storage.getItem(WORLD_NPC_CHECKPOINT_KEY) !== null;
    storage.setItem(WORLD_NPC_CHECKPOINT_KEY, result.text);
    return { success: true, replaced };
  } catch {
    return fail('Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.');
  }
}

export function readLocalNpcWorldSession(): { success: true; state: NpcWorldSessionState } | Failure {
  let text: string | null;
  try { text = window.localStorage.getItem(WORLD_NPC_CHECKPOINT_KEY); } catch {
    return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.');
  }
  if (text === null) return fail('No local checkpoint in this browser yet. Choose Save locally first.');
  const result = deserializeNpcWorldSessionSave(text);
  return result.success ? result : fail(`Local checkpoint not loaded; it was left unchanged. ${result.error.message}`);
}
