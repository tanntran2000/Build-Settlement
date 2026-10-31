import { cityEconomyRuleset, GOODS_STOCK_RULESET, SOCIETY_RULESET } from '@haven/core';
import { hasWeeklyKeys, isCharacterLifeSessionState, outsideProvenance, WORLD_SESSION_CITY_RULESET, type CharacterLifeSessionState } from '@haven/core';
import { TILE_SAVE_MAX_BYTES } from './tile-trial-save.js';
import { captureSaveData, type WorldSaveFailure } from './world-session-save.js';

// A separate format: NPC-world files never gain a Player and life files never load as NPC-world.
export const CHARACTER_LIFE_SAVE_FORMAT = 'haven.character-life-session.save';
const INCOMPATIBLE = 'Not a Character Life checkpoint of a supported version. No migration was performed.';
const INVALID_STATE = 'Checkpoint must contain a valid complete Character Life session in Planning.';
const fail = (code: WorldSaveFailure['error']['code'], message: string): WorldSaveFailure => ({ success: false, error: { code, message } });
const tooLarge = (text: string) => text.length > TILE_SAVE_MAX_BYTES || new TextEncoder().encode(text).byteLength > TILE_SAVE_MAX_BYTES;

export function serializeCharacterLifeSave(session: unknown): { success: true; text: string } | WorldSaveFailure {
  try {
    const snapshot = captureSaveData(session);
    const city = snapshot && typeof snapshot === 'object' ? Object.getOwnPropertyDescriptor(snapshot, 'city')?.value : undefined;
    if (city && typeof city === 'object' && (!Object.hasOwn(city, 'society') || cityEconomyRuleset(city, WORLD_SESSION_CITY_RULESET) !== SOCIETY_RULESET)) return fail('INCOMPATIBLE_SAVE', 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.');
    if (!isCharacterLifeSessionState(snapshot)) return fail('INVALID_SAVE_STATE', INVALID_STATE);
    const text = JSON.stringify({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: cityEconomyRuleset(snapshot.city, WORLD_SESSION_CITY_RULESET), state: snapshot });
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    return { success: true, text };
  } catch { return fail('SAVE_FAILED', 'Could not export this checkpoint. Your game was preserved.'); }
}

export function deserializeCharacterLifeSave(text: unknown): { success: true; state: CharacterLifeSessionState } | WorldSaveFailure {
  try {
    if (typeof text !== 'string') return fail('INVALID_SAVE', 'Choose a Character Life checkpoint JSON file.');
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    const value: unknown = JSON.parse(text);
    if (!hasWeeklyKeys(value, ['format', 'schemaVersion', 'cityRulesetId', 'state']) || value.format !== CHARACTER_LIFE_SAVE_FORMAT || value.schemaVersion !== 1 || value.cityRulesetId !== SOCIETY_RULESET) {
      return fail('INCOMPATIBLE_SAVE', INCOMPATIBLE);
    }
    const state = value.state;
    const city = state && typeof state === 'object' ? Object.getOwnPropertyDescriptor(state, 'city')?.value : undefined;
    if (city && typeof city === 'object' && (!Object.hasOwn(city, 'society') || cityEconomyRuleset(city, WORLD_SESSION_CITY_RULESET) !== SOCIETY_RULESET)) return fail('INCOMPATIBLE_SAVE', 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.');
    const provenance = state && typeof state === 'object' ? outsideProvenance(Object.getOwnPropertyDescriptor(state, 'outside')?.value) : 'malformed';
    if (provenance === 'malformed') return fail('INVALID_SAVE_STATE', 'Checkpoint has malformed outside world provenance.');
    if (provenance === 'unsupported') return fail('INCOMPATIBLE_SAVE', 'Unsupported outside world generator or scenario. No migration was performed.');
    if (!isCharacterLifeSessionState(state)) return fail('INVALID_SAVE_STATE', INVALID_STATE);
    if (value.cityRulesetId !== cityEconomyRuleset(state.city, WORLD_SESSION_CITY_RULESET)) return fail('INCOMPATIBLE_SAVE', 'Checkpoint ruleset does not match its city.');
    return { success: true, state };
  } catch { return fail('INVALID_SAVE', 'Could not read a valid checkpoint JSON. Your game was preserved.'); }
}
