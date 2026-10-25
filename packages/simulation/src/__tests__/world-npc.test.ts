import { describe, expect, it } from 'vitest';
import { createNpcWorldSession, isNpcWorldSessionState, type NpcWorldSessionState } from '@haven/core';
import { executeWorldNpcCityCommand, executeWorldNpcCommand } from '../world-npc.js';

const session = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return r.value; };
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function ok(s: NpcWorldSessionState, cmd: Record<string, unknown>) {
  const r = executeWorldNpcCommand(s, { expectedRevision: s.city.revision, ...cmd });
  if (!r.success) throw Error(`${r.error.code}: ${r.error.message}`);
  return r.next;
}
function city(s: NpcWorldSessionState, cmd: Record<string, unknown>) {
  const r = executeWorldNpcCityCommand(s, { expectedRevision: s.city.revision, ...cmd });
  if (!r.success) throw Error(`${r.error.code}: ${r.error.message}`);
  return r.next;
}
const assign = (s: NpcWorldSessionState, npcId: string, tileId: string) => ok(s, { type: 'ASSIGN_NPC', npcId, tileId });
const unassign = (s: NpcWorldSessionState, npcId: string) => ok(s, { type: 'UNASSIGN_NPC', npcId });
const post = (s: NpcWorldSessionState, npcId: string) => s.npcs.find(n => n.character.id === npcId)!.postTileId;
function rejects(s: NpcWorldSessionState, cmd: Record<string, unknown>, code: string) {
  freeze(s); const before = structuredClone(s);
  const r = executeWorldNpcCommand(s, { expectedRevision: s.city.revision, ...cmd });
  expect(r).toMatchObject({ success: false, error: { code } }); expect(s).toEqual(before);
}

describe('executeWorldNpcCommand', () => {
  it('assigns an NPC with all skills 0 and health 1 to an unlocked slot', () => {
    const s = session(); const c = s.npcs[0].character;
    c.skills = { management: 0, technical: 0, medical: 0, combat: 0, negotiation: 0 }; c.health = 1;
    const next = assign(s, 'npc_mai', 'field-1');
    expect(post(next, 'npc_mai')).toBe('field-1'); expect(isNpcWorldSessionState(next)).toBe(true);
  });
  it('assigns an NPC with an adverse trait to an unlocked slot', () => {
    expect(post(assign(session(), 'npc_trang', 'plain-1'), 'npc_trang')).toBe('plain-1');
  });
  it('ignores stats and traits: two NPCs differing only in them get identical results', () => {
    const a = session(), b = session();
    b.npcs[0].character.skills = { management: 100, technical: 100, medical: 100, combat: 100, negotiation: 100 };
    b.npcs[0].traits = ['steady_hands']; b.npcs[0].character.health = 3;
    const na = assign(a, 'npc_mai', 'field-1'), nb = assign(b, 'npc_mai', 'field-1');
    expect(na.city).toEqual(nb.city); expect(na.npcs.map(n => n.postTileId)).toEqual(nb.npcs.map(n => n.postTileId));
  });
  it('starts with no automatic jobs and END_WEEK/NEXT_WEEK never assign anyone', () => {
    let s = session();
    expect(s.npcs.map(n => n.postTileId)).toEqual([null, null, null]);
    s = city(s, { type: 'END_WEEK', expectedWeek: s.city.world.week }); s = city(s, { type: 'NEXT_WEEK' });
    expect(s.npcs.map(n => n.postTileId)).toEqual([null, null, null]);
  });
  it('changes only npcs and city.revision on success', () => {
    const s = freeze(session()), next = assign(s, 'npc_vy', 'field-1');
    expect(next.city.revision).toBe(s.city.revision + 1);
    expect({ ...next.city, revision: s.city.revision }).toEqual(s.city); expect(next.outside).toEqual(s.outside);
    expect(next.npcs.slice(0, 1)).toEqual(s.npcs.slice(0, 1)); expect(next.npcs[2]).toEqual(s.npcs[2]);
    expect(post(s, 'npc_vy')).toBeNull();
  });
  it.each([['empty tile', 'plain-2'], ['unknown tile', 'nowhere'], ['empty string', '']])('LOCKED_POST for %s; nothing changes', (_, tileId) => {
    rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_mai', tileId }, 'LOCKED_POST');
  });
  it('POST_OCCUPIED when another NPC holds the slot', () => {
    rejects(assign(session(), 'npc_mai', 'field-1'), { type: 'ASSIGN_NPC', npcId: 'npc_vy', tileId: 'field-1' }, 'POST_OCCUPIED');
  });
  it('ALREADY_ASSIGNED when moving without unassign; same-target assign is a no-op', () => {
    const s = assign(session(), 'npc_mai', 'field-1');
    rejects(s, { type: 'ASSIGN_NPC', npcId: 'npc_mai', tileId: 'plain-1' }, 'ALREADY_ASSIGNED');
    const again = assign(s, 'npc_mai', 'field-1');
    expect(again.npcs).toEqual(s.npcs); expect(again.city.revision).toBe(s.city.revision + 1);
  });
  it('UNKNOWN_NPC, STALE_COMMAND, FORBIDDEN in Report, INVALID_COMMAND, INVALID_STATE', () => {
    rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_x', tileId: 'field-1' }, 'UNKNOWN_NPC');
    rejects(session(), { type: 'UNASSIGN_NPC', npcId: 'npc_x' }, 'UNKNOWN_NPC');
    const s = session();
    expect(executeWorldNpcCommand(s, { type: 'ASSIGN_NPC', expectedRevision: s.city.revision - 1, npcId: 'npc_mai', tileId: 'field-1' }))
      .toMatchObject({ success: false, error: { code: 'STALE_COMMAND' } });
    const report = city(session(), { type: 'END_WEEK', expectedWeek: 1 });
    expect(report.city.phase).toBe('report');
    rejects(report, { type: 'ASSIGN_NPC', npcId: 'npc_mai', tileId: 'field-1' }, 'FORBIDDEN');
    rejects(report, { type: 'UNASSIGN_NPC', npcId: 'npc_mai' }, 'FORBIDDEN');
    rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_mai' }, 'INVALID_COMMAND');
    rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_mai', tileId: 'field-1', extra: 1 }, 'INVALID_COMMAND');
    rejects(session(), { type: 'ASSIGN_NPC', npcId: 7, tileId: 'field-1' }, 'INVALID_COMMAND');
    rejects(session(), { type: 'BUILD', tileId: 'plain-2', typeId: 'market' }, 'INVALID_COMMAND');
    const getter = { type: 'UNASSIGN_NPC', expectedRevision: 0 }; Object.defineProperty(getter, 'npcId', { enumerable: true, get: () => 'npc_mai' });
    expect(executeWorldNpcCommand(session(), getter)).toMatchObject({ success: false, error: { code: 'INVALID_COMMAND' } });
    const bad = session(); bad.npcs[0].postTileId = 'plain-2';
    rejects(bad, { type: 'UNASSIGN_NPC', npcId: 'npc_vy' }, 'INVALID_STATE');
    expect(executeWorldNpcCommand(null, { type: 'UNASSIGN_NPC', expectedRevision: 0, npcId: 'npc_mai' })).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
  });
  it('survives 3 assign/unassign/replace cycles without duplicate or lost posts', () => {
    let s = session();
    for (let i = 0; i < 3; i++) {
      s = assign(s, 'npc_mai', 'field-1'); s = assign(s, 'npc_vy', 'plain-1');
      expect(s.npcs.map(n => n.postTileId)).toEqual(['field-1', 'plain-1', null]);
      s = unassign(s, 'npc_mai'); s = assign(s, 'npc_trang', 'field-1');
      s = unassign(s, 'npc_trang'); s = unassign(s, 'npc_trang');
      s = city(s, { type: 'REPLACE', tileId: 'plain-1', typeId: 'processor' });
      expect(s.npcs.map(n => n.postTileId)).toEqual([null, null, null]);
      expect(isNpcWorldSessionState(s)).toBe(true);
    }
  });
});

describe('executeWorldNpcCityCommand', () => {
  const held = () => assign(assign(session(), 'npc_mai', 'field-1'), 'npc_vy', 'plain-1');
  it('REPLACE clears that post in the same result and the slot can be reassigned', () => {
    const s = city(held(), { type: 'REPLACE', tileId: 'plain-1', typeId: 'market' });
    expect(s.city.tiles[1].building?.typeId).toBe('market');
    expect(s.npcs.map(n => n.postTileId)).toEqual(['field-1', null, null]);
    expect(post(assign(s, 'npc_trang', 'plain-1'), 'npc_trang')).toBe('plain-1');
  });
  it('pause and resume keep the post', () => {
    let s = city(held(), { type: 'SET_ENABLED', tileId: 'field-1', enabled: false });
    expect(post(s, 'npc_mai')).toBe('field-1');
    s = city(s, { type: 'SET_ENABLED', tileId: 'field-1', enabled: true });
    expect(post(s, 'npc_mai')).toBe('field-1');
  });
  it('upgrade keeps the post', () => {
    let s = held(); s = city(s, { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }); s = assign(s, 'npc_trang', 'forest-1');
    s = city(s, { type: 'UPGRADE', tileId: 'forest-1' });
    expect(s.city.tiles[2].building?.level).toBe(2); expect(post(s, 'npc_trang')).toBe('forest-1');
  });
  it('END_WEEK and NEXT_WEEK keep posts and return the report', () => {
    const s = held(), r = executeWorldNpcCityCommand(s, { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: 1 });
    expect(r.success && r.report?.week).toBe(1);
    if (!r.success) return;
    expect(r.next.npcs).toEqual(s.npcs);
    expect(city(r.next, { type: 'NEXT_WEEK' }).npcs).toEqual(s.npcs);
  });
  it('a failed city command leaves the session untouched', () => {
    const s = freeze(held()), before = structuredClone(s);
    expect(executeWorldNpcCityCommand(s, { type: 'REPLACE', expectedRevision: s.city.revision, tileId: 'plain-1', typeId: 'farm' }))
      .toMatchObject({ success: false, error: { code: 'INVALID_PLACEMENT' } });
    expect(executeWorldNpcCityCommand(s, { type: 'BUILD', expectedRevision: s.city.revision - 1, tileId: 'plain-2', typeId: 'market' }))
      .toMatchObject({ success: false, error: { code: 'STALE_COMMAND' } });
    expect(s).toEqual(before);
  });
  it('refuses LOAD_TRIAL and invalid sessions', () => {
    const s = held();
    expect(executeWorldNpcCityCommand(s, { type: 'LOAD_TRIAL', expectedRevision: s.city.revision, snapshot: session().city }))
      .toMatchObject({ success: false, error: { code: 'INVALID_COMMAND' } });
    const bad = held(); bad.npcs[2].postTileId = 'field-1';
    expect(executeWorldNpcCityCommand(bad, { type: 'NEXT_WEEK', expectedRevision: bad.city.revision }))
      .toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
  });
});
