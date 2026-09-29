import { GameState, Command, CommandResult, validateGameState } from "@haven/core";
import { handleAdvanceDay } from "./handlers/advanceDay.js";

export function executeCommand(state: GameState, command: Command): CommandResult {
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

  // 2. Thẩm định cú pháp Command
  if (!command || typeof command !== "object" || !("type" in command)) {
    return {
      success: false,
      error: {
        code: "INVALID_COMMAND",
        message: "Command must be an object containing a valid 'type'",
      },
      state,
    };
  }

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

  // 4. Điều phối Handler & Thực thi nguyên tử trên Draft State
  if (command.type === "ADVANCE_DAY") {
    // Deep clone to draft state (structuredClone guarantees deep isolation)
    const draftState: GameState = structuredClone(state);

    const result = handleAdvanceDay(draftState);

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
  }

  // Các lệnh quản trị khác đã được thẩm định quyền hạn nhưng chưa có handler
  return {
    success: false,
    error: {
      code: "COMMAND_NOT_YET_IMPLEMENTED",
      message: `Command '${command.type}' is recognized and authorized, but its handler is not yet implemented in R1`,
    },
    state,
  };
}
