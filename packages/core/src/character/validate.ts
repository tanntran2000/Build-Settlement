import type { NamedCharacter } from '../domain/character.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { readDenseArray } from '../world/arrays.js';
import { isNamedCharacterRecord, isNpcWorldSessionState, type WorldNpc } from '../world/npc.js';
import {
  BUILDS, CHARACTER_LIMITS as L, EYE_COLORS, FACE_FEATURES, FACE_SHAPES, HAIR_COLORS, HAIR_LENGTHS, HAIR_STYLES, HAIR_TEXTURES,
  OUTFITS, PLACES, PLAYER_CHARACTER_ID, PLAYER_PROFESSIONS, REGIONS, SKIN_TONES, UPBRINGINGS,
} from './catalog.js';
import type { CharacterLifeSessionState, CharacterProfile, PlayerCharacter } from './types.js';

const ids = (list: readonly { id: string }[]) => list.map(w => w.id);
const oneOf = (v: unknown, values: readonly string[]) => typeof v === 'string' && values.includes(v);
// Same trimmed-equal rule as NPC names (world/npc.ts); null means absent.
const optText = (v: unknown, max: number) => v === null || (typeof v === 'string' && v.length > 0 && v.length <= max && v.trim() === v);
const axis = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
const int = (v: unknown, [min, max]: readonly [number, number]) => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
// Required keys plus optional ones that may be present; nothing else.
const keysOf = (v: unknown, required: string[], optional: string[] = []): v is Record<string, unknown> =>
  hasWeeklyKeys(v, [...required, ...optional.filter(k => typeof v === 'object' && v !== null && Object.hasOwn(v, k))]);
const adult = (c: NamedCharacter) => c.age >= L.ageMin;
const inAgeRange = (c: NamedCharacter) => c.age >= L.ageMin && c.age <= L.ageMax;
const DISCLOSURES = ['known', 'unknown'];

// `character` must already be a valid NamedCharacter; `raw` is untrusted.
export function isCharacterProfile(raw: unknown, character: NamedCharacter): raw is CharacterProfile {
  try {
    if (!keysOf(raw, ['id', 'identity', 'traits', 'appearance'], ['private']) || raw.id !== character.id) return false;
    const { identity: i, traits: t, appearance: a } = raw;
    if (!keysOf(i, ['birthName', 'label', 'pronouns', 'birthplaceId', 'origin', 'currentLocationId', 'biography']) ||
        !optText(i.birthName, L.nameMax) || !optText(i.label, L.labelMax) || !optText(i.biography, L.biographyMax) ||
        !oneOf(i.pronouns, ['she', 'he', 'they']) || !PLACES.some(p => p.id === i.birthplaceId && p.regionId !== null) ||
        !oneOf(i.currentLocationId, ids(PLACES)) || !keysOf(i.origin, ['regionId', 'upbringing']) ||
        !oneOf(i.origin.regionId, ids(REGIONS)) || !oneOf(i.origin.upbringing, ids(UPBRINGINGS))) return false;
    if (!keysOf(t, ['attractiveness', 'learningAptitude', 'warmth'], ['intimacyKnowledge']) ||
        ![t.attractiveness, t.learningAptitude, t.warmth].every(axis) || (Object.hasOwn(t, 'intimacyKnowledge') && !axis(t.intimacyKnowledge))) return false;
    if (!keysOf(a, ['presentation', 'skinTone', 'eyeColor', 'hair', 'face', 'build', 'heightCm', 'weightKg', 'outfit'], ['measurements']) ||
        !oneOf(a.presentation, ['feminine', 'masculine', 'androgynous']) || !oneOf(a.skinTone, ids(SKIN_TONES)) || !oneOf(a.eyeColor, ids(EYE_COLORS)) ||
        !oneOf(a.build, ids(BUILDS)) || !int(a.heightCm, L.heightCm) || !int(a.weightKg, L.weightKg) ||
        !(a.outfit === 'role_default' || oneOf(a.outfit, ids(OUTFITS)))) return false;
    const h = a.hair, f = a.face;
    if (!keysOf(h, ['color', 'length', 'texture', 'style']) || !oneOf(h.color, ids(HAIR_COLORS)) || !oneOf(h.length, ids(HAIR_LENGTHS)) ||
        !oneOf(h.texture, ids(HAIR_TEXTURES)) || !oneOf(h.style, ids(HAIR_STYLES))) return false;
    if (!keysOf(f, ['shape', 'features']) || !oneOf(f.shape, ids(FACE_SHAPES))) return false;
    const features = readDenseArray(f.features);
    if (!features || features.length > L.faceFeaturesMax ||
        !features.every(x => oneOf(x, ids(FACE_FEATURES))) || new Set(features).size !== features.length) return false;
    if (Object.hasOwn(a, 'measurements')) {
      const m = a.measurements;
      if (!keysOf(m, ['chestCm', 'waistCm', 'hipsCm', 'disclosure']) || !int(m.chestCm, L.chestCm) || !int(m.waistCm, L.waistCm) ||
          !int(m.hipsCm, L.hipsCm) || !oneOf(m.disclosure, DISCLOSURES)) return false;
    }
    if (Object.hasOwn(raw, 'private')) {
      const p = raw.private;
      if (!keysOf(p, ['intimateHistory']) || !keysOf(p.intimateHistory, ['value', 'disclosure']) ||
          !oneOf(p.intimateHistory.value, ['none', 'some']) || !oneOf(p.intimateHistory.disclosure, DISCLOSURES)) return false;
    }
    // Adult policy: absence is required under 18, not zero.
    return adult(character) || !(Object.hasOwn(t, 'intimacyKnowledge') || Object.hasOwn(raw, 'private'));
  } catch { return false; }
}

export function isPlayerCharacter(raw: unknown): raw is PlayerCharacter {
  try {
    if (!keysOf(raw, ['character', 'profile'])) return false;
    const c = raw.character;
    if (!isNamedCharacterRecord(c) || c.id !== PLAYER_CHARACTER_ID || !PLAYER_PROFESSIONS.includes(c.occupation) || !inAgeRange(c) ||
        !isCharacterProfile(raw.profile, c)) return false;
    // The Player always knows their own measurements and history.
    const p = raw.profile;
    return p.appearance.measurements?.disclosure !== 'unknown' && p.private?.intimateHistory.disclosure !== 'unknown';
  } catch { return false; }
}

export function isCharacterLifeSessionState(raw: unknown): raw is CharacterLifeSessionState {
  try {
    if (!keysOf(raw, ['city', 'outside', 'npcs', 'player', 'profiles']) ||
        !isNpcWorldSessionState({ city: raw.city, outside: raw.outside, npcs: raw.npcs }) || !isPlayerCharacter(raw.player)) return false;
    const npcs = raw.npcs as WorldNpc[], profiles = readDenseArray(raw.profiles);
    return !!profiles && profiles.length === npcs.length &&
      npcs.every((n, i) => inAgeRange(n.character) && n.character.id !== PLAYER_CHARACTER_ID && isCharacterProfile(profiles[i], n.character));
  } catch { return false; }
}
