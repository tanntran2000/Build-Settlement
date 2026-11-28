import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import * as persistence from '@haven/persistence';
import { OLD_CHECKPOINT_MESSAGE, readLocalCharacterLife, saveLocalCharacterLife } from '../character-life-session.js';
import { prepareNpcWorldSessionLoad } from '../world-npc-session.js';
import { prepareWorldSessionLoad } from '../world-session.js';

const fixtures = new URL('../../../persistence/src/__tests__/fixtures/', import.meta.url);
const marker = 'migration:legacy-local-checkpoint';
const parsed = () => JSON.parse(readFileSync(new URL('society-v14/life-new-game.json', fixtures), 'utf8'));
const encode = (state: unknown) => JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-14', state });

it('prepares decoded World and NPC World v14 states with their own shapes', () => {
  const old = parsed().state;
  const world = { city: old.city, outside: old.outside };
  const live = persistence.upgradeV14WorldSession(world);
  if (!live) throw Error('World fixture refused.');
  const before = JSON.stringify(world);
  const prepared = prepareWorldSessionLoad(live, world, live.city.revision);
  expect(prepared).toMatchObject({ success: true, next: { city: { society: { rulesetId: 'tile-society-15' } } } });
  const preparedNpc = prepareNpcWorldSessionLoad({ ...live, npcs: [] }, { ...world, npcs: [] }, live.city.revision);
  expect(preparedNpc.success).toBe(true);
  if (!preparedNpc.success) throw Error(preparedNpc.message);
  expect(Object.keys(preparedNpc.next)).toEqual(['city', 'outside', 'npcs']);
  expect(preparedNpc.next.npcs).toEqual([]);
  expect(JSON.stringify(world)).toBe(before);
});

it.each(['legacy', 'rows', 'detached rows'] as const)('loads v14 %s without writes until the next successful save', async medium => {
  const state = parsed().state;
  const store = persistence.createMemoryGameStore();
  const oldText = encode(state);
  if (medium !== 'legacy') {
    let rows = persistence.sessionToRecords('main', state);
    if (medium === 'detached rows') {
      const current = JSON.parse(readFileSync(new URL('society-v15/life-new-game.json', fixtures), 'utf8')).state;
      current.city.society.items.nextItemId = 2;
      current.city.society.items.inventory = [{ id: 1, defId: 'common-top' }];
      rows = persistence.sessionToRecords('main', current);
      for (const row of rows) {
        const value = row.value as typeof state;
        if (row.table === 'meta') value.rulesetId = 'tile-society-14';
        if (row.table === 'city') {
          value.society.rulesetId = 'tile-society-14';
          delete value.society.mansion;
        }
        if (row.table === 'characters') delete value.player.needs;
      }
    }
    await store.replaceSlot('main', rows);
  }
  let removals = 0;
  const before = JSON.stringify(await store.read('main'));
  const deps = { store, legacy: { getItem: () => medium === 'legacy' ? oldText : null, removeItem: () => { removals++; } } };
  const loaded = await readLocalCharacterLife(deps);
  expect(loaded.success).toBe(true);
  if (!loaded.success) throw Error(loaded.message);
  if (medium === 'detached rows') expect(loaded.state.city.society?.items.inventory).toEqual([{ id: 1, defId: 'common-top' }]);
  expect(await store.getSystem(marker)).toBeNull();
  expect(JSON.stringify(await store.read('main'))).toBe(before);
  expect(removals).toBe(0);
  expect(await saveLocalCharacterLife(loaded.state, deps)).toMatchObject({ success: true });
  expect((await store.read('main'))?.find(row => row.table === 'meta')?.value).toMatchObject({ rulesetId: 'tile-society-15' });
});

it.each(['legacy', 'rows'] as const)('rejects damaged v14 %s without adding a migration marker', async medium => {
  const state = parsed().state, store = persistence.createMemoryGameStore();
  state.player.purse.moneyMilli = -1;
  if (medium === 'rows') await store.replaceSlot('main', persistence.sessionToRecords('main', state));
  const before = JSON.stringify(await store.read('main'));
  const result = await readLocalCharacterLife({store, legacy: { getItem: () => medium === 'legacy' ? encode(state) : null, removeItem: () => { throw Error('Unexpected write'); } }});
  expect(result).toMatchObject({ success: false, message: expect.stringContaining(OLD_CHECKPOINT_MESSAGE) });
  expect(await store.getSystem(marker)).toBeNull();
  expect(JSON.stringify(await store.read('main'))).toBe(before);
});
