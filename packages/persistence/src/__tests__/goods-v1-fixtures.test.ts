import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createGoodsStockState, createWorldSession, createNpcWorldSession, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET, POPULATION_TILE_RULESET } from '@haven/core';
import { executeTileTrialCommand, executeWorldNpcCityCommand, executeCharacterLifeCommand } from '@haven/simulation';
import { serializeTileTrialSave, deserializeTileTrialSave, serializeWorldSessionSave, deserializeWorldSessionSave, serializeNpcWorldSessionSave, deserializeNpcWorldSessionSave, serializeCharacterLifeSave, deserializeCharacterLifeSave } from '../index.js';

const draft = { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' };
const unwrap = <T>(r: { success: true; value: T } | { success: false }) => { if (!r.success) throw Error('Factory failed'); return r.value; };
const cases = [
  { name: 'population', create: () => createGoodsStockState(), encode: (s: unknown) => serializeTileTrialSave(s, POPULATION_TILE_RULESET), decode: (s: string) => deserializeTileTrialSave(s, POPULATION_TILE_RULESET), family: POPULATION_TILE_RULESET },
  { name: 'world', create: () => unwrap(createWorldSession(20261028, GOODS_STOCK_RULESET)), encode: serializeWorldSessionSave, decode: deserializeWorldSessionSave },
  { name: 'npc', create: () => unwrap(createNpcWorldSession(20261028, GOODS_STOCK_RULESET)), encode: serializeNpcWorldSessionSave, decode: deserializeNpcWorldSessionSave },
  { name: 'life', create: () => unwrap(createCharacterLifeSession(20261028, draft, GOODS_STOCK_RULESET)), encode: serializeCharacterLifeSave, decode: deserializeCharacterLifeSave },
] as const;

describe.each(cases)('$name pinned Goods save', c => {
  it('round-trips the BASE bytes and exactly continues the BASE command/report', () => {
    const bytes = readFileSync(new URL(`./fixtures/goods-v1/${c.name}.json`, import.meta.url), 'utf8');
    const expected = JSON.parse(readFileSync(new URL(`./fixtures/goods-v1/${c.name}-continuation.json`, import.meta.url), 'utf8'));
    const decoded = c.decode(bytes); expect(decoded.success).toBe(true); if (!decoded.success) throw Error('Decode failed');
    expect(c.encode(decoded.state)).toEqual({ success: true, text: bytes });
    const state = decoded.state;
    const result = c.name === 'life' ? executeCharacterLifeCommand(state, expected.command)
      : c.name === 'npc' ? executeWorldNpcCityCommand(state, expected.command)
      : executeTileTrialCommand('city' in state ? state.city : state, expected.command, POPULATION_TILE_RULESET);
    expect(result).toEqual(expected.result);
  });
});
