import { describe, expect, it } from "vitest";
import { createWeeklyState, type WeeklyState } from "@haven/core";
import { executeWeeklyCommand } from "../weekly.js";

const command = (foodWorkforceMilli = 4000, expectedWeek = 1) => ({ type: "END_WEEK", expectedWeek, foodWorkforceMilli });
const stateWith = (gold: number, food = 4000): WeeklyState => ({ week: 1, resources: { gold, food, wood: 0, iron: 0 } });

function success(state = createWeeklyState(), assigned = 4000) {
  const result = executeWeeklyCommand(state, command(assigned, state.week));
  expect(result.success).toBe(true);
  if (!result.success) throw new Error(result.error.message);
  return result;
}

describe("END_WEEK transaction", () => {
  it("funds 4 WF: Gold 10→6, Food 4→12 with a complete immutable ledger", () => {
    const { nextState, report } = success();
    expect(nextState).toEqual({ week: 2, resources: { gold: 6000, food: 12000, wood: 0, iron: 0 } });
    expect(report.week).toBe(1);
    expect(report.before).toEqual(createWeeklyState().resources);
    expect(report.after).toEqual(nextState.resources);
    expect(report.net).toEqual({ gold: -4000, food: 8000, wood: 0, iron: 0 });
    expect(report.flows.gold).toMatchObject({ requestedOutflow: 4000, actualOutflow: 4000, deficit: 0 });
    expect(report.flows.food.inflow).toBe(8000);
    expect(report.workforce).toEqual({ effectiveMilli: 10000, assignedMilli: 4000, availableMilli: 6000, fundedMilli: 4000, unfundedMilli: 0 });
    for (const value of [report, report.before, report.after, report.net, report.flows, ...Object.values(report.flows), report.workforce]) expect(Object.isFrozen(value)).toBe(true);
    expect(report.after).not.toBe(nextState.resources);
    expect(report.why).toContain("1 Gold");
  });
  it("partially funds 4 assigned WF with Gold 2, leaving 2 unfunded and 6 unassigned", () => {
    const { nextState, report } = success(stateWith(2000));
    expect(nextState.resources).toEqual({ gold: 0, food: 8000, wood: 0, iron: 0 });
    expect(report.workforce).toMatchObject({ availableMilli: 6000, unfundedMilli: 2000, fundedMilli: 2000 });
    expect(report.flows.gold).toMatchObject({ requestedOutflow: 4000, actualOutflow: 2000, deficit: 2000 });
    expect(report.why).toContain("Gold shortage");
  });
  it.each([[0, 0, 0, 4000], [10000, 500, 9500, 5000], [0, 4000, 0, 4000], [10000, 10000, 0, 24000]])("Gold %i, assignment %i → Gold %i, Food %i", (gold, assigned, finalGold, finalFood) => {
    expect(success(stateWith(gold), assigned).nextState.resources).toEqual({ gold: finalGold, food: finalFood, wood: 0, iron: 0 });
  });
  it("is pure on frozen inputs and deterministic on replay of old state", () => {
    const state = createWeeklyState();
    Object.freeze(state.resources); Object.freeze(state);
    const cmd = Object.freeze(command());
    const first = executeWeeklyCommand(state, cmd);
    expect(executeWeeklyCommand(state, cmd)).toEqual(first);
    expect(state).toEqual(createWeeklyState());
  });
  it("keeps a continuous ledger over multiple weeks without extra income or consumption", () => {
    let state = createWeeklyState();
    for (let i = 0; i < 5; i++) {
      const { nextState, report } = success(state);
      expect(report.before).toEqual(state.resources);
      for (const key of ["gold", "food", "wood", "iron"] as const) expect(report.before[key] + report.net[key]).toBe(report.after[key]);
      state = nextState;
    }
    expect(state).toEqual({ week: 6, resources: { gold: 0, food: 24000, wood: 0, iron: 0 } });
  });
  it.each([null, [], {}, { ...command(), type: "ADVANCE_DAY" }, { ...command(), extra: 0 }, { type: "END_WEEK", expectedWeek: 1 }, ...[-1, 0.1, NaN, Infinity, 10001, Number.MAX_SAFE_INTEGER + 1, "4000"].map(foodWorkforceMilli => ({ ...command(), foodWorkforceMilli }))])("rejects invalid command %j without state mutation or report", (cmd) => {
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
  it.each([null, [], {}, { ...createWeeklyState(), extra: 0 }, { week: 1, resources: { ...createWeeklyState().resources, Water: 0 } }])("rejects invalid state %j", (state) => {
    const result = executeWeeklyCommand(state, command());
    expect(result).toMatchObject({ success: false, state, error: { code: "INVALID_STATE" } });
    expect(result).not.toHaveProperty("report");
  });
  it.each([{ ...stateWith(10000, Number.MAX_SAFE_INTEGER - 7999) }, { ...createWeeklyState(), week: Number.MAX_SAFE_INTEGER }])("rolls back Gold too when Food/week overflows %j", (state) => {
    const before = structuredClone(state);
    const result = executeWeeklyCommand(state, command(4000, state.week));
    expect(result).toMatchObject({ success: false, error: { code: "OVERFLOW" } });
    if (result.success) throw new Error("unexpected success");
    expect(result.state).toBe(state);
    expect(state).toEqual(before);
    expect(result).not.toHaveProperty("report");
  });
  it("allows the exact safe Food boundary and preserves Wood/Iron", () => {
    const state = stateWith(10000, Number.MAX_SAFE_INTEGER - 8000);
    state.resources.wood = 1000; state.resources.iron = 2000;
    expect(success(state).nextState.resources).toEqual({ gold: 6000, food: Number.MAX_SAFE_INTEGER, wood: 1000, iron: 2000 });
  });
});
