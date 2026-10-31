import { describe, expect, it } from "vitest";
import { createSocietyState, isTileTrialState, TRIAL_BUILDINGS, type TileTrialState } from "@haven/core";
import { executeTileTrialCommand } from "../tile-trial.js";

function act(state: TileTrialState, command: Record<string, unknown>) {
  const result = executeTileTrialCommand(state, { expectedRevision: state.revision, ...command });
  if (!result.success) throw Error(result.error.message);
  return result;
}
function rejected(s: TileTrialState, c: Record<string, unknown>) {
  const before = structuredClone(s);
  const r = executeTileTrialCommand(s, { expectedRevision: s.revision, ...c });
  expect(r.success).toBe(false);
  if (!r.success) expect(r.state).toBe(s);
  expect(s).toEqual(before);
}

describe("tile building trial", () => {
  it("rejects invalid terrain, occupied tiles, unknown types, funds and materials atomically", () => {
    const s = createSocietyState();
    rejected(s, { type: "BUILD", tileId: "plain-2", typeId: "logging" });
    rejected(s, { type: "BUILD", tileId: "field-1", typeId: "farm" });
    rejected(s, { type: "BUILD", tileId: "forest-1", typeId: "unknown" });
    const poor = structuredClone(s); poor.world.settlements.settlement_haven_01.inventory.gold = 0;
    rejected(poor, { type: "BUILD", tileId: "forest-1", typeId: "logging" });
    const noWood = structuredClone(s); noWood.world.settlements.settlement_haven_01.inventory.wood = 0;
    rejected(noWood, { type: "BUILD", tileId: "plain-2", typeId: "market" });
  });
  it("rolls back overflow and rejects malformed state, stale revisions and getter commands", () => {
    const s = createSocietyState(); s.world.settlements.settlement_haven_01.inventory.gold = Number.MAX_SAFE_INTEGER;
    rejected(s, { type: "END_WEEK", expectedWeek: 1 });
    rejected(createSocietyState(), { type: "BUILD", tileId: "forest-1", typeId: "logging", expectedRevision: -1 });
    const invalid = createSocietyState(); invalid.tiles[0].terrain = "plain";
    rejected(invalid, { type: "END_WEEK", expectedWeek: 1 });
    const clean = createSocietyState(); const raw = { type: "END_WEEK", expectedRevision: 0, get expectedWeek() { throw Error("getter"); } };
    expect(executeTileTrialCommand(clean, raw).success).toBe(false);
  });
  it("keeps catalog rules immutable across worlds", () => {
    expect(Object.isFrozen(TRIAL_BUILDINGS.logging)).toBe(true);
    expect(Object.isFrozen(TRIAL_BUILDINGS.logging.cost)).toBe(true);
    expect(Object.isFrozen(TRIAL_BUILDINGS.logging.terrain)).toBe(true);
  });
  it("rejects unsafe clock/revision and repeated building commands without charging twice", () => {
    const s = createSocietyState(); s.revision = Number.MAX_SAFE_INTEGER;
    rejected(s, { type: "BUILD", tileId: "forest-1", typeId: "logging" });
    s.revision = 0; s.world.week = Number.MAX_SAFE_INTEGER;
    rejected(s, { type: "END_WEEK", expectedWeek: s.world.week });
    const fresh = createSocietyState(); const command = { type: "BUILD", tileId: "forest-1", typeId: "logging", expectedRevision: 0 };
    const next = executeTileTrialCommand(fresh, command); expect(next.success).toBe(true);
    if (next.success) rejected(next.nextState, command);
  });
});
