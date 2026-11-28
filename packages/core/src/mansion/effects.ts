import { trialBuilding } from '../trial/catalog.js';
import { applyDifficulty, difficultyProfile } from '../trial/difficulty.js';
import type { TileTrialState } from '../trial/types.js';
import { MANSION_CATALOG, type EffectKind } from './catalog.js';
import { isMansionStaffRole, mansionLevel, MANSION_STAFF_ROLES, MANSION_TILE_ID, type MansionStaffRole } from './rules.js';
import type { WorldNpc } from '../world/npc.js';

const fullBps = 10_000;
type EffectAmounts = Partial<Record<EffectKind, number>>;
type CatalogEffects = typeof MANSION_CATALOG.roles.maid.effects;

function sumEffects(rows: CatalogEffects, level: number): EffectAmounts {
  const amounts: EffectAmounts = {};
  for (const row of rows) if (row.level <= level) amounts[row.kind] = (amounts[row.kind] ?? 0) + row.amount;
  return amounts;
}

const roomLevels = new Map(Object.entries(MANSION_CATALOG.roomTypes).map(([id, type]) =>
  [id, type.upkeepMilli.map((upkeepMilli, index) => ({ upkeepMilli, effects: sumEffects(type.effects, index + 1) }))] as const));
const staffEffects = new Map(MANSION_STAFF_ROLES.map(role => [role, sumEffects(MANSION_CATALOG.roles[role].effects, 1)]));
const fitRatio = MANSION_CATALOG.fitMultiplierBps / fullBps;

export interface MansionWeekReport {
  comfortSupply: number;
  comfortNeed: number;
  upkeepMilli: number;
  upkeepPaid: boolean;
  authority: number;
}

export interface MansionTerms {
  comfortNeed: number;
  plainComfort: number;
  paidComfort: number;
  buildingUpkeepMilli: number;
  roomUpkeepMilli: number;
  upkeepFactorsBps: readonly number[];
  upkeepMilli: number;
  effectsByRoom: ReadonlyMap<string, EffectAmounts>;
}

type StaffCount = { count: number; fit: number };
const newStaffCount = (): StaffCount => ({ count: 0, fit: 0 });

function staffValue(staff: StaffCount, amount: number, paid: boolean): number {
  return amount * (staff.count + (paid ? staff.fit * (fitRatio - 1) : 0));
}

function leaderBonus(staff: StaffCount, role: MansionStaffRole, roomBonus: number | undefined, paid: boolean): number {
  const bonus = (staffEffects.get(role)!.roleBonusBps ?? fullBps) - fullBps;
  const roomRatio = paid ? (roomBonus ?? fullBps) / fullBps : 1;
  return 1 + staffValue(staff, bonus, paid) * roomRatio / fullBps;
}

function upkeepWithFactors(milli: number, factors: readonly number[]): number {
  const [first, ...rest] = factors;
  if (first === undefined) return milli;
  if (!rest.length) return applyDifficulty(milli, first);
  const numerator = factors.reduce((product, bps) => product * BigInt(bps), BigInt(milli));
  const result = Number(numerator / (BigInt(fullBps) ** BigInt(factors.length)));
  if (!Number.isSafeInteger(result)) throw Error('Mansion upkeep overflow.');
  return result;
}

export function mansionTerms({ city, npcs }: { city: TileTrialState; npcs: readonly WorldNpc[] }): MansionTerms | undefined {
  const level = mansionLevel(city);
  if (!level || !city.society) return;
  const effectsByRoom = new Map<string, EffectAmounts>();
  const roomTypes = new Map<string, string>();
  const roomBonuses = new Map<string, number>();
  const staff = { maid: newStaffCount(), 'head-maid': newStaffCount(), guard: newStaffCount(), captain: newStaffCount(), accountant: newStaffCount() };
  const upkeepFactorsBps: number[] = [];
  const difficultyBps = difficultyProfile(city.society.difficulty).upkeepBps;
  if (difficultyBps !== fullBps) upkeepFactorsBps.push(difficultyBps);
  let roomUpkeepMilli = 0, roomComfort = 0;
  for (const room of city.society.mansion.rooms) {
    const { upkeepMilli, effects } = roomLevels.get(room.typeId)![room.level - 1];
    effectsByRoom.set(room.id, effects);
    roomTypes.set(room.id, room.typeId);
    roomUpkeepMilli += upkeepMilli;
    roomComfort += effects.comfort ?? 0;
    if (effects.upkeepBps !== undefined) upkeepFactorsBps.push(effects.upkeepBps);
    if (effects.roleBonusBps !== undefined) roomBonuses.set(room.typeId, effects.roleBonusBps);
  }
  let residentCount = 0;
  for (const { household } of npcs) {
    if (household.home !== MANSION_TILE_ID) continue;
    residentCount++;
    const role = household.role;
    if (!isMansionStaffRole(role) || household.contract?.weeksLeft === 0) continue;
    const fitRoom = MANSION_CATALOG.roles[role].fitRoom;
    const count = staff[role];
    count.count++;
    if (household.room !== null && roomTypes.get(household.room) === fitRoom) count.fit++;
  }
  const comfort = (paid: boolean) => {
    const headMaid = staff['head-maid'];
    const boost = leaderBonus(headMaid, 'head-maid', roomBonuses.get(MANSION_CATALOG.roles['head-maid'].fitRoom), paid);
    return Math.floor(
      staffValue(staff.maid, staffEffects.get('maid')!.comfort ?? 0, paid) * boost +
      staffValue(headMaid, staffEffects.get('head-maid')!.comfort ?? 0, paid) + (paid ? roomComfort : 0),
    );
  };
  const plainComfort = comfort(false);
  const paidComfort = comfort(true);
  const comfortNeed = residentCount * MANSION_CATALOG.calibration.comfortPerResident;
  if (paidComfort < comfortNeed) upkeepFactorsBps.push(MANSION_CATALOG.comfortShortUpkeepBps);
  const buildingUpkeepMilli = level * trialBuilding('mansion')!.upkeepMilli;
  return {
    comfortNeed, plainComfort, paidComfort, buildingUpkeepMilli, roomUpkeepMilli, upkeepFactorsBps,
    upkeepMilli: upkeepWithFactors(buildingUpkeepMilli + roomUpkeepMilli, upkeepFactorsBps),
    effectsByRoom,
  };
}
