import { describe, expect, it } from 'vitest';
import { createMemoryGameStore } from '../memory-store.js';
import { diffRecords, type GameStore, type StoredRecord } from '../game-store.js';
const row = (id: string, table: StoredRecord['table'] = 'characters', slotId = 'main'): StoredRecord => ({ slotId, id, table, schemaVersion: 1, value: { id } });
export function runGameStoreSuite(name: string, make: () => GameStore) {
  describe(name, () => {
    const records = () => [row('session', 'meta'), row('npc_starter_1')];
    it('write then read', async () => { const s = make(); await s.replaceSlot('main', records()); expect(await s.read('main')).toEqual(records()); });
    it('unchanged records are not rewritten', async () => { const s = make(); await s.replaceSlot('main', records()); expect(await s.replaceSlot('main', records())).toEqual({ put: 0, deleted: 0, unchanged: 2 }); });
    it('a removed NPC record is deleted', async () => { const s = make(); await s.replaceSlot('main', records()); expect(await s.replaceSlot('main', records().slice(0, 1))).toEqual({ put: 0, deleted: 1, unchanged: 1 }); expect(await s.read('main')).toEqual(records().slice(0, 1)); });
    it('failWrites leaves the previous records', async () => { const opts = { failWrites: false }; const s = createMemoryGameStore(opts); await s.replaceSlot('main', records()); opts.failWrites = true; await expect(s.replaceSlot('main', records().slice(0, 1))).rejects.toThrow(); expect(await s.read('main')).toEqual(records()); });
    it('clear keeps system records', async () => { const s = make(); const marker = row('migration:legacy-local-checkpoint', 'system', '_'); await s.replaceSlot('main', records(), [marker]); await s.clear('main'); expect(await s.read('main')).toBeNull(); expect(await s.getSystem(marker.id)).toEqual(marker); });
    it('two slots are isolated', async () => { const s = make(); await s.replaceSlot('main', records()); const other = [row('session', 'meta', 'other')]; await s.replaceSlot('other', other); await s.clear('main'); expect(await s.read('other')).toEqual(other); });
  });
}
describe('diffRecords', () => {
  it('empty inputs', () => expect(diffRecords([], [])).toEqual({ put: [], remove: [], unchanged: 0 }));
  it('insert, update, delete and unchanged', () => { const a = row('a'), b = row('b'), c = row('c'), d = row('d'); const changed = { ...b, value: 2 }; expect(diffRecords([a,b,c], [a,changed,d])).toEqual({ put: [changed,d], remove: [['characters','c']], unchanged: 1 }); });
  it('table is part of identity', () => expect(diffRecords([row('same','meta')], [row('same','city')])).toEqual({ put: [row('same','city')], remove: [['meta','same']], unchanged: 0 }));
});
