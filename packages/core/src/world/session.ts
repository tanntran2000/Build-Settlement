import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { createTileTrialState, isTileTrialPlanningState } from '../trial/state.js';
import { POPULATION_TILE_RULESET } from '../trial/catalog.js';
import { readDenseArray } from './arrays.js';
import { createOutsideWorld } from './generate.js';
import { OUTSIDE_TRIAL_SCENARIO, scenarioById, SUPPORTED_OUTSIDE_GENERATORS } from './scenario.js';
import type { OutsideWorldState, WorldResult, WorldSessionState } from './types.js';

export const WORLD_SESSION_CITY_RULESET = POPULATION_TILE_RULESET;
const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 64 && value.trim() === value;

export function createWorldSession(seed: unknown): WorldResult<WorldSessionState> {
  try {
    const outside = createOutsideWorld(OUTSIDE_TRIAL_SCENARIO, seed);
    return outside.success ? { success: true, value: { city: createTileTrialState(), outside: outside.value } } : outside;
  } catch { return { success: false, error: { code: 'WORLD_GENERATION_FAILED', message: 'Could not create the world session.' } }; }
}

export function outsideProvenance(raw: unknown): 'supported' | 'unsupported' | 'malformed' {
  try {
    if (!raw || typeof raw !== 'object') return 'malformed';
    const generator = Object.getOwnPropertyDescriptor(raw, 'generator'), scenario = Object.getOwnPropertyDescriptor(raw, 'scenarioId');
    if (!generator?.enumerable || !('value' in generator) || !id(generator.value) ||
        !scenario?.enumerable || !('value' in scenario) || !id(scenario.value)) return 'malformed';
    return SUPPORTED_OUTSIDE_GENERATORS.includes(generator.value) && scenarioById(scenario.value) ? 'supported' : 'unsupported';
  } catch { return 'malformed'; }
}

export function isWorldSessionState(raw: unknown): raw is WorldSessionState {
  try {
    if (!hasWeeklyKeys(raw, ['city', 'outside']) || !isTileTrialPlanningState(raw.city) ||
        !hasWeeklyKeys(raw.outside, ['scenarioId', 'generator', 'seed', 'actors', 'tiles']) || outsideProvenance(raw.outside) !== 'supported') return false;
    const o = raw.outside, scenario = scenarioById(o.scenarioId as string)!;
    if (scenario.cityRulesetId !== WORLD_SESSION_CITY_RULESET || !Number.isSafeInteger(o.seed) || (o.seed as number) < 0 || (o.seed as number) > 4294967295) return false;
    const actors = readDenseArray(o.actors), tiles = readDenseArray(o.tiles);
    if (!actors || actors.length !== scenario.actors.length || !actors.every((a, i) => a === scenario.actors[i]) || !tiles || tiles.length !== scenario.tiles.length) return false;
    let deposits = 0, loot = 0;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      if (!hasWeeklyKeys(tile, ['id', 'owner', 'feature', 'knownBy']) || !id(tile.id) || tile.id !== scenario.tiles[i].id ||
          !(tile.owner === null || actors.includes(tile.owner))) return false;
      const known = readDenseArray(tile.knownBy);
      if (!known || !known.every(a => actors.includes(a)) || !known.every((a, j) => j === 0 || actors.indexOf(known[j - 1]) < actors.indexOf(a))) return false;
      const feature = tile.feature;
      if (feature === null) continue;
      if (!scenario.tiles[i].eligible) return false;
      if (hasWeeklyKeys(feature, ['kind', 'resource']) && feature.kind === 'deposit' && scenario.depositResources.includes(feature.resource as 'wheat' | 'wood' | 'iron')) deposits++;
      else if (hasWeeklyKeys(feature, ['kind', 'claimedBy']) && feature.kind === 'loot' && (feature.claimedBy === null || known.includes(feature.claimedBy))) loot++;
      else return false;
    }
    return deposits === scenario.depositBudget && loot === scenario.lootBudget;
  } catch { return false; }
}

export function summarizeOutside(outside: OutsideWorldState, actor: string): { total: number; mine: number; others: number; neutral: number; explored: number } {
  const summary = { total: 0, mine: 0, others: 0, neutral: 0, explored: 0 };
  try {
    for (const tile of outside.tiles) {
      summary.total++;
      if (tile.owner === null) summary.neutral++; else if (tile.owner === actor) summary.mine++; else summary.others++;
      if (tile.knownBy.includes(actor)) summary.explored++;
    }
  } catch { return { total: 0, mine: 0, others: 0, neutral: 0, explored: 0 }; }
  return summary;
}
