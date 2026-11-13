import tuningJson from '../data/tuning.json';
import buildingsJson from '../data/buildings.json';
import { deepFreeze, validateTuning, validateBuildings } from '../data/validate.js';
// Adjustable IMPLEMENTATION TRIAL values, not user-approved economic balance.
export type TrialOperation = "farm" | "processor" | "logging" | "mine" | "goods" | "market" | "society" | "wool" | "herbs" | "stone" | "cloth";
// Provisional adaptation, not validated balance or imported reference-game rates.
export interface ImmigrationTrialConfig { foodSupportBps: number; catchupBps: number; weeklyCapBps: number }
export const IMMIGRATION_TRIAL_DEFAULTS: Readonly<ImmigrationTrialConfig> = deepFreeze(validateTuning(tuningJson).IMMIGRATION_TRIAL_DEFAULTS);
export interface TrialBuildingDefinition {
  name: string; operation: TrialOperation; terrain: readonly string[]; maxLevel: number;
  maxWorkers: number; cost: { gold: number; wood: number; iron: number }; upkeepMilli: number;
}
export const TRIAL_BUILDINGS: Readonly<Record<string, TrialBuildingDefinition>> = deepFreeze(validateBuildings(buildingsJson).trial);

export const TILE_TRIAL_BALANCE = deepFreeze(validateTuning(tuningJson).TILE_TRIAL_BALANCE);
export function trialBuilding(typeId: string): TrialBuildingDefinition | undefined {
  return Object.hasOwn(TRIAL_BUILDINGS, typeId) ? TRIAL_BUILDINGS[typeId] : undefined;
}

export const WATCH_HOUSE_MAX_WORKERS = 2;
export function buildingWorkerCap(typeId: string, level: number): number {
 return typeId === "watch-house" ? WATCH_HOUSE_MAX_WORKERS : trialBuilding(typeId)!.maxWorkers * level;
}
