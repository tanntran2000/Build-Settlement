import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createNpcWorldSession, createWorldSession } from '@haven/core';
import { serializeWorldSessionSave } from '@haven/persistence';
import { prepareNpcWorldSessionLoad } from '../world-npc-session.js';
const WORLD_SESSION_CHECKPOINT_KEY = 'haven.world-session.checkpoint.v1';

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