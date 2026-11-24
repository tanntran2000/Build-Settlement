import { expect, it } from 'vitest';
import { acquisitionNpc, auctionOpeningMilli, auctionRivals, marketNpcName, generateNpc, npcValueMilli,
  type CharacterLifeSessionState } from '@haven/core';
import { deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave,
  sessionToRecords, StoreRecordError } from '@haven/persistence';
import { stock, succeeded, town } from './acquisition-fixture.js';

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
  expect(() => recordsToSession(rows)).toThrow(StoreRecordError);
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
  expect(state.city.society!.acquisition.departures).toStrictEqual([{ kind: 'released', name }]);
  expect(stock(state).gold).toBe(gold);
  const won = serializeCharacterLifeSave(state);
  if (!won.success) throw Error(won.error.message);
  expect(deserializeCharacterLifeSave(won.text)).toStrictEqual({ success: true, state });
});
