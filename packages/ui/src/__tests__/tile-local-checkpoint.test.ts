import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTileTrialState, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '@haven/simulation';
import { serializeTileTrialSave } from '@haven/persistence';
import { ERROR_LOG_KEY } from '../error-log.js';
import { TILE_CHECKPOINT_KEY, readLocalCheckpoint, saveLocalCheckpoint } from '../tile-local-checkpoint.js';

const secret = 'TOKEN-secret raw/private/error';
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

function run(state: TileTrialState, type: string, fields: Record<string, unknown> = {}) {
  const result = executeTileTrialCommand(state, { type, expectedRevision: state.revision, ...fields });
  if (!result.success) throw new Error(result.error.message);
  return result.nextState;
}
const endWeek = (state: TileTrialState) => run(state, 'END_WEEK', { expectedWeek: state.world.week });
function multiweekPlan() {
  let state = createTileTrialState();
  state = run(state, 'BUILD', { tileId: 'forest-1', typeId: 'logging' }); state = run(state, 'SET_WORKERS', { tileId: 'forest-1', workers: 2 });
  state = run(state, 'BUILD', { tileId: 'ore-1', typeId: 'mine' }); state = run(state, 'SET_WORKERS', { tileId: 'ore-1', workers: 1 });
  state = run(state, 'BUILD', { tileId: 'plain-2', typeId: 'workshop' }); state = run(state, 'SET_WORKERS', { tileId: 'plain-2', workers: 1 });
  state = run(state, 'BUILD', { tileId: 'plain-3', typeId: 'market' });
  state = run(endWeek(state), 'NEXT_WEEK');
  return run(state, 'SET_ENABLED', { tileId: 'forest-1', enabled: false });
}
function savedText(state: TileTrialState = createTileTrialState()) {
  const result = serializeTileTrialSave(state); if (!result.success) throw new Error(result.error.message); return result.text;
}
const stored = () => values.get(TILE_CHECKPOINT_KEY);
const expectUntouched = () => { expect(storage.setItem).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled(); expect(storage.clear).not.toHaveBeenCalled(); };

beforeEach(() => {
  values = new Map([[ERROR_LOG_KEY, 'logger-bytes']]);
  storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }), clear: vi.fn(() => values.clear()),
  };
  vi.stubGlobal('window', { localStorage: storage });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('explicit local save', () => {
  it('writes the unchanged export envelope once to the single slot and reports replacement', () => {
    const plan = multiweekPlan();
    expect(saveLocalCheckpoint(plan)).toEqual({ success: true, replaced: false });
    expect(storage.setItem).toHaveBeenCalledOnce(); expect(storage.setItem).toHaveBeenCalledWith(TILE_CHECKPOINT_KEY, savedText(plan));
    expect(saveLocalCheckpoint(createTileTrialState())).toEqual({ success: true, replaced: true });
    expect(stored()).toBe(savedText()); expect(values.get(ERROR_LOG_KEY)).toBe('logger-bytes');
    expect(storage.removeItem).not.toHaveBeenCalled(); expect(storage.clear).not.toHaveBeenCalled();
  });
  it.each([['report state', () => endWeek(createTileTrialState())], ['invalid state', () => ({ phase: 'planning' })]])('rejects %s before touching storage', (_, state) => {
    values.set(TILE_CHECKPOINT_KEY, 'prior');
    expect(saveLocalCheckpoint(state())).toMatchObject({ success: false });
    expect(storage.getItem).not.toHaveBeenCalled(); expectUntouched(); expect(stored()).toBe('prior');
  });
  it('replaces an invalid slot with a valid explicit save', () => {
    values.set(TILE_CHECKPOINT_KEY, '{broken');
    expect(saveLocalCheckpoint(createTileTrialState())).toEqual({ success: true, replaced: true }); expect(stored()).toBe(savedText());
  });
  it.each(['window', 'getter', 'getItem', 'quota', 'setItem'])('contains %s failure and preserves the prior checkpoint', failure => {
    values.set(TILE_CHECKPOINT_KEY, 'prior');
    if (failure === 'window') vi.stubGlobal('window', undefined);
    else if (failure === 'getter') vi.stubGlobal('window', { get localStorage() { throw new DOMException(secret, 'SecurityError'); } });
    else if (failure === 'getItem') storage.getItem.mockImplementation(() => { throw new DOMException(secret, 'SecurityError'); });
    else if (failure === 'quota') storage.setItem.mockImplementation(() => { throw new DOMException(secret, 'QuotaExceededError'); });
    else storage.setItem.mockImplementation(() => { throw new Error(secret); });
    const result = saveLocalCheckpoint(multiweekPlan());
    expect(result.success).toBe(false); if (result.success) return;
    expect(result.message).toContain('Export checkpoint'); expect(result.message).not.toContain('TOKEN');
    expect(stored()).toBe('prior'); expect(values.get(ERROR_LOG_KEY)).toBe('logger-bytes');
    expect(storage.removeItem).not.toHaveBeenCalled(); expect(storage.clear).not.toHaveBeenCalled();
  });
});

describe('explicit local continue', () => {
  it('restores the exact saved gameplay, which then resolves like uninterrupted play', () => {
    const plan = multiweekPlan(); saveLocalCheckpoint(plan); storage.setItem.mockClear();
    const result = readLocalCheckpoint(); expect(result.success).toBe(true); if (!result.success) return;
    expect(result.state).toEqual(plan); expect(result.state).not.toBe(plan);
    const loaded = run(createTileTrialState(), 'LOAD_TRIAL', { snapshot: result.state });
    expect(loaded.revision).toBeGreaterThan(plan.revision);
    const continued = endWeek(loaded), uninterrupted = endWeek(plan);
    expect(continued.world).toEqual(uninterrupted.world); expect(continued.tiles).toEqual(uninterrupted.tiles); expect(continued.happiness).toBe(uninterrupted.happiness);
    expectUntouched();
  });
  it('explains a missing slot without writing', () => {
    const result = readLocalCheckpoint(); expect(result).toMatchObject({ success: false }); if (result.success) return;
    expect(result.message).toContain('No local checkpoint'); expectUntouched();
  });
  const valid = () => JSON.parse(savedText());
  const variant = (change: (save: ReturnType<typeof valid>) => void) => { const save = valid(); change(save); return JSON.stringify(save); };
  it.each([
    ['malformed', '{'], ['empty object', '{}'],
    ['version', variant(s => { s.schemaVersion = 2; })], ['ruleset', variant(s => { s.rulesetId = 'future'; })],
    ['map', variant(s => { s.state.tiles[0].terrain = 'ore'; })],
    ['negative stock', variant(s => { s.state.world.settlements.settlement_haven_01.inventory.gold = -1; })],
    ['report state', variant(s => { s.state.phase = 'report'; })], ['oversize', ' '.repeat(1024 * 1024 + 1)],
  ])('rejects a %s slot and leaves its bytes in place', (_, text) => {
    values.set(TILE_CHECKPOINT_KEY, text);
    const result = readLocalCheckpoint(); expect(result).toMatchObject({ success: false }); if (result.success) return;
    expect(result.message).toContain('left unchanged'); expect(stored()).toBe(text); expectUntouched();
  });
  it.each(['window', 'getter', 'getItem'])('contains %s read failure', failure => {
    values.set(TILE_CHECKPOINT_KEY, savedText());
    if (failure === 'window') vi.stubGlobal('window', undefined);
    else if (failure === 'getter') vi.stubGlobal('window', { get localStorage() { throw new DOMException(secret, 'SecurityError'); } });
    else storage.getItem.mockImplementation(() => { throw new Error(secret); });
    const result = readLocalCheckpoint(); expect(result).toMatchObject({ success: false }); if (result.success) return;
    expect(result.message).toContain('Import checkpoint'); expect(result.message).not.toContain('TOKEN');
    expect(stored()).toBe(savedText()); expectUntouched();
  });
});
