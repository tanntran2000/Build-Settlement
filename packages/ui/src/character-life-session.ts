import { GOODS_STOCK_RULESET } from '@haven/core';
import { isCharacterLifeSessionState, type CharacterLifeSessionState } from '@haven/core';
import { captureSaveData, deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { prepareNpcWorldSessionLoad } from './world-npc-session.js';

export const CHARACTER_LIFE_CHECKPOINT_KEY = 'haven.character-life-session.checkpoint.v1';
export const CHARACTER_LIFE_CHECKPOINT_GOODS_KEY = 'haven.character-life-session-goods.checkpoint.v1';
type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

// One detached capture feeds the NPC-world base, player and profiles, so all come from the same validated data.
export function prepareCharacterLifeLoad(live: CharacterLifeSessionState, loaded: unknown, expectedRevision: number): { success: true; next: CharacterLifeSessionState } | Failure {
  try {
    const captured = captureSaveData(loaded);
    if (!isCharacterLifeSessionState(captured)) return fail('Checkpoint must contain a valid complete Character Life session in Planning.');
    const base = prepareNpcWorldSessionLoad(live, { city: captured.city, outside: captured.outside, npcs: captured.npcs }, expectedRevision);
    if (!base.success) return base;
    const next = { ...base.next, player: structuredClone(captured.player), profiles: structuredClone(captured.profiles) };
    return isCharacterLifeSessionState(next) ? { success: true, next } : fail('Checkpoint player or profiles do not match its characters.');
  } catch { return fail('Could not prepare the Character Life checkpoint. Your game was preserved.'); }
}

export function saveLocalCharacterLife(session: unknown): { success: true; replaced: boolean } | Failure {
  const result = serializeCharacterLifeSave(session);
  if (!result.success) return fail(result.error.message);
  try {
    const key = JSON.parse(result.text).cityRulesetId === GOODS_STOCK_RULESET ? CHARACTER_LIFE_CHECKPOINT_GOODS_KEY : CHARACTER_LIFE_CHECKPOINT_KEY;
    const storage = window.localStorage;
    const replaced = storage.getItem(key) !== null;
    storage.setItem(key, result.text);
    return { success: true, replaced };
  } catch {
    return fail('Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.');
  }
}

export function readLocalCharacterLife() { return readCheckpoint(false); }
export function readOldLocalCharacterLife() { return readCheckpoint(true); }
function readCheckpoint(oldOnly: boolean): { success: true; state: CharacterLifeSessionState } | Failure {
  let text: string | null;
  try {
    const storage = window.localStorage;
    text = oldOnly ? storage.getItem(CHARACTER_LIFE_CHECKPOINT_KEY) : storage.getItem(CHARACTER_LIFE_CHECKPOINT_GOODS_KEY) ?? storage.getItem(CHARACTER_LIFE_CHECKPOINT_KEY);
  } catch {
    return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.');
  }
  if (text === null) return fail('No local checkpoint in this browser yet. Choose Save locally first.');
  const result = deserializeCharacterLifeSave(text);
  return result.success ? result : fail(`Local checkpoint not loaded; it was left unchanged. ${result.error.message}`);
}
