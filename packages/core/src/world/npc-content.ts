import { createNamedCharacter } from '../domain/character.js';
import type { TraitDefinition, WorldNpc } from './npc.js';

// TRIAL starter content approved 2026-10-25T00:00Z as a shape only; values, traits and the
// post mapping are PROVISIONAL, pending user review, and not validated balance.
// Provisional trial mapping onto the six existing building types, not a permanent job catalog.
export const NPC_MANAGER_BUILDING_TYPES: readonly string[] = Object.freeze(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market']);

// Display text only: no trait effect is active yet.
export const WORLD_TRAITS: readonly TraitDefinition[] = deepFreeze([
  { id: 'frugal', name: 'Frugal', summary: 'Careful with materials. Intended: less waste where she manages. (effect not active yet)' },
  { id: 'restless', name: 'Restless', summary: 'Dislikes staying on one post for long. Intended: stress builds on long single-post duty. (effect not active yet)' },
  { id: 'steady_hands', name: 'Steady Hands', summary: 'Calm, precise hands. Intended: better medical work. (effect not active yet)' },
  { id: 'blunt', name: 'Blunt', summary: 'Says exactly what she thinks. Intended: clear deals, but slower to win trust. (effect not active yet)' },
]);

// Original small pool of common English given names; New Game draws three distinct ones from its seed.
export const WORLD_NPC_GIVEN_NAMES: readonly string[] = Object.freeze([
  'Alice', 'Clara', 'Edith', 'Grace', 'Hazel', 'Iris', 'June', 'Lydia', 'Nora', 'Ruth', 'Tessa', 'Wendy',
]);

// Stat/trait templates. Ids are fixed identity, independent of the display name; the
// placeholder names are always replaced by a drawn name at New Game.
// Needs, emotions and relationship use the existing createNamedCharacter defaults.
export const WORLD_STARTER_NPCS: readonly WorldNpc[] = deepFreeze([
  { character: createNamedCharacter({ id: 'npc_starter_1', name: 'Starter 1', gender: 'female', age: 27, occupation: 'technician', socialClass: 'skilled', legalStatus: 'citizen',
    skills: { management: 40, technical: 65, medical: 15, combat: 30, negotiation: 25 }, health: 100 }), traits: ['frugal', 'restless'], postTileId: null },
  { character: createNamedCharacter({ id: 'npc_starter_2', name: 'Starter 2', gender: 'female', age: 31, occupation: 'doctor', socialClass: 'skilled', legalStatus: 'free_resident',
    skills: { management: 35, technical: 20, medical: 65, combat: 10, negotiation: 45 }, health: 85 }), traits: ['steady_hands'], postTileId: null },
  { character: createNamedCharacter({ id: 'npc_starter_3', name: 'Starter 3', gender: 'female', age: 24, occupation: 'trader', socialClass: 'common', legalStatus: 'contract_bound',
    skills: { management: 50, technical: 15, medical: 20, combat: 35, negotiation: 60 }, health: 100 }), traits: ['blunt'], postTileId: null },
]);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
