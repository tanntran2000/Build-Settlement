import { expect, it, vi } from 'vitest';
import { withNpcs } from '@haven/core/testing/npcs';
import type { CharacterLifeSessionState, MansionRole } from '@haven/core';
import { stock, succeeded, town } from './acquisition-fixture.js';

// Fixed catalog inputs isolate effect math from R2.4's calibrated values.
vi.mock('../../../core/src/mansion/catalog.js', async importOriginal => {
  const original = await importOriginal<typeof import('@haven/core')>();
  const catalog = structuredClone(original.MANSION_CATALOG);
  catalog.roles.maid.effects[0].amount = 2;
  for (const role of ['head-maid', 'captain'] as const) {
    catalog.roles[role].effects = [
      ...catalog.roles[role].effects.filter(row => row.kind !== 'roleBonusBps'),
      { kind: 'roleBonusBps', level: 1, amount: 20_000 },
    ];
  }
  catalog.roomTypes.bedroom.effects[0].amount = -2;
  return { ...original, MANSION_CATALOG: catalog };
});

function household(...roles: (MansionRole | null)[]) {
  const state = withNpcs(town(), roles.map((_, slot) => ({ week: 1, source: 'guild' as const, slot })));
  for (const [i, npc] of state.npcs.entries()) Object.assign(npc.household, {
    home: 'estate-1', room: 'room-3', status: 'lifelong', contract: null, role: roles[i],
  });
  return state;
}

const end = (s: CharacterLifeSessionState) => succeeded(s, 'END_WEEK', { expectedWeek: s.city.world.week });
const mansion = (s: CharacterLifeSessionState) => s.city.society!.mansion;
const report = (comfortSupply: number, comfortNeed: number, upkeepMilli: number, upkeepPaid: boolean, authority = 0) =>
  ({ comfortSupply, comfortNeed, upkeepMilli, upkeepPaid, authority });

function addRoom(s: CharacterLifeSessionState, typeId: string, level: 1 | 2 | 3) {
  const room = { id: 'room-' + mansion(s).nextRoomSeq++, typeId, level, furniture: [] };
  mansion(s).rooms.push(room);
  return room.id;
}

function setQuietGold(s: CharacterLifeSessionState, goldMilli: number) {
  const classes = s.city.society!.classes;
  classes.free = 0;
  for (const group of [classes.makers, classes.luminaries, classes.merchants]) Object.assign(group, { common: 0, elite: 0 });
  for (const key of ['free', 'makers', 'luminaries', 'merchants'] as const) classes.bound[key] = 0;
  s.city.world.settlements[s.city.world.activeSettlementId!].cohorts[0].count = 0;
  for (const tile of s.city.tiles) if (tile.building && !tile.id.startsWith('estate-')) {
    Object.assign(tile.building, { workers: 0, enabled: false });
  }
  stock(s).gold = goldMilli;
}

it('reports 2 Comfort from a Maid in a Bedroom and 3 in Maids’ Quarters, with no level-1 room charge', () => {
  const s = household('maid');
  const bedroom = addRoom(s, 'bedroom', 1);
  expect(end(s).report?.mansion).toStrictEqual(report(3, 1, 2000, true));
  s.npcs[0].household.room = bedroom;
  expect(end(s).report?.mansion).toStrictEqual(report(2, 1, 2000, true));
});

it('adds only Head Maid leadership to Maid Comfort and leaves Guard and Captain Comfort at zero', () => {
  const s = household('maid', 'head-maid', 'guard', 'captain');
  const first = end(s).report?.mansion;
  // The fitted Leader gives 3 Comfort herself and adds 150% of the Maid's 3 (whole-point total floored).
  expect(first).toStrictEqual(report(10, 4, 2000, true));
  s.npcs[1].household.role = null;
  expect(end(s).report?.mansion).toStrictEqual(report(3, 4, 3000, true));
});

it.each([[2835, true, 0], [2834, false, 1834]] as const)
('charges the entire 2835 milli short-Comfort upkeep at %i or leaves the Mansion debit at zero', (gold, paid, after) => {
  const s = household('maid', null, null, null);
  mansion(s).rooms[2].level = 2;
  setQuietGold(s, gold);
  const before = JSON.stringify(s);
  const r = end(s);
  expect(r.report?.mansion).toStrictEqual(report(paid ? 3 : 2, 4, 2835, paid));
  expect(r.report?.householdUpkeep).toStrictEqual(paid ? { paidMilli: 2835, unpaidMilli: 1000 } : { paidMilli: 1000, unpaidMilli: 2835 });
  expect(stock(r.next).gold).toBe(after);
  expect(JSON.stringify(s)).toBe(before);
});

it('discounts building and room upkeep at level 2 when Comfort is supplied', () => {
  const s = household('maid');
  mansion(s).rooms[2].level = 2;
  expect(end(s).report?.mansion).toStrictEqual(report(3, 1, 1890, true));
});

it.each([[2, 50], [3, 50], [3, 100]] as const)
('applies only funded Bedroom level %i terms for affection starting at %i', (level, affection) => {
  const s = household('maid');
  const bedroom = addRoom(s, 'bedroom', level);
  s.npcs[0].household.room = bedroom;
  s.npcs[0].life.stress = 10;
  s.npcs[0].character.relationshipToPlayer.affection = affection;
  const funded = end(s).next.npcs[0];
  setQuietGold(s, 0);
  const unfunded = end(s).next.npcs[0];
  expect(funded.life.stress).toBe(unfunded.life.stress - 2);
  expect([unfunded.character.relationshipToPlayer.affection, funded.character.relationshipToPlayer.affection])
    .toStrictEqual([affection, Math.min(100, affection + Number(level === 3))]);
});
