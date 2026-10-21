import { describe, expect, it } from "vitest";
import { resolveTileTrialNeeds } from "../tile-trial-needs.js";

describe("internal tile Food and Happiness resolution", () => {
  it.each([
    { name: "full Food consumes only demand and recovers below80", population: 100, food: 5000, happiness: 70, goodsBps: 0, demand: 4000, consumed: 4000, remaining: 1000, after: 74 },
    { name: "full Food recovery stops at80 before Goods adds2", population: 100, food: 4000, happiness: 79, goodsBps: 10000, demand: 4000, consumed: 4000, remaining: 0, after: 82 },
    { name: "full Food recovers79 to80 without Goods", population: 100, food: 4000, happiness: 79, goodsBps: 0, demand: 4000, consumed: 4000, remaining: 0, after: 80 },
    { name: "full Food does not lower Happiness already above80", population: 100, food: 4000, happiness: 83, goodsBps: 0, demand: 4000, consumed: 4000, remaining: 0, after: 83 },
    { name: "Goods still raises an above80 score", population: 100, food: 4000, happiness: 83, goodsBps: 5000, demand: 4000, consumed: 4000, remaining: 0, after: 84 },
    { name: "partial Food subtracts proportional shortage before Goods", population: 100, food: 2000, happiness: 79, goodsBps: 5000, demand: 4000, consumed: 2000, remaining: 0, after: 74 },
    { name: "no Food subtracts12", population: 100, food: 0, happiness: 80, goodsBps: 0, demand: 4000, consumed: 0, remaining: 0, after: 68 },
    { name: "shortage at zero stays zero even with full Goods; no early clamp", population: 100, food: 0, happiness: 0, goodsBps: 10000, demand: 4000, consumed: 0, remaining: 0, after: 0 },
    { name: "shortage near zero clamps only after Goods", population: 100, food: 0, happiness: 11, goodsBps: 10000, demand: 4000, consumed: 0, remaining: 0, after: 1 },
    { name: "full Food plus Goods clamps upper bound100", population: 100, food: 4000, happiness: 99, goodsBps: 10000, demand: 4000, consumed: 4000, remaining: 0, after: 100 },
    { name: "existing100 is preserved at the upper bound", population: 100, food: 4000, happiness: 100, goodsBps: 10000, demand: 4000, consumed: 4000, remaining: 0, after: 100 },
    { name: "fractional deficit and Goods round to centipoints at the end", population: 3, food: 80, happiness: 50.123, goodsBps: 3333, demand: 120, consumed: 80, remaining: 0, after: 46.79 },
    { name: "Food intermediate is not rounded before Goods", population: 100, food: 4000, happiness: 0.004, goodsBps: 20, demand: 4000, consumed: 4000, remaining: 0, after: 4.01 },
    { name: "zero population consumes nothing and neither adds Goods nor rounds Happiness", population: 0, food: 1234, happiness: 79.123456, goodsBps: 10000, demand: 0, consumed: 0, remaining: 1234, after: 79.123456 },
  ])("$name", ({ population, food, happiness, goodsBps, demand, consumed, remaining, after }) => {
    expect(resolveTileTrialNeeds(population, food, happiness, goodsBps)).toEqual({
      foodDemandMilli: demand,
      foodConsumedMilli: consumed,
      foodRemainingMilli: remaining,
      happinessAfter: after,
    });
  });

  it("retains milli-unit precision at the last safe population-demand boundary", () => {
    expect(resolveTileTrialNeeds(225179981368524, Number.MAX_SAFE_INTEGER, 79, 10000)).toEqual({
      foodDemandMilli: 9007199254740960,
      foodConsumedMilli: 9007199254740960,
      foodRemainingMilli: 31,
      happinessAfter: 82,
    });
    expect(resolveTileTrialNeeds(1, Number.MAX_SAFE_INTEGER, 83, 0).foodRemainingMilli).toBe(9007199254740951);
  });

  it("rejects overflowing Food demand using the existing safe-integer arithmetic boundary", () => {
    expect(() => resolveTileTrialNeeds(225179981368525, Number.MAX_SAFE_INTEGER, 79, 10000)).toThrow("Trial arithmetic overflow.");
  });

  it("is deterministic and leaves caller-owned values unchanged", () => {
    const input = Object.freeze({ population: 100, food: 2500, happiness: 60, goodsBps: 2500 });
    const first = resolveTileTrialNeeds(input.population, input.food, input.happiness, input.goodsBps);
    const second = resolveTileTrialNeeds(input.population, input.food, input.happiness, input.goodsBps);
    expect(first).toEqual({ foodDemandMilli: 4000, foodConsumedMilli: 2500, foodRemainingMilli: 0, happinessAfter: 56 });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(input).toEqual({ population: 100, food: 2500, happiness: 60, goodsBps: 2500 });
  });
});
