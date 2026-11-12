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
      const decoded = recordsToSession(sessionToRecords('main', s));
      const after = serializeCharacterLifeSave(decoded);
      if (version === 'society-v7') {
        expect(before.success).toBe(true); expect(after.success).toBe(true);
        if (!before.success || !after.success) throw Error('Current fixture must serialize successfully');
        expect(after.text).toBe(before.text);
      } else {
        expect(decoded).toEqual(s);
        expect(before).toEqual({ success: false, error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' } });
      }
      expect(after).toEqual(before);
    });
  }
}
const session = () => { const r = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
it('Player and 3 NPCs give 4 character records', () => expect(sessionToRecords('main', session()).filter(r => r.table === 'characters')).toHaveLength(4));
it('corrupt character identifies the offending record', () => {
  const rows = sessionToRecords('main', session()); const npc = rows.find(r => r.id === 'npc_starter_1')!; npc.value = null;
  try { recordsToSession(rows); throw Error('Expected invalid record rejection'); } catch (e) { expect(e).toBeInstanceOf(StoreRecordError); expect((e as StoreRecordError).ref).toBe('characters:npc_starter_1'); }
});

function expectRecordRef(rows: ReturnType<typeof sessionToRecords>,ref: string) {
  let error: unknown;
  try { recordsToSession(rows); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(StoreRecordError);
  expect((error as StoreRecordError).ref).toBe(ref);
}
it.each(['rulesetId','revision','phase'] as const)('fix1 F4: inconsistent meta %s identifies meta:session',field=>{
  const rows=sessionToRecords('main',session()),meta=rows.find(r=>r.table==='meta')!.value as Record<string,unknown>;
  meta[field]=field==='rulesetId'?'tile-society-06':field==='revision'?1:'report';
  expectRecordRef(rows,'meta:session');
});
it.each(['object shape','invalid inventory'] as const)('fix1 F4: malformed city %s identifies city:city',kind=>{
  const rows=sessionToRecords('main',session()),city=rows.find(r=>r.table==='city')!;
  if(kind==='object shape')city.value={};
  else {const value=city.value as ReturnType<typeof session>['city'];value.world.settlements[value.world.activeSettlementId!].inventory.gold=-1;}
  expectRecordRef(rows,'city:city');
});
it.each(['object shape','invalid actors'] as const)('fix1 F4: malformed world %s identifies world:outside',kind=>{
  const rows=sessionToRecords('main',session()),world=rows.find(r=>r.table==='world')!;
  if(kind==='object shape')world.value={};else (world.value as ReturnType<typeof session>['outside']).actors=['unknown'];
  expectRecordRef(rows,'world:outside');
});
