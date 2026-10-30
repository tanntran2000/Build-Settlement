import { cityEconomyRuleset, SOCIETY_RULESET } from '@haven/core';
import { createTileTrialState, hasWeeklyKeys, isNpcWorldSessionState, isTileTrialState, isWorldNpcList, isWorldSessionState, managerSlotTileIds, WORLD_SESSION_CITY_RULESET, type NpcWorldSessionState, type TileTrialReport, type TileTrialState } from "@haven/core";
import { executeTileTrialCommand } from "./tile-trial.js";
import { trialSafe } from "./tile-trial-week.js";

export type WorldNpcErrorCode = "INVALID_STATE" | "INVALID_COMMAND" | "STALE_COMMAND" | "FORBIDDEN" | "UNKNOWN_NPC" | "LOCKED_POST" | "POST_OCCUPIED" | "ALREADY_ASSIGNED" | "UNSUPPORTED_RULESET";
export type WorldNpcResult = { success: true; next: NpcWorldSessionState } | { success: false; error: { code: WorldNpcErrorCode; message: string } };
export type WorldNpcCityResult = { success: true; next: NpcWorldSessionState; report?: Readonly<TileTrialReport> } | { success: false; error: { code: string; message: string } };

// Assignment reads only ids and posts, never stats or traits.
export function executeWorldNpcCommand(session: unknown, raw: unknown): WorldNpcResult {
  const fail = (code: WorldNpcErrorCode, message: string): WorldNpcResult => ({ success: false, error: { code, message } });
  try {
    if (!hasWeeklyKeys(session, ["city", "outside", "npcs"]) || !isTileTrialState(session.city)) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    if (cityEconomyRuleset(session.city, WORLD_SESSION_CITY_RULESET) === SOCIETY_RULESET) return fail('UNSUPPORTED_RULESET', 'This city economy is not playable yet; nothing was changed.');
    const keys: Record<string, string[]> = { ASSIGN_NPC: ["npcId", "tileId"], UNASSIGN_NPC: ["npcId"] };
    if (!raw || typeof raw !== "object" || !hasWeeklyKeys(raw, Object.keys(raw)) || typeof raw.type !== "string" || !Object.hasOwn(keys, raw.type) ||
        !hasWeeklyKeys(raw, ["type", "expectedRevision", ...keys[raw.type]]) || typeof raw.npcId !== "string" ||
        (raw.type === "ASSIGN_NPC" && typeof raw.tileId !== "string")) return fail("INVALID_COMMAND", "Unknown NPC command or fields.");
    const c = { ...raw } as { type: string; npcId: string; tileId?: string };
    if (raw.expectedRevision !== session.city.revision) return fail("STALE_COMMAND", "The plan changed. Refresh the action before retrying.");
    if (session.city.phase === "report") return fail("FORBIDDEN", "Read the report, then choose Plan next week.");
    if (!isNpcWorldSessionState(session)) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    const next = structuredClone(session) as NpcWorldSessionState;
    const npc = next.npcs.find(n => n.character.id === c.npcId);
    if (!npc) return fail("UNKNOWN_NPC", "Select a known NPC.");
    if (c.type === "ASSIGN_NPC") {
      if (!managerSlotTileIds(next.city).includes(c.tileId!)) return fail("LOCKED_POST", "That post is not unlocked. Build a supported building there first.");
      if (npc.postTileId !== c.tileId) {
        if (npc.postTileId !== null) return fail("ALREADY_ASSIGNED", `${npc.character.name} already holds a post. Unassign her first.`);
        if (next.npcs.some(n => n.postTileId === c.tileId)) return fail("POST_OCCUPIED", "Another NPC already manages that building.");
        npc.postTileId = c.tileId!;
      }
    } else npc.postTileId = null;
    next.city.revision = trialSafe(next.city.revision + 1);
    return { success: true, next };
  } catch { return fail("INVALID_STATE", "The NPC action failed validation; the original session was preserved."); }
}

// City commands for an NPC session: a post whose tile was replaced or lost its slot is cleared in the same result.
export function executeWorldNpcCityCommand(session: unknown, raw: unknown): WorldNpcCityResult {
  const fail = (code: string, message: string): WorldNpcCityResult => ({ success: false, error: { code, message } });
  try {
    if (!hasWeeklyKeys(session, ["city", "outside", "npcs"]) || !isTileTrialState(session.city) || !isWorldNpcList(session.npcs, session.city)) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    // Outside rules live in the Planning-only session validator; pair outside with a fresh Planning
    // city so only outside is judged, while the live city (Planning or Report) is checked above.
    if (!isWorldSessionState({ city: createTileTrialState(), outside: session.outside })) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    const type = raw && typeof raw === "object" ? Object.getOwnPropertyDescriptor(raw, "type")?.value : undefined;
    if (type === "LOAD_TRIAL") return fail("INVALID_COMMAND", "Load an NPC world checkpoint through Continue or Import.");
    const result = executeTileTrialCommand(session.city, raw, WORLD_SESSION_CITY_RULESET);
    if (!result.success) return fail(result.error.code, result.error.message);
    const city: TileTrialState = result.nextState, slots = managerSlotTileIds(city);
    const replaced = type === "REPLACE" ? Object.getOwnPropertyDescriptor(raw, "tileId")?.value : undefined;
    const npcs = structuredClone(session.npcs);
    for (const npc of npcs) if (npc.postTileId !== null && (!slots.includes(npc.postTileId) || npc.postTileId === replaced)) npc.postTileId = null;
    return { success: true, next: { city, outside: structuredClone(session.outside) as NpcWorldSessionState["outside"], npcs }, ...(result.report ? { report: result.report } : {}) };
  } catch { return fail("EXECUTION_ERROR", "The action failed validation; the original session was preserved."); }
}
