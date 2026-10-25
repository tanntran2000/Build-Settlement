import { expect, it } from 'vitest';
import { createNpcWorldSession, createWorldSession } from '@haven/core';
import { deserializeNpcWorldSessionSave, serializeNpcWorldSessionSave, WORLD_NPC_SESSION_SAVE_FORMAT } from '../world-npc-session-save.js';
import { deserializeWorldSessionSave, serializeWorldSessionSave } from '../world-session-save.js';
import { TILE_SAVE_MAX_BYTES } from '../tile-trial-save.js';

const session = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return r.value; };
const encode = (s: unknown = session()) => { const r = serializeNpcWorldSessionSave(s); if (!r.success) throw Error(r.error.message); return r.text; };
const envelope = () => JSON.parse(encode());
const code = (r: ReturnType<typeof deserializeNpcWorldSessionSave>) => r.success ? 'SUCCESS' : r.error.code;

it('round trips assigned npcs as detached data in its own format', () => {
  const s = session(); s.npcs[0].postTileId = 'field-1'; s.npcs[2].postTileId = 'plain-1';
  const before = structuredClone(s), text = encode(s);
  expect(JSON.parse(text)).toMatchObject({ format: WORLD_NPC_SESSION_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-population-01' });
  expect(WORLD_NPC_SESSION_SAVE_FORMAT).toBe('haven.world-npc-session.save');
  const loaded = deserializeNpcWorldSessionSave(text);
  expect(loaded).toEqual({ success: true, state: before });
  if (loaded.success) { loaded.state.npcs[0].postTileId = null; expect(s).toEqual(before); }
});
it('keeps world v1 and npc formats mutually incompatible, inserting nothing', () => {
  const world = createWorldSession(0); if (!world.success) throw Error();
  const v1 = serializeWorldSessionSave(world.value); if (!v1.success) throw Error();
  expect(code(deserializeNpcWorldSessionSave(v1.text))).toBe('INCOMPATIBLE_SAVE');
  expect(deserializeWorldSessionSave(encode())).toMatchObject({ success: false, error: { code: 'INCOMPATIBLE_SAVE' } });
  expect(serializeWorldSessionSave(session())).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
  expect(serializeNpcWorldSessionSave(world.value)).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
});
it.each([
  ['schema', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.schemaVersion = 2; }],
  ['ruleset', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.cityRulesetId = 'tile-trial-01'; }],
  ['extra envelope key', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.extra = 1; }],
  ['unsupported generator', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.state.outside.generator = 'outside-gen-99'; }],
  ['malformed provenance', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { delete e.state.outside.generator; }],
  ['missing npcs', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { delete e.state.npcs; }],
  ['corrupted npc', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.npcs[0].character.skills.technical = 101; }],
  ['unknown trait', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.npcs[1].traits = ['cursed']; }],
  ['shared post', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.npcs[0].postTileId = 'field-1'; e.state.npcs[1].postTileId = 'field-1'; }],
  ['post on empty tile', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.npcs[0].postTileId = 'plain-4'; }],
  ['report phase', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.city.phase = 'report'; }],
] as const)('maps %s to %s', (_, expected, mutate) => {
  const e = envelope(); mutate(e); expect(code(deserializeNpcWorldSessionSave(JSON.stringify(e)))).toBe(expected);
});
it('rejects non-text, malformed and oversized input', () => {
  expect(code(deserializeNpcWorldSessionSave(null))).toBe('INVALID_SAVE');
  expect(code(deserializeNpcWorldSessionSave('{'))).toBe('INVALID_SAVE');
  expect(code(deserializeNpcWorldSessionSave(' '.repeat(TILE_SAVE_MAX_BYTES + 1)))).toBe('SAVE_TOO_LARGE');
  const s = session(); s.city.world.settlements.settlement_haven_01.name = 'x'.repeat(TILE_SAVE_MAX_BYTES);
  expect(serializeNpcWorldSessionSave(s)).toMatchObject({ success: false, error: { code: 'SAVE_TOO_LARGE' } });
});
it.each(['npc accessor', 'traits accessor', 'cycle'])('rejects %s on encode without running getters', kind => {
  const s = session(); let calls = 0;
  const getter = { enumerable: true, get() { calls++; throw Error('must not run'); } };
  if (kind === 'npc accessor') Object.defineProperty(s.npcs[0], 'postTileId', getter);
  if (kind === 'traits accessor') Object.defineProperty(s.npcs[0].traits, '0', getter);
  if (kind === 'cycle') Object.assign(s.npcs[0], { cycle: s });
  expect(serializeNpcWorldSessionSave(s)).toMatchObject({ success: false, error: { code: 'INVALID_SAVE_STATE' } });
  expect(calls).toBe(0);
});
it('validates captured npc data without original get traps', () => {
  const s = session(), before = structuredClone(s); let reads = 0;
  s.npcs = new Proxy(s.npcs, { get() { reads++; throw Error('unchecked read'); } });
  const result = serializeNpcWorldSessionSave(s);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(deserializeNpcWorldSessionSave(result.text)).toEqual({ success: true, state: before }); expect(reads).toBe(0);
});
