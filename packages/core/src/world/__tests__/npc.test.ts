import { describe, expect, it } from 'vitest';
import { createTileTrialState } from '../../trial/state.js';
import { isWorldSessionState } from '../session.js';
import { NPC_MANAGER_BUILDING_TYPES, WORLD_STARTER_NPCS, WORLD_TRAITS } from '../npc-content.js';
import { createNpcWorldSession, isNpcWorldSessionState, isWorldNpcList, managerSlotTileIds } from '../npc.js';

const session = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return r.value; };
type Mutable = Record<string, any>;
const mutated = (mutate: (npcs: Mutable[]) => void) => { const s = session(); mutate(s.npcs as unknown as Mutable[]); return s; };

describe('starter content', () => {
  it('has exactly 3 frozen, valid, unassigned female starters with known traits', () => {
    expect(WORLD_STARTER_NPCS).toHaveLength(3);
    expect(WORLD_STARTER_NPCS.map(n => n.character.id)).toEqual(['npc_mai', 'npc_vy', 'npc_trang']);
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
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'market']);
  });
});

describe('createNpcWorldSession', () => {
  it('creates a valid session whose npcs do not alias starter content', () => {
    const s = session();
    expect(isNpcWorldSessionState(s)).toBe(true);
    expect(s.npcs).toEqual(WORLD_STARTER_NPCS);
    s.npcs[0].character.skills.technical = 0; s.npcs[0].traits.push('blunt');
    expect(WORLD_STARTER_NPCS[0].character.skills.technical).toBe(65);
    expect(WORLD_STARTER_NPCS[0].traits).toEqual(['frugal', 'restless']);
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
