import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createNpcWorldSession, createWorldSession } from '@haven/core';
import { serializeNpcWorldSessionSave, serializeWorldSessionSave } from '@haven/persistence';
import { prepareNpcWorldSessionLoad, readLocalNpcWorldSession, saveLocalNpcWorldSession, WORLD_NPC_CHECKPOINT_KEY } from '../world-npc-session.js';
import { WORLD_SESSION_CHECKPOINT_KEY } from '../world-session.js';

const session = (seed = 0) => { const r = createNpcWorldSession(seed); if (!r.success) throw Error(); return r.value; };
const otherKeys = [WORLD_SESSION_CHECKPOINT_KEY, 'haven.tile-trial.checkpoint.v1', 'haven.tile-population.checkpoint.v1'];
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };
beforeEach(() => {
  values = new Map(otherKeys.map(k => [k, 'protected-bytes']));
  storage = { getItem: vi.fn((k: string) => values.get(k) ?? null), setItem: vi.fn((k: string, v: string) => { values.set(k, v); }) };
  vi.stubGlobal('window', { localStorage: storage });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('uses its own slot key', () => {
  expect(WORLD_NPC_CHECKPOINT_KEY).toBe('haven.world-npc-session.checkpoint.v1');
});
it('prepares city, outside and npcs together, rebasing the revision', () => {
  const live = session(), loaded = session(7); live.city.revision = 5; loaded.city.revision = 2; loaded.npcs[1].postTileId = 'field-1';
  const before = structuredClone(live), result = prepareNpcWorldSessionLoad(live, loaded, 5);
  expect(result.success).toBe(true); if (!result.success) return;
  expect(result.next.city).toEqual({ ...loaded.city, revision: 6 });
  expect(result.next.outside).toEqual(loaded.outside); expect(result.next.npcs).toEqual(loaded.npcs);
  result.next.npcs[1].postTileId = null; expect(loaded.npcs[1].postTileId).toBe('field-1'); expect(live).toEqual(before);
});
it.each(['stale', 'invalid npcs', 'invalid city', 'world v1 session', 'original get'])('prepares nothing for %s', kind => {
  const live = session(), loaded = session(3); let expected = live.city.revision;
  if (kind === 'stale') expected--;
  if (kind === 'invalid npcs') { loaded.npcs[0].postTileId = 'field-1'; loaded.npcs[1].postTileId = 'field-1'; }
  if (kind === 'invalid city') loaded.city.world.settlements.settlement_haven_01.inventory.gold = -1;
  const before = structuredClone(live), saved = structuredClone(loaded);
  const input = kind === 'world v1 session' ? { city: loaded.city, outside: loaded.outside }
    : kind === 'original get' ? new Proxy(loaded, { get() { throw Error('must not run'); } }) : loaded;
  const result = prepareNpcWorldSessionLoad(live, input, expected);
  expect(result.success).toBe(kind === 'original get');
  expect(live).toEqual(before); expect(loaded).toEqual(saved);
});
it('saves only to the npc slot and reads back the same session', () => {
  const s = session(); s.npcs[2].postTileId = 'plain-1';
  const encoded = serializeNpcWorldSessionSave(s); if (!encoded.success) throw Error();
  expect(saveLocalNpcWorldSession(s)).toEqual({ success: true, replaced: false });
  expect(storage.setItem.mock.calls).toEqual([[WORLD_NPC_CHECKPOINT_KEY, encoded.text]]);
  expect(readLocalNpcWorldSession()).toEqual({ success: true, state: s });
  expect(saveLocalNpcWorldSession(s)).toEqual({ success: true, replaced: true });
  otherKeys.forEach(k => expect(values.get(k)).toBe('protected-bytes'));
});
it('rejects a world v1 checkpoint in the npc slot and leaves its bytes untouched', () => {
  const world = createWorldSession(0); if (!world.success) throw Error();
  const v1 = serializeWorldSessionSave(world.value); if (!v1.success) throw Error();
  values.set(WORLD_NPC_CHECKPOINT_KEY, v1.text); const before = new Map(values);
  expect(readLocalNpcWorldSession()).toMatchObject({ success: false, message: expect.stringContaining('left unchanged') });
  expect(values).toEqual(before); expect(storage.setItem).not.toHaveBeenCalled();
});
it('reports a missing slot and contained storage failures without touching bytes', () => {
  expect(readLocalNpcWorldSession()).toMatchObject({ success: false, message: expect.stringContaining('No local checkpoint') });
  storage.setItem.mockImplementation(() => { throw Error('private'); });
  const before = new Map(values), result = saveLocalNpcWorldSession(session());
  expect(result).toMatchObject({ success: false, message: expect.stringContaining('Export checkpoint') });
  expect(JSON.stringify(result)).not.toContain('private'); expect(values).toEqual(before);
  const invalid = session(); invalid.city.phase = 'report'; storage.getItem.mockClear();
  expect(saveLocalNpcWorldSession(invalid).success).toBe(false); expect(storage.getItem).not.toHaveBeenCalled();
});
