import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { serializeCharacterLifeSave } from '../character-life-save.js';
import { sessionToRecords, recordsToSession, StoreRecordError } from '../session-records.js';
const root = new URL('./fixtures/', import.meta.url);
for (const version of readdirSync(root)) {
  for (const file of readdirSync(new URL(`${version}/`, root)).filter(f => f.startsWith('life-'))) {
    it(`round trips fixture ${version}/${file}`, () => {
      const s = JSON.parse(readFileSync(new URL(`${version}/${file}`, root), 'utf8')).state;
      const before = serializeCharacterLifeSave(s);
      expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main', s)))).toEqual(before);
    });
  }
}
const session = () => { const r = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
it('Player and 3 NPCs give 4 character records', () => expect(sessionToRecords('main', session()).filter(r => r.table === 'characters')).toHaveLength(4));
it('corrupt character identifies the offending record', () => {
  const rows = sessionToRecords('main', session()); const npc = rows.find(r => r.id === 'npc_starter_1')!; npc.value = null;
  try { recordsToSession(rows); throw Error('Expected invalid record rejection'); } catch (e) { expect(e).toBeInstanceOf(StoreRecordError); expect((e as StoreRecordError).ref).toBe('characters:npc_starter_1'); }
});

