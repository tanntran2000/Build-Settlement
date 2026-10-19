import { Settlement } from "./settlement.js";
import { GameDate } from "../time/clock.js";
import { ResourceType } from "./resource.js";

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
    | "INVALID_CHARACTER"
    | "INVALID_STATE";
  message?: string;
}

export const REQUIRED_RESOURCES: readonly ResourceType[] = [
  "food",
  "clean_water",
  "fuel",
  "medicine",
  "building_materials",
  "metal",
  "tools",
  "weapons",
  "currency",
] as const;

export const REQUIRED_NEEDS = [
  "safety",
  "nutrition",
  "autonomy",
  "recognition",
  "intimacy",
  "purpose",
] as const;

export const REQUIRED_EMOTIONS = [
  "joy",
  "fear",
  "anger",
  "sadness",
  "shame",
  "jealousy",
  "hope",
  "stress",
] as const;

export const REQUIRED_SKILLS = [
  "management",
  "technical",
  "medical",
  "combat",
  "negotiation",
] as const;

export const REQUIRED_RELATIONSHIP = [
  "trust",
  "affection",
  "attraction",
  "respect",
  "fear",
  "resentment",
  "dependency",
  "familiarity",
] as const;

export const REQUIRED_COHORT_METRICS = [
  "averageHealth",
  "morale",
  "productivity",
  "resentment",
  "loyalty",
] as const;

const VALID_COHORT_SOCIAL_CLASSES: readonly string[] = [
  "lower",
  "common",
  "skilled",
  "administrative",
  "elite",
] as const;

function validateMetricsDict(
  dict: unknown,
  requiredKeys: readonly string[],
  groupName: string,
  charId: string
): { valid: true } | { valid: false; message: string } {
  if (!dict || typeof dict !== "object" || Array.isArray(dict)) {
    return {
      valid: false,
      message: `Character '${charId}' is missing or has non-object '${groupName}'`,
    };
  }
  const record = dict as Record<string, unknown>;
  for (const key of requiredKeys) {
    const val = record[key];
    if (typeof val !== "number" || !Number.isFinite(val) || val < 0 || val > 100) {
      return {
        valid: false,
        message: `Character '${charId}' ${groupName} is missing or has invalid value for '${key}'. Must be in [0, 100].`,
      };
    }
  }
  for (const [k, v] of Object.entries(record)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) {
      return {
        valid: false,
        message: `Character '${charId}' ${groupName} has invalid value for '${k}'. Must be in [0, 100].`,
      };
    }
  }
  return { valid: true };
}

export function validateGameState(state: GameState): StateValidationResult {
  // 0. Container check for state
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: "GameState must be a non-null object",
    };
  }

  // 1. Clock validation & consistency
  if (!state.currentDate || typeof state.currentDate !== "object" || Array.isArray(state.currentDate)) {
    return {
      valid: false,
      code: "INVALID_CLOCK",
      message: "GameState is missing currentDate object",
    };
  }
  const { day, week, year } = state.currentDate;
  if (!Number.isSafeInteger(day) || day < 1 || !Number.isSafeInteger(week) || week < 1 || !Number.isSafeInteger(year) || year < 1) {
    return {
      valid: false,
      code: "INVALID_CLOCK",
      message: "Invalid GameDate: day, week, and year must be positive safe integers.",
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

  // World metadata container check
  if (!state.worldMetadata || typeof state.worldMetadata !== "object" || Array.isArray(state.worldMetadata)) {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: "GameState is missing worldMetadata object",
    };
  }
  if (typeof state.worldMetadata.worldSeed !== "number" || !Number.isFinite(state.worldMetadata.worldSeed)) {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: "worldMetadata.worldSeed must be a finite number",
    };
  }
  if (typeof state.worldMetadata.gameVersion !== "string") {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: `worldMetadata.gameVersion must be a string, received: ${typeof state.worldMetadata.gameVersion}`,
    };
  }

  // 2. Key-ID Matching & Settlement Contents validation
  if (!state.settlements || typeof state.settlements !== "object" || Array.isArray(state.settlements)) {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: "GameState is missing settlements dictionary",
    };
  }

  const entries = Object.entries(state.settlements);
  const seenCharacterIds = new Set<string>();
  for (const [key, settlement] of entries) {
    if (!settlement || typeof settlement !== "object" || Array.isArray(settlement)) {
      return {
        valid: false,
        code: "INVALID_STATE",
        message: `Settlement '${key}' must be a non-null object`,
      };
    }

    if (key !== settlement.id) {
      return {
        valid: false,
        code: "KEY_ID_MISMATCH",
        message: `Dictionary key '${key}' does not match settlement ID`,
      };
    }

    // Status validation
    const VALID_SETTLEMENT_STATUSES: readonly string[] = [
      "unexplored",
      "discovered",
      "active",
      "handoff",
      "legacy",
    ];
    if (typeof settlement.status !== "string" || !VALID_SETTLEMENT_STATUSES.includes(settlement.status)) {
      return {
        valid: false,
        code: "INVALID_STATE",
        message: `Settlement '${settlement.id}' has invalid status. Must be one of ${VALID_SETTLEMENT_STATUSES.join(", ")}`,
      };
    }

    // Authority & reputation validation: must be finite numbers in [0, 100]
    if (typeof settlement.authority !== "number" || !Number.isFinite(settlement.authority) || settlement.authority < 0 || settlement.authority > 100) {
      return {
        valid: false,
        code: "INVALID_STATE",
        message: `Settlement '${settlement.id}' authority must be a finite number in [0, 100]`,
      };
    }
    if (typeof settlement.reputation !== "number" || !Number.isFinite(settlement.reputation) || settlement.reputation < 0 || settlement.reputation > 100) {
      return {
        valid: false,
        code: "INVALID_STATE",
        message: `Settlement '${settlement.id}' reputation must be a finite number in [0, 100]`,
      };
    }

    // Facilities validation
    if (!Array.isArray(settlement.facilities)) {
      return {
        valid: false,
        code: "INVALID_STATE",
        message: `Settlement '${settlement.id}' facilities must be an array`,
      };
    }
    const VALID_FACILITY_STAGES: readonly string[] = [
      "planning",
      "site_prep",
      "construction",
      "operational",
      "damaged",
    ];
    for (const facility of settlement.facilities) {
      if (!facility || typeof facility !== "object" || Array.isArray(facility)) {
        return {
          valid: false,
          code: "INVALID_STATE",
          message: `Settlement '${settlement.id}' contains invalid facility entry`,
        };
      }
      if (typeof facility.id !== "string" || typeof facility.name !== "string" || typeof facility.type !== "string") {
        return {
          valid: false,
          code: "INVALID_STATE",
          message: `Facility in '${settlement.id}' must have string id, name, and type`,
        };
      }
      if (typeof facility.stage !== "string" || !VALID_FACILITY_STAGES.includes(facility.stage)) {
        return {
          valid: false,
          code: "INVALID_STATE",
          message: `Facility '${facility.id}' in '${settlement.id}' has invalid stage. Must be one of ${VALID_FACILITY_STAGES.join(", ")}`,
        };
      }
      if (
        typeof facility.level !== "number" || !Number.isFinite(facility.level) ||
        typeof facility.capacity !== "number" || !Number.isFinite(facility.capacity) ||
        typeof facility.assignedWorkerCount !== "number" || !Number.isFinite(facility.assignedWorkerCount)
      ) {
        return {
          valid: false,
          code: "INVALID_STATE",
          message: `Facility '${facility.id}' in '${settlement.id}' must have finite numbers for level, capacity, and assignedWorkerCount`,
        };
      }
      if (facility.assignedManagerId !== undefined && typeof facility.assignedManagerId !== "string") {
        return {
          valid: false,
          code: "INVALID_STATE",
          message: `Facility '${facility.id}' in '${settlement.id}' has invalid assignedManagerId (must be string if present)`,
        };
      }
    }

    // Inventory validation: must have all required resources as non-negative integers
    if (!settlement.inventory || typeof settlement.inventory !== "object" || Array.isArray(settlement.inventory)) {
      return {
        valid: false,
        code: "NEGATIVE_INVENTORY",
        message: `Settlement '${settlement.id}' is missing inventory object`,
      };
    }

    for (const res of REQUIRED_RESOURCES) {
      const count = settlement.inventory[res];
      if (!Number.isSafeInteger(count) || count < 0) {
        return {
          valid: false,
          code: "NEGATIVE_INVENTORY",
          message: `Settlement '${settlement.id}' is missing or has invalid inventory for '${res}'. Must be non-negative integer.`,
        };
      }
    }

    for (const [res, count] of Object.entries(settlement.inventory)) {
      if (!Number.isSafeInteger(count) || count < 0) {
        return {
          valid: false,
          code: "NEGATIVE_INVENTORY",
          message: `Settlement '${settlement.id}' has invalid inventory for '${res}'. Must be non-negative integer.`,
        };
      }
    }

    // Cohorts validation
    if (!Array.isArray(settlement.cohorts)) {
      return {
        valid: false,
        code: "INVALID_POPULATION",
        message: `Settlement '${settlement.id}' cohorts must be an array`,
      };
    }

    let totalPopulation = 0;

    for (const cohort of settlement.cohorts) {
      if (!cohort || typeof cohort !== "object" || Array.isArray(cohort)) {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Settlement '${settlement.id}' contains invalid cohort entry`,
        };
      }
      if (!cohort.id || typeof cohort.id !== "string" || cohort.id.trim() === "") {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Settlement '${settlement.id}' contains cohort with missing or empty ID`,
        };
      }
      if (typeof cohort.socialClass !== "string" || !VALID_COHORT_SOCIAL_CLASSES.includes(cohort.socialClass)) {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Cohort '${cohort.id}' in '${settlement.id}' has invalid socialClass. Must be one of: lower, common, skilled, administrative, elite`,
        };
      }
      if (!Number.isSafeInteger(cohort.count) || cohort.count < 0) {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Cohort '${cohort.id}' in '${settlement.id}' has invalid count. Must be non-negative integer.`,
        };
      }
      if (Number.MAX_SAFE_INTEGER - totalPopulation < cohort.count) {
        return {
          valid: false,
          code: "INVALID_POPULATION",
          message: `Settlement '${settlement.id}' total population exceeds safe integer limit`,
        };
      }
      totalPopulation += cohort.count;

      for (const metric of REQUIRED_COHORT_METRICS) {
        const val = cohort[metric];
        if (typeof val !== "number" || !Number.isFinite(val) || val < 0 || val > 100) {
          return {
            valid: false,
            code: "INVALID_POPULATION",
            message: `Cohort '${cohort.id}' in '${settlement.id}' is missing or has invalid metric '${metric}'. Must be in [0, 100].`,
          };
        }
      }
    }

    // Named Characters validation
    if (!Array.isArray(settlement.namedCharacters)) {
      return {
        valid: false,
        code: "INVALID_CHARACTER",
        message: `Settlement '${settlement.id}' namedCharacters must be an array`,
      };
    }

    for (const npc of settlement.namedCharacters) {
      if (!npc || typeof npc !== "object" || Array.isArray(npc)) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Settlement '${settlement.id}' contains invalid character entry`,
        };
      }
      if (!npc.id || typeof npc.id !== "string" || npc.id.trim() === "") {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Settlement '${settlement.id}' contains character with missing or empty ID`,
        };
      }
      const normalizedNpcId = npc.id.trim();
      if (seenCharacterIds.has(normalizedNpcId)) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Duplicate character ID '${normalizedNpcId}' found in settlement '${settlement.id}'`,
        };
      }
      seenCharacterIds.add(normalizedNpcId);
      if (!Number.isInteger(npc.age) || npc.age < 0) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Character '${npc.id}' has invalid age. Must be non-negative integer.`,
        };
      }
      if (typeof npc.health !== "number" || !Number.isFinite(npc.health) || npc.health < 0 || npc.health > 100) {
        return {
          valid: false,
          code: "INVALID_CHARACTER",
          message: `Character '${npc.id}' has invalid health. Must be in [0, 100].`,
        };
      }

      // Validate required metric dictionaries (R1-F01)
      const needsCheck = validateMetricsDict(npc.needs, REQUIRED_NEEDS, "needs", npc.id);
      if (!needsCheck.valid) {
        return { valid: false, code: "INVALID_CHARACTER", message: needsCheck.message };
      }

      const emotionsCheck = validateMetricsDict(npc.emotions, REQUIRED_EMOTIONS, "emotions", npc.id);
      if (!emotionsCheck.valid) {
        return { valid: false, code: "INVALID_CHARACTER", message: emotionsCheck.message };
      }

      const skillsCheck = validateMetricsDict(npc.skills, REQUIRED_SKILLS, "skills", npc.id);
      if (!skillsCheck.valid) {
        return { valid: false, code: "INVALID_CHARACTER", message: skillsCheck.message };
      }

      const relCheck = validateMetricsDict(npc.relationshipToPlayer, REQUIRED_RELATIONSHIP, "relationshipToPlayer", npc.id);
      if (!relCheck.valid) {
        return { valid: false, code: "INVALID_CHARACTER", message: relCheck.message };
      }
    }

    if (Number.MAX_SAFE_INTEGER - totalPopulation < settlement.namedCharacters.length) {
      return {
        valid: false,
        code: "INVALID_POPULATION",
        message: `Settlement '${settlement.id}' total population exceeds safe integer limit`,
      };
    }
    totalPopulation += settlement.namedCharacters.length;
  }

  // 3. Two-way Active Settlement Invariant (LAW-05)
  if (!("activeSettlementId" in state)) {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: "GameState is missing activeSettlementId field",
    };
  }

  if (state.activeSettlementId !== null && typeof state.activeSettlementId !== "string") {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: "activeSettlementId must be string or null",
    };
  }

  const activeSettlements = Object.values(state.settlements).filter(s => s && s.status === "active");

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
