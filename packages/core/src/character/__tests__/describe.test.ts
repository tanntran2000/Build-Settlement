import { describe, expect, it } from 'vitest';
import { createNamedCharacter, type NamedCharacter } from '../../domain/character.js';
import { PLAYER_CHARACTER_ID } from '../catalog.js';
import { axisBand, describeLong, describeShort, heightBand, profileRows, type Axis, type CharacterView } from '../describe.js';
import type { CharacterProfile } from '../types.js';

const clara = (): CharacterView => ({
  character: createNamedCharacter({ id: 'npc_starter_1', name: 'Clara', gender: 'female', age: 27, occupation: 'technician', socialClass: 'skilled', legalStatus: 'citizen' }),
  profile: {
    id: 'npc_starter_1',
    identity: { birthName: null, label: null, pronouns: 'she', birthplaceId: 'kestrel_ford', origin: { regionId: 'northreach', upbringing: 'frontier' }, currentLocationId: 'haven', biography: null },
    traits: { attractiveness: 66, learningAptitude: 72, warmth: 34 },
    appearance: { presentation: 'feminine', skinTone: 'light_olive', eyeColor: 'grey', hair: { color: 'brown', length: 'shoulder_length', texture: 'straight', style: 'tied_back' },
      face: { shape: 'oval', features: ['freckles'] }, build: 'slim', heightCm: 168, weightKg: 58, outfit: 'role_default' },
  },
  role: 'npc', postBuildingName: 'Food Processor',
});
const ruth = (): CharacterView => ({
  character: createNamedCharacter({ id: 'npc_starter_2', name: 'Ruth', gender: 'female', age: 31, occupation: 'doctor', socialClass: 'skilled', legalStatus: 'free_resident' }),
  profile: {
    id: 'npc_starter_2',
    identity: { birthName: null, label: null, pronouns: 'she', birthplaceId: 'tidewall', origin: { regionId: 'saltmere', upbringing: 'port_town' }, currentLocationId: 'haven', biography: null },
    traits: { attractiveness: 50, learningAptitude: 55, warmth: 78 },
    appearance: { presentation: 'feminine', skinTone: 'deep_brown', eyeColor: 'brown', hair: { color: 'black', length: 'short', texture: 'straight', style: 'loose' },
      face: { shape: 'heart_shaped', features: ['glasses'] }, build: 'average', heightCm: 174, weightKg: 70, outfit: 'role_default' },
  },
  role: 'npc', postBuildingName: null,
});
const player = (pronouns: 'she' | 'he' | 'they' = 'they', over: Partial<NamedCharacter> = {}): CharacterView => {
  const base = clara();
  const profile: CharacterProfile = {
    ...base.profile, id: PLAYER_CHARACTER_ID,
    identity: { ...base.profile.identity, pronouns, birthName: 'Anabel', label: 'The Mechanic', biography: 'Came west after the floods.' },
    traits: { attractiveness: 50, learningAptitude: 50, warmth: 50, intimacyKnowledge: 40 },
    appearance: { ...base.profile.appearance, measurements: { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'known' } },
    private: { intimateHistory: { value: 'some', disclosure: 'known' } },
  };
  return { character: createNamedCharacter({ id: PLAYER_CHARACTER_ID, name: 'Ana', gender: 'other', age: 25, occupation: 'advisor', socialClass: 'common', legalStatus: 'citizen', ...over }), profile, role: 'player', postBuildingName: null };
};
const rows = (view: CharacterView) => Object.fromEntries(profileRows(view).map(r => [r.label, r.value]));

describe('describeShort / describeLong', () => {
  it('reproduces spec §12.4 Example A short and long exactly', () => {
    expect(describeShort(clara())).toBe('Clara · 27 · Technician from Northreach · average height, slim · light olive skin · shoulder-length brown hair · grey eyes · attractive · quick learner · reserved');
    expect(describeLong(clara())).toBe('Clara, 27, grew up on the frontier in Northreach. She is of average height with a slim build, light olive skin and shoulder-length brown hair tied back. Her oval face is lightly freckled; she wears a canvas work jacket and heavy trousers. She is attractive, a quick learner and reserved with strangers. Trained as a technician, she currently manages the Food Processor.');
  });
  it('reproduces spec §12.4 Example B exactly', () => {
    expect(describeShort(ruth())).toBe('Ruth · 31 · Doctor from Saltmere · tall, average build · deep brown skin · short black hair · brown eyes · friendly');
    expect(describeLong(ruth())).toBe('Ruth, 31, grew up in a port town in Saltmere. She is tall with an average build, deep brown skin and short black hair. Her heart-shaped face is framed by glasses; she wears a long buttoned coat over practical clothes. She is friendly toward most people. Trained as a doctor, she currently holds no post.');
  });
  it('they pronouns read "They are" and "Their"', () => {
    const view = clara(); view.profile.identity.pronouns = 'they';
    expect(describeLong(view)).toBe('Clara, 27, grew up on the frontier in Northreach. They are of average height with a slim build, light olive skin and shoulder-length brown hair tied back. Their oval face is lightly freckled; they wear a canvas work jacket and heavy trousers. They are attractive, a quick learner and reserved with strangers. Trained as a technician, they currently manage the Food Processor.');
    view.postBuildingName = null;
    expect(describeLong(view)).toContain('Trained as a technician, they currently hold no post.');
    expect(describeLong(player('they'))).toContain('They trained as an advisor and now lead Haven.');
  });
  it('he pronouns read "He is" and "His"', () => {
    const view = ruth(); view.profile.identity.pronouns = 'he'; view.profile.appearance.face.features = [];
    expect(describeLong(view)).toContain('He is tall with an average build');
    expect(describeLong(view)).toContain('His face is heart-shaped; he wears a long buttoned coat over practical clothes. He is friendly toward most people. Trained as a doctor, he currently holds no post.');
  });
  it('player sentence 5 reads "trained as an advisor and now leads Haven."', () => {
    expect(describeLong(player('she'))).toBe('Ana, 25, grew up on the frontier in Northreach. She is of average height with a slim build, light olive skin and shoulder-length brown hair tied back. Her oval face is lightly freckled; she wears plain practical clothes. She trained as an advisor and now leads Haven. Came west after the floods.');
    expect(describeShort(player('she'))).toBe('Ana · 25 · Advisor from Northreach · average height, slim · light olive skin · shoulder-length brown hair · grey eyes');
  });
  it('wavy texture renders "long wavy red hair in a braid"', () => {
    const view = clara(); view.profile.appearance.hair = { color: 'red', length: 'long', texture: 'wavy', style: 'braided' };
    expect(describeLong(view)).toContain('light olive skin and long wavy red hair in a braid.');
    expect(describeShort(view)).toContain(' · long wavy red hair · ');
  });
  it('uses a chosen outfit, two features and a compound profession', () => {
    const view = clara(); view.profile.appearance.outfit = 'leather_apron'; view.profile.appearance.face.features = ['high_cheekbones', 'scar'];
    view.character = { ...view.character, occupation: 'security' };
    expect(describeLong(view)).toContain('Her oval face has high cheekbones and carries a small scar; she wears a leather apron over plain clothes.');
    expect(describeLong(view)).toContain('Trained as a security officer, she currently manages the Food Processor.');
    expect(describeShort(view)).toContain('Clara · 27 · Security officer from Northreach · ');
  });
  it('role_default outfit follows the post building, then the profession', () => {
    const view = clara(); view.postBuildingName = 'Iron Mine';
    expect(describeLong(view)).toContain('she wears a reinforced jacket and a lamp helmet.');
    view.postBuildingName = null;
    expect(describeLong(view)).toContain('she wears a canvas work jacket and heavy trousers.');
  });
  it('an unassigned profession never reads "Trained as an unassigned"', () => {
    const view = clara(); view.character = { ...view.character, occupation: 'unassigned' };
    expect(describeLong(view)).toContain('She currently manages the Food Processor.');
    expect(describeLong(view)).not.toContain('unassigned');
    expect(describeShort(view)).toContain('Clara · 27 · from Northreach · ');
  });
  it('neutral axes add no words and no empty tokens', () => {
    const view = clara(); view.profile.traits = { attractiveness: 40, learningAptitude: 60, warmth: 50 };
    expect(describeShort(view).endsWith(' · grey eyes')).toBe(true);
    expect(describeLong(view)).not.toMatch(/She is \./);
    expect(describeLong(view)).toContain('she wears a canvas work jacket and heavy trousers. Trained as');
    view.profile.traits = { attractiveness: 10, learningAptitude: 50, warmth: 90 };
    expect(describeLong(view)).toContain('She is plain-looking and very warm toward everyone.');
  });
});

describe('bands', () => {
  it('every axis value maps to exactly one band', () => {
    const values = [15, 40, 60, 60.0001, 85, 85.0001, 100];
    for (let v = 0; v <= 100; v += 0.25) values.push(v);
    for (const axis of ['attractiveness', 'learningAptitude', 'warmth'] as Axis[])
      for (const v of values) expect(() => axisBand(axis, v)).not.toThrow();
    expect(axisBand('attractiveness', 60)).toBeNull();
    expect(axisBand('attractiveness', 60.0001)?.short).toBe('attractive');
    expect(axisBand('attractiveness', 14.9999)?.short).toBe('plain-looking');
    expect(axisBand('attractiveness', 15)?.long).toBe('unremarkable in looks');
    expect(axisBand('attractiveness', 40)).toBeNull();
    expect(axisBand('attractiveness', 85)?.short).toBe('attractive');
    expect(axisBand('attractiveness', 85.0001)?.short).toBe('striking');
    expect(axisBand('learningAptitude', 19.99)?.long).toBe('a slow learner');
    expect(axisBand('learningAptitude', 20)?.short).toBe('steady learner');
    expect(axisBand('learningAptitude', 80)?.short).toBe('quick learner');
    expect(axisBand('learningAptitude', 80.5)?.long).toBe('an exceptionally quick learner');
    expect(axisBand('warmth', 0)?.short).toBe('cold');
    expect(axisBand('warmth', 39.9)?.long).toBe('reserved with strangers');
    expect(axisBand('warmth', 60)).toBeNull();
    expect(axisBand('warmth', 60.5)?.short).toBe('friendly');
    expect(axisBand('warmth', 100)?.long).toBe('very warm toward everyone');
  });
  it('height bands use fixed edges', () => {
    expect(heightBand(154).short).toBe('short');
    expect(heightBand(155).long).toBe('of average height');
    expect(heightBand(155).short).toBe('average height');
    expect(heightBand(169.9).short).toBe('average height');
    expect(heightBand(170).short).toBe('tall');
    expect(heightBand(185).short).toBe('very tall');
    expect(heightBand(210).long).toBe('very tall');
  });
});

describe('profileRows', () => {
  it('lists rows in order with value formats', () => {
    expect(profileRows(player('they'))).toEqual([
      { label: 'Name', value: 'Ana' }, { label: 'Birth name', value: 'Anabel' }, { label: 'Label', value: 'The Mechanic' }, { label: 'Age', value: '25' },
      { label: 'Profession', value: 'Advisor' }, { label: 'Current post', value: 'Leader of Haven' }, { label: 'Birthplace', value: 'Kestrel Ford' },
      { label: 'Origin', value: 'Northreach (frontier)' }, { label: 'Current location', value: 'Haven' }, { label: 'Height', value: '168 cm' }, { label: 'Weight', value: '58 kg' },
      { label: 'Build', value: 'slim' }, { label: 'Skin', value: 'light olive' }, { label: 'Hair', value: 'shoulder-length brown, tied back' }, { label: 'Eyes', value: 'grey' },
      { label: 'Face', value: 'oval, freckles' }, { label: 'Measurements', value: '86 / 68 / 92 cm' },
      { label: 'Attractiveness', value: '50' }, { label: 'Learning Aptitude', value: '50' }, { label: 'Warmth', value: '50' },
    ]);
  });
  it('omits birth name when absent or equal, and label when absent', () => {
    const labels = profileRows(clara()).map(r => r.label);
    expect(labels).not.toContain('Birth name');
    expect(labels).not.toContain('Label');
    const same = player(); same.profile.identity.birthName = 'Ana';
    expect(profileRows(same).map(r => r.label)).not.toContain('Birth name');
  });
  it('shows axes with band words, NPC post and building, decimals unrounded', () => {
    const view = clara(); view.profile.traits.warmth = 60.0001;
    const r = rows(view);
    expect(r['Attractiveness']).toBe('66 (attractive)');
    expect(r['Learning Aptitude']).toBe('72 (quick learner)');
    expect(r['Warmth']).toBe('60.0001 (friendly)');
    expect(r['Current post']).toBe('Food Processor');
    expect(rows(ruth())['Current post']).toBe('None');
    view.profile.appearance.build = 'heavy_set'; view.profile.appearance.face = { shape: 'heart_shaped', features: ['high_cheekbones', 'strong_jaw'] };
    view.profile.appearance.hair = { color: 'dark_brown', length: 'long', texture: 'coily', style: 'loose' };
    expect(rows(view)['Build']).toBe('heavy-set');
    expect(rows(view)['Face']).toBe('heart-shaped, high cheekbones, strong jaw');
    expect(rows(view)['Hair']).toBe('long coily dark brown');
  });
  it('profileRows shows Measurements Unknown when disclosure unknown', () => {
    const view = player(); view.profile.appearance.measurements = { chestCm: 86, waistCm: 68, hipsCm: 92, disclosure: 'unknown' };
    expect(rows(view)['Measurements']).toBe('Unknown');
    expect(rows(clara())['Measurements']).toBe('Unknown');
  });
  it('profileRows never contains intimacy or intimate history', () => {
    const text = JSON.stringify(profileRows(player())).toLowerCase();
    expect(text).not.toContain('intima');
    expect(text).not.toContain('40');
    expect(text).not.toContain('some');
    expect(describeShort(player()).toLowerCase()).not.toContain('intima');
    expect(describeLong(player()).toLowerCase()).not.toContain('intima');
  });
});
