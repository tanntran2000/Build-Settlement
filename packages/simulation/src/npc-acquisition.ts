import {
  ACQUISITION_SOURCES, acquisitionEnabled, acquisitionNpc, auctionOpeningMilli, auctionRivals, emptyAcquisition,
  emptyHouseholdReport, generateNpc, hasWeeklyKeys, homeBeds, homeResidents, isAcquisitionSource, isAuctionSource,
  isLiveCharacterLifeSessionState, marketNpcName, npcSellMilli, npcValueMilli, P7B_TRIAL, playerRaise, returnEquippedToStorage,
  type AcquisitionSource, type AcquisitionState, type AuctionLot, type CharacterLifeSessionState, type HouseholdReport,
  type TileTrialState, type WorldNpc,
} from '@haven/core';
import type { CharacterLifeCommandResult } from './character-life-command.js';
import { auctionRound, closeAuctionLot } from './npc-auction.js';
import { trialSafe } from './tile-trial-week.js';

const fields = {
  BUY_NPC: ['source', 'slot', 'homeTileId'],
  BID_NPC: ['source', 'raise', 'homeTileId'],
  WITHDRAW_BID: ['source'],
  SELL_NPC: ['npcId'],
  RELEASE_NPC: ['npcId'],
} as const;
export type AcquisitionCommandType = keyof typeof fields;
export const isAcquisitionCommand = (value: string): value is AcquisitionCommandType => Object.hasOwn(fields, value);
export const ACQUISITION_MESSAGES = Object.freeze({
  NO_BUILDING: 'An enabled acquisition building is required.',
  OFFER_GONE: 'That offer is no longer available.',
  NOT_ENOUGH_GOLD: 'There is not enough Gold.',
  NO_BED: 'That home has no free bed.',
  NPC_CAP: 'The NPC roster is full.',
  STALE_COMMAND: 'The plan changed. Refresh the action before retrying.',
  NOT_A_SLAVE: 'Only slaves can be sold.',
  STORAGE_FULL: 'Make room in storage for her equipped items.',
});

function chooseName(seed: number, week: number, source: AcquisitionSource, slot: number | 'lot', used: Set<string>): number {
  for (let nameSalt = 0; ; nameSalt += 1) {
    const { name } = marketNpcName(seed, week, source, slot, nameSalt);
    if (!used.has(name)) {
      used.add(name);
      return nameSalt;
    }
  }
}

export function drawAcquisition(seed: number, week: number, city: TileTrialState, npcs: readonly WorldNpc[] = []): AcquisitionState {
  const previous = city.society!.acquisition;
  const sources = ACQUISITION_SOURCES.filter(source => acquisitionEnabled(city, source));
  if (previous.week !== week && !sources.length) return previous.week === 0 ? previous : emptyAcquisition();
  const next = previous.week === week ? structuredClone(previous) : { ...emptyAcquisition(), week };
  const added = sources.filter(source => !next.stock.some(offer => offer.source === source));
  if (!added.length) return next;
  const used = new Set(npcs.map(npc => npc.character.name));
  for (const { name } of next.departures) used.add(name);
  for (const { source, slot, nameSalt } of next.stock) used.add(marketNpcName(seed, week, source, slot, nameSalt).name);
  for (const { source, nameSalt } of next.lots) used.add(marketNpcName(seed, week, source, 'lot', nameSalt).name);
  for (const source of added) {
    for (let slot = 0; slot < P7B_TRIAL.stockSize; slot += 1) {
      next.stock.push({ source, slot, nameSalt: chooseName(seed, week, source, slot, used), status: 'open' });
    }
    if (!isAuctionSource(source)) continue;
    const nameSalt = chooseName(seed, week, source, 'lot', used);
    const value = npcValueMilli(generateNpc(seed, week, source, 'lot').npc, source, true);
    const out = auctionRivals(seed, week, source, value).map(() => false);
    next.lots.push({ source, nameSalt, priceMilli: auctionOpeningMilli(value), leader: null, out, status: 'open', raises: [] });
  }
  return next;
}

export function acquisitionWeekReport(seed: number, previous: AcquisitionState, week: number): HouseholdReport | undefined {
  if (previous.week !== week) return;
  const result = emptyHouseholdReport();
  for (const offer of previous.stock) if (offer.status === 'bought') {
    result.bought.push(marketNpcName(seed, week, offer.source, offer.slot, offer.nameSalt).name);
  }
  for (const lot of previous.lots) {
    const { source, nameSalt } = lot;
    if (lot.status === 'won') result.bought.push(marketNpcName(seed, week, source, 'lot', nameSalt).name);
    else {
      const closed = structuredClone(lot);
      if (closed.status === 'open') closeAuctionLot(closed, auctionRivals(seed, week, source), 'sold');
      result.lotsToRivals.push({ source, priceMilli: closed.priceMilli });
    }
  }
  for (const entry of previous.departures) result[entry.kind].push(entry.name);
  if (result.bought.length || result.sold.length || result.released.length || result.lotsToRivals.length) {
    Object.freeze(result.bought); Object.freeze(result.sold); Object.freeze(result.released); Object.freeze(result.left);
    for (const row of result.lotsToRivals) Object.freeze(row);
    Object.freeze(result.lotsToRivals); Object.freeze(result.unpaid); Object.freeze(result.notices);
    return Object.freeze(result);
  }
}

type AcquisitionRefusal = keyof typeof ACQUISITION_MESSAGES;
const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });
const refusal = (code: AcquisitionRefusal): CharacterLifeCommandResult => fail(code, ACQUISITION_MESSAGES[code]);

function recruitCheck(session: CharacterLifeSessionState, home: string, price: number): AcquisitionRefusal | undefined {
  const { city } = session;
  if (city.world.settlements[city.world.activeSettlementId!].inventory.gold < price) return 'NOT_ENOUGH_GOLD';
  if (homeBeds(city, home) <= homeResidents(session.npcs, home)) return 'NO_BED';
  if (session.npcs.length >= P7B_TRIAL.npcCap) return 'NPC_CAP';
}
function admit(next: CharacterLifeSessionState, generated: ReturnType<typeof acquisitionNpc>, home: string): void {
  generated.npc.household.home = home;
  next.npcs.push(generated.npc);
  next.profiles.push(generated.profile);
}

export function executeAcquisitionCommand(session: CharacterLifeSessionState, type: AcquisitionCommandType, raw: unknown): CharacterLifeCommandResult {
  if (!hasWeeklyKeys(raw, ['type', 'expectedRevision', ...fields[type]])) return fail('INVALID_COMMAND', 'Unknown acquisition fields.');
  if (raw.expectedRevision !== session.city.revision) return refusal('STALE_COMMAND');
  if (session.city.phase !== 'planning') return fail('FORBIDDEN', 'Read the report, then choose Plan next week.');
  try {
    const next = structuredClone(session), { city } = next, society = city.society!;
    const { week, worldMetadata: { worldSeed: seed } } = city.world;
    const gold = city.world.settlements[city.world.activeSettlementId!].inventory;
    if (type === 'SELL_NPC' || type === 'RELEASE_NPC') {
      if (typeof raw.npcId !== 'string') return fail('INVALID_COMMAND', 'Select a known NPC.');
      const index = next.npcs.findIndex(npc => npc.character.id === raw.npcId);
      const npc = next.npcs[index];
      if (!npc) return fail('UNKNOWN_NPC', 'Select a known NPC.');
      if (type === 'SELL_NPC') {
        if (!acquisitionEnabled(city, 'slave-market')) return refusal('NO_BUILDING');
        if (npc.household.status !== 'slave') return refusal('NOT_A_SLAVE');
      }
      const items = returnEquippedToStorage(society.items, npc.character.id, week);
      if (!items) return refusal('STORAGE_FULL');
      society.items = items;
      if (type === 'SELL_NPC') gold.gold = trialSafe(gold.gold + npcSellMilli(npc));
      if (society.acquisition.week !== week) society.acquisition = { ...emptyAcquisition(), week };
      society.acquisition.departures.push({ kind: type === 'SELL_NPC' ? 'sold' : 'released', name: npc.character.name });
      next.npcs.splice(index, 1);
      next.profiles.splice(index, 1);
    } else {
      if (!isAcquisitionSource(raw.source)) return fail('INVALID_COMMAND', 'Unknown acquisition building.');
      const source = raw.source, acquisition = society.acquisition;
      if (!acquisitionEnabled(city, source)) return refusal('NO_BUILDING');
      if (acquisition.week !== week) return refusal('OFFER_GONE');
      if (type === 'BUY_NPC') {
        if (!Number.isSafeInteger(raw.slot) || typeof raw.homeTileId !== 'string') return fail('INVALID_COMMAND', 'Select an offer and home.');
        const offer = acquisition.stock.find(row => row.source === source && row.slot === raw.slot && row.status === 'open');
        if (!offer) return refusal('OFFER_GONE');
        const generated = acquisitionNpc(seed, week, source, offer.slot, offer.nameSalt);
        const price = npcValueMilli(generated.npc, source, false);
        const blocked = recruitCheck(next, raw.homeTileId, price);
        if (blocked) return refusal(blocked);
        gold.gold -= price;
        admit(next, generated, raw.homeTileId);
        offer.status = 'bought';
      } else {
        if (!isAuctionSource(source)) return fail('INVALID_COMMAND', 'This building has no auction.');
        const lot: AuctionLot | undefined = acquisition.lots.find(row => row.source === source && row.status === 'open');
        if (!lot || lot.leader === 'player') return refusal('OFFER_GONE');
        const rivals = auctionRivals(seed, week, source);
        if (type === 'WITHDRAW_BID') closeAuctionLot(lot, rivals, 'lost');
        else {
          if (!playerRaise(raw.raise) || typeof raw.homeTileId !== 'string') return fail('INVALID_COMMAND', 'Select a bid and home.');
          const round = auctionRound(lot.priceMilli, raw.raise, lot.out, rivals);
          const blocked = recruitCheck(next, raw.homeTileId, round.playerBidMilli);
          if (blocked) return refusal(blocked);
          lot.raises.push(raw.raise);
          lot.out = round.out;
          lot.leader = round.leader;
          lot.priceMilli = round.priceMilli;
          if (round.leader === 'player') {
            gold.gold -= round.playerBidMilli;
            admit(next, acquisitionNpc(seed, week, source, 'lot', lot.nameSalt), raw.homeTileId);
            lot.status = 'won';
          }
        }
      }
    }
    city.revision = trialSafe(city.revision + 1);
    if (isLiveCharacterLifeSessionState(next)) return { success: true, next };
  } catch { /* return a structured refusal without publishing the clone */ }
  return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.');
}
