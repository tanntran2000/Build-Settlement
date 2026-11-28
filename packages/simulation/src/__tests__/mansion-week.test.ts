import { expect, it, vi } from 'vitest';
import { withNpcs } from '@haven/core/testing/npcs';
import { buildItemWeekContext, crimeRandom, homeRobberyRoll, mansionTerms, safeAmountMilli, type CharacterLifeSessionState, type MansionRole } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { stock, succeeded, town } from './acquisition-fixture.js';
import { resolveCrimeWeek } from '../crime-week.js';

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
  for (const row of catalog.roles.guard.effects) if (row.kind === 'fatalChanceBps') row.amount = 150;
  for (const row of catalog.roles.captain.effects) if (row.kind === 'fatalChanceBps') row.amount = 300;
  for (const row of catalog.roles.accountant.effects) {
    if (row.kind === 'authority') row.amount = 2;
    if (row.kind === 'upkeepBps') row.amount = 9500;
  }
  for (const row of catalog.roomTypes['guard-quarters'].effects) {
    if (row.kind === 'chaseSuccessBps') row.amount = 300;
    if (row.kind === 'fatalChanceBps') row.amount = 200;
  }
  for (const row of catalog.roomTypes['throne-room'].effects) row.amount = 2;
  for (const [kind, amount] of Object.entries({ safeAmountMilli: 1500, robberyChanceBps: 200, vaultLossCapBps: 4000 }))
    catalog.roomTypes.vault.effects.find(row => row.kind === kind)!.amount = amount;
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

it('adds all safe-amount contributors after the legacy difficulty base and gives the Captain only Guards to boost', () => {
  const s = household('guard', 'captain', 'accountant', 'maid');
  s.city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = 2;
  const guardRoom = addRoom(s, 'guard-quarters', 1);
  addRoom(s, 'vault', 1);
  s.npcs[0].household.room = guardRoom;
  s.npcs[1].household.room = guardRoom;
  const funded = mansionTerms(s)?.paid;
  expect(funded?.safeAmount).toStrictEqual({ guard: 3750, captain: 3000, vault: 1500, accountant: 1500 });
  expect(safeAmountMilli(25, 'normal', funded)).toBe(31000);
  expect(safeAmountMilli(25, 'easy', funded)).toBe(52250);
  expect(end(s).report?.mansion?.comfortSupply).toBe(3);
  expect(mansionTerms(s)?.plain?.safeAmount).toStrictEqual({ guard: 2000, captain: 2000, vault: 0, accountant: 1000 });
  const starter = mansionTerms(town())?.paid;
  expect([safeAmountMilli(25, 'normal', starter), safeAmountMilli(25, 'easy', starter)]).toStrictEqual([21250, 42500]);
});

it.each([
  [50, 0, 0.4999, 'killed'], [50, 0, 0.5, 'wounded'],
  [100, 0, 0.3999, 'killed'], [100, 0, 0.4, 'wounded'],
  [50, 150, 0.4849, 'killed'], [50, 150, 0.485, 'wounded'],
  [50, 4900, 0.0999, 'killed'], [50, 4900, 0.1, 'wounded'],
] as const)('uses four original draws at combat %i, Mansion reduction %i and fatal roll %s', (combat, reduction, fatal, outcome) => {
  const s = town();
  Object.assign(s.city.society!.order, { crime: 100, security: 0 });
  const context = buildItemWeekContext(s);
  context.playerSkills.combat = combat;
  const expectedRolls = [0, 0.99, 0.9, fatal];
  const actualRolls: number[] = [];
  const result = resolveCrimeWeek(s.city, new Set(), () => {
    const roll = expectedRolls[actualRolls.length];
    actualRolls.push(roll);
    return roll;
  }, context, reduction);
  expect(result.event?.outcome).toBe(outcome);
  expect(actualRolls).toStrictEqual(expectedRolls);
});

it('uses no fatal draw when the existing foil or Crime gate prevents it', () => {
  for (const [crime, security, foil, outcome] of [[100, 29, 0.28, 'foiled'], [89, 0, 0, 'wounded']] as const) {
    const s = town();
    Object.assign(s.city.society!.order, { crime, security });
    const rolls = [0, 0.99, foil], consumed: number[] = [];
    const result = resolveCrimeWeek(s.city, new Set(), () => {
      const roll = rolls[consumed.length];
      consumed.push(roll);
      return roll;
    }, undefined, 150);
    expect(result.event?.outcome).toBe(outcome);
    expect(consumed).toStrictEqual(rolls);
  }
});

it('gates Guard Quarters fatal relief on defensive staff and funding', () => {
  const s = household('guard', 'captain');
  s.city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = 2;
  addRoom(s, 'guard-quarters', 3);
  expect([mansionTerms(s)?.plain?.fatalChanceBps, mansionTerms(s)?.paid?.fatalChanceBps]).toStrictEqual([600, 875]);
  s.npcs[0].household.role = null;
  expect(mansionTerms(s)?.paid?.fatalChanceBps).toBe(500);
  s.npcs[1].household.role = null;
  expect(mansionTerms(s)?.paid?.fatalChanceBps).toBe(0);
});

it('keeps the original seeded stream while lowering the conditional threshold', () => {
  const seed = 20;
  const r = crimeRandom(seed, 1);
  const rolls = [r(), r(), r(), r()];
  const resolve = (reduction: number) => {
    const s = town(seed);
    Object.assign(s.city.society!.order, { crime: 100, security: 5 });
    const rng = crimeRandom(seed, 1), seen: number[] = [];
    resolveCrimeWeek(s.city, new Set(), () => {
      const roll = rng();
      seen.push(roll);
      return roll;
    }, undefined, reduction);
    return seen;
  };
  expect(resolve(0)).toStrictEqual(rolls);
  expect(resolve(150)).toStrictEqual(rolls);
});

it('applies the paid Vault term at card creation even with an empty Mansion', () => {
  const s = town(2);
  const vault = addRoom(s, 'vault', 1);
  s.player.purse.moneyMilli = 32750;
  expect(homeRobberyRoll(2, 1, 'home-robbery')).toBe(1024.8347069136798);
  expect(end(s).report?.purse?.robbery).toStrictEqual({ outcome: 'pending', excessMilli: 10000 });
  mansion(s).rooms.find(room => room.id === vault)!.level = 2;
  expect(end(s).next.player.purse.robbery).toBeNull();
});

function pendingRobbery() {
  const s = town(2);
  s.city.world.week = 2;
  s.city.society!.order.security = 25;
  s.player.purse.moneyMilli = 20000;
  s.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 10000 };
  return s;
}

it('raises the existing chase probability only when Guard Quarters level 2 is funded', () => {
  const s = pendingRobbery();
  s.city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = 2;
  const quarters = addRoom(s, 'guard-quarters', 1);
  expect(homeRobberyRoll(2, 1, 'home-robbery-chase')).toBe(6439.902621787041);
  expect(succeeded(s, 'ANSWER_ROBBERY', { option: 'chase' }).robberyResolution)
    .toStrictEqual({ week: 1, excessMilli: 10000, lossMilli: 6000, outcome: 'chase-failure' });
  mansion(s).rooms.find(room => room.id === quarters)!.level = 2;
  expect(succeeded(s, 'ANSWER_ROBBERY', { option: 'chase' }).robberyResolution)
    .toStrictEqual({ week: 1, excessMilli: 10000, lossMilli: 0, outcome: 'chase-success' });
  stock(s).gold = 0;
  expect(succeeded(s, 'ANSWER_ROBBERY', { option: 'chase' }).robberyResolution)
    .toStrictEqual({ week: 1, excessMilli: 10000, lossMilli: 6000, outcome: 'chase-failure' });
});

it.each([['pay', 'pay', 2500], ['let-go', 'let-go', 4000], ['chase', 'chase-failure', 4000]] as const)
('caps paid level-3 Vault loss for %s with original held excess after reload', (option, outcome, lossMilli) => {
  const s = pendingRobbery();
  addRoom(s, 'vault', 3);
  const save = serializeCharacterLifeSave(s);
  if (!save.success) throw Error(save.error.message);
  const decoded = deserializeCharacterLifeSave(save.text);
  if (!decoded.success) throw Error(decoded.error.message);
  const answered = succeeded(s, 'ANSWER_ROBBERY', { option });
  expect(succeeded(decoded.state, 'ANSWER_ROBBERY', { option })).toStrictEqual(answered);
  expect(answered.robberyResolution).toStrictEqual({ week: 1, excessMilli: 10000, lossMilli, outcome });
  expect(answered.next.player.purse.moneyMilli).toBe(20000 - lossMilli);
});

it('boosts all three Accountant effects when a paid Vault exists', () => {
  const s = household('accountant');
  expect(end(s).report?.mansion).toStrictEqual(report(0, 1, 2850, true, 2));
  expect(mansionTerms(s)?.paid?.safeAmount.accountant).toBe(1000);
  addRoom(s, 'vault', 1);
  expect(end(s).report?.mansion).toStrictEqual(report(0, 1, 2775, true, 3));
  expect(mansionTerms(s)?.paid?.safeAmount.accountant).toBe(1500);
});

it('adds only the paid Throne Room levels to the Authority target before drift', () => {
  const s = town();
  const base = end(s).report!.order!.targets.authority;
  for (const level of [2, 3] as const) {
    mansion(s).rooms[1].level = level;
    const result = end(s).report!;
    expect(result.order!.targets.authority).toBe(base + 2 * (level - 1));
    expect(result.mansion).toStrictEqual(report(0, 0, 2000 + 100 * (level - 1), true, 2 * (level - 1)));
  }
});

it('accounts for Order theft and city robbery before granting the Throne Room term', () => {
  const s = town(5);
  setQuietGold(s, 2200);
  Object.assign(s.city.society!.order, { security: 0, crime: 60, authority: 50 });
  mansion(s).rooms[1].level = 2;
  const result = end(s).report!;
  expect(result.crimeEvent?.event).toStrictEqual({ kind: 'robbery', severity: 'serious', target: 'gold', lossMilli: 212 });
  expect(result.order!.theftMilli.gold).toBe(77);
  expect(result.order!.targets.authority).toBe(24);
  expect(result.mansion).toStrictEqual(report(0, 0, 2100, false));
  expect(result.after.gold).toBe(911);
  stock(s).gold = 2500;
  const funded = end(s).report!;
  expect(funded.mansion).toStrictEqual(report(0, 0, 2100, true, 2));
  expect(funded.order!.targets.authority).toBe(26);
});
