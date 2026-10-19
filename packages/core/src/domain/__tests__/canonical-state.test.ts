import { describe, expect, expectTypeOf, it } from "vitest";
import { isCanonicalGameState, type CanonicalGameState, type CanonicalSettlement } from "../canonical-state.js";
import type { GameState } from "../gamestate.js";
import type { PopulationCohort } from "../population.js";

function world(): CanonicalGameState {
  return { week: 1, worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" }, activeSettlementId: "haven", settlements: {
    haven: { id: "haven", name: "Haven", status: "active", inventory: { gold: 10000, food: 4000, wood: 0, iron: 0 }, cohorts: [{
      id: "middle", occupation: "worker", socialClass: "common", legalStatus: "citizen", count: 100,
      averageHealth: 80, morale: 80, productivity: 80, resentment: 0, loyalty: 80, livingStandard: "decent",
    }] },
  } };
}
const invalidNumbers = [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1000", null];

describe("canonical weekly world boundary", () => {
  it("accepts a canonical world without introducing an R1 date or root stocks", () => {
    expect(isCanonicalGameState(world())).toBe(true);
    expectTypeOf<CanonicalGameState>().not.toExtend<GameState>();
    expectTypeOf<CanonicalSettlement["cohorts"]>().toEqualTypeOf<PopulationCohort[]>();
  });
  it.each([null, [], 1, "world", {}, { week: 1, resources: { gold: 10000, food: 4000, wood: 0, iron: 0 } }])("rejects noncanonical root %j", value => {
    expect(isCanonicalGameState(value)).toBe(false);
  });
  it.each(["day", "currentDate", "resources", "extra"])("rejects parallel root field %s", key => {
    expect(isCanonicalGameState({ ...world(), [key]: 1 })).toBe(false);
  });
  it.each([0, ...invalidNumbers])("rejects invalid week %j", week => {
    expect(isCanonicalGameState({ ...world(), week })).toBe(false);
  });
  it.each([null, [], {}, { worldSeed: 1 }, { worldSeed: 1, gameVersion: "" }, { worldSeed: NaN, gameVersion: "a" }, { worldSeed: 1.5, gameVersion: "a" }, { worldSeed: Number.MAX_SAFE_INTEGER + 1, gameVersion: "a" }, { worldSeed: 1, gameVersion: "a", extra: 0 }])("rejects malformed metadata %j", worldMetadata => {
    expect(isCanonicalGameState({ ...world(), worldMetadata })).toBe(false);
  });
  it.each([null, [], "settlements", { haven: null }])("rejects malformed settlements %j", settlements => {
    expect(isCanonicalGameState({ ...world(), settlements })).toBe(false);
  });
  it.each(["id", "name", "status", "inventory", "cohorts"])("requires settlement field %s", key => {
    const state = world(); delete (state.settlements.haven as unknown as Record<string, unknown>)[key];
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it.each([{ id: "wrong" }, { name: " " }, { status: "future" }, { extra: 0 }, { week: 1 }, { resources: {} }])("rejects settlement defect %j", defect => {
    const state = world(); Object.assign(state.settlements.haven, defect);
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it.each([null, [], {}, { gold: 0, food: 0, wood: 0 }, { gold: 0, food: 0, wood: 0, iron: 0, Water: 0 }, { gold: 0, food: 0, wood: 0, iron: 0, Goods: 0 }])("rejects malformed inventory %j", inventory => {
    const state = world(); Object.assign(state.settlements.haven, { inventory });
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it.each(invalidNumbers)("rejects invalid stock %j for all four resources", value => {
    for (const key of ["gold", "food", "wood", "iron"]) {
      const state = world(); Object.assign(state.settlements.haven.inventory, { [key]: value });
      expect(isCanonicalGameState(state)).toBe(false);
    }
  });
  it.each([null, [], 1, "", "missing", "toString"])("rejects invalid/dangling active pointer %j", activeSettlementId => {
    expect(isCanonicalGameState({ ...world(), activeSettlementId })).toBe(false);
  });
  it("accepts zero active only when the pointer and statuses agree", () => {
    expect(isCanonicalGameState({ ...world(), settlements: {}, activeSettlementId: null })).toBe(true);
    const state = world(); state.activeSettlementId = null;
    expect(isCanonicalGameState(state)).toBe(false);
    state.settlements.haven.status = "legacy";
    expect(isCanonicalGameState(state)).toBe(true);
    state.activeSettlementId = "haven";
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it("rejects multiple active settlements and key/id mismatch", () => {
    const state = world(); state.settlements.other = { ...structuredClone(state.settlements.haven), id: "other", cohorts: [] };
    expect(isCanonicalGameState(state)).toBe(false);
    state.settlements.other.status = "legacy";
    expect(isCanonicalGameState(state)).toBe(true);
    state.settlements.other.id = "mismatch";
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it.each([null, {}, "cohorts", [null], new Array(1)])("rejects malformed cohort array %j", cohorts => {
    const state = world(); Object.assign(state.settlements.haven, { cohorts });
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it.each([{ id: " " }, { count: -1 }, { count: 0.1 }, { count: Number.MAX_SAFE_INTEGER + 1 }, { count: "100" }, { occupation: "future" }, { legalStatus: "future" }, { socialClass: "future" }, { livingStandard: "future" }, { averageHealth: NaN }, { morale: Infinity }, { productivity: 101 }, { resentment: -1 }, { loyalty: "80" }, { extra: 1 }])("rejects malformed cohort %j", defect => {
    const state = world(); Object.assign(state.settlements.haven.cohorts[0], defect);
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it.each(["id", "occupation", "socialClass", "legalStatus", "count", "averageHealth", "morale", "productivity", "resentment", "loyalty", "livingStandard"])("requires cohort field %s", key => {
    const state = world(); delete (state.settlements.haven.cohorts[0] as unknown as Record<string, unknown>)[key];
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it("allows the same cohort ID in a different settlement", () => {
    const state = world(); state.settlements.other = { ...structuredClone(state.settlements.haven), id: "other", status: "legacy" };
    expect(isCanonicalGameState(state)).toBe(true);
  });
  it("rejects duplicate cohort identities", () => {
    const state = world(); state.settlements.haven.cohorts.push({ ...state.settlements.haven.cohorts[0] });
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it("rejects inherited, symbolic, hidden and accessor data without invoking getters", () => {
    expect(isCanonicalGameState(Object.create(world()))).toBe(false);
    expect(isCanonicalGameState({ ...world(), [Symbol("extra")]: 1 })).toBe(false);
    const state = world(); let reads = 0;
    Object.defineProperty(state.settlements.haven.inventory, "gold", { get() { reads++; throw new Error("getter"); }, enumerable: true });
    expect(isCanonicalGameState(state)).toBe(false); expect(reads).toBe(0);
    expect(isCanonicalGameState(Object.defineProperty(world(), "hidden", { value: 0 }))).toBe(false);
  });
  it("rejects invalid inactive settlement inventory and cohort data", () => {
    const state = world(); state.settlements.other = { ...structuredClone(state.settlements.haven), id: "other", status: "legacy" };
    state.settlements.other.inventory.food = -1;
    expect(isCanonicalGameState(state)).toBe(false);
    state.settlements.other.inventory.food = 0; state.settlements.other.cohorts[0].count = NaN;
    expect(isCanonicalGameState(state)).toBe(false);
  });
  it("rejects array extensions and indexed getters without reading them", () => {
    const state = world(); Object.assign(state.settlements.haven.cohorts, { extra: () => 1 });
    expect(isCanonicalGameState(state)).toBe(false);
    const next = world(); let reads = 0;
    Object.defineProperty(next.settlements.haven.cohorts, "0", { get() { reads++; return world().settlements.haven.cohorts[0]; }, enumerable: true });
    expect(isCanonicalGameState(next)).toBe(false); expect(reads).toBe(0);
  });
  it("accepts zero cohorts, empty idle world, safe stock/week boundaries and frozen input", () => {
    const state = world(); state.week = Number.MAX_SAFE_INTEGER;
    state.settlements.haven.inventory.gold = Number.MAX_SAFE_INTEGER; state.settlements.haven.cohorts = [];
    const before = structuredClone(state); Object.freeze(state.settlements.haven.inventory); Object.freeze(state);
    expect(isCanonicalGameState(state)).toBe(true); expect(state).toEqual(before);
  });
});
