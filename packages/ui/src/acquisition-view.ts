import {
  acquisitionEnabled, acquisitionNpc, auctionOpeningMilli, auctionRivals, CARD_TRIAL, homeBeds, homeResidents, ITEM_TRIAL, mansionRecruitment, MANSION_TILE_ID,
  npcAgeTitle, npcSellMilli, npcValueMilli, NPC_ORIGINS, P7B_TRIAL, REQUIRED_SKILLS, TRIAL_BUILDINGS,
  type AcquisitionSource, type AuctionLot, type TileTrialState, type WorldNpc,
} from '@haven/core';
import { ACQUISITION_MESSAGES, auctionTranscript } from '@haven/simulation';
import { formatMilli } from './milli-format.js';

export const goldLabel = (amount: number) => `${formatMilli(amount)} Gold`;
export const sourceLabel = (source: AcquisitionSource) => TRIAL_BUILDINGS[source].name;

export function cardFor(npc: WorldNpc, priceMilli: number) {
  const { character, life, household } = npc;
  return {
    name: character.name, age: character.age, title: npcAgeTitle(character.age),
    origin: NPC_ORIGINS[life.origin].name, source: sourceLabel(household.source),
    status: household.status === 'slave' ? 'Slave' : household.status === 'servant' ? 'Servant' : 'Lifelong servant',
    skills: REQUIRED_SKILLS.map(key => ({ label: key.charAt(0).toUpperCase() + key.slice(1), value: character.skills[key] }))
      .sort((a, b) => b.value - a.value).slice(0, CARD_TRIAL.topSkillCount),
    beauty: life.beauty, mind: life.mind, obedience: household.obedience, priceMilli,
    wageMilli: household.contract?.wageMilli,
  };
}

export function acquisitionView(city: TileTrialState, npcs: readonly WorldNpc[], source: AcquisitionSource) {
  const { world: { worldMetadata: { worldSeed: seed }, week }, society } = city;
  const state = society!.acquisition;
  const current = state.week === week && acquisitionEnabled(city, source);
  const stock = current ? state.stock.filter(offer => offer.source === source).map(offer => {
    const { npc } = acquisitionNpc(seed, week, source, offer.slot, offer.nameSalt);
    return { offer, card: cardFor(npc, npcValueMilli(npc, source, false)) };
  }) : [];
  const lot = current ? state.lots.find(entry => entry.source === source) : undefined;
  const auction = lot ? auctionView(seed, week, lot) : null;
  const homes = city.tiles.flatMap(tile => {
    const beds = homeBeds(city, tile.id);
    return beds ? [{ id: tile.id, label: `${TRIAL_BUILDINGS[tile.building!.typeId].name} (${tile.id})`,
      free: tile.id === MANSION_TILE_ID ? mansionRecruitment(city, npcs).free : beds - homeResidents(npcs, tile.id) }] : [];
  });
  return { stock, auction, homes, goldMilli: city.world.settlements[city.world.activeSettlementId!].inventory.gold };
}

function auctionView(seed: number, week: number, lot: AuctionLot) {
  const { source, nameSalt, priceMilli } = lot;
  const { npc } = acquisitionNpc(seed, week, source, 'lot', nameSalt);
  const value = npcValueMilli(npc, source, true);
  const opening = auctionOpeningMilli(value);
  const rivals = auctionRivals(seed, week, source, value);
  const rounds = auctionTranscript(opening, lot, rivals);
  const log = rounds.flatMap(round => [
    `You bid ${goldLabel(round.playerBidMilli)}.`,
    ...round.dropped.map(index => `${rivals[index].name} drops out at ${formatMilli(round.playerBidMilli)}.`),
    round.leader === 'player' ? `You win at ${goldLabel(round.priceMilli)}.` :
      `${rivals[round.leader].name} bids ${goldLabel(round.priceMilli)}.`,
  ]);
  const leader = lot.leader === 'player' ? 'You' : lot.leader === null ? 'No bidder' : rivals[lot.leader].name;
  if (lot.status === 'lost') log.push(`You withdraw. ${leader} wins at ${goldLabel(priceMilli)}.`);
  return { card: cardFor(npc, priceMilli), lot, opening, leader, rivals: rivals.map(({ name, hint }, index) =>
    ({ name, hint, out: lot.out[index] })), log };
}

export function recruitReason(locked: boolean, open: boolean, goldMilli: number, priceMilli: number, hasBed: boolean, npcCount: number): string {
  if (locked) return 'Plan next week to recruit.';
  if (!open) return ACQUISITION_MESSAGES.OFFER_GONE;
  if (goldMilli < priceMilli) return ACQUISITION_MESSAGES.NOT_ENOUGH_GOLD;
  if (!hasBed) return ACQUISITION_MESSAGES.NO_BED;
  if (npcCount >= P7B_TRIAL.npcCap) return ACQUISITION_MESSAGES.NPC_CAP;
  return '';
}

export function departureReason(city: TileTrialState, npc: WorldNpc, locked: boolean, selling: boolean): string {
  if (locked) return 'Plan next week to make changes.';
  if (selling && npc.household.status !== 'slave') return ACQUISITION_MESSAGES.NOT_A_SLAVE;
  const { equipped, storage } = city.society!.items;
  const count = Object.hasOwn(equipped, npc.character.id) ? Object.keys(equipped[npc.character.id]).length : 0;
  return storage.length + count > ITEM_TRIAL.storageCap ? ACQUISITION_MESSAGES.STORAGE_FULL : '';
}
export const saleGold = (npc: WorldNpc) => goldLabel(npcSellMilli(npc));
