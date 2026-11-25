new(sim+'npc-auction.ts','''import { AUCTION_TRIAL, type AuctionLot, type AuctionRival } from '@haven/core';

export interface AuctionRound {
  priceMilli: number;
  leader: 'player' | number;
  out: boolean[];
  dropped: number[];
  playerBidMilli: number;
}
function bestRival(rivals: readonly AuctionRival[], out: readonly boolean[]): number | null {
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

export function closeAuctionLot(lot: AuctionLot, rivals: readonly AuctionRival[], status: 'lost' | 'sold'): void {
  const winner = typeof lot.leader === 'number' ? lot.leader : bestRival(rivals, lot.out);
  if (winner === null) throw Error('Auction has no remaining rival.');
  lot.leader = winner;
  lot.status = status;
}

export function auctionTranscript(openingMilli: number, lot: AuctionLot, rivals: readonly AuctionRival[]): AuctionRound[] {
  let price = openingMilli, out = rivals.map(() => false);
  const rounds: AuctionRound[] = [];
  for (const raise of lot.raises) {
    const round = auctionRound(price, raise, out, rivals);
    rounds.push(round);
    price = round.priceMilli;
    out = round.out;
  }
  return rounds;
}
''','B3.2 deterministic rival counter, tie-break, withdrawal and transcript replay.')
new(sim+'npc-acquisition.ts','''import {
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
    const { source, nameSalt, priceMilli } = lot;
    if (lot.status === 'won') result.bought.push(marketNpcName(seed, week, source, 'lot', nameSalt).name);
    else {
      if (lot.status === 'open') closeAuctionLot(structuredClone(lot), auctionRivals(seed, week, source), 'sold');
      result.lotsToRivals.push({ source, priceMilli });
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
''','B3.1 transaction, weekly draw and journal, plus B3.2 bid/withdraw routing.')
edit(sim+'character-life-command.ts',"import { recordNpcLifeEvent, runNpcLifeWeek } from './npc-life-week.js';","""import { recordNpcLifeEvent, runNpcLifeWeek } from './npc-life-week.js';
import { acquisitionWeekReport, drawAcquisition, executeAcquisitionCommand, isAcquisitionCommand, type AcquisitionCommandType } from './npc-acquisition.js';""",'Route the five new actions using the existing plain-data dispatcher.')
edit(sim+'character-life-command.ts','| ItemCommandType;','| ItemCommandType | AcquisitionCommandType;','Extend the Character Life command-name union.')
edit(sim+'character-life-command.ts',"  const societyAction =",'''  if (isAcquisitionCommand(type)) {
    if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');
    return executeAcquisitionCommand(session, type, raw);
  }
  const societyAction =''','Send market commands through the falling-city and plain-data gates.')
edit(sim+'character-life-command.ts',"""        report = Object.freeze({ ...report, npcLife: Object.freeze(lifeWeek.report) });
      }
    }
    if (isLiveCharacterLifeSessionState(next))""","""        report = Object.freeze({ ...report, npcLife: Object.freeze(lifeWeek.report) });
      }
      const { week, worldMetadata: { worldSeed } } = next.city.world;
      const household = acquisitionWeekReport(worldSeed, session.city.society!.acquisition, report.week);
      if (household) report = Object.freeze({ ...report, household });
      next.city.society!.acquisition = drawAcquisition(worldSeed, week, next.city, next.npcs);
    } else if (type === 'BUILD' || type === 'REPLACE' || type === 'SET_ENABLED') {
      const { week, worldMetadata: { worldSeed } } = next.city.world;
      next.city.society!.acquisition = drawAcquisition(worldSeed, week, next.city, next.npcs);
    }
    if (isLiveCharacterLifeSessionState(next))""",'Close old lots after NPC life, attach a report only on activity and draw new stock for the planning week.')
edit(sim+'index.ts','export * from "./character-life-command.js";',"""export * from "./character-life-command.js";
export { ACQUISITION_MESSAGES, isAcquisitionCommand } from './npc-acquisition.js';
export { auctionTranscript } from './npc-auction.js';""",'Expose command-error copy and replay to the UI through the public barrel.')
