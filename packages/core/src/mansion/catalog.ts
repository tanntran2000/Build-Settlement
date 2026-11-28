import mansion from '../data/mansion.json' with { type: 'json' };
import { deepFreeze } from '../data/validate.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { REQUIRED_SKILLS } from '../domain/gamestate.js';
import { readDenseArray } from '../world/arrays.js';
import { MANSION_ROLES, type MansionRole, type MansionFurnitureId, type MansionRoomTypeId, type RoomLevel, type SkillKey } from './types.js';

const EFFECT_KINDS = ['comfort', 'upkeepBps', 'safeAmountMilli', 'fatalChanceBps', 'chaseSuccessBps', 'robberyChanceBps',
  'vaultLossCapBps', 'authority', 'playerStressRelief', 'playerArousalRelief', 'lustPoints', 'playerRegen',
  'npcStress', 'npcJoy', 'npcHope', 'npcShame', 'npcAffection', 'npcObedience', 'npcFear', 'npcResentment', 'npcMind',
  'sexExpGrowth', 'nutrition', 'trainees', 'roleBonusBps'] as const;
export type EffectKind = typeof EFFECT_KINDS[number] | `skillGrowth:${SkillKey}`;
type Effect = { kind: EffectKind; level: RoomLevel; amount: number };
type ByLevel<T> = [T, T, T];
type RoomCost = { gold: number; wood: number; iron: number };
interface RoomType {
  name: string; kind: 'residence' | 'function'; unlockLevel: RoomLevel; maxCount: ByLevel<number>;
  cost: ByLevel<RoomCost>; upkeepMilli: ByLevel<number>; beds: number; maxSingleBeds: number;
  furnitureSlots: ByLevel<number>; fitRoles: MansionRole[]; effects: Effect[];
  starter: 1 | 2 | null; suiteRoles: MansionRole[] | null; migrationPriority: number | null; reportAccess: boolean;
}
interface Role { name: string; cap: number | null; fitRoom: MansionRoomTypeId; effects: Effect[] }
interface Furniture { name: string; priceMoneyMilli: number; fitRooms: MansionRoomTypeId[]; hobby: string | null; effects: Effect[]; addsBed: boolean }
const ROOT_NUMBERS = [
  'fitMultiplierBps', 'furnitureFitMultiplierBps', 'wifeAffectionMin', 'wifeExpertParts', 'wifeSaveHealth', 'concubineRegen',
  'needsGraceWeeks', 'arousalPerWeek', 'lustRequirementMax', 'stressPenaltyFrom', 'stressPenaltyMax', 'comfortShortUpkeepBps',
  'maidsQuartersUpkeepBps', 'arousalStressMax',
] as const;
const LUST_POINTS = ['fucktoy', 'concubine', 'wife'] as const;
const CALIBRATION = [
  'comfortPerResident', 'fatalChanceFloorBps', 'stressPerShortfall', 'stressReliefPerPoint', 'comfortShortStress', 'arousalPerLust',
  'trainingGainPerWeek', 'trainingLevelThreeGain', 'furnitureResaleBps', 'hobbyJoy', 'hobbyStressRelief',
  'lightReliefAffectionMin', 'lightRoleStressRelief', 'tavernStressRelief',
] as const;
type Catalog = Record<typeof ROOT_NUMBERS[number], number> & {
  trial: 'TRIAL';
  calibrationNote: string;
  lustPoints: Record<typeof LUST_POINTS[number], number>;
  calibration: Record<typeof CALIBRATION[number], number>;
  defaultBuildType: MansionRoomTypeId;
  roomTypes: Record<MansionRoomTypeId, RoomType>;
  roles: Record<MansionRole, Role>;
  furniture: Record<MansionFurnitureId, Furniture>;
};

const effectKinds = new Set<string>([...EFFECT_KINDS, ...REQUIRED_SKILLS.map(skill => 'skillGrowth:' + skill)]);
export const isMansionRoomType = (value: unknown): value is MansionRoomTypeId => typeof value === 'string' && Object.hasOwn(MANSION_CATALOG.roomTypes, value);
export const isMansionFurniture = (value: unknown): value is MansionFurnitureId => typeof value === 'string' && Object.hasOwn(MANSION_CATALOG.furniture, value);
export const isMansionRole = (value: unknown): value is MansionRole => typeof value === 'string' && (MANSION_ROLES as readonly string[]).includes(value);
export const isSkillKey = (value: unknown): value is SkillKey => typeof value === 'string' && (REQUIRED_SKILLS as readonly string[]).includes(value);
export const isRoomLevel = (value: unknown): value is RoomLevel => value === 1 || value === 2 || value === 3;

function bad(path: string, rule: string): never { throw Error('mansion.json#' + path + ': ' + rule); }
function record(value: unknown, keys: readonly string[], path: string) {
  if (typeof value !== 'object' || value === null || !hasWeeklyKeys(value, Object.keys(value))) return bad(path, 'expected a data object');
  const prefix = path ? path + '.' : '';
  for (const key of keys) if (!Object.hasOwn(value, key)) bad(prefix + key, 'missing field');
  for (const key of Object.keys(value)) if (!keys.includes(key)) bad(prefix + key, 'unexpected field');
  return value;
}
function definitions(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || !hasWeeklyKeys(value, Object.keys(value))) return bad(path, 'expected a definition map');
  for (const id of Object.keys(value)) if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) bad(path + '.' + id, 'invalid id');
  return value;
}
function list(value: unknown, path: string) { return readDenseArray(value) ?? bad(path, 'expected a dense array'); }
function nonnegative(value: unknown, path: string) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) bad(path, 'must be a safe integer');
  if (value < 0) bad(path, 'must be ≥ 0');
}
function label(value: unknown, path: string) {
  if (typeof value !== 'string' || !value || value !== value.trim()) bad(path, 'expected nonempty text');
}
function level(value: unknown, path: string) {
  if (!isRoomLevel(value)) bad(path, 'expected room level 1, 2 or 3');
}
function forLevels(value: unknown, path: string, check: (item: unknown, itemPath: string) => void) {
  const entries = list(value, path);
  if (entries.length !== 3) bad(path, 'expected three levels');
  entries.forEach((item, i) => check(item, path + '[' + i + ']'));
}
function effects(value: unknown, path: string) {
  list(value, path).forEach((item, i) => {
    const itemPath = path + '[' + i + ']';
    const row = record(item, ['kind', 'level', 'amount'], itemPath);
    if (typeof row.kind !== 'string' || !effectKinds.has(row.kind)) bad(itemPath + '.kind', 'unknown effect kind');
    level(row.level, itemPath + '.level');
    if (row.kind.startsWith('npc')) {
      if (!Number.isSafeInteger(row.amount)) bad(itemPath + '.amount', 'must be a safe integer');
    } else nonnegative(row.amount, itemPath + '.amount');
  });
}

export function validateMansionCatalog(raw: unknown): Catalog {
  const root = record(raw, ['trial', 'calibrationNote', ...ROOT_NUMBERS, 'lustPoints', 'calibration', 'defaultBuildType', 'roomTypes', 'roles', 'furniture'], '');
  if (root.trial !== 'TRIAL') bad('trial', 'expected TRIAL');
  label(root.calibrationNote, 'calibrationNote');
  for (const key of ROOT_NUMBERS) nonnegative(root[key], key);
  for (const [key, fields] of [['lustPoints', LUST_POINTS], ['calibration', CALIBRATION]] as const) {
    for (const [id, value] of Object.entries(record(root[key], fields, key))) nonnegative(value, key + '.' + id);
  }
  const roomTypes = definitions(root.roomTypes, 'roomTypes');
  const isRoomId = (id: unknown) => typeof id === 'string' && Object.hasOwn(roomTypes, id);
  if (!isRoomId(root.defaultBuildType)) bad('defaultBuildType', 'unknown room type');
  const starters = new Set<number>(), migrationPriorities = new Set<number>();
  const roomsWithExtraBeds: string[] = [];
  for (const [id, value] of Object.entries(roomTypes)) {
    const p = 'roomTypes.' + id;
    const row = record(value, ['name', 'kind', 'unlockLevel', 'maxCount', 'cost', 'upkeepMilli', 'beds', 'maxSingleBeds', 'furnitureSlots', 'fitRoles', 'effects',
      'starter', 'suiteRoles', 'migrationPriority', 'reportAccess'], p);
    label(row.name, p + '.name');
    if (row.kind !== 'residence' && row.kind !== 'function') bad(p + '.kind', 'unknown room kind');
    level(row.unlockLevel, p + '.unlockLevel');
    for (const key of ['maxCount', 'upkeepMilli', 'furnitureSlots'] as const) forLevels(row[key], p + '.' + key, nonnegative);
    forLevels(row.cost, p + '.cost', (item, itemPath) => {
      for (const [key, amount] of Object.entries(record(item, ['gold', 'wood', 'iron'], itemPath))) nonnegative(amount, itemPath + '.' + key);
    });
    nonnegative(row.beds, p + '.beds');
    nonnegative(row.maxSingleBeds, p + '.maxSingleBeds');
    if (row.maxSingleBeds !== 0) roomsWithExtraBeds.push(id);
    if (row.starter !== null) {
      if ((row.starter !== 1 && row.starter !== 2) || starters.has(row.starter) || row.unlockLevel !== 1 ||
          !(row.maxCount as number[]).every(count => count >= 1)) bad(p + '.starter', 'expected a unique starter slot unlocked at level 1');
      starters.add(row.starter);
    }
    if (row.suiteRoles !== null && !list(row.suiteRoles, p + '.suiteRoles').every(isMansionRole)) bad(p + '.suiteRoles', 'unknown role');
    if (row.migrationPriority !== null) {
      if (typeof row.migrationPriority !== 'number' || !Number.isSafeInteger(row.migrationPriority) || row.migrationPriority < 1 ||
          migrationPriorities.has(row.migrationPriority) || row.starter !== null || row.suiteRoles !== null) {
        bad(p + '.migrationPriority', 'expected a unique positive migration priority on an unrestricted non-starter room');
      }
      migrationPriorities.add(row.migrationPriority);
    }
    if (typeof row.reportAccess !== 'boolean') bad(p + '.reportAccess', 'expected a boolean');
    if (!list(row.fitRoles, p + '.fitRoles').every(isMansionRole)) bad(p + '.fitRoles', 'unknown role');
    effects(row.effects, p + '.effects');
  }
  if (starters.size !== 2) bad('roomTypes', 'requires starter slots 1 and 2');
  for (const [id, value] of Object.entries(record(root.roles, MANSION_ROLES, 'roles'))) {
    const p = 'roles.' + id;
    const row = record(value, ['name', 'cap', 'fitRoom', 'effects'], p);
    label(row.name, p + '.name');
    if (row.cap !== null) nonnegative(row.cap, p + '.cap');
    if (!isRoomId(row.fitRoom)) bad(p + '.fitRoom', 'unknown room type');
    effects(row.effects, p + '.effects');
  }
  const bedFitRooms = new Set<unknown>();
  for (const [id, value] of Object.entries(definitions(root.furniture, 'furniture'))) {
    const p = 'furniture.' + id;
    const row = record(value, ['name', 'priceMoneyMilli', 'fitRooms', 'hobby', 'effects', 'addsBed'], p);
    label(row.name, p + '.name');
    nonnegative(row.priceMoneyMilli, p + '.priceMoneyMilli');
    const fitRooms = list(row.fitRooms, p + '.fitRooms');
    if (!fitRooms.every(isRoomId)) bad(p + '.fitRooms', 'unknown room type');
    if (typeof row.addsBed !== 'boolean') bad(p + '.addsBed', 'expected a boolean');
    if (row.addsBed) for (const roomId of fitRooms) bedFitRooms.add(roomId);
    if (row.hobby !== null) label(row.hobby, p + '.hobby');
    effects(row.effects, p + '.effects');
  }
  for (const id of roomsWithExtraBeds) if (!bedFitRooms.has(id)) bad('roomTypes.' + id + '.maxSingleBeds', 'requires compatible bed furniture');
  return root as unknown as Catalog;
}

export const MANSION_CATALOG = deepFreeze(validateMansionCatalog(mansion));

export const MANSION_ROOM_TYPES: readonly MansionRoomTypeId[] = Object.freeze(Object.keys(MANSION_CATALOG.roomTypes));
