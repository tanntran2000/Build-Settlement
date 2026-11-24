import {
  ACQUISITION_NAME_SALT_MAX, auctionOpeningMilli, auctionRivals, auctionRound, bestRival, isAcquisitionSource, isAuctionSource, playerRaise,
  type AcquisitionState, type AuctionLot,
} from './acquisition.js';
import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource } from '../world/npc-generator.js';
import { npcValueMilli } from '../world/npc-price.js';
import type { WorldNpc } from '../world/npc.js';
import type { TileTrialState } from './types.js';

function replaysLot(seed: number, week: number, lot: AuctionLot): boolean {
  const { source } = lot;
  const value = npcValueMilli(generateNpc(seed, week, source, 'lot').npc, source, true);
  const rivals = auctionRivals(seed, week, source, value);
  let price = auctionOpeningMilli(value);
  let leader: AuctionLot['leader'] = null;
  let out = rivals.map(() => false);
  let withdrawn = false;
  for (const action of lot.raises) {
    if (withdrawn || leader === 'player') return false;
    if (action === 'withdraw') {
      leader ??= bestRival(rivals, out);
      if (leader === null) return false;
      withdrawn = true;
      continue;
    }
    if (!playerRaise(action)) return false;
    const round = auctionRound(price, action, out, rivals);
    price = round.priceMilli;
    leader = round.leader;
    out = round.out;
  }
  // End Week closes sold lots before replacing the week. Only player actions survive in Planning.
  const status = withdrawn ? 'lost' : leader === 'player' ? 'won' : 'open';
  return lot.priceMilli === price && lot.leader === leader && lot.status === status &&
    lot.out.length === out.length && lot.out.every((flag, index) => flag === out[index]);
}

// Call after structural validation. Stock comes in complete source groups in
// its original append order. Pausing or replacing a building retains its group.
export function isAcquisitionReplay(city: TileTrialState): boolean {
  const state = city.society!.acquisition;
  const { week, worldMetadata: { worldSeed } } = city.world;
  if (state.week !== 0 && state.week !== week) return false;
  const sources: AcquisitionSource[] = [];
  for (let i = 0; i < state.stock.length; i += P7B_TRIAL.stockSize) {
    const current = state.stock[i].source;
    if (sources.includes(current)) return false;
    sources.push(current);
    for (let slot = 0; slot < P7B_TRIAL.stockSize; slot += 1) {
      const offer = state.stock[i + slot];
      if (!offer || offer.source !== current || offer.slot !== slot) return false;
    }
  }
  if (city.tiles.some(({ building }) =>
    building?.enabled && isAcquisitionSource(building.typeId) && !sources.includes(building.typeId))) return false;
  const auctions = sources.filter(isAuctionSource);
  return state.lots.length === auctions.length && state.lots.every((lot, index) =>
    lot.source === auctions[index] && replaysLot(worldSeed, week, lot));
}

type Departure = AcquisitionState['departures'][number];

function matchesEarlierDeparture({ id, name, kind }: Departure, seed: number, week: number): boolean {
  const match = /^npc_w([1-9][0-9]*)_([a-z-]+)_(lot|0|[1-9][0-9]*)$/.exec(id);
  if (!match) return false;
  const [, weekText, source, slotText] = match;
  const boughtWeek = Number(weekText), slot = slotText === 'lot' ? slotText : Number(slotText);
  if (!Number.isSafeInteger(boughtWeek) || boughtWeek >= week || !isAcquisitionSource(source) ||
      (slot === 'lot' ? !isAuctionSource(source) : slot >= P7B_TRIAL.stockSize) ||
      (kind === 'sold' && source === 'guild')) return false;
  for (let salt = 0; salt <= ACQUISITION_NAME_SALT_MAX; salt += 1) {
    if (marketNpcName(seed, boughtWeek, source, slot, salt).name === name) return true;
  }
  return false;
}

export function hasAcquisitionRosterProof(state: AcquisitionState, seed: number, npcs: readonly WorldNpc[]): boolean {
  if (!state.week) return true;
  const offers = state.stock.flatMap(offer => {
    const entry = { source: offer.source, slot: offer.slot as number | 'lot', nameSalt: offer.nameSalt, taken: offer.status === 'bought' };
    if (offer.slot !== P7B_TRIAL.stockSize - 1) return [entry];
    const lot = state.lots.find(lot => lot.source === offer.source);
    return lot ? [entry, { source: lot.source, slot: 'lot' as const, nameSalt: lot.nameSalt, taken: lot.status === 'won' }] : [entry];
  }).map(offer => ({
    ...offer,
    id: `npc_w${state.week}_${offer.source}_${offer.slot}`,
    name: marketNpcName(seed, state.week, offer.source, offer.slot, offer.nameSalt).name,
  }));
  const byId = new Map(offers.map(offer => [offer.id, offer]));
  if (new Set(offers.map(offer => offer.name)).size !== offers.length) return false;
  const reserved = new Set<string>();
  const occupiedIds = new Set<string>();
  const taken = new Set<string>();
  for (const npc of npcs) {
    const { id, name } = npc.character;
    occupiedIds.add(id);
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name ||
          npc.household.source !== offer.source || npc.household.boughtWeek !== state.week) return false;
      taken.add(id);
    } else reserved.add(name);
  }
  const hasSlaveMarket = state.stock.some(offer => offer.source === 'slave-market');
  for (const departure of state.departures) {
    const { id, name, kind } = departure;
    if (occupiedIds.has(id) || reserved.has(name) || (kind === 'sold' && !hasSlaveMarket)) return false;
    occupiedIds.add(id);
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name || (kind === 'sold' && offer.source === 'guild')) return false;
      taken.add(id);
    } else {
      if (!matchesEarlierDeparture(departure, seed, state.week)) return false;
      reserved.add(name);
    }
  }
  for (const offer of offers) {
    if (offer.taken !== taken.has(offer.id)) return false;
    // A newly bought recruit was reserved by its own earlier offer. Other
    // residents and departures were already reserved when each group was drawn.
    for (let salt = 0; salt < offer.nameSalt; salt += 1) {
      if (!reserved.has(marketNpcName(seed, state.week, offer.source, offer.slot, salt).name)) return false;
    }
    if (reserved.has(offer.name)) return false;
    reserved.add(offer.name);
  }
  return true;
}
