import mansion from '../data/mansion.json' with { type: 'json' };
import { deepFreeze } from '../data/validate.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { REQUIRED_SKILLS } from '../domain/gamestate.js';
import { readDenseArray } from '../world/arrays.js';
import { MANSION_ROLES, MANSION_ROOM_TYPES, type MansionRole, type MansionRoomTypeId, type RoomLevel, type SkillKey } from './types.js';

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
}
interface Role { name: string; cap: number | null; fitRoom: MansionRoomTypeId; effects: Effect[] }
interface Furniture { name: string; priceMoneyMilli: number; fitRooms: MansionRoomTypeId[]; hobby: string | null; effects: Effect[] }
type Catalog = Omit<typeof mansion, 'roomTypes' | 'roles' | 'furniture'> & {
  roomTypes: Record<MansionRoomTypeId, RoomType>;
  roles: Record<MansionRole, Role>;
  furniture: Record<string, Furniture>;
};

const furnitureIds = ['single-bed', 'bookshelf', 'armchair', 'sofa', 'sex-toys', 'mini-shrine', 'cooking-tools',
  'pen-and-quill', 'incense-jar', 'weapon-rack', 'medicine-cabinet', 'tool-bench', 'lute', 'game-table', 'telescope', 'shackles'];
const effectKinds = new Set<string>([...EFFECT_KINDS, ...REQUIRED_SKILLS.map(skill => 'skillGrowth:' + skill)]);
export const isMansionRoomType = (value: unknown): value is MansionRoomTypeId => typeof value === 'string' && (MANSION_ROOM_TYPES as readonly string[]).includes(value);
export const isMansionRole = (value: unknown): value is MansionRole => typeof value === 'string' && (MANSION_ROLES as readonly string[]).includes(value);
export const isSkillKey = (value: unknown): value is SkillKey => typeof value === 'string' && (REQUIRED_SKILLS as readonly string[]).includes(value);
export const isRoomLevel = (value: unknown): value is RoomLevel => value === 1 || value === 2 || value === 3;

function bad(path: string, rule: string): never { throw Error('mansion.json#' + path + ': ' + rule); }
function record(value: unknown, keys: readonly string[], path: string) {
  return hasWeeklyKeys(value, keys) ? value : bad(path, 'unexpected or missing field');
}
function list(value: unknown, path: string) { return readDenseArray(value) ?? bad(path, 'expected a dense array'); }
function nonnegative(value: unknown, path: string) {
  if (typeof value !== 'number' || value < 0) bad(path, 'must be ≥ 0');
  if (!Number.isSafeInteger(value)) bad(path, 'must be a safe integer');
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
  const root = record(raw, Object.keys(mansion), '');
  if (root.trial !== 'TRIAL') bad('trial', 'expected TRIAL');
  label(root.calibrationNote, 'calibrationNote');
  for (const [key, value] of Object.entries(root)) if (typeof mansion[key as keyof typeof mansion] === 'number') nonnegative(value, key);
  for (const key of ['lustPoints', 'calibration'] as const) {
    for (const [id, value] of Object.entries(record(root[key], Object.keys(mansion[key]), key))) nonnegative(value, key + '.' + id);
  }
  for (const [id, value] of Object.entries(record(root.roomTypes, MANSION_ROOM_TYPES, 'roomTypes'))) {
    const p = 'roomTypes.' + id;
    const row = record(value, ['name', 'kind', 'unlockLevel', 'maxCount', 'cost', 'upkeepMilli', 'beds', 'maxSingleBeds', 'furnitureSlots', 'fitRoles', 'effects'], p);
    label(row.name, p + '.name');
    if (row.kind !== 'residence' && row.kind !== 'function') bad(p + '.kind', 'unknown room kind');
    level(row.unlockLevel, p + '.unlockLevel');
    for (const key of ['maxCount', 'upkeepMilli', 'furnitureSlots'] as const) forLevels(row[key], p + '.' + key, nonnegative);
    forLevels(row.cost, p + '.cost', (item, itemPath) => {
      for (const [key, amount] of Object.entries(record(item, ['gold', 'wood', 'iron'], itemPath))) nonnegative(amount, itemPath + '.' + key);
    });
    nonnegative(row.beds, p + '.beds');
    nonnegative(row.maxSingleBeds, p + '.maxSingleBeds');
    if (id !== 'bedroom' && row.maxSingleBeds !== 0) bad(p + '.maxSingleBeds', 'only Bedrooms take Single Beds');
    if (!list(row.fitRoles, p + '.fitRoles').every(isMansionRole)) bad(p + '.fitRoles', 'unknown role');
    effects(row.effects, p + '.effects');
  }
  for (const [id, value] of Object.entries(record(root.roles, MANSION_ROLES, 'roles'))) {
    const p = 'roles.' + id;
    const row = record(value, ['name', 'cap', 'fitRoom', 'effects'], p);
    label(row.name, p + '.name');
    if (row.cap !== null) nonnegative(row.cap, p + '.cap');
    if (!isMansionRoomType(row.fitRoom)) bad(p + '.fitRoom', 'unknown room type');
    effects(row.effects, p + '.effects');
  }
  for (const [id, value] of Object.entries(record(root.furniture, furnitureIds, 'furniture'))) {
    const p = 'furniture.' + id;
    const row = record(value, ['name', 'priceMoneyMilli', 'fitRooms', 'hobby', 'effects'], p);
    label(row.name, p + '.name');
    nonnegative(row.priceMoneyMilli, p + '.priceMoneyMilli');
    if (!list(row.fitRooms, p + '.fitRooms').every(isMansionRoomType)) bad(p + '.fitRooms', 'unknown room type');
    if (row.hobby !== null) label(row.hobby, p + '.hobby');
    effects(row.effects, p + '.effects');
  }
  return root as unknown as Catalog;
}

export const MANSION_CATALOG = deepFreeze(validateMansionCatalog(mansion));
