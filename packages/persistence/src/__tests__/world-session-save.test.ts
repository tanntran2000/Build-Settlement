import { SOCIETY_RULESET } from '@haven/core';
import { expect, it } from 'vitest';
import { createWorldSession, isWorldSessionState, createTileTrialState, LEGACY_TILE_RULESET, POPULATION_TILE_RULESET } from '@haven/core';
import { deserializeWorldSessionSave, serializeWorldSessionSave } from '../world-session-save.js';
import { deserializeTileTrialSave, serializeTileTrialSave, TILE_SAVE_MAX_BYTES } from '../tile-trial-save.js';

const session = () => { const r = createWorldSession(0, SOCIETY_RULESET); if (!r.success) throw Error(r.error.message); return r.value; };
const encode = (s: unknown = session()) => { const r = serializeWorldSessionSave(s); if (!r.success) throw Error(r.error.message); return r.text; };
const envelope = () => JSON.parse(encode());
const code = (r: ReturnType<typeof deserializeWorldSessionSave>) => r.success ? 'SUCCESS' : r.error.code;
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
it('round trips frozen later-action shapes as detached data', () => {
  const s = session(), tile = s.outside.tiles.find(t => t.feature?.kind === 'loot')!;
  tile.owner = 'player'; tile.knownBy = ['player', 'ai-1']; tile.feature = { kind: 'loot', claimedBy: 'player' };
  freeze(s); const before = structuredClone(s), loaded = deserializeWorldSessionSave(encode(s));
  expect(loaded).toEqual({ success: true, state: before }); expect(s).toEqual(before);
  if (!loaded.success) return;
  loaded.state.outside.tiles[0].knownBy.push('ai-2'); loaded.state.outside.actors[0] = 'changed';
  expect(s).toEqual(before);
});
it('loads a valid hand edited deposit verbatim without generation', () => {
  const e = envelope(); e.state.outside.tiles.find((t: { feature: { kind: string } | null }) => t.feature?.kind === 'deposit').feature.resource = 'wheat';
  expect(deserializeWorldSessionSave(JSON.stringify(e))).toEqual({ success: true, state: e.state });
});
it.each([
  ['schema', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.schemaVersion = 2; }],
  ['format', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.format = 'other'; }],
  ['ruleset', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.cityRulesetId = 'tile-trial-01'; }],
  ['extra envelope key', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.extra = 1; }],
  ['missing state', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { delete e.state; }],
  ['missing provenance', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { delete e.state.outside.generator; }],
  ['malformed provenance', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.outside.scenarioId = 1; }],
  ['unsupported generator', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.state.outside.generator = 'outside-gen-99'; }],
  ['unsupported scenario', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.state.outside.scenarioId = 'unknown'; }],
  ['bad city', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.city.phase = 'report'; }],
  ['bad outside', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.outside.tiles.pop(); }],
  ['missing outside', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { delete e.state.outside; }],
] as const)('maps %s to %s', (_, expected, mutate) => {
  const e = envelope(); mutate(e); expect(code(deserializeWorldSessionSave(JSON.stringify(e)))).toBe(expected);
});
it('honors decode precedence when several faults coincide', () => {
  const e = envelope(); e.cityRulesetId = 'bad'; delete e.state.outside.generator;
  expect(code(deserializeWorldSessionSave(JSON.stringify(e)))).toBe('INCOMPATIBLE_SAVE');
  e.cityRulesetId = POPULATION_TILE_RULESET; e.state.city = null; e.state.outside.generator = 'outside-gen-99';
  expect(code(deserializeWorldSessionSave(JSON.stringify(e)))).toBe('INCOMPATIBLE_SAVE');
  expect(code(deserializeWorldSessionSave(null))).toBe('INVALID_SAVE');
  expect(code(deserializeWorldSessionSave('{'))).toBe('INVALID_SAVE');
  expect(code(deserializeWorldSessionSave(' '.repeat(TILE_SAVE_MAX_BYTES + 1)))).toBe('SAVE_TOO_LARGE');
});
it('enforces both UTF-8 and UTF-16 caps, allowing the exact boundary', () => {
  const text = encode();
  expect(code(deserializeWorldSessionSave(text + ' '.repeat(TILE_SAVE_MAX_BYTES - new TextEncoder().encode(text).length)))).toBe('SUCCESS');
  expect(code(deserializeWorldSessionSave(text + ' '.repeat(TILE_SAVE_MAX_BYTES - text.length + 1)))).toBe('SAVE_TOO_LARGE');
  expect(code(deserializeWorldSessionSave('é'.repeat(TILE_SAVE_MAX_BYTES / 2 + 1)))).toBe('SAVE_TOO_LARGE');
  const s = session(); s.city.world.settlements.settlement_haven_01.name = 'x'.repeat(TILE_SAVE_MAX_BYTES);
  expect(isWorldSessionState(s)).toBe(true);
  expect(serializeWorldSessionSave(s)).toMatchObject({ success: false, error: { code: 'SAVE_TOO_LARGE' } });
});
it('rejects invalid encode input and never throws for revoked proxies', () => {
  const p = Proxy.revocable({}, {}); p.revoke();
  for (const raw of [null, {}, p.proxy]) expect(serializeWorldSessionSave(raw)).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
});
it.each(['session', 'city', 'inventory', 'outside', 'tiles', 'knowledge', 'feature'])('F1: serializes detached %s descriptors without virtual toJSON', level => {
  const s = session(), before = structuredClone(s); let hooks = 0;
  const active = <T extends object>(value: T): T => new Proxy(value, { get(target, key, receiver) {
    return key === 'toJSON' ? () => { hooks++; return {}; } : Reflect.get(target, key, receiver);
  } });
  if (level === 'city') s.city = active(s.city);
  if (level === 'inventory') s.city.world.settlements.settlement_haven_01.inventory = active(s.city.world.settlements.settlement_haven_01.inventory);
  if (level === 'outside') s.outside = active(s.outside);
  if (level === 'tiles') s.outside.tiles = active(s.outside.tiles);
  if (level === 'knowledge') s.outside.tiles[0].knownBy = active(s.outside.tiles[0].knownBy);
  if (level === 'feature') { const tile = s.outside.tiles.find(t => t.feature)!; tile.feature = active(tile.feature!); }
  const result = serializeWorldSessionSave(level === 'session' ? active(s) : s);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(deserializeWorldSessionSave(result.text)).toEqual({ success: true, state: before });
  expect(hooks).toBe(0);
});
it('F1: validates captured data without any original get traps', () => {
  const s = session(), before = structuredClone(s); let reads = 0;
  const active = new Proxy(s, { get() { reads++; throw Error('unchecked read'); } });
  const result = serializeWorldSessionSave(active);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(deserializeWorldSessionSave(result.text)).toEqual({ success: true, state: before }); expect(reads).toBe(0);
});
it.each(['root accessor', 'nested accessor', 'array accessor', 'toJSON accessor', 'own toJSON', 'cycle'])('F1: rejects %s without getter/toJSON execution', kind => {
  const s = session(); let calls = 0;
  const getter = { enumerable: true, get() { calls++; throw Error('must not run'); } };
  if (kind === 'root accessor') Object.defineProperty(s, 'city', getter);
  if (kind === 'nested accessor') Object.defineProperty(s.city.world.settlements.settlement_haven_01.inventory, 'gold', getter);
  if (kind === 'array accessor') Object.defineProperty(s.outside.tiles, '0', getter);
  if (kind === 'toJSON accessor') Object.defineProperty(s.outside, 'toJSON', getter);
  if (kind === 'own toJSON') Object.assign(s.outside, { toJSON() { calls++; return {}; } });
  if (kind === 'cycle') Object.assign(s.outside, { cycle: s });
  expect(serializeWorldSessionSave(s)).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
  expect(calls).toBe(0);
});
