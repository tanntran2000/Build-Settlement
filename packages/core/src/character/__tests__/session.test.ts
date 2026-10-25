import { describe, expect, it } from 'vitest';
import { createNpcWorldSession } from '../../world/npc.js';
import { WORLD_STARTER_NPCS } from '../../world/npc-content.js';
import { describeShort } from '../describe.js';
import { createCharacterLifeSession, createPlayerCharacter, validatePlayerDraft } from '../session.js';
import { DEFAULT_PLAYER_DRAFT, PLAYER_APPEARANCE_PRESETS, STARTER_PROFILES, type PlayerDraft } from '../starter-profiles.js';
import { isCharacterLifeSessionState, isCharacterProfile, isPlayerCharacter } from '../validate.js';

const NAME_MSG = 'Enter a name of 1–64 characters without leading or trailing spaces.';
const AGE_MSG = 'Age must be a whole number from 18 to 90.';
const draft = (over: Partial<PlayerDraft> = {}): PlayerDraft => ({ ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana', ...over });
const full = (): PlayerDraft => draft({
  birthName: 'Anabel', label: 'The Mechanic', biography: 'Came west after the floods.',
  traits: { attractiveness: '66', learningAptitude: '72.5', warmth: '34', intimacyKnowledge: '40' },
  appearance: { ...structuredClone(DEFAULT_PLAYER_DRAFT.appearance), measurements: { chestCm: '86', waistCm: '68', hipsCm: '92' } },
  intimateHistory: 'some',
});
const player = (d: PlayerDraft) => { const r = createPlayerCharacter(d); if (!r.success) throw Error(r.error.message); return r.value; };
const session = (seed: unknown, d: PlayerDraft) => { const r = createCharacterLifeSession(seed, d); if (!r.success) throw Error(r.error.message); return r.value; };
const deepFrozen = (v: unknown): boolean => typeof v !== 'object' || v === null || (Object.isFrozen(v) && Object.values(v).every(deepFrozen));

describe('validatePlayerDraft', () => {
  it('DEFAULT_PLAYER_DRAFT is invalid only on currentName', () => {
    expect(validatePlayerDraft(DEFAULT_PLAYER_DRAFT)).toEqual({ currentName: NAME_MSG });
    expect(validatePlayerDraft(draft())).toEqual({});
    expect(validatePlayerDraft(full())).toEqual({});
  });
  it('rejects blank, padded and over-long names before createNamedCharacter can trim them', () => {
    for (const currentName of ['', '  ', ' Ana', 'Ana ', 'a'.repeat(65)]) {
      expect(validatePlayerDraft(draft({ currentName }))).toEqual({ currentName: NAME_MSG });
      expect(createPlayerCharacter(draft({ currentName })).success).toBe(false);
    }
    expect(validatePlayerDraft(draft({ currentName: 'a'.repeat(64) }))).toEqual({});
  });
  it('birth name follows the name rule only when non-empty', () => {
    expect(validatePlayerDraft(draft({ birthName: '' }))).toEqual({});
    for (const birthName of ['  ', ' Anabel', 'a'.repeat(65)]) expect(validatePlayerDraft(draft({ birthName }))).toEqual({ birthName: NAME_MSG });
  });
  it('draft age "17", "18.5", "abc", "91" gives the age message', () => {
    for (const age of ['17', '18.5', 'abc', '91', '', '   ', ' 25', '25 ', 'Infinity', '1e400']) expect(validatePlayerDraft(draft({ age }))).toEqual({ age: AGE_MSG });
    for (const age of ['18', '90']) expect(validatePlayerDraft(draft({ age }))).toEqual({});
  });
  it('draft height "139" gives the height message; weight and measurements use their ranges', () => {
    const a = (over: Partial<PlayerDraft['appearance']>) => draft({ appearance: { ...structuredClone(DEFAULT_PLAYER_DRAFT.appearance), ...over } });
    for (const heightCm of ['139', '211', '170.5', '', ' ']) expect(validatePlayerDraft(a({ heightCm }))).toEqual({ heightCm: 'Height must be a whole number from 140 to 210 cm.' });
    for (const weightKg of ['34', '181', '']) expect(validatePlayerDraft(a({ weightKg }))).toEqual({ weightKg: 'Weight must be a whole number from 35 to 180 kg.' });
    expect(validatePlayerDraft(a({ measurements: { chestCm: '59', waistCm: '151', hipsCm: '' } }))).toEqual({
      chestCm: 'Chest must be a whole number from 60 to 160 cm.', waistCm: 'Waist must be a whole number from 45 to 150 cm.', hipsCm: 'Hips must be a whole number from 60 to 170 cm.',
    });
  });
  it('axes must be finite numbers from 0 to 100, never a blank parsed as 0', () => {
    for (const v of ['', '  ', '-1', '101', 'abc', 'NaN', 'Infinity']) {
      expect(validatePlayerDraft(draft({ traits: { attractiveness: v, learningAptitude: v, warmth: v, intimacyKnowledge: v } }))).toEqual({
        attractiveness: 'Attractiveness must be a number from 0 to 100.', learningAptitude: 'Learning Aptitude must be a number from 0 to 100.',
        warmth: 'Warmth must be a number from 0 to 100.', intimacyKnowledge: 'Intimacy Knowledge must be a number from 0 to 100.',
      });
    }
    expect(validatePlayerDraft(draft({ traits: { attractiveness: '0', learningAptitude: '100', warmth: '60.0001', intimacyKnowledge: null } }))).toEqual({});
  });
  it('label and biography limits', () => {
    expect(validatePlayerDraft(draft({ label: 'a'.repeat(41) }))).toEqual({ label: 'Label can be at most 40 characters.' });
    expect(validatePlayerDraft(draft({ biography: 'a'.repeat(1001) }))).toEqual({ biography: 'Biography can be at most 1000 characters.' });
    expect(validatePlayerDraft(draft({ label: 'a'.repeat(40), biography: 'a'.repeat(1000) }))).toEqual({});
  });
  it('rejects unknown catalogue ids and options instead of building an invalid player', () => {
    const app = DEFAULT_PLAYER_DRAFT.appearance;
    const bad: [Partial<PlayerDraft>, string][] = [
      [{ pronouns: 'it' as never }, 'pronouns'], [{ gender: 'x' as never }, 'gender'], [{ profession: 'governor' }, 'profession'],
      [{ birthplaceId: 'haven' }, 'birthplaceId'], [{ regionId: 'atlantis' }, 'regionId'], [{ upbringing: 'castle' }, 'upbringing'],
      [{ intimateHistory: 'unknown' as never }, 'intimateHistory'],
      [{ appearance: { ...structuredClone(app), skinTone: 'green' } }, 'skinTone'],
      [{ appearance: { ...structuredClone(app), hair: { ...app.hair, texture: 'spiky' } } }, 'hairTexture'],
      [{ appearance: { ...structuredClone(app), face: { shape: 'oval', features: ['freckles', 'glasses', 'scar'] } } }, 'faceFeatures'],
      [{ appearance: { ...structuredClone(app), face: { shape: 'oval', features: ['scar', 'scar'] } } }, 'faceFeatures'],
      [{ appearance: { ...structuredClone(app), outfit: 'armour' } }, 'outfit'],
    ];
    for (const [over, key] of bad) {
      const errors = validatePlayerDraft(draft(over));
      expect(Object.keys(errors)).toEqual([key]);
      expect(errors[key]).toMatch(/^Choose a valid .+\.$/);
    }
  });
  it('sparse face features get the faceFeatures field error, matching final creation', () => {
    for (const features of [new Array(1), ['freckles', , 'scar'].slice(0, 2)] as string[][]) {
      const d = draft({ appearance: { ...structuredClone(DEFAULT_PLAYER_DRAFT.appearance), face: { shape: 'oval', features } } });
      expect(validatePlayerDraft(d)).toEqual({ faceFeatures: 'Choose a valid set of face features.' });
      const created = createPlayerCharacter(d);
      expect(created.success).toBe(false);
      if (!created.success) expect(created.error.message).toBe('Choose a valid set of face features.');
    }
  });
});

describe('createPlayerCharacter', () => {
  it('valid draft creates player with id "player", currentLocationId "haven", known disclosures', () => {
    const p = player(full());
    expect(isPlayerCharacter(p)).toBe(true);
    expect(p.character).toMatchObject({ id: 'player', name: 'Ana', gender: 'other', age: 25, occupation: DEFAULT_PLAYER_DRAFT.profession, socialClass: 'common', legalStatus: 'citizen', memories: [] });
    expect(p.profile.id).toBe('player');
    expect(p.profile.identity).toEqual({ birthName: 'Anabel', label: 'The Mechanic', pronouns: 'they', birthplaceId: DEFAULT_PLAYER_DRAFT.birthplaceId,
      origin: { regionId: DEFAULT_PLAYER_DRAFT.regionId, upbringing: DEFAULT_PLAYER_DRAFT.upbringing }, currentLocationId: 'haven', biography: 'Came west after the floods.' });
    expect(p.profile.traits).toEqual({ attractiveness: 66, learningAptitude: 72.5, warmth: 34, intimacyKnowledge: 40 });
    expect(p.profile.appearance.measurements).toEqual({ chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'known' });
    expect(p.profile.private).toEqual({ intimateHistory: { value: 'some', disclosure: 'known' } });
  });
  it('blank optional texts become null', () => {
    const p = player(draft({ birthName: '', label: '   ', biography: '' }));
    expect(p.profile.identity).toMatchObject({ birthName: null, label: null, biography: null });
    expect(player(draft({ label: ' The Mechanic ' })).profile.identity.label).toBe('The Mechanic');
  });
  it('intimacyKnowledge null omits the field; "40" stores 40', () => {
    const none = player(draft());
    expect(Object.hasOwn(none.profile.traits, 'intimacyKnowledge')).toBe(false);
    expect(Object.hasOwn(none.profile, 'private')).toBe(false);
    expect(Object.hasOwn(none.profile.appearance, 'measurements')).toBe(false);
    expect(player(draft({ traits: { ...DEFAULT_PLAYER_DRAFT.traits, intimacyKnowledge: '40' } })).profile.traits.intimacyKnowledge).toBe(40);
  });
  it('invalid draft returns INVALID_PLAYER with the field messages', () => {
    expect(createPlayerCharacter(draft({ currentName: '', age: '17' }))).toEqual({ success: false, error: { code: 'INVALID_PLAYER', message: `${NAME_MSG} ${AGE_MSG}` } });
  });
  it('the player shares no objects with the draft', () => {
    const d = full(), p = player(d);
    d.appearance.face.features.push('scar'); d.appearance.hair.color = 'white'; d.traits.warmth = '99';
    expect(p.profile.appearance.face.features).toEqual(DEFAULT_PLAYER_DRAFT.appearance.face.features);
    expect(p.profile.appearance.hair.color).toBe(DEFAULT_PLAYER_DRAFT.appearance.hair.color);
    expect(p.profile.traits.warmth).toBe(34);
  });
});

describe('starter content', () => {
  it('starter profiles validate against their characters', () => {
    expect(STARTER_PROFILES.map(p => p.id)).toEqual(WORLD_STARTER_NPCS.map(n => n.character.id));
    STARTER_PROFILES.forEach((p, i) => expect(isCharacterProfile(p, WORLD_STARTER_NPCS[i].character)).toBe(true));
    for (const p of STARTER_PROFILES) {
      expect(p.identity).toMatchObject({ birthName: null, label: null, biography: null, currentLocationId: 'haven' });
      expect([Object.hasOwn(p, 'private'), Object.hasOwn(p.traits, 'intimacyKnowledge'), Object.hasOwn(p.appearance, 'measurements')]).toEqual([false, false, false]);
    }
  });
  it('npc_starter_3 uses the plan values', () => {
    expect(STARTER_PROFILES[2]).toEqual({
      id: 'npc_starter_3',
      identity: { birthName: null, label: null, pronouns: 'she', birthplaceId: 'cinder_hollow', origin: { regionId: 'ashfield', upbringing: 'city' }, currentLocationId: 'haven', biography: null },
      traits: { attractiveness: 72, learningAptitude: 48, warmth: 45 },
      appearance: { presentation: 'feminine', skinTone: 'fair', eyeColor: 'green', hair: { color: 'red', length: 'long', texture: 'wavy', style: 'braided' },
        face: { shape: 'round', features: ['high_cheekbones'] }, build: 'slim', heightCm: 162, weightKg: 55, outfit: 'role_default' },
    });
  });
  it('every preset is a valid draft appearance with its own id', () => {
    expect(PLAYER_APPEARANCE_PRESETS.map(p => p.id)).toEqual(['practical', 'scholarly', 'rugged']);
    for (const p of PLAYER_APPEARANCE_PRESETS) expect(validatePlayerDraft(draft({ appearance: structuredClone(p.appearance) as PlayerDraft['appearance'] }))).toEqual({});
    expect(DEFAULT_PLAYER_DRAFT.appearance).toEqual(PLAYER_APPEARANCE_PRESETS[0].appearance);
    expect(DEFAULT_PLAYER_DRAFT).toMatchObject({ currentName: '', age: '25', pronouns: 'they', gender: 'other', appearance: { presentation: 'androgynous' } });
  });
  it('default draft, presets and starter profiles are deep-frozen', () => {
    expect(deepFrozen(DEFAULT_PLAYER_DRAFT)).toBe(true);
    expect(deepFrozen(PLAYER_APPEARANCE_PRESETS)).toBe(true);
    expect(deepFrozen(STARTER_PROFILES)).toBe(true);
    expect(() => { (DEFAULT_PLAYER_DRAFT.appearance.face.features as string[]).push('scar'); }).toThrow();
    expect(() => { (STARTER_PROFILES[0].traits as { warmth: number }).warmth = 1; }).toThrow();
  });
});

describe('createCharacterLifeSession', () => {
  it('createCharacterLifeSession(0, valid) equals createNpcWorldSession(0) plus player and STARTER_PROFILES, passes isCharacterLifeSessionState', () => {
    const npc = createNpcWorldSession(0);
    if (!npc.success) throw Error(npc.error.message);
    const s = session(0, full());
    expect(s).toEqual({ ...npc.value, player: player(full()), profiles: STARTER_PROFILES });
    expect(isCharacterLifeSessionState(s)).toBe(true);
  });
  it('same seed and draft give deep-equal sessions', () => {
    expect(session(7, full())).toEqual(session(7, full()));
  });
  it('invalid draft returns INVALID_PLAYER and no session', () => {
    const r = createCharacterLifeSession(0, DEFAULT_PLAYER_DRAFT);
    expect(r).toEqual({ success: false, error: { code: 'INVALID_PLAYER', message: NAME_MSG } });
  });
  it('invalid seed returns the world error', () => {
    const world = createNpcWorldSession('bad');
    expect(world.success).toBe(false);
    expect(createCharacterLifeSession('bad', draft())).toEqual(world);
  });
  it('editing one session cannot leak into templates or the next New Game', () => {
    const d = draft(), first = session(0, d);
    first.profiles[0].traits.warmth = 1; first.profiles[0].appearance.face.features.push('scar');
    first.player.profile.appearance.face.features.push('scar'); first.npcs[0].character.name = 'Changed';
    d.appearance.hair.color = 'white';
    const second = session(0, draft());
    expect(second.profiles).toEqual(STARTER_PROFILES);
    expect(second.player).toEqual(player(draft()));
    expect(second.npcs[0].character.name).not.toBe('Changed');
    expect(first.profiles[0]).not.toBe(STARTER_PROFILES[0]);
  });
  it('keeps the seeded NPC names, ids, stats and assignment; profiles are separate', () => {
    const npc = createNpcWorldSession(3);
    if (!npc.success) throw Error(npc.error.message);
    const s = session(3, draft());
    expect(s.npcs).toEqual(npc.value.npcs);
    expect(s.npcs.map(n => n.postTileId)).toEqual(WORLD_STARTER_NPCS.map(n => n.postTileId));
  });
  it('describeShort for npc_starter_1 equals spec Example A short line except the drawn name', () => {
    const s = session(0, draft()), npc = s.npcs[0];
    expect(describeShort({ character: npc.character, profile: s.profiles[0], role: 'npc', postBuildingName: null }))
      .toBe(`${npc.character.name} · 27 · Technician from Northreach · average height, slim · light olive skin · shoulder-length brown hair · grey eyes · attractive · quick learner · reserved`);
  });
});
