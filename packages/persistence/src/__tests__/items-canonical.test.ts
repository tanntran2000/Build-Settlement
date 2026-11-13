import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isItemsState } from '@haven/core';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { serializeCharacterLifeSave } from '../character-life-save.js';
import { recordsToSession, sessionToRecords } from '../session-records.js';

function stocked() {
  const result = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!result.success) throw Error(result.error.message);
  const session = result.value;
  Object.assign(session.city.society!.items, {
    nextItemId: 11,
    inventory: [{ id: 2, defId: 'common-weapon' }, { id: 7, defId: 'common-ring' }],
    consumables: [{ id: 3, defId: 'heal-potion-1' }, { id: 8, defId: 'heal-potion-2' }],
    storage: [{ item: { id: 1, defId: 'common-set' }, expiresWeek: 4 }, { item: { id: 9, defId: 'heal-potion-3' }, expiresWeek: 5 }],
    equipped: { player: { top: { id: 4, defId: 'common-top' }, weapon: { id: 5, defId: 'common-weapon' } }, npc_starter_1: { weapon: { id: 6, defId: 'rare-weapon' } } },
  });
  return session;
}

it('round-trips canonical mixed-location item state byte-identically with reversed record order', () => {
  const session = stocked(), before = serializeCharacterLifeSave(session);
  expect(before.success).toBe(true);
  const decoded = recordsToSession(sessionToRecords('main', session).reverse());
  expect(decoded).toEqual(session);
  expect(serializeCharacterLifeSave(decoded)).toEqual(before);
});

it('keeps commands canonical when returning older items to inventory and removing the last worn item', () => {
  let session = stocked();
  const commands = [
    { type: 'EQUIP_ITEM', itemId: 2, characterId: 'player' },
    { type: 'UNEQUIP_ITEM', characterId: 'player', slot: 'top' },
    { type: 'CLAIM_STORED_ITEM', itemId: 1 },
    { type: 'UNEQUIP_ITEM', characterId: 'player', slot: 'weapon' },
    { type: 'USE_CONSUMABLE', itemId: 3 },
  ];
  for (const command of commands) {
    const result = executeCharacterLifeCommand(session, { ...command, expectedRevision: session.city.revision });
    expect(result.success).toBe(true);
    if (!result.success) throw Error(result.error.message);
    session = result.next;
    expect(isItemsState(session.city.society!.items, ['player', ...session.npcs.map(n => n.character.id)])).toBe(true);
    expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main', session)))).toEqual(serializeCharacterLifeSave(session));
  }
  expect(session.city.society!.items.inventory.map(item => item.id)).toEqual([1, 2, 4, 5, 7]);
  expect(Object.hasOwn(session.city.society!.items.equipped, 'player')).toBe(false);
});
