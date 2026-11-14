import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState, SOCIETY_RULESET } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../character-life-save.js';
import { recordsToSession, sessionToRecords } from '../session-records.js';

function checkpoint(owner: string) {
  const result = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!result.success) throw Error(result.error.message);
  const state = result.value;
  state.city.society!.items.nextItemId = 2;
  state.city.society!.items.equipped = { [owner]: { weapon: { id: 1, defId: owner === 'player' ? 'common-weapon' : 'rare-weapon' } } };
  const text = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: SOCIETY_RULESET, state });
  return { state, text };
}

it.each(['missing_npc', 'missing_player'])('refuses unknown equipment owner %s at the Character Life boundary', owner => {
  const { state } = checkpoint(owner), before = structuredClone(state);
  expect(isCharacterLifeSessionState(state)).toBe(false);
  expect(state).toEqual(before);
});

it.each(['missing_npc', 'missing_player'])('refuses unknown owner %s through the checkpoint importer used by the UI', owner => {
  const { text } = checkpoint(owner);
  expect(deserializeCharacterLifeSave(text)).toEqual({ success: false, error: {
    code: 'INVALID_SAVE_STATE', message: 'Checkpoint must contain a valid complete Character Life session in Planning.',
  } });
});

it.each(['player', 'npc_starter_1'])('accepts real equipment owner %s through validation, import and byte-identical records', owner => {
  const { state, text } = checkpoint(owner);
  expect(isCharacterLifeSessionState(state)).toBe(true);
  const loaded = deserializeCharacterLifeSave(text);
  expect(loaded.success).toBe(true);
  if (!loaded.success) throw Error(loaded.error.message);
  expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main', loaded.state)))).toEqual({ success: true, text });
});
