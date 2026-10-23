import { hasWeeklyKeys, isTileTrialPlanningState, LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type TileTrialRuleset, type TileTrialState } from "@haven/core";

export const TILE_SAVE_MAX_BYTES = 1024 * 1024;
export const TILE_SAVE_RULESET = LEGACY_TILE_RULESET;
const FORMAT = "haven.tile-trial.save";
type SaveFailure = { success: false; error: { code: string; message: string } };
const fail = (code: string, message: string): SaveFailure => ({ success: false, error: { code, message } });
const tooLarge = (text: string) => text.length > TILE_SAVE_MAX_BYTES || new TextEncoder().encode(text).byteLength > TILE_SAVE_MAX_BYTES;

export function serializeTileTrialSave(state: unknown, ruleset: TileTrialRuleset = TILE_SAVE_RULESET): { success: true; text: string } | SaveFailure {
  try {
    if (ruleset !== LEGACY_TILE_RULESET && ruleset !== POPULATION_TILE_RULESET) return fail("INCOMPATIBLE_SAVE", "Unsupported checkpoint ruleset.");
    if (!isTileTrialPlanningState(state)) return fail("INVALID_SAVE_STATE", "Export requires a valid tile Planning state.");
    const text = JSON.stringify({ format: FORMAT, schemaVersion: 1, rulesetId: ruleset, state });
    if (tooLarge(text)) return fail("SAVE_TOO_LARGE", "Checkpoint exceeds the 1 MiB limit.");
    return { success: true, text };
  } catch { return fail("SAVE_FAILED", "Could not export this checkpoint. Your game was preserved."); }
}

export function deserializeTileTrialSave(text: unknown, ruleset: TileTrialRuleset = TILE_SAVE_RULESET): { success: true; state: TileTrialState } | SaveFailure {
  try {
    if (ruleset !== LEGACY_TILE_RULESET && ruleset !== POPULATION_TILE_RULESET) return fail("INCOMPATIBLE_SAVE", "Unsupported checkpoint ruleset.");
    if (typeof text !== "string") return fail("INVALID_SAVE", "Choose a tile checkpoint JSON file.");
    if (tooLarge(text)) return fail("SAVE_TOO_LARGE", "Checkpoint exceeds the 1 MiB limit.");
    const value: unknown = JSON.parse(text);
    if (!hasWeeklyKeys(value, ["format", "schemaVersion", "rulesetId", "state"]) || value.format !== FORMAT || value.schemaVersion !== 1 || value.rulesetId !== ruleset) {
      return fail("INCOMPATIBLE_SAVE", "Unsupported tile checkpoint format, version or ruleset. No migration was performed.");
    }
    if (!isTileTrialPlanningState(value.state)) return fail("INVALID_SAVE_STATE", "Checkpoint must contain a valid tile Planning state and the supported map.");
    return { success: true, state: value.state };
  } catch { return fail("INVALID_SAVE", "Could not read a valid checkpoint JSON. Your game was preserved."); }
}
