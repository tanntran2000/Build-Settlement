import {
  hasWeeklyKeys, isCanonicalGameState, weeklyWorkforceMilli, resolveResourceFlow,
  type EndWeekCommand, type WeeklyCommandResult, type WeeklyReport, type WeeklyStocks,
} from "@haven/core";

export const PRODUCTION_BATCH_WORKFORCE_MILLI = 1000;
export const FARM_MAX_BATCHES = 5;
export const PROCESSOR_MAX_BATCHES = 5;
export const FARM_GOLD_PER_BATCH_MILLI = 1000;
export const FARM_WHEAT_PER_BATCH_MILLI = 2000;
export const PROCESSOR_WHEAT_PER_BATCH_MILLI = 2000;
export const PROCESSOR_FOOD_PER_BATCH_MILLI = 2000;

export function executeWeeklyCommand<S>(state: S, rawCommand: unknown): WeeklyCommandResult<S> {
  const fail = (code: string, message: string): WeeklyCommandResult<S> => ({ success: false, state, error: { code, message } });
  try {
    if (!isCanonicalGameState(state)) return fail("INVALID_STATE", "Canonical world, settlements and cohorts must satisfy weekly invariants.");
    if (!hasWeeklyKeys(rawCommand, ["type", "expectedWeek", "farmWorkforceMilli", "processorWorkforceMilli"])) {
      return fail("INVALID_COMMAND", "Reserve whole WF within each building's weekly batch capacity.");
    }
    // Read untrusted fields once: getters/Proxies must not change values between checks and execution.
    const snapshot = {
      type: rawCommand.type, expectedWeek: rawCommand.expectedWeek,
      farmWorkforceMilli: rawCommand.farmWorkforceMilli, processorWorkforceMilli: rawCommand.processorWorkforceMilli,
    };
    if (snapshot.type !== "END_WEEK" || !Number.isSafeInteger(snapshot.expectedWeek) ||
        (snapshot.expectedWeek as number) < 1 ||
        !Number.isSafeInteger(snapshot.farmWorkforceMilli) || (snapshot.farmWorkforceMilli as number) < 0 ||
        !Number.isSafeInteger(snapshot.processorWorkforceMilli) || (snapshot.processorWorkforceMilli as number) < 0 ||
        (snapshot.farmWorkforceMilli as number) % PRODUCTION_BATCH_WORKFORCE_MILLI !== 0 ||
        (snapshot.processorWorkforceMilli as number) % PRODUCTION_BATCH_WORKFORCE_MILLI !== 0 ||
        (snapshot.farmWorkforceMilli as number) > FARM_MAX_BATCHES * PRODUCTION_BATCH_WORKFORCE_MILLI ||
        (snapshot.processorWorkforceMilli as number) > PROCESSOR_MAX_BATCHES * PRODUCTION_BATCH_WORKFORCE_MILLI) {
      return fail("INVALID_COMMAND", "Reserve whole WF within each building's weekly batch capacity.");
    }
    const command = snapshot as EndWeekCommand;
    if (command.expectedWeek !== state.week) return fail("WEEK_MISMATCH", "Expected week must match the current planning week.");
    const id = state.activeSettlementId;
    if (id === null) return fail("NO_ACTIVE_SETTLEMENT", "End Week requires an active settlement. The week was not advanced.");
    const settlement = state.settlements[id];
    if (command.processorWorkforceMilli > 0 && !settlement.foodProcessorOperational) {
      return fail("FORBIDDEN", "Food processing requires an operational Food Processor.");
    }
    let effectiveMilli: number;
    try { effectiveMilli = weeklyWorkforceMilli(settlement.cohorts); }
    catch { return fail("OVERFLOW", "Cohort workforce exceeds safe helper arithmetic. No stocks or clock were changed."); }
    const assignedMilli = command.farmWorkforceMilli + command.processorWorkforceMilli;
    if (assignedMilli > effectiveMilli) return fail("INVALID_COMMAND", "The two reservations exceed the shared workforce pool.");
    const farmPlanned = command.farmWorkforceMilli / PRODUCTION_BATCH_WORKFORCE_MILLI;
    const processorPlanned = command.processorWorkforceMilli / PRODUCTION_BATCH_WORKFORCE_MILLI;
    const harvested = Math.min(farmPlanned, Math.floor(settlement.inventory.gold / FARM_GOLD_PER_BATCH_MILLI));
    const wheatInflow = harvested * FARM_WHEAT_PER_BATCH_MILLI;
    // Harvest is a real intermediate stock; a later debit cannot justify overflowing it.
    if (settlement.inventory.wheat > Number.MAX_SAFE_INTEGER - wheatInflow) {
      return fail("OVERFLOW", "Harvested Wheat exceeds the safe integer range. No stocks were changed.");
    }
    const wheatAvailable = settlement.inventory.wheat + wheatInflow;
    const processed = Math.min(processorPlanned, Math.floor(wheatAvailable / PROCESSOR_WHEAT_PER_BATCH_MILLI));
    const foodInflow = processed * PROCESSOR_FOOD_PER_BATCH_MILLI;
    if (settlement.inventory.food > Number.MAX_SAFE_INTEGER - foodInflow || state.week === Number.MAX_SAFE_INTEGER) {
      return fail("OVERFLOW", "Week or Food exceeds the safe integer range. No stocks were changed.");
    }
    // Only executable whole-batch debits reach the generic flow helper.
    const gold = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.gold, inflow: 0, requestedOutflow: harvested * FARM_GOLD_PER_BATCH_MILLI }));
    const wheat = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.wheat, inflow: wheatInflow, requestedOutflow: processed * PROCESSOR_WHEAT_PER_BATCH_MILLI }));
    const food = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.food, inflow: foodInflow, requestedOutflow: 0 }));
    const wood = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.wood, inflow: 0, requestedOutflow: 0 }));
    const iron = Object.freeze(resolveResourceFlow({ openingStock: settlement.inventory.iron, inflow: 0, requestedOutflow: 0 }));
    const resources: WeeklyStocks = { gold: gold.closingStock, wheat: wheat.closingStock, food: food.closingStock, wood: wood.closingStock, iron: iron.closingStock };
    const nextState = structuredClone(state);
    nextState.week = state.week + 1;
    nextState.settlements[id].inventory = resources;
    if (!isCanonicalGameState(nextState)) return fail("INVARIANT_VIOLATION", "The proposed weekly result failed validation. Original state was preserved.");
    const fulfilledMilli = (harvested + processed) * PRODUCTION_BATCH_WORKFORCE_MILLI;
    const report: WeeklyReport = Object.freeze({
      week: state.week, settlementId: id,
      before: Object.freeze({ ...settlement.inventory }),
      after: Object.freeze({ ...resources }),
      net: Object.freeze({ gold: -gold.actualOutflow, wheat: wheat.inflow - wheat.actualOutflow, food: food.inflow, wood: 0, iron: 0 }),
      flows: Object.freeze({ gold, wheat, food, wood, iron }),
      workforce: Object.freeze({ effectiveMilli, assignedMilli, availableMilli: effectiveMilli - assignedMilli, fulfilledMilli, idleAssignedMilli: assignedMilli - fulfilledMilli }),
      production: Object.freeze({
        farm: Object.freeze({ plannedBatches: farmPlanned, completedBatches: harvested, blockedBatches: farmPlanned - harvested }),
        processor: Object.freeze({ plannedBatches: processorPlanned, completedBatches: processed, blockedBatches: processorPlanned - processed }),
      }),
      why: "Harvest runs before processing in the same week. Farm: 1 WF + 1 Gold → 2 Wheat. Food Processor: 1 WF + 2 Wheat → 2 Food. " +
        `Farm completed ${harvested}/${farmPlanned} batches; Processor completed ${processed}/${processorPlanned} batches. ` +
        (harvested < farmPlanned ? "Gold shortage blocked Farm batches. " : "All planned Farm batches were funded. ") +
        (processed < processorPlanned ? "Wheat shortage blocked Processor batches. " : "All planned Processor batches had Wheat. ") +
        "Unused Gold/Wheat stays in stock, including amounts below one batch. Assigned-but-idle WF is not reassigned. No Food consumption or Gold income.",
    });
    return { success: true, nextState, report };
  } catch {
    return fail("EXECUTION_ERROR", "Weekly command execution failed. Original state and week were preserved.");
  }
}
