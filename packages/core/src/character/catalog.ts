import type { Occupation } from '../domain/character.js';

// PROVISIONAL trial catalogue (spec §6, §12.2, Addendum B): ids are stored, words are rendered English.
export const PLAYER_CHARACTER_ID = 'player';
// S1 is adult-only: every named character in this mode is 18–90.
export const CHARACTER_LIMITS = deepFreeze({
  nameMax: 64, labelMax: 40, biographyMax: 1000, ageMin: 18, ageMax: 90,
  heightCm: [140, 210], weightKg: [35, 180], chestCm: [60, 160], waistCm: [45, 150], hipsCm: [60, 170], faceFeaturesMax: 2,
} as const);

export interface Word { readonly id: string; readonly word: string }

export const SKIN_TONES: readonly Word[] = deepFreeze([
  { id: 'porcelain', word: 'porcelain' }, { id: 'fair', word: 'fair' }, { id: 'light_olive', word: 'light olive' }, { id: 'olive', word: 'olive' },
  { id: 'tan', word: 'tan' }, { id: 'brown', word: 'brown' }, { id: 'deep_brown', word: 'deep brown' },
]);
export const EYE_COLORS: readonly Word[] = deepFreeze([
  { id: 'brown', word: 'brown' }, { id: 'hazel', word: 'hazel' }, { id: 'green', word: 'green' },
  { id: 'blue', word: 'blue' }, { id: 'grey', word: 'grey' }, { id: 'amber', word: 'amber' },
]);
export const HAIR_COLORS: readonly Word[] = deepFreeze([
  { id: 'black', word: 'black' }, { id: 'dark_brown', word: 'dark brown' }, { id: 'brown', word: 'brown' }, { id: 'auburn', word: 'auburn' },
  { id: 'red', word: 'red' }, { id: 'blonde', word: 'blonde' }, { id: 'grey', word: 'grey' }, { id: 'white', word: 'white' },
]);
export const HAIR_LENGTHS: readonly Word[] = deepFreeze([
  { id: 'cropped', word: 'cropped' }, { id: 'short', word: 'short' }, { id: 'shoulder_length', word: 'shoulder-length' }, { id: 'long', word: 'long' },
]);
// `straight` renders nothing so the spec §12.4 examples stay unchanged.
export const HAIR_TEXTURES: readonly Word[] = deepFreeze([
  { id: 'straight', word: '' }, { id: 'wavy', word: 'wavy' }, { id: 'curly', word: 'curly' }, { id: 'coily', word: 'coily' },
]);
// Word is the suffix after "hair" in the long paragraph.
export const HAIR_STYLES: readonly Word[] = deepFreeze([
  { id: 'loose', word: '' }, { id: 'tied_back', word: ' tied back' }, { id: 'braided', word: ' in a braid' }, { id: 'bun', word: ' in a bun' },
]);
export const FACE_SHAPES: readonly Word[] = deepFreeze([
  { id: 'oval', word: 'oval' }, { id: 'round', word: 'round' }, { id: 'square', word: 'square' }, { id: 'heart_shaped', word: 'heart-shaped' }, { id: 'long', word: 'long' },
]);
export const FACE_FEATURES: readonly Word[] = deepFreeze([
  { id: 'freckles', word: 'is lightly freckled' }, { id: 'glasses', word: 'is framed by glasses' }, { id: 'high_cheekbones', word: 'has high cheekbones' },
  { id: 'strong_jaw', word: 'has a strong jaw' }, { id: 'scar', word: 'carries a small scar' },
]);
export const BUILDS: readonly { readonly id: string; readonly short: string; readonly long: string }[] = deepFreeze([
  { id: 'very_slim', short: 'very slim', long: 'a very slim build' }, { id: 'slim', short: 'slim', long: 'a slim build' },
  { id: 'average', short: 'average build', long: 'an average build' }, { id: 'sturdy', short: 'sturdy', long: 'a sturdy build' },
  { id: 'broad', short: 'broad', long: 'a broad build' }, { id: 'heavy_set', short: 'heavy-set', long: 'a heavy-set build' },
]);
export const UPBRINGINGS: readonly Word[] = deepFreeze([
  { id: 'frontier', word: 'on the frontier' }, { id: 'city', word: 'in a city' }, { id: 'port_town', word: 'in a port town' }, { id: 'farmstead', word: 'on a farmstead' },
]);

// Fictional regions only; no real nationality or ethnicity mapping.
export const REGIONS: readonly { readonly id: string; readonly name: string }[] = deepFreeze([
  { id: 'northreach', name: 'Northreach' }, { id: 'saltmere', name: 'Saltmere' }, { id: 'ashfield', name: 'Ashfield' }, { id: 'greywater', name: 'Greywater' },
]);
// A place with regionId null (Haven) is a current location only, never a birthplace.
export const PLACES: readonly { readonly id: string; readonly name: string; readonly regionId: string | null }[] = deepFreeze([
  { id: 'kestrel_ford', name: 'Kestrel Ford', regionId: 'northreach' }, { id: 'tidewall', name: 'Tidewall', regionId: 'saltmere' },
  { id: 'cinder_hollow', name: 'Cinder Hollow', regionId: 'ashfield' }, { id: 'millbrook', name: 'Millbrook', regionId: 'greywater' },
  { id: 'haven', name: 'Haven', regionId: null },
]);

export const PROFESSION_LABELS: Readonly<Record<Occupation, string>> = deepFreeze({
  unassigned: 'unassigned', worker: 'worker', technician: 'technician', doctor: 'doctor', farmer: 'farmer',
  security: 'security officer', manager: 'manager', trader: 'trader', advisor: 'advisor', governor: 'governor',
});
export const PLAYER_PROFESSIONS: readonly Occupation[] = deepFreeze(['worker', 'technician', 'doctor', 'farmer', 'security', 'manager', 'trader', 'advisor']);

// `role_default` is also a valid stored outfit: it resolves through ROLE_OUTFITS, then PROFESSION_OUTFITS.
export const OUTFITS: readonly { readonly id: string; readonly phrase: string }[] = deepFreeze([
  { id: 'work_clothes', phrase: 'a wide-brimmed hat and work clothes' },
  { id: 'canvas_jacket', phrase: 'a canvas work jacket and heavy trousers' },
  { id: 'padded_vest', phrase: 'a padded vest and heavy boots' },
  { id: 'reinforced_jacket', phrase: 'a reinforced jacket and a lamp helmet' },
  { id: 'leather_apron', phrase: 'a leather apron over plain clothes' },
  { id: 'ledger_vest', phrase: 'a neat vest with a ledger at hand' },
  { id: 'buttoned_coat', phrase: 'a long buttoned coat over practical clothes' },
  { id: 'travelling_coat', phrase: 'a neat vest over a travelling coat' },
  { id: 'plain_practical', phrase: 'plain practical clothes' },
]);
// Keyed by the post's building typeId.
export const ROLE_OUTFITS: Readonly<Record<string, string>> = deepFreeze({
  farm: 'work_clothes', processor: 'canvas_jacket', logging: 'padded_vest', mine: 'reinforced_jacket', workshop: 'leather_apron', market: 'ledger_vest',
});
// Used when unassigned; professions without a spec default use plain practical clothes.
export const PROFESSION_OUTFITS: Readonly<Record<Occupation, string>> = deepFreeze({
  unassigned: 'plain_practical', worker: 'plain_practical', technician: 'canvas_jacket', doctor: 'buttoned_coat', farmer: 'plain_practical',
  security: 'plain_practical', manager: 'plain_practical', trader: 'travelling_coat', advisor: 'plain_practical', governor: 'plain_practical',
});

// Same pattern as world/npc-content.ts: validators read these shared objects, so they must not change at runtime.
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
