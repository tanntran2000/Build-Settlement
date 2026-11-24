import { describe,expect,it,vi } from 'vitest';
import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
import { createSocietyState } from '../../trial/society.js';
import { NPC_MANAGER_BUILDING_TYPES,WORLD_TRAITS } from '../npc-content.js';
import { NPC_GENERATOR_CATALOG } from '../npc-generator.js';
import { createNpcWorldSession,isNpcWorldSessionState,isWorldNpcList,managerSlotTileIds } from '../npc.js';
import { createWorldSession,isWorldSessionState } from '../session.js';

const emptySession = (seed = 0) => { const r = createNpcWorldSession(seed); if (!r.success) throw Error(r.error.message); return r.value; };
const session = (seed = 0) => withNpcs(emptySession(seed), NPC_TEST_KEYS);
type Mutable = Record<string, any>;
const names = (seed: number) => session(seed).npcs.map(n => n.character.name);
const mutated = (mutate: (npcs: Mutable[]) => void) => { const s = session(); mutate(s.npcs as unknown as Mutable[]); return s; };

describe('generated NPC content', () => {
  it('generates three valid, unassigned adult women with distinct ids and known traits for the owned fixture', () => {
    const s = session();
    expect(s.npcs.map(n => n.character.id)).toEqual(['npc_w1_guild_0', 'npc_w1_guild_1', 'npc_w1_guild_2']);
    const traitIds = WORLD_TRAITS.map(t => t.id);
    for (const npc of s.npcs) {
      expect(npc.character.gender).toBe('female'); expect(npc.character.age).toBeGreaterThanOrEqual(18);
      expect(npc.postTileId).toBeNull();
      expect(npc.character.memories).toEqual([]);
      expect(npc.traits.length).toBeGreaterThan(0);
      npc.traits.forEach(t => expect(traitIds).toContain(t));
    }
    expect(Object.isFrozen(WORLD_TRAITS) && Object.isFrozen(NPC_MANAGER_BUILDING_TYPES)).toBe(true);
    expect(WORLD_TRAITS.every(Object.isFrozen)).toBe(true);
    expect(isWorldNpcList(s.npcs, s.city)).toBe(true);
  });
  it('maps manager posts to the existing and outside building types', () => {
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks', 'smithy', 'hospital', 'drug-store']);
  });
});

describe('createNpcWorldSession', () => {
  it('creates a valid empty session and fresh generated fixture instances', () => {
    const empty = emptySession(), s = withNpcs(empty, NPC_TEST_KEYS), again = session();
    expect(isNpcWorldSessionState(empty)).toBe(true); expect(empty.npcs).toEqual([]);
    expect(isNpcWorldSessionState(s)).toBe(true);
    expect(s.npcs).toEqual(again.npcs);
    const before = structuredClone(again);
    s.npcs[0].character.skills.technical = 0; s.npcs[0].traits.push('blunt');
    expect(again).toEqual(before);
  });
  it('resolves three distinct English full names from the seeded fixture keys', () => {
    const { cultures, originCulture } = NPC_GENERATOR_CATALOG;
    for (let seed = 0; seed < 200; seed++) {
      const { npcs } = session(seed);
      expect(new Set(npcs.map(npc => npc.character.name)).size).toBe(3);
      for (const npc of npcs) {
        expect(npc.character.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
        const [given, epithet] = npc.character.name.split(' ');
        const culture = cultures[originCulture[npc.life.origin]];
        expect(culture.given).toContain(given);
        expect(culture.epithets).toContain(epithet);
      }
    }
    expect(names(42)).toEqual(names(42)); expect(names(4294967295)).toEqual(names(4294967295));
    expect(new Set(Array.from({ length: 50 }, (_, seed) => names(seed).join())).size).toBeGreaterThan(1);
  });
  it('uses no ambient randomness and leaves the outside world of the seed unchanged', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('ambient random'); });
    try {
      const s = session(9), base = createWorldSession(9);
      expect(base.success && base.value.outside).toEqual(s.outside);
    } finally { spy.mockRestore(); }
  });
  it('keeps ids tied to generation keys across seeds and accepts valid names without fixture provenance', () => {
    const a = session(1), b = session(2);
    expect(names(1)).not.toEqual(names(2));
    expect(a.npcs.map(n => n.character.id)).toEqual(['npc_w1_guild_0', 'npc_w1_guild_1', 'npc_w1_guild_2']);
    expect(a.npcs.map(n => n.character.id)).toEqual(b.npcs.map(n => n.character.id));
    expect(isNpcWorldSessionState(mutated(n => { n[0].character.name = 'Any Hand Edited Name'; }))).toBe(true);
  });
  it('rejects a bad seed like the world session', () => {
    expect(createNpcWorldSession(-1)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_SEED' } });
  });
});

describe('managerSlotTileIds', () => {
  it('lists only built tiles of mapped types, including paused ones', () => {
    const city = createSocietyState();
    city.tiles.find(t => t.id === 'spec-1')!.building = null;
    expect(managerSlotTileIds(city)).toEqual(['field-1', 'plain-1']);
    city.tiles[1].building = { typeId: 'processor', level: 1, workers: 0, enabled: false };
    city.tiles[2].building = { typeId: 'logging', level: 1, workers: 0, enabled: true };
    expect(managerSlotTileIds(city)).toEqual(['field-1', 'plain-1', 'forest-1']);
  });
});

describe('isNpcWorldSessionState', () => {
  it.each([
    ['missing npc key', (n: Mutable[]) => { delete n[0].postTileId; }],
    ['extra npc key', (n: Mutable[]) => { n[0].extra = 1; }],
    ['missing character key', (n: Mutable[]) => { delete n[0].character.health; }],
    ['extra character key', (n: Mutable[]) => { n[0].character.extra = 1; }],
    ['missing need', (n: Mutable[]) => { delete n[0].character.needs.safety; }],
    ['extra emotion', (n: Mutable[]) => { n[0].character.emotions.extra = 1; }],
    ['missing skill', (n: Mutable[]) => { delete n[0].character.skills.medical; }],
    ['extra relationship axis', (n: Mutable[]) => { n[0].character.relationshipToPlayer.extra = 1; }],
    ['skill above 100', (n: Mutable[]) => { n[0].character.skills.technical = 101; }],
    ['negative need', (n: Mutable[]) => { n[0].character.needs.safety = -1; }],
    ['NaN emotion', (n: Mutable[]) => { n[0].character.emotions.joy = NaN; }],
    ['Infinity relationship', (n: Mutable[]) => { n[0].character.relationshipToPlayer.trust = Infinity; }],
    ['string health', (n: Mutable[]) => { n[0].character.health = '100'; }],
    ['fractional age', (n: Mutable[]) => { n[0].character.age = 27.5; }],
    ['negative age', (n: Mutable[]) => { n[0].character.age = -1; }],
    ['unknown gender', (n: Mutable[]) => { n[0].character.gender = 'robot'; }],
    ['unknown occupation', (n: Mutable[]) => { n[0].character.occupation = 'pilot'; }],
    ['unknown social class', (n: Mutable[]) => { n[0].character.socialClass = 'royal'; }],
    ['unknown legal status', (n: Mutable[]) => { n[0].character.legalStatus = 'ghost'; }],
    ['untrimmed id', (n: Mutable[]) => { n[0].character.id = ' npc_test_untrimmed'; }],
    ['empty name', (n: Mutable[]) => { n[0].character.name = ''; }],
    ['long id', (n: Mutable[]) => { n[0].character.id = 'x'.repeat(65); }],
    ['duplicate npc id', (n: Mutable[]) => { n[1].character.id = n[0].character.id; }],
    ['unknown trait', (n: Mutable[]) => { n[0].traits = ['brave']; }],
    ['duplicate trait', (n: Mutable[]) => { n[0].traits = ['frugal', 'frugal']; }],
    ['non-empty memories', (n: Mutable[]) => { n[0].character.memories = [{ id: 'm', description: 'x', emotionalImpact: 1, tags: [], week: 1 }]; }],
    ['post on unknown tile', (n: Mutable[]) => { n[0].postTileId = 'nowhere'; }],
    ['post on empty tile', (n: Mutable[]) => { n[0].postTileId = 'plain-2'; }],
    ['two npcs on one tile', (n: Mutable[]) => { n[0].postTileId = 'field-1'; n[1].postTileId = 'field-1'; }],
    ['sparse list', (n: Mutable[]) => { delete n[2]; }],
  ] as const)('rejects %s', (_, mutate) => {
    expect(isNpcWorldSessionState(mutated(mutate))).toBe(false);
  });
  it('accepts posts on distinct manager tiles and an empty list', () => {
    expect(isNpcWorldSessionState(mutated(n => { n[0].postTileId = 'field-1'; n[1].postTileId = 'plain-1'; }))).toBe(true);
    expect(isNpcWorldSessionState({ ...session(), npcs: [] })).toBe(true);
  });
  it('rejects missing npcs, extra keys, an invalid world part, and accessor fields', () => {
    const s = session();
    expect(isNpcWorldSessionState({ city: s.city, outside: s.outside })).toBe(false);
    expect(isNpcWorldSessionState({ ...s, extra: 1 })).toBe(false);
    expect(isNpcWorldSessionState({ ...s, outside: { ...s.outside, seed: -1 } })).toBe(false);
    const npc = { ...s.npcs[0] }; Object.defineProperty(npc, 'postTileId', { enumerable: true, get: () => null });
    expect(isNpcWorldSessionState({ ...s, npcs: [npc, s.npcs[1], s.npcs[2]] })).toBe(false);
  });
  it('keeps the world v1 validator rejecting a session with npcs', () => {
    const s = session();
    expect(isWorldSessionState(s)).toBe(false);
    expect(isWorldSessionState({ city: s.city, outside: s.outside })).toBe(true);
  });
});
