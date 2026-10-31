import { createCharacterLifeSession,createNpcWorldSession,DEFAULT_PLAYER_DRAFT,GOODS_STOCK_RULESET,SOCIETY_RULESET,type TileTrialState } from '@haven/core';
import { expect,it } from 'vitest';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { observeCharacterLife } from '../character-life-observation.js';
import { executeWorldNpcCityCommand } from '../world-npc.js';
const unwrap = <T>(r: { success: true; value: T } | { success: false }) => { if (!r.success) throw Error('Factory failed'); return r.value; };
const life = () => unwrap(createCharacterLifeSession(20261028, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Keeper' }));
const wallReady = (city: TileTrialState) => {
  city.tiles.find(t => t.id === 'plain-1')!.building!.workers = 0;
  city.tiles.find(t => t.id === 'spec-2')!.building = { typeId: 'builders-yard', level: 1, workers: 2, enabled: true };
  Object.assign(city.world.settlements[city.world.activeSettlementId!].inventory, { gold: 100000, wood: 50000, iron: 50000 });
};
it('routes society training through Character Life and preserves the input', () => {
  const s = life(), before = structuredClone(s);
  const r = executeCharacterLifeCommand(s, { type: 'SET_TRAINING', target: 'makers', expectedRevision: s.city.revision });
  expect(r.success).toBe(true);
  if (!r.success) throw Error(r.error.code);
  expect(r.next.city.society!.training.target).toBe('makers');
  expect(s).toEqual(before);
});
it('routes society wall extension through Character Life', () => {
  const s = life(); wallReady(s.city);
  const before = structuredClone(s);
  const r = executeCharacterLifeCommand(s, { type: 'EXTEND_WALL', expectedRevision: s.city.revision });
  expect(r.success).toBe(true);
  if (!r.success) throw Error(r.error.code);
  expect(r.next.city.society!.wallRing).toBe(2);
  expect(r.next.city.world.settlements[r.next.city.world.activeSettlementId!].inventory).toMatchObject({ gold: 70000, wood: 30000, iron: 40000 });
  expect(s).toEqual(before);
});
it('rejects invalid society Life training atomically', () => {
  const s = life(), before = structuredClone(s);
  expect(executeCharacterLifeCommand(s, { type: 'SET_TRAINING', target: 'free', expectedRevision: s.city.revision }))
    .toMatchObject({ success: false, error: { code: 'INVALID_COMMAND' } });
  expect(s).toEqual(before);
});
it('adds society Planning actions while keeping the Goods list exact', () => {
  expect(observeCharacterLife(life(), null).actionTypes).toEqual(expect.arrayContaining(['EXTEND_WALL', 'SET_TRAINING']));
});
it.each([{ type: 'EXTEND_WALL' }, { type: 'SET_TRAINING', target: 'makers' }])('routes NPC-world society $type', command => {
  const s = unwrap(createNpcWorldSession(20261028)); wallReady(s.city);
  const before = structuredClone(s);
  const r = executeWorldNpcCityCommand(s, { ...command, expectedRevision: s.city.revision });
  expect(r.success).toBe(true);
  if (!r.success) throw Error(r.error.code);
  if (command.type === 'EXTEND_WALL') expect(r.next.city.society!.wallRing).toBe(2);
  else expect(r.next.city.society!.training.target).toBe('makers');
  expect(s).toEqual(before);
});
