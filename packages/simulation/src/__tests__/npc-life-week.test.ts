import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  buildItemWeekContext, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState,
  npcAge, npcAgeTitle, type CharacterLifeSessionState, type WorldNpc,
} from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { executeWorldNpcCityCommand } from '../world-npc.js';

type Notes = { exhausted: string[]; recovered: string[]; birthdays: string[] };
type Week = (npcs: WorldNpc[], input: { week: number; authority: number }) => { npcs: WorldNpc[]; report: Notes };
let weekly: Week | undefined;
beforeAll(async () => {
  const path = '../npc-life-week.js';
  try { weekly = (await import(path)).runNpcLifeWeek; } catch { weekly = undefined; }
});
function run(npcs: WorldNpc[], week = 2, authority = 0) {
  expect(weekly, 'The NPC weekly API must exist').toBeTypeOf('function');
  return weekly!(npcs, { week, authority });
}
function session() {
  const made = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
  if (!made.success) throw Error(made.error.message);
  return made.value;
}
function npc(stress = 0, posted = false, working = true) {
  const value = session().npcs[0];
  value.life.stress = stress; value.life.working = working;
  value.life.lust = 30; value.life.arousal = 0;
  value.character.relationshipToPlayer.affection = 0;
  value.postTileId = posted ? 'field-1' : null;
  return value;
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function action(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const result = executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
  expect(result.success).toBe(true);
  if (!result.success) throw Error(result.error.message);
  return result;
}
function end(s: CharacterLifeSessionState) { return action(s, 'END_WEEK', { expectedWeek: s.city.world.week }); }
const empty: Notes = { exhausted: [], recovered: [], birthdays: [] };

describe('Stress, halving and recovery boundaries', () => {
  it.each([[0, false, 0], [3, false, 0], [10, false, 5], [0, true, 4], [96, true, 100], [99, true, 100]] as const)
  ('stress %i posted %s becomes %i', (stress, posted, want) => {
    expect(run([npc(stress, posted)]).npcs[0].life.stress).toBe(want);
  });
  it.each([[69, 69, 4], [69, 70, 4], [70, 69, 4], [70, 70, 2], [100, 100, 2]] as const)
  ('Authority %i and affection %i add %i', (authority, affection, want) => {
    const value = npc(0, true); value.character.relationshipToPlayer.affection = affection;
    expect(run([value], 2, authority).npcs[0].life.stress).toBe(want);
  });
  it('exhausts at 100 once and keeps the post assigned', () => {
    const first = run([npc(96, true)]);
    expect(first.npcs[0].postTileId).toBe('field-1'); expect(first.npcs[0].life.working).toBe(false);
    expect(first.report).toEqual({ ...empty, exhausted: ['npc_starter_1'] });
    expect(first.npcs[0].life.history).toEqual({ counters: { exhausted: 1 }, recent: [{ week: 2, kind: 'exhausted' }] });
    const again = run(first.npcs, 3);
    expect(again.npcs[0].life.stress).toBe(100); expect(again.report).toEqual(empty);
    expect(again.npcs[0].life.history.counters.exhausted).toBe(1);
  });
  it.each([[86, false, 81, false], [85, false, 80, true], [77, true, 81, false], [76, true, 80, true]] as const)
  ('exhausted stress %i posted %s ends at %i working %s', (stress, posted, want, working) => {
    const result = run([npc(stress, posted, false)]);
    expect(result.npcs[0].life.stress).toBe(want); expect(result.npcs[0].life.working).toBe(working);
    expect(result.report.recovered).toEqual(working ? ['npc_starter_1'] : []);
    expect(result.npcs[0].life.history.counters.recovered).toBe(working ? 1 : undefined);
  });
  it('does not turn a still-posted exhausted NPC into a resting NPC', () => {
    const result = run([npc(95, true, false)]);
    expect(result.npcs[0].life).toMatchObject({ stress: 99, working: false }); expect(result.report).toEqual(empty);
  });
});

describe('Arousal, birthdays and bounded history', () => {
  it.each([[9, 0, 0], [10, 0, 1], [39, 0, 3], [40, 98, 100], [100, 100, 100]])
  ('lust %i at arousal %i becomes %i', (lust, arousal, want) => {
    const value = npc(); value.life.lust = lust; value.life.arousal = arousal;
    expect(run([value]).npcs[0].life.arousal).toBe(want);
  });
  it.each([[40, false], [41, true], [42, false]] as const)('birthday boundary week %i is %s', (week, birthday) => {
    const value = npc(); value.life.birthWeek = -1079;
    const result = run([value], week);
    expect(result.report.birthdays).toEqual(birthday ? ['npc_starter_1'] : []);
    expect(result.npcs[0].life.history.counters.birthday).toBe(birthday ? 1 : undefined);
  });
  it.each([[29, 30, 'Mature'], [49, 50, 'Granny']] as const)('age %i becomes %i with title %s', (age, want, title) => {
    const value = npc(); value.life.birthWeek = 1 - age * 40;
    const result = run([value], 41);
    expect(npcAge(result.npcs[0].life, 40)).toBe(age); expect(npcAge(result.npcs[0].life, 41)).toBe(want);
    expect(npcAgeTitle(want)).toBe(title); expect(result.npcs[0].character.age).toBe(value.character.age);
  });
  it('retains the newest 20 events while counters keep counting', () => {
    const value = npc(96, true);
    value.life.history = { counters: { 'post-assigned': 20 }, recent: Array.from({ length: 20 }, (_, i) => ({ week: i + 1, kind: 'post-assigned' })) };
    const result = run([value], 21);
    expect(result.npcs[0].life.history.counters).toEqual({ 'post-assigned': 20, exhausted: 1 });
    expect(result.npcs[0].life.history.recent).toEqual([...value.life.history.recent.slice(1), { week: 21, kind: 'exhausted' }]);
  });
  it('keeps NPC order and exhaustion before birthday history on the same tick', () => {
    const a = npc(96, true), b = npc(85, false, false); b.character.id = 'second';
    const result = run([b, a], 41);
    expect(result.npcs.map(n => n.character.id)).toEqual(['second', 'npc_starter_1']);
    expect(result.report).toEqual({ exhausted: ['npc_starter_1'], recovered: ['second'], birthdays: ['second', 'npc_starter_1'] });
    expect(result.npcs[1].life.history.recent).toEqual([{ week: 41, kind: 'exhausted' }, { week: 41, kind: 'birthday' }]);
  });
  it('does not mutate frozen inputs or unrelated character/life fields and draws no random value', () => {
    const value = npc(96, true), before = structuredClone(value); freeze(value);
    const random = vi.spyOn(Math, 'random');
    try {
      const a = run([value]), b = run([value]);
      expect(a).toEqual(b); expect(value).toEqual(before); expect(a.npcs[0].character).toEqual(before.character);
      expect({ ...a.npcs[0].life, stress: 96, working: true, arousal: 0, history: before.life.history }).toEqual(before.life);
      expect(random).not.toHaveBeenCalled();
      a.npcs[0].life.hobbies[0] = 'changed'; expect(value).toEqual(before);
    } finally { random.mockRestore(); }
  });
  it('refuses history counter overflow without modifying the input', () => {
    const value = npc(96, true); value.life.history.counters.exhausted = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(value);
    expect(() => run([value])).toThrow(/overflow/i); expect(value).toEqual(before);
  });
});

describe('item context and Character Life integration', () => {
  it('excludes exhausted post skills and worn traits, preserving Player context and the assigned post', () => {
    const s = session(); s.npcs[0].postTileId = 'field-1';
    s.city.society!.items.equipped.npc_starter_1 = { weapon: { id: 1, defId: 'wardens-oath' } };
    s.city.society!.items.nextItemId = 2;
    const active = buildItemWeekContext(s); expect(active.postTraits['field-1']).toEqual(['warden']);
    s.npcs[0].life.working = false;
    const before = structuredClone(s), exhausted = buildItemWeekContext(s);
    expect(exhausted.postSkills).toEqual({}); expect(exhausted.postTraits).toEqual({});
    expect(exhausted.playerSkills).toEqual(active.playerSkills); expect(exhausted.playerTraits).toEqual(active.playerTraits);
    expect(exhausted.playerRegen).toBe(active.playerRegen); expect(s).toEqual(before);
  });
  it('records real assignment, unassignment and replacement clears, but no no-op or rejected history', () => {
    let s = session(); s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
    expect(s.npcs[0].life.history).toEqual({ counters: { 'post-assigned': 1 }, recent: [{ week: 1, kind: 'post-assigned' }] });
    s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
    const before = structuredClone(s);
    expect(executeCharacterLifeCommand(s, { type: 'UNASSIGN_NPC', expectedRevision: -1, npcId: 'npc_starter_1' }).success).toBe(false);
    expect(s).toEqual(before);
    s = action(s, 'UNASSIGN_NPC', { npcId: 'npc_starter_1' }).next;
    s = action(s, 'UNASSIGN_NPC', { npcId: 'npc_starter_1' }).next;
    expect(s.npcs[0].life.history.counters).toEqual({ 'post-assigned': 1, 'post-cleared': 1 });
    s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
    const stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory; stocks.gold = 100000;
    s = action(s, 'REPLACE', { tileId: 'field-1', typeId: 'farm' }).next;
    expect(s.npcs[0].postTileId).toBeNull(); expect(s.npcs[0].life.history.counters).toEqual({ 'post-assigned': 2, 'post-cleared': 2 });
  });
  it('trims actual post history after 21 commands and retains the event counters', () => {
    let s = session();
    for (let i = 0; i < 21; i++) s = action(s, i % 2 ? 'UNASSIGN_NPC' : 'ASSIGN_NPC', { npcId: 'npc_starter_1', ...(i % 2 ? {} : { tileId: 'field-1' }) }).next;
    expect(s.npcs[0].life.history.counters).toEqual({ 'post-assigned': 11, 'post-cleared': 10 });
    expect(s.npcs[0].life.history.recent).toHaveLength(20);
    expect(s.npcs[0].life.history.recent[0].kind).toBe('post-cleared');
    expect(s.npcs[0].life.history.recent.at(-1)?.kind).toBe('post-assigned');
  });
  it.each([[70, 4], [100, 2]])('uses post-tile Authority after starting at %i', (authority, want) => {
    const s = session(); s.city.society!.order.authority = authority; s.npcs[0].postTileId = 'field-1';
    s.npcs[0].character.relationshipToPlayer.affection = 70;
    const r = end(s);
    expect(r.next.city.society!.order.authority >= 70).toBe(authority === 100);
    expect(r.next.npcs[0].life.stress).toBe(want);
  });
  it('updates a disabled assigned post and preserves NPC health', () => {
    let s = session(); s.npcs[0].postTileId = 'field-1'; s.npcs[0].life.stress = 96;
    s = action(s, 'SET_ENABLED', { tileId: 'field-1', enabled: false }).next;
    const health = s.npcs.map(n => n.character.health), r = end(s);
    expect(r.next.npcs[0].life).toMatchObject({ stress: 100, working: false }); expect(r.next.npcs[0].postTileId).toBe('field-1');
    expect(r.next.npcs.map(n => n.character.health)).toEqual(health);
    expect(r.report).toMatchObject({ npcLife: { exhausted: ['npc_starter_1'], recovered: [], birthdays: [] } });
  });
  it('reloads pre-B v10 false/95, rests only after clearing the post, and resumes at 80', () => {
    let s = session(); s.npcs[0].life.working = false; s.npcs[0].life.stress = 95; s.npcs[0].postTileId = 'field-1';
    const encoded = serializeCharacterLifeSave(s); if (!encoded.success) throw Error(encoded.error.message);
    const loaded = deserializeCharacterLifeSave(encoded.text); if (!loaded.success) throw Error(loaded.error.message);
    expect(loaded.state.npcs[0].life).toMatchObject({ stress: 95, working: false });
    expect(buildItemWeekContext(loaded.state).postSkills).toEqual({});
    s = action(loaded.state, 'UNASSIGN_NPC', { npcId: 'npc_starter_1' }).next;
    for (const [stress, working] of [[90, false], [85, false], [80, true]] as const) {
      const r = end(s); expect(r.next.npcs[0].life).toMatchObject({ stress, working });
      expect(r.report).toMatchObject(working ? { npcLife: { exhausted: [], recovered: ['npc_starter_1'], birthdays: [] } } : {});
      s = action(r.next, 'NEXT_WEEK').next;
    }
    s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
    expect(buildItemWeekContext(s).postSkills['field-1']).toBeDefined();
  });
  it('birthdays use the new clock, are frozen, and do not repeat after save/load', () => {
    const s = session(); s.city.world.week = 40;
    const r = end(s);
    expect(r.report?.week).toBe(40); expect(r.next.city.world.week).toBe(41);
    expect(r.report).toMatchObject({ npcLife: { exhausted: [], recovered: [], birthdays: ['npc_starter_1', 'npc_starter_2', 'npc_starter_3'] } });
    const notes = (r.report as unknown as { npcLife: Notes }).npcLife;
    expect(Object.isFrozen(r.report)).toBe(true); expect(Object.isFrozen(notes)).toBe(true); expect(Object.isFrozen(notes.birthdays)).toBe(true);
    expect(r.next.npcs[0].life.history.recent).toEqual([{ week: 41, kind: 'birthday' }]);
    expect(executeCharacterLifeCommand(r.next, { type: 'END_WEEK', expectedRevision: r.next.city.revision, expectedWeek: 41 }).success).toBe(false);
    const planning = action(r.next, 'NEXT_WEEK').next, saved = serializeCharacterLifeSave(planning);
    if (!saved.success) throw Error(saved.error.message);
    const loaded = deserializeCharacterLifeSave(saved.text); if (!loaded.success) throw Error(loaded.error.message);
    const second = end(loaded.state);
    expect(Object.hasOwn(second.report!, 'npcLife')).toBe(false); expect(second.next.npcs[0].life.history.counters.birthday).toBe(1);
  });
  it('omits npcLife on an ordinary week even while Arousal moves', () => {
    const s = session(); s.npcs[0].life.lust = 30;
    const r = end(s); expect(r.next.npcs[0].life.arousal).toBe(3); expect(Object.hasOwn(r.report!, 'npcLife')).toBe(false);
  });
  it('keeps every no-NPC result byte-identical to the old delegated path', () => {
    const s = session(); s.npcs = []; s.profiles = [];
    const equipped = s.city.society!.items.equipped;
    for (const id of Object.keys(equipped)) if (id !== 'player') delete equipped[id];
    expect(isCharacterLifeSessionState(s)).toBe(true);
    const raw = { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 };
    const old = executeWorldNpcCityCommand({ city: s.city, outside: s.outside, npcs: [] }, raw, buildItemWeekContext(s));
    expect(old.success).toBe(true); if (!old.success) throw Error(old.error.message);
    const expected = { ...old, next: { ...old.next, player: structuredClone(s.player), profiles: [] } };
    const actual = executeCharacterLifeCommand(s, raw);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected)); expect(run([]).report).toEqual(empty);
  });
  it('history overflow preserves the complete original command input', () => {
    const s = session(); s.npcs[0].postTileId = 'field-1'; s.npcs[0].life.stress = 96;
    s.npcs[0].life.history.counters.exhausted = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(s), r = executeCharacterLifeCommand(freeze(s), { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 });
    expect(r).toMatchObject({ success: false, error: { code: 'EXECUTION_ERROR' } }); expect(s).toEqual(before);
  });
  it('advances 100 adult NPCs deterministically across 60 weekly steps', () => {
    const template = npc();
    let values = Array.from({ length: 100 }, (_, i) => { const value = structuredClone(template); value.character.id = `perf_${i}`; return value; });
    const initial = structuredClone(values);
    for (let week = 2; week <= 61; week++) values = run(values, week).npcs;
    expect(values).toHaveLength(100); expect(values.every(n => n.life.arousal === 100 && n.life.history.counters.birthday === 1)).toBe(true);
    expect(initial.every(n => n.life.arousal === 0 && n.character.gender === 'female' && n.character.age >= 18)).toBe(true);
  });
});
