import { buildingWorkerCap } from "./catalog.js";
import { readDenseArray } from '../world/arrays.js';
import { OUTSIDE_PLOTS, outsidePlot } from './outside.js';
import { hasWeeklyKeys,isCanonicalGameState } from "../domain/canonical-state.js";
import { trialBuilding } from "./catalog.js";
import { GOODS_STOCK_RULESET } from './goods-stock.js';
import { SOCIETY_BUILDINGS,societyPlot,societyStaff,type StaffClass } from './society-map.js';
import { createSocietyState,isSocietyState,societyPopulation } from './society.js';
import type { TileTrialState } from "./types.js";

const integer = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
export function isTileTrialState(raw: unknown): raw is TileTrialState {
  try {
    if (!hasTileKeys(raw)) return false;
    if (Object.hasOwn(raw, 'goodsStock') &&
        !(hasWeeklyKeys(raw.goodsStock, ['rulesetId', 'amountMilli']) && raw.goodsStock.rulesetId === GOODS_STOCK_RULESET && integer(raw.goodsStock.amountMilli))) return false;
    if (!isSocietyState(raw.society)) return false;
    const s = raw as unknown as TileTrialState;
    if (!isCanonicalGameState(s.world) || !s.world.activeSettlementId || !integer(s.revision) ||
      !["planning", "report"].includes(s.phase) || !Number.isFinite(s.happiness) || s.happiness < 0 || s.happiness > 100 || !Array.isArray(s.tiles)) return false;
    if (s.society) {
      const settlement=s.world.settlements[s.world.activeSettlementId];
      const cohorts=readDenseArray(settlement.cohorts) as typeof settlement.cohorts|null;
      if(!cohorts)return false;
      let population = 0;
      for (const cohort of cohorts) {
        population += cohort.count;
        if (!Number.isSafeInteger(population)) return false;
      }
      if (societyPopulation(s.society) !== population) return false;
    }
    const ids = new Set<string>(); let workers = 0;
    const assigned: Record<StaffClass, number> = {basic:0,makers:0,luminaries:0,merchants:0};
    if (s.society) {
      for (const p of OUTSIDE_PLOTS) {
        const o=s.society.outside[p.id];
        if(o.clearWorkers>0&&(!o.wild||p.ring>s.society.wallRing)) return false;
        assigned.basic+=o.clearWorkers;if(!Number.isSafeInteger(assigned.basic))return false;
      }
    }
    const tiles=readDenseArray(s.tiles);
    if(!tiles)return false;
    for (const t of tiles) {
      if (!hasWeeklyKeys(t, ["id", "terrain", "building"]) || typeof t.id !== "string" || !t.id.trim() || ids.has(t.id) || typeof t.terrain !== "string" || !t.terrain.trim()) return false;
      ids.add(t.id);
      const outside=outsidePlot(t.id), o=s.society?.outside[t.id];
      if(outside&&o) {
        if(o.wild&&t.building!==null)return false;
        const exhausted=(outside.terrain==='ore'||outside.terrain==='rock')&&o.depositMilli===0;
        if(t.terrain!==(exhausted?'plain':outside.terrain))return false;
      }
      if (t.building === null) continue;
      const b = t.building;
      if (!hasWeeklyKeys(b, ["typeId", "level", "workers", "enabled"]) || typeof b.typeId !== "string") return false;
      const d = trialBuilding(b.typeId);
      if (!d || !d.terrain.includes(t.terrain) || !integer(b.level) || b.level < 1 || b.level > d.maxLevel ||
        !integer(b.workers) || b.workers > buildingWorkerCap(b.typeId,b.level) || typeof b.enabled !== "boolean" || (!b.enabled && b.workers !== 0)) return false;
      if (s.society) {
        const outside = outsidePlot(t.id);
        if(outside && outside.ring>s.society.wallRing)return false;
        const plot = societyPlot(t.id), info = Object.hasOwn(SOCIETY_BUILDINGS,b.typeId) ? SOCIETY_BUILDINGS[b.typeId] : undefined;
        if (b.typeId === 'market' || (plot && (t.terrain !== 'town' || plot.ring > s.society.wallRing || !info || (info.tier !== plot.tier && info.alsoTier !== plot.tier))) || (!plot && info)) return false;
        const staff = societyStaff(b.typeId);
        if (staff) { assigned[staff] += b.workers; if (!Number.isSafeInteger(assigned[staff])) return false; }
      }
      workers += b.workers; if (!Number.isSafeInteger(workers)) return false;
    }
    if (s.society) {
      const c = s.society.classes;
      const bound = Object.values(c.bound).reduce((a,b)=>a+b,0);
      return assigned.basic <= Math.floor(c.free/10)+Math.floor(bound/10) && (['makers','luminaries','merchants'] as const).every(k=>assigned[k]<=Math.floor(c[k].common/10));
    }
    return false;
  } catch { return false; }
}

// Checkpoint boundary pins this ruleset's map and excludes UI-local reports.
export function isTileTrialPlanningState(raw: unknown): raw is TileTrialState {
  try {
    if (!hasTileKeys(raw) || raw.phase !== "planning" || !Array.isArray(raw.tiles) || !isSocietyState(raw.society)) return false;
    const tiles = raw.tiles;
    if (Object.getPrototypeOf(tiles) !== Array.prototype || Reflect.ownKeys(tiles).length !== tiles.length + 1) return false;
    const expected = createSocietyState().tiles;
    if (tiles.length !== expected.length) return false;
    for (let i = 0; i < tiles.length; i++) {
      const entry = Object.getOwnPropertyDescriptor(tiles, String(i));
      if (!entry?.enumerable || !("value" in entry) || !hasWeeklyKeys(entry.value, ["id", "terrain", "building"]) ||
          entry.value.id !== expected[i].id) return false;
    }
    for(let i=0;i<tiles.length;i++){
      const p=outsidePlot(expected[i].id), society=(raw as unknown as TileTrialState).society;
      const exhausted=p&&(p.terrain==='ore'||p.terrain==='rock')&&society?.outside?.[expected[i].id]?.depositMilli===0;
      if(tiles[i].terrain!==(exhausted?'plain':expected[i].terrain))return false;
    }
    return isTileTrialState(raw);
  } catch { return false; }
}

const TILE_KEYS = ['world', 'revision', 'phase', 'tiles', 'happiness'];
function hasTileKeys(raw: unknown): raw is Record<string, unknown> {
  return hasWeeklyKeys(raw, [...TILE_KEYS, 'goodsStock', 'society']);
}