import { describe, expect, it } from "vitest";
import { weeklyWorkforceMilli } from "../weekly.js";
import { createSocietyState } from "../trial/society.js";
import { isCanonicalGameState } from "../domain/canonical-state.js";

const active = (state = createSocietyState().world) => state.settlements[state.activeSettlementId!];

describe("weekly fixture uses the canonical world", () => {
  it("starts only one root clock, with settlement-owned stocks/cohorts and metadata", () => {
    const state = createSocietyState().world;
    expect(Object.keys(state).sort()).toEqual(["activeSettlementId", "settlements", "week", "worldMetadata"]);
    expect(state.week).toBe(1);
    expect(state.worldMetadata).toEqual({ worldSeed: 2026, gameVersion: "0.1.0" });
    expect(active(state)).toMatchObject({ id: state.activeSettlementId, name: "Haven", status: "active", foodProcessorOperational: true, inventory: { gold: 45000, wheat: 0, food: 20000, wood: 8000, iron: 4000 } });
    expect(Object.keys(active(state).inventory)).toEqual(["gold", "wheat", "food", "wood", "iron"]);
    expect(active(state).cohorts).toHaveLength(1);
    expect(active(state).cohorts[0]).toMatchObject({ socialClass: "common", legalStatus: "citizen", count: 100 });
    expect(weeklyWorkforceMilli(active(state).cohorts)).toBe(10000);
    expect(isCanonicalGameState(state)).toBe(true);
  });
  it("new worlds share no mutable stocks/cohorts/metadata", () => {
    const first = createSocietyState().world; const second = createSocietyState().world;
    active(first).inventory.wheat = 3000; active(first).foodProcessorOperational = false; active(first).inventory.food = 0; active(first).cohorts[0].count = 5; first.worldMetadata.worldSeed = 1;
    expect(second).toEqual(createSocietyState().world);
  });
});
