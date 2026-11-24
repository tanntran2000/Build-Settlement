import {
  auctionOpeningMilli, auctionRivals, auctionRound, bestRival, isAuctionSource, playerRaise,
  type AcquisitionState, type AuctionLot,
} from './acquisition.js';
import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource } from '../world/npc-generator.js';
import { npcValueMilli } from '../world/npc-price.js';
import type { WorldNpc } from '../world/npc.js';

function replaysLot(seed: number, week: number, lot: AuctionLot): boolean {
  const { source } = lot;
  const value = npcValueMilli(generateNpc(seed, week, source, 'lot').npc, source, true);
  const rivals = auctionRivals(seed, week, source, value);
  let price = auctionOpeningMilli(value);
  let leader: AuctionLot['leader'] = null;
  let out = rivals.map(() => false);
  for (const raise of lot.raises) {
    if (leader === 'player' || !playerRaise(raise)) return false;
    const round = auctionRound(price, raise, out, rivals);
    price = round.priceMilli;
    leader = round.leader;
    out = round.out;
  }
  // End Week closes sold lots before replacing the week. They cannot be
  // carried in a Planning checkpoint. Withdraw is the terminal action for a lost lot.
  if (lot.status === 'sold') return false;
  let status: AuctionLot['status'] = leader === 'player' ? 'won' : 'open';
  if (lot.status === 'lost') {
    if (leader === 'player') return false;
    leader ??= bestRival(rivals, out);
    if (leader === null) return false;
    status = 'lost';
  }
  return lot.priceMilli === price && lot.leader === leader && lot.status === status &&
    lot.out.length === out.length && lot.out.every((flag, index) => flag === out[index]);
}

// Call after structural validation. Stock comes in complete source groups in
// its original append order. Pausing or replacing a building retains its group.
export function isAcquisitionReplay(state: AcquisitionState, seed: number): boolean {
  if (!state.week) return true;
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
  const auctions = sources.filter(isAuctionSource);
  return state.lots.length === auctions.length && state.lots.every((lot, index) =>
    lot.source === auctions[index] && replaysLot(seed, state.week, lot));
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
  const byName = new Map(offers.map(offer => [offer.name, offer]));
  if (byName.size !== offers.length) return false;
  const reserved = new Set<string>();
  const taken = new Set<string>();
  for (const npc of npcs) {
    const { id, name } = npc.character;
    const offer = byId.get(id);
    if (offer) {
      if (!offer.taken || offer.name !== name) return false;
      taken.add(id);
    } else reserved.add(name);
  }
  for (const { name } of state.departures) {
    const offer = byName.get(name);
    if (offer) {
      if (!offer.taken || taken.has(offer.id)) return false;
      taken.add(offer.id);
    } else reserved.add(name);
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
