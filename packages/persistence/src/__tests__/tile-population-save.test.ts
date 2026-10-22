import { it, expect } from "vitest";
import { createTileTrialState } from "@haven/core";
import { serializeTileTrialSave, deserializeTileTrialSave } from "../tile-trial-save.js";
it("pins each mode to its own ruleset without migrating or changing state shape", () => {
  const s = createTileTrialState(), before = structuredClone(s);
  const old = serializeTileTrialSave(s), fresh = serializeTileTrialSave(s, "tile-population-01");
  expect(old.success).toBe(true); expect(fresh.success).toBe(true); if (!old.success || !fresh.success) return;
  expect(JSON.parse(old.text).rulesetId).toBe("tile-trial-01"); expect(JSON.parse(fresh.text).rulesetId).toBe("tile-population-01");
  expect(JSON.parse(fresh.text).schemaVersion).toBe(1); expect(JSON.parse(fresh.text).state).toEqual(s);
  expect(deserializeTileTrialSave(old.text, "tile-population-01")).toMatchObject({ success: false, error: { code: "INCOMPATIBLE_SAVE" } });
  expect(deserializeTileTrialSave(fresh.text)).toMatchObject({ success: false, error: { code: "INCOMPATIBLE_SAVE" } });
  expect(deserializeTileTrialSave(old.text)).toMatchObject({ success: true, state: s });
  expect(deserializeTileTrialSave(fresh.text, "tile-population-01")).toMatchObject({ success: true, state: s }); expect(s).toEqual(before);
});
