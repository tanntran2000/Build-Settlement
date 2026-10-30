import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createGoodsStockState, createWorldSession, createNpcWorldSession, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET, POPULATION_TILE_RULESET, LEGACY_TILE_RULESET } from '@haven/core';
import { executeTileTrialCommand, executeWorldNpcCityCommand, executeCharacterLifeCommand } from '@haven/simulation';
import { serializeTileTrialSave, deserializeTileTrialSave, serializeWorldSessionSave, deserializeWorldSessionSave, serializeNpcWorldSessionSave, deserializeNpcWorldSessionSave, serializeCharacterLifeSave, deserializeCharacterLifeSave } from '../index.js';

const draft = { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' };
const unwrap = <T>(r: { success: true; value: T } | { success: false }) => { if (!r.success) throw Error('Factory failed'); return r.value; };
const cases = [
  { name: 'classic', create: () => createGoodsStockState(), encode: (s: unknown) => serializeTileTrialSave(s, LEGACY_TILE_RULESET), decode: (s: string) => deserializeTileTrialSave(s, LEGACY_TILE_RULESET), family: LEGACY_TILE_RULESET },
  { name: 'population', create: () => createGoodsStockState(), encode: (s: unknown) => serializeTileTrialSave(s, POPULATION_TILE_RULESET), decode: (s: string) => deserializeTileTrialSave(s, POPULATION_TILE_RULESET), family: POPULATION_TILE_RULESET },
  { name: 'world', create: () => unwrap(createWorldSession(20261028, GOODS_STOCK_RULESET)), encode: serializeWorldSessionSave, decode: deserializeWorldSessionSave },
  { name: 'npc', create: () => unwrap(createNpcWorldSession(20261028, GOODS_STOCK_RULESET)), encode: serializeNpcWorldSessionSave, decode: deserializeNpcWorldSessionSave },
  { name: 'life', create: () => unwrap(createCharacterLifeSession(20261028, draft, GOODS_STOCK_RULESET)), encode: serializeCharacterLifeSave, decode: deserializeCharacterLifeSave },
] as const;
describe.each(cases)('$name economy codec', c => {
  it('round-trips the BASE bytes and exactly continues the BASE command/report', () => {
    const bytes = readFileSync(new URL(`./fixtures/legacy-v1/${c.name}.json`, import.meta.url), 'utf8');
    const expected = JSON.parse(readFileSync(new URL(`./fixtures/legacy-v1/${c.name}-continuation.json`, import.meta.url), 'utf8'));
    const decoded = c.decode(bytes); expect(decoded.success).toBe(true); if (!decoded.success) throw Error('Decode failed');
    expect(c.encode(decoded.state)).toEqual({ success: true, text: bytes });
    const state = decoded.state;
    const result = c.name === 'life' ? executeCharacterLifeCommand(state, expected.command)
      : c.name === 'npc' ? executeWorldNpcCityCommand(state, expected.command)
      : executeTileTrialCommand('city' in state ? state.city : state, expected.command, c.name === 'classic' ? LEGACY_TILE_RULESET : POPULATION_TILE_RULESET);
    expect(result).toEqual(expected.result);
  });
  it('accepts matching Goods only in the population family; rejects mismatched and malformed markers', () => {
    const state = c.create(), before = structuredClone(state), saved = c.encode(state);
    if (c.name === 'classic') { expect(saved).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } }); return; }
    expect(saved.success).toBe(true); if (!saved.success) throw Error('Encode failed');
    expect(c.decode(saved.text)).toEqual({ success: true, state });
    const value = JSON.parse(saved.text), field = c.name === 'population' ? 'rulesetId' : 'cityRulesetId';
    expect(value[field]).toBe(GOODS_STOCK_RULESET);
    for (const marker of [POPULATION_TILE_RULESET, LEGACY_TILE_RULESET, 'future']) {
      expect(c.decode(JSON.stringify({ ...value, [field]: marker }))).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } });
    }
    for (const stock of [undefined, { rulesetId: 'future', amountMilli: 0 }, { rulesetId: GOODS_STOCK_RULESET, amountMilli: -1 }, { rulesetId: GOODS_STOCK_RULESET, amountMilli: Number.MAX_SAFE_INTEGER + 1 }, { rulesetId: GOODS_STOCK_RULESET, amountMilli: 0, extra: true }]) {
      const bad = structuredClone(value), city = bad.state.city ?? bad.state;
      if (stock === undefined) delete city.goodsStock; else city.goodsStock = stock;
      expect(c.decode(JSON.stringify(bad))).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } });
    }
    let reads = 0;
    const hostile = structuredClone(state), city = 'city' in hostile ? hostile.city : hostile;
    Object.defineProperty(city, 'goodsStock', { enumerable: true, get() { reads++; throw Error('Must not execute'); } });
    expect(c.encode(hostile).success).toBe(false); expect(reads).toBe(0);
    expect(state).toEqual(before);
  });
});
