import {
  hasWeeklyKeys, isWeeklyState, weeklyWorkforceMilli, resolveResourceFlow,
  type EndWeekCommand, type WeeklyCommandResult, type WeeklyReport, type WeeklyStocks,
} from "@haven/core";

export function executeWeeklyCommand<S>(state: S, rawCommand: unknown): WeeklyCommandResult<S> {
  const fail = (code: string, message: string): WeeklyCommandResult<S> => ({ success: false, state, error: { code, message } });
  if (!isWeeklyState(state)) return fail("INVALID_STATE", "Weekly state must contain a positive safe week and exactly four nonnegative safe milli stocks.");
  const effectiveMilli = weeklyWorkforceMilli();
  if (!hasWeeklyKeys(rawCommand, ["type", "expectedWeek", "foodWorkforceMilli"]) ||
      rawCommand.type !== "END_WEEK" || !Number.isSafeInteger(rawCommand.expectedWeek) ||
      (rawCommand.expectedWeek as number) < 1 || !Number.isSafeInteger(rawCommand.foodWorkforceMilli) ||
      (rawCommand.foodWorkforceMilli as number) < 0 ||
      (rawCommand.foodWorkforceMilli as number) > Math.min(effectiveMilli, 10000)) {
    return fail("INVALID_COMMAND", "Assign 0–10 WF in whole milli-WF and supply a positive safe expectedWeek.");
  }
  const command = rawCommand as unknown as EndWeekCommand;
  if (command.expectedWeek !== state.week) return fail("WEEK_MISMATCH", "Expected week must match the current planning week.");
  const assignedMilli = command.foodWorkforceMilli;
  const fundedMilli = Math.min(state.resources.gold, assignedMilli);
  // Guard arithmetic before calling legacy flow helpers, which accept integers beyond the safe range.
  if (fundedMilli > Math.floor(Number.MAX_SAFE_INTEGER / 2) ||
      state.resources.food > Number.MAX_SAFE_INTEGER - 2 * fundedMilli ||
      state.week === Number.MAX_SAFE_INTEGER) {
    return fail("OVERFLOW", "Week or Food would exceed the safe integer range. No stocks were changed.");
  }
  const gold = Object.freeze(resolveResourceFlow({ openingStock: state.resources.gold, inflow: 0, requestedOutflow: assignedMilli }));
  const food = Object.freeze(resolveResourceFlow({ openingStock: state.resources.food, inflow: 2 * fundedMilli, requestedOutflow: 0 }));
  const wood = Object.freeze(resolveResourceFlow({ openingStock: state.resources.wood, inflow: 0, requestedOutflow: 0 }));
  const iron = Object.freeze(resolveResourceFlow({ openingStock: state.resources.iron, inflow: 0, requestedOutflow: 0 }));
  const resources: WeeklyStocks = { gold: gold.closingStock, food: food.closingStock, wood: wood.closingStock, iron: iron.closingStock };
  const report: WeeklyReport = Object.freeze({
    week: state.week,
    before: Object.freeze({ ...state.resources }),
    after: Object.freeze({ ...resources }),
    net: Object.freeze({ gold: -gold.actualOutflow, food: food.inflow, wood: 0, iron: 0 }),
    flows: Object.freeze({ gold, food, wood, iron }),
    workforce: Object.freeze({ effectiveMilli, assignedMilli, availableMilli: effectiveMilli - assignedMilli, fundedMilli, unfundedMilli: assignedMilli - fundedMilli }),
    why: "Farm Field: each funded WF costs 1 Gold and produces 2 Food. " +
      (gold.deficit > 0 ? "Gold shortage: assigned workforce is only funded up to available Gold; unfunded assignments produce no Food. " : "All assigned workforce is funded. ") +
      "No Food consumption or Gold income in this experimental slice.",
  });
  return { success: true, nextState: { week: state.week + 1, resources }, report };
}
