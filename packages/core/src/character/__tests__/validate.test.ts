import { describe, expect, it } from 'vitest';
import { createNamedCharacter, type NamedCharacter } from '../../domain/character.js';
import { createNpcWorldSession, isNamedCharacterRecord, isWorldNpcList } from '../../world/npc.js';
import { CHARACTER_LIMITS, PLAYER_CHARACTER_ID, PLAYER_PROFESSIONS, PLACES } from '../catalog.js';
import type { CharacterProfile } from '../types.js';
import { isCharacterLifeSessionState, isCharacterProfile, isPlayerCharacter } from '../validate.js';

type Mutable = Record<string, any>;
const npcSession = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return r.value; };
const base = (id: string): CharacterProfile => ({
  id,
  identity: { birthName: null, label: null, pronouns: 'she', birthplaceId: 'kestrel_ford', origin: { regionId: 'northreach', upbringing: 'frontier' }, currentLocationId: 'haven', biography: null },
  traits: { attractiveness: 66, learningAptitude: 72, warmth: 34 },
  appearance: { presentation: 'feminine', skinTone: 'light_olive', eyeColor: 'grey', hair: { color: 'brown', length: 'shoulder_length', texture: 'straight', style: 'tied_back' },
    face: { shape: 'oval', features: ['freckles'] }, build: 'slim', heightCm: 168, weightKg: 58, outfit: 'role_default' },
});
const starterProfiles = (): CharacterProfile[] => {
  const ruth = base('npc_starter_2');
  ruth.identity = { ...ruth.identity, birthplaceId: 'tidewall', origin: { regionId: 'saltmere', upbringing: 'port_town' } };
  ruth.appearance = { ...ruth.appearance, skinTone: 'deep_brown', eyeColor: 'brown', hair: { color: 'black', length: 'short', texture: 'straight', style: 'loose' },
    face: { shape: 'heart_shaped', features: ['glasses'] }, build: 'average', heightCm: 174, weightKg: 70 };
  ruth.traits = { attractiveness: 50, learningAptitude: 55, warmth: 78 };
  const third = base('npc_starter_3');
  third.identity = { ...third.identity, birthplaceId: 'cinder_hollow', origin: { regionId: 'ashfield', upbringing: 'city' } };
  third.appearance = { ...third.appearance, skinTone: 'fair', eyeColor: 'green', hair: { color: 'red', length: 'long', texture: 'wavy', style: 'braided' },
    face: { shape: 'round', features: ['high_cheekbones'] }, heightCm: 162, weightKg: 55 };
  third.traits = { attractiveness: 72, learningAptitude: 48, warmth: 45 };
  return [base('npc_starter_1'), ruth, third];
};
const playerCharacter = (over: Partial<NamedCharacter> = {}) => createNamedCharacter({ id: PLAYER_CHARACTER_ID, name: 'Ana', gender: 'other', age: 25, occupation: 'advisor', socialClass: 'common', legalStatus: 'citizen', ...over });
const player = () => {
  const profile = base(PLAYER_CHARACTER_ID);
  profile.identity = { ...profile.identity, pronouns: 'they', birthName: 'Anabel', label: 'The Mechanic', biography: 'Came west after the floods.' };
  profile.traits = { ...profile.traits, intimacyKnowledge: 40 };
  profile.appearance = { ...profile.appearance, presentation: 'androgynous', measurements: { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'known' } };
  profile.private = { intimateHistory: { value: 'some', disclosure: 'known' } };
  return { character: playerCharacter(), profile };
};
const lifeSession = () => ({ ...npcSession(), player: player(), profiles: starterProfiles() });
const character = (age = 27) => ({ ...npcSession().npcs[0].character, age });
const profileWith = (mutate: (p: Mutable) => void, id = 'npc_starter_1') => { const p = structuredClone(base(id)) as Mutable; mutate(p); return p; };
const valid = (mutate: (p: Mutable) => void) => isCharacterProfile(profileWith(mutate), character());

describe('isCharacterProfile', () => {
  it('accepts a valid profile for each starter', () => {
    const npcs = npcSession().npcs, profiles = starterProfiles();
    npcs.forEach((npc, i) => expect(isCharacterProfile(profiles[i], npc.character)).toBe(true));
  });
  it('accepts optional adult fields, measurements and texts on an adult', () => {
    expect(isCharacterProfile(player().profile, playerCharacter())).toBe(true);
    expect(valid(p => { p.appearance.measurements = { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'unknown' }; })).toBe(true);
  });
  it('rejects profile id mismatch', () => {
    expect(isCharacterProfile(base('npc_starter_2'), character())).toBe(false);
  });
  it('rejects axis -0.1, 100.1, NaN, Infinity', () => {
    for (const v of [-0.1, 100.1, NaN, Infinity, -Infinity, '50', null])
      for (const axis of ['attractiveness', 'learningAptitude', 'warmth', 'intimacyKnowledge'])
        expect(valid(p => { p.traits[axis] = v; })).toBe(false);
  });
  it('accepts axis 0, 37.5, 100', () => {
    for (const v of [0, 37.5, 100]) expect(valid(p => { p.traits.attractiveness = v; p.traits.warmth = v; p.traits.intimacyKnowledge = v; })).toBe(true);
  });
  it('rejects name "  ", " Ana", 65-char label, 1001-char biography', () => {
    for (const v of ['  ', ' Ana', 'Ana ', '', 'a'.repeat(CHARACTER_LIMITS.nameMax + 1)]) expect(valid(p => { p.identity.birthName = v; })).toBe(false);
    expect(valid(p => { p.identity.birthName = 'a'.repeat(CHARACTER_LIMITS.nameMax); })).toBe(true);
    expect(valid(p => { p.identity.label = 'a'.repeat(65); })).toBe(false);
    expect(valid(p => { p.identity.label = 'a'.repeat(CHARACTER_LIMITS.labelMax + 1); })).toBe(false);
    expect(valid(p => { p.identity.label = 'a'.repeat(CHARACTER_LIMITS.labelMax); })).toBe(true);
    expect(valid(p => { p.identity.biography = 'a'.repeat(CHARACTER_LIMITS.biographyMax + 1); })).toBe(false);
    expect(valid(p => { p.identity.biography = 'a'.repeat(CHARACTER_LIMITS.biographyMax); })).toBe(true);
    // createNamedCharacter trims names, so set the raw value after creation.
    expect(isPlayerCharacter({ ...player(), character: { ...playerCharacter(), name: ' Ana' } })).toBe(false);
    expect(isPlayerCharacter({ ...player(), character: { ...playerCharacter(), name: '  ' } })).toBe(false);
  });
  it('rejects unknown skinTone, three features, duplicate features', () => {
    expect(valid(p => { p.appearance.skinTone = 'green'; })).toBe(false);
    expect(valid(p => { p.appearance.face.features = ['freckles', 'glasses', 'scar']; })).toBe(false);
    expect(valid(p => { p.appearance.face.features = ['freckles', 'freckles']; })).toBe(false);
    expect(valid(p => { p.appearance.face.features = ['freckles', 'glasses']; })).toBe(true);
    expect(valid(p => { p.appearance.face.features = []; })).toBe(true);
  });
  it('rejects unknown ids in every list', () => {
    const cases: ((p: Mutable) => void)[] = [
      p => { p.identity.pronouns = 'it'; }, p => { p.identity.origin.regionId = 'atlantis'; }, p => { p.identity.origin.upbringing = 'castle'; },
      p => { p.identity.currentLocationId = 'nowhere'; }, p => { p.appearance.presentation = 'other'; }, p => { p.appearance.eyeColor = 'red'; },
      p => { p.appearance.hair.color = 'blue'; }, p => { p.appearance.hair.length = 'medium'; }, p => { p.appearance.hair.texture = 'frizzy'; },
      p => { p.appearance.hair.style = 'mohawk'; }, p => { p.appearance.face.shape = 'triangle'; }, p => { p.appearance.face.features = ['tattoo']; },
      p => { p.appearance.build = 'huge'; }, p => { p.appearance.outfit = 'armor'; }, p => { p.appearance.measurements = { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'maybe' }; },
    ];
    cases.forEach(c => expect(valid(c)).toBe(false));
    expect(valid(p => { p.appearance.outfit = 'canvas_jacket'; p.identity.currentLocationId = 'tidewall'; })).toBe(true);
  });
  it('rejects heightCm 139, 211, 170.5', () => {
    for (const v of [139, 211, 170.5, NaN, '170']) expect(valid(p => { p.appearance.heightCm = v; })).toBe(false);
    for (const v of [140, 210]) expect(valid(p => { p.appearance.heightCm = v; })).toBe(true);
    for (const v of [34, 181, 58.5]) expect(valid(p => { p.appearance.weightKg = v; })).toBe(false);
    for (const [k, lo, hi] of [['chestCm', 60, 160], ['waistCm', 45, 150], ['hipsCm', 60, 170]] as const) {
      for (const v of [lo - 1, hi + 1, lo + 0.5]) expect(valid(p => { p.appearance.measurements = { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'known', [k]: v }; })).toBe(false);
      for (const v of [lo, hi]) expect(valid(p => { p.appearance.measurements = { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'known', [k]: v }; })).toBe(true);
    }
  });
  it('rejects birthplace "haven"', () => {
    expect(PLACES.find(p => p.id === 'haven')?.regionId).toBeNull();
    expect(valid(p => { p.identity.birthplaceId = 'haven'; })).toBe(false);
    expect(valid(p => { p.identity.birthplaceId = 'atlantis'; })).toBe(false);
  });
  it('rejects intimacyKnowledge or private when character.age is 17', () => {
    const minor = character(17);
    expect(isCharacterProfile(base('npc_starter_1'), minor)).toBe(true);
    expect(isCharacterProfile(profileWith(p => { p.traits.intimacyKnowledge = 0; }), minor)).toBe(false);
    expect(isCharacterProfile(profileWith(p => { p.private = { intimateHistory: { value: 'none', disclosure: 'unknown' } }; }), minor)).toBe(false);
    expect(isCharacterProfile(profileWith(p => { p.traits.intimacyKnowledge = 0; p.private = { intimateHistory: { value: 'none', disclosure: 'unknown' } }; }), character(18))).toBe(true);
  });
  it('rejects wrong key sets and malformed private metadata', () => {
    const cases: ((p: Mutable) => void)[] = [
      p => { p.extra = 1; }, p => { delete p.appearance; }, p => { p.identity.currentName = 'Ana'; }, p => { delete p.identity.biography; },
      p => { p.identity.origin.extra = 1; }, p => { p.traits.charm = 50; }, p => { p.appearance.hair.extra = 'x'; }, p => { p.appearance.face.extra = 'x'; },
      p => { p.appearance.measurements = { chestCm: 86, waistCm: 68, hipsCm: 92 }; }, p => { p.private = {}; },
      p => { p.private = { intimateHistory: { value: 'unknown', disclosure: 'known' } }; }, p => { p.private = { intimateHistory: { value: 'none', disclosure: 'known' }, note: 'x' }; },
      p => { p.appearance.face.features = 'freckles'; },
    ];
    cases.forEach(c => expect(valid(c)).toBe(false));
    expect(isCharacterProfile(null, character())).toBe(false);
    expect(isCharacterProfile([], character())).toBe(false);
  });
});

describe('isPlayerCharacter', () => {
  it('accepts a valid player', () => { expect(isPlayerCharacter(player())).toBe(true); });
  it('rejects player occupation "governor" and age 17', () => {
    expect(PLAYER_PROFESSIONS).not.toContain('governor');
    expect(PLAYER_PROFESSIONS).not.toContain('unassigned');
    expect(isPlayerCharacter({ ...player(), character: playerCharacter({ occupation: 'governor' }) })).toBe(false);
    expect(isPlayerCharacter({ ...player(), character: playerCharacter({ occupation: 'unassigned' }) })).toBe(false);
    const young = player(); young.character = playerCharacter({ age: 17 }); delete young.profile.private; delete young.profile.traits.intimacyKnowledge;
    expect(isPlayerCharacter(young)).toBe(false);
    expect(isPlayerCharacter({ ...player(), character: playerCharacter({ age: 91 }) })).toBe(false);
    expect(isPlayerCharacter({ ...player(), character: playerCharacter({ age: 18 }) })).toBe(true);
    expect(isPlayerCharacter({ ...player(), character: playerCharacter({ age: 90 }) })).toBe(true);
  });
  it('rejects player measurements with disclosure "unknown"', () => {
    const p = player(); p.profile.appearance.measurements!.disclosure = 'unknown';
    expect(isPlayerCharacter(p)).toBe(false);
    const q = player(); q.profile.private!.intimateHistory.disclosure = 'unknown';
    expect(isPlayerCharacter(q)).toBe(false);
  });
  it('rejects wrong id, extra keys and a mismatched profile', () => {
    expect(isPlayerCharacter({ ...player(), character: playerCharacter({ id: 'npc_starter_1' }) })).toBe(false);
    expect(isPlayerCharacter({ ...player(), extra: 1 })).toBe(false);
    expect(isPlayerCharacter({ ...player(), profile: base('npc_starter_1') })).toBe(false);
    expect(isPlayerCharacter({ character: { ...playerCharacter(), memories: [{ id: 'm' }] }, profile: player().profile })).toBe(false);
  });
});

describe('isCharacterLifeSessionState', () => {
  it('accepts a valid life session', () => { expect(isCharacterLifeSessionState(lifeSession())).toBe(true); });
  it('rejects session with profiles reordered, missing, extra, or extra top-level key', () => {
    const s = lifeSession();
    expect(isCharacterLifeSessionState({ ...s, profiles: [s.profiles[1], s.profiles[0], s.profiles[2]] })).toBe(false);
    expect(isCharacterLifeSessionState({ ...s, profiles: s.profiles.slice(0, 2) })).toBe(false);
    expect(isCharacterLifeSessionState({ ...s, profiles: [...s.profiles, base('npc_starter_4')] })).toBe(false);
    expect(isCharacterLifeSessionState({ ...s, extra: 1 })).toBe(false);
    const { player: _p, ...noPlayer } = s;
    expect(isCharacterLifeSessionState(noPlayer)).toBe(false);
    const sparse = [...s.profiles]; delete (sparse as unknown[])[1];
    expect(isCharacterLifeSessionState({ ...s, profiles: sparse })).toBe(false);
    expect(isCharacterLifeSessionState(npcSession())).toBe(false);
  });
  it('rejects session with an NPC aged 17', () => {
    const s = lifeSession(); (s.npcs[1].character as Mutable).age = 17;
    expect(isCharacterLifeSessionState(s)).toBe(false);
    const t = lifeSession(); (t.npcs[1].character as Mutable).age = 91;
    expect(isCharacterLifeSessionState(t)).toBe(false);
  });
  it('rejects an NPC with the player id and an invalid player or base', () => {
    const s = lifeSession(); (s.npcs[0].character as Mutable).id = PLAYER_CHARACTER_ID; s.profiles[0].id = PLAYER_CHARACTER_ID;
    expect(isCharacterLifeSessionState(s)).toBe(false);
    expect(isCharacterLifeSessionState({ ...lifeSession(), player: { ...player(), extra: 1 } })).toBe(false);
    const t = lifeSession(); (t.city as Mutable).phase = 'resolving';
    expect(isCharacterLifeSessionState(t)).toBe(false);
  });
});

describe('isNamedCharacterRecord', () => {
  it('accepts every starter character and the player character', () => {
    npcSession().npcs.forEach(n => expect(isNamedCharacterRecord(n.character)).toBe(true));
    expect(isNamedCharacterRecord(playerCharacter())).toBe(true);
  });
  it('rejects bad names, stats, keys and non-empty memories', () => {
    const c = (over: Mutable) => ({ ...playerCharacter(), ...over });
    for (const over of [{ name: ' Ana' }, { name: '' }, { age: -1 }, { age: 2.5 }, { health: 101 }, { occupation: 'king' }, { memories: [{}] }, { extra: 1 }, { needs: { ...playerCharacter().needs, safety: NaN } }])
      expect(isNamedCharacterRecord(c(over))).toBe(false);
    expect(isNamedCharacterRecord(null)).toBe(false);
  });
  it('isWorldNpcList unchanged on existing npc.test fixtures', () => {
    const s = npcSession();
    expect(isWorldNpcList(s.npcs, s.city)).toBe(true);
    const dup = structuredClone(s.npcs); dup[1].character.id = dup[0].character.id;
    expect(isWorldNpcList(dup, s.city)).toBe(false);
    const bad = structuredClone(s.npcs); (bad[2].character as Mutable).name = ' Ana';
    expect(isWorldNpcList(bad, s.city)).toBe(false);
  });
});
