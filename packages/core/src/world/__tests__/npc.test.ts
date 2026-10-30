import { describe, expect, it, vi } from 'vitest';
import { createTileTrialState } from '../../trial/state.js';
import { createWorldSession, isWorldSessionState } from '../session.js';
import { NPC_MANAGER_BUILDING_TYPES, WORLD_NPC_GIVEN_NAMES, WORLD_STARTER_NPCS, WORLD_TRAITS } from '../npc-content.js';
import { createNpcWorldSession, isNpcWorldSessionState, isWorldNpcList, managerSlotTileIds } from '../npc.js';

const session = (seed = 0) => { const r = createNpcWorldSession(seed); if (!r.success) throw Error(r.error.message); return r.value; };
type Mutable = Record<string, any>;
const names = (seed: number) => session(seed).npcs.map(n => n.character.name);
const unnamed = (npcs: readonly { character: { name: string } }[]) => npcs.map(n => ({ ...n, character: { ...n.character, name: '' } }));
const mutated = (mutate: (npcs: Mutable[]) => void) => { const s = session(); mutate(s.npcs as unknown as Mutable[]); return s; };

describe('starter content', () => {
  it('has exactly 3 frozen, valid, unassigned female starters with known traits', () => {
    expect(WORLD_STARTER_NPCS).toHaveLength(3);
    expect(WORLD_STARTER_NPCS.map(n => n.character.id)).toEqual(['npc_starter_1', 'npc_starter_2', 'npc_starter_3']);
    const traitIds = WORLD_TRAITS.map(t => t.id);
    for (const npc of WORLD_STARTER_NPCS) {
      expect(npc.character.gender).toBe('female');
      expect(npc.postTileId).toBeNull();
      expect(npc.character.memories).toEqual([]);
      expect(npc.traits.length).toBeGreaterThan(0);
      npc.traits.forEach(t => expect(traitIds).toContain(t));
      expect(Object.isFrozen(npc) && Object.isFrozen(npc.character) && Object.isFrozen(npc.character.skills) && Object.isFrozen(npc.traits)).toBe(true);
    }
    expect(Object.isFrozen(WORLD_STARTER_NPCS) && Object.isFrozen(WORLD_TRAITS) && Object.isFrozen(NPC_MANAGER_BUILDING_TYPES)).toBe(true);
    expect(isWorldNpcList(WORLD_STARTER_NPCS, createTileTrialState())).toBe(true);
  });
  it('maps manager posts to the six existing building types', () => {
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'market', 'town-hall', 'town-market']);
  });
});

describe('createNpcWorldSession', () => {
  it('creates a valid session whose npcs do not alias starter content', () => {
    const s = session();
    expect(isNpcWorldSessionState(s)).toBe(true);
    expect(unnamed(s.npcs)).toEqual(unnamed(WORLD_STARTER_NPCS));
    s.npcs[0].character.skills.technical = 0; s.npcs[0].traits.push('blunt');
    expect(WORLD_STARTER_NPCS[0].character.skills.technical).toBe(65);
    expect(WORLD_STARTER_NPCS[0].traits).toEqual(['frugal', 'restless']);
  });
  it('resolves three distinct English pool names from the seed, reproducibly', () => {
    for (let seed = 0; seed < 200; seed++) {
      const n = names(seed);
      expect(new Set(n).size).toBe(3); n.forEach(name => expect(WORLD_NPC_GIVEN_NAMES).toContain(name));
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
  it('keeps identity, stats and traits independent of the resolved names', () => {
    const a = session(1), b = session(2);
    expect(names(1)).not.toEqual(names(2));
    expect(a.npcs.map(n => n.character.id)).toEqual(['npc_starter_1', 'npc_starter_2', 'npc_starter_3']);
    expect(unnamed(a.npcs)).toEqual(unnamed(b.npcs));
    expect(isNpcWorldSessionState(mutated(n => { n[0].character.name = 'Any Hand Edited Name'; }))).toBe(true);
  });
  it('has a small original English name pool and no fixed provisional names', () => {
    expect(WORLD_NPC_GIVEN_NAMES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(WORLD_NPC_GIVEN_NAMES).size).toBe(WORLD_NPC_GIVEN_NAMES.length);
    WORLD_NPC_GIVEN_NAMES.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+$/));
    expect(Object.isFrozen(WORLD_NPC_GIVEN_NAMES)).toBe(true);
    for (const old of ['Mai', 'Vy', 'Trang']) expect(JSON.stringify([WORLD_STARTER_NPCS, WORLD_NPC_GIVEN_NAMES])).not.toContain(old);
  });
  it('rejects a bad seed like the world session', () => {
    expect(createNpcWorldSession(-1)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_SEED' } });
  });
});

describe('managerSlotTileIds', () => {
  it('lists only built tiles of mapped types, including paused ones', () => {
    const city = createTileTrialState();
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
    ['untrimmed id', (n: Mutable[]) => { n[0].character.id = ' npc_mai'; }],
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
