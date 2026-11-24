import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { CharacterLifeSessionState, TileTrialState } from '@haven/core';
import { createMemoryGameStore, recordsToSession, sessionToRecords } from '@haven/persistence';
import { readLocalCharacterLife } from '../character-life-session.js';

it('decodes normalized v10 rows only to refuse the old checkpoint unchanged', async () => {
  const url = new URL('../../../persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json', import.meta.url);
  const source = readFileSync(url, 'utf8');
  const old: CharacterLifeSessionState = JSON.parse(source).state;
  const rows = sessionToRecords('main', old);
  if (!rows.some(row => row.table === 'items')) {
    const city = rows.find(row => row.table === 'city')!.value as TileTrialState;
    const { inventory: items, nextItemId, materials, market, goals } = city.society!.items;
    Object.assign(city.society!, { items: { nextItemId, materials, market, goals } });
    for (const item of items) rows.push({ slotId: 'main', table: 'items', id: `item:${item.id}`, schemaVersion: 1, value: { defId: item.defId, place: 'inventory' } });
  }
  const before = structuredClone(rows);
  expect(recordsToSession(rows)).toStrictEqual(old);
  const store = createMemoryGameStore();
  await store.replaceSlot('main', rows);
  const stored = await store.read('main');
  expect(await readLocalCharacterLife({ store, legacy: null })).toStrictEqual({
    success: false, message: 'Local checkpoint not loaded; it was left unchanged. This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.',
  });
  expect(await store.read('main')).toStrictEqual(stored);
  expect(rows).toStrictEqual(before);
  expect(readFileSync(url, 'utf8')).toBe(source);
});
