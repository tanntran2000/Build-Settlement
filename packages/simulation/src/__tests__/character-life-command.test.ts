import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SOCIETY_RULESET, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState,
  isLiveCharacterLifeSessionState, type CharacterLifeSessionState,
} from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import * as delegates from '../world-npc.js';
import { executeCharacterLifeCommand, type CharacterLifeActionType, type CharacterLifeCommandResult } from '../character-life-command.js';

function life(seed = 0): CharacterLifeSessionState {
  const r = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }, SOCIETY_RULESET);
  if (!r.success) throw Error(r.error.message);
  return r.value;
}

function legacy(s: CharacterLifeSessionState, raw: Record<string, unknown>): CharacterLifeCommandResult {
  const world = { city: s.city, outside: s.outside, npcs: s.npcs };
  const r = raw.type === 'ASSIGN_NPC' || raw.type === 'UNASSIGN_NPC'
    ? delegates.executeWorldNpcCommand(world, raw) : delegates.executeWorldNpcCityCommand(world, raw);
  return r.success ? { ...r, next: { ...r.next, player: structuredClone(s.player), profiles: structuredClone(s.profiles) } } : r;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

function success(r: CharacterLifeCommandResult) {
  expect(r.success).toBe(true);
  if (!r.success) throw Error(r.error.message);
  return r;
}

function oldAction(s: CharacterLifeSessionState, fields: Record<string, unknown>) {
  return success(legacy(s, { expectedRevision: s.city.revision, ...fields })).next;
}

const failure = (code: string, message: string) => ({ success: false, error: { code, message } });
const invalidCommand = failure('INVALID_COMMAND', 'Command must contain plain data fields.');
const invalidState = failure('INVALID_STATE', 'World session is invalid; nothing was changed.');
const unsupported = failure('UNSUPPORTED_ACTION', 'This action is not supported in Character Life.');
const executionError = failure('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.');

function rejection(s: CharacterLifeSessionState, fields: Record<string, unknown>, code: string) {
  expect(isLiveCharacterLifeSessionState(s)).toBe(true);
  const before = structuredClone(s), raw = freeze({ expectedRevision: s.city.revision, ...fields });
  freeze(s);
  const expected = legacy(s, raw);
  expect(expected).toMatchObject({ success: false, error: { code } });
  expect(s).toEqual(before);
  const r = executeCharacterLifeCommand(s, raw);
  expect(r).toEqual(expected);
  expect(r).toMatchObject({ success: false, error: { code } });
  expect(s).toEqual(before);
  expect(s.city.revision).toBe(before.city.revision);
}

afterEach(() => vi.restoreAllMocks());

it('full-session parity through two week cycles', () => {
  let s = life(), old = life();
  const actions: Record<string, unknown>[] = [
    { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' },
    { type: 'UPGRADE', tileId: 'forest-1' },
    { type: 'SET_WORKERS', tileId: 'forest-1', workers: 2 },
    { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'forest-1' },
    { type: 'SET_ENABLED', tileId: 'forest-1', enabled: false },
    { type: 'SET_ENABLED', tileId: 'forest-1', enabled: true },
    { type: 'UNASSIGN_NPC', npcId: 'npc_starter_1' },
    { type: 'ASSIGN_NPC', npcId: 'npc_starter_2', tileId: 'plain-1' },
    { type: 'REPLACE', tileId: 'plain-1', typeId: 'processor' },
    { type: 'SET_WORKERS', tileId: 'plain-1', workers: 2 },
    { type: 'END_WEEK' }, { type: 'NEXT_WEEK' }, { type: 'END_WEEK' }, { type: 'NEXT_WEEK' },
  ];
  for (const action of actions) {
    const before = structuredClone(s), oldBefore = structuredClone(old);
    freeze(s); freeze(old);
    const raw = freeze({ ...action, expectedRevision: s.city.revision,
      ...(action.type === 'END_WEEK' ? { expectedWeek: s.city.world.week } : {}) });
    const expected = success(legacy(old, raw)), r = success(executeCharacterLifeCommand(s, raw));
    expect(r).toEqual(expected);
    expect(Object.keys(r.next).sort()).toEqual(['city', 'npcs', 'outside', 'player', 'profiles']);
    expect(r.next.city.revision).toBe(s.city.revision + 1);
    expect(s).toEqual(before); expect(old).toEqual(oldBefore);
    if (action.type === 'SET_ENABLED') {
      expect(r.next.city.tiles.find(t => t.id === 'forest-1')!.building!.workers).toBe(0);
      expect(r.next.npcs[0].postTileId).toBe('forest-1');
    }
    if (action.type === 'REPLACE') expect(r.next.npcs[1].postTileId).toBeNull();
    if (action.type === 'END_WEEK') {
      expect(r.next.city.phase).toBe('report');
      expect(r.report?.week).toBe(s.city.world.week);
      expect(r.next.city.world.week).toBe(s.city.world.week + 1);
    } else {
      expect(r.next.city.phase).toBe('planning');
      expect(r.report).toBeUndefined();
    }
    s = r.next; old = expected.next;
  }
  expect(s.city.world.week).toBe(3);
  expect(s.city.phase).toBe('planning');
});

describe('supported rejection parity and first-match taxonomy', () => {
  const commands: { type: CharacterLifeActionType; fields: Record<string, unknown>; bad: Record<string, unknown>; code: string }[] = [
    { type: 'BUILD', fields: { tileId: 'forest-1', typeId: 'logging' }, bad: { tileId: 7 }, code: 'INVALID_TILE' },
    { type: 'REPLACE', fields: { tileId: 'plain-1', typeId: 'processor' }, bad: { typeId: 7 }, code: 'INVALID_BUILDING' },
    { type: 'UPGRADE', fields: { tileId: 'plain-1' }, bad: { tileId: 7 }, code: 'INVALID_TILE' },
    { type: 'SET_WORKERS', fields: { tileId: 'plain-1', workers: 2 }, bad: { workers: -1 }, code: 'INVALID_WORKFORCE' },
    { type: 'SET_ENABLED', fields: { tileId: 'plain-1', enabled: true }, bad: { enabled: 1 }, code: 'INVALID_COMMAND' },
    { type: 'END_WEEK', fields: { expectedWeek: 1 }, bad: { expectedWeek: 0 }, code: 'WEEK_MISMATCH' },
    { type: 'NEXT_WEEK', fields: {}, bad: { extra: true }, code: 'INVALID_COMMAND' },
    { type: 'ASSIGN_NPC', fields: { npcId: 'npc_starter_1', tileId: 'field-1' }, bad: { npcId: 7 }, code: 'INVALID_COMMAND' },
    { type: 'UNASSIGN_NPC', fields: { npcId: 'npc_starter_1' }, bad: { npcId: 7 }, code: 'INVALID_COMMAND' },
  ];
  it.each(commands)('$type preserves fields/revision/phase ordering', ({ type, fields, bad, code }) => {
    const planning = life(), report = oldAction(life(), { type: 'END_WEEK', expectedWeek: 1 });
    const npc = type === 'ASSIGN_NPC' || type === 'UNASSIGN_NPC';
    for (const s of [planning, report]) {
      const phaseCode = s.city.phase === 'report' ? (type === 'NEXT_WEEK' ? null : 'FORBIDDEN')
        : (type === 'NEXT_WEEK' ? 'FORBIDDEN' : null);
      rejection(s, { type, ...fields, expectedRevision: -1 }, 'STALE_COMMAND');
      rejection(s, { type, ...fields, extra: true, expectedRevision: -1 }, npc ? 'INVALID_COMMAND' : 'STALE_COMMAND');
      rejection(s, { type, ...fields, ...bad, expectedRevision: -1 }, npc ? 'INVALID_COMMAND' : 'STALE_COMMAND');
      rejection(s, { type, ...fields, extra: true }, npc ? 'INVALID_COMMAND' : phaseCode ?? 'INVALID_COMMAND');
      if (type !== 'NEXT_WEEK') rejection(s, { type }, npc ? 'INVALID_COMMAND' : phaseCode ?? 'INVALID_COMMAND');
      rejection(s, { type, ...fields, ...bad }, npc ? 'INVALID_COMMAND' : phaseCode ?? code);
      if (phaseCode) rejection(s, { type, ...fields }, phaseCode);
      const missingRevision = { type, ...fields };
      const before = structuredClone(s), expected = legacy(s, missingRevision);
      expect(expected).toMatchObject({ success: false, error: { code: npc ? 'INVALID_COMMAND' : 'STALE_COMMAND' } });
      expect(executeCharacterLifeCommand(s, missingRevision)).toEqual(expected);
      expect(s).toEqual(before);
    }
  });

  it('pins gameplay rejection codes on valid affordable or isolated fixtures', () => {
    const built = oldAction(life(), { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' });
    const max = oldAction(oldAction(built, { type: 'UPGRADE', tileId: 'forest-1' }), { type: 'UPGRADE', tileId: 'forest-1' });
    const assigned = oldAction(life(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'field-1' });
    const zeroStock = life(); zeroStock.city.world.settlements.settlement_haven_01.inventory.gold = 0;
    const noCapacity = life(); noCapacity.city.society!.classes.free = 0; noCapacity.city.world.settlements.settlement_haven_01.cohorts[0].count -= 55;
    for (const tile of noCapacity.city.tiles) if (tile.building) tile.building.workers = 0;
    const cases: [CharacterLifeSessionState, Record<string, unknown>, string][] = [
      [life(), { type: 'END_WEEK', expectedWeek: 0 }, 'WEEK_MISMATCH'],
      [life(), { type: 'BUILD', tileId: 'missing', typeId: 'logging' }, 'INVALID_TILE'],
      [life(), { type: 'BUILD', tileId: 'forest-1', typeId: 'missing' }, 'INVALID_BUILDING'],
      [life(), { type: 'BUILD', tileId: 'plain-2', typeId: 'logging' }, 'INVALID_PLACEMENT'],
      [built, { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }, 'OCCUPIED'],
      [life(), { type: 'REPLACE', tileId: 'forest-1', typeId: 'logging' }, 'EMPTY_TILE'],
      [max, { type: 'UPGRADE', tileId: 'forest-1' }, 'MAX_LEVEL'],
      [zeroStock, { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }, 'INSUFFICIENT_RESOURCES'],
      [built, { type: 'SET_WORKERS', tileId: 'forest-1', workers: 0.5 }, 'INVALID_WORKFORCE'],
      [built, { type: 'SET_WORKERS', tileId: 'forest-1', workers: 3 }, 'INVALID_PLAN'],
      [noCapacity, { type: 'SET_WORKERS', tileId: 'field-1', workers: 1 }, 'INVALID_PLAN'],
      [life(), { type: 'ASSIGN_NPC', npcId: 'missing', tileId: 'field-1' }, 'UNKNOWN_NPC'],
      [life(), { type: 'UNASSIGN_NPC', npcId: 'missing' }, 'UNKNOWN_NPC'],
      [life(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-2' }, 'LOCKED_POST'],
      [assigned, { type: 'ASSIGN_NPC', npcId: 'npc_starter_2', tileId: 'field-1' }, 'POST_OCCUPIED'],
      [assigned, { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-1' }, 'ALREADY_ASSIGNED'],
    ];
    for (const [s, raw, code] of cases) rejection(s, raw, code);
  });
});

describe('own data and prototype taxonomy precedes session and revision', () => {
  it('rejects malformed raw descriptors without invoking getters or changing inputs', () => {
    const getter = vi.fn(() => { throw Error('must not run'); });
    class Command { type = 'BUILD'; }
    const accessorType = Object.defineProperty({}, 'type', { enumerable: true, get: getter });
    const accessorField = Object.defineProperty({ type: 'BUILD' }, 'tileId', { enumerable: true, get: getter });
    const hiddenField = Object.defineProperty({ type: 'BUILD' }, 'hidden', { value: 1 });
    const hiddenType = Object.defineProperty({}, 'type', { value: 'BUILD' });
    const inherited = Object.create(Object.defineProperty({}, 'type', { get: getter }));
    const rawCases: unknown[] = [null, [], 1, 'BUILD', true, undefined, new Command(),
      Object.assign(Object.create({}), { type: 'BUILD' }), inherited, {}, { type: 1 }, { type: null },
      accessorType, accessorField, hiddenField, hiddenType, { type: 'BUILD', [Symbol('hidden')]: 1 }];
    for (const s of [life(), oldAction(life(), { type: 'END_WEEK', expectedWeek: 1 }), null]) {
      const before = structuredClone(s);
      for (const raw of rawCases) {
        const descriptors = raw && typeof raw === 'object' ? Object.getOwnPropertyDescriptors(raw) : null;
        expect(executeCharacterLifeCommand(s, raw)).toEqual(invalidCommand);
        expect(s).toEqual(before);
        expect(getter).not.toHaveBeenCalled();
        if (descriptors) expect(Object.getOwnPropertyDescriptors(raw)).toEqual(descriptors);
      }
    }
  });

  it.each(['LOAD_TRIAL', 'CHOOSE', 'SKIP', 'unknown', 'constructor', 'toString', '__proto__'])('%s wins over session, revision and Report', type => {
    const expected = type === 'LOAD_TRIAL'
      ? failure('INVALID_COMMAND', 'Load an NPC world checkpoint through Continue or Import.') : unsupported;
    const getter = vi.fn(() => { throw Error('must not run'); });
    for (const s of [life(), oldAction(life(), { type: 'END_WEEK', expectedWeek: 1 }), null, { player: null }]) {
      const before = structuredClone(s);
      for (const expectedRevision of [0, -1]) {
        expect(executeCharacterLifeCommand(s, { type, expectedRevision })).toEqual(expected);
        expect(s).toEqual(before);
        expect(getter).not.toHaveBeenCalled();
      }
    }
    const hostile = Object.defineProperty(life(), 'city', { enumerable: true, get: getter });
    const descriptors = Object.getOwnPropertyDescriptors(hostile);
    expect(executeCharacterLifeCommand(hostile, { type, expectedRevision: -1 })).toEqual(expected);
    expect(Object.getOwnPropertyDescriptors(hostile)).toEqual(descriptors);
    expect(getter).not.toHaveBeenCalled();
    const badRaw = Object.defineProperty({ type }, 'extra', { enumerable: true, get: getter });
    const rawDescriptors = Object.getOwnPropertyDescriptors(badRaw);
    expect(executeCharacterLifeCommand(hostile, badRaw)).toEqual(invalidCommand);
    expect(Object.getOwnPropertyDescriptors(badRaw)).toEqual(rawDescriptors);
    expect(Object.getOwnPropertyDescriptors(hostile)).toEqual(descriptors);
    expect(getter).not.toHaveBeenCalled();
  });

  it.each(['city', 'outside', 'npcs', 'player', 'profiles'] as const)('rejects invalid %s before supported command fields/revision', key => {
    const s = { ...life(), [key]: null }, before = structuredClone(s);
    const getter = vi.fn(() => { throw Error('must not run'); });
    const hostile = Object.defineProperty(life(), key, { enumerable: true, get: getter });
    const descriptors = Object.getOwnPropertyDescriptors(hostile);
    for (const type of ['BUILD', 'ASSIGN_NPC']) {
      expect(executeCharacterLifeCommand(s, { type, expectedRevision: -1 })).toEqual(invalidState);
      expect(s).toEqual(before);
      expect(executeCharacterLifeCommand(hostile, { type, expectedRevision: -1 })).toEqual(invalidState);
      expect(Object.getOwnPropertyDescriptors(hostile)).toEqual(descriptors);
      expect(getter).not.toHaveBeenCalled();
    }
    expect(executeCharacterLifeCommand(null, { type: 'BUILD', expectedRevision: 0 })).toEqual(invalidState);
  });

  it('accepts null-prototype command data with identical complete results', () => {
    const s = freeze(life()), before = structuredClone(s);
    for (const raw of [
      { type: 'BUILD', expectedRevision: 0, tileId: 'forest-1', typeId: 'logging' },
      { type: 'ASSIGN_NPC', expectedRevision: 0, npcId: 'npc_starter_1', tileId: 'field-1' },
      { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 },
      { type: 'UNASSIGN_NPC', expectedRevision: -1, npcId: 'npc_starter_1' },
      { type: 'SET_ENABLED', expectedRevision: 0, tileId: 'plain-1', enabled: 7 },
    ]) {
      const expected = legacy(s, raw), plain = executeCharacterLifeCommand(s, raw);
      const nullRaw = Object.assign(Object.create(null), raw), rawBefore = Object.getOwnPropertyDescriptors(nullRaw);
      expect(plain).toEqual(expected);
      expect(executeCharacterLifeCommand(s, nullRaw)).toEqual(expected);
      expect(Object.getOwnPropertyDescriptors(nullRaw)).toEqual(rawBefore);
      expect(s).toEqual(before);
    }
  });

  it('rejects failed raw inspection without touching the session', () => {
    const s = freeze(life()), before = structuredClone(s);
    const raw = Proxy.revocable({}, {}); raw.revoke();
    expect(executeCharacterLifeCommand(s, raw.proxy)).toEqual(invalidCommand);
    expect(s).toEqual(before);
  });
});

it.each(['planning', 'report'] as const)('hostile live tile indices preserve both phases: %s', phase => {
  const s = phase === 'planning' ? life() : oldAction(life(), { type: 'END_WEEK', expectedWeek: 1 });
  const before = structuredClone(s), tile = s.city.tiles[0];
  const getter = vi.fn(() => { s.city.revision++; s.city.world.settlements.settlement_haven_01.inventory.gold++; return tile; });
  Object.defineProperty(s.city.tiles, '0', { enumerable: true, get: getter });
  const descriptors = Object.getOwnPropertyDescriptors(s.city.tiles);
  const raw = phase === 'planning' ? { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: s.city.world.week }
    : { type: 'NEXT_WEEK', expectedRevision: s.city.revision };
  expect(executeCharacterLifeCommand(s, raw)).toEqual(invalidState);
  expect(getter).not.toHaveBeenCalled();
  expect(Object.getOwnPropertyDescriptors(s.city.tiles)).toEqual(descriptors);
  expect({ ...s.city, tiles: undefined }).toEqual({ ...before.city, tiles: undefined });
  expect({ outside: s.outside, npcs: s.npcs, player: s.player, profiles: s.profiles })
    .toEqual({ outside: before.outside, npcs: before.npcs, player: before.player, profiles: before.profiles });
});

describe('success detaches all five parts', () => {
  it.each([
    { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' },
    { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'field-1' },
  ])('$type detaches nested mutable session data', action => {
    const s = freeze(life()), before = structuredClone(s);
    const spy = vi.spyOn(delegates, action.type === 'ASSIGN_NPC' ? 'executeWorldNpcCommand' : 'executeWorldNpcCityCommand');
    const raw = freeze({ expectedRevision: s.city.revision, ...action });
    const r = success(executeCharacterLifeCommand(s, raw));
    expect(spy).toHaveBeenCalledExactlyOnceWith({ city: s.city, outside: s.outside, npcs: s.npcs }, raw);
    expect(spy.mock.calls[0][1]).toBe(raw);
    r.next.city.world.settlements.settlement_haven_01.inventory.gold = -1;
    r.next.outside.tiles[0].knownBy.push('tampered');
    r.next.npcs[0].character.skills.management = -1;
    r.next.player.profile.identity.origin.regionId = 'tampered';
    r.next.profiles[0].appearance.face.features.push('tampered');
    expect(s).toEqual(before);
  });

  it('preserves the frozen delegated report contract', () => {
    const s = freeze(life()), inputBefore = structuredClone(s);
    const r = success(executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: s.city.world.week }));
    expect(r.report).toBeDefined();
    if (!r.report) throw Error('END_WEEK must return its report');
    const outputBefore = structuredClone(r);
    for (const value of [r.report, r.report.before, r.report.after, r.report.goods, r.report.activities]) expect(Object.isFrozen(value)).toBe(true);
    expect(Reflect.set(r.report.before, 'gold', -1)).toBe(false);
    expect(Reflect.set(r.report.goods, 'servedMilli', -1)).toBe(false);
    expect(Reflect.set(r.report.activities, '0', 'tampered')).toBe(false);
    expect(s).toEqual(inputBefore);
    expect(r).toEqual(outputBefore);
  });

  it.each(['executeWorldNpcCommand', 'executeWorldNpcCityCommand'] as const)('revalidates invalid successful output from %s', handler => {
    const s = freeze(life()), before = structuredClone(s), invalid = life();
    invalid.npcs[0].character.age = 17;
    vi.spyOn(delegates, handler).mockReturnValueOnce({ success: true,
      next: { city: invalid.city, outside: invalid.outside, npcs: invalid.npcs } });
    const raw = handler === 'executeWorldNpcCommand'
      ? { type: 'ASSIGN_NPC', expectedRevision: s.city.revision, npcId: 'npc_starter_1', tileId: 'field-1' }
      : { type: 'BUILD', expectedRevision: s.city.revision, tileId: 'forest-1', typeId: 'logging' };
    expect(executeCharacterLifeCommand(s, raw)).toEqual(executionError);
    expect(s).toEqual(before);
  });

  it('preserves the original when cloning Player fails after successful delegation', () => {
    const s = freeze(life()), before = structuredClone(s), clone = structuredClone;
    vi.spyOn(globalThis, 'structuredClone').mockImplementation(value => {
      if (value === s.player) throw Error('clone failed');
      return clone(value);
    });
    expect(executeCharacterLifeCommand(s, { type: 'BUILD', expectedRevision: s.city.revision, tileId: 'forest-1', typeId: 'logging' }))
      .toEqual(executionError);
    expect(s).toEqual(before);
  });
});

it('live Report never becomes a save', () => {
  const created = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }, SOCIETY_RULESET);
  if (!created.success) throw Error();
  const s = freeze(created.value), before = structuredClone(s), planningSave = serializeCharacterLifeSave(s);
  expect(planningSave.success).toBe(true);
  if (!planningSave.success) throw Error(planningSave.error.message);
  const r = success(executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: s.city.world.week }));
  expect(isLiveCharacterLifeSessionState(r.next)).toBe(true);
  expect(isCharacterLifeSessionState(r.next)).toBe(false);
  const saveFailure = failure('INVALID_SAVE_STATE', 'Checkpoint must contain a valid complete Character Life session in Planning.');
  expect(serializeCharacterLifeSave(r.next)).toEqual(saveFailure);
  const envelope = JSON.parse(planningSave.text);
  expect(envelope.schemaVersion).toBe(1);
  envelope.state = r.next;
  expect(deserializeCharacterLifeSave(JSON.stringify(envelope))).toEqual(saveFailure);
  const reportBefore = structuredClone(r.next);
  freeze(r.next);
  const next = success(executeCharacterLifeCommand(r.next, { type: 'NEXT_WEEK', expectedRevision: r.next.city.revision })).next;
  expect(isCharacterLifeSessionState(next)).toBe(true);
  const saved = serializeCharacterLifeSave(next);
  expect(saved.success).toBe(true);
  if (!saved.success) throw Error(saved.error.message);
  expect(deserializeCharacterLifeSave(saved.text)).toEqual({ success: true, state: next });
  expect(r.next).toEqual(reportBefore);
  expect(s).toEqual(before);
});
