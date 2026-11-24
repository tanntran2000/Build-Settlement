import { expect, it } from 'vitest';
import { acquisitionNpc, auctionOpeningMilli, auctionRivals, emptyAcquisition, marketNpcName, generateNpc, npcValueMilli,
  type CharacterLifeSessionState } from '@haven/core';
import { deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave,
  sessionToRecords, StoreRecordError } from '@haven/persistence';
import { market, populate, stock, succeeded, town } from './acquisition-fixture.js';

const source = 'auction-house';
const homeTileId = 'estate-1';
const invalid = {
  success: false,
  error: {
    code: 'INVALID_SAVE_STATE',
    message: 'Checkpoint must contain a valid complete Character Life session in Planning.',
  },
};
const lotAt = (session: CharacterLifeSessionState) => session.city.society!.acquisition.lots[0];

function auctionFixture(minimumRounds: number, minimumRivals: number) {
  for (let seed = 0; seed < 1000; seed += 1) {
    const value = npcValueMilli(generateNpc(seed, 1, source, 'lot').npc, source, true);
    const opening = auctionOpeningMilli(value);
    const rivals = auctionRivals(seed, 1, source);
    const priceMilli = opening + 10_000 * minimumRounds;
    const winner = rivals.reduce((best, rival, index) =>
      rival.ceilingMilli > rivals[best].ceilingMilli ? index : best, 0);
    const out = rivals.map(rival => rival.ceilingMilli < priceMilli);
    if (out.filter(flag => !flag).length < minimumRivals) continue;
    const session = succeeded(town(seed), 'BUILD', { tileId: 'spec-2', typeId: source }).next;
    const acquisition = session.city.society!.acquisition;
    const used = new Set(acquisition.stock.map(offer => marketNpcName(seed, 1, offer.source, offer.slot, offer.nameSalt).name));
    let nameSalt = 0;
    while (used.has(marketNpcName(seed, 1, source, 'lot', nameSalt).name)) nameSalt += 1;
    acquisition.lots = [{ source, nameSalt, priceMilli, leader: winner, out, status: 'open',
      raises: Array<number>(minimumRounds).fill(5000) }];
    return session;
  }
  throw Error('No seeded fixture matched replay constraints.');
}

function assertRefused(session: CharacterLifeSessionState, mutate: (draft: CharacterLifeSessionState) => void) {
  const source = serializeCharacterLifeSave(session);
  if (!source.success) throw Error(source.error.message);
  const envelope = JSON.parse(source.text) as { state: CharacterLifeSessionState };
  mutate(envelope.state);
  const forged = JSON.stringify(envelope);
  const rows = sessionToRecords('main', envelope.state), before = structuredClone(rows);
  expect(deserializeCharacterLifeSave(forged)).toStrictEqual(invalid);
  let rowError: unknown;
  try { recordsToSession(rows); } catch (caught) { rowError = caught; }
  expect(rowError).toBeInstanceOf(StoreRecordError);
  expect((rowError as StoreRecordError).ref).toBe('city:city');
  expect((rowError as Error).message).toBe('Invalid store record: city:city');
  expect(rows).toStrictEqual(before);
  expect(JSON.stringify(envelope)).toBe(forged);
  expect(serializeCharacterLifeSave(session)).toStrictEqual(source);
}

it('refuses an edited legal raise whose counter no longer matches the stored auction', () => {
  assertRefused(auctionFixture(1, 2), draft => { lotAt(draft).raises[0] = 25000; });
});

it('refuses a different in-play leader even when its index and flags are structurally valid', () => {
  assertRefused(auctionFixture(1, 2), draft => {
    const lot = lotAt(draft);
    lot.leader = lot.out.findIndex((out, index) => !out && index !== lot.leader);
  });
});

it('refuses an injected ceiling field and a counter changed by one milli', () => {
  const session = auctionFixture(1, 2);
  assertRefused(session, draft => { Object.assign(lotAt(draft), { ceilingMilli: 130_000 }); });
  assertRefused(session, draft => { lotAt(draft).priceMilli += 1; });
});

it('refuses a forged stock salt and bought flag that cannot be recreated', () => {
  const session = auctionFixture(1, 2);
  assertRefused(session, draft => { draft.city.society!.acquisition.stock[0].nameSalt += 1; });
  assertRefused(session, draft => { draft.city.society!.acquisition.stock[0].status = 'bought'; });
});

it('accepts a four-raise transcript and reproduces the original checkpoint bytes', () => {
  const session = auctionFixture(3, 1);
  const lot = lotAt(session);
  lot.raises.push(25000);
  lot.priceMilli += 25000;
  lot.out = lot.out.map(() => true);
  lot.leader = 'player';
  lot.status = 'won';
  stock(session).gold -= lot.priceMilli;
  const { npc, profile } = acquisitionNpc(session.outside.seed, 1, source, 'lot', lot.nameSalt);
  npc.household.home = homeTileId;
  session.npcs.push(npc);
  session.profiles.push(profile);
  expect(lotAt(session).raises).toStrictEqual([5000, 5000, 5000, 25000]);
  const encoded = serializeCharacterLifeSave(session);
  if (!encoded.success) throw Error(encoded.error.message);
  const result = deserializeCharacterLifeSave(encoded.text);
  expect(result).toStrictEqual({ success: true, state: session });
  if (!result.success) throw Error(result.error.message);
  expect(serializeCharacterLifeSave(result.state)).toStrictEqual(encoded);
  expect(recordsToSession(sessionToRecords('main', result.state))).toStrictEqual(session);
});

it.each(['missing group', 'empty sentinel'])('refuses the %s when a market is enabled', problem => {
  assertRefused(market(), draft => {
    const society = draft.city.society!;
    if (problem === 'missing group') society.acquisition.stock = society.acquisition.stock.filter(offer => offer.source !== 'guild');
    else society.acquisition = emptyAcquisition();
  });
});

it('refuses a removed retained group that could draw a sold ID again', () => {
  const bought = succeeded(market(), 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId }).next;
  const sold = succeeded(bought, 'SELL_NPC', { npcId: bought.npcs[0].character.id }).next;
  const paused = succeeded(sold, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next;
  assertRefused(paused, draft => {
    const { acquisition } = draft.city.society!;
    acquisition.stock = acquisition.stock.filter(offer => offer.source !== 'slave-market');
    acquisition.lots = acquisition.lots.filter(lot => lot.source !== 'slave-market');
  });
});

it('accepts the complete retained group after pausing its building', () => {
  const paused = succeeded(market(), 'SET_ENABLED', { tileId: 'service-1', enabled: false }).next;
  expect(paused.city.society!.acquisition.stock.filter(offer => offer.source === 'guild')).toHaveLength(4);
  const encoded = serializeCharacterLifeSave(paused);
  if (!encoded.success) throw Error(encoded.error.message);
  expect(deserializeCharacterLifeSave(encoded.text)).toStrictEqual({ success: true, state: paused });
  expect(recordsToSession(sessionToRecords('main', paused))).toStrictEqual(paused);
});

it('refuses a status-only edit that reopens a withdrawn lot', () => {
  const withdrawn = succeeded(auctionFixture(1, 2), 'WITHDRAW_BID', { source }).next;
  assertRefused(withdrawn, draft => { lotAt(draft).status = 'open'; });
  expect(lotAt(withdrawn).raises).toStrictEqual([5000, 'withdraw']);
});

it.each(['source', 'week'])('refuses an acquired NPC with changed household %s', field => {
  const start = town();
  populate(start, []);
  start.city.world.week = 2;
  const stocked = succeeded(start, 'BUILD', { tileId: 'spec-2', typeId: source }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source, slot: 0, homeTileId }).next;
  assertRefused(bought, draft => {
    const { household } = draft.npcs[0];
    if (field === 'source') household.source = 'slave-market';
    else household.boughtWeek = 1;
  });
});

it.each(['sold', 'unknown name', 'reoffered'])('refuses an impossible earlier departure: %s', problem => {
  const start = town();
  if (problem !== 'reoffered') populate(start, [homeTileId]);
  const stocked = succeeded(start, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  const ready = problem === 'reoffered' ?
    succeeded(stocked, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId }).next : stocked;
  const released = succeeded(ready, 'RELEASE_NPC', { npcId: ready.npcs[0].character.id }).next;
  assertRefused(released, draft => {
    const acquisition = draft.city.society!.acquisition;
    if (problem === 'sold') acquisition.departures[0].kind = 'sold';
    else if (problem === 'unknown name') acquisition.departures[0].name = 'Unknown Person';
    else {
      acquisition.stock[0].status = 'open';
      acquisition.departures[0].name = 'Unknown Person';
    }
  });
});

it('round-trips a withdrawn lot and a winning lot whose recruit was released', () => {
  const started = auctionFixture(1, 2);
  const withdrawn = succeeded(started, 'WITHDRAW_BID', { source }).next;
  const lost = serializeCharacterLifeSave(withdrawn);
  if (!lost.success) throw Error(lost.error.message);
  expect(deserializeCharacterLifeSave(lost.text)).toStrictEqual({ success: true, state: withdrawn });

  let state = auctionFixture(1, 2);
  while (lotAt(state).status !== 'won') {
    state = succeeded(state, 'BID_NPC', { source, homeTileId, raise: 25000 }).next;
  }
  const { id: npcId, name } = state.npcs[0].character;
  const gold = stock(state).gold;
  state = succeeded(state, 'RELEASE_NPC', { npcId }).next;
  expect(state.city.society!.acquisition.departures).toStrictEqual([{ kind: 'released', name, id: npcId }]);
  expect(stock(state).gold).toBe(gold);
  const won = serializeCharacterLifeSave(state);
  if (!won.success) throw Error(won.error.message);
  expect(deserializeCharacterLifeSave(won.text)).toStrictEqual({ success: true, state });
});
