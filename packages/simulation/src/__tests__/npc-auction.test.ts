import { expect, it } from 'vitest';
import { auctionOpeningMilli, auctionRivals, generateNpc, npcValueMilli, type AuctionRival } from '@haven/core';
import { deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave, sessionToRecords } from '@haven/persistence';
import { auctionRound, auctionTranscript, closeAuctionLot } from '../npc-auction.js';
import { command, populate, stock, succeeded, town } from './acquisition-fixture.js';

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

it('refuses bids at 100 NPCs with a free bed and while the weekly report is open', () => {
  const cap = town();
  populate(cap, [...Array<string>(30).fill('estate-1'), ...Array<string>(50).fill('estate-2'), ...Array<string>(20).fill('house-5')]);
  const ready = succeeded(cap, 'BUILD', { tileId: 'spec-2', typeId: source }).next;
  const report = succeeded(setup(42), 'END_WEEK', { expectedWeek: 1 }).next;
  for (const [session, fields, code, message] of [
    [ready, { ...bid, homeTileId: 'house-5' }, 'NPC_CAP', 'The NPC roster is full.'],
    [report, bid, 'FORBIDDEN', 'Read the report, then choose Plan next week.'],
  ] as const) {
    const before = JSON.stringify(session);
    expect(command(session, 'BID_NPC', fields)).toStrictEqual({ success: false, error: { code, message } });
    expect(JSON.stringify(session)).toBe(before);
  }
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
