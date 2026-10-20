import { describe, it, expect } from "vitest";
import { createTileTrialState, type TileTrialState } from "@haven/core";
import { executeTileTrialCommand } from "../tile-trial.js";
const act = (s: TileTrialState, c: Record<string, unknown>) => {
  const r = executeTileTrialCommand(s, { expectedRevision: s.revision, ...c });
  if (!r.success) throw Error(r.error.message); return r;
};
const play = (s: TileTrialState) => act(act(s, { type: "END_WEEK", expectedWeek: s.world.week }).nextState, { type: "NEXT_WEEK" }).nextState;
const fail = (s: TileTrialState, c: Record<string, unknown>) => {
  const before = structuredClone(s); const r = executeTileTrialCommand(s, { expectedRevision: s.revision, ...c });
  expect(r.success).toBe(false); if (!r.success) expect(r.state).toBe(s); expect(s).toEqual(before);
};
const gameplay = (s: TileTrialState) => ({ world: s.world, tiles: s.tiles, happiness: s.happiness, phase: s.phase });

describe("atomic planning restore", () => {
  it("restores multiweek buildings and resumes identical gameplay with a fresh revision", () => {
    let saved = createTileTrialState();
    for (const [tileId, typeId] of [["forest-1", "logging"], ["plain-2", "market"]]) saved = act(saved, { type: "BUILD", tileId, typeId }).nextState;
    saved = act(saved, { type: "UPGRADE", tileId: "plain-2" }).nextState;
    saved = act(saved, { type: "REPLACE", tileId: "plain-2", typeId: "market" }).nextState;
    saved = act(saved, { type: "SET_ENABLED", tileId: "forest-1", enabled: false }).nextState;
    saved = play(play(saved)); const before = structuredClone(saved);
    const current = play(play(saved)); const r = act(current, { type: "LOAD_TRIAL", snapshot: saved });
    expect(gameplay(r.nextState)).toEqual(gameplay(saved)); expect(r.nextState.revision).toBe(current.revision + 1); expect(r.report).toBeUndefined(); expect(saved).toEqual(before);
    const next = play(r.nextState), expected = play(saved); expect(gameplay(next)).toEqual(gameplay(expected));
    const stale = { type: "BUILD", tileId: "forest-2", typeId: "logging", expectedRevision: current.revision };
    fail(r.nextState, stale);
  });
  it("rebases above saved revision too, then rejects a repeated load", () => {
    const saved = createTileTrialState(); saved.revision = 50;
    const current = createTileTrialState(); const r = act(current, { type: "LOAD_TRIAL", snapshot: saved });
    expect(r.nextState.revision).toBe(51);
    fail(r.nextState, { type: "LOAD_TRIAL", snapshot: saved, expectedRevision: current.revision });
  });
  it("rejects report states, malformed snapshots, changed layouts and revision overflow atomically", () => {
    const s = createTileTrialState(), report = act(s, { type: "END_WEEK", expectedWeek: 1 }).nextState;
    fail(report, { type: "LOAD_TRIAL", snapshot: s }); fail(s, { type: "LOAD_TRIAL", snapshot: report });
    fail(s, { type: "LOAD_TRIAL", snapshot: null });
    const bad = createTileTrialState(); bad.tiles = []; fail(s, { type: "LOAD_TRIAL", snapshot: bad });
    const huge = createTileTrialState(); huge.revision = Number.MAX_SAFE_INTEGER;
    fail(s, { type: "LOAD_TRIAL", snapshot: huge }); fail(huge, { type: "LOAD_TRIAL", snapshot: s });
  });
});
