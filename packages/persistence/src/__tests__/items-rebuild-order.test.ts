import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isItemsState, type ItemsState } from '@haven/core';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../character-life-save.js';
import { recordsToSession, sessionToRecords } from '../session-records.js';

function stocked() {
  const result = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!result.success) throw Error(result.error.message);
  const s = result.value;
  Object.assign(s.city.society!.items, {
    nextItemId: 8,
    inventory: [{ id: 1, defId: 'common-top' }],
    consumables: [{ id: 2, defId: 'heal-potion-1' }],
    storage: [{ item: { id: 3, defId: 'common-set' }, expiresWeek: 4 }],
    equipped: {
      player: { ring: { id: 4, defId: 'common-ring' }, weapon: { id: 5, defId: 'common-weapon' } },
      npc_starter_1: { weapon: { id: 6, defId: 'rare-weapon' } },
      npc_starter_2: { weapon: { id: 7, defId: 'rare-weapon' } },
    },
  });
  return s;
}

function assertExactBytes(s: ReturnType<typeof stocked>) {
  const before = serializeCharacterLifeSave(s);
  expect(before.success).toBe(true);
  if (!before.success) throw Error(before.error.message);
  const rebuilt = recordsToSession(sessionToRecords('main', s).reverse());
  const after = serializeCharacterLifeSave(rebuilt);
  expect(after.success).toBe(true);
  if (!after.success) throw Error(after.error.message);
  expect(Buffer.from(after.text).equals(Buffer.from(before.text))).toBe(true);
}

const mutations: [string, (items: ItemsState) => ItemsState][] = [
  ['equipment slot order', items => { const p = items.equipped.player; items.equipped.player = { weapon: p.weapon, ring: p.ring }; return items; }],
  ['equipment character order', items => { const e = items.equipped; items.equipped = { npc_starter_2: e.npc_starter_2, player: e.player, npc_starter_1: e.npc_starter_1 }; return items; }],
  ['inventory instance key order', items => { const i = items.inventory[0]; items.inventory[0] = { defId: i.defId, id: i.id }; return items; }],
  ['consumable instance key order', items => { const i = items.consumables[0]; items.consumables[0] = { defId: i.defId, id: i.id }; return items; }],
  ['stored instance key order', items => { const i = items.storage[0].item; items.storage[0].item = { defId: i.defId, id: i.id }; return items; }],
  ['equipped instance key order', items => { const i = items.equipped.player.ring!; items.equipped.player.ring = { defId: i.defId, id: i.id }; return items; }],
  ['storage wrapper key order', items => { const entry = items.storage[0]; items.storage[0] = { expiresWeek: entry.expiresWeek, item: entry.item }; return items; }],
  ['item-state key order', items => Object.fromEntries(Object.entries(items).reverse()) as unknown as ItemsState],
];

it.each(mutations)('refuses byte-changing %s while its canonical counterpart round-trips exactly', (_name, mutate) => {
  const canonical = stocked();
  assertExactBytes(canonical);
  const s = structuredClone(canonical);
  s.city.society!.items = mutate(s.city.society!.items);
  const unchanged = JSON.stringify(s);
  const exported = serializeCharacterLifeSave(s);
  // A previously accepted representation must preserve bytes; otherwise it must be refused.
  if (exported.success) assertExactBytes(s);
  expect(isItemsState(s.city.society!.items, ['player', ...s.npcs.map(n => n.character.id)])).toBe(false);
  expect(exported).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
  const checkpoint = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-08', state: s });
  expect(deserializeCharacterLifeSave(checkpoint)).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
  expect(JSON.stringify(s)).toBe(unchanged);
});

it('keeps commands and reconstruction valid for numeric and prototype-named equipment owners', () => {
  let s = stocked();
  for (const [index, id] of [[0, '2'], [1, '1'], [2, '__proto__']] as const) {
    s.npcs[index].character.id = id;
    s.profiles[index].id = id;
  }
  s.city.society!.items.equipped = {};
  s.city.society!.items.inventory = [1, 2, 3].map(id => ({ id, defId: 'rare-weapon' }));
  s.city.society!.items.consumables = [];
  s.city.society!.items.storage = [];
  for (const [itemId, characterId] of [[1, '2'], [2, '1'], [3, '__proto__']] as const) {
    const result = executeCharacterLifeCommand(s, { type: 'EQUIP_ITEM', itemId, characterId, expectedRevision: s.city.revision });
    expect(result.success).toBe(true);
    if (!result.success) throw Error(result.error.message);
    s = result.next;
    expect(isItemsState(s.city.society!.items, ['player', '1', '2', '__proto__'])).toBe(true);
    assertExactBytes(s);
  }
  expect(Object.keys(s.city.society!.items.equipped)).toEqual(['1', '2', '__proto__']);
});
