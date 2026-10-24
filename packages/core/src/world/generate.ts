import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type TileTrialRuleset } from '../trial/catalog.js';
import { readDenseArray } from './arrays.js';
import { createSeededRandom } from './random.js';
import type { OutsideFeature, OutsideWorldState, WorldResult } from './types.js';

export interface OutsideWorldConfig {
  scenarioId: string; generator: string; cityRulesetId: TileTrialRuleset;
  actors: readonly string[];
  tiles: readonly { id: string; owner: string | null; eligible: boolean; knownBy: readonly string[] }[];
  depositBudget: number; lootBudget: number;
  depositResources: readonly ('wheat' | 'wood' | 'iron')[];
}
const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 64 && value.trim() === value;
const budget = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const invalid = (): WorldResult<never> => ({ success: false, error: { code: 'INVALID_WORLD_CONFIG', message: 'Outside world configuration is invalid.' } });

export function validateOutsideWorldConfig(raw: unknown): WorldResult<OutsideWorldConfig> {
  try {
    if (!hasWeeklyKeys(raw, ['scenarioId', 'generator', 'cityRulesetId', 'actors', 'tiles', 'depositBudget', 'lootBudget', 'depositResources']) ||
        !id(raw.scenarioId) || !id(raw.generator) || ![LEGACY_TILE_RULESET, POPULATION_TILE_RULESET].includes(raw.cityRulesetId as TileTrialRuleset)) return invalid();
    const actors = readDenseArray(raw.actors), tiles = readDenseArray(raw.tiles), resources = readDenseArray(raw.depositResources);
    if (!actors?.length || !actors.every(id) || new Set(actors).size !== actors.length || !tiles || !resources?.length ||
        !resources.every(r => r === 'wheat' || r === 'wood' || r === 'iron') || new Set(resources).size !== resources.length) return invalid();
    const ids = new Set<string>(); let eligible = 0;
    for (const tile of tiles) {
      if (!hasWeeklyKeys(tile, ['id', 'owner', 'eligible', 'knownBy']) || !id(tile.id) || ids.has(tile.id) ||
          !(tile.owner === null || (id(tile.owner) && actors.includes(tile.owner))) || typeof tile.eligible !== 'boolean') return invalid();
      const known = readDenseArray(tile.knownBy);
      if (!known || !known.every(id) || !known.every(actor => actors.includes(actor)) ||
          !known.every((actor, i) => i === 0 || actors.indexOf(known[i - 1]) < actors.indexOf(actor)) ||
          (tile.owner !== null && !known.includes(tile.owner))) return invalid();
      ids.add(tile.id); if (tile.eligible) eligible++;
    }
    if (!budget(raw.depositBudget) || !budget(raw.lootBudget) || raw.depositBudget > eligible || raw.lootBudget > eligible - raw.depositBudget) return invalid();
    return { success: true, value: raw as unknown as OutsideWorldConfig };
  } catch { return invalid(); }
}

export function createOutsideWorld(config: unknown, seed: unknown): WorldResult<OutsideWorldState> {
  try {
    const checked = validateOutsideWorldConfig(config);
    if (!checked.success) return checked;
    if (!Number.isSafeInteger(seed) || (seed as number) < 0 || (seed as number) > 4294967295) {
      return { success: false, error: { code: 'INVALID_WORLD_SEED', message: 'World seed must be a uint32 integer.' } };
    }
    const c = checked.value, random = createSeededRandom(seed as number);
    const eligible = c.tiles.flatMap((tile, i) => tile.eligible ? [i] : []);
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    const tiles = c.tiles.map(tile => ({ id: tile.id, owner: tile.owner, knownBy: [...tile.knownBy], feature: null as OutsideFeature | null }));
    for (let i = 0; i < c.depositBudget; i++) tiles[eligible[i]].feature = { kind: 'deposit', resource: c.depositResources[Math.floor(random() * c.depositResources.length)] };
    for (let i = c.depositBudget; i < c.depositBudget + c.lootBudget; i++) tiles[eligible[i]].feature = { kind: 'loot', claimedBy: null };
    return { success: true, value: { scenarioId: c.scenarioId, generator: c.generator, seed: seed as number, actors: [...c.actors], tiles } };
  } catch { return { success: false, error: { code: 'WORLD_GENERATION_FAILED', message: 'Could not create the outside world.' } }; }
}
