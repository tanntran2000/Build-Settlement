import { createSocietyState,hasWeeklyKeys,homeBeds,homeResidents,isNpcWorldSessionState,isTileTrialState,isWorldNpcList,isWorldSessionState,managerSlotTileIds,MANSION_TILE_ID,type NpcWorldSessionState,type TileTrialReport,type TileTrialState,type ItemWeekContext } from "@haven/core";
import { trialSafe } from "./tile-trial-week.js";
import { moveNpcToMansionRoom, type RoomMoveErrorCode } from "./mansion-command.js";
import { executeTileTrialCommand } from "./tile-trial.js";

export type WorldNpcErrorCode = "INVALID_STATE" | "INVALID_COMMAND" | "STALE_COMMAND" | "FORBIDDEN" | "UNKNOWN_NPC" | "LOCKED_POST" | "POST_OCCUPIED" | "ALREADY_ASSIGNED" | "UNSUPPORTED_RULESET" | "NO_BED" | "NOT_A_HOME" | "NOT_IN_HALL" | "NPC_CAP" | RoomMoveErrorCode;
export type WorldNpcResult = { success: true; next: NpcWorldSessionState } | { success: false; error: { code: WorldNpcErrorCode; message: string } };
export type WorldNpcCityResult = { success: true; next: NpcWorldSessionState; report?: Readonly<TileTrialReport> } | { success: false; error: { code: string; message: string } };

// Assignment uses the NPC's home and post eligibility. Character stats and traits remain outside the assignment check.
export function executeWorldNpcCommand(session: unknown, raw: unknown): WorldNpcResult {
  const fail = (code: WorldNpcErrorCode, message: string): WorldNpcResult => ({ success: false, error: { code, message } });
  try {
    if (!hasWeeklyKeys(session, ["city", "outside", "npcs"]) || !isTileTrialState(session.city)) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    const keys: Record<string, string[]> = { ASSIGN_NPC: ["npcId", "tileId"], UNASSIGN_NPC: ["npcId"], MOVE_NPC_HOME: ["npcId", "homeTileId"] };
    if (!raw || typeof raw !== "object" || !hasWeeklyKeys(raw, Object.keys(raw)) || typeof raw.type !== "string" || !Object.hasOwn(keys, raw.type)) {
      return fail("INVALID_COMMAND", "Unknown NPC command or fields.");
    }
    const mansion = raw.type === "MOVE_NPC_HOME" && raw.homeTileId === MANSION_TILE_ID;
    const expected = ["type", "expectedRevision", ...keys[raw.type], ...(mansion ? ["roomId"] : [])];
    if (!hasWeeklyKeys(raw, expected) || typeof raw.npcId !== "string" ||
        (raw.type === "ASSIGN_NPC" && typeof raw.tileId !== "string") ||
        (raw.type === "MOVE_NPC_HOME" && typeof raw.homeTileId !== "string") || (mansion && typeof raw.roomId !== "string")) {
      return fail("INVALID_COMMAND", "Unknown NPC command or fields.");
    }
    const c = { ...raw } as { type: string; npcId: string; tileId?: string; homeTileId?: string; roomId?: string };
    if (raw.expectedRevision !== session.city.revision) return fail("STALE_COMMAND", "The plan changed. Refresh the action before retrying.");
    if (session.city.phase === "report") return fail("FORBIDDEN", "Read the report, then choose Plan next week.");
    if (!isNpcWorldSessionState(session)) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    const next = structuredClone(session) as NpcWorldSessionState;
    const npc = next.npcs.find(n => n.character.id === c.npcId);
    if (!npc) return fail("UNKNOWN_NPC", "Select a known NPC.");
    if (c.type === "MOVE_NPC_HOME") {
      const home = c.homeTileId!, capacity = homeBeds(next.city, home);
      if (!capacity) return fail("NOT_A_HOME", "Select the Mansion or a Retainers' Hall.");
      if (mansion) {
        const failure = moveNpcToMansionRoom(next, npc, c.roomId!);
        if (failure) return { success: false, error: failure };
      } else if (home !== npc.household.home) {
        if (homeResidents(next.npcs, home) >= capacity) return fail("NO_BED", "That home has no free bed.");
        if (npc.household.home === MANSION_TILE_ID) Object.assign(npc.household, { room: null, role: null, training: null });
        npc.household.home = home;
      }
    } else if (c.type === "ASSIGN_NPC") {
      if (npc.household.home === "estate-1") return fail("NOT_IN_HALL", "Only Retainers' Hall residents can hold a city post.");
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
export function executeWorldNpcCityCommand(session: unknown, raw: unknown,ctx?:ItemWeekContext,levyPenalty=0): WorldNpcCityResult {
  const fail = (code: string, message: string): WorldNpcCityResult => ({ success: false, error: { code, message } });
  try {
    if (!hasWeeklyKeys(session, ["city", "outside", "npcs"]) || !isTileTrialState(session.city) || !isWorldNpcList(session.npcs, session.city)) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    // Outside rules live in the Planning-only session validator; pair outside with a fresh Planning
    // city so only outside is judged, while the live city (Planning or Report) is checked above.
    if (!isWorldSessionState({ city: createSocietyState(), outside: session.outside })) return fail("INVALID_STATE", "World session is invalid; nothing was changed.");
    const type = raw && typeof raw === "object" ? Object.getOwnPropertyDescriptor(raw, "type")?.value : undefined;
    if (type === "LOAD_TRIAL") return fail("INVALID_COMMAND", "Load an NPC world checkpoint through Continue or Import.");
    const occupiedHomes = new Set((session.npcs as NpcWorldSessionState["npcs"]).map(npc => npc.household.home));
    const result = executeTileTrialCommand(session.city, raw,ctx,occupiedHomes,levyPenalty);
    if (!result.success) return fail(result.error.code, result.error.message);
    const city: TileTrialState = result.nextState, slots = managerSlotTileIds(city);
    const replaced = type === "REPLACE" ? Object.getOwnPropertyDescriptor(raw, "tileId")?.value : undefined;
    const npcs = structuredClone(session.npcs);
    for (const npc of npcs) if (npc.postTileId !== null && (!slots.includes(npc.postTileId) || npc.postTileId === replaced)) npc.postTileId = null;
    return { success: true, next: { city, outside: structuredClone(session.outside) as NpcWorldSessionState["outside"], npcs }, ...(result.report ? { report: result.report } : {}) };
  } catch { return fail("EXECUTION_ERROR", "The action failed validation; the original session was preserved."); }
}
