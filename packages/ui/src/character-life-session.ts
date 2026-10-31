import { SOCIETY_RULESET } from '@haven/core';
import { isCharacterLifeSessionState, type CharacterLifeSessionState } from '@haven/core';
import { captureSaveData, deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { prepareNpcWorldSessionLoad } from './world-npc-session.js';

export const CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY = 'haven.character-life-session-society.checkpoint.v1';
export const OLD_CHECKPOINT_MESSAGE = 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
export function isPlayableCheckpoint(state: CharacterLifeSessionState): boolean { return state.city.society?.rulesetId === SOCIETY_RULESET; }

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
    if (JSON.parse(result.text).cityRulesetId !== SOCIETY_RULESET) return fail(OLD_CHECKPOINT_MESSAGE);
    const key = CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY;
    const storage = window.localStorage;
    const replaced = storage.getItem(key) !== null;
    storage.setItem(key, result.text);
    return { success: true, replaced };
  } catch {
    return fail('Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.');
  }
}

export function readLocalCharacterLife(): { success: true; state: CharacterLifeSessionState } | Failure {
  let text: string | null;
  try {
    const storage = window.localStorage;
    text = storage.getItem(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY);
  } catch {
    return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.');
  }
  if (text === null) return fail('No local checkpoint in this browser yet. Choose Save locally first.');
  const result = deserializeCharacterLifeSave(text);
  return result.success && isPlayableCheckpoint(result.state) ? result : fail(`Local checkpoint not loaded; it was left unchanged. ${OLD_CHECKPOINT_MESSAGE}`);
}
