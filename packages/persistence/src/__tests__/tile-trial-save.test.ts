import { describe, it, expect } from "vitest";
import { createTileTrialState } from "@haven/core";
import { serializeTileTrialSave, deserializeTileTrialSave, TILE_SAVE_MAX_BYTES } from "../tile-trial-save.js";
const envelope = () => ({ format: "haven.tile-trial.save", schemaVersion: 1, rulesetId: "tile-trial-01", state: createTileTrialState() });

describe("tile planning save codec", () => {
  it("roundtrips a detached complete planning snapshot without mutation", () => {
    const s = createTileTrialState(); const before = structuredClone(s);
    const saved = serializeTileTrialSave(s); expect(saved.success).toBe(true);
    if (!saved.success) return;
    const loaded = deserializeTileTrialSave(saved.text); expect(loaded.success).toBe(true);
    if (!loaded.success) return;
    expect(loaded.state).toEqual(s); expect(loaded.state).not.toBe(s);
    loaded.state.tiles[0].building!.workers = 0;
    expect(s).toEqual(before);
  });
  it.each([
    (p: ReturnType<typeof envelope>) => { p.schemaVersion = 2; },
    (p: ReturnType<typeof envelope>) => { p.rulesetId = "future"; },
    (p: ReturnType<typeof envelope>) => { p.format = "R1"; },
    (p: ReturnType<typeof envelope>) => { p.state.phase = "report"; },
    (p: ReturnType<typeof envelope>) => { p.state.world.settlements.settlement_haven_01.inventory.gold = -1; },
    (p: ReturnType<typeof envelope>) => { p.state.happiness = 101; },
    (p: ReturnType<typeof envelope>) => { p.state.tiles[0].building!.workers = 6; },
    (p: ReturnType<typeof envelope>) => { p.state.tiles[0].building!.typeId = "unknown"; },
    (p: ReturnType<typeof envelope>) => { p.state.tiles[0].terrain = "plain"; },
    (p: ReturnType<typeof envelope>) => { p.state.tiles.pop(); },
    (p: ReturnType<typeof envelope>) => { p.state.tiles[2].id = "other"; },
    (p: ReturnType<typeof envelope>) => { p.state.tiles.reverse(); },
    (p: ReturnType<typeof envelope>) => { Object.assign(p, { extra: true }); },
  ])("rejects incompatible or invalid payload %#", mutate => {
    const p = envelope(); mutate(p); expect(deserializeTileTrialSave(JSON.stringify(p)).success).toBe(false);
  });
  it("rejects malformed/R1/oversized UTF8 before accepting a save", () => {
    for (const text of [null, "{", "{}", JSON.stringify({ currentDate: { day: 1 } })]) expect(deserializeTileTrialSave(text).success).toBe(false);
    const r = deserializeTileTrialSave('é'.repeat(TILE_SAVE_MAX_BYTES / 2 + 1));
    expect(r).toMatchObject({ success: false, error: { code: "SAVE_TOO_LARGE" } });
    const s = createTileTrialState(); s.phase = "report";
    expect(serializeTileTrialSave(s).success).toBe(false);
  });
});
