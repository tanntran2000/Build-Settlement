import { createSocietyState, isSocietyState, societyPopulation } from './society.js';
import { hasWeeklyKeys, isCanonicalGameState } from "../domain/canonical-state.js";
import { createWeeklyState, weeklyWorkforceMilli } from "../weekly.js";
import { TILE_TRIAL_BALANCE, trialBuilding } from "./catalog.js";
import type { TileTrialState } from "./types.js";
import { GOODS_STOCK_RULESET } from './goods-stock.js';

export function createTileTrialState(): TileTrialState {
  const world = createWeeklyState();
  Object.assign(world.settlements.settlement_haven_01.inventory, {
    gold: TILE_TRIAL_BALANCE.initialGoldMilli, wood: TILE_TRIAL_BALANCE.initialWoodMilli, iron: TILE_TRIAL_BALANCE.initialIronMilli,
  });
  const tiles = [
    ["field-1", "fertile", "farm"], ["plain-1", "plain", "processor"], ["forest-1", "forest", ""],
    ["ore-1", "ore", ""], ["plain-2", "plain", ""], ["plain-3", "plain", ""],
    ["forest-2", "forest", ""], ["ore-2", "ore", ""], ["field-2", "fertile", ""], ["plain-4", "plain", ""],
  ].map(([id, terrain, typeId]) => ({ id, terrain, building: typeId ? { typeId, level: 1, workers: 2, enabled: true } : null }));
  return { world, revision: 0, phase: "planning", tiles, happiness: TILE_TRIAL_BALANCE.initialHappiness };
}
const integer = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
export function isTileTrialState(raw: unknown): raw is TileTrialState {
  try {
    if (!hasTileKeys(raw)) return false;
    if (Object.hasOwn(raw, 'goodsStock') &&
        !(hasWeeklyKeys(raw.goodsStock, ['rulesetId', 'amountMilli']) && raw.goodsStock.rulesetId === GOODS_STOCK_RULESET && integer(raw.goodsStock.amountMilli))) return false;
    if (Object.hasOwn(raw, 'society') && !isSocietyState(raw.society)) return false;
    const s = raw as unknown as TileTrialState;
    if (!isCanonicalGameState(s.world) || !s.world.activeSettlementId || !integer(s.revision) ||
      !["planning", "report"].includes(s.phase) || !Number.isFinite(s.happiness) || s.happiness < 0 || s.happiness > 100 || !Array.isArray(s.tiles)) return false;
    if (s.society) {
      let population = 0;
      for (const cohort of s.world.settlements[s.world.activeSettlementId].cohorts) {
        population += cohort.count;
        if (!Number.isSafeInteger(population)) return false;
      }
      if (societyPopulation(s.society) !== population) return false;
    }
    const ids = new Set<string>(); let workers = 0;
    for (const t of s.tiles) {
      if (!hasWeeklyKeys(t, ["id", "terrain", "building"]) || typeof t.id !== "string" || !t.id.trim() || ids.has(t.id) || typeof t.terrain !== "string" || !t.terrain.trim()) return false;
      ids.add(t.id);
      if (t.building === null) continue;
      const b = t.building;
      if (!hasWeeklyKeys(b, ["typeId", "level", "workers", "enabled"]) || typeof b.typeId !== "string") return false;
      const d = trialBuilding(b.typeId);
      if (!d || !d.terrain.includes(t.terrain) || !integer(b.level) || b.level < 1 || b.level > d.maxLevel ||
        !integer(b.workers) || b.workers > d.maxWorkers * b.level || typeof b.enabled !== "boolean" || (!b.enabled && b.workers !== 0)) return false;
      workers += b.workers; if (!Number.isSafeInteger(workers)) return false;
    }
    return workers * 1000 <= weeklyWorkforceMilli(s.world.settlements[s.world.activeSettlementId].cohorts);
  } catch { return false; }
}

// Checkpoint boundary pins this ruleset's map and excludes UI-local reports.
export function isTileTrialPlanningState(raw: unknown): raw is TileTrialState {
  try {
    if (!hasTileKeys(raw) || raw.phase !== "planning" || !Array.isArray(raw.tiles)) return false;
    const tiles = raw.tiles;
    if (Object.getPrototypeOf(tiles) !== Array.prototype || Reflect.ownKeys(tiles).length !== tiles.length + 1) return false;
    const expected = (Object.hasOwn(raw, 'society') ? createSocietyState() : createTileTrialState()).tiles;
    if (tiles.length !== expected.length) return false;
    for (let i = 0; i < tiles.length; i++) {
      const entry = Object.getOwnPropertyDescriptor(tiles, String(i));
      if (!entry?.enumerable || !("value" in entry) || !hasWeeklyKeys(entry.value, ["id", "terrain", "building"]) ||
          entry.value.id !== expected[i].id || entry.value.terrain !== expected[i].terrain) return false;
    }
    return isTileTrialState(raw);
  } catch { return false; }
}

const TILE_KEYS = ['world', 'revision', 'phase', 'tiles', 'happiness'];
function hasTileKeys(raw: unknown): raw is Record<string, unknown> {
  return [TILE_KEYS, [...TILE_KEYS, 'goodsStock'], [...TILE_KEYS, 'goodsStock', 'society']].some(keys => hasWeeklyKeys(raw, keys));
}