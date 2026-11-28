import { expect, it } from 'vitest';
import { acquisitionNpc, auctionOpeningMilli, auctionRivals, createWorldSession, emptyAcquisition, marketNpcName, generateNpc, npcValueMilli,
  type CharacterLifeSessionState } from '@haven/core';
import { deserializeCharacterLifeSave, deserializeWorldSessionSave, recordsToSession, serializeCharacterLifeSave, serializeWorldSessionSave,
  sessionToRecords, StoreRecordError } from '@haven/persistence';
import { market, populate, stock, succeeded, town } from './acquisition-fixture.js';
import { executeTileTrialCommand } from '../tile-trial.js';

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
  const decoded = deserializeCharacterLifeSave(forged);
  let rowError: unknown;
  try { recordsToSession(rows); } catch (caught) { rowError = caught; }
  expect({
    json: decoded.success ? 'accepted' : decoded,
    row: rowError instanceof StoreRecordError ?
      { isStoreRecordError: true, ref: rowError.ref, message: rowError.message } : { isStoreRecordError: false, outcome: rowError ?? 'accepted' },
  }).toStrictEqual({
    json: invalid,
    row: { isStoreRecordError: true, ref: 'city:city', message: 'Invalid store record: city:city' },
  });
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
  npc.household.room = 'room-3';
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

it.each(['removed group', 'empty sentinel'])('R2-1 refuses an owned current-week recruit with %s at a paused market', problem => {
  const stocked = problem === 'removed group' ? market() :
    succeeded(town(), 'BUILD', { tileId: 'slum-1', typeId: 'slave-market' }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId }).next;
  const paused = succeeded(bought, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next;
  expect(paused.npcs[0].character.id).toBe('npc_w1_slave-market_0');
  assertRefused(paused, draft => {
    const society = draft.city.society!;
    if (problem === 'empty sentinel') society.acquisition = emptyAcquisition();
    else {
      society.acquisition.stock = society.acquisition.stock.filter(offer => offer.source !== 'slave-market');
      society.acquisition.lots = society.acquisition.lots.filter(lot => lot.source !== 'slave-market');
    }
  });
});

it.each([
  ['active market', 'source'],
  ['active market', 'week'],
  ['empty sentinel', 'source'],
  ['empty sentinel', 'week'],
])('R2-2 refuses a changed %s resident acquisition %s after rollover', (marketState, field) => {
  const stocked = succeeded(town(), 'BUILD', { tileId: 'slum-1', typeId: 'slave-market' }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source: 'slave-market', slot: 0, homeTileId }).next;
  const ready = marketState === 'empty sentinel' ?
    succeeded(bought, 'SET_ENABLED', { tileId: 'slum-1', enabled: false }).next : bought;
  const reported = succeeded(ready, 'END_WEEK', { expectedWeek: 1 }).next;
  const planned = succeeded(reported, 'NEXT_WEEK').next;
  expect(planned.city.world.week).toBe(2);
  expect(planned.city.society!.acquisition.week).toBe(marketState === 'empty sentinel' ? 0 : 2);
  expect(planned.npcs[0].character.id).toBe('npc_w1_slave-market_0');
  assertRefused(planned, draft => {
    const { household } = draft.npcs[0];
    if (field === 'source') household.source = 'auction-house';
    else household.boughtWeek = 2;
  });
});

it('R2-3 refuses a seed-correct extra departure that implies 101 opening residents', () => {
  const start = town(7);
  populate(start, [
    ...Array<string>(30).fill(homeTileId),
    ...Array<string>(50).fill('estate-2'),
    ...Array<string>(20).fill('house-5'),
  ]);
  const released = succeeded(start, 'RELEASE_NPC', { npcId: start.npcs[0].character.id }).next;
  const stocked = succeeded(released, 'BUILD', { tileId: 'service-1', typeId: 'guild' }).next;
  const bought = succeeded(stocked, 'BUY_NPC', { source: 'guild', slot: 0, homeTileId }).next;
  const { id, name } = acquisitionNpc(7, 1, 'guild', 1, 0).npc.character;
  expect([id, name]).toStrictEqual(['npc_w1_guild_1', 'Janna Harvestmere']);
  expect(bought.npcs.some(npc => npc.character.id === id || npc.character.name === name)).toBe(false);
  const { departures, stock: offers, lots } = bought.city.society!.acquisition;
  expect([bought.npcs.length, departures.length, offers.filter(offer => offer.status === 'bought').length, lots.length])
    .toStrictEqual([100, 1, 1, 0]);
  assertRefused(bought, draft => {
    draft.city.society!.acquisition.departures.push({ kind: 'released', id, name });
  });
});

it('R2-4 saves and loads a seed-42 world with a Guild built through the tile dispatcher', () => {
  const world = createWorldSession(42);
  if (!world.success) throw Error(world.error.message);
  const original = structuredClone(world.value);
  const build = executeTileTrialCommand(world.value.city, {
    type: 'BUILD', tileId: 'service-1', typeId: 'guild', expectedRevision: world.value.city.revision,
  });
  if (!build.success) throw Error(build.error.message);
  const snapshot = { ...world.value, city: build.nextState };
  const before = structuredClone(snapshot);
  expect(snapshot.city.tiles.find(tile => tile.id === 'service-1')!.building?.typeId).toBe('guild');
  expect(snapshot.city.world.settlements[snapshot.city.world.activeSettlementId!].inventory.gold).toBe(112_000);
  const encoded = serializeWorldSessionSave(snapshot);
  const loaded = executeTileTrialCommand(world.value.city, {
    type: 'LOAD_TRIAL', snapshot: snapshot.city, expectedRevision: world.value.city.revision,
  });
  expect(world.value).toStrictEqual(original);
  expect(snapshot).toStrictEqual(before);
  expect({ worldSave: encoded.success ? 'accepted' : encoded.error, loadTrial: loaded.success ? 'accepted' : loaded.error })
    .toStrictEqual({ worldSave: 'accepted', loadTrial: 'accepted' });
  if (!encoded.success || !loaded.success) throw Error('World session did not round-trip.');
  expect(deserializeWorldSessionSave(encoded.text)).toStrictEqual({ success: true, state: snapshot });
  expect(loaded.nextState).toStrictEqual({ ...snapshot.city, revision: snapshot.city.revision + 1 });
});
