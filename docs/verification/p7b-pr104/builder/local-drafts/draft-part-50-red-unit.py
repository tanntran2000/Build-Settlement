test_helper = sim+'__tests__/acquisition-fixture.ts'
new(test_helper,'''import { acquisitionNpc, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, P7A_TRIAL, type CharacterLifeSessionState } from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';

export function town(seed = 42): CharacterLifeSessionState {
  const made = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Market Keeper' });
  if (!made.success) throw Error(made.error.message);
  stock(made.value).gold = 1_000_000;
  return made.value;
}
export function stock(s: CharacterLifeSessionState) {
  return s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
}
export function command(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  return executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
}
export function succeeded(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const result = command(s, type, fields);
  if (!result.success) throw Error(type + ': ' + result.error.code + ': ' + result.error.message);
  return result;
}
export function market() {
  return succeeded(succeeded(succeeded(town(), 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next,
    'BUILD', { tileId: 'spec-2', typeId: 'auction-house' }).next, 'BUILD', { tileId: 'slum-1', typeId: 'slave-market' }).next;
}
export function populate(s: CharacterLifeSessionState, homes: readonly string[]) {
  s.city.society!.wallRing = 2;
  s.city.world.week = homes.length + 1;
  for (const [id, typeId, level] of [['estate-1', 'mansion', 3], ['estate-2', 'retainers-hall', 2], ['house-5', 'retainers-hall', 2]] as const) {
    s.city.tiles.find(t => t.id === id)!.building = { typeId, level, workers: 0, enabled: true };
  }
  const names = new Set<string>();
  for (const [index, home] of homes.entries()) {
    let salt = 0;
    let { npc, profile } = acquisitionNpc(s.outside.seed, index + 1, 'guild', 0, salt);
    while (names.has(npc.character.name)) ({ npc, profile } = acquisitionNpc(s.outside.seed, index + 1, 'guild', 0, ++salt));
    names.add(npc.character.name);
    npc.household.home = home;
    npc.life.history.recent = Array.from({ length: P7A_TRIAL.recentCap }, () => ({ week: index + 1, kind: 'birthday' }));
    s.npcs.push(npc); s.profiles.push(profile);
  }
}
''','Reusable test-only commands, funded buildings and valid 100-NPC fixture for RED and save measurement.')
new(sim+'__tests__/npc-acquisition.test.ts','''import { describe, expect, it } from 'vitest';
import { acquireUnusedName, acquisitionNpc, buildItemWeekContext, emptyAcquisition, isAcquisitionState,
  ITEM_TRIAL, npcSellMilli, npcValueMilli, type CharacterLifeSessionState } from '@haven/core';
import { deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave, sessionToRecords } from '@haven/persistence';
import { ACQUISITION_MESSAGES, drawAcquisition } from '../npc-acquisition.js';
import { executeWorldNpcCityCommand } from '../world-npc.js';
import { command, market, populate, stock, succeeded, town } from './acquisition-fixture.js';

const state = (s: CharacterLifeSessionState) => s.city.society!.acquisition;
const guild = { source: 'guild', slot: 0, homeTileId: 'estate-1' };
function refuse(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown>, code: keyof typeof ACQUISITION_MESSAGES) {
  const before = JSON.stringify(s);
  expect(command(s, type, fields)).toStrictEqual({ success: false, error: { code, message: ACQUISITION_MESSAGES[code] } });
  expect(JSON.stringify(s)).toBe(before);
}

describe('P7-B weekly acquisition', () => {
  it('draws four offers per enabled building and no new offers for paused or missing sources', () => {
    const initial = town(), full = market();
    expect(state(initial)).toStrictEqual(emptyAcquisition());
    for (const source of ['guild', 'auction-house', 'slave-market']) expect(state(full).stock.filter(o => o.source === source)).toHaveLength(4);
    const paused = succeeded(full, 'SET_ENABLED', { tileId: 'service-1', enabled: false }).next;
    const next = succeeded(paused, 'END_WEEK', { expectedWeek: 1 }).next;
    expect(state(next).stock.map(o => o.source)).toStrictEqual([...Array<string>(4).fill('auction-house'), ...Array<string>(4).fill('slave-market')]);
    refuse(paused, 'BUY_NPC', guild, 'NO_BUILDING');
    refuse(initial, 'BUY_NPC', guild, 'NO_BUILDING');
  });

  it('matches a midweek build and a draw for the same week and reserves distinct full names', () => {
    const initial = town(), next = succeeded(initial, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
    const forDraw = structuredClone(next); forDraw.city.society!.acquisition = emptyAcquisition();
    expect(drawAcquisition(next.outside.seed, 1, forDraw.city)).toStrictEqual(state(next));
    const names = new Set(state(next).stock.map(o => acquisitionNpc(next.outside.seed, 1, o.source, o.slot, o.nameSalt).npc.character.name));
    expect(names.size).toBe(4);
    const occupied = acquisitionNpc(next.outside.seed, 1, 'guild', 0, 0).npc;
    const drawn = drawAcquisition(next.outside.seed, 1, forDraw.city, [occupied]);
    expect(drawn.stock[0].nameSalt).toBe(1);
    expect(acquisitionNpc(next.outside.seed, 1, 'guild', 0, 1).npc.character.name).not.toBe(occupied.character.name);
  });

  it('deducts the exact hire fee, leaves zero, adds NPC and profile, and closes the slot', () => {
    const s = market(), { npc, profile } = acquisitionNpc(s.outside.seed, 1, 'guild', 0, state(s).stock[0].nameSalt);
    stock(s).gold = npcValueMilli(npc, 'guild', false);
    const next = succeeded(s, 'BUY_NPC', guild).next;
    npc.household.home = 'estate-1';
    expect([stock(next).gold, next.city.revision, state(next).stock[0].status]).toStrictEqual([0, s.city.revision + 1, 'bought']);
    expect(next.npcs).toStrictEqual([npc]); expect(next.profiles).toStrictEqual([profile]);
    refuse(next, 'BUY_NPC', guild, 'OFFER_GONE');
    refuse(s, 'BUY_NPC', { ...guild, expectedRevision: s.city.revision - 1 }, 'STALE_COMMAND');
    refuse({ ...s, city: { ...s.city, world: { ...s.city.world, settlements: structuredClone(s.city.world.settlements) } } },
      'BUY_NPC', { ...guild, homeTileId: 'field-1' }, 'NO_BED');
    stock(s).gold -= 1000;
    refuse(s, 'BUY_NPC', guild, 'NOT_ENOUGH_GOLD');
  });

  it('refuses a full 10-bed Mansion and 100 NPCs without changing any bytes', () => {
    const full = town();
    populate(full, Array<string>(10).fill('estate-1'));
    full.city.tiles.find(t => t.id === 'estate-1')!.building!.level = 1;
    const mansion = succeeded(full, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
    refuse(mansion, 'BUY_NPC', guild, 'NO_BED');
    const cap = town();
    populate(cap, [...Array<string>(30).fill('estate-1'), ...Array<string>(50).fill('estate-2'), ...Array<string>(20).fill('house-5')]);
    const capped = succeeded(cap, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
    expect(capped.npcs).toHaveLength(100);
    refuse(capped, 'BUY_NPC', { ...guild, homeTileId: 'house-5' }, 'NPC_CAP');
  });

  it('refuses a posted slave with two items and storage at 9/10, then sells with one item at 60 percent', () => {
    const bought = succeeded(market(), 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId: 'estate-2' }).next;
    const npcId = bought.npcs[0].character.id;
    const posted = succeeded(bought, 'ASSIGN_NPC', { npcId, tileId: 'field-1' }).next;
    const items = posted.city.society!.items;
    items.storage = Array.from({ length: 9 }, (_, index) => ({ item: { id: index + 1, defId: 'common-ring-npc' }, expiresWeek: 2 }));
    items.equipped[npcId] = { ring: { id: 10, defId: 'common-ring-npc' }, necklace: { id: 11, defId: 'common-necklace-npc' } };
    items.nextItemId = 12;
    refuse(posted, 'SELL_NPC', { npcId }, 'STORAGE_FULL');
    refuse(posted, 'RELEASE_NPC', { npcId }, 'STORAGE_FULL');
    delete items.equipped[npcId].necklace;
    const sold = succeeded(posted, 'SELL_NPC', { npcId }).next;
    expect(stock(sold).gold - stock(posted).gold).toBe(Math.round(npcValueMilli(posted.npcs[0], 'slave-market', false) * 0.6));
    expect(stock(sold).gold - stock(posted).gold).toBe(npcSellMilli(posted.npcs[0]));
    expect([sold.npcs, sold.profiles, sold.city.society!.items.equipped]).toStrictEqual([[], [], {}]);
    expect(sold.city.society!.items.storage).toStrictEqual([...items.storage, {
      item: { id: 10, defId: 'common-ring-npc' }, expiresWeek: 1 + ITEM_TRIAL.storageWeeks,
    }]);
    const ended = succeeded(sold, 'END_WEEK', { expectedWeek: 1 });
    expect(ended.report!.household!.sold).toStrictEqual([posted.npcs[0].character.name]);
    expect(state(ended.next).stock).toHaveLength(12);
    expect(state(ended.next).week).toBe(2);
    expect(state(ended.next).stock.map(o => acquisitionNpc(sold.outside.seed, 2, o.source, o.slot, o.nameSalt).npc.character.id)).not.toContain(npcId);
  });

  it('refuses selling a servant, releases for zero Gold, and preserves names in the weekly report', () => {
    const s = succeeded(market(), 'BUY_NPC', guild).next;
    const { id: npcId, name } = s.npcs[0].character;
    refuse(s, 'SELL_NPC', { npcId }, 'NOT_A_SLAVE');
    const paused = succeeded(s, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next;
    refuse(paused, 'SELL_NPC', { npcId }, 'NO_BUILDING');
    const released = succeeded(s, 'RELEASE_NPC', { npcId }).next;
    expect([stock(released).gold, released.npcs.length, released.profiles.length]).toStrictEqual([stock(s).gold, 0, 0]);
    const r = succeeded(released, 'END_WEEK', { expectedWeek: 1 }).report!;
    expect(r.household!.bought).toStrictEqual([name]); expect(r.household!.released).toStrictEqual([name]);
  });

  it('keeps an empty no-market report byte-identical to the city week', () => {
    const s = town(), raw = { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: 1 };
    const baseline = executeWorldNpcCityCommand({ city: s.city, outside: s.outside, npcs: s.npcs }, raw, buildItemWeekContext(s));
    expect(baseline.success).toBe(true); if (!baseline.success) throw Error(baseline.error.message);
    const result = succeeded(s, 'END_WEEK', { expectedWeek: 1 });
    expect(JSON.stringify(result.report)).toBe(JSON.stringify(baseline.report));
    expect(Object.hasOwn(result.report!, 'household')).toBe(false);
  });

  it('round trips a 100-NPC save with 12 offers, two lots and full histories under 1 MiB', () => {
    const s = town();
    populate(s, [...Array<string>(30).fill('estate-1'), ...Array<string>(50).fill('estate-2'), ...Array<string>(20).fill('house-5')]);
    let next = s;
    for (const [tileId, typeId] of [['service-1', 'guild'], ['spec-2', 'auction-house'], ['slum-1', 'slave-market']]) {
      next = succeeded(next, 'BUILD', { tileId, typeId }).next;
    }
    expect([next.npcs.length, state(next).stock.length, state(next).lots.length]).toStrictEqual([100, 12, 2]);
    const encoded = serializeCharacterLifeSave(next);
    if (!encoded.success) throw Error(encoded.error.message);
    expect(Buffer.byteLength(encoded.text, 'utf8')).toBeLessThanOrEqual(1_048_576);
    expect(deserializeCharacterLifeSave(encoded.text)).toStrictEqual({ success: true, state: next, text: encoded.text });
    expect(recordsToSession(sessionToRecords('main', next))).toStrictEqual(next);
  });

  it('rejects a malformed, missing or duplicate acquisition field without accepting a partial state', () => {
    const s = market(), a = state(s);
    expect(isAcquisitionState({ ...a, stock: [...a.stock, a.stock[0]] })).toBe(false);
    expect(isAcquisitionState({ ...a, lots: a.lots.map(lot => ({ ...lot, out: [false] })) })).toBe(false);
    expect(isAcquisitionState({ ...a, week: 0 })).toBe(false);
    const encoded = serializeCharacterLifeSave(s);
    if (!encoded.success) throw Error(encoded.error.message);
    const bad = JSON.parse(encoded.text);
    delete bad.state.city.society.acquisition;
    const refused = deserializeCharacterLifeSave(JSON.stringify(bad));
    expect(refused.success).toBe(false);
    expect(serializeCharacterLifeSave(s)).toStrictEqual(encoded);
  });
});
'''.replace('acquireUnusedName, ',''),'B3.1 RED cases, RF2/RF3, save-size bound and no-activity report bytes.')
new(sim+'__tests__/npc-auction.test.ts','''import { expect, it } from 'vitest';
import { auctionOpeningMilli, auctionRivals, generateNpc, npcValueMilli, type AuctionRival } from '@haven/core';
import { deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave, sessionToRecords } from '@haven/persistence';
import { auctionRound, auctionTranscript, closeAuctionLot } from '../npc-auction.js';
import { command, stock, succeeded, town } from './acquisition-fixture.js';

const source = 'auction-house';
const homeTileId = 'estate-1';
const bid = { source, homeTileId, raise: 5000 };
const rival = (name: string, ceilingMilli: number): AuctionRival => ({ name, ceilingMilli, hint: 'Steady' });
const setup = (seed: number) => succeeded(town(seed), 'BUILD', { tileId: 'spec-2', typeId: source }).next;
const lotOf = (s: ReturnType<typeof setup>) => s.city.society!.acquisition.lots[0];

it('rounds 70 percent of value up to 5 Gold and pins the exact +5 and +25 raises and +5 reply', () => {
  expect(auctionOpeningMilli(55_000)).toBe(40_000);
  expect(auctionOpeningMilli(50_000)).toBe(35_000);
  const rivals = [rival('High', 90_000), rival('Low', 54_999)];
  expect(auctionRound(45_000, 5_000, [false, false], rivals)).toStrictEqual({
    priceMilli: 55_000, leader: 0, out: [false, true], dropped: [1], playerBidMilli: 50_000,
  });
  expect(auctionRound(45_000, 25_000, [false, false], rivals)).toStrictEqual({
    priceMilli: 75_000, leader: 0, out: [false, true], dropped: [1], playerBidMilli: 70_000,
  });
  expect(auctionRound(75_000, 25_000, [false, true], rivals)).toStrictEqual({
    priceMilli: 100_000, leader: 'player', out: [true, true], dropped: [0], playerBidMilli: 100_000,
  });
});

it('preserves 2–4 seeded rivals, fixed 0.80–1.30 ceilings and the cap across 1,000 lots', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const market = seed % 2 ? 'slave-market' : source;
    const { npc } = generateNpc(seed, 1, market, 'lot');
    const value = npcValueMilli(npc, market, true), rivals = auctionRivals(seed, 1, market);
    expect(auctionRivals(seed, 1, market)).toStrictEqual(rivals);
    expect(rivals.length).toBeGreaterThanOrEqual(2); expect(rivals.length).toBeLessThanOrEqual(4);
    expect(new Set(rivals.map(entry => entry.name)).size).toBe(rivals.length);
    for (const { ceilingMilli, hint } of rivals) {
      expect(ceilingMilli).toBeGreaterThanOrEqual(value * 0.8);
      expect(ceilingMilli).toBeLessThanOrEqual(value * 1.3);
      expect(hint).toBe(ceilingMilli >= value * 1.15 ? 'Keen' : ceilingMilli >= value * 0.95 ? 'Steady' : 'Cautious');
    }
    let price = auctionOpeningMilli(value), out = rivals.map(() => false);
    for (;;) {
      const round = auctionRound(price, seed % 2 ? 5000 : 25000, out, rivals);
      expect(round.priceMilli).toBeLessThanOrEqual(value * 1.3 + 25_000);
      price = round.priceMilli; out = round.out;
      if (round.leader === 'player') break;
    }
  }
});

it('restores a rival-leading 55 Gold lot and yields the exact same +5 outcome after text and row reload', () => {
  const seed = Array.from({ length: 1000 }, (_, index) => index).find(candidate => {
    const value = npcValueMilli(generateNpc(candidate, 1, source, 'lot').npc, source, true);
    const rivals = auctionRivals(candidate, 1, source);
    const round = auctionRound(auctionOpeningMilli(value), 5000, rivals.map(() => false), rivals);
    return round.priceMilli === 55_000 && typeof round.leader === 'number';
  });
  if (seed === undefined) throw Error('No seeded 55 Gold lot.');
  const start = setup(seed), before = succeeded(start, 'BID_NPC', bid).next;
  const pinned = lotOf(before);
  expect(pinned.priceMilli).toBe(55_000); expect(typeof pinned.leader).toBe('number');
  expect(stock(before).gold).toBe(stock(start).gold);
  const text = serializeCharacterLifeSave(before);
  if (!text.success) throw Error(text.error.message);
  const loaded = deserializeCharacterLifeSave(text.text);
  if (!loaded.success) throw Error(loaded.error.message);
  expect(loaded.state).toStrictEqual(before);
  const rows = recordsToSession(sessionToRecords('main', before));
  expect(rows).toStrictEqual(before);
  const rivals = auctionRivals(seed, 1, source);
  const opening = auctionOpeningMilli(npcValueMilli(generateNpc(seed, 1, source, 'lot').npc, source, true));
  expect(auctionTranscript(opening, lotOf(loaded.state), rivals)).toStrictEqual(auctionTranscript(opening, pinned, rivals));
  const bidAfterReload = succeeded(loaded.state, 'BID_NPC', bid);
  expect(bidAfterReload).toStrictEqual(succeeded(before, 'BID_NPC', bid));
  expect(succeeded(rows, 'BID_NPC', bid)).toStrictEqual(bidAfterReload);
});

it('withdraws to the leader, and an unentered lot closes to the first maximum-ceiling rival at opening', () => {
  const s = setup(42), lot = lotOf(s), rivals = auctionRivals(42, 1, source);
  const winner = rivals.findIndex(rival => rival.ceilingMilli === Math.max(...rivals.map(entry => entry.ceilingMilli)));
  const withdrawn = succeeded(s, 'WITHDRAW_BID', { source }).next;
  expect(lotOf(withdrawn)).toStrictEqual({ ...lot, leader: winner, status: 'lost' });
  expect(stock(withdrawn).gold).toBe(stock(s).gold);
  const closed = structuredClone(lot);
  closeAuctionLot(closed, rivals, 'sold');
  expect(closed).toStrictEqual({ ...lot, leader: winner, status: 'sold' });
  expect(succeeded(s, 'END_WEEK', { expectedWeek: 1 }).report!.household!.lotsToRivals).toStrictEqual([{ source, priceMilli: lot.priceMilli }]);
});

it('charges only the winning bid and refuses one Gold short or an invalid home atomically', () => {
  let s = setup(42);
  const initialGold = stock(s).gold;
  const poor = structuredClone(s);
  stock(poor).gold = lotOf(s).priceMilli + 5000 - 1000;
  for (const [state, fields, code, message] of [[poor, bid, 'NOT_ENOUGH_GOLD', 'There is not enough Gold.'],
    [s, { ...bid, homeTileId: 'field-1' }, 'NO_BED', 'That home has no free bed.']] as const) {
    const before = JSON.stringify(state);
    expect(command(state, 'BID_NPC', fields)).toStrictEqual({ success: false, error: { code, message } });
    expect(JSON.stringify(state)).toBe(before);
  }
  let winningBid = 0;
  while (lotOf(s).status === 'open') {
    winningBid = lotOf(s).priceMilli + 25000;
    const next = succeeded(s, 'BID_NPC', { ...bid, raise: 25000 }).next;
    if (lotOf(next).status === 'open') expect(stock(next).gold).toBe(initialGold);
    s = next;
  }
  expect([lotOf(s).status, lotOf(s).priceMilli, stock(s).gold, s.npcs.length, s.profiles.length])
    .toStrictEqual(['won', winningBid, initialGold - winningBid, 1, 1]);
});
''','B3.2 RED cases with exact auction amounts, pinned replay and 1,000-lot bound.')
