
import type { WorldMetadata } from "./gamestate.js";
import { createPopulationCohort, type PopulationCohort } from "./population.js";

export const WEEKLY_RESOURCE_KEYS = ["gold", "wheat", "food", "wood", "iron"] as const;
export type WeeklyResource = typeof WEEKLY_RESOURCE_KEYS[number];
export type WeeklyStocks = Record<WeeklyResource, number>;

// Society keeps stocks and cohorts on the settlement and one clock on the world.
export interface CanonicalSettlement {
  id: string; name: string; status: 'unexplored' | 'discovered' | 'active' | 'handoff' | 'legacy';
  cohorts: PopulationCohort[]; inventory: WeeklyStocks; foodProcessorOperational: boolean;
}
export interface CanonicalGameState {
  week: number;
  worldMetadata: WorldMetadata;
  settlements: Record<string, CanonicalSettlement>;
  activeSettlementId: string | null;
}

function isDataRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Reflect.ownKeys(value).every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return typeof key === "string" && descriptor.enumerable && "value" in descriptor;
  });
}

export function hasWeeklyKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  try {
    return isDataRecord(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  } catch { return false; }
}
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const oneOf = (value: unknown, values: readonly string[]): boolean => typeof value === "string" && values.includes(value);
const COHORT_KEYS = ["id", "occupation", "socialClass", "legalStatus", "count", "averageHealth", "morale", "productivity", "resentment", "loyalty", "livingStandard"];

export function isCanonicalGameState(value: unknown): value is CanonicalGameState {
  try {
    if (!hasWeeklyKeys(value, ["week", "worldMetadata", "settlements", "activeSettlementId"]) ||
        !Number.isSafeInteger(value.week) || (value.week as number) < 1 ||
        !hasWeeklyKeys(value.worldMetadata, ["worldSeed", "gameVersion"]) ||
        !Number.isSafeInteger(value.worldMetadata.worldSeed) || !nonempty(value.worldMetadata.gameVersion) ||
        !isDataRecord(value.settlements) ||
        !(value.activeSettlementId === null || nonempty(value.activeSettlementId))) return false;
    let activeId: string | null = null;
    for (const [key, settlement] of Object.entries(value.settlements)) {
      if (!hasWeeklyKeys(settlement, ["id", "name", "status", "inventory", "cohorts", "foodProcessorOperational"]) ||
          typeof settlement.foodProcessorOperational !== "boolean" ||
          !nonempty(settlement.id) || key !== settlement.id || !nonempty(settlement.name) ||
          !oneOf(settlement.status, ["unexplored", "discovered", "active", "handoff", "legacy"]) ||
          !hasWeeklyKeys(settlement.inventory, WEEKLY_RESOURCE_KEYS) || !Array.isArray(settlement.cohorts)) return false;
      const inventory = settlement.inventory;
      if (!WEEKLY_RESOURCE_KEYS.every(resource => Number.isSafeInteger(inventory[resource]) && (inventory[resource] as number) >= 0)) return false;
      const cohortIds = new Set<string>();
      if (Reflect.ownKeys(settlement.cohorts).length !== settlement.cohorts.length + 1) return false;
      for (let index = 0; index < settlement.cohorts.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(settlement.cohorts, String(index));
        if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return false;
        const cohort: unknown = descriptor.value;
        if (!hasWeeklyKeys(cohort, COHORT_KEYS) || !nonempty(cohort.id) || cohortIds.has(cohort.id) ||
            !Number.isSafeInteger(cohort.count) || (cohort.count as number) < 0 ||
            !oneOf(cohort.occupation, ["unassigned", "worker", "technician", "doctor", "farmer", "security", "manager", "trader", "advisor", "governor"]) ||
            !oneOf(cohort.legalStatus, ["citizen", "free_resident", "contract_bound", "enslaved", "prisoner", "outsider"]) ||
            !oneOf(cohort.livingStandard, ["starvation", "bare_survival", "decent", "comfortable", "luxurious"])) return false;
        createPopulationCohort(cohort as unknown as PopulationCohort);
        cohortIds.add(cohort.id);
      }
      if (settlement.status === "active") {
        if (activeId !== null) return false;
        activeId = settlement.id;
      }
    }
    return value.activeSettlementId === activeId;
  } catch { return false; }
}
