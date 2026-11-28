import { expect, it } from 'vitest';
import { acquisitionNpc, isCharacterLifeSessionState, mansionPlanningEffects, mansionResidentRole, mansionTerms, type CharacterLifeSessionState, type MansionRole } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { command, market, populate, stock, succeeded, town } from './acquisition-fixture.js';

function buy(s: CharacterLifeSessionState, source: 'guild' | 'slave-market', slot: number, homeTileId = 'estate-1') {
  return succeeded(s, 'BUY_NPC', { source, slot, homeTileId }).next;
}

function setRole(s: CharacterLifeSessionState, index: number, role: MansionRole | null) {
  return command(s, 'SET_ROLE', { npcId: s.npcs[index].character.id, role });
}

const failure = (code: string, message: string) => ({ success: false, error: { code, message } });

it.each(['head-maid', 'captain', 'accountant'] as const)('refuses a second %s with byte-identical state', role => {
  const s = buy(buy(market(), 'guild', 0), 'guild', 1);
  s.npcs[0].household.role = role;
  const before = JSON.stringify(s);
  expect(setRole(s, 1, role)).toStrictEqual(failure('ROLE_CAP', 'That Mansion role is full.'));
  expect(JSON.stringify(s)).toBe(before);
});

it('assigns, reselects and clears a role without changing the other household fields', () => {
  const s = buy(market(), 'guild', 0);
  const before = JSON.stringify(s);
  const assigned = setRole(s, 0, 'head-maid');
  expect(assigned.success).toBe(true);
  if (!assigned.success) throw Error(assigned.error.message);
  expect(assigned.next.npcs[0].household).toStrictEqual({ ...s.npcs[0].household, role: 'head-maid' });
  expect(assigned.next.city.revision).toBe(s.city.revision + 1);
  const same = setRole(assigned.next, 0, 'head-maid');
  expect(same.success).toBe(true);
  const cleared = setRole(assigned.next, 0, null);
  expect(cleared.success).toBe(true);
  if (!cleared.success) throw Error(cleared.error.message);
  expect(cleared.next.npcs[0].household).toStrictEqual(s.npcs[0].household);
  expect(JSON.stringify(s)).toBe(before);
});

it('refuses a Hall resident without changing the roster', () => {
  const s = buy(market(), 'guild', 0, 'estate-2');
  const before = JSON.stringify(s);
  expect(setRole(s, 0, 'maid')).toStrictEqual(failure('ROLE_NOT_RESIDENT', 'Choose a Mansion resident.'));
  expect(JSON.stringify(s)).toBe(before);
});

it('checks exact fields, revision, phase and R2 role membership', () => {
  const s = buy(market(), 'guild', 0);
  const npcId = s.npcs[0].character.id;
  const before = JSON.stringify(s);
  expect(command(s, 'SET_ROLE', { npcId, role: 'maid', extra: 1 })).toStrictEqual(failure('INVALID_COMMAND', 'Unknown Mansion command fields.'));
  expect(command(s, 'SET_ROLE', { npcId, role: 'maid', expectedRevision: -1 })).toStrictEqual(failure('STALE_COMMAND', 'The plan changed. Refresh the action before retrying.'));
  expect(setRole(s, 0, 'wife')).toStrictEqual(failure('INVALID_COMMAND', 'Choose a Mansion staff role.'));
  expect(JSON.stringify(s)).toBe(before);
  const ended = succeeded(s, 'END_WEEK', { expectedWeek: s.city.world.week }).next;
  const reportBytes = JSON.stringify(ended);
  expect(setRole(ended, 0, 'maid')).toStrictEqual(failure('FORBIDDEN', 'Read the report, then choose Plan next week.'));
  expect(JSON.stringify(ended)).toBe(reportBytes);
});

it.each([
  ['SELL_NPC', 'slave-market', 'sold'],
  ['RELEASE_NPC', 'guild', 'released'],
  ['ANSWER_NOTICE', 'guild', 'released'],
] as const)('frees a capped seat through %s and preserves exact departure data', (type, source, kind) => {
  const s = buy(buy(market(), source, 0), 'guild', 1);
  const npc = s.npcs[0];
  npc.household.role = 'captain';
  if (type === 'ANSWER_NOTICE') {
    npc.household.contract!.weeksLeft = 0;
    npc.household.notice = 'renewal';
  }
  const next = succeeded(s, type, { npcId: npc.character.id, ...(type === 'ANSWER_NOTICE' ? { choice: 'release' } : {}) }).next;
  expect(next.npcs.map(row => row.character.id)).toStrictEqual([s.npcs[1].character.id]);
  expect(next.profiles.map(row => row.id)).toStrictEqual([s.npcs[1].character.id]);
  expect(next.city.society!.acquisition.departures).toStrictEqual([{ kind, id: npc.character.id, name: npc.character.name }]);
  expect(setRole(next, 0, 'captain').success).toBe(true);
});

it('leaves the role and training with neither room nor NPC slot when moving to the Hall', () => {
  const s = buy(buy(market(), 'guild', 0), 'guild', 1);
  const npc = s.npcs[0];
  Object.assign(npc.household, { role: 'accountant', training: 'management' });
  const next = succeeded(s, 'MOVE_NPC_HOME', { npcId: npc.character.id, homeTileId: 'estate-2' }).next;
  expect(next.npcs[0].household).toStrictEqual({
    ...npc.household, home: 'estate-2', room: null, role: null, training: null,
  });
  expect(setRole(next, 1, 'accountant').success).toBe(true);
});

it.each([0, 3])('clears an expiring role at %i prior payment failures before the cap is reused', unpaidWeeks => {
  const s = buy(buy(market(), 'guild', 0), 'guild', 1);
  const npc = s.npcs[0];
  npc.household.role = 'head-maid';
  Object.assign(npc.household.contract!, { weeksLeft: 1, unpaidWeeks });
  const report = succeeded(s, 'END_WEEK', { expectedWeek: 1 });
  expect(report.report?.household?.left).toStrictEqual(unpaidWeeks === 0 ? [] : [npc.character.name]);
  const next = succeeded(report.next, 'NEXT_WEEK').next;
  if (unpaidWeeks === 0) {
    expect([next.npcs[0].household.role, next.npcs[0].household.room, next.npcs[0].household.notice])
      .toStrictEqual([null, npc.household.room, 'renewal']);
    const before = JSON.stringify(next);
    expect(setRole(next, 0, 'maid')).toStrictEqual(failure('INVALID_COMMAND', 'Renew the contract before assigning a role.'));
    expect(JSON.stringify(next)).toBe(before);
    const renewed = succeeded(next, 'ANSWER_NOTICE', { npcId: npc.character.id, choice: 'renew' }).next;
    expect(renewed.npcs[0].household.role).toBeNull();
  }
  expect(setRole(next, unpaidWeeks === 0 ? 1 : 0, 'head-maid').success).toBe(true);
});

function loadPendingAccountant() {
  const s = buy(buy(market(), 'guild', 0), 'guild', 1);
  const household = s.npcs[0].household;
  household.role = 'accountant';
  household.notice = 'renewal';
  household.contract!.weeksLeft = 0;
  const save = serializeCharacterLifeSave(s);
  if (!save.success) throw Error(save.error.message);
  const loaded = deserializeCharacterLifeSave(save.text);
  expect(loaded).toStrictEqual({ success: true, state: s });
  if (!loaded.success) throw Error(loaded.error.message);
  return loaded.state;
}

it('allows another resident to take the capped seat from a resident awaiting renewal in a v15 save', () => {
  const s = loadPendingAccountant();
  const before = JSON.stringify(s);
  const next = succeeded(s, 'SET_ROLE', { npcId: s.npcs[1].character.id, role: 'accountant' }).next;
  expect(next.npcs.map(row => row.household)).toStrictEqual([
    { ...s.npcs[0].household, role: null },
    { ...s.npcs[1].household, role: 'accountant' },
  ]);
  expect(isCharacterLifeSessionState(next)).toBe(true);
  expect(JSON.stringify(s)).toBe(before);
});

it('keeps a loaded resident in her room through renewal without restoring her staff role', () => {
  const s = loadPendingAccountant();
  const npcId = s.npcs[0].character.id;
  const next = succeeded(s, 'ANSWER_NOTICE', { npcId, choice: 'renew' }).next;
  expect([next.npcs[0].household.room, next.npcs[0].household.role, next.npcs[0].household.notice])
    .toStrictEqual([s.npcs[0].household.room, null, null]);
  const assigned = succeeded(next, 'SET_ROLE', { npcId, role: 'accountant' }).next;
  expect(assigned.npcs[0].household).toStrictEqual({ ...next.npcs[0].household, role: 'accountant' });
});

it('loads a proven death with the capped role available and rejects a live duplicate', () => {
  const s = town();
  s.city.world.week = 3;
  const seed = s.city.world.worldMetadata.worldSeed;
  const former = acquisitionNpc(seed, 1, 'guild', 0, 0);
  const survivor = acquisitionNpc(seed, 2, 'guild', 1, 0);
  Object.assign(survivor.npc.household, { home: 'estate-1', room: 'room-3' });
  s.npcs.push(survivor.npc); s.profiles.push(survivor.profile);
  s.city.society!.acquisition = { week: 3, stock: [], lots: [], departures: [
    { kind: 'died', id: former.npc.character.id, name: former.npc.character.name },
  ] };
  const save = serializeCharacterLifeSave(s);
  expect(save.success).toBe(true);
  if (!save.success) throw Error(save.error.message);
  const decoded = deserializeCharacterLifeSave(save.text);
  expect(decoded).toStrictEqual({ success: true, state: s });
  if (!decoded.success) throw Error(decoded.error.message);
  expect(setRole(decoded.state, 0, 'captain').success).toBe(true);
  Object.assign(former.npc.household, { home: 'estate-1', room: 'room-3', role: 'captain' });
  s.npcs.push(former.npc); s.profiles.push(former.profile);
  expect(isCharacterLifeSessionState(s)).toBe(false);
  expect(stock(s).gold).toBe(1_000_000);
});

function fittedGuards(guards: number, fitted: number) {
  const s = town();
  populate(s, Array<string>(guards + 1).fill('estate-1'));
  const rooms = s.city.society!.mansion;
  const quarters = 'room-' + rooms.nextRoomSeq++;
  rooms.rooms.push({ id: quarters, typeId: 'guard-quarters', level: 2, furniture: [] });
  for (const [index, npc] of s.npcs.entries()) {
    npc.household.role = index === 0 ? 'captain' : 'guard';
    if (index <= fitted) npc.household.room = quarters;
  }
  const saved = serializeCharacterLifeSave(s);
  if (!saved.success) throw Error(saved.error.message);
  return s;
}

it('adds exactly 1725 safe Money milli for one fitted Guard led by a fitted Captain', () => {
  const s = fittedGuards(1, 1);
  expect(mansionPlanningEffects(s)?.safeAmount.guard).toBe(1725);
});

it('reduces fatal chance by exactly 3555 bps for fourteen Guards with eight fitted', () => {
  const s = fittedGuards(14, 8);
  expect(mansionPlanningEffects(s)?.fatalChanceBps).toBe(3555);
});

function loadPendingCaptainWithRemainingWeek() {
  const s = buy(buy(market(), 'guild', 0), 'guild', 1);
  const household = s.npcs[0].household;
  Object.assign(household, { role: 'captain', notice: 'renewal' });
  household.contract!.weeksLeft = 1;
  household.contract!.wageMilli = 2000;
  const saved = serializeCharacterLifeSave(s);
  if (!saved.success) throw Error(saved.error.message);
  const read = deserializeCharacterLifeSave(saved.text);
  expect(read).toStrictEqual({ success: true, state: s });
  if (!read.success) throw Error(read.error.message);
  return read.state;
}

it('excludes a loaded pending renewal with time remaining from staff eligibility, display and effects', () => {
  const s = loadPendingCaptainWithRemainingWeek();
  const before = JSON.stringify(s);
  expect(mansionResidentRole(s.npcs[0].household)).toBeNull();
  const terms = mansionTerms(s)!;
  expect([terms.plain.safeAmount.captain, terms.paid.safeAmount.captain, terms.plain.fatalChanceBps, terms.paid.fatalChanceBps])
    .toStrictEqual([0, 0, 0, 0]);
  expect(setRole(s, 0, 'guard')).toStrictEqual(failure('INVALID_COMMAND', 'Renew the contract before assigning a role.'));
  expect(JSON.stringify(s)).toBe(before);
});

it('frees a Captain cap seat in a saved renewal even when the saved contract has time remaining', () => {
  const s = loadPendingCaptainWithRemainingWeek();
  const next = succeeded(s, 'SET_ROLE', { npcId: s.npcs[1].character.id, role: 'captain' }).next;
  expect(next.npcs.map(npc => npc.household)).toStrictEqual([
    { ...s.npcs[0].household, role: null },
    { ...s.npcs[1].household, role: 'captain' },
  ]);
  expect(isCharacterLifeSessionState(next)).toBe(true);
});

it('keeps the room and requires a fresh staff assignment after renewing a saved pending Captain', () => {
  const s = loadPendingCaptainWithRemainingWeek();
  const npcId = s.npcs[0].character.id;
  const next = succeeded(s, 'ANSWER_NOTICE', { npcId, choice: 'renew' }).next;
  expect(next.npcs[0].household).toStrictEqual({
    ...s.npcs[0].household, role: null, notice: null,
    contract: { weeksLeft: 20, wageMilli: 3000, unpaidWeeks: 0, stressHits: 0 },
  });
  const assigned = succeeded(next, 'SET_ROLE', { npcId, role: 'captain' }).next;
  expect(assigned.npcs[0].household).toStrictEqual({ ...next.npcs[0].household, role: 'captain' });
});
