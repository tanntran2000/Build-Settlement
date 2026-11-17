import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type NpcLife } from '@haven/core';
import { createMemoryGameStore } from '../memory-store.js';
import { recordsToSession, sessionToRecords, StoreRecordError } from '../session-records.js';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../character-life-save.js';

const life = () => { const r = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' }); if (!r.success) throw Error(r.error.message); return r.value; };
const invalid = [
  ['unknown origin', (v: NpcLife) => { v.origin = 'missing'; }],
  ['unknown hobby', (v: NpcLife) => { v.hobbies[0] = 'missing'; }],
  ['duplicate hobbies', (v: NpcLife) => { v.hobbies[1] = v.hobbies[0]; }],
  ['stat 101', (v: NpcLife) => { v.stress = 101; }],
  ['novice exp 101', (v: NpcLife) => { v.sexExp.hand.exp = 101; }],
  ['professional exp 201', (v: NpcLife) => { v.sexExp.mouth = { level: 'professional', exp: 201 }; }],
  ['expert exp 301', (v: NpcLife) => { v.sexExp.ass = { level: 'expert', exp: 301 }; }],
  ['21 events', (v: NpcLife) => { v.history.recent = Array.from({ length: 21 }, () => ({ week: 1, kind: 'birthday' })); }],
] as const;

it.each(invalid)('refuses imported %s with the NPC StoreRecordError and leaves stored bytes intact', async (_, mutate) => {
  const state = life(), store = createMemoryGameStore();
  expect(state.npcs[0].life).toBeDefined();
  const encoded = serializeCharacterLifeSave(state); expect(encoded.success).toBe(true);
  await store.replaceSlot('main', sessionToRecords('main', state));
  const original = JSON.stringify(await store.read('main'));
  const rows = (await store.read('main'))!;
  const row = rows.find(r => r.id === 'npc_starter_1')!;
  const value = row.value as { kind: 'npc'; npc: { life: NpcLife } };
  expect(value.kind).toBe('npc'); mutate(value.npc.life);
  const badBytes = JSON.stringify(rows);
  let error: unknown;
  try { recordsToSession(rows); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(StoreRecordError);
  expect((error as StoreRecordError).ref).toBe('characters:npc_starter_1');
  expect(JSON.stringify(rows)).toBe(badBytes); expect(JSON.stringify(await store.read('main'))).toBe(original);
  expect(serializeCharacterLifeSave(recordsToSession((await store.read('main'))!))).toEqual(encoded);
  const candidate = structuredClone(state); mutate(candidate.npcs[0].life);
  const envelope = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: state.city.society!.rulesetId, state: candidate });
  expect(deserializeCharacterLifeSave(envelope)).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
  expect(JSON.stringify(await store.read('main'))).toBe(original);
});

it('requires life in every current NPC record and retains the last valid stored session', async () => {
  const store = createMemoryGameStore(), state = life();
  await store.replaceSlot('main', sessionToRecords('main', state));
  const rows = (await store.read('main'))!, before = JSON.stringify(rows);
  const npc = rows.find(r => r.id === 'npc_starter_1')!.value as { npc: { life?: NpcLife } };
  delete npc.npc.life;
  expect(() => recordsToSession(rows)).toThrow(StoreRecordError);
  expect(JSON.stringify(await store.read('main'))).toBe(before);
});
