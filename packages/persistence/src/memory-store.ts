import { diffRecords, type GameStore, type StoredRecord } from './game-store.js';
export function createMemoryGameStore(opts: { failWrites?: boolean } = {}): GameStore {
  const data = new Map<string,string>();
  const key = (r: StoredRecord) => JSON.stringify([r.slotId,r.table,r.id]);
  const rows = () => [...data.values()].map(s => JSON.parse(s) as StoredRecord);
  return {
    async read(slotId) { const found = rows().filter(r => r.slotId === slotId && r.table !== 'system'); return found.some(r => r.table === 'meta') ? found : null; },
    async replaceSlot(slotId, next, extra = []) {
      if (opts.failWrites) throw Error('Write aborted');
      if (next.some(r => r.slotId !== slotId || r.table === 'system') || extra.some(r => r.table !== 'system')) throw Error('Invalid slot records');
      const diff = diffRecords(rows().filter(r => r.slotId === slotId && r.table !== 'system'),next);
      const copy = new Map(data);
      for (const [table,id] of diff.remove) copy.delete(JSON.stringify([slotId,table,id]));
      for (const r of [...diff.put,...extra]) copy.set(key(r),JSON.stringify(r));
      data.clear(); for (const [k,v] of copy) data.set(k,v);
      return { put: diff.put.length, deleted: diff.remove.length, unchanged: diff.unchanged };
    },
    async migrateSlot(slotId,candidate,marker) {
      if ((candidate !== null && candidate.some(r => r.slotId !== slotId || r.table === 'system')) || marker.table !== 'system') throw Error('Invalid slot records');
      const current = rows().filter(r => r.slotId === slotId && r.table !== 'system');
      if (data.has(key(marker))) return current.some(r => r.table === 'meta') ? current : null;
      if (opts.failWrites) throw Error('Write aborted');
      // Prepare all serialization before publishing; the complete operation is synchronous.
      const pending = current.some(r => r.table === 'meta') ? [] : (candidate ?? []).map(r => [key(r),JSON.stringify(r)] as const);
      const encodedMarker = JSON.stringify(marker);
      for (const [id,value] of pending) data.set(id,value);
      data.set(key(marker),encodedMarker);
      const result = rows().filter(r => r.slotId === slotId && r.table !== 'system');
      return result.some(r => r.table === 'meta') ? result : null;
    },
    async clear(slotId) { if (opts.failWrites) throw Error('Write aborted'); for (const r of rows()) if (r.slotId === slotId && r.table !== 'system') data.delete(key(r)); },
    async getSystem(id) { return rows().find(r => r.table === 'system' && r.slotId === '_' && r.id === id) ?? null; }
  };
}
