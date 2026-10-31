import { describe, it, expect } from "vitest";
import { createSocietyState, IMMIGRATION_TRIAL_DEFAULTS } from "@haven/core";
import { resolveTrialImmigration, type ImmigrationFacts } from "../tile-trial-immigration.js";
function population(count: number) {
  const state = createSocietyState();
  state.society!.classes.free = count;
  for (const id of ['makers', 'luminaries', 'merchants'] as const) state.society!.classes[id].common = 0;
  state.world.settlements.settlement_haven_01.cohorts[0].count = count;
  for (const tile of state.tiles) if (tile.building) tile.building.workers = 0;
  return state;
}
const facts: ImmigrationFacts = { fundedTileIds: ["field-1", "plain-1"], farmBatches: 2, processorBatches: 2, woodProducedMilli: 0, ironProducedMilli: 0, operatingDebitMilli: 2500, foodDemandMilli: 1960, foodConsumedMilli: 1960, unpaidUpkeepMilli: 0 };
describe("immigration arithmetic boundary", () => {
  it("makes the nominal2% low-population exception explicit with integer minimum1", () => {
    const s = population(49);
    const before = structuredClone(s); const r = resolveTrialImmigration(s, facts);
    expect(r).toMatchObject({ populationBefore: 49, target: 90, arrivals: 1, populationAfter: 50, reason: "arrivals" });
    expect(r.arrivals / 49).toBeGreaterThan(0.02); expect(s).toEqual(before); expect(Object.isFrozen(r)).toBe(true);
  });
  it("bounds the last integer arrival to the remaining gap", () => {
    const s = population(89);
    expect(resolveTrialImmigration(s, { ...facts, foodDemandMilli: 3560, foodConsumedMilli: 3560 })).toMatchObject({ target: 90, arrivals: 1, populationAfter: 90 });
  });
  it("uses configurable provisional support and catchup coefficients", () => {
    const s = population(60);
    const input = { ...facts, foodDemandMilli: 2400, foodConsumedMilli: 2400 };
    expect(resolveTrialImmigration(s, input, { ...IMMIGRATION_TRIAL_DEFAULTS, foodSupportBps: 20000 }).arrivals).toBe(0);
    expect(resolveTrialImmigration(s, input, { ...IMMIGRATION_TRIAL_DEFAULTS, weeklyCapBps: 10000, catchupBps: 5000 })).toMatchObject({ target: 90, arrivals: 15 });
  });
  it("caps opportunities globally and excludes disabled or unpaid extraction", () => {
    const s = createSocietyState(); const extra = s.tiles.find(t => t.id === "plain-2")!;
    extra.building = { typeId: "processor", workers: 0, level: 1, enabled: true };
    const r = resolveTrialImmigration(s, { ...facts, fundedTileIds: [...facts.fundedTileIds, extra.id] });
    expect(r.usefulWorkerSlots).toBe(10);
    s.tiles[0].building!.enabled = false; s.tiles[0].building!.workers = 0;
    expect(resolveTrialImmigration(s, facts).usefulWorkerSlots).toBe(0);
  });
  it.each([NaN, -1, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid fact integers atomically: %s", value => {
    const s = createSocietyState(), before = structuredClone(s);
    expect(() => resolveTrialImmigration(s, { ...facts, farmBatches: value })).toThrow(); expect(s).toEqual(before);
  });
  it("rejects unsafe aggregate population and invalid configuration", () => {
    const s = createSocietyState(); const cohort = s.world.settlements.settlement_haven_01.cohorts[0];
    cohort.count = Number.MAX_SAFE_INTEGER; s.world.settlements.settlement_haven_01.cohorts.push({ ...cohort, id: "other", count: 1 });
    expect(() => resolveTrialImmigration(s, facts)).toThrow();
    expect(() => resolveTrialImmigration(createSocietyState(), facts, { ...IMMIGRATION_TRIAL_DEFAULTS, foodSupportBps: 9999 })).toThrow();
  });
});
