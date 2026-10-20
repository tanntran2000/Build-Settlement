import { describe, expect, it, vi } from "vitest";
import { createWeeklyState, type CanonicalGameState } from "@haven/core";
import * as core from "@haven/core";
import { executeWeeklyCommand } from "../weekly.js";

const command = (farmWorkforceMilli = 4000, processorWorkforceMilli = farmWorkforceMilli, expectedWeek = 1) => ({ type: "END_WEEK", expectedWeek, farmWorkforceMilli, processorWorkforceMilli });
const active = (state = createWeeklyState()) => state.settlements[state.activeSettlementId!];
const stateWith = (gold: number, food = 4000): CanonicalGameState => {
  const state = createWeeklyState(); active(state).inventory = { gold, wheat: 0, food, wood: 0, iron: 0 }; return state;
};
function freeze(value: object) {
  for (const child of Object.values(value)) if (child && typeof child === "object") freeze(child);
  Object.freeze(value);
}

function success(state = createWeeklyState(), assigned = 4000, processor = assigned) {
  const result = executeWeeklyCommand(state, command(assigned, processor, state.week));
  expect(result.success).toBe(true);
  if (!result.success) throw new Error(result.error.message);
  return result;
}

describe("END_WEEK transaction", () => {
  it("harvests then processes with 4+4 WF: Gold 10→6, Wheat 0→8→0, Food 4→12 with a complete immutable ledger", () => {
    const { nextState, report } = success();
    expect(nextState).toEqual({ ...stateWith(6000, 12000), week: 2 });
    expect(report.settlementId).toBe(nextState.activeSettlementId);
    expect(report.week).toBe(1);
    expect(report.before).toEqual(active().inventory);
    expect(report.after).toEqual(active(nextState).inventory);
    expect(report.net).toEqual({ gold: -4000, wheat: 0, food: 8000, wood: 0, iron: 0 });
    expect(report.flows.gold).toMatchObject({ requestedOutflow: 4000, actualOutflow: 4000, deficit: 0 });
    expect(report.flows.food.inflow).toBe(8000);
    expect(report.flows.wheat).toMatchObject({ openingStock: 0, inflow: 8000, actualOutflow: 8000, closingStock: 0 });
    expect(report.production).toEqual({ farm: { plannedBatches: 4, completedBatches: 4, blockedBatches: 0 }, processor: { plannedBatches: 4, completedBatches: 4, blockedBatches: 0 } });
    expect(report.workforce).toEqual({ effectiveMilli: 10000, assignedMilli: 8000, availableMilli: 2000, fulfilledMilli: 8000, idleAssignedMilli: 0 });
    for (const value of [report, report.before, report.after, report.net, report.flows, ...Object.values(report.flows), report.workforce, report.production, report.production.farm, report.production.processor]) expect(Object.isFrozen(value)).toBe(true);
    expect(report.after).not.toBe(active(nextState).inventory);
    expect(report.why).toContain("1 Gold");
  });
  it("runs only complete batches with Gold 2, leaving 4 reserved idle and 2 unassigned WF", () => {
    const { nextState, report } = success(stateWith(2000));
    expect(active(nextState).inventory).toEqual({ gold: 0, wheat: 0, food: 8000, wood: 0, iron: 0 });
    expect(report.workforce).toMatchObject({ availableMilli: 2000, idleAssignedMilli: 4000, fulfilledMilli: 4000 });
    expect(report.flows.gold).toMatchObject({ requestedOutflow: 2000, actualOutflow: 2000, deficit: 0 });
    expect(report.why).toContain("Gold shortage");
  });
  it.each([[0, 0, 0, 4000], [10000, 1000, 9000, 6000], [0, 4000, 0, 4000], [10000, 5000, 5000, 14000]])("Gold %i, assignment %i → Gold %i, Food %i", (gold, assigned, finalGold, finalFood) => {
    expect(active(success(stateWith(gold), assigned).nextState).inventory).toEqual({ gold: finalGold, wheat: 0, food: finalFood, wood: 0, iron: 0 });
  });
  it("is pure on frozen inputs and deterministic on replay of old state", () => {
    const state = createWeeklyState();
    freeze(state);
    const cmd = Object.freeze(command());
    const first = executeWeeklyCommand(state, cmd);
    expect(executeWeeklyCommand(state, cmd)).toEqual(first);
    expect(state).toEqual(createWeeklyState());
  });
  it("keeps a continuous ledger over multiple weeks without extra income or consumption", () => {
    let state = createWeeklyState();
    for (let i = 0; i < 5; i++) {
      const { nextState, report } = success(state);
      expect(report.before).toEqual(active(state).inventory);
      for (const key of ["gold", "wheat", "food", "wood", "iron"] as const) expect(report.before[key] + report.net[key]).toBe(report.after[key]);
      state = nextState;
    }
    expect(state).toEqual({ ...stateWith(0, 24000), week: 6 });
  });
  it.each([null, [], {}, { ...command(), type: "ADVANCE_DAY" }, { ...command(), extra: 0 }, { type: "END_WEEK", expectedWeek: 1 }, { type: "END_WEEK", expectedWeek: 1, foodWorkforceMilli: 4000 }, ...[-1, 0.1, 500, 6000, NaN, Infinity, 10001, Number.MAX_SAFE_INTEGER + 1, "4000"].flatMap(value => [{ ...command(), farmWorkforceMilli: value }, { ...command(), processorWorkforceMilli: value }])])("rejects invalid command %j without state mutation or report", (cmd) => {
    const state = createWeeklyState();
    const result = executeWeeklyCommand(state, cmd);
    expect(result.success).toBe(false);
    if (result.success) throw new Error("unexpected success");
    expect(result.state).toBe(state);
    expect(result.error.code).toBe("INVALID_COMMAND");
    expect(result).not.toHaveProperty("report");
    expect(state).toEqual(createWeeklyState());
  });
  it.each([0, 2, -1, 1.5, "1", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects stale/future/invalid expectedWeek %j", (expectedWeek) => {
    const result = executeWeeklyCommand(createWeeklyState(), { ...command(), expectedWeek });
    expect(result.success).toBe(false);
    expect(result).not.toHaveProperty("report");
  });
  it("rejects replay against the next state", () => {
    const state = success().nextState;
    expect(executeWeeklyCommand(state, command())).toMatchObject({ success: false, state, error: { code: "WEEK_MISMATCH" } });
  });
  it.each([null, [], {}, { ...createWeeklyState(), extra: 0 }, { week: 1, resources: { ...active().inventory, Water: 0 } }])("rejects invalid state %j", (state) => {
    const result = executeWeeklyCommand(state, command());
    expect(result).toMatchObject({ success: false, state, error: { code: "INVALID_STATE" } });
    expect(result).not.toHaveProperty("report");
  });
  it.each([{ ...stateWith(10000, Number.MAX_SAFE_INTEGER - 7999) }, { ...createWeeklyState(), week: Number.MAX_SAFE_INTEGER }])("rolls back Gold too when Food/week overflows %j", (state) => {
    const before = structuredClone(state);
    const result = executeWeeklyCommand(state, command(4000, 4000, state.week));
    expect(result).toMatchObject({ success: false, error: { code: "OVERFLOW" } });
    if (result.success) throw new Error("unexpected success");
    expect(result.state).toBe(state);
    expect(state).toEqual(before);
    expect(result).not.toHaveProperty("report");
  });
  it("allows the exact safe Food boundary and preserves Wood/Iron", () => {
    const state = stateWith(10000, Number.MAX_SAFE_INTEGER - 8000);
    active(state).inventory.wood = 1000; active(state).inventory.iron = 2000;
    expect(active(success(state).nextState).inventory).toEqual({ gold: 6000, wheat: 0, food: Number.MAX_SAFE_INTEGER, wood: 1000, iron: 2000 });
  });
});

describe("canonical ownership and authority", () => {
  it("rejects END_WEEK with no active settlement, including a world with only legacy settlements", () => {
    for (const empty of [true, false]) {
      const state = createWeeklyState(); state.activeSettlementId = null;
      if (empty) state.settlements = {};
      else Object.values(state.settlements)[0].status = "legacy";
      const before = structuredClone(state);
      const result = executeWeeklyCommand(state, command(0));
      expect(result).toMatchObject({ success: false, error: { code: "NO_ACTIVE_SETTLEMENT" } });
      if (result.success) throw new Error("unexpected success");
      expect(result.state).toBe(state); expect(state).toEqual(before); expect(result).not.toHaveProperty("report");
    }
  });
  it("touches only the active inventory/root week, preserving every other field and settlement", () => {
    const state = createWeeklyState();
    state.settlements.legacy = { ...structuredClone(active(state)), id: "legacy", status: "legacy", inventory: { gold: 4321, wheat: 1234, food: 9876, wood: 33, iron: 44 }, cohorts: [{ ...active(state).cohorts[0], id: "legacy_people", count: 1000 }] };
    const before = structuredClone(state); freeze(state);
    const { nextState, report } = success(state);
    const expected = structuredClone(before); expected.week = 2; active(expected).inventory = { gold: 6000, wheat: 0, food: 12000, wood: 0, iron: 0 };
    expect(nextState).toEqual(expected); expect(state).toEqual(before);
    expect(report.settlementId).toBe(state.activeSettlementId);
    expect(report.workforce.effectiveMilli).toBe(10000);
    nextState.settlements.legacy.cohorts[0].count = 1;
    nextState.worldMetadata.worldSeed = 1;
    active(nextState).cohorts[0].count = 1;
    expect(state).toEqual(before);
    expect(report.after.food).toBe(12000);
  });
  it("follows the actual active pointer rather than a fixed fixture ID", () => {
    const state = createWeeklyState(); const former = active(state); former.status = "legacy";
    state.settlements.new_haven = { ...structuredClone(former), id: "new_haven", status: "active", cohorts: [{ ...former.cohorts[0], id: "new_people", count: 50 }] };
    state.activeSettlementId = "new_haven";
    const { nextState, report } = success(state, 2000);
    expect(report.workforce.effectiveMilli).toBe(5000);
    expect(report.workforce.availableMilli).toBe(1000);
    expect(report.settlementId).toBe("new_haven");
    expect(nextState.settlements[former.id]).toEqual(former);
    expect(nextState.settlements.new_haven.inventory).toEqual({ gold: 8000, wheat: 0, food: 8000, wood: 0, iron: 0 });
  });
  it.each([[50, "common", "citizen", 5000], [15, "lower", "citizen", 2250], [100, "elite", "citizen", 0], [100, "elite", "enslaved", 20000], [200, "common", "citizen", 20000]] as const)("uses real cohort count/class/legal status: %i %s/%s", (count, socialClass, legalStatus, pool) => {
    const state = createWeeklyState(); Object.assign(active(state).cohorts[0], { count, socialClass, legalStatus });
    const assigned = Math.min(Math.floor(pool / 2000) * 1000, 5000);
    const { report } = success(state, assigned);
    expect(report.workforce.effectiveMilli).toBe(pool);
    expect(report.workforce.availableMilli).toBe(pool - 2 * assigned);
    const bad = executeWeeklyCommand(state, command(assigned + 1));
    expect(bad).toMatchObject({ success: false, error: { code: "INVALID_COMMAND" } });
  });
  it("accepts zero workforce with zero cohorts, rejects positive assignment", () => {
    const state = createWeeklyState(); active(state).cohorts = [];
    expect(success(state, 0).report.workforce.effectiveMilli).toBe(0);
    expect(executeWeeklyCommand(state, command(1))).toMatchObject({ success: false, error: { code: "INVALID_COMMAND" } });
  });
  it.each([Number.MAX_SAFE_INTEGER, 90071992547410])("returns atomic OVERFLOW for true social result overflow count %i", count => {
    const state = createWeeklyState(); active(state).cohorts[0].count = count;
    const before = structuredClone(state); freeze(state);
    const result = executeWeeklyCommand(state, command(0));
    expect(result).toMatchObject({ success: false, error: { code: "OVERFLOW" } });
    if (result.success) throw new Error("unexpected success");
    expect(result.state).toBe(state); expect(state).toEqual(before); expect(result).not.toHaveProperty("report");
  });
  it("preserves report snapshots after later state mutations", () => {
    const { nextState, report } = success(); const snapshot = structuredClone(report);
    active(nextState).inventory.gold = 0; active(nextState).inventory.food = 0;
    expect(report).toEqual(snapshot);
  });
});


describe("canonical correction regressions", () => {
  it.each([[9007199255, 900719925500], [90071992547409, 9007199254740900]])("runs the same 4+4 WF chain with large safe canonical population %i", (count, pool) => {
    const state = createWeeklyState(); active(state).cohorts[0].count = count;
    const { nextState, report } = success(state);
    expect(report.workforce).toMatchObject({ effectiveMilli: pool, availableMilli: pool - 8000, fulfilledMilli: 8000 });
    expect(active(nextState).inventory).toEqual({ gold: 6000, wheat: 0, food: 12000, wood: 0, iron: 0 });
  });
  it("returns structured failure for an otherwise-valid root Proxy that cannot be cloned", () => {
    const state = createWeeklyState(); const before = structuredClone(state); freeze(state);
    const proxy = new Proxy(state, {});
    let threw = false; let result: ReturnType<typeof executeWeeklyCommand> | undefined;
    try { result = executeWeeklyCommand(proxy, command()); } catch { threw = true; }
    expect(threw).toBe(false);
    expect(result).toMatchObject({ success: false, error: { code: "EXECUTION_ERROR" } });
    if (!result || result.success) throw new Error("expected failure");
    expect(result.state).toBe(proxy); expect(result).not.toHaveProperty("report"); expect(state).toEqual(before);
  });
  it("contains unexpected command errors without coercing thrown objects", () => {
    const state = createWeeklyState(); const before = structuredClone(state); freeze(state);
    const cmd = new Proxy(command(), { get() { throw Object.create(null); } });
    let threw = false; let result: ReturnType<typeof executeWeeklyCommand> | undefined;
    try { result = executeWeeklyCommand(state, cmd); } catch { threw = true; }
    expect(threw).toBe(false);
    expect(result).toMatchObject({ success: false, error: { code: "EXECUTION_ERROR" } });
    if (!result || result.success) throw new Error("expected failure");
    expect(result.state).toBe(state); expect(result).not.toHaveProperty("report"); expect(state).toEqual(before);
  });
  it("preserves the INVALID_STATE boundary for revoked Proxy input", () => {
    const { proxy, revoke } = Proxy.revocable(createWeeklyState(), {}); revoke();
    const result = executeWeeklyCommand(proxy, command());
    expect(result).toMatchObject({ success: false, error: { code: "INVALID_STATE" } });
    if (result.success) throw new Error("unexpected success");
    expect(result.state).toBe(proxy); expect(result).not.toHaveProperty("report");
  });
});

describe("whole-batch Food chain", () => {
  it.each([
    [10000, 0, 1000, 4000, 9000, 0, 6000, 1, 1, 5000, 3000],
    [1500, 0, 4000, 4000, 500, 0, 6000, 1, 1, 2000, 6000],
    [999, 0, 1000, 1000, 999, 0, 4000, 0, 0, 8000, 2000],
    [10000, 3000, 0, 2000, 10000, 1000, 6000, 0, 1, 8000, 1000],
    [10000, 0, 4000, 0, 6000, 8000, 4000, 4, 0, 6000, 0],
  ])("G%i W%i reservations %i+%i preserve complete inputs and the shared pool", (gold, wheat, farm, processor, g, w, f, h, p, available, idle) => {
    const state = stateWith(gold); active(state).inventory.wheat = wheat;
    const { nextState, report } = success(state, farm, processor);
    expect(active(nextState).inventory).toEqual({ gold: g, wheat: w, food: f, wood: 0, iron: 0 });
    expect(report.production).toEqual({ farm: { plannedBatches: farm / 1000, completedBatches: h, blockedBatches: farm / 1000 - h }, processor: { plannedBatches: processor / 1000, completedBatches: p, blockedBatches: processor / 1000 - p } });
    expect(report.workforce).toMatchObject({ availableMilli: available, idleAssignedMilli: idle, fulfilledMilli: (h + p) * 1000 });
    expect(wheat + report.flows.wheat.inflow).toBe(w + report.flows.wheat.actualOutflow);
    expect(report.workforce.effectiveMilli).toBe(available + idle + (h + p) * 1000);
    expect(gold - g).toBe(h * 1000); expect(f - 4000).toBe(p * 2000);
  });
  it("rejects shared 8 WF reservation against 6 WF before either activity runs", () => {
    const state = createWeeklyState(); active(state).cohorts[0].count = 60;
    const before = structuredClone(state);
    expect(executeWeeklyCommand(state, command())).toMatchObject({ success: false, state, error: { code: "INVALID_COMMAND" } });
    expect(state).toEqual(before);
  });
  it("requires the processor for any processing reservation, but permits harvest-only without it", () => {
    const state = createWeeklyState(); active(state).foodProcessorOperational = false;
    const before = structuredClone(state);
    expect(executeWeeklyCommand(state, command())).toMatchObject({ success: false, state, error: { code: "FORBIDDEN" } });
    expect(state).toEqual(before);
    expect(active(success(state, 4000, 0).nextState).inventory).toMatchObject({ gold: 6000, wheat: 8000, food: 4000 });
  });
  it("rejects intermediate Wheat overflow even when processing would restore the closing stock", () => {
    const state = createWeeklyState(); active(state).inventory.wheat = Number.MAX_SAFE_INTEGER - 7999;
    const before = structuredClone(state);
    expect(executeWeeklyCommand(state, command())).toMatchObject({ success: false, state, error: { code: "OVERFLOW" } });
    expect(state).toEqual(before);
  });
  it("permits the exact intermediate Wheat limit without double consumption", () => {
    const state = createWeeklyState(); active(state).inventory.wheat = Number.MAX_SAFE_INTEGER - 8000;
    const { nextState, report } = success(state);
    expect(report.flows.wheat.available).toBe(Number.MAX_SAFE_INTEGER);
    expect(active(nextState).inventory.wheat).toBe(Number.MAX_SAFE_INTEGER - 8000);
  });
  it("rolls back the whole transaction when candidate validation fails", () => {
    const state = createWeeklyState(); const before = structuredClone(state);
    const validate = core.isCanonicalGameState;
    const spy = vi.spyOn(core, "isCanonicalGameState").mockImplementationOnce(validate).mockReturnValueOnce(false);
    try {
      const result = executeWeeklyCommand(state, command());
      expect(result).toMatchObject({ success: false, state, error: { code: "INVARIANT_VIOLATION" } });
      expect(result).not.toHaveProperty("report"); expect(state).toEqual(before);
    } finally { spy.mockRestore(); }
  });
});
