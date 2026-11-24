import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { npcBeds } from '../trial/catalog.js';
import type { TileTrialState } from '../trial/types.js';
import { NPC_GENERATOR_CATALOG, P7B_TRIAL, type AcquisitionSource } from './npc-generator.js';
import type { WorldNpc } from './npc.js';

export type NpcStatus = 'slave' | 'servant' | 'lifelong';
export interface NpcHousehold {
  home: string;
  status: NpcStatus;
  obedience: number;
  contract: { weeksLeft: number; wageMilli: number; unpaidWeeks: number; stressHits: number } | null;
  will: { preference: { id: string; strength: number }; flaw: { id: string; strength: number } };
  notice: 'renewal' | 'lifelong' | null;
  lifelongAskWeek: number | null;
  source: AcquisitionSource;
  boughtWeek: number;
}

export type NpcWithHousehold = WorldNpc & { household: NpcHousehold };

const keys = ['home', 'status', 'obedience', 'contract', 'will', 'notice', 'lifelongAskWeek', 'source', 'boughtWeek'];
const [statMinimum, statMaximum] = P7B_TRIAL.statRange;
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const positive = (value: unknown): value is number => count(value) && value > 0;
const stat = (value: unknown): value is number => count(value) && value >= statMinimum && value <= statMaximum;
const axis = (value: unknown, ids: readonly string[]) => hasWeeklyKeys(value, ['id', 'strength']) &&
  typeof value.id === 'string' && ids.includes(value.id) && stat(value.strength);

export function isNpcHousehold(raw: unknown): raw is NpcHousehold {
  try {
    if (!hasWeeklyKeys(raw, keys) || typeof raw.home !== 'string' || !raw.home || raw.home !== raw.home.trim() ||
        !stat(raw.obedience) || !positive(raw.boughtWeek) || !hasWeeklyKeys(raw.will, ['preference', 'flaw']) ||
        !axis(raw.will.preference, NPC_GENERATOR_CATALOG.preferences) || !axis(raw.will.flaw, NPC_GENERATOR_CATALOG.flaws)) return false;
    if (raw.source !== 'guild' && raw.source !== 'auction-house' && raw.source !== 'slave-market') return false;
    if (raw.source !== 'guild') return raw.status === 'slave' && raw.contract === null && raw.notice === null && raw.lifelongAskWeek === null;
    if (raw.lifelongAskWeek !== null && !positive(raw.lifelongAskWeek)) return false;
    if (raw.status === 'lifelong') return raw.contract === null && raw.notice === null;
    if (raw.status !== 'servant' || (raw.notice !== null && raw.notice !== 'renewal' && raw.notice !== 'lifelong')) return false;
    const contract = raw.contract;
    return hasWeeklyKeys(contract, ['weeksLeft', 'wageMilli', 'unpaidWeeks', 'stressHits']) && count(contract.weeksLeft) &&
      positive(contract.wageMilli) && count(contract.unpaidWeeks) && count(contract.stressHits);
  } catch { return false; }
}

export function homeBeds(city: TileTrialState, tileId: string): number {
  const building = city.tiles.find(tile => tile.id === tileId)?.building;
  return building ? npcBeds(building.typeId, building.level) : 0;
}

export function homeResidents(npcs: readonly NpcWithHousehold[], tileId: string): number {
  return npcs.filter(npc => npc.household.home === tileId).length;
}
