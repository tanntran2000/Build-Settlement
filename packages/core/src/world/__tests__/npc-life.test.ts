import { readFileSync } from 'node:fs';
import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
import { describe, expect, it, vi } from 'vitest';
import * as api from '../../index.js';
import * as validation from '../../data/validate.js';
import type { NpcLife } from '../../index.js';

const parts = ['hand', 'mouth', 'breast', 'vagina', 'ass'] as const;
const load = () => JSON.parse(readFileSync(new URL('../../data/npc-life.json', import.meta.url), 'utf8'));
const valid = (): NpcLife => ({ mind: 50, lust: 30, lustBase: 30, arousal: 0, stress: 0, beauty: 60,
  birthWeek: -1079, origin: 'frontier', hobbies: ['reading', 'gardening'], working: true,
  sexExp: { hand: { level: 'novice', exp: 0 }, mouth: { level: 'novice', exp: 0 }, breast: { level: 'novice', exp: 0 }, vagina: { level: 'novice', exp: 0 }, ass: { level: 'novice', exp: 0 } },
  history: { counters: {}, recent: [] } });
type Mutable = Record<string, any>;

describe('NPC life catalog', () => {
  it('validates the English catalog into six origins, eight hobbies and the exact TRIAL values', () => {
    expect(validation.validateNpcLife(load())).toEqual({ origins: api.NPC_ORIGINS, hobbies: api.NPC_HOBBIES, P7A_TRIAL: api.P7A_TRIAL });
    expect(Object.keys(api.NPC_ORIGINS)).toHaveLength(6); expect(Object.keys(api.NPC_HOBBIES)).toHaveLength(8);
    expect(api.P7A_TRIAL).toEqual({ marker: 'TRIAL', lustBase: [20, 40], beauty: [40, 80], stressWork: 4, stressRest: 5,
      stressHalveAuthority: 70, stressHalveAffection: 70, stressResume: 80, arousalDivisor: 10,
      weeksPerYear: 40, recentCap: 20, sexExpCaps: { novice: 100, professional: 200, expert: 300 } });
  });
  it.each([
    ['origins.frontier.name', 7, 'npc-life.json#frontier.name: expected nonempty string'],
    ['origins.frontier.summary', '', 'npc-life.json#frontier.summary: expected nonempty string'],
    ['hobbies.reading.name', '', 'npc-life.json#reading.name: expected nonempty string'],
    ['P7A_TRIAL.marker', 'FINAL', 'npc-life.json#P7A_TRIAL.marker: expected TRIAL'],
    ['P7A_TRIAL.lustBase', [40, 20], 'npc-life.json#P7A_TRIAL.lustBase: expected ascending integer range in [0, 100]'],
    ['P7A_TRIAL.beauty', [40, 101], 'npc-life.json#P7A_TRIAL.beauty: expected ascending integer range in [0, 100]'],
    ['P7A_TRIAL.stressWork', -1, 'npc-life.json#P7A_TRIAL.stressWork: expected integer >= 0'],
    ['P7A_TRIAL.stressResume', 101, 'npc-life.json#P7A_TRIAL.stressResume: expected integer in [0, 100]'],
    ['P7A_TRIAL.arousalDivisor', 0, 'npc-life.json#P7A_TRIAL.arousalDivisor: expected integer > 0'],
    ['P7A_TRIAL.weeksPerYear', 0, 'npc-life.json#P7A_TRIAL.weeksPerYear: expected integer > 0'],
    ['P7A_TRIAL.recentCap', 0, 'npc-life.json#P7A_TRIAL.recentCap: expected integer > 0'],
    ['P7A_TRIAL.sexExpCaps.novice', -1, 'npc-life.json#P7A_TRIAL.sexExpCaps.novice: expected integer > 0'],
  ])('rejects malformed %s with an exact catalog error', (path, wrong, message) => {
    const copy = load(); const keys = path.split('.'); let target = copy;
    for (const key of keys.slice(0, -1)) target = target[key];
    target[keys.at(-1)!] = wrong;
    expect(() => validation.validateNpcLife(copy)).toThrow(message);
    expect(() => validation.validateNpcLife(copy)).toThrow(validation.CatalogError);
  });
  it('rejects missing catalogs, insufficient hobbies and unexpected fields', () => {
    for (const key of ['origins', 'hobbies', 'P7A_TRIAL']) { const copy = load(); delete copy[key]; expect(() => validation.validateNpcLife(copy)).toThrow(validation.CatalogError); }
    const copy = load(); copy.hobbies = { reading: { name: 'Reading' } };
    expect(() => validation.validateNpcLife(copy)).toThrow('npc-life.json#catalog.hobbies: expected at least 2 entries');
    const extra = load(); extra.origins.frontier.extra = true;
    expect(() => validation.validateNpcLife(extra)).toThrow('npc-life.json#frontier.extra: unexpected field');
  });
});

describe('seeded life and ages', () => {
  it('uses a repeatable independent stream per seed and NPC id without ambient randomness', () => {
    const ambient = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('ambient draw'); });
    try {
      const a = api.npcLifeRandom(42, 'one'), b = api.npcLifeRandom(42, 'one');
      expect(Array.from({ length: 8 }, () => a())).toEqual(Array.from({ length: 8 }, () => b()));
      expect(api.createNpcLife(42, 'one', 27)).toEqual(api.createNpcLife(42, 'one', 27));
      expect(api.createNpcLife(42, 'one', 27)).not.toEqual(api.createNpcLife(43, 'one', 27));
      expect(api.createNpcLife(42, 'one', 27)).not.toEqual(api.createNpcLife(42, 'two', 27));
    } finally { ambient.mockRestore(); }
  });
  it('draws inclusive ranges, known origins and distinct hobbies while preserving fixed starts', () => {
    const bases = new Set<number>(), beauties = new Set<number>();
    for (let seed = 0; seed < 500; seed++) {
      const life = api.createNpcLife(seed, 'npc', 27); bases.add(life.lustBase); beauties.add(life.beauty);
      expect(api.isNpcLife(life)).toBe(true);
      expect(life.lustBase).toBeGreaterThanOrEqual(20); expect(life.lustBase).toBeLessThanOrEqual(40);
      expect(life.beauty).toBeGreaterThanOrEqual(40); expect(life.beauty).toBeLessThanOrEqual(80);
      expect(life.lust).toBe(life.lustBase); expect(life.mind).toBe(50);
      expect([life.arousal, life.stress]).toEqual([0, 0]); expect(life.working).toBe(true);
      expect(Object.hasOwn(api.NPC_ORIGINS, life.origin)).toBe(true);
      expect(life.hobbies).toHaveLength(2); expect(new Set(life.hobbies).size).toBe(2);
      life.hobbies.forEach(id => expect(Object.hasOwn(api.NPC_HOBBIES, id)).toBe(true));
      expect(life.birthWeek).toBe(-1079); expect(life.history).toEqual({ counters: {}, recent: [] });
      for (const part of parts) expect(life.sexExp[part]).toEqual({ level: 'novice', exp: 0 });
    }
    expect(bases.has(20) && bases.has(40) && beauties.has(40) && beauties.has(80)).toBe(true);
  });
  it.each([[18, 'Young Adult'], [29, 'Young Adult'], [30, 'Mature'], [49, 'Mature'], [50, 'Granny'] ] as const)('derives age %i and title %s at 40-week boundaries', (age, title) => {
    const life = api.createNpcLife(0, 'npc', age);
    expect(api.npcAge(life, 1)).toBe(age); expect(api.npcAge(life, 40)).toBe(age); expect(api.npcAge(life, 41)).toBe(age + 1);
    expect(api.npcAgeTitle(age)).toBe(title);
  });
  it('initializes generated live NPC records with household last and isolates nested state', () => {
    const made = api.createNpcWorldSession(42), again = api.createNpcWorldSession(42);
    if (!made.success || !again.success) throw Error('factory');
    const first = withNpcs(made.value, NPC_TEST_KEYS), second = withNpcs(again.value, NPC_TEST_KEYS);
    const before = structuredClone(second.npcs);
    expect(first.npcs).toEqual(before);
    expect(first.npcs.map(n => api.npcAge(n.life, 1))).toEqual(first.npcs.map(n => n.character.age));
    for (const npc of first.npcs) {
      expect(Object.keys(npc)).toEqual(['character', 'traits', 'postTileId', 'life', 'household']);
      expect(api.isNpcLife(npc.life)).toBe(true);
      expect(api.isNpcHousehold(npc.household)).toBe(true);
    }
    first.npcs[0].life.sexExp.hand.exp += 1; first.npcs[0].life.hobbies[0] = first.npcs[0].life.hobbies[1];
    expect(second.npcs).toEqual(before);
  });
});

describe('untrusted life validation', () => {
  it('accepts the exact record, legal boundaries, capped levels and extensible history', () => {
    const life = valid();
    expect(api.isNpcLife(life)).toBe(true);
    for (const [level, cap] of [['novice', 100], ['professional', 200], ['expert', 300]] as const) {
      for (const part of parts) life.sexExp[part] = { level, exp: cap };
      expect(api.isNpcLife(life)).toBe(true);
    }
    life.history = { counters: { birthday: 20, 'custom-event': 0 }, recent: Array.from({ length: 20 }, (_, i) => ({ week: i + 1, kind: 'birthday' })) };
    for (const value of [0, 100]) { life.mind = value; life.stress = value; expect(api.isNpcLife(life)).toBe(true); }
  });
  it.each([
    ['unknown origin', (v: Mutable) => { v.origin = 'missing'; }],
    ['unknown hobby', (v: Mutable) => { v.hobbies[0] = 'missing'; }],
    ['duplicate hobbies', (v: Mutable) => { v.hobbies[1] = v.hobbies[0]; }],
    ['one hobby', (v: Mutable) => { v.hobbies.pop(); }],
    ['three hobbies', (v: Mutable) => { v.hobbies.push('cooking'); }],
    ['missing life field', (v: Mutable) => { delete v.working; }],
    ['extra life field', (v: Mutable) => { v.health = 100; }],
    ['nonboolean working', (v: Mutable) => { v.working = 1; }],
    ['fractional birth week', (v: Mutable) => { v.birthWeek = 0.5; }],
    ['unsafe birth week', (v: Mutable) => { v.birthWeek = -Number.MAX_VALUE; }],
    ['unknown level', (v: Mutable) => { v.sexExp.hand.level = 'master'; }],
    ['missing part', (v: Mutable) => { delete v.sexExp.hand; }],
    ['extra part', (v: Mutable) => { v.sexExp.other = { level: 'novice', exp: 0 }; }],
    ['negative exp', (v: Mutable) => { v.sexExp.hand.exp = -1; }],
    ['fractional exp', (v: Mutable) => { v.sexExp.hand.exp = 0.5; }],
    ['21 recent events', (v: Mutable) => { v.history.recent = Array.from({ length: 21 }, () => ({ week: 1, kind: 'birthday' })); }],
    ['negative counter', (v: Mutable) => { v.history.counters.birthday = -1; }],
    ['fractional counter', (v: Mutable) => { v.history.counters.birthday = 0.5; }],
    ['invalid event week', (v: Mutable) => { v.history.recent = [{ week: 0, kind: 'birthday' }]; }],
    ['empty event kind', (v: Mutable) => { v.history.recent = [{ week: 1, kind: '' }]; }],
    ['sparse hobbies', (v: Mutable) => { delete v.hobbies[0]; }],
    ['sparse history', (v: Mutable) => { v.history.recent.length = 1; }],
    ['accessor', (v: Mutable) => { Object.defineProperty(v, 'mind', { enumerable: true, get: () => { throw Error('read getter'); } }); }],
    ['symbol key', (v: Mutable) => { Object.defineProperty(v, Symbol('extra'), { value: 1, enumerable: true }); }],
    ['inherited record', (v: Mutable) => { Object.setPrototypeOf(v, { extra: 1 }); }],
  ] as const)('rejects %s without mutating input or reading accessors', (_, mutate) => {
    const life = valid(); mutate(life); const before = Object.getOwnPropertyDescriptors(life);
    expect(api.isNpcLife(life)).toBe(false); expect(Object.getOwnPropertyDescriptors(life)).toEqual(before);
  });
  it.each(['mind', 'lust', 'lustBase', 'arousal', 'stress', 'beauty'] as const)('rejects every invalid %s stat', field => {
    for (const value of [-1, 101, 0.5, NaN, Infinity, '50', null]) {
      const life = valid() as unknown as Mutable; life[field] = value; expect(api.isNpcLife(life)).toBe(false);
    }
  });
  it.each([['novice', 101], ['professional', 201], ['expert', 301]] as const)('rejects exp over the %s cap', (level, exp) => {
    const life = valid(); life.sexExp.hand = { level, exp }; expect(api.isNpcLife(life)).toBe(false);
  });
  it('rejects missing life and nonadult/nonfemale NPCs at the WorldNpc boundary', () => {
    const made = api.createNpcWorldSession(0); if (!made.success) throw Error('factory');
    for (const mutate of [
      (n: Mutable) => { delete n.life; }, (n: Mutable) => { n.character.age = 17; },
      (n: Mutable) => { n.character.gender = 'male'; }, (n: Mutable) => { n.life.birthWeek = 1; },
    ]) {
      const npcs = withNpcs(made.value, NPC_TEST_KEYS.slice(0, 1)).npcs; mutate(npcs[0]); expect(api.isWorldNpcList(npcs, made.value.city)).toBe(false);
    }
  });
});
