import type { NamedCharacter } from '../domain/character.js';
import { TRIAL_BUILDINGS } from '../trial/catalog.js';
import {
  BUILDS, EYE_COLORS, FACE_FEATURES, FACE_SHAPES, HAIR_COLORS, HAIR_LENGTHS, HAIR_STYLES, HAIR_TEXTURES, OUTFITS, PLACES,
  PROFESSION_LABELS, PROFESSION_OUTFITS, REGIONS, ROLE_OUTFITS, SKIN_TONES, UPBRINGINGS, type Word,
} from './catalog.js';
import type { CharacterProfile } from './types.js';

// English renderer (spec §5, §6.3, §12, Addendum B). Text is derived from data only and never stored.
export interface CharacterView { character: NamedCharacter; profile: CharacterProfile; role: 'player' | 'npc'; postBuildingName: string | null }
export type Axis = 'attractiveness' | 'learningAptitude' | 'warmth';
type Band = { short: string; long: string };

// Interval rules on the stored value, no rounding: [0,a) [a,b) [b,c] (c,d] (d,100]; the middle band is null.
const AXIS_BANDS: Record<Axis, { edges: [number, number, number, number]; bands: [Band, Band, Band, Band] }> = {
  attractiveness: { edges: [15, 40, 60, 85], bands: [
    { short: 'plain-looking', long: 'plain-looking' }, { short: 'unremarkable', long: 'unremarkable in looks' },
    { short: 'attractive', long: 'attractive' }, { short: 'striking', long: 'striking' }] },
  learningAptitude: { edges: [20, 40, 60, 80], bands: [
    { short: 'slow learner', long: 'a slow learner' }, { short: 'steady learner', long: 'a steady learner' },
    { short: 'quick learner', long: 'a quick learner' }, { short: 'exceptionally quick learner', long: 'an exceptionally quick learner' }] },
  warmth: { edges: [20, 40, 60, 80], bands: [
    { short: 'cold', long: 'cold toward others' }, { short: 'reserved', long: 'reserved with strangers' },
    { short: 'friendly', long: 'friendly toward most people' }, { short: 'very warm', long: 'very warm toward everyone' }] },
};
export function axisBand(axis: Axis, value: number): Band | null {
  const { edges: [a, b, c, d], bands } = AXIS_BANDS[axis];
  if (value < a) return bands[0];
  if (value < b) return bands[1];
  if (value <= c) return null;
  return value <= d ? bands[2] : bands[3];
}
export function heightBand(cm: number): Band {
  if (cm < 155) return { short: 'short', long: 'short' };
  if (cm < 170) return { short: 'average height', long: 'of average height' };
  return cm < 185 ? { short: 'tall', long: 'tall' } : { short: 'very tall', long: 'very tall' };
}

const AXES: Axis[] = ['attractiveness', 'learningAptitude', 'warmth'];
const PRONOUNS = { she: ['she', 'her'], he: ['he', 'his'], they: ['they', 'their'] } as const;
const word = (list: readonly Word[], id: string) => list.find(w => w.id === id)?.word ?? id;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const article = (s: string) => (/^[aeiou]/i.test(s) ? 'an ' : 'a ') + s;
const joinList = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
// Spec §12.1: ids render with underscores as spaces, except these three hyphenated words.
const idWord = (id: string) => ({ shoulder_length: 'shoulder-length', heart_shaped: 'heart-shaped', heavy_set: 'heavy-set' } as Record<string, string>)[id] ?? id.replace(/_/g, ' ');
const regionName = (p: CharacterProfile) => REGIONS.find(r => r.id === p.identity.origin.regionId)?.name ?? p.identity.origin.regionId;
const placeName = (id: string) => PLACES.find(p => p.id === id)?.name ?? id;
// `unassigned` is not a trade, so it is rendered as no profession.
const profession = (c: NamedCharacter) => c.occupation === 'unassigned' ? null : PROFESSION_LABELS[c.occupation];
const hairWords = (p: CharacterProfile) => [word(HAIR_LENGTHS, p.appearance.hair.length), word(HAIR_TEXTURES, p.appearance.hair.texture), word(HAIR_COLORS, p.appearance.hair.color)].filter(Boolean).join(' ');

function outfitPhrase(view: CharacterView): string {
  const { outfit } = view.profile.appearance;
  const typeId = Object.keys(TRIAL_BUILDINGS).find(id => TRIAL_BUILDINGS[id].name === view.postBuildingName);
  const id = outfit !== 'role_default' ? outfit : (typeId && ROLE_OUTFITS[typeId]) || PROFESSION_OUTFITS[view.character.occupation];
  return OUTFITS.find(o => o.id === id)?.phrase ?? id;
}

export function describeShort({ character, profile }: CharacterView): string {
  const job = profession(character);
  const a = profile.appearance;
  return [
    character.name, String(character.age), job ? `${cap(job)} from ${regionName(profile)}` : `from ${regionName(profile)}`,
    `${heightBand(a.heightCm).short}, ${BUILDS.find(b => b.id === a.build)?.short ?? a.build}`,
    `${word(SKIN_TONES, a.skinTone)} skin`, `${hairWords(profile)} hair`, `${word(EYE_COLORS, a.eyeColor)} eyes`,
    ...AXES.map(axis => axisBand(axis, profile.traits[axis])?.short ?? ''),
  ].filter(Boolean).join(' · ');
}

export function describeLong(view: CharacterView): string {
  const { character, profile, role, postBuildingName } = view;
  const a = profile.appearance;
  const [subject, possessive] = PRONOUNS[profile.identity.pronouns];
  // "they" takes the plural verb form in every sentence.
  const verb = (singular: string, plural: string) => profile.identity.pronouns === 'they' ? plural : singular;
  const features = a.face.features.map(f => word(FACE_FEATURES, f));
  const face = word(FACE_SHAPES, a.face.shape);
  const axes = AXES.map(axis => axisBand(axis, profile.traits[axis])?.long).filter((s): s is string => !!s);
  const job = profession(character);
  const assignment = postBuildingName === null ? `currently ${verb('holds', 'hold')} no post` : `currently ${verb('manages', 'manage')} the ${postBuildingName}`;
  const work = role === 'player'
    ? `${cap(subject)} ${job ? `trained as ${article(job)} and now ` : 'now '}${verb('leads', 'lead')} Haven.`
    : job ? `Trained as ${article(job)}, ${subject} ${assignment}.` : `${cap(subject)} ${assignment}.`;
  return [
    `${character.name}, ${character.age}, grew up ${word(UPBRINGINGS, profile.identity.origin.upbringing)} in ${regionName(profile)}.`,
    `${cap(subject)} ${verb('is', 'are')} ${heightBand(a.heightCm).long} with ${BUILDS.find(b => b.id === a.build)?.long ?? a.build}, ${word(SKIN_TONES, a.skinTone)} skin and ${hairWords(profile)} hair${word(HAIR_STYLES, a.hair.style)}.`,
    features.length
      ? `${cap(possessive)} ${face} face ${features.join(' and ')}; ${subject} ${verb('wears', 'wear')} ${outfitPhrase(view)}.`
      : `${cap(possessive)} face is ${face}; ${subject} ${verb('wears', 'wear')} ${outfitPhrase(view)}.`,
    axes.length ? `${cap(subject)} ${verb('is', 'are')} ${joinList(axes)}.` : '',
    work,
    profile.identity.biography ?? '',
  ].filter(Boolean).join(' ');
}

// Private adult fields (traits.intimacyKnowledge, profile.private) are never listed; the UI renders them separately.
export function profileRows({ character, profile, role, postBuildingName }: CharacterView): { label: string; value: string }[] {
  const { identity, appearance: a, traits } = profile;
  const m = a.measurements;
  const job = profession(character);
  const rows: [string, string][] = [['Name', character.name]];
  if (identity.birthName !== null && identity.birthName !== character.name) rows.push(['Birth name', identity.birthName]);
  if (identity.label !== null) rows.push(['Label', identity.label]);
  rows.push(
    ['Age', String(character.age)], ['Profession', job ? cap(job) : 'None'],
    ['Current post', role === 'player' ? 'Leader of Haven' : postBuildingName ?? 'None'],
    ['Birthplace', placeName(identity.birthplaceId)], ['Origin', `${regionName(profile)} (${idWord(identity.origin.upbringing)})`],
    ['Current location', placeName(identity.currentLocationId)], ['Height', `${a.heightCm} cm`], ['Weight', `${a.weightKg} kg`],
    ['Build', idWord(a.build)], ['Skin', word(SKIN_TONES, a.skinTone)],
    ['Hair', [hairWords(profile), word(HAIR_STYLES, a.hair.style).trim()].filter(Boolean).join(', ')], ['Eyes', word(EYE_COLORS, a.eyeColor)],
    ['Face', [word(FACE_SHAPES, a.face.shape), ...a.face.features.map(idWord)].join(', ')],
    ['Measurements', m?.disclosure === 'known' ? `${m.chestCm} / ${m.waistCm} / ${m.hipsCm} cm` : 'Unknown'],
    ...AXES.map((axis, i): [string, string] => {
      const band = axisBand(axis, traits[axis]);
      return [['Attractiveness', 'Learning Aptitude', 'Warmth'][i], band ? `${traits[axis]} (${band.short})` : String(traits[axis])];
    }),
  );
  return rows.map(([label, value]) => ({ label, value }));
}
