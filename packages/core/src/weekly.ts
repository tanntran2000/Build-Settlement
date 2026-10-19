import { createPopulationCohort } from "./domain/population.js";
import { calculateSocialResourceBreakdown } from "./social/calculator.js";
import { INITIAL_BALANCE_PROFILE } from "./social/profile.js";
import { calculateEffectiveWorkforceMilli } from "./social/workforce.js";
import type { ResourceFlowResult } from "./resource/types.js";

export const WEEKLY_RESOURCE_KEYS = ["gold", "food", "wood", "iron"] as const;
export type WeeklyResource = typeof WEEKLY_RESOURCE_KEYS[number];
export type WeeklyStocks = Record<WeeklyResource, number>;
export interface WeeklyState { week: number; resources: WeeklyStocks }
export interface WeeklyReport {
  readonly week: number;
  readonly before: Readonly<WeeklyStocks>;
  readonly net: Readonly<WeeklyStocks>;
  readonly after: Readonly<WeeklyStocks>;
  readonly flows: Readonly<Record<WeeklyResource, Readonly<ResourceFlowResult>>>;
  readonly workforce: Readonly<{ effectiveMilli: number; assignedMilli: number; availableMilli: number; fundedMilli: number; unfundedMilli: number }>;
  readonly why: string;
}
export interface EndWeekCommand { type: "END_WEEK"; expectedWeek: number; foodWorkforceMilli: number }
export type WeeklyCommandResult<S> =
  | { success: true; nextState: WeeklyState; report: WeeklyReport }
  | { success: false; state: S; error: { code: string; message: string } };

export function createWeeklyState(): WeeklyState {
  return { week: 1, resources: { gold: 10000, food: 4000, wood: 0, iron: 0 } };
}

export function weeklyWorkforceMilli(): number {
  const middle = createPopulationCohort({
    id: "weekly_middle", occupation: "worker", socialClass: "common",
    legalStatus: "citizen", count: 100, averageHealth: 80, morale: 80,
    productivity: 80, resentment: 0, loyalty: 80, livingStandard: "decent",
  });
  const base = calculateSocialResourceBreakdown([middle], INITIAL_BALANCE_PROFILE).total.laborCapacityMilli;
  return calculateEffectiveWorkforceMilli(base, 0);
}

export function hasWeeklyKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const ownKeys = Reflect.ownKeys(value);
  return ownKeys.length === keys.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor !== undefined && "value" in descriptor;
  });
}

export function isWeeklyState(value: unknown): value is WeeklyState {
  if (!hasWeeklyKeys(value, ["week", "resources"]) ||
      !Number.isSafeInteger(value.week) || (value.week as number) < 1 ||
      !hasWeeklyKeys(value.resources, WEEKLY_RESOURCE_KEYS)) return false;
  const resources = value.resources;
  return WEEKLY_RESOURCE_KEYS.every(key => Number.isSafeInteger(resources[key]) && (resources[key] as number) >= 0);
}
