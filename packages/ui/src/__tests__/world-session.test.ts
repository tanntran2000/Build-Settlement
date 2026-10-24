import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createWorldSession, isWorldSessionState, type WorldSessionState } from '@haven/core';
import { deserializeWorldSessionSave, serializeWorldSessionSave, TILE_SAVE_MAX_BYTES } from '@haven/persistence';
import { prepareWorldSessionLoad, readLocalWorldSession, saveLocalWorldSession, WORLD_SESSION_CHECKPOINT_KEY } from '../world-session.js';

const session = (seed = 0) => { const r = createWorldSession(seed); if (!r.success) throw Error(); return r.value; };
const oldKeys = ['haven.tile-trial.checkpoint.v1', 'haven.tile-population.checkpoint.v1'];
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };
beforeEach(() => {
  values = new Map(oldKeys.map(k => [k, 'protected-bytes']));
  storage = { getItem: vi.fn((k: string) => values.get(k) ?? null), setItem: vi.fn((k: string, v: string) => { values.set(k, v); }) };
  vi.stubGlobal('window', { localStorage: storage });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it.each(['stale', 'overflow', 'invalid city', 'invalid outside', 'revoked loaded'])('rejects %s during whole-session preparation without mutation', kind => {
  const live = session(), loaded = session(4294967295); let expected = live.city.revision;
  if (kind === 'stale') expected--;
  if (kind === 'overflow') live.city.revision = Number.MAX_SAFE_INTEGER;
  if (kind === 'invalid city') loaded.city.world.settlements.settlement_haven_01.inventory.gold = -1;
  if (kind === 'invalid outside') loaded.outside.tiles[0].owner = 'ghost';
  const before = structuredClone(live), saved = structuredClone(loaded);
  const proxy = Proxy.revocable(loaded, {}); if (kind === 'revoked loaded') proxy.revoke();
  expect(prepareWorldSessionLoad(live, kind === 'revoked loaded' ? proxy.proxy : loaded, expected).success).toBe(false);
  expect(live).toEqual(before); expect(loaded).toEqual(saved);
});
it.each([0, 12])('rebases revision for saved revision %s, including identical data', revision => {
  const live = session(), loaded = session(); live.city.revision = 5; loaded.city.revision = revision;
  const before = structuredClone(live), result = prepareWorldSessionLoad(live, loaded, 5);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(result.next.city.revision).toBe(Math.max(5, revision) + 1);
  expect({ ...result.next.city, revision }).toEqual(loaded.city); expect(result.next.outside).toEqual(loaded.outside); expect(live).toEqual(before);
});
it('accesses only the world slot and writes the codec envelope exactly once', () => {
  const s = session(), before = structuredClone(s), encoded = serializeWorldSessionSave(s); if (!encoded.success) throw Error();
  expect(saveLocalWorldSession(s)).toEqual({ success: true, replaced: false });
  expect(storage.getItem.mock.calls).toEqual([[WORLD_SESSION_CHECKPOINT_KEY]]);
  expect(storage.setItem.mock.calls).toEqual([[WORLD_SESSION_CHECKPOINT_KEY, encoded.text]]);
  storage.getItem.mockClear(); storage.setItem.mockClear();
  expect(readLocalWorldSession()).toEqual({ success: true, state: s });
  expect(storage.getItem.mock.calls).toEqual([[WORLD_SESSION_CHECKPOINT_KEY]]); expect(storage.setItem).not.toHaveBeenCalled();
  expect(saveLocalWorldSession(s)).toEqual({ success: true, replaced: true });
  oldKeys.forEach(k => expect(values.get(k)).toBe('protected-bytes')); expect(s).toEqual(before);
});
it('does not fall back to old slots or repair malformed world bytes', () => {
  const before = new Map(values);
  expect(readLocalWorldSession()).toMatchObject({ success: false, message: expect.stringContaining('No local checkpoint') });
  expect(values).toEqual(before);
  values.set(WORLD_SESSION_CHECKPOINT_KEY, '{'); const corrupt = new Map(values);
  expect(readLocalWorldSession()).toMatchObject({ success: false, message: expect.stringContaining('left unchanged') });
  expect(values).toEqual(corrupt); expect(storage.setItem).not.toHaveBeenCalled();
});
it.each(['window', 'getter', 'read', 'write'])('contains %s storage failure and preserves all bytes', kind => {
  values.set(WORLD_SESSION_CHECKPOINT_KEY, 'prior'); const before = new Map(values), s = session(), snapshot = structuredClone(s);
  if (kind === 'window') vi.stubGlobal('window', undefined);
  if (kind === 'getter') vi.stubGlobal('window', { get localStorage() { throw Error('private'); } });
  if (kind === 'read') storage.getItem.mockImplementation(() => { throw Error('private'); });
  if (kind === 'write') storage.setItem.mockImplementation(() => { throw Error('private'); });
  const result = saveLocalWorldSession(s);
  expect(result).toMatchObject({ success: false, message: expect.stringContaining('Export checkpoint') });
  expect(JSON.stringify(result)).not.toContain('private'); expect(values).toEqual(before); expect(s).toEqual(snapshot);
  if (kind !== 'write') expect(readLocalWorldSession()).toMatchObject({ success: false, message: expect.stringContaining('Import checkpoint') });
});
it('rejects invalid state before storage access', () => {
  const s: WorldSessionState = session(); s.city.phase = 'report';
  expect(saveLocalWorldSession(s).success).toBe(false); expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
});

it('F1: replacing a valid checkpoint through an active Proxy leaves decodable descriptor data', () => {
  const s = session(), old = serializeWorldSessionSave(s); if (!old.success) throw Error();
  values.set(WORLD_SESSION_CHECKPOINT_KEY, old.text); let hooks = 0;
  const active = new Proxy(s, { get(target, key, receiver) {
    return key === 'toJSON' ? () => { hooks++; return {}; } : Reflect.get(target, key, receiver);
  } });
  const saved = saveLocalWorldSession(active);
  expect(saved).toEqual({ success: true, replaced: true });
  expect(deserializeWorldSessionSave(values.get(WORLD_SESSION_CHECKPOINT_KEY))).toEqual({ success: true, state: s });
  expect(hooks).toBe(0); expect(storage.setItem).toHaveBeenCalledOnce();
  oldKeys.forEach(k => expect(values.get(k)).toBe('protected-bytes'));
});
it.each(['accessor', 'own toJSON', 'revoked proxy'])('F1: rejected %s preserves prior valid bytes and never touches storage', kind => {
  const s = session(), old = serializeWorldSessionSave(s); if (!old.success) throw Error();
  values.set(WORLD_SESSION_CHECKPOINT_KEY, old.text); const before = new Map(values); let calls = 0;
  if (kind === 'accessor') Object.defineProperty(s.city.world.settlements.settlement_haven_01.inventory, 'gold', { enumerable: true, get() { calls++; return 0; } });
  if (kind === 'own toJSON') Object.assign(s, { toJSON() { calls++; return {}; } });
  const proxy = Proxy.revocable(s, {}); if (kind === 'revoked proxy') proxy.revoke();
  expect(saveLocalWorldSession(kind === 'revoked proxy' ? proxy.proxy : s).success).toBe(false);
  expect(values).toEqual(before); expect(calls).toBe(0);
  expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
  expect(deserializeWorldSessionSave(values.get(WORLD_SESSION_CHECKPOINT_KEY)).success).toBe(true);
});

it('T-4: stateful outside reads cannot publish values different from the captured validated session', () => {
  const live = session(), loaded = session(1), ghost = session(2), before = structuredClone(live);
  ghost.outside.tiles[0].owner = 'ghost';
  let validationReads = 0;
  expect(isWorldSessionState(new Proxy(loaded, { get(target, key, receiver) {
    if (key === 'outside') validationReads++;
    return Reflect.get(target, key, receiver);
  } }))).toBe(true);
  let reads = 0;
  const active = new Proxy(loaded, { get(target, key, receiver) {
    if (key === 'outside' && ++reads > validationReads) return ghost.outside;
    return Reflect.get(target, key, receiver);
  } });
  const result = prepareWorldSessionLoad(live, active, live.city.revision);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(isWorldSessionState(result.next)).toBe(true);
  expect(result.next.outside).toEqual(loaded.outside); expect(reads).toBe(0); expect(live).toEqual(before);
});
it('T-4: city and outside come from one detached capture without original get/toJSON callbacks', () => {
  const live = session(), loaded = session(4294967295); loaded.city.revision = 9;
  let reads = 0;
  const active = new Proxy(loaded, { get() { reads++; throw Error('original get must not run'); } });
  const result = prepareWorldSessionLoad(live, active, 0);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(result.next.city).toEqual({ ...loaded.city, revision: 10 });
  expect(result.next.outside).toEqual(loaded.outside); expect(reads).toBe(0);
  expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
});
it('T-4: prepared city, outside, records and arrays share no mutable data with either input', () => {
  const live = session(), loaded = session(1), beforeLive = structuredClone(live), beforeLoaded = structuredClone(loaded);
  const result = prepareWorldSessionLoad(live, loaded, 0);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(result.next.city.world).not.toBe(loaded.city.world); expect(result.next.city.tiles).not.toBe(loaded.city.tiles);
  expect(result.next.outside).not.toBe(loaded.outside); expect(result.next.outside.actors).not.toBe(loaded.outside.actors);
  expect(result.next.outside.tiles).not.toBe(loaded.outside.tiles); expect(result.next.outside.tiles[0]).not.toBe(loaded.outside.tiles[0]);
  expect(result.next.outside.tiles[0].knownBy).not.toBe(loaded.outside.tiles[0].knownBy);
  const prepared = structuredClone(result.next);
  loaded.outside.tiles[0].owner = 'player'; loaded.outside.tiles[0].knownBy.push('player'); loaded.outside.actors[0] = 'changed';
  loaded.city.world.settlements.settlement_haven_01.inventory.gold = 999;
  expect(result.next).toEqual(prepared);
  const afterLoaded = structuredClone(loaded);
  result.next.outside.tiles[0].knownBy.push('player'); result.next.city.tiles[0].building!.workers = 0;
  expect(loaded).toEqual(afterLoaded); expect(live).toEqual(beforeLive); expect(beforeLoaded.outside.tiles[0].owner).toBe('ai-1');
});
it.each(['city getter', 'outside getter', 'toJSON', 'cycle', 'revoked', 'invalid city', 'invalid outside'])('T-4: %s rejection preserves both inputs and checkpoint bytes without callbacks', kind => {
  const live = session(), loaded = session(1), beforeLive = structuredClone(live), bytes = new Map(values); let calls = 0;
  if (kind === 'invalid city') loaded.city.world.settlements.settlement_haven_01.inventory.gold = -1;
  if (kind === 'invalid outside') loaded.outside.tiles[0].owner = 'ghost';
  if (kind === 'cycle') Object.assign(loaded, { cycle: loaded });
  if (kind === 'toJSON') Object.assign(loaded, { toJSON() { calls++; return {}; } });
  if (kind === 'city getter' || kind === 'outside getter') Object.defineProperty(loaded, kind === 'city getter' ? 'city' : 'outside', { enumerable: true, get() { calls++; throw Error('must not run'); } });
  const beforeDescriptors = Object.getOwnPropertyDescriptors(loaded), proxy = Proxy.revocable(loaded, {});
  if (kind === 'revoked') proxy.revoke();
  expect(prepareWorldSessionLoad(live, kind === 'revoked' ? proxy.proxy : loaded, 0).success).toBe(false);
  expect(Object.getOwnPropertyDescriptors(loaded)).toEqual(beforeDescriptors);
  expect(live).toEqual(beforeLive); expect(values).toEqual(bytes); expect(calls).toBe(0);
  expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
});
it('T-4: keeps preparing a valid decoded checkpoint at the byte cap even when canonical encoding expands', () => {
  const loaded = session(), settlement = loaded.city.world.settlements.settlement_haven_01;
  settlement.inventory.gold = 1000; settlement.name = 'x';
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-population-01', state: loaded });
  settlement.name = 'x'.repeat(TILE_SAVE_MAX_BYTES - new TextEncoder().encode(text()).length + 2);
  const compact = text().replace('"gold":1000', '"gold":1e3');
  expect(new TextEncoder().encode(compact).length).toBe(TILE_SAVE_MAX_BYTES);
  const decoded = deserializeWorldSessionSave(compact); expect(decoded.success).toBe(true); if (!decoded.success) return;
  expect(serializeWorldSessionSave(decoded.state)).toMatchObject({ success: false, error: { code: 'SAVE_TOO_LARGE' } });
  const live = session(1), before = structuredClone(live), prepared = prepareWorldSessionLoad(live, decoded.state, 0);
  expect(prepared.success).toBe(true); if (!prepared.success) return;
  expect(prepared.next.city.world).toEqual(decoded.state.city.world); expect(prepared.next.outside).toEqual(decoded.state.outside);
  expect(prepared.next.city.revision).toBe(1); expect(live).toEqual(before);
});
