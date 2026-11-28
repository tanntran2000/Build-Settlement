import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { isMansionState } from '../mansion/invariants.js';
import type { NamedCharacter } from '../domain/character.js';
import { REQUIRED_EMOTIONS,REQUIRED_NEEDS,REQUIRED_RELATIONSHIP,REQUIRED_SKILLS } from '../domain/gamestate.js';
import type { TileTrialState } from '../trial/types.js';
import { readDenseArray } from './arrays.js';
import { NPC_MANAGER_BUILDING_TYPES,WORLD_TRAITS } from './npc-content.js';
import { isNpcLife, npcAge, type NpcLife } from './npc-life.js';
import { homeBeds, isNpcHousehold, type NpcHousehold } from './npc-household.js';
import { P7B_TRIAL } from './npc-generator.js';
import { CHARACTER_LIMITS } from '../character/catalog.js';
import { createWorldSession,isWorldSessionState } from './session.js';
import type { WorldResult,WorldSessionState } from './types.js';

import type { DifficultyId } from '../trial/difficulty.js';

export interface TraitDefinition { id: string; name: string; summary: string }
// `character.occupation` is background only; the current post is `postTileId`.
export interface WorldNpc { character: NamedCharacter; traits: string[]; postTileId: string | null; life: NpcLife; household: NpcHousehold }
export interface NpcWorldSessionState extends WorldSessionState { npcs: WorldNpc[] }

const CHARACTER_KEYS = ['id', 'name', 'gender', 'age', 'occupation', 'socialClass', 'legalStatus', 'needs', 'emotions', 'relationshipToPlayer', 'memories', 'skills', 'health'];
const GENDERS = ['female', 'male', 'other'];
const OCCUPATIONS = ['unassigned', 'worker', 'technician', 'doctor', 'farmer', 'security', 'manager', 'trader', 'advisor', 'governor'];
const SOCIAL_CLASSES = ['lower', 'common', 'skilled', 'administrative', 'elite'];
const LEGAL_STATUSES = ['citizen', 'free_resident', 'contract_bound', 'enslaved', 'prisoner', 'outsider'];
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64 && v.trim() === v;
const stat = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
const stats = (v: unknown, keys: readonly string[]) => hasWeeklyKeys(v, keys) && keys.every(k => stat(v[k]));
const oneOf = (v: unknown, values: readonly string[]) => typeof v === 'string' && values.includes(v);

export function managerSlotTileIds(city: TileTrialState): string[] {
  return city.tiles.filter(t => t.building && NPC_MANAGER_BUILDING_TYPES.includes(t.building.typeId)).map(t => t.id);
}

// Validates one untrusted character record; list rules (unique ids, traits, posts) stay with the caller.
export function isNamedCharacterRecord(c: unknown): c is NamedCharacter {
  try {
    if (!hasWeeklyKeys(c, CHARACTER_KEYS) || !text(c.id) || !text(c.name) || !oneOf(c.gender, GENDERS) ||
        !Number.isSafeInteger(c.age) || (c.age as number) < 0 || !oneOf(c.occupation, OCCUPATIONS) ||
        !oneOf(c.socialClass, SOCIAL_CLASSES) || !oneOf(c.legalStatus, LEGAL_STATUSES) || !stat(c.health) ||
        !stats(c.needs, REQUIRED_NEEDS) || !stats(c.emotions, REQUIRED_EMOTIONS) || !stats(c.skills, REQUIRED_SKILLS) ||
        !stats(c.relationshipToPlayer, REQUIRED_RELATIONSHIP)) return false;
    // shortcut: memories must be empty until a WP writes them; then validate Memory keys.
    return readDenseArray(c.memories)?.length === 0;
  } catch { return false; }
}

// Validates untrusted data; `city` must already be a valid tile state.
export function isWorldNpcList(raw: unknown, city: TileTrialState): raw is WorldNpc[] {
  try {
    const list = readDenseArray(raw);
    if (!list || list.length > P7B_TRIAL.npcCap) return false;
    const slots = managerSlotTileIds(city), traitIds = WORLD_TRAITS.map(t => t.id), ids = new Set<string>(), posts = new Set<string>();
    const names = new Set<string>(), residents = new Map<string, number>();
    for (const npc of list) {
      if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId', 'life', 'household']) || !isNpcLife(npc.life) || !isNpcHousehold(npc.household)) return false;
      const c = npc.character, traits = readDenseArray(npc.traits), household = npc.household;
      if (!isNamedCharacterRecord(c) || c.gender !== 'female' || c.age < CHARACTER_LIMITS.ageMin ||
          npcAge(npc.life, city.world.week) < CHARACTER_LIMITS.ageMin || !Number.isInteger(c.relationshipToPlayer.affection) ||
          ids.has(c.id) || names.has(c.name)) return false;
      if (c.legalStatus !== (household.status === 'slave' ? 'enslaved' : 'contract_bound') || household.boughtWeek > city.world.week) return false;
      if (!traits || !traits.every(t => oneOf(t, traitIds)) || new Set(traits).size !== traits.length) return false;
      const capacity = homeBeds(city, household.home);
      const used = (residents.get(household.home) ?? 0) + 1;
      if (used > capacity) return false;
      residents.set(household.home, used);
      const post = npc.postTileId;
      if (post !== null && (household.home === 'estate-1' || typeof post !== 'string' || !slots.includes(post) || posts.has(post))) return false;
      ids.add(c.id); names.add(c.name); if (post !== null) posts.add(post);
    }
    return isMansionState(city.society?.mansion, city, list as WorldNpc[]);
  } catch { return false; }
}

export function isNpcWorldSessionState(raw: unknown): raw is NpcWorldSessionState {
  try {
    return hasWeeklyKeys(raw, ['city', 'outside', 'npcs']) && isWorldSessionState({ city: raw.city, outside: raw.outside }) &&
      isWorldNpcList(raw.npcs, raw.city as TileTrialState);
  } catch { return false; }
}

// New Game owns no NPCs.
export function createNpcWorldSession(seed: unknown, difficulty: DifficultyId = 'normal'): WorldResult<NpcWorldSessionState> {
  const base = createWorldSession(seed, difficulty);
  if (!base.success) return base;
  return { success: true, value: { ...base.value, npcs: [] } };
}
