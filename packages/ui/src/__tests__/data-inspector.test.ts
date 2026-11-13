import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { GAME_DB, type StoredRecord } from '@haven/persistence';
import { createErrorLog, ERROR_LOG_KEY } from '../error-log.js';

async function inspector() {
  const path = '../data-inspector.js';
  return await import(path) as typeof import('../data-inspector.js');
}
const rows: StoredRecord[] = [
  { slotId: 'main', id: 'session', table: 'meta', schemaVersion: 1, value: {} },
  { slotId: 'main', id: 'NPC_starter_1', table: 'characters', schemaVersion: 1, value: {} },
  { slotId: 'main', id: 'npc_starter_2', table: 'characters', schemaVersion: 1, value: {} },
];

it('counts every database table, including empty tables, without changing records', async () => {
  const { listTables } = await inspector(), before = structuredClone(rows);
  const tables = listTables(rows);
  expect(tables.map(table => table.table)).toEqual([...GAME_DB.stores]);
  expect(tables.map(table => table.count)).toEqual([1, 0, 0, 2, 0, 0, 0, 0]);
  expect(rows).toEqual(before);
});

it('finds ids case-insensitively by substring and leaves the input unchanged', async () => {
  const { findById } = await inspector(), before = structuredClone(rows);
  expect(findById(rows, '  nPc_StArTeR  ')).toEqual(rows.slice(1));
  expect(findById(rows, 'SESSION')).toEqual([rows[0]]);
  expect(findById(rows, '')).toEqual(rows);
  expect(findById(rows, 'missing')).toEqual([]);
  expect(rows).toEqual(before);
});

it('lists five catalog files with all entry counts and searchable stable ids', async () => {
  const { listCatalogs, findById } = await inspector(), catalogs = listCatalogs();
  expect(catalogs.map(catalog => [catalog.file, catalog.count])).toEqual([
    ['buildings.json', 32], ['laws.json', 10], ['research.json', 3],
    ['outside-plots.json', 30], ['tuning.json', 9],
  ]);
  for (const catalog of catalogs) {
    expect(catalog.rows).toHaveLength(catalog.count);
    expect(new Set(catalog.rows.map(row => row.id)).size).toBe(catalog.count);
  }
  expect(findById(catalogs[0].rows, 'HOSPITAL').map(row => row.id)).toEqual(['hospital']);
});

let stored: Map<string, string>;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime('2026-11-13T00:00:00.000Z');
  stored = new Map();
  vi.stubGlobal('window', { localStorage: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  } });
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function logger() {
  const log = createErrorLog(); log.initialize('weekly'); log.setContext('weekly', { week: 1 }); return log;
}

it.each(['characters:npc_starter_1', 'catalog:buildings.json#hospital'])('keeps a valid reference %s', ref => {
  const log = logger(); log.record('END_WEEK', 'INVALID_STATE', ref);
  expect(get(log).entries[0]).toHaveProperty('ref', ref);
});

it.each([
  'Jane Doe', 'buildings.json#hospital', 'Characters:npc_starter_1', 'characters:',
  'characters:Jane Doe', 'characters:npc?token=value', 'characters:npc\n',
  `characters:${'a'.repeat(65)}`, null, {}, 7,
])('drops non-matching references without logging raw values: %j', ref => {
  const log = logger(); log.record('END_WEEK', 'INVALID_STATE', ref);
  expect(get(log).entries[0]).not.toHaveProperty('ref');
  expect(Object.keys(get(log).entries[0])).toEqual([
    'timestampUtc', 'lastSeenUtc', 'occurrences', 'appVersion', 'buildId', 'mode', 'clock', 'action', 'kind', 'code', 'message',
  ]);
});

it('round-trips a valid reference through persistence and reload', () => {
  const log = logger(); log.record('END_WEEK', 'INVALID_STATE', 'catalog:buildings.json#hospital'); log.flush();
  expect(JSON.parse(stored.get(ERROR_LOG_KEY)!).entries[0].ref).toBe('catalog:buildings.json#hospital');
  const reloaded = logger();
  expect(get(reloaded).entries).toEqual(get(log).entries);
  expect(get(reloaded).entries[0].ref).toBe('catalog:buildings.json#hospital');
  expect(Object.isFrozen(get(reloaded).entries[0])).toBe(true);
});

it('still loads an old stored entry without an optional reference', () => {
  const log = logger(); log.record('END_WEEK', 'INVALID_STATE'); log.flush();
  const previous = stored.get(ERROR_LOG_KEY);
  const reloaded = logger();
  expect(get(reloaded).entries).toEqual(get(log).entries);
  expect(get(reloaded).discarded).toBe(false);
  expect(get(reloaded).entries[0]).not.toHaveProperty('ref');
  expect(stored.get(ERROR_LOG_KEY)).toBe(previous);
});

it('keeps different references in separate adjacent error groups', () => {
  const log = logger();
  log.record('END_WEEK', 'INVALID_STATE', 'characters:npc_starter_1');
  log.record('END_WEEK', 'INVALID_STATE', 'characters:npc_starter_2');
  log.record('END_WEEK', 'INVALID_STATE', 'characters:npc_starter_2');
  expect(get(log).entries.map(entry => [entry.ref, entry.occurrences])).toEqual([
    ['characters:npc_starter_1', 1], ['characters:npc_starter_2', 2],
  ]);
});
