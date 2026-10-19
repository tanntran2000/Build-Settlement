import { describe, expect, it } from "vitest";
import { createWeeklyState, weeklyWorkforceMilli, isWeeklyState } from "../weekly.js";

const invalidNumbers = [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1000", null];

describe("weekly prototype state", () => {
  it("starts Week 1 with exactly four milli stocks and derives 10 WF from 100 Middle", () => {
    expect(createWeeklyState()).toEqual({ week: 1, resources: { gold: 10000, food: 4000, wood: 0, iron: 0 } });
    expect(weeklyWorkforceMilli()).toBe(10000);
  });
  it("returns independent initial stock objects", () => {
    const state = createWeeklyState();
    state.resources.food = 0;
    expect(createWeeklyState().resources.food).toBe(4000);
  });
  it.each([null, [], "state", 1, {}, { week: 1 }, { ...createWeeklyState(), extra: 0 }])("rejects malformed state %j", (value) => {
    expect(isWeeklyState(value)).toBe(false);
  });
  it.each([null, [], {}, { gold: 0, food: 0, wood: 0 }, { ...createWeeklyState().resources, Water: 0 }, { ...createWeeklyState().resources, Goods: 0 }])("rejects malformed resources %j", (resources) => {
    expect(isWeeklyState({ week: 1, resources })).toBe(false);
  });
  it.each(invalidNumbers)("rejects invalid milli stock %j for every resource", (value) => {
    for (const key of ["gold", "food", "wood", "iron"]) {
      expect(isWeeklyState({ week: 1, resources: { ...createWeeklyState().resources, [key]: value } })).toBe(false);
    }
  });
  it.each([0, ...invalidNumbers])("rejects invalid week %j", (week) => {
    expect(isWeeklyState({ ...createWeeklyState(), week })).toBe(false);
  });
  it("accepts maximum safe stocks and week", () => {
    expect(isWeeklyState({ week: Number.MAX_SAFE_INTEGER, resources: { gold: Number.MAX_SAFE_INTEGER, food: 0, wood: 0, iron: 0 } })).toBe(true);
  });
  it("rejects inherited, symbol and hidden extra keys", () => {
    expect(isWeeklyState(Object.create(createWeeklyState()))).toBe(false);
    expect(isWeeklyState({ ...createWeeklyState(), [Symbol("extra")]: 0 })).toBe(false);
    expect(isWeeklyState(Object.defineProperty(createWeeklyState(), "hidden", { value: 0 }))).toBe(false);
  });
});
