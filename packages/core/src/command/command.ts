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
    | "INVARIANT_VIOLATION";
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
