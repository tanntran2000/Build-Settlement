import { describe, expect, it } from "vitest";
import { createWeeklyState, weeklyWorkforceMilli } from "../weekly.js";
import { isCanonicalGameState } from "../domain/canonical-state.js";

const active = (state = createWeeklyState()) => state.settlements[state.activeSettlementId!];

describe("weekly fixture uses the canonical world", () => {
  it("starts only one root clock, with settlement-owned stocks/cohorts and metadata", () => {
    const state = createWeeklyState();
    expect(Object.keys(state).sort()).toEqual(["activeSettlementId", "settlements", "week", "worldMetadata"]);
    expect(state.week).toBe(1);
    expect(state.worldMetadata).toEqual({ worldSeed: 2026, gameVersion: "0.1.0" });
    expect(active(state)).toMatchObject({ id: state.activeSettlementId, name: "Haven", status: "active", foodProcessorOperational: true, inventory: { gold: 10000, wheat: 0, food: 4000, wood: 0, iron: 0 } });
    expect(Object.keys(active(state).inventory)).toEqual(["gold", "wheat", "food", "wood", "iron"]);
    expect(active(state).cohorts).toHaveLength(1);
    expect(active(state).cohorts[0]).toMatchObject({ socialClass: "common", legalStatus: "citizen", count: 100 });
    expect(weeklyWorkforceMilli(active(state).cohorts)).toBe(10000);
    expect(isCanonicalGameState(state)).toBe(true);
  });
  it("new worlds share no mutable stocks/cohorts/metadata", () => {
    const first = createWeeklyState(); const second = createWeeklyState();
    active(first).inventory.wheat = 3000; active(first).foodProcessorOperational = false; active(first).inventory.food = 0; active(first).cohorts[0].count = 5; first.worldMetadata.worldSeed = 1;
    expect(second).toEqual(createWeeklyState());
  });
  it.each([[50, "common", "citizen", 5000], [5, "common", "citizen", 500], [100, "lower", "citizen", 15000], [200, "common", "citizen", 20000], [100, "elite", "citizen", 0], [100, "elite", "enslaved", 20000], [0, "common", "citizen", 0]] as const)("derives %i %s/%s as %i milli-WF from actual cohorts", (count, socialClass, legalStatus, expected) => {
    const cohort = { ...active().cohorts[0], count, socialClass, legalStatus };
    expect(weeklyWorkforceMilli([cohort])).toBe(expected);
  });
  it("combines real cohorts, handles empty population, and does not mutate frozen inputs", () => {
    const cohort = active().cohorts[0];
    const cohorts = [Object.freeze({ ...cohort, id: "a", count: 15, socialClass: "lower" as const }), Object.freeze({ ...cohort, id: "b", count: 20 })];
    Object.freeze(cohorts);
    expect(weeklyWorkforceMilli(cohorts)).toBe(4250);
    expect(weeklyWorkforceMilli([])).toBe(0);
    expect(cohorts[0].count).toBe(15);
  });
  it.each([[9007199255, 900719925500], [10_000_000_000, 1_000_000_000_000], [90071992547409, 9007199254740900]])("accepts exact safe workforce for count %i", (count, expected) => {
    expect(weeklyWorkforceMilli([{ ...active().cohorts[0], count }])).toBe(expected);
  });
  it("accepts a large Upper cohort when its nonlabor metrics remain safe", () => {
    expect(weeklyWorkforceMilli([{ ...active().cohorts[0], count: 450359962737049, socialClass: "elite" }])).toBe(0);
  });
  it.each([Number.MAX_SAFE_INTEGER, 90071992547410])("rejects true social result overflow for count %i", count => {
    expect(() => weeklyWorkforceMilli([{ ...active().cohorts[0], count }])).toThrow(RangeError);
  });
});
