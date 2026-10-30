import { createNamedCharacter, type Occupation } from '../domain/character.js';
import { readDenseArray } from '../world/arrays.js';
import { createNpcWorldSession } from '../world/npc.js';
import {
  BUILDS, CHARACTER_LIMITS as L, EYE_COLORS, FACE_FEATURES, FACE_SHAPES, HAIR_COLORS, HAIR_LENGTHS, HAIR_STYLES, HAIR_TEXTURES,
  OUTFITS, PLACES, PLAYER_CHARACTER_ID, PLAYER_PROFESSIONS, REGIONS, SKIN_TONES, UPBRINGINGS,
} from './catalog.js';
import { STARTER_PROFILES, type PlayerDraft } from './starter-profiles.js';
import type { CharacterLifeSessionState, PlayerCharacter } from './types.js';
import { isCharacterLifeSessionState, isPlayerCharacter } from './validate.js';

export type DraftErrors = Partial<Record<string, string>>;

const NAME_MESSAGE = 'Enter a name of 1–64 characters without leading or trailing spaces.';
const AXIS_NAMES = { attractiveness: 'Attractiveness', learningAptitude: 'Learning Aptitude', warmth: 'Warmth', intimacyKnowledge: 'Intimacy Knowledge' } as const;
const MEASUREMENTS = [['chestCm', 'Chest', L.chestCm], ['waistCm', 'Waist', L.waistCm], ['hipsCm', 'Hips', L.hipsCm]] as const;
// Number('') and Number('  ') are 0, so blank or padded strings never reach Number().
const num = (s: string) => typeof s === 'string' && s !== '' && s.trim() === s ? Number(s) : NaN;
const int = (s: string, [min, max]: readonly [number, number]) => { const n = num(s); return Number.isSafeInteger(n) && n >= min && n <= max; };
const axis = (s: string) => { const n = num(s); return Number.isFinite(n) && n >= 0 && n <= 100; };
// Checked before createNamedCharacter, which would silently trim " Ana".
const name = (s: string) => typeof s === 'string' && s.length > 0 && s.length <= L.nameMax && s.trim() === s;
const oneOf = (v: unknown, list: readonly (string | { readonly id: string })[]) => typeof v === 'string' && list.some(w => (typeof w === 'string' ? w : w.id) === v);
// Optional free text drops surrounding spaces; blank becomes null.
const optionalText = (s: string) => s.trim() || null;

export function validatePlayerDraft(draft: PlayerDraft): DraftErrors {
  const errors: DraftErrors = {}, { traits: t, appearance: a } = draft;
  const check = (key: string, ok: boolean, message: string) => { if (!ok) errors[key] = message; };
  const choose = (key: string, ok: boolean, what: string) => check(key, ok, `Choose a valid ${what}.`);
  check('currentName', name(draft.currentName), NAME_MESSAGE);
  check('birthName', draft.birthName === '' || name(draft.birthName), NAME_MESSAGE);
  check('label', draft.label.trim().length <= L.labelMax, `Label can be at most ${L.labelMax} characters.`);
  choose('pronouns', oneOf(draft.pronouns, ['she', 'he', 'they']), 'pronoun');
  choose('gender', oneOf(draft.gender, ['female', 'male', 'other']), 'gender');
  check('age', int(draft.age, [L.ageMin, L.ageMax]), `Age must be a whole number from ${L.ageMin} to ${L.ageMax}.`);
  choose('profession', oneOf(draft.profession, PLAYER_PROFESSIONS), 'profession');
  choose('birthplaceId', oneOf(draft.birthplaceId, PLACES.filter(p => p.regionId !== null)), 'birthplace');
  choose('regionId', oneOf(draft.regionId, REGIONS), 'region');
  choose('upbringing', oneOf(draft.upbringing, UPBRINGINGS), 'upbringing');
  check('biography', draft.biography.trim().length <= L.biographyMax, `Biography can be at most ${L.biographyMax} characters.`);
  for (const key of ['attractiveness', 'learningAptitude', 'warmth', 'intimacyKnowledge'] as const) {
    check(key, (key === 'intimacyKnowledge' && t[key] === null) || axis(t[key] as string), `${AXIS_NAMES[key]} must be a number from 0 to 100.`);
  }
  choose('presentation', oneOf(a.presentation, ['feminine', 'masculine', 'androgynous']), 'presentation');
  choose('skinTone', oneOf(a.skinTone, SKIN_TONES), 'skin tone');
  choose('eyeColor', oneOf(a.eyeColor, EYE_COLORS), 'eye color');
  choose('hairColor', oneOf(a.hair.color, HAIR_COLORS), 'hair color');
  choose('hairLength', oneOf(a.hair.length, HAIR_LENGTHS), 'hair length');
  choose('hairTexture', oneOf(a.hair.texture, HAIR_TEXTURES), 'hair texture');
  choose('hairStyle', oneOf(a.hair.style, HAIR_STYLES), 'hair style');
  choose('faceShape', oneOf(a.face.shape, FACE_SHAPES), 'face shape');
  // readDenseArray rejects holes, which every() would skip.
  const features = readDenseArray(a.face.features);
  choose('faceFeatures', features !== null && features.length <= L.faceFeaturesMax && features.every(f => oneOf(f, FACE_FEATURES)) &&
    new Set(features).size === features.length, 'set of face features');
  choose('build', oneOf(a.build, BUILDS), 'build');
  check('heightCm', int(a.heightCm, L.heightCm), `Height must be a whole number from ${L.heightCm[0]} to ${L.heightCm[1]} cm.`);
  check('weightKg', int(a.weightKg, L.weightKg), `Weight must be a whole number from ${L.weightKg[0]} to ${L.weightKg[1]} kg.`);
  for (const [key, label, range] of MEASUREMENTS) {
    if (a.measurements) check(key, int(a.measurements[key], range), `${label} must be a whole number from ${range[0]} to ${range[1]} cm.`);
  }
  choose('outfit', a.outfit === 'role_default' || oneOf(a.outfit, OUTFITS), 'outfit');
  choose('intimateHistory', draft.intimateHistory === null || oneOf(draft.intimateHistory, ['none', 'some']), 'intimate history');
  return errors;
}

export function createPlayerCharacter(draft: PlayerDraft): { success: true; value: PlayerCharacter } | { success: false; error: { code: 'INVALID_PLAYER'; message: string } } {
  const invalid = (message: string) => ({ success: false as const, error: { code: 'INVALID_PLAYER' as const, message } });
  const errors = validatePlayerDraft(draft);
  if (Object.keys(errors).length > 0) return invalid(Object.values(errors).join(' '));
  const { traits: t, appearance: a } = draft, m = a.measurements;
  // shortcut: Player keeps the shared NamedCharacter shape; relationshipToPlayer is unused until S2 directed relations replace it.
  const character = createNamedCharacter({ id: PLAYER_CHARACTER_ID, name: draft.currentName, gender: draft.gender, age: Number(draft.age),
    occupation: draft.profession as Occupation, socialClass: 'common', legalStatus: 'citizen' });
  // Fresh objects only: later edits to the draft must not reach the session.
  const value: PlayerCharacter = { character, profile: {
    id: PLAYER_CHARACTER_ID,
    identity: { birthName: draft.birthName || null, label: optionalText(draft.label), pronouns: draft.pronouns, birthplaceId: draft.birthplaceId,
      origin: { regionId: draft.regionId, upbringing: draft.upbringing }, currentLocationId: 'haven', biography: optionalText(draft.biography) },
    traits: { attractiveness: Number(t.attractiveness), learningAptitude: Number(t.learningAptitude), warmth: Number(t.warmth),
      ...(t.intimacyKnowledge !== null && { intimacyKnowledge: Number(t.intimacyKnowledge) }) },
    appearance: { presentation: a.presentation, skinTone: a.skinTone, eyeColor: a.eyeColor,
      hair: { color: a.hair.color, length: a.hair.length, texture: a.hair.texture, style: a.hair.style },
      face: { shape: a.face.shape, features: [...a.face.features] }, build: a.build, heightCm: Number(a.heightCm), weightKg: Number(a.weightKg),
      // The Player always knows their own measurements and history.
      ...(m && { measurements: { chestCm: Number(m.chestCm), waistCm: Number(m.waistCm), hipsCm: Number(m.hipsCm), disclosure: 'known' as const } }),
      outfit: a.outfit },
    ...(draft.intimateHistory && { private: { intimateHistory: { value: draft.intimateHistory, disclosure: 'known' as const } } }),
  } };
  return isPlayerCharacter(value) ? { success: true, value } : invalid('The player character could not be created.');
}

// The life session composes the NPC world session unchanged (seeded names, stats, posts) and adds the Player and starter profiles.
export function createCharacterLifeSession(seed: unknown, draft: PlayerDraft, economy?: Parameters<typeof createNpcWorldSession>[1]): { success: true; value: CharacterLifeSessionState } | { success: false; error: { code: string; message: string } } {
  const world = createNpcWorldSession(seed, economy);
  if (!world.success) return world;
  const player = createPlayerCharacter(draft);
  if (!player.success) return player;
  const value = { ...world.value, player: player.value, profiles: STARTER_PROFILES.map(p => structuredClone(p)) };
  return isCharacterLifeSessionState(value) ? { success: true, value }
    : { success: false, error: { code: 'INVALID_SESSION', message: 'Could not create the character life session.' } };
}
