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
    | "NEGATIVE_INVENTORY";
  message?: string;
}

export function validateGameState(state: GameState): StateValidationResult {
  // 1. Clock validation
  const { day, week, year } = state.currentDate;
  if (!Number.isFinite(day) || day < 1 || !Number.isFinite(week) || week < 1 || !Number.isFinite(year) || year < 1) {
    return {
      valid: false,
      code: "INVALID_CLOCK",
      message: `Invalid GameDate: day=${day}, week=${week}, year=${year}`,
    };
  }

  // 2. Key-ID Matching & Inventory validation
  const entries = Object.entries(state.settlements);
  for (const [key, settlement] of entries) {
    if (key !== settlement.id) {
      return {
        valid: false,
        code: "KEY_ID_MISMATCH",
        message: `Dictionary key '${key}' does not match settlement ID '${settlement.id}'`,
      };
    }

    for (const [res, count] of Object.entries(settlement.inventory)) {
      if (!Number.isFinite(count) || count < 0) {
        return {
          valid: false,
          code: "NEGATIVE_INVENTORY",
          message: `Settlement '${settlement.id}' has invalid or negative inventory for ${res}: ${count}`,
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
