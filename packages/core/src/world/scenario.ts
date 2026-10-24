import { POPULATION_TILE_RULESET } from '../trial/catalog.js';
import type { OutsideWorldConfig } from './generate.js';

// TRIAL scenario approved 2026-10-24 07:29:43 UTC; not validated balance. City ruleset: coordinator continuity choice.
export const OUTSIDE_TRIAL_SCENARIO: Readonly<OutsideWorldConfig> = Object.freeze({
  scenarioId: 'outside-trial-01', generator: 'outside-gen-01', cityRulesetId: POPULATION_TILE_RULESET,
  actors: Object.freeze(['player', 'ai-1', 'ai-2']),
  tiles: Object.freeze(Array.from({ length: 90 }, (_, i) => {
    const owner = i < 5 ? 'ai-1' : i < 10 ? 'ai-2' : null;
    return Object.freeze({ id: `o${String(i + 1).padStart(2, '0')}`, owner, eligible: i >= 10, knownBy: Object.freeze(owner ? [owner] : []) });
  })),
  depositBudget: 6, lootBudget: 12, depositResources: Object.freeze(['wheat', 'wood', 'iron'] as const),
});
export const SUPPORTED_OUTSIDE_GENERATORS: readonly string[] = Object.freeze(['outside-gen-01']);
export function scenarioById(id: string): Readonly<OutsideWorldConfig> | undefined {
  return id === OUTSIDE_TRIAL_SCENARIO.scenarioId ? OUTSIDE_TRIAL_SCENARIO : undefined;
}
