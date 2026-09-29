import { GameState } from "../domain/gamestate.js";
import { Effect } from "./effect.js";
import { ProductionReport } from "../domain/economy.js";

export type Command =
  | { type: "ADVANCE_DAY" }
  | { type: "BUILD_FACILITY"; settlementId: string; facilityType: string; name: string }
  | { type: "ASSIGN_MANAGER"; settlementId: string; facilityId: string; characterId: string }
  | { type: "SET_RATION"; settlementId: string; cohortId: string; level: string }
  | { type: "ENACT_POLICY"; settlementId: string; policyId: string }
  | { type: "HANDOFF_SETTLEMENT"; settlementId: string; governorId: string; charterPrinciples: string[] };

export interface AuditEntry {
  day: number;
  category: "economy" | "command" | "governance" | "system";
  message: string;
  why?: string;
}

export interface CommandError {
  code:
    | "INVALID_STATE"
    | "INVALID_COMMAND"
    | "FORBIDDEN"
    | "COMMAND_NOT_YET_IMPLEMENTED"
    | "INVARIANT_VIOLATION"
    | "EXECUTION_ERROR";
  message: string;
  details?: unknown;
}

export interface AdvanceDayResultData {
  fromDay: number;
  toDay: number;
  report: ProductionReport | null;
}

export type CommandResult =
  | {
      success: true;
      nextState: GameState;
      effects: Effect[];
      auditEntries: AuditEntry[];
      data?: AdvanceDayResultData;
    }
  | {
      success: false;
      error: CommandError;
      state: GameState; // Preserved input state
    };

export function validateCommandSyntax(
  input: unknown
): { valid: true; command: Command } | { valid: false; error: string } {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Command must be a non-null object" };
  }
  const cmd = input as Record<string, unknown>;
  if (typeof cmd.type !== "string") {
    return { valid: false, error: "Command 'type' must be a string" };
  }

  const isNonEmptyString = (val: unknown): val is string => {
    return typeof val === "string" && val.trim().length > 0;
  };

  switch (cmd.type) {
    case "ADVANCE_DAY":
      return { valid: true, command: { type: "ADVANCE_DAY" } };

    case "BUILD_FACILITY":
      if (!isNonEmptyString(cmd.settlementId) || !isNonEmptyString(cmd.facilityType) || !isNonEmptyString(cmd.name)) {
        return { valid: false, error: "BUILD_FACILITY requires non-empty settlementId, facilityType, and name strings" };
      }
      return {
        valid: true,
        command: {
          type: "BUILD_FACILITY",
          settlementId: cmd.settlementId,
          facilityType: cmd.facilityType,
          name: cmd.name,
        },
      };

    case "ASSIGN_MANAGER":
      if (!isNonEmptyString(cmd.settlementId) || !isNonEmptyString(cmd.facilityId) || !isNonEmptyString(cmd.characterId)) {
        return { valid: false, error: "ASSIGN_MANAGER requires non-empty settlementId, facilityId, and characterId strings" };
      }
      return {
        valid: true,
        command: {
          type: "ASSIGN_MANAGER",
          settlementId: cmd.settlementId,
          facilityId: cmd.facilityId,
          characterId: cmd.characterId,
        },
      };

    case "SET_RATION":
      if (!isNonEmptyString(cmd.settlementId) || !isNonEmptyString(cmd.cohortId) || !isNonEmptyString(cmd.level)) {
        return { valid: false, error: "SET_RATION requires non-empty settlementId, cohortId, and level strings" };
      }
      return {
        valid: true,
        command: {
          type: "SET_RATION",
          settlementId: cmd.settlementId,
          cohortId: cmd.cohortId,
          level: cmd.level,
        },
      };

    case "ENACT_POLICY":
      if (!isNonEmptyString(cmd.settlementId) || !isNonEmptyString(cmd.policyId)) {
        return { valid: false, error: "ENACT_POLICY requires non-empty settlementId and policyId strings" };
      }
      return {
        valid: true,
        command: {
          type: "ENACT_POLICY",
          settlementId: cmd.settlementId,
          policyId: cmd.policyId,
        },
      };

    case "HANDOFF_SETTLEMENT":
      if (
        !isNonEmptyString(cmd.settlementId) ||
        !isNonEmptyString(cmd.governorId) ||
        !Array.isArray(cmd.charterPrinciples) ||
        !cmd.charterPrinciples.every(p => typeof p === "string")
      ) {
        return { valid: false, error: "HANDOFF_SETTLEMENT requires settlementId, governorId strings and charterPrinciples string array" };
      }
      return {
        valid: true,
        command: {
          type: "HANDOFF_SETTLEMENT",
          settlementId: cmd.settlementId,
          governorId: cmd.governorId,
          charterPrinciples: cmd.charterPrinciples,
        },
      };

    default:
      return { valid: false, error: `Unrecognized command type: '${cmd.type}'` };
  }
}
