import { hasWeeklyKeys, isTileTrialState, isTileTrialPlanningState, trialBuilding, type TileTrialState, type TileTrialResult } from "@haven/core";
import { runTileTrialWeek, trialSafe } from "./tile-trial-week.js";

export function executeTileTrialCommand(state: unknown, raw: unknown): TileTrialResult {
  const fail = (code: string, message: string): TileTrialResult => ({ success: false, state, error: { code, message } });
  try {
    if (!isTileTrialState(state)) return fail("INVALID_STATE", "Trial state is invalid; nothing was changed.");
    if (!raw || typeof raw !== "object" || !hasWeeklyKeys(raw, Object.keys(raw))) return fail("INVALID_COMMAND", "Command must contain plain data fields.");
    const c = { ...raw } as Record<string, unknown>;
    if (c.expectedRevision !== state.revision) return fail("STALE_COMMAND", "The plan changed. Refresh the action before retrying.");
    if (state.phase === "report" && c.type !== "NEXT_WEEK") return fail("FORBIDDEN", "Read the report, then choose Plan next week.");
    if (state.phase === "planning" && c.type === "NEXT_WEEK") return fail("FORBIDDEN", "Finish this week before planning the next one.");
    const keys: Record<string, string[]> = {
      END_WEEK: ["expectedWeek"], NEXT_WEEK: [], LOAD_TRIAL: ["snapshot"], BUILD: ["tileId", "typeId"], REPLACE: ["tileId", "typeId"],
      UPGRADE: ["tileId"], SET_WORKERS: ["tileId", "workers"], SET_ENABLED: ["tileId", "enabled"],
    };
    if (typeof c.type !== "string" || !Object.hasOwn(keys, c.type) || !hasWeeklyKeys(c, ["type", "expectedRevision", ...keys[c.type]])) return fail("INVALID_COMMAND", "Unknown command or fields.");
    let next = structuredClone(state) as TileTrialState;
    let report;
    if (c.type === "LOAD_TRIAL") {
      if (!isTileTrialPlanningState(c.snapshot)) return fail("INVALID_SAVE_STATE", "Checkpoint must contain a valid tile Planning state and the supported map.");
      next = structuredClone(c.snapshot);
      next.revision = Math.max(state.revision, next.revision);
    } else if (c.type === "END_WEEK") {
      if (c.expectedWeek !== state.world.week) return fail("WEEK_MISMATCH", "The week changed; this command was not applied.");
      report = runTileTrialWeek(next);
    } else if (c.type === "NEXT_WEEK") next.phase = "planning";
    else {
      const tile = next.tiles.find(t => t.id === c.tileId);
      if (!tile) return fail("INVALID_TILE", "Select a valid tile.");
      if (["BUILD", "REPLACE", "UPGRADE"].includes(c.type)) {
        const typeId = c.type === "UPGRADE" ? tile.building?.typeId : c.typeId;
        const d = typeof typeId === "string" ? trialBuilding(typeId) : undefined;
        if (!d || typeof typeId !== "string") return fail("INVALID_BUILDING", "Select a known building type.");
        if (!d.terrain.includes(tile.terrain)) return fail("INVALID_PLACEMENT", `${d.name} requires ${d.terrain.join(" or ")} terrain.`);
        if (c.type === "BUILD" && tile.building) return fail("OCCUPIED", "This tile is occupied; use Replace or Upgrade.");
        if (c.type !== "BUILD" && !tile.building) return fail("EMPTY_TILE", "Build a building on this tile first.");
        const level = c.type === "UPGRADE" ? tile.building!.level + 1 : 1;
        if (level > d.maxLevel) return fail("MAX_LEVEL", "This building is at its trial maximum level.");
        const inventory = next.world.settlements[next.world.activeSettlementId!].inventory;
        const costs = { gold: trialSafe(d.cost.gold * level), wood: trialSafe(d.cost.wood * level), iron: trialSafe(d.cost.iron * level) };
        for (const key of ["gold", "wood", "iron"] as const) if (inventory[key] < costs[key]) return fail("INSUFFICIENT_RESOURCES", `Not enough ${key} for this action.`);
        for (const key of ["gold", "wood", "iron"] as const) inventory[key] -= costs[key];
        tile.building = { typeId, level, workers: c.type === "UPGRADE" ? tile.building!.workers : 0, enabled: c.type === "UPGRADE" ? tile.building!.enabled : true };
      } else {
        if (!tile.building) return fail("EMPTY_TILE", "Build a building on this tile first.");
        if (c.type === "SET_WORKERS") {
          if (!tile.building.enabled || !Number.isSafeInteger(c.workers) || (c.workers as number) < 0) return fail("INVALID_WORKFORCE", "Use whole nonnegative workers on an active building.");
          tile.building.workers = c.workers as number;
        } else {
          if (typeof c.enabled !== "boolean") return fail("INVALID_COMMAND", "Active must be true or false.");
          tile.building.enabled = c.enabled;
          if (!c.enabled) tile.building.workers = 0;
        }
      }
    }
    next.revision = trialSafe(next.revision + 1);
    if (!isTileTrialState(next)) return fail("INVALID_PLAN", "The action exceeds building capacity or the shared workforce pool.");
    return { success: true, nextState: next, ...(report ? { report } : {}) };
  } catch { return fail("EXECUTION_ERROR", "The action failed validation or safe arithmetic; the original state was preserved."); }
}
