import { describe, expect, it } from "vitest";
import { createTileTrialState, isTileTrialState, TRIAL_BUILDINGS, type TileTrialState } from "@haven/core";
import { executeTileTrialCommand } from "../tile-trial.js";

function act(state: TileTrialState, command: Record<string, unknown>) {
  const result = executeTileTrialCommand(state, { expectedRevision: state.revision, ...command });
  if (!result.success) throw Error(result.error.message);
  return result;
}
const end = (s: TileTrialState) => act(s, { type: "END_WEEK", expectedWeek: s.world.week });
function setup() {
  let s = createTileTrialState();
  for (const [tileId, typeId, workers] of [
    ["forest-1", "logging", 2], ["ore-1", "mine", 1], ["plain-2", "workshop", 1], ["plain-3", "market", 0],
  ] as const) {
    s = act(s, { type: "BUILD", tileId, typeId }).nextState;
    s = act(s, { type: "SET_WORKERS", tileId, workers }).nextState;
  }
  return s;
}
function rejected(s: TileTrialState, c: Record<string, unknown>) {
  const before = structuredClone(s);
  const r = executeTileTrialCommand(s, { expectedRevision: s.revision, ...c });
  expect(r.success).toBe(false);
  if (!r.success) expect(r.state).toBe(s);
  expect(s).toEqual(before);
}

describe("tile building trial", () => {
  it("starts a separate valid RAM world with the five physical stocks and equipped Food chain", () => {
    const s = createTileTrialState();
    expect(isTileTrialState(s)).toBe(true);
    expect(Object.keys(s.world.settlements.settlement_haven_01.inventory)).toEqual(["gold", "wheat", "food", "wood", "iron"]);
    expect(s.tiles.filter(t => t.building)).toHaveLength(2);
  });
  it("rejects invalid terrain, occupied tiles, unknown types, funds and materials atomically", () => {
    const s = createTileTrialState();
    rejected(s, { type: "BUILD", tileId: "plain-2", typeId: "logging" });
    rejected(s, { type: "BUILD", tileId: "field-1", typeId: "farm" });
    rejected(s, { type: "BUILD", tileId: "forest-1", typeId: "unknown" });
    const poor = structuredClone(s); poor.world.settlements.settlement_haven_01.inventory.gold = 0;
    rejected(poor, { type: "BUILD", tileId: "forest-1", typeId: "logging" });
    const noWood = structuredClone(s); noWood.world.settlements.settlement_haven_01.inventory.wood = 0;
    rejected(noWood, { type: "BUILD", tileId: "plain-2", typeId: "market" });
  });
  it("upgrades capacity and replaces at full cost without refund, preserving placement rules", () => {
    let s = act(createTileTrialState(), { type: "BUILD", tileId: "plain-2", typeId: "market" }).nextState;
    const gold = s.world.settlements.settlement_haven_01.inventory.gold;
    s = act(s, { type: "UPGRADE", tileId: "plain-2" }).nextState;
    expect(s.tiles.find(t => t.id === "plain-2")!.building!.level).toBe(2);
    expect(s.world.settlements.settlement_haven_01.inventory.gold).toBe(gold - 6000);
    rejected(s, { type: "REPLACE", tileId: "plain-2", typeId: "mine" });
    const before = s.world.settlements.settlement_haven_01.inventory.gold;
    s = act(s, { type: "REPLACE", tileId: "plain-2", typeId: "processor" }).nextState;
    expect(s.world.settlements.settlement_haven_01.inventory.gold).toBe(before - 3000);
    expect(s.tiles.find(t => t.id === "plain-2")!.building).toMatchObject({ typeId: "processor", level: 1, workers: 0 });
    rejected(s, { type: "UPGRADE", tileId: "plain-2" });
  });
  it("reserves one shared whole-WF pool and pausing releases workers", () => {
    let s = setup();
    rejected(s, { type: "SET_WORKERS", tileId: "field-1", workers: 5 });
    rejected(s, { type: "SET_WORKERS", tileId: "forest-1", workers: 0.5 });
    s = act(s, { type: "SET_ENABLED", tileId: "forest-1", enabled: false }).nextState;
    expect(s.tiles.find(t => t.id === "forest-1")!.building!.workers).toBe(0);
    rejected(s, { type: "SET_WORKERS", tileId: "forest-1", workers: 1 });
  });
  it("extracts before processing, services Goods exactly once and credits Farm batch upkeep", () => {
    const s = setup(); const before = structuredClone(s);
    const r = end(s); const report = r.report!;
    expect(s).toEqual(before);
    expect(r.nextState.world.week).toBe(2);
    expect(report.goods).toMatchObject({ demandMilli: 2000, servedMilli: 2000, fulfillmentBps: 10000, woodUsed: 2000, ironUsed: 1000, revenueMilli: 2000 });
    expect(report.farmBatchGoldMilli).toBe(2000);
    expect(report.farmExtraUpkeepMilli).toBe(0);
    expect(report.taxMilli).toBe(3000);
    expect(report.after.gold - report.before.gold).toBe(500);
    expect(report.after.food).toBe(4000);
    expect(report.after.wood - report.before.wood).toBe(2000);
    expect(report.after.iron - report.before.iron).toBe(0);
    rejected(r.nextState, { type: "END_WEEK", expectedWeek: 2 });
    const duplicate = executeTileTrialCommand(r.nextState, { type: "END_WEEK", expectedWeek: 1, expectedRevision: s.revision });
    expect(duplicate.success).toBe(false);
    rejected(r.nextState, { type: "BUILD", tileId: "forest-2", typeId: "logging" });
  });
  it("Market upgrades do not change demand or double multiply revenue", () => {
    let s = act(end(setup()).nextState, { type: "NEXT_WEEK" }).nextState;
    s = act(s, { type: "UPGRADE", tileId: "plain-3" }).nextState;
    const r = end(s).report!;
    expect(r.goods.demandMilli).toBe(2000);
    expect(r.goods.revenueMilli).toBe(2000);
  });
  it("zero population uses no Goods materials and mints no tax/revenue or Happiness", () => {
    const s = setup(); s.world.settlements.settlement_haven_01.cohorts = [];
    for (const t of s.tiles) if (t.building) t.building.workers = 0;
    const r = end(s);
    expect(r.report!.goods).toMatchObject({ demandMilli: 0, servedMilli: 0, fulfillmentBps: 10000, woodUsed: 0, ironUsed: 0, revenueMilli: 0 });
    expect(r.report!.taxMilli).toBe(0);
    expect(r.report!.foodConsumedMilli).toBe(0);
    expect(r.nextState.happiness).toBe(s.happiness);
  });
  it("reports unfunded buildings without negative stocks and can recover by pausing", () => {
    let s = setup(); s.world.settlements.settlement_haven_01.inventory.gold = 0;
    const r = end(s); expect(r.report!.unpaidUpkeepMilli).toBeGreaterThan(0);
    expect(r.report!.after.gold).toBeGreaterThanOrEqual(0);
    s = act(r.nextState, { type: "NEXT_WEEK" }).nextState;
    for (const t of s.tiles) if (t.building) s = act(s, { type: "SET_ENABLED", tileId: t.id, enabled: false }).nextState;
    expect(end(s).report!.after.gold).toBeGreaterThanOrEqual(3000);
  });
  it("rolls back overflow and rejects malformed state, stale revisions and getter commands", () => {
    const s = createTileTrialState(); s.world.settlements.settlement_haven_01.inventory.gold = Number.MAX_SAFE_INTEGER;
    rejected(s, { type: "END_WEEK", expectedWeek: 1 });
    rejected(createTileTrialState(), { type: "BUILD", tileId: "forest-1", typeId: "logging", expectedRevision: -1 });
    const invalid = createTileTrialState(); invalid.tiles[0].terrain = "plain";
    rejected(invalid, { type: "END_WEEK", expectedWeek: 1 });
    const clean = createTileTrialState(); const raw = { type: "END_WEEK", expectedRevision: 0, get expectedWeek() { throw Error("getter"); } };
    expect(executeTileTrialCommand(clean, raw).success).toBe(false);
  });
  it("keeps catalog rules immutable across worlds", () => {
    expect(Object.isFrozen(TRIAL_BUILDINGS.logging)).toBe(true);
    expect(Object.isFrozen(TRIAL_BUILDINGS.logging.cost)).toBe(true);
    expect(Object.isFrozen(TRIAL_BUILDINGS.logging.terrain)).toBe(true);
  });
  it("charges no Goods inputs without Market capacity or a complete input batch", () => {
    const s = setup();
    s.tiles.find(t => t.id === "plain-3")!.building!.enabled = false;
    const r = end(s).report!;
    expect(r.goods).toMatchObject({ servedMilli: 0, woodUsed: 0, ironUsed: 0, revenueMilli: 0 });
    s.tiles.find(t => t.id === "plain-3")!.building!.enabled = true;
    s.tiles.find(t => t.id === "ore-1")!.building!.workers = 0;
    s.world.settlements.settlement_haven_01.inventory.iron = 999;
    expect(end(s).report!.goods).toMatchObject({ servedMilli: 0, woodUsed: 0, ironUsed: 0, revenueMilli: 0 });
  });
  it("caps partial service to population demand and never carries Goods stock", () => {
    const s = setup(); s.world.settlements.settlement_haven_01.cohorts[0].count = 150;
    s.tiles.find(t => t.id === "plain-2")!.building!.level = 2;
    s.tiles.find(t => t.id === "plain-2")!.building!.workers = 2;
    s.tiles.find(t => t.id === "plain-3")!.building!.level = 2;
    const r = end(s).report!;
    expect(r.goods).toEqual({ demandMilli: 3000, servedMilli: 3000, fulfillmentBps: 10000, woodUsed: 4000, ironUsed: 2000, revenueMilli: 3000 });
    expect(Object.hasOwn(r.after, "goods")).toBe(false);
  });
  it("preserves approved Food shortage and recovery behavior without Goods service", () => {
    const s = createTileTrialState();
    for (const t of s.tiles) if (t.building) t.building.workers = 0;
    s.world.settlements.settlement_haven_01.inventory.food = 2000;
    expect(end(s).nextState.happiness).toBe(74);
    s.world.settlements.settlement_haven_01.inventory.food = 4000; s.happiness = 79;
    expect(end(s).nextState.happiness).toBe(80);
    s.happiness = 85; expect(end(s).nextState.happiness).toBe(85);
  });
  it("rejects unsafe clock/revision and repeated building commands without charging twice", () => {
    const s = createTileTrialState(); s.revision = Number.MAX_SAFE_INTEGER;
    rejected(s, { type: "BUILD", tileId: "forest-1", typeId: "logging" });
    s.revision = 0; s.world.week = Number.MAX_SAFE_INTEGER;
    rejected(s, { type: "END_WEEK", expectedWeek: s.world.week });
    const fresh = createTileTrialState(); const command = { type: "BUILD", tileId: "forest-1", typeId: "logging", expectedRevision: 0 };
    const next = executeTileTrialCommand(fresh, command); expect(next.success).toBe(true);
    if (next.success) rejected(next.nextState, command);
  });
  it("sustains a 50-week baseline without negative resources, duplicate food or free Goods stock", () => {
    let s = setup();
    for (let w = 1; w <= 50; w++) {
      const r = end(s); expect(r.report!.goods.fulfillmentBps).toBe(10000);
      expect(r.report!.after.food).toBe(4000);
      expect(Object.values(r.report!.after).every(v => Number.isSafeInteger(v) && v >= 0)).toBe(true);
      s = act(r.nextState, { type: "NEXT_WEEK" }).nextState;
    }
    expect(s.world.week).toBe(51);
  });
});
