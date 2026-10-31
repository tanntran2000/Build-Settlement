import { describe,expect,it } from "vitest";
import { createSocietyState } from '../trial/society.js';
import { weeklyWorkforceMilli } from "../weekly.js";

const active = (state = createSocietyState().world) => state.settlements[state.activeSettlementId!];

describe("weekly fixture uses the canonical world", () => {
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
