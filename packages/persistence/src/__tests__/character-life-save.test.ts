import { createCharacterLifeSession,createNpcWorldSession,createSocietyState,createWorldSession,DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { expect,it } from 'vitest';
import { CHARACTER_LIFE_SAVE_FORMAT,deserializeCharacterLifeSave,serializeCharacterLifeSave } from '../character-life-save.js';
import { TILE_SAVE_MAX_BYTES } from '../tile-trial-save.js';
import { serializeWorldSessionSave } from '../world-session-save.js';

const session = (seed = 0) => { const r = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
const encode = (s: unknown = session()) => { const r = serializeCharacterLifeSave(s); if (!r.success) throw Error(r.error.message); return r.text; };
const envelope = () => JSON.parse(encode());
const code = (r: ReturnType<typeof deserializeCharacterLifeSave>) => r.success ? 'SUCCESS' : r.error.code;
const INCOMPATIBLE = 'Not a Character Life checkpoint of a supported version. No migration was performed.';
const INVALID_STATE = 'Checkpoint must contain a valid complete Character Life session in Planning.';

it('round-trips a valid session as detached data in its own format', () => {
  const s = session(); s.npcs[0].postTileId = 'field-1';
  const before = structuredClone(s), text = encode(s);
  expect(CHARACTER_LIFE_SAVE_FORMAT).toBe('haven.character-life-session.save');
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-01' });
  expect(Object.keys(JSON.parse(text))).toEqual(['format', 'schemaVersion', 'cityRulesetId', 'state']);
  const loaded = deserializeCharacterLifeSave(text);
  expect(loaded).toEqual({ success: true, state: before });
  if (loaded.success) { loaded.state.player.profile.traits.warmth = 0; loaded.state.profiles[0].appearance.heightCm = 140; expect(s).toEqual(before); }
});
it('rejects NPC-world, world and tile save texts with INCOMPATIBLE_SAVE', () => {
  const npcSession = createNpcWorldSession(0), world = createWorldSession(0); if (!npcSession.success || !world.success) throw Error();
  const npc: { success: true; text: string } | { success: false; error: { message: string } } = { success: true, text: JSON.stringify({ format: 'haven.world-npc-session.save', schemaVersion: 1, cityRulesetId: 'tile-population-01', state: npcSession.value }) }, v1 = serializeWorldSessionSave(world.value), tile = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-01', state: createSocietyState() }) } as {success:true;text:string}|{success:false;error:{message:string}});
  for (const r of [npc, v1, tile]) {
    if (!r.success) throw Error(r.error.message);
    expect(deserializeCharacterLifeSave(r.text)).toEqual({ success: false, error: { code: 'INCOMPATIBLE_SAVE', message: INCOMPATIBLE } });
  }
});
it('keeps life saves out of the NPC-world format both ways', () => {
  const npc = createNpcWorldSession(0); if (!npc.success) throw Error();
  expect(serializeCharacterLifeSave(npc.value)).toEqual({ success: false, error: { code: 'INVALID_SAVE_STATE', message: INVALID_STATE } });
});
it.each([
  ['schemaVersion 2', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.schemaVersion = 2; }],
  ['other ruleset', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.cityRulesetId = 'tile-trial-01'; }],
  ['extra envelope key', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.extra = 1; }],
  ['unsupported generator', 'INCOMPATIBLE_SAVE', (e: ReturnType<typeof envelope>) => { e.state.outside.generator = 'outside-gen-99'; }],
  ['player age 17', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.player.character.age = 17; }],
  ['axis 101', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.profiles[1].traits.warmth = 101; }],
  ['missing player', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { delete e.state.player; }],
  ['missing profile', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.profiles.pop(); }],
  ['extra state key', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.extra = 1; }],
  ['report phase', 'INVALID_SAVE_STATE', (e: ReturnType<typeof envelope>) => { e.state.city.phase = 'report'; }],
] as const)('rejects %s with %s', (_, expected, mutate) => {
  const e = envelope(); mutate(e); expect(code(deserializeCharacterLifeSave(JSON.stringify(e)))).toBe(expected);
});
it('rejects a non-finite axis from JSON 1e999', () => {
  const text = encode().replace('"attractiveness":50', '"attractiveness":1e999');
  expect(text).toContain('1e999');
  expect(deserializeCharacterLifeSave(text)).toEqual({ success: false, error: { code: 'INVALID_SAVE_STATE', message: INVALID_STATE } });
});
it('rejects report-phase session on export', () => {
  const s = session(); s.city.phase = 'report';
  expect(serializeCharacterLifeSave(s)).toEqual({ success: false, error: { code: 'INVALID_SAVE_STATE', message: INVALID_STATE } });
});
it('rejects non-text, malformed and over 1 MiB input', () => {
  expect(code(deserializeCharacterLifeSave(null))).toBe('INVALID_SAVE');
  expect(code(deserializeCharacterLifeSave('{'))).toBe('INVALID_SAVE');
  expect(code(deserializeCharacterLifeSave(' '.repeat(TILE_SAVE_MAX_BYTES + 1)))).toBe('SAVE_TOO_LARGE');
  const s = session(); s.city.world.settlements.settlement_haven_01.name = 'x'.repeat(TILE_SAVE_MAX_BYTES);
  expect(serializeCharacterLifeSave(s)).toMatchObject({ success: false, error: { code: 'SAVE_TOO_LARGE' } });
});
it.each(['player accessor', 'profile accessor', 'cycle', 'class instance'])('rejects %s on encode without running getters', kind => {
  const s = session(); let calls = 0;
  const getter = { enumerable: true, get() { calls++; throw Error('must not run'); } };
  if (kind === 'player accessor') Object.defineProperty(s.player.profile.traits, 'warmth', getter);
  if (kind === 'profile accessor') Object.defineProperty(s.profiles[0].appearance.face.features, '0', getter);
  if (kind === 'cycle') Object.assign(s.player.profile, { cycle: s });
  if (kind === 'class instance') s.profiles[2] = Object.assign(new (class Profile {})(), s.profiles[2]);
  expect(serializeCharacterLifeSave(s)).toEqual({ success: false, error: { code: 'INVALID_SAVE_STATE', message: INVALID_STATE } });
  expect(calls).toBe(0);
});
it('captures once, never reading through original get traps', () => {
  const s = session(), before = structuredClone(s); let reads = 0;
  s.profiles = new Proxy(s.profiles, { get() { reads++; throw Error('unchecked read'); } });
  const result = serializeCharacterLifeSave(s);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(deserializeCharacterLifeSave(result.text)).toEqual({ success: true, state: before }); expect(reads).toBe(0);
});
it('gives identical results on repeated operations', () => {
  const s = session(), text = encode(s);
  expect(encode(s)).toBe(text);
  expect(deserializeCharacterLifeSave(text)).toEqual(deserializeCharacterLifeSave(text));
});
