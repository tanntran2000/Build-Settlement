import type {
  MedalDefinition,
  MedalId,
  ModifierContribution,
  PlayerMedalState,
} from "./types.js";
import {
  validateMedalRegistry,
  validatePlayerMedalState,
} from "./validation.js";

/**
 * Projects equipped Medals into normalized ModifierContribution objects.
 *
 * Rules:
 * - validates registry and player state first;
 * - iterates slots strictly in slot order (0 -> 1 -> 2);
 * - null slots yield no contributions;
 * - each non-null equipped Medal yields exactly one ModifierContribution;
 * - contribution order is deterministic by slot index, independent of registry order;
 * - projection never mutates input state, registry, or any gameplay subsystem;
 * - contributions are purely derived and must not be cached or persisted.
 */
export function projectEquippedMedalModifiers(
  state: PlayerMedalState,
  registry: readonly MedalDefinition[]
): ModifierContribution[] {
  validateMedalRegistry(registry);
  validatePlayerMedalState(state, registry);

  const registryMap = new Map<MedalId, MedalDefinition>();
  for (const def of registry) {
    registryMap.set(def.id, def);
  }

  const contributions: ModifierContribution[] = [];

  for (let i = 0; i < 3; i++) {
    const medalId = state.equippedSlots[i];
    if (medalId === null) {
      continue;
    }

    const def = registryMap.get(medalId)!;
    contributions.push({
      source: "medal",
      sourceId: def.id,
      target: def.modifier.target,
      modifierBps: def.modifier.modifierBps,
    });
  }

  return contributions;
}
