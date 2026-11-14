import { expect, it } from 'vitest';
import { createItemsState, isItemsState, type ItemsState } from '../items.js';

const mutations: [string, (items: ItemsState) => void][] = [
  ['inventory ids', items => { items.inventory = [{ id: 2, defId: 'common-ring' }, { id: 1, defId: 'common-top' }]; }],
  ['consumable ids', items => { items.consumables = [{ id: 2, defId: 'heal-potion-2' }, { id: 1, defId: 'heal-potion-1' }]; }],
  ['storage ids', items => { items.storage = [{ item: { id: 2, defId: 'common-ring' }, expiresWeek: 4 }, { item: { id: 1, defId: 'heal-potion-1' }, expiresWeek: 5 }]; }],
  ['empty player equipment', items => { items.equipped = { player: {} }; }],
  ['empty NPC equipment', items => { items.equipped = { npc_starter_1: {} }; }],
];

it.each(mutations)('rejects non-canonical %s without changing the input', (_name, mutate) => {
  const items = createItemsState(0);
  items.nextItemId = 3;
  mutate(items);
  const before = structuredClone(items);
  expect(isItemsState(items, ['player', 'npc_starter_1'])).toBe(false);
  expect(items).toEqual(before);
});

it('accepts ascending ids independently within all three lists', () => {
  const items = createItemsState(0);
  Object.assign(items, {
    nextItemId: 7,
    inventory: [{ id: 1, defId: 'common-ring' }, { id: 4, defId: 'common-top' }],
    consumables: [{ id: 2, defId: 'heal-potion-1' }, { id: 5, defId: 'heal-potion-2' }],
    storage: [{ item: { id: 3, defId: 'common-ring' }, expiresWeek: 5 }, { item: { id: 6, defId: 'heal-potion-1' }, expiresWeek: 4 }],
  });
  expect(isItemsState(items, ['player'])).toBe(true);
  expect(isItemsState(createItemsState(0), ['player'])).toBe(true);
});
