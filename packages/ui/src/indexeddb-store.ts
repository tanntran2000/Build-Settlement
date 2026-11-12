import { GAME_DB, diffRecords, type GameStore, type StoredRecord, type WriteStats } from '@haven/persistence';
export function createIndexedDbGameStore(factory: IDBFactory = indexedDB): GameStore {
  const opening = new Promise<IDBDatabase>((resolve,reject) => {
    const request = factory.open(GAME_DB.name,GAME_DB.version);
    request.onupgradeneeded = () => { const db = request.result; for (const name of GAME_DB.stores) { const store = db.createObjectStore(name,{ keyPath: ['slotId','id'] }); store.createIndex('bySlot','slotId'); } };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? Error('Database unavailable'));
    request.onblocked = () => reject(Error('Database blocked'));
  });
  // Observe rejection immediately, even before the first caller awaits the database.
  opening.catch(() => undefined);
  const request = <T>(r: IDBRequest<T>) => new Promise<T>((resolve,reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  async function transaction<T>(mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    const db = await opening;
    return new Promise<T>((resolve,reject) => {
      const tx = db.transaction([...GAME_DB.stores],mode); let value: T;
      tx.oncomplete = () => resolve(value);
      tx.onabort = tx.onerror = () => reject(tx.error ?? Error('Transaction aborted'));
      work(tx).then(result => { value = result; },error => { try { tx.abort(); } catch { /* Already aborted. */ } reject(error); });
    });
  }
  const slotRows = async (tx: IDBTransaction, slotId: string) => (await Promise.all(GAME_DB.stores.filter(t => t !== 'system').map(t => request(tx.objectStore(t).index('bySlot').getAll(slotId)) as Promise<StoredRecord[]>))).flat();
  return {
    async read(slotId) { performance.mark('haven.store.read'); return transaction('readonly',async tx => { const rows = await slotRows(tx,slotId); return rows.some(r => r.table === 'meta') ? rows : null; }); },
    async replaceSlot(slotId,next,extra = []): Promise<WriteStats> {
      performance.mark('haven.store.write');
      if (next.some(r => r.slotId !== slotId || r.table === 'system') || extra.some(r => r.table !== 'system')) throw Error('Invalid slot records');
      return transaction('readwrite',async tx => {
        const diff = diffRecords(await slotRows(tx,slotId),next);
        for (const [table,id] of diff.remove) tx.objectStore(table).delete([slotId,id]);
        for (const r of [...diff.put,...extra]) tx.objectStore(r.table).put(r);
        return { put: diff.put.length,deleted: diff.remove.length,unchanged: diff.unchanged };
      });
    },
    async clear(slotId) { performance.mark('haven.store.clear'); return transaction('readwrite',async tx => { for (const r of await slotRows(tx,slotId)) tx.objectStore(r.table).delete([slotId,r.id]); }); },
    async getSystem(id) { return transaction('readonly',async tx => (await request(tx.objectStore('system').get(['_',id]))) ?? null); }
  };
}
