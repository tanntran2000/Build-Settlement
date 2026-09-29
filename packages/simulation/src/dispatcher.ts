import {
  GameState,
  Command,
  CommandResult,
  validateGameState,
  validateCommandSyntax,
} from "@haven/core";
import * as advanceDayModule from "./handlers/advanceDay.js";

export function executeCommand(state: GameState, rawCommand: unknown): CommandResult {
  // 1. Thẩm định tính toàn vẹn của GameState
  const stateVal = validateGameState(state);
  if (!stateVal.valid) {
    return {
      success: false,
      error: {
        code: "INVALID_STATE",
        message: stateVal.message || "Input GameState violates state invariants",
      },
      state,
    };
  }

  // 2. Thẩm định cú pháp Command (R1-F03)
  const syntaxCheck = validateCommandSyntax(rawCommand);
  if (!syntaxCheck.valid) {
    return {
      success: false,
      error: {
        code: "INVALID_COMMAND",
        message: syntaxCheck.error,
      },
      state,
    };
  }
  const command: Command = syntaxCheck.command;

  // 3. Thẩm định quyền hạn (Authority Gate - LAW-05)
  // Lệnh quản trị trực tiếp không được phép nhắm vào Legacy Settlement hoặc Settlement không trực trị
  if ("settlementId" in command) {
    const targetSettlement = state.settlements[command.settlementId];
    if (!targetSettlement) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Target settlement '${command.settlementId}' does not exist`,
        },
        state,
      };
    }
    if (targetSettlement.status === "legacy" || command.settlementId !== state.activeSettlementId) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Player does not possess direct governance authority over this settlement",
        },
        state,
      };
    }
  }

  // 4. Điều phối Handler & Thực thi nguyên tử trên Draft State (R1-F04)
  if (command.type === "ADVANCE_DAY") {
    // Deep clone to draft state (structuredClone guarantees deep isolation)
    const draftState: GameState = structuredClone(state);

    try {
      const result = advanceDayModule.handleAdvanceDay(draftState);

      // Thẩm định lại state sau khi chạy handler (Post-execution invariant check)
      const postVal = validateGameState(draftState);
      if (!postVal.valid) {
        return {
          success: false,
          error: {
            code: "INVARIANT_VIOLATION",
            message: postVal.message || "Post-execution state violated invariants",
          },
          state, // Rollback to original untouched input state
        };
      }

      return {
        success: true,
        nextState: draftState,
        effects: result.effects,
        auditEntries: result.auditEntries,
        data: result.data,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: err instanceof Error ? err.message : String(err),
        },
        state, // Rollback to original untouched input state
      };
    }
  }

  // Các lệnh quản trị khác đã được thẩm định cú pháp và quyền hạn nhưng chưa có handler
  return {
    success: false,
    error: {
      code: "COMMAND_NOT_YET_IMPLEMENTED",
      message: `Command '${command.type}' is recognized and authorized, but its handler is not yet implemented in R1`,
    },
    state,
  };
}
