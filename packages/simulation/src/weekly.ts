import {
  hasWeeklyKeys, isCanonicalGameState, weeklyWorkforceMilli, resolveResourceFlow,
  type EndWeekCommand, type WeeklyCommandResult, type WeeklyReport, type WeeklyStocks,
} from "@haven/core";

export const FARM_FIELD_CAPACITY_MILLI = 10000;
export const FARM_GOLD_PER_WF = 1;
export const FARM_FOOD_PER_WF = 2;

export function executeWeeklyCommand<S>(state: S, rawCommand: unknown): WeeklyCommandResult<S> {
  const fail = (code: string, message: string): WeeklyCommandResult<S> => ({ success: false, state, error: { code, message } });
  try {
    if (!isCanonicalGameState(state)) return fail("INVALID_STATE", "Canonical world, settlements and cohorts must satisfy weekly invariants.");
    if (!hasWeeklyKeys(rawCommand, ["type", "expectedWeek", "foodWorkforceMilli"]) ||
        rawCommand.type !== "END_WEEK" || !Number.isSafeInteger(rawCommand.expectedWeek) ||
        (rawCommand.expectedWeek as number) < 1 || !Number.isSafeInteger(rawCommand.foodWorkforceMilli) ||
        (rawCommand.foodWorkforceMilli as number) < 0) {
      return fail("INVALID_COMMAND", "Supply END_WEEK with a positive safe expectedWeek and nonnegative whole milli-WF.");
    }
    const command = rawCommand as unknown as EndWeekCommand;
    if (command.expectedWeek !== state.week) return fail("WEEK_MISMATCH", "Expected week must match the current planning week.");
    const id = state.activeSettlementId;
    if (id === null) return fail("NO_ACTIVE_SETTLEMENT", "End Week requires an active settlement. The week was not advanced.");
    const settlement = state.settlements[id];
    let effectiveMilli: number;
    try { effectiveMilli = weeklyWorkforceMilli(settlement.cohorts); }
    catch { return fail("OVERFLOW", "Cohort workforce exceeds safe helper arithmetic. No stocks or clock were changed."); }
    const assignedMilli = command.foodWorkforceMilli;
    if (assignedMilli > Math.min(effectiveMilli, FARM_FIELD_CAPACITY_MILLI)) {
      return fail("INVALID_COMMAND", "Assignment exceeds available workforce or the Farm Field weekly capacity.");
    }
    if (assignedMilli > Math.floor(Number.MAX_SAFE_INTEGER / FARM_GOLD_PER_WF)) return fail("OVERFLOW", "Requested Gold exceeds safe arithmetic.");
    const requestedGold = assignedMilli * FARM_GOLD_PER_WF;
    const fundedMilli = Math.min(settlement.inventory.gold, requestedGold) / FARM_GOLD_PER_WF;
    // Guard intermediate arithmetic before legacy helpers; never commit a partial Gold debit.
    if (fundedMilli > Math.floor(Number.MAX_SAFE_INTEGER / FARM_FOOD_PER_WF) ||
        settlement.inventory.food > Number.MAX_SAFE_INTEGER - FARM_FOOD_PER_WF * fundedMilli ||
        state.week === Number.MAX_SAFE_INTEGER) {
      return fail("OVERFLOW", "Week or Food would exceed the safe integer range. No stocks were changed.");
    }
    const gold = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.gold, inflow: 0, requestedOutflow: requestedGold }));
    const food = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.food, inflow: FARM_FOOD_PER_WF * fundedMilli, requestedOutflow: 0 }));
    const wood = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.wood, inflow: 0, requestedOutflow: 0 }));
    const iron = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.iron, inflow: 0, requestedOutflow: 0 }));
    const resources: WeeklyStocks = { gold: gold.closingStock, food: food.closingStock, wood: wood.closingStock, iron: iron.closingStock };
    const report: WeeklyReport = Object.freeze({
      week: state.week, settlementId: id,
      before: Object.freeze({ ...settlement.inventory }),
      after: Object.freeze({ ...resources }),
      net: Object.freeze({ gold: -gold.actualOutflow, food: food.inflow, wood: 0, iron: 0 }),
      flows: Object.freeze({ gold, food, wood, iron }),
      workforce: Object.freeze({ effectiveMilli, assignedMilli, availableMilli: effectiveMilli - assignedMilli, fundedMilli, unfundedMilli: assignedMilli - fundedMilli }),
      why: `Farm Field: each funded WF costs ${FARM_GOLD_PER_WF} Gold and produces ${FARM_FOOD_PER_WF} Food. ` +
        (gold.deficit > 0 ? "Gold shortage: assigned workforce is only funded up to available Gold; unfunded assignments produce no Food. " : "All assigned workforce is funded. ") +
        "No Food consumption or Gold income in this experimental slice.",
    });
    const nextState = structuredClone(state);
    nextState.week = state.week + 1;
    nextState.settlements[id].inventory = resources;
    return { success: true, nextState, report };
  } catch {
    return fail("EXECUTION_ERROR", "Weekly command execution failed. Original state and week were preserved.");
  }
}
