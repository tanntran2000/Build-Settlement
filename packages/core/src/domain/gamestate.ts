import { Settlement } from "./settlement.js";
import { GameDate } from "../time/clock.js";

export interface WorldMetadata {
  worldSeed: number;
  gameVersion: string;
}

export interface GameState {
  currentDate: GameDate;
  worldMetadata: WorldMetadata;
  settlements: Record<string, Settlement>;
  activeSettlementId: string | null;
}

export interface StateValidationResult {
  valid: boolean;
  code?:
    | "INVALID_CLOCK"
    | "INVALID_ACTIVE_POINTER"
    | "DANGLING_ACTIVE_POINTER"
    | "POINTER_TARGET_NOT_ACTIVE"
    | "MULTIPLE_ACTIVE_SETTLEMENTS"
    | "KEY_ID_MISMATCH"
    | "NEGATIVE_INVENTORY"
    | "INVALID_POPULATION"
    | "INVALID_CHARACTER";
  message?: string;
}

export function validateGameState(state: GameState): StateValidationResult {
  // 1. Clock validation & consistency
  const { day, week, year } = state.currentDate;
  if (!Number.isInteger(day) || day < 1 || !Number.isInteger(week) || week < 1 || !Number.isInteger(year) || year < 1) {
    return {
      valid: false,
      code: "INVALID_CLOCK",
      message: `Invalid GameDate: day=${day}, week=${week}, year=${year}. Must be positive integers.`,
    };
  }

  const expectedWeek = Math.floor((day - 1) / 7) + 1;
  const expectedYear = Math.floor((day - 1) / 365) + 1;
  if (week !== expectedWeek || year !== expectedYear) {
    return {
      valid: false,
      code: "INVALID_CLOCK",
      message: `Inconsistent GameDate: for day=${day}, expected week=${expectedWeek} (got ${week}) and year=${expectedYear} (got ${year})`,
    };
  }

  // 2. Key-ID Matching & Settlement Contents validation
  const entries = Object.entries(state.settlements);
  for (const [key, settlement] of entries) {
    if (key !== settlement.id) {
      return {
        valid: false,
        code: "KEY_ID_MISMATCH",
        message: `Dictionary key '${key}' does not match settlement ID '${settlement.id}'`,
      };
    }

    // Inventory validation: must be non-negative integers
    for (const [res, count] of Object.entries(settlement.inventory)) {
      if (!Number.isInteger(count) || count < 0) {
        return {
          valid: false,
          code: "NEGATIVE_INVENTORY",
          message: `Settlement '${settlement.id}' has invalid inventory for ${res}: ${count}. Must be non-negative integer.`,
        };
      }
    }

    // Cohorts validation (R1-F01)
    for (const cohort of settlement.cohorts) {
      if (!cohort.id || typeof cohort.id !== "string" || cohort.id.trim() === "") {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Settlement '${settlement.id}' contains cohort with missing or empty ID`,
        };
      }
      if (!Number.isInteger(cohort.count) || cohort.count < 0) {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Cohort '${cohort.id}' in '${settlement.id}' has invalid count: ${cohort.count}. Must be non-negative integer.`,
        };
      }
      const metricCheck = (val: number, name: string) => {
        return Number.isFinite(val) && val >= 0 && val <= 100;
      };
      if (
        !metricCheck(cohort.averageHealth, "averageHealth") ||
        !metricCheck(cohort.morale, "morale") ||
        !metricCheck(cohort.productivity, "productivity") ||
        !metricCheck(cohort.resentment, "resentment") ||
        !metricCheck(cohort.loyalty, "loyalty")
      ) {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Cohort '${cohort.id}' in '${settlement.id}' has metrics outside [0, 100] range`,
        };
      }
    }

    // Named Characters validation (R1-F01)
    for (const npc of settlement.namedCharacters) {
      if (!npc.id || typeof npc.id !== "string" || npc.id.trim() === "") {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Settlement '${settlement.id}' contains character with missing or empty ID`,
        };
      }
      if (!Number.isInteger(npc.age) || npc.age < 0) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Character '${npc.id}' has invalid age: ${npc.age}. Must be non-negative integer.`,
        };
      }
      if (!Number.isFinite(npc.health) || npc.health < 0 || npc.health > 100) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Character '${npc.id}' has invalid health: ${npc.health}. Must be in [0, 100].`,
        };
      }
      // Check needs, emotions, skills, relationship
      const checkDict = (dict: object) => {
        for (const [, v] of Object.entries(dict)) {
          if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) {
            return false;
          }
        }
        return true;
      };
      if (
        !checkDict(npc.needs) ||
        !checkDict(npc.emotions) ||
        !checkDict(npc.skills) ||
        !checkDict(npc.relationshipToPlayer)
      ) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Character '${npc.id}' has attributes outside [0, 100] range`,
        };
      }
    }
  }

  // 3. Two-way Active Settlement Invariant (LAW-05)
  const activeSettlements = Object.values(state.settlements).filter(s => s.status === "active");

  if (activeSettlements.length === 0) {
    if (state.activeSettlementId !== null) {
      return {
        valid: false,
        code: "DANGLING_ACTIVE_POINTER",
        message: `activeSettlementId is '${state.activeSettlementId}' but no active settlements exist in world`,
      };
    }
  } else if (activeSettlements.length === 1) {
    const singleActive = activeSettlements[0];
    if (state.activeSettlementId === null) {
      return {
        valid: false,
        code: "INVALID_ACTIVE_POINTER",
        message: `Active settlement '${singleActive.id}' exists, but activeSettlementId is null`,
      };
    }
    if (state.activeSettlementId !== singleActive.id) {
      return {
        valid: false,
        code: "POINTER_TARGET_NOT_ACTIVE",
        message: `activeSettlementId '${state.activeSettlementId}' does not match the active settlement '${singleActive.id}'`,
      };
    }
  } else {
    // 2 or more active settlements
    return {
      valid: false,
      code: "MULTIPLE_ACTIVE_SETTLEMENTS",
      message: `Found ${activeSettlements.length} active settlements. World can only have at most 1 active settlement`,
    };
  }

  return { valid: true };
}
