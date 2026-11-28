import { expect, it } from 'vitest';
import { acquisitionNpc, isCharacterLifeSessionState, type CharacterLifeSessionState, type MansionRole } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { command, market, stock, succeeded, town } from './acquisition-fixture.js';

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
