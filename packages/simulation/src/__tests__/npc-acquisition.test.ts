import { describe, expect, it } from 'vitest';
import { acquisitionNpc, buildItemWeekContext, emptyAcquisition, isAcquisitionState,
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
    expect(state(next).week).toBe(2);
    const keys = (s: CharacterLifeSessionState) => state(s).stock.map(o => acquisitionNpc(s.outside.seed, state(s).week, o.source, o.slot, o.nameSalt).npc.character.id);
    expect(keys(next).filter(id => keys(full).includes(id))).toStrictEqual([]);
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
    npc.household.room = 'room-3';
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

  it('keeps an empty no-market report byte-identical to the city week plus purse', () => {
    const s = town(), raw = { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: 1 };
    const baseline = executeWorldNpcCityCommand({ city: s.city, outside: s.outside, npcs: s.npcs }, raw, buildItemWeekContext(s));
    expect(baseline.success).toBe(true); if (!baseline.success) throw Error(baseline.error.message);
    const result = succeeded(s, 'END_WEEK', { expectedWeek: 1 });
    expect(JSON.stringify(result.report)).toBe(JSON.stringify({ ...baseline.report, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } }));
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
    const decoded = deserializeCharacterLifeSave(encoded.text);
    expect(decoded).toStrictEqual({ success: true, state: next });
    if (!decoded.success) throw Error(decoded.error.message);
    expect(serializeCharacterLifeSave(decoded.state)).toStrictEqual(encoded);
    expect(recordsToSession(sessionToRecords('main', next))).toStrictEqual(next);
    if (process.env.P7B_STEP0_MEASURE === '1') {
      const value = JSON.parse(encoded.text);
      value.state.city.society.acquisition = emptyAcquisition();
      const control = JSON.stringify(value);
      expect(deserializeCharacterLifeSave(control)).toStrictEqual({
        success: false,
        error: {
          code: 'INVALID_SAVE_STATE',
          message: 'Checkpoint must contain a valid complete Character Life session in Planning.',
        },
      });
      const full = Buffer.byteLength(encoded.text, 'utf8'), empty = Buffer.byteLength(control, 'utf8');
      console.info(JSON.stringify({ npcCount: 100, stock: 12, lots: 2, saveBytes: full, emptyWeekBytes: empty, acquisitionDeltaBytes: full - empty }));
    }
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
    expect(refused).toStrictEqual({
      success: false,
      error: {
        code: 'INVALID_SAVE_STATE',
        message: 'Checkpoint must contain a valid complete Character Life session in Planning.',
      },
    });
    expect(serializeCharacterLifeSave(s)).toStrictEqual(encoded);
  });
});
