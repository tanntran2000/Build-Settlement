import type { CharacterAppearance, CharacterProfile, Pronouns } from './types.js';

// Character Creation form state: numbers stay strings until validatePlayerDraft accepts them.
export interface PlayerDraft {
  currentName: string; birthName: string; label: string; pronouns: Pronouns; gender: 'female' | 'male' | 'other';
  age: string; profession: string; birthplaceId: string; regionId: string; upbringing: string; biography: string;
  traits: { attractiveness: string; learningAptitude: string; warmth: string; intimacyKnowledge: string | null };
  appearance: Omit<CharacterAppearance, 'heightCm' | 'weightKg' | 'measurements'> & {
    heightCm: string; weightKg: string; measurements: { chestCm: string; waistCm: string; hipsCm: string } | null };
  intimateHistory: 'none' | 'some' | null;
}

// PROVISIONAL trial content (plan Global Constraints): appearance values are not balance, the UI says so.
export const PLAYER_APPEARANCE_PRESETS: readonly { id: 'practical' | 'scholarly' | 'rugged'; label: string; appearance: PlayerDraft['appearance'] }[] = deepFreeze([
  { id: 'practical', label: 'Practical', appearance: { presentation: 'androgynous', skinTone: 'olive', eyeColor: 'brown',
    hair: { color: 'dark_brown', length: 'short', texture: 'straight', style: 'loose' }, face: { shape: 'oval', features: [] },
    build: 'average', heightCm: '170', weightKg: '68', measurements: null, outfit: 'role_default' } },
  { id: 'scholarly', label: 'Scholarly', appearance: { presentation: 'androgynous', skinTone: 'fair', eyeColor: 'blue',
    hair: { color: 'auburn', length: 'shoulder_length', texture: 'wavy', style: 'tied_back' }, face: { shape: 'long', features: ['glasses'] },
    build: 'slim', heightCm: '165', weightKg: '56', measurements: null, outfit: 'buttoned_coat' } },
  { id: 'rugged', label: 'Rugged', appearance: { presentation: 'androgynous', skinTone: 'tan', eyeColor: 'hazel',
    hair: { color: 'black', length: 'cropped', texture: 'curly', style: 'loose' }, face: { shape: 'square', features: ['scar'] },
    build: 'broad', heightCm: '180', weightKg: '82', measurements: null, outfit: 'padded_vest' } },
]);

export const DEFAULT_PLAYER_DRAFT: PlayerDraft = deepFreeze({
  currentName: '', birthName: '', label: '', pronouns: 'they', gender: 'other', age: '25', profession: 'worker',
  birthplaceId: 'kestrel_ford', regionId: 'northreach', upbringing: 'frontier', biography: '',
  traits: { attractiveness: '50', learningAptitude: '50', warmth: '50', intimacyKnowledge: null },
  appearance: structuredClone(PLAYER_APPEARANCE_PRESETS[0].appearance), intimateHistory: null,
});

// Profiles for WORLD_STARTER_NPCS in the same order; templates 1 and 2 are spec §12.4 Examples A and B.
// Names stay the seeded draw; nothing here overrides them.
const identity = (birthplaceId: string, regionId: string, upbringing: string): CharacterProfile['identity'] =>
  ({ birthName: null, label: null, pronouns: 'she', birthplaceId, origin: { regionId, upbringing }, currentLocationId: 'haven', biography: null });
export const STARTER_PROFILES: readonly CharacterProfile[] = deepFreeze([
  { id: 'npc_starter_1', identity: identity('kestrel_ford', 'northreach', 'frontier'), traits: { attractiveness: 66, learningAptitude: 72, warmth: 34 },
    appearance: { presentation: 'feminine', skinTone: 'light_olive', eyeColor: 'grey', hair: { color: 'brown', length: 'shoulder_length', texture: 'straight', style: 'tied_back' },
      face: { shape: 'oval', features: ['freckles'] }, build: 'slim', heightCm: 168, weightKg: 58, outfit: 'role_default' } },
  { id: 'npc_starter_2', identity: identity('tidewall', 'saltmere', 'port_town'), traits: { attractiveness: 50, learningAptitude: 55, warmth: 78 },
    appearance: { presentation: 'feminine', skinTone: 'deep_brown', eyeColor: 'brown', hair: { color: 'black', length: 'short', texture: 'straight', style: 'loose' },
      face: { shape: 'heart_shaped', features: ['glasses'] }, build: 'average', heightCm: 174, weightKg: 70, outfit: 'role_default' } },
  { id: 'npc_starter_3', identity: identity('cinder_hollow', 'ashfield', 'city'), traits: { attractiveness: 72, learningAptitude: 48, warmth: 45 },
    appearance: { presentation: 'feminine', skinTone: 'fair', eyeColor: 'green', hair: { color: 'red', length: 'long', texture: 'wavy', style: 'braided' },
      face: { shape: 'round', features: ['high_cheekbones'] }, build: 'slim', heightCm: 162, weightKg: 55, outfit: 'role_default' } },
]);

// Same pattern as catalog.ts (private there): sessions copy these templates, so they must not change at runtime.
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
