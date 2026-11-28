import { npcBeds, trialBuilding } from '../trial/catalog.js';
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
  plain: MansionEffects;
  paid: MansionEffects;
  buildingUpkeepMilli: number;
  roomUpkeepMilli: number;
  upkeepFactors: readonly { source: string; bps: number }[];
  upkeepMilli: number;
  effectsByRoom: ReadonlyMap<string, EffectAmounts>;
}

export interface MansionPurseTerms {
  safeAmount: Readonly<{ guard: number; captain: number; vault: number; accountant: number }>;
  robberyChanceBps: number;
  chaseSuccessBps: number;
  vaultLossCapBps: number | undefined;
}

interface MansionEffects extends MansionPurseTerms {
  comfortSupply: number;
  fatalChanceBps: number;
  authority: number;
}

type MansionHousehold = { city: TileTrialState; npcs: readonly WorldNpc[] };

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

export function mansionTerms({ city, npcs }: MansionHousehold): MansionTerms | undefined {
  const level = mansionLevel(city);
  if (!level || !city.society) return;
  const effectsByRoom = new Map<string, EffectAmounts>();
  const roomTypes = new Map<string, string>();
  const roomBonuses = new Map<string, number>();
  const presentTypes = new Set<string>();
  const staff = { maid: newStaffCount(), 'head-maid': newStaffCount(), guard: newStaffCount(), captain: newStaffCount(), accountant: newStaffCount() };
  const upkeepFactors: { source: string; bps: number }[] = [];
  const difficultyBps = difficultyProfile(city.society.difficulty).upkeepBps;
  if (difficultyBps !== fullBps) upkeepFactors.push({ source: 'Difficulty', bps: difficultyBps });
  let roomUpkeepMilli = 0, roomComfort = 0, roomAuthority = 0, roomSafe = 0;
  let chaseSuccessBps = 0, robberyChanceBps = 0, roomFatal = 0;
  let vaultLossCapBps: number | undefined;
  for (const room of city.society.mansion.rooms) {
    const { upkeepMilli, effects } = roomLevels.get(room.typeId)![room.level - 1];
    presentTypes.add(room.typeId);
    effectsByRoom.set(room.id, effects);
    roomTypes.set(room.id, room.typeId);
    roomUpkeepMilli += upkeepMilli;
    roomComfort += effects.comfort ?? 0;
    roomAuthority += effects.authority ?? 0;
    roomSafe += effects.safeAmountMilli ?? 0;
    roomFatal += effects.fatalChanceBps ?? 0;
    chaseSuccessBps += effects.chaseSuccessBps ?? 0;
    robberyChanceBps += effects.robberyChanceBps ?? 0;
    if (effects.vaultLossCapBps !== undefined)
      vaultLossCapBps = Math.min(vaultLossCapBps ?? fullBps, effects.vaultLossCapBps);
    if (effects.upkeepBps !== undefined)
      upkeepFactors.push({ source: MANSION_CATALOG.roomTypes[room.typeId].name, bps: effects.upkeepBps });
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
    const functionFit = MANSION_CATALOG.roomTypes[fitRoom].kind === 'function' && presentTypes.has(fitRoom);
    if (functionFit || (household.room !== null && roomTypes.get(household.room) === fitRoom)) count.fit++;
  }
  const accountant = staffEffects.get('accountant')!;
  const discount = fullBps - (accountant.upkeepBps ?? fullBps);
  if (staff.accountant.count && discount)
    upkeepFactors.push({ source: MANSION_CATALOG.roles.accountant.name, bps: Math.max(0, fullBps - Math.floor(staffValue(staff.accountant, discount, true))) });
  const terms = (paid: boolean): MansionEffects => {
    const headMaid = staff['head-maid'];
    const maidBoost = leaderBonus(headMaid, 'head-maid', roomBonuses.get(MANSION_CATALOG.roles['head-maid'].fitRoom), paid);
    const guardBoost = leaderBonus(staff.captain, 'captain', roomBonuses.get(MANSION_CATALOG.roles.captain.fitRoom), paid);
    const comfortSupply = Math.floor(
      staffValue(staff.maid, staffEffects.get('maid')!.comfort ?? 0, paid) * maidBoost +
      staffValue(headMaid, staffEffects.get('head-maid')!.comfort ?? 0, paid) + (paid ? roomComfort : 0),
    );
    const guard = staffEffects.get('guard')!, captain = staffEffects.get('captain')!;
    const fatalChanceBps = Math.floor(
      staffValue(staff.guard, guard.fatalChanceBps ?? 0, paid) * guardBoost +
      staffValue(staff.captain, captain.fatalChanceBps ?? 0, paid) +
      (paid && (staff.guard.count || staff.captain.count) ? roomFatal : 0),
    );
    return {
      comfortSupply, fatalChanceBps,
      authority: Math.floor(staffValue(staff.accountant, accountant.authority ?? 0, paid)) + (paid ? roomAuthority : 0),
      safeAmount: {
        guard: Math.floor(staffValue(staff.guard, guard.safeAmountMilli ?? 0, paid) * guardBoost),
        captain: Math.floor(staffValue(staff.captain, captain.safeAmountMilli ?? 0, paid)),
        vault: paid ? roomSafe : 0,
        accountant: Math.floor(staffValue(staff.accountant, accountant.safeAmountMilli ?? 0, paid)),
      },
      chaseSuccessBps: paid ? chaseSuccessBps : 0,
      robberyChanceBps: paid ? robberyChanceBps : 0,
      vaultLossCapBps: paid ? vaultLossCapBps : undefined,
    };
  };
  const plain = terms(false), paid = terms(true);
  const comfortNeed = residentCount * MANSION_CATALOG.calibration.comfortPerResident;
  if (paid.comfortSupply < comfortNeed)
    upkeepFactors.push({ source: 'Comfort shortfall', bps: MANSION_CATALOG.comfortShortUpkeepBps });
  const buildingUpkeepMilli = level * trialBuilding('mansion')!.upkeepMilli;
  return {
    comfortNeed, plain, paid, buildingUpkeepMilli, roomUpkeepMilli, upkeepFactors,
    upkeepMilli: upkeepWithFactors(buildingUpkeepMilli + roomUpkeepMilli, upkeepFactors.map(factor => factor.bps)),
    effectsByRoom,
  };
}

export function homeUpkeepMilli(building: { typeId: string; level: number }, difficultyBps: number): number {
  return applyDifficulty(trialBuilding(building.typeId)!.upkeepMilli * building.level, difficultyBps);
}

export function mansionUpkeepFunded(city: TileTrialState, due: number, gold: number): boolean {
  const bps = difficultyProfile(city.society!.difficulty).upkeepBps;
  for (const { id, building } of city.tiles) {
    if (id === MANSION_TILE_ID) return gold >= due;
    if (!building || !npcBeds(building.typeId, building.level)) continue;
    const earlier = homeUpkeepMilli(building, bps);
    if (gold >= earlier) gold -= earlier;
  }
  return false;
}

export function mansionPlanningEffects(state: MansionHousehold, terms = mansionTerms(state)) {
  if (!terms) return;
  const { city } = state, { world } = city;
  const gold = world.settlements[world.activeSettlementId!].inventory.gold;
  return mansionUpkeepFunded(city, terms.upkeepMilli, gold) ? terms.paid : terms.plain;
}
