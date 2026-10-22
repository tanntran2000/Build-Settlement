import { describe, it, expect } from "vitest";
import { createTileTrialState, type TileTrialState } from "@haven/core";
import { executeTileTrialCommand } from "../tile-trial.js";
import { serializeTileTrialSave, deserializeTileTrialSave } from "@haven/persistence";

const POP = "tile-population-01";
const LEGACY = "tile-trial-01";
function act(s: TileTrialState, c: Record<string, unknown>, policy: typeof POP | typeof LEGACY = POP) {
  const r = executeTileTrialCommand(s, { expectedRevision: s.revision, ...c }, policy);
  if (!r.success) throw Error(r.error.message);
  return r;
}
const count = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].cohorts.reduce((n, c) => n + c.count, 0);
const week = (s: TileTrialState, policy: typeof POP | typeof LEGACY = POP) => act(s, { type: "END_WEEK", expectedWeek: s.world.week }, policy);
const plan = (s: TileTrialState, policy: typeof POP | typeof LEGACY = POP) => act(s, { type: "NEXT_WEEK" }, policy).nextState;
const gameplay = (s: TileTrialState) => ({ ...s, revision: 0 });
function expanded() {
  let s = createTileTrialState();
  for (const [tileId, typeId] of [["forest-1", "logging"], ["ore-1", "mine"], ["plain-2", "workshop"], ["plain-3", "market"]]) s = act(s, { type: "BUILD", tileId, typeId }).nextState;
  for (const [tileId, workers] of [["field-1", 3], ["plain-1", 3], ["forest-1", 1], ["ore-1", 1], ["plain-2", 1]]) s = act(s, { type: "SET_WORKERS", tileId, workers }).nextState;
  return s;
}
describe("population trial transaction", () => {
  it("settles the old population then admits arrivals without changing assignments", () => {
    const s = expanded(), before = structuredClone(s), r = week(s);
    expect(count(r.nextState)).toBe(102);
    expect(r.report?.immigration).toMatchObject({ populationBefore: 100, arrivals: 2, populationAfter: 102, target: 136, usefulWorkerSlots: 15 });
    expect(r.report?.taxMilli).toBe(3000); expect(r.report?.foodDemandMilli).toBe(4000);
    expect(r.report?.goods.demandMilli).toBe(2000); expect(r.nextState.tiles).toEqual(s.tiles); expect(s).toEqual(before);
    const second = week(plan(r.nextState));
    expect(second.report?.taxMilli).toBe(3060); expect(second.report?.foodDemandMilli).toBe(4080);
    expect(second.report?.goods.demandMilli).toBe(2040); expect(count(second.nextState)).toBe(104);
  });
  it("keeps legacy default and explicit policy identical with no population report", () => {
    const s = expanded();
    const raw = { type: "END_WEEK", expectedWeek: s.world.week, expectedRevision: s.revision };
    const a = executeTileTrialCommand(s, raw), b = executeTileTrialCommand(s, raw, LEGACY);
    expect(a).toEqual(b); expect(a.success).toBe(true);
    if (!a.success) return;
    expect(count(a.nextState)).toBe(100); expect(a.report).not.toHaveProperty("immigration");
    const saved = serializeTileTrialSave(plan(a.nextState, LEGACY));
    expect(saved.success).toBe(true); if (!saved.success) return;
    const load = deserializeTileTrialSave(saved.text); expect(load.success).toBe(true);
    if (load.success) expect(week(load.state, LEGACY)).toEqual(week(plan(a.nextState, LEGACY), LEGACY));
  });
  it("starter and stock liquidation do not create immigration", () => {
    for (const food of [4000, 1000000]) {
      const s = createTileTrialState(); s.world.settlements.settlement_haven_01.inventory.food = food;
      expect(count(week(s).nextState)).toBe(100);
    }
    const s = expanded(); s.tiles.find(t => t.id === "field-1")!.building!.workers = 0;
    s.world.settlements.settlement_haven_01.inventory.wheat = 1000000;
    expect(count(week(s).nextState)).toBe(100);
  });
  it("duplicate idle Processor cannot reuse the same Wheat capacity", () => {
    let s = createTileTrialState();
    for (const tileId of ["field-1", "plain-1"]) s = act(s, { type: "SET_WORKERS", tileId, workers: 3 }).nextState;
    s = act(s, { type: "BUILD", tileId: "plain-2", typeId: "processor" }).nextState;
    const r = week(s); expect(count(r.nextState)).toBe(100); expect(r.report?.immigration?.usefulWorkerSlots).toBe(10);
  });
  it("duplicate idle Workshop cannot reuse Market service capacity", () => {
    const base = expanded(); const extra = act(base, { type: "BUILD", tileId: "plain-4", typeId: "workshop" }).nextState;
    const a = week(base), b = week(extra);
    expect(b.report?.immigration?.usefulWorkerSlots).toBe(15); expect(b.report?.immigration?.target).toBe(a.report?.immigration?.target);
    expect(b.report?.goods).toEqual(a.report?.goods); expect(count(b.nextState)).toBe(102);
  });
  it("never revives zero city, fills unsupported cohorts or adds departures", () => {
    const zero = createTileTrialState(); zero.world.settlements.settlement_haven_01.cohorts[0].count = 0;
    for (const t of zero.tiles) if (t.building) t.building.workers = 0;
    expect(count(week(zero).nextState)).toBe(0);
    const other = expanded(); other.world.settlements.settlement_haven_01.cohorts[0].id = "different";
    expect(count(week(other).nextState)).toBe(100);
    const crowded = expanded(); crowded.world.settlements.settlement_haven_01.cohorts[0].count = 200;
    expect(count(week(crowded).nextState)).toBe(200);
  });
  it("does not admit during shortage, unpaid upkeep or a liquidity failure", () => {
    const food = expanded(); food.world.settlements.settlement_haven_01.inventory.food = 0;
    food.tiles.find(t => t.id === "plain-1")!.building!.workers = 1;
    expect(count(week(food).nextState)).toBe(100);
    const poor = expanded(); poor.world.settlements.settlement_haven_01.inventory.gold = 0;
    expect(count(week(poor).nextState)).toBe(100);
    const tight = expanded(); tight.world.settlements.settlement_haven_01.inventory.gold = 2500;
    const r = week(tight); expect(r.report?.unpaidUpkeepMilli).toBe(0); expect(count(r.nextState)).toBe(100);
  });
  it("rejects stale/repeated commands and overflow atomically", () => {
    const s = expanded(), command = { type: "END_WEEK", expectedWeek: s.world.week, expectedRevision: s.revision };
    const r = executeTileTrialCommand(s, command, POP); expect(r.success).toBe(true); if (!r.success) return;
    const after = structuredClone(r.nextState); const bad = executeTileTrialCommand(r.nextState, command, POP);
    expect(bad).toMatchObject({ success: false, state: after }); if (!bad.success) expect(bad.state).toBe(r.nextState);
    const huge = expanded(); huge.world.settlements.settlement_haven_01.inventory.gold = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(huge); const overflow = executeTileTrialCommand(huge, { ...command, expectedRevision: huge.revision }, POP);
    expect(overflow.success).toBe(false); expect(huge).toEqual(before); if (!overflow.success) expect(overflow.state).toBe(huge);
  });
  it("reaches136 after27 arrivals and remains solvent through60 weeks with checkpoint parity", () => {
    let s = expanded(), resumed = structuredClone(s); let minGold = Infinity;
    const assignments = s.tiles.map(t => t.building?.workers ?? 0);
    for (let i = 0; i < 60; i++) {
      const a = week(s), b = week(resumed); expect(a.report).toEqual(b.report);
      s = plan(a.nextState); resumed = plan(b.nextState);
      const saved = serializeTileTrialSave(resumed, POP); expect(saved.success).toBe(true); if (!saved.success) return;
      const decoded = deserializeTileTrialSave(saved.text, POP); expect(decoded.success).toBe(true); if (!decoded.success) return;
      resumed = act(resumed, { type: "LOAD_TRIAL", snapshot: decoded.state }).nextState;
      expect(gameplay(resumed)).toEqual(gameplay(s)); expect(s.tiles.map(t => t.building?.workers ?? 0)).toEqual(assignments);
      minGold = Math.min(minGold, s.world.settlements.settlement_haven_01.inventory.gold);
      if (i === 26) expect(count(s)).toBe(136);
    }
    expect(count(s)).toBe(136); expect(minGold).toBe(15660);
  });
  it("stops and resumes immigration over45 weeks when renewable support changes", () => {
    let s = expanded(); let pausedPopulation = 0;
    for (let i = 0; i < 45; i++) {
      if (i === 10) { pausedPopulation = count(s); s = act(s, { type: "SET_ENABLED", tileId: "forest-1", enabled: false }).nextState; }
      if (i === 15) {
        s = act(s, { type: "SET_ENABLED", tileId: "forest-1", enabled: true }).nextState;
        expect(s.tiles.find(t => t.id === "forest-1")!.building!.workers).toBe(0);
        s = act(s, { type: "SET_WORKERS", tileId: "forest-1", workers: 1 }).nextState;
      }
      const before = count(s), r = week(s); s = plan(r.nextState);
      expect(count(s)).toBeGreaterThanOrEqual(before);
      if (i >= 10 && i < 15) { expect(count(s)).toBe(pausedPopulation); expect(r.report?.immigration?.arrivals).toBe(0); }
      for (const stock of Object.values(s.world.settlements.settlement_haven_01.inventory)) expect(Number.isSafeInteger(stock) && stock >= 0).toBe(true);
    }
    expect(count(s)).toBe(136);
  });
  it("does not mistake30 weeks of stored Wheat liquidation for renewable Food", () => {
    let s = expanded(); Object.assign(s.world.settlements.settlement_haven_01.inventory, { gold: 100000, wheat: 1000000, food: 100000 });
    s = act(s, { type: "SET_ENABLED", tileId: "field-1", enabled: false }).nextState;
    for (let i = 0; i < 30; i++) {
      const r = week(s); expect(r.report?.foodConsumedMilli).toBe(4000); expect(r.report?.immigration?.renewableFoodMilli).toBe(0);
      s = plan(r.nextState); expect(count(s)).toBe(100);
    }
  });
  it("rejects an unknown mode policy without changing gameplay", () => {
    const s = expanded(), before = structuredClone(s);
    const r = executeTileTrialCommand(s, { type: "END_WEEK", expectedWeek: s.world.week, expectedRevision: s.revision }, "unknown" as never);
    expect(r).toMatchObject({ success: false, error: { code: "INVALID_RULESET" } }); expect(s).toEqual(before);
    if (!r.success) expect(r.state).toBe(s);
  });
});
