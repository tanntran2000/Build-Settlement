export const GAME_DB = { name: 'haven', version: 1, stores: ['meta','city','world','characters','reports','history','items','system'] } as const;
export type TableName = typeof GAME_DB.stores[number];
export interface StoredRecord { slotId: string; id: string; table: TableName; schemaVersion: 1; value: unknown }
export interface WriteStats { put: number; deleted: number; unchanged: number }
export interface GameStore {
  read(slotId: string): Promise<StoredRecord[] | null>;
  replaceSlot(slotId: string, next: StoredRecord[], extra?: StoredRecord[]): Promise<WriteStats>;
  migrateSlot(slotId: string, candidate: StoredRecord[] | null, marker: StoredRecord): Promise<StoredRecord[] | null>;
  clear(slotId: string): Promise<void>;
  getSystem(id: string): Promise<StoredRecord | null>;
}
export function diffRecords(current: StoredRecord[], next: StoredRecord[]): { put: StoredRecord[]; remove: Array<[TableName,string]>; unchanged: number } {
  const key = (r: StoredRecord) => JSON.stringify([r.table,r.id]);
  const old = new Map(current.map(r => [key(r),r]));
  const put: StoredRecord[] = []; let unchanged = 0;
  for (const r of next) { const previous = old.get(key(r)); if (previous && JSON.stringify(previous) === JSON.stringify(r)) unchanged++; else put.push(r); old.delete(key(r)); }
  return { put, remove: [...old.values()].map(r => [r.table,r.id]), unchanged };
}
