import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createWorldSession, type WorldSessionState } from '@haven/core';
import { serializeWorldSessionSave } from '@haven/persistence';
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
