import data from '../data/npc-acquisition.json' with { type: 'json' };
import { deepFreeze, validateNpcAcquisition } from '../data/validate.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { readDenseArray } from '../world/arrays.js';
import { generateNpc, marketNpcName, P7B_TRIAL, type AcquisitionSource } from '../world/npc-generator.js';
import { npcLifeRandom } from '../world/npc-life.js';
import { npcValueMilli } from '../world/npc-price.js';
import type { HouseholdReport, TileTrialState } from './types.js';

export const ACQUISITION_SOURCES = ['guild', 'auction-house', 'slave-market'] as const;
export type AuctionSource = Exclude<AcquisitionSource, 'guild'>;
const catalog = deepFreeze(validateNpcAcquisition(data));
export const { AUCTION_TRIAL, CARD_TRIAL } = catalog;
const BPS = 10_000;
const possibleRecruits = ACQUISITION_SOURCES.length * P7B_TRIAL.stockSize + ACQUISITION_SOURCES.filter(isAuctionSource).length;
const departureCap = P7B_TRIAL.npcCap + possibleRecruits;
export const ACQUISITION_NAME_SALT_MAX = departureCap + P7B_TRIAL.npcCap + possibleRecruits;

export interface StockOffer {
  source: AcquisitionSource;
  slot: number;
  nameSalt: number;
  status: 'open' | 'bought';
}
export interface AuctionLot {
  source: AuctionSource;
  nameSalt: number;
  priceMilli: number;
  leader: 'player' | number | null;
  out: boolean[];
  status: 'open' | 'won' | 'lost' | 'sold';
  raises: (number | 'withdraw')[];
}
export interface AcquisitionState {
  week: number;
  stock: StockOffer[];
  lots: AuctionLot[];
  departures: { kind: 'sold' | 'released'; name: string; id: string }[];
}

export const emptyAcquisition = (): AcquisitionState => ({ week: 0, stock: [], lots: [], departures: [] });
export const emptyHouseholdReport = (): HouseholdReport => ({
  bought: [], sold: [], released: [], left: [], lotsToRivals: [], wagesPaidMilli: 0, unpaid: [], notices: [],
});
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const positive = (value: unknown): value is number => count(value) && value > 0;
const salt = (value: unknown): value is number => count(value) && value <= ACQUISITION_NAME_SALT_MAX;
export const isAcquisitionSource = (value: unknown): value is AcquisitionSource =>
  ACQUISITION_SOURCES.some(source => source === value);
export function isAuctionSource(value: unknown): value is AuctionSource {
  return value === 'auction-house' || value === 'slave-market';
}
export function acquisitionEnabled(city: TileTrialState, source: AcquisitionSource): boolean {
  return city.tiles.some(tile => tile.building?.typeId === source && tile.building.enabled);
}
export function acquisitionNpc(seed: number, week: number, source: AcquisitionSource, slot: number | 'lot', nameSalt: number) {
  const { name, generatorSalt } = marketNpcName(seed, week, source, slot, nameSalt);
  const generated = generateNpc(seed, week, source, slot, generatorSalt);
  generated.npc.character.name = name;
  return generated;
}
export function auctionOpeningMilli(value: number): number {
  return Math.ceil(value * AUCTION_TRIAL.openingBps / (BPS * AUCTION_TRIAL.openingStepMilli)) * AUCTION_TRIAL.openingStepMilli;
}
export interface AuctionRival { name: string; ceilingMilli: number; hint: 'Keen' | 'Steady' | 'Cautious' }
export function auctionRivals(seed: number, week: number, source: AuctionSource, value = npcValueMilli(generateNpc(seed, week, source, 'lot').npc, source, true)): AuctionRival[] {
  const random = npcLifeRandom(seed, `npc_w${week}_${source}_lot:rivals`);
  const [min, max] = AUCTION_TRIAL.rivalCount;
  const [floor, ceiling] = AUCTION_TRIAL.ceilingBps;
  const names = [...catalog.rivalNames];
  return Array.from({ length: min + Math.floor(random() * (max - min + 1)) }, () => {
    const [name] = names.splice(Math.floor(random() * names.length), 1);
    const ratio = floor + Math.floor(random() * (ceiling - floor + 1));
    return { name, ceilingMilli: Math.floor(value * ratio / BPS),
      hint: ratio >= AUCTION_TRIAL.keenBps ? 'Keen' : ratio >= AUCTION_TRIAL.steadyBps ? 'Steady' : 'Cautious' };
  });
}
export const playerRaise = (value: unknown): value is number =>
  typeof value === 'number' && AUCTION_TRIAL.playerRaisesMilli.includes(value);

function isStockOffer(raw: unknown): raw is StockOffer {
  return hasWeeklyKeys(raw, ['source', 'slot', 'nameSalt', 'status']) && isAcquisitionSource(raw.source) &&
    count(raw.slot) && raw.slot < P7B_TRIAL.stockSize && salt(raw.nameSalt) && (raw.status === 'open' || raw.status === 'bought');
}
function isAuctionLot(raw: unknown): raw is AuctionLot {
  if (!hasWeeklyKeys(raw, ['source', 'nameSalt', 'priceMilli', 'leader', 'out', 'status', 'raises']) ||
      !isAuctionSource(raw.source) || !salt(raw.nameSalt) || !positive(raw.priceMilli)) return false;
  const out = readDenseArray(raw.out), raises = readDenseArray(raw.raises);
  const [min, max] = AUCTION_TRIAL.rivalCount;
  if (!out || out.length < min || out.length > max || !out.every(entry => typeof entry === 'boolean') ||
      !raises || raises.length > raw.priceMilli / AUCTION_TRIAL.playerRaisesMilli[0] || !raises.every(action => action === 'withdraw' || playerRaise(action))) return false;
  if (raw.status === 'won') return raw.leader === 'player' && raises.length > 0 && out.every(Boolean);
  const rivalLeads = count(raw.leader) && raw.leader < out.length && out[raw.leader] === false;
  if (raw.status === 'lost' || raw.status === 'sold') return rivalLeads;
  return raw.status === 'open' && (raises.length ? rivalLeads : raw.leader === null && out.every(flag => !flag));
}
export function isAcquisitionState(raw: unknown): raw is AcquisitionState {
  try {
    if (!hasWeeklyKeys(raw, ['week', 'stock', 'lots', 'departures']) || !count(raw.week)) return false;
    const stock = readDenseArray(raw.stock), lots = readDenseArray(raw.lots), departures = readDenseArray(raw.departures);
    if (!stock || !lots || !departures || stock.length + lots.length > possibleRecruits || departures.length > departureCap ||
        !stock.every(isStockOffer) || !lots.every(isAuctionLot) || !departures.every(entry =>
          hasWeeklyKeys(entry, ['kind', 'name', 'id']) && typeof entry.id === 'string' && (entry.kind === 'sold' || entry.kind === 'released') &&
          typeof entry.name === 'string' && !!entry.name && entry.name.trim() === entry.name)) return false;
    if (raw.week === 0) return !stock.length && !lots.length && !departures.length;
    return new Set(stock.map(offer => `${offer.source}:${offer.slot}`)).size === stock.length &&
      new Set(lots.map(lot => lot.source)).size === lots.length;
  } catch { return false; }
}

export interface AuctionRound {
  priceMilli: number;
  leader: 'player' | number;
  out: boolean[];
  dropped: number[];
  playerBidMilli: number;
}
export function bestRival(rivals: readonly AuctionRival[], out: readonly boolean[]): number | null {
  let winner: number | null = null;
  for (const [index, rival] of rivals.entries()) {
    if (!out[index] && (winner === null || rival.ceilingMilli > rivals[winner].ceilingMilli)) winner = index;
  }
  return winner;
}

export function auctionRound(priceMilli: number, raise: number, out: readonly boolean[], rivals: readonly AuctionRival[]): AuctionRound {
  const playerBidMilli = priceMilli + raise, counter = playerBidMilli + AUCTION_TRIAL.rivalStepMilli;
  if (!Number.isSafeInteger(counter)) throw Error('Unsafe auction price.');
  const dropped: number[] = [];
  const flags = rivals.map((rival, index) => {
    if (out[index]) return true;
    if (rival.ceilingMilli >= counter) return false;
    dropped.push(index);
    return true;
  });
  const nextRival = bestRival(rivals, flags);
  return { priceMilli: nextRival === null ? playerBidMilli : counter, leader: nextRival ?? 'player', out: flags, dropped, playerBidMilli };
}
