import {
  createMansionState, createPlayerNeeds, homeBeds, isCharacterLifeSessionState, isHistoricalNpcHousehold, isNpcWorldSessionState,
  isRoomLevel, isTileTrialPlanningState, isWorldSessionState, MANSION_CATALOG, MANSION_TILE_ID, mansionLevel, P7B_TRIAL,
  roomBeds, SOCIETY_RULESET, type CharacterLifeSessionState, type MansionRoom, type MansionRoomTypeId,
  type MansionState, type NpcWorldSessionState, type TileTrialState, type WorldSessionState,
} from '@haven/core';
import { captureSaveData } from './world-session-save.js';

export const V14_RULESET = 'tile-society-14';
type Data = Record<string, unknown>;

const migrationRoomTypes = Object.entries(MANSION_CATALOG.roomTypes)
  .flatMap(([id, type]) => type.migrationPriority === null ? [] : [{ id, type, priority: type.migrationPriority }])
  .sort((a, b) => a.priority - b.priority);

function record(raw: unknown): Data | undefined {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw as Data : undefined;
}

function field(raw: unknown, key: string): unknown {
  return raw !== null && typeof raw === 'object' ? Object.getOwnPropertyDescriptor(raw, key)?.value : undefined;
}

export function savedCityRuleset(raw: unknown): unknown {
  return field(field(field(raw, 'city'), 'society'), 'rulesetId');
}

export function savedSessionWeek(raw: unknown): number {
  const week = field(field(field(raw, 'city'), 'world'), 'week');
  return typeof week === 'number' ? week : NaN;
}

// These mutators run only on the detached data captured by convert.
function convertCity(city: Data): MansionState | undefined {
  const society = record(city.society);
  if (!society || society.rulesetId !== V14_RULESET || Object.hasOwn(society, 'mansion')) return;
  const departures = record(society.acquisition)?.departures;
  if (!Array.isArray(departures) || departures.some(row => {
    const kind = record(row)?.kind;
    return kind !== 'sold' && kind !== 'released';
  })) return;
  const mansion = createMansionState();
  society.mansion = mansion;
  society.rulesetId = SOCIETY_RULESET;
  return mansion;
}

function placeResidents(city: TileTrialState, mansion: MansionState, rows: unknown): boolean {
  if (!Array.isArray(rows) || rows.length > P7B_TRIAL.npcCap) return false;
  const residents: { id: string; household: Data }[] = [];
  for (const raw of rows) {
    const npc = record(raw), household = record(npc?.household), id = record(npc?.character)?.id;
    if (!household || typeof id !== 'string' || !isHistoricalNpcHousehold(household)) return false;
    Object.assign(household, { room: null, role: null, training: null });
    if (household.home === MANSION_TILE_ID) residents.push({ id, household });
  }
  const level = mansionLevel(city);
  if (!isRoomLevel(level) || residents.length > homeBeds(city, MANSION_TILE_ID)) return false;
  residents.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  let next = 0;
  function fill(typeId: MansionRoomTypeId) {
    const room: MansionRoom = { id: 'room-' + mansion.nextRoomSeq++, typeId, level: 1, furniture: [] };
    const { beds, maxSingleBeds } = MANSION_CATALOG.roomTypes[typeId];
    const extra = Math.min(maxSingleBeds, Math.max(0, residents.length - next - beds));
    if (extra) {
      const bed = Object.entries(MANSION_CATALOG.furniture).find(([, piece]) => piece.addsBed && piece.fitRooms.includes(typeId));
      if (!bed) throw Error('Missing migration bed for ' + typeId);
      room.furniture = Array<string>(extra).fill(bed[0]);
    }
    mansion.rooms.push(room);
    const end = Math.min(residents.length, next + roomBeds(room));
    while (next < end) residents[next++].household.room = room.id;
  }

  for (const { id, type } of migrationRoomTypes) {
    if (type.unlockLevel > level) continue;
    for (let count = 0; next < residents.length && count < type.maxCount[level - 1]; count++) fill(id);
  }
  return next === residents.length;
}

function convert<T>(raw: unknown, reader: (value: unknown) => value is T, mutate: (value: Data) => boolean): T | null {
  try {
    const snapshot = record(structuredClone(captureSaveData(raw)));
    return snapshot && mutate(snapshot) && reader(snapshot) ? snapshot : null;
  } catch { return null; }
}

export function upgradeV14City(raw: unknown): TileTrialState | null {
  return convert(raw, isTileTrialPlanningState, city => !!convertCity(city));
}

export function upgradeV14WorldSession(raw: unknown): WorldSessionState | null {
  return convert(raw, isWorldSessionState, snapshot => {
    const city = record(snapshot.city);
    return !!city && !!convertCity(city);
  });
}

function convertNpcWorld(snapshot: Data): boolean {
  const city = record(snapshot.city);
  if (!city) return false;
  const mansion = convertCity(city);
  return !!mansion && placeResidents(city as unknown as TileTrialState, mansion, snapshot.npcs);
}

export function upgradeV14NpcWorldSession(raw: unknown): NpcWorldSessionState | null {
  return convert(raw, isNpcWorldSessionState, convertNpcWorld);
}

export function upgradeV14Session(raw: unknown, upgradeWeek: number): CharacterLifeSessionState | null {
  if (!Number.isSafeInteger(upgradeWeek) || upgradeWeek < 1) return null;
  return convert(raw, isCharacterLifeSessionState, snapshot => {
    const player = record(snapshot.player);
    if (!player || Object.hasOwn(player, 'needs') || !convertNpcWorld(snapshot)) return false;
    player.needs = createPlayerNeeds(upgradeWeek);
    return true;
  });
}
