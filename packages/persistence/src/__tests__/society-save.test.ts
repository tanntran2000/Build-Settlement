import { createCharacterLifeSession,createSocietyState,createWorldSession,DEFAULT_PLAYER_DRAFT,GOODS_STOCK_RULESET,SOCIETY_RULESET } from '@haven/core';
import { describe,expect,it } from 'vitest';
import { deserializeCharacterLifeSave,deserializeWorldSessionSave,serializeCharacterLifeSave,serializeWorldSessionSave } from '../index.js';

const draft = { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' };
const unwrap = <T>(r: { success: true; value: T } | { success: false }) => { if (!r.success) throw Error('Factory failed'); return r.value; };
const cases = [
  { name: 'world', create: () => unwrap(createWorldSession(20261028)), encode: serializeWorldSessionSave, decode: deserializeWorldSessionSave },
  { name: 'life', create: () => unwrap(createCharacterLifeSession(20261028, draft)), encode: serializeCharacterLifeSave, decode: deserializeCharacterLifeSave },
];
describe.each(cases)('$name society codec', c => {
  it('round-trips with its own marker and refuses mismatched markers and malformed extensions', () => {
    const state = c.create(), before = structuredClone(state), saved = c.encode(state);
    expect(saved.success).toBe(true); if (!saved.success) throw Error('Encode failed');
    expect(c.decode(saved.text)).toEqual({ success: true, state });
    const value = JSON.parse(saved.text), field = c.name === 'population' ? 'rulesetId' : 'cityRulesetId';
    expect(value[field]).toBe(SOCIETY_RULESET);
    for (const marker of [GOODS_STOCK_RULESET, 'tile-population-01', 'tile-trial-01', 'future']) {
      expect(c.decode(JSON.stringify({ ...value, [field]: marker }))).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } });
    }
    for (const mutation of ['delete society', 'delete goods', 'negative population']) {
      const bad = structuredClone(value), city = bad.state.city ?? bad.state;
      if (mutation === 'delete society') delete city.society;
      else if (mutation === 'delete goods') delete city.goodsStock;
      else city.society.classes.free = -1;
      const result = c.decode(JSON.stringify(bad));
      expect(result.success).toBe(false);
      if (result.success) throw Error('Malformed save accepted');
      expect(['INCOMPATIBLE_SAVE', 'INVALID_SAVE_STATE']).toContain(result.error.code);
    }
    expect(state).toEqual(before);
  });
  it('refuses hostile society accessors without invoking them', () => {
    let reads = 0;
    const state = c.create(), city = 'city' in state ? state.city : state;
    Object.defineProperty(city, 'society', { enumerable: true, get() { reads++; throw Error('Must not execute'); } });
    expect(c.encode(state).success).toBe(false);
    expect(reads).toBe(0);
  });
});
