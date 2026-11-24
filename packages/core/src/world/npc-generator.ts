import generatorJson from '../data/npc-generator.json' with { type: 'json' };
import { deepFreeze, validateNpcGenerator } from '../data/validate.js';
import { createNamedCharacter } from '../domain/character.js';
import { SOCIAL_RESOURCE_SCALE } from '../social/profile.js';
import type { CharacterProfile } from '../character/types.js';
import { WORLD_TRAITS } from './npc-content.js';
import { createNpcLifeFromDraws, NPC_HOBBIES, NPC_ORIGINS, npcLifeRandom, P7A_TRIAL, type SexPart } from './npc-life.js';
import type { NpcHousehold } from './npc-household.js';
import type { WorldNpc } from './npc.js';

export type AcquisitionSource = 'guild' | 'auction-house' | 'slave-market';
export const NPC_GENERATOR_CATALOG = deepFreeze(validateNpcGenerator(generatorJson));
export const P7B_TRIAL = NPC_GENERATOR_CATALOG.P7B_TRIAL;

type Random = () => number;
const drawOne = <T>(random: Random, values: readonly T[]): T => values[Math.floor(random() * values.length)];
const drawRange = (random: Random, [minimum, maximum]: readonly [number, number]): number =>
  minimum + Math.floor(random() * (maximum - minimum + 1));

function drawEpithet(seed: number, id: string, epithets: readonly string[], first: string, nameSalt: number): string {
  const unused = epithets.filter(epithet => epithet !== first);
  let epithet = first;
  for (let attempt = 1; attempt <= nameSalt; attempt += 1) {
    const index = Math.floor(npcLifeRandom(seed, id + ':name:' + attempt)() * unused.length);
    epithet = unused.splice(index, 1)[0];
  }
  return epithet;
}

// Resolve market display names without generating a full NPC or consuming her stat stream.
export function marketNpcName(seed: number, week: number, source: AcquisitionSource, slot: number | 'lot', nameSalt: number):
  { name: string; generatorSalt: number } {
  const id = `npc_w${week}_${source}_${slot}`;
  const random = npcLifeRandom(seed, id);
  const catalog = NPC_GENERATOR_CATALOG;
  const origin = drawOne(random, Object.keys(NPC_ORIGINS));
  const culture = catalog.cultures[catalog.originCulture[origin]];
  const given = drawOne(random, culture.given), first = drawOne(random, culture.epithets);
  const generatorSalt = nameSalt % culture.epithets.length;
  const epithet = drawEpithet(seed, id, culture.epithets, first, generatorSalt);
  const suffix = nameSalt === generatorSalt ? '' : '-' + nameSalt.toString(36);
  return { name: given + ' ' + epithet + suffix, generatorSalt };
}

function drawDistinct<T>(random: Random, values: readonly T[], count: number): T[] {
  const remaining = [...values];
  return Array.from({ length: count }, () => remaining.splice(Math.floor(random() * remaining.length), 1)[0]);
}

function drawAppearance(random: Random): CharacterProfile['appearance'] {
  const a = NPC_GENERATOR_CATALOG.appearance;
  const result: CharacterProfile['appearance'] = {
    presentation: drawOne(random, a.presentation),
    skinTone: drawOne(random, a.skinTone),
    eyeColor: drawOne(random, a.eyeColor),
    hair: { color: drawOne(random, a.hair.color), length: drawOne(random, a.hair.length),
      texture: drawOne(random, a.hair.texture), style: drawOne(random, a.hair.style) },
    face: { shape: drawOne(random, a.face.shape), features: [...drawOne(random, a.face.features)] },
    build: drawOne(random, a.build),
    heightCm: drawOne(random, a.heightCm),
    weightKg: drawOne(random, a.weightKg),
    outfit: drawOne(random, a.outfit),
  };
  const measurements = drawOne(random, a.measurements);
  return measurements ? { ...result, measurements: { ...measurements } } : result;
}

function rollPast(life: WorldNpc['life'], random: Random, range: readonly [number, number]): void {
  const counters = life.history.counters;
  let partners = 0;
  for (const part of Object.keys(life.sexExp) as SexPart[]) {
    const count = drawRange(random, range);
    counters[`sex.${part}.outsider`] = count;
    partners += count;
    const level = count >= P7B_TRIAL.expertAtCount ? 'expert' : count >= P7B_TRIAL.professionalAtCount ? 'professional' : 'novice';
    life.sexExp[part] = { level, exp: Math.min(count, P7A_TRIAL.sexExpCaps[level]) };
  }
  counters['partners.outsider'] = partners;
  for (const key of ['brothel.customers', 'act.threesome', 'act.withNpc']) counters[key] = drawRange(random, range);
}

export function generateNpc(seed: number, week: number, source: AcquisitionSource, slot: number | 'lot', nameSalt = 0):
  { npc: WorldNpc; profile: CharacterProfile } {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295 ||
      !Number.isSafeInteger(week) || week <= 0 || !Number.isSafeInteger(nameSalt) || nameSalt < 0 ||
      (source !== 'guild' && source !== 'auction-house' && source !== 'slave-market') ||
      (slot === 'lot' ? source === 'guild' : !Number.isSafeInteger(slot) || slot < 0 || slot >= P7B_TRIAL.stockSize))
    throw new RangeError('Invalid NPC generator key.');
  const id = `npc_w${week}_${source}_${slot}`;
  const random = npcLifeRandom(seed, id);
  const catalog = NPC_GENERATOR_CATALOG;
  const sourceId: keyof typeof catalog.sources = slot === 'lot' && source !== 'guild' ? `${source}-lot` : source;
  const row = catalog.sources[sourceId];
  const origin = drawOne(random, Object.keys(NPC_ORIGINS));
  const culture = catalog.cultures[catalog.originCulture[origin]];
  const given = drawOne(random, culture.given), first = drawOne(random, culture.epithets);
  if (nameSalt >= culture.epithets.length) throw new RangeError('No more epithets are available for this NPC key.');
  const name = given + ' ' + drawEpithet(seed, id, culture.epithets, first, nameSalt);
  const age = drawRange(random, random() < P7B_TRIAL.ageWeightYoung ? P7B_TRIAL.youngAge : P7B_TRIAL.olderAge);
  const skills = {
    management: drawRange(random, row.skills), technical: drawRange(random, row.skills), medical: drawRange(random, row.skills),
    combat: drawRange(random, row.skills), negotiation: drawRange(random, row.skills),
  };
  const traits = drawDistinct(random, WORLD_TRAITS.map(trait => trait.id), drawRange(random, P7B_TRIAL.traitCount));
  const background = catalog.originProfile[origin];
  const allowedClasses = row.socialClass.filter(id => source !== 'guild' || id === background.guildClass);
  const socialClass = drawOne(random, allowedClasses);
  const mind = drawRange(random, row.mind);
  const lustBase = drawRange(random, P7A_TRIAL.lustBase);
  const beauty = drawRange(random, row.beauty);
  const [firstHobby, secondHobby] = drawDistinct(random, Object.keys(NPC_HOBBIES), 2);
  const life = createNpcLifeFromDraws({ mind, lustBase, beauty, birthWeek: week - age * P7A_TRIAL.weeksPerYear,
    origin, hobbies: [firstHobby, secondHobby] });
  const obedience = drawRange(random, row.obedience);
  const affection = drawRange(random, row.affection);
  const preference = { id: drawOne(random, catalog.preferences), strength: drawRange(random, P7B_TRIAL.statRange) };
  const flaw = { id: drawOne(random, catalog.flaws), strength: drawRange(random, P7B_TRIAL.statRange) };
  const appearance = drawAppearance(random);
  rollPast(life, random, row.past);
  const [minimumWage, maximumWage] = P7B_TRIAL.wageMilli;
  const contract = row.status === 'servant' ? {
    weeksLeft: P7B_TRIAL.contractWeeks,
    wageMilli: drawRange(random, [minimumWage / SOCIAL_RESOURCE_SCALE, maximumWage / SOCIAL_RESOURCE_SCALE]) * SOCIAL_RESOURCE_SCALE,
    unpaidWeeks: 0, stressHits: 0,
  } : null;
  const character = createNamedCharacter({ id, name, gender: 'female', age, occupation: background.occupation, socialClass,
    legalStatus: row.status === 'slave' ? 'enslaved' : 'contract_bound', skills });
  character.relationshipToPlayer.affection = affection;
  const household: NpcHousehold = {
    home: 'estate-2', status: row.status, obedience, contract, will: { preference, flaw }, notice: null, lifelongAskWeek: null, source, boughtWeek: week,
  };
  const profile: CharacterProfile = {
    id,
    identity: { birthName: null, label: null, pronouns: 'she', birthplaceId: background.birthplaceId,
      origin: { regionId: background.regionId, upbringing: background.upbringing }, currentLocationId: 'haven', biography: null },
    traits: { attractiveness: life.beauty, learningAptitude: drawRange(random, P7B_TRIAL.profileAxisRange), warmth: drawRange(random, P7B_TRIAL.profileAxisRange) },
    appearance,
  };
  return { npc: { character, traits, postTileId: null, life, household }, profile };
}
