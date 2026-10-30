import { describe, expect, it } from 'vitest';
import { createSocietyState, createGoodsStockState, createNpcWorldSession, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, POPULATION_TILE_RULESET, SOCIETY_RULESET } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeWorldNpcCityCommand, executeWorldNpcCommand } from '../world-npc.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';

const failure = { success: false, error: { code: 'UNSUPPORTED_RULESET', message: 'This city economy is not playable yet; nothing was changed.' } };
const commands = [
  { type: 'BUILD', tileId: 'forest-1', typeId: 'logging', expectedRevision: 0 },
  { type: 'END_WEEK', expectedWeek: 1, expectedRevision: 0 },
  { type: 'SET_WORKERS', tileId: 'field-1', workers: 1, expectedRevision: 0 },
];
it.each(commands)('rejects society city command $type without mutation', command => {
  const state = createSocietyState(), before = structuredClone(state);
  expect(executeTileTrialCommand(state, command, POPULATION_TILE_RULESET)).toMatchObject(failure);
  expect(state).toEqual(before);
});
it('rejects loading a society snapshot into Goods', () => {
  const state = createGoodsStockState(), before = structuredClone(state);
  expect(executeTileTrialCommand(state, { type: 'LOAD_TRIAL', expectedRevision: 0, snapshot: createSocietyState() }, POPULATION_TILE_RULESET)).toMatchObject(failure);
  expect(state).toEqual(before);
});
const unwrap = <T>(r: { success: true; value: T } | { success: false }) => { if (!r.success) throw Error('Factory failed'); return r.value; };
const sessions = [
  { name: 'npc', create: () => unwrap(createNpcWorldSession(20261028, SOCIETY_RULESET)), execute: executeWorldNpcCityCommand, assign: executeWorldNpcCommand },
  { name: 'life', create: () => unwrap(createCharacterLifeSession(20261028, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' }, SOCIETY_RULESET)), execute: executeCharacterLifeCommand, assign: executeCharacterLifeCommand },
];
describe.each(sessions)('$name society session', c => {
  it.each(commands)('rejects $type without mutation', command => {
    const state = c.create(), before = structuredClone(state);
    expect(c.execute(state, command)).toMatchObject(failure);
    expect(state).toEqual(before);
  });
  it.each(['ASSIGN_NPC', 'UNASSIGN_NPC'])('rejects %s without mutation', type => {
    const state = c.create(), before = structuredClone(state);
    expect(c.assign(state, { type, npcId: state.npcs[0].character.id, ...(type === 'ASSIGN_NPC' ? { tileId: 'plain-2' } : {}), expectedRevision: 0 })).toMatchObject(failure);
    expect(state).toEqual(before);
  });
});
