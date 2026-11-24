import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState } from '@haven/core';
import { NPC_TEST_KEYS, withNpcs } from '@haven/core/testing/npcs';
import { succeeded } from './acquisition-fixture.js';

it('uses the seed-25 Guild slot 2 name from reconstructed and retained offers', () => {
  const created = createCharacterLifeSession(25, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Market Keeper' });
  if (!created.success) throw Error(created.error.message);
  const key = NPC_TEST_KEYS[2], homeTileId = 'estate-2';
  const built = succeeded(created.value, 'BUILD', { tileId: 'service-1', typeId: key.source }).next;
  const bought = succeeded(built, 'BUY_NPC', { source: key.source, slot: key.slot, homeTileId }).next;
  const acquisition = bought.city.society!.acquisition;
  expect(bought.npcs[0].character.name).toBe('Ragna Fircrest');
  expect(acquisition.stock[key.slot]).toStrictEqual({ source: key.source, slot: key.slot, nameSalt: 1, status: 'bought' });
  expect(acquisition.stock[0]).toStrictEqual({ source: key.source, slot: 0, nameSalt: 0, status: 'open' });

  for (const initial of [created.value, built]) {
    const before = structuredClone(initial);
    const fixture = withNpcs(initial, [key]);
    expect(isCharacterLifeSessionState(fixture)).toBe(true);
    expect(fixture.npcs).toStrictEqual(bought.npcs);
    expect(fixture.profiles).toStrictEqual(bought.profiles);
    expect(fixture.city.society!.acquisition).toStrictEqual(acquisition);
    expect(initial).toStrictEqual(before);
  }
});
