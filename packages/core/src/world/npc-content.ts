import type { TraitDefinition } from './npc.js';

// Existing trait and post content remains available to generated NPCs.
// Provisional trial mapping onto the six existing building types, not a permanent job catalog.
export const NPC_MANAGER_BUILDING_TYPES: readonly string[] = Object.freeze(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks', 'smithy', 'hospital', 'drug-store']);

// Display text only: no trait effect is active yet.
export const WORLD_TRAITS: readonly TraitDefinition[] = deepFreeze([
  { id: 'frugal', name: 'Frugal', summary: 'Careful with materials. Intended: less waste where she manages. (effect not active yet)' },
  { id: 'restless', name: 'Restless', summary: 'Dislikes staying on one post for long. Intended: stress builds on long single-post duty. (effect not active yet)' },
  { id: 'steady_hands', name: 'Steady Hands', summary: 'Calm, precise hands. Intended: better medical work. (effect not active yet)' },
  { id: 'blunt', name: 'Blunt', summary: 'Says exactly what she thinks. Intended: clear deals, but slower to win trust. (effect not active yet)' },
]);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
