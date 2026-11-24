import { expect, it } from 'vitest';
import { NPC_TEST_KEYS, withNpcs } from '@haven/core/testing/npcs';
import { readFileSync, readdirSync } from 'node:fs';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type NpcLife } from '@haven/core';
import { createMemoryGameStore } from '../memory-store.js';
import { recordsToSession, sessionToRecords, StoreRecordError } from '../session-records.js';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../character-life-save.js';

const life = () => { const r = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' }); if (!r.success) throw Error(r.error.message); return withNpcs(r.value, NPC_TEST_KEYS.slice(0, 1)); };
const invalid = [
  ['unknown origin', (v: NpcLife) => { v.origin = 'missing'; }],
  ['unknown hobby', (v: NpcLife) => { v.hobbies[0] = 'missing'; }],
  ['duplicate hobbies', (v: NpcLife) => { v.hobbies[1] = v.hobbies[0]; }],
  ['stat 101', (v: NpcLife) => { v.stress = 101; }],
  ['novice exp 101', (v: NpcLife) => { v.sexExp.hand = { level: 'novice', exp: 101 }; }],
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
  const row = rows.find(r => r.id === 'npc_w1_guild_0')!;
  const value = row.value as { kind: 'npc'; npc: { life: NpcLife } };
  expect(value.kind).toBe('npc'); mutate(value.npc.life);
  const badBytes = JSON.stringify(rows);
  let error: unknown;
  try { recordsToSession(rows); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(StoreRecordError);
  expect((error as StoreRecordError).ref).toBe('characters:npc_w1_guild_0');
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
  const npc = rows.find(r => r.id === 'npc_w1_guild_0')!.value as { npc: { life?: NpcLife } };
  delete npc.npc.life;
  expect(() => recordsToSession(rows)).toThrow(StoreRecordError);
  expect(JSON.stringify(await store.read('main'))).toBe(before);
});

it('matches v11 and v12 checkpoint filenames and round-trips every current life checkpoint byte-identically', () => {
  const current = new URL('./fixtures/society-v12/', import.meta.url), historical = new URL('./fixtures/society-v11/', import.meta.url);
  const files = readdirSync(current).sort(); expect(files).toEqual(readdirSync(historical).sort()); expect(files).toHaveLength(10);
  for (const file of files.filter(name => name.startsWith('life-'))) {
    const bytes = readFileSync(new URL(file, current), 'utf8'), decoded = deserializeCharacterLifeSave(bytes);
    expect(decoded.success).toBe(true); if (!decoded.success) throw Error(decoded.error.message);
    expect(decoded.state.city.society!.rulesetId).toBe('tile-society-12');
    expect(decoded.state.npcs).toStrictEqual([]);
    expect(decoded.state.npcs.every(npc => Object.hasOwn(npc, 'life'))).toBe(true);
    const rows = sessionToRecords('main', decoded.state), before = JSON.stringify(rows);
    expect(serializeCharacterLifeSave(recordsToSession(rows))).toEqual({ success: true, text: bytes });
    expect(JSON.stringify(rows)).toBe(before);
  }
});

it('round-trips exhausted life, levels and full history without resetting state in the current checkpoint', () => {
  const state = life(), npc = state.npcs[0];
  expect(state.city.society!.rulesetId).toBe('tile-society-12');
  npc.life.working = false; npc.life.stress = 95;
  npc.life.sexExp.hand = { level: 'professional', exp: 200 }; npc.life.sexExp.ass = { level: 'expert', exp: 300 };
  npc.life.history = { counters: { exhausted: 2, birthday: 20 }, recent: Array.from({ length: 20 }, (_, i) => ({ week: i + 1, kind: 'birthday' })) };
  const before = serializeCharacterLifeSave(state); expect(before.success).toBe(true);
  if (!before.success) throw Error(before.error.message);
  const decoded = deserializeCharacterLifeSave(before.text); expect(decoded.success).toBe(true);
  if (!decoded.success) throw Error(decoded.error.message);
  expect(decoded.state.npcs).toHaveLength(1);
  expect(Object.hasOwn(decoded.state.npcs[0], 'life')).toBe(true);
  expect(Object.hasOwn(decoded.state.npcs[0], 'household')).toBe(true);
  expect(recordsToSession(sessionToRecords('main', decoded.state))).toEqual(state);
  expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main', decoded.state)))).toEqual(before);
});
