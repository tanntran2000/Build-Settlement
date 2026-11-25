core = 'packages/core/src/'
sim = 'packages/simulation/src/'
ui = 'packages/ui/src/'
persist = 'packages/persistence/src/'
version_reason = 'LAW-06 proposal: distinguish the required acquisition key from unchanged v12 checkpoints.'
replace_all(core+'data/tuning.json','tile-society-12','tile-society-13',version_reason)
replace_all(core+'data/validate.ts','tile-society-12','tile-society-13',version_reason)
acq_data = {
    'AUCTION_TRIAL': {'marker':'TRIAL','rivalCount':[2,4],'ceilingBps':[8000,13000],'steadyBps':9500,'keenBps':11500,
        'openingBps':7000,'openingStepMilli':5000,'playerRaisesMilli':[5000,25000],'rivalStepMilli':5000},
    'CARD_TRIAL': {'marker':'TRIAL','topSkillCount':2},
    'rivalNames':['Maevreth Dunfen','Edris Thornwold','Caelvessa Grenmoor','Neralde Siltmere','Ivrayne Copperfen','Thesara Reedmark'],
}
new(core+'data/npc-acquisition.json',canonical(acq_data,True)+'\n','Proposed DATA-01 auction and display tuning, plus invented adult rival names.')
edit(core+'data/validate.ts','export function validateNpcGenerator(json: unknown): NpcGeneratorCatalog {', '''export interface AcquisitionCatalog {
    AUCTION_TRIAL: Readonly<{
        marker: 'TRIAL'; rivalCount: NpcRange; ceilingBps: NpcRange; steadyBps: number; keenBps: number;
        openingBps: number; openingStepMilli: number; playerRaisesMilli: NpcRange; rivalStepMilli: number;
    }>;
    CARD_TRIAL: Readonly<{ marker: 'TRIAL'; topSkillCount: number }>;
    rivalNames: readonly string[];
}
export function validateNpcAcquisition(json: unknown): AcquisitionCatalog {
    const file = 'npc-acquisition.json';
    const ref = file + '#AUCTION_TRIAL';
    const root = record(json, file + '#catalog', 'entries');
    object({ AUCTION_TRIAL: record, CARD_TRIAL: record, rivalNames: denseChoices(text) })(root, file + '#catalog', '');
    object({ marker: literal('TRIAL'), rivalCount: ascending(positive), ceilingBps: ascending(positive),
        steadyBps: positive, keenBps: positive, openingBps: positive, openingStepMilli: positive,
        playerRaisesMilli: ascending(positive), rivalStepMilli: positive })(root.AUCTION_TRIAL, ref, '');
    object({ marker: literal('TRIAL'), topSkillCount: positive })(root.CARD_TRIAL, file + '#CARD_TRIAL', '');
    const data = root as unknown as AcquisitionCatalog;
    const auction = data.AUCTION_TRIAL;
    if (auction.rivalCount[1] > data.rivalNames.length) fail(ref, 'rivalCount', 'expected enough distinct rival names');
    if (!(auction.openingBps <= auction.ceilingBps[0] && auction.ceilingBps[0] < auction.steadyBps &&
        auction.steadyBps < auction.keenBps && auction.keenBps <= auction.ceilingBps[1]))
        fail(ref, 'ceilingBps', 'expected opening <= floor < steady < keen <= ceiling');
    if (auction.playerRaisesMilli[0] === auction.playerRaisesMilli[1]) fail(ref, 'playerRaisesMilli', 'expected two distinct raises');
    if ([auction.openingStepMilli, ...auction.playerRaisesMilli, auction.rivalStepMilli].some(amount => amount % SOCIAL_RESOURCE_SCALE))
        fail(ref, 'playerRaisesMilli', 'expected whole Gold steps');
    return data;
}

export function validateNpcGenerator(json: unknown): NpcGeneratorCatalog {''','Validate the newly proposed tuning using existing DATA-01 helpers.')
edit(core+'world/npc-generator.ts','function drawDistinct<T>', '''// Resolve market display names without generating a full NPC or consuming her stat stream.
export function marketNpcName(seed: number, week: number, source: AcquisitionSource, slot: number | 'lot', nameSalt: number):
  { name: string; generatorSalt: number } {
  const id = `npc_w${week}_${source}_${slot}`;
  const random = npcLifeRandom(seed, id);
  const catalog = NPC_GENERATOR_CATALOG;
  const origin = drawOne(random, Object.keys(NPC_ORIGINS));
  const culture = catalog.cultures[catalog.originCulture[origin]];
  const given = drawOne(random, culture.given), first = drawOne(random, culture.epithets);
  const generatorSalt = nameSalt % culture.epithets.length;
  const epithet = drawEpithet(seed, id, culture.epithets, first, generatorSalt);
  const suffix = nameSalt === generatorSalt ? '' : '-' + nameSalt.toString(36);
  return { name: given + ' ' + epithet + suffix, generatorSalt };
}

function drawDistinct<T>''','Resolve reserved names cheaply. Owner proposal for exhausted epithets preserves existing generateNpc behavior.')
edit(core+'trial/society.ts',"import { createItemsState, isItemsState, type ItemsState } from './items.js';","import { createItemsState, isItemsState, type ItemsState } from './items.js';\nimport { emptyAcquisition, isAcquisitionState, type AcquisitionState } from './acquisition.js';", 'Declare and validate the acquisition key.')
replace_all(core+'trial/society.ts','tile-society-12','tile-society-13',version_reason)
edit(core+'trial/society.ts','  items: ItemsState;','  items: ItemsState;\n  acquisition: AcquisitionState;', 'Declare and validate the acquisition key.')
edit(core+'trial/society.ts','items:createItemsState(2026) },','items:createItemsState(2026), acquisition:emptyAcquisition() },','Append acquisition to factory and canonical JSON order.')
edit(core+'trial/society.ts',"'outside', 'research','items']) || raw.rulesetId", "'outside', 'research','items','acquisition']) || !isAcquisitionState(raw.acquisition) || raw.rulesetId",'Require the new key and reject invalid acquisition payloads.')
edit(core+'trial/state.ts',"      const settlement=s.world.settlements", "      if (s.society.acquisition.week > s.world.week) return false;\n      const settlement=s.world.settlements",'Prevent state from carrying future acquisition rows.')
edit(core+'trial/state.ts',"    return isTileTrialState(raw);","    return isTileTrialState(raw) && (raw.society.acquisition.week === 0 || raw.society.acquisition.week === raw.world.week);",'Planning checkpoints allow the empty sentinel or current-week state.')
edit(core+'trial/types.ts',"  householdUpkeep?: { paidMilli: number; unpaidMilli: number };","  householdUpkeep?: { paidMilli: number; unpaidMilli: number };\n  household?: HouseholdReport;",'Add Decision 14 as an optional type and preserve empty report bytes.')
edit(core+'trial/types.ts','export interface ItemWeekReport {','''export interface HouseholdReport {
  bought: string[];
  sold: string[];
  released: string[];
  left: string[];
  lotsToRivals: { source: 'auction-house' | 'slave-market'; priceMilli: number }[];
  wagesPaidMilli: number;
  unpaid: string[];
  notices: string[];
}
export interface ItemWeekReport {''','Share the report contract across simulator, report view and readers.')
edit(core+'trial/items.ts','export const isWearable=', '''export function returnEquippedToStorage(items: ItemsState, characterId: string, week: number): ItemsState | null {
  const worn = Object.hasOwn(items.equipped, characterId) ? Object.values(items.equipped[characterId]) : [];
  if (!worn.length) return items;
  const expiresWeek = week + ITEM_TRIAL.storageWeeks;
  if (items.storage.length + worn.length > ITEM_TRIAL.storageCap || !Number.isSafeInteger(expiresWeek)) return null;
  const next = structuredClone(items);
  next.storage.push(...worn.map(item => ({ item: { ...item }, expiresWeek })));
  next.storage.sort((a, b) => a.item.id - b.item.id);
  delete next.equipped[characterId];
  return next;
}
export const isWearable=''', 'Return all equipment atomically, preserving item IDs, expiry and canonical row order.')
edit(core+'index.ts',"export * from './trial/items.js';","export * from './trial/items.js';\nexport * from './trial/acquisition.js';",'Export the pure acquisition catalog, state and readers to simulation and UI.')
new(core+'trial/acquisition.ts','''import data from '../data/npc-acquisition.json' with { type: 'json' };
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
  raises: number[];
}
export interface AcquisitionState {
  week: number;
  stock: StockOffer[];
  lots: AuctionLot[];
  departures: { kind: 'sold' | 'released'; name: string }[];
}

export const emptyAcquisition = (): AcquisitionState => ({ week: 0, stock: [], lots: [], departures: [] });
export const emptyHouseholdReport = (): HouseholdReport => ({
  bought: [], sold: [], released: [], left: [], lotsToRivals: [], wagesPaidMilli: 0, unpaid: [], notices: [],
});
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const positive = (value: unknown): value is number => count(value) && value > 0;
const salt = (value: unknown): value is number => count(value) && value <= departureCap + P7B_TRIAL.npcCap + possibleRecruits;
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
      !raises || !raises.every(playerRaise)) return false;
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
          hasWeeklyKeys(entry, ['kind', 'name']) && (entry.kind === 'sold' || entry.kind === 'released') &&
          typeof entry.name === 'string' && !!entry.name && entry.name.trim() === entry.name)) return false;
    if (raw.week === 0) return !stock.length && !lots.length && !departures.length;
    return new Set(stock.map(offer => `${offer.source}:${offer.slot}`)).size === stock.length &&
      new Set(lots.map(lot => lot.source)).size === lots.length;
  } catch { return false; }
}
''','Compact acquisition state, structural validation, deterministic name and rival replay inputs.')

edit(persist+'session-records.ts','(0[1-9]|1[01])','(0[1-9]|1[0-2])','Recognize v12 city rows on the refusal path.')
edit(persist+'session-records.ts','^tile-society-1[01]$','^tile-society-1[0-2]$','Rebuild v12 item rows through the existing detached-items path.')
edit(persist+'session-records.ts','const historicalNpcLifeRuleset = /^tile-society-1[0-2]$/;','const historicalNpcLifeRuleset = /^tile-society-1[0-2]$/;\nconst historicalHouseholdRuleset = "tile-society-12";','Use the household-aware validation route for historical v12 NPC rows.')
edit(persist+'session-records.ts','const validNpcList = meta.rulesetId === SOCIETY_RULESET','const validNpcList = meta.rulesetId === SOCIETY_RULESET || meta.rulesetId === historicalHouseholdRuleset','v12 requires B2 household validation before routing the original rows to old-checkpoint refusal.')
