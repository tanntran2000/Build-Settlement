import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTileTrialState, LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type TileTrialRuleset, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '@haven/simulation';
import { serializeTileTrialSave } from '@haven/persistence';
import { ERROR_LOG_KEY } from '../error-log.js';
import { TILE_CHECKPOINT_KEY, readLocalCheckpoint, saveLocalCheckpoint } from '../tile-local-checkpoint.js';

const secret = 'TOKEN-secret raw/private/error';
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

function run(state: TileTrialState, type: string, fields: Record<string, unknown> = {}, ruleset: TileTrialRuleset = LEGACY_TILE_RULESET) {
  const result = executeTileTrialCommand(state, { type, expectedRevision: state.revision, ...fields }, ruleset);
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
function savedText(state: TileTrialState = createTileTrialState(), ruleset: TileTrialRuleset = LEGACY_TILE_RULESET) {
  const result = serializeTileTrialSave(state, ruleset); if (!result.success) throw new Error(result.error.message); return result.text;
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

function populationPlan() {
  let state = createTileTrialState();
  for (const [tileId, typeId] of [['forest-1', 'logging'], ['ore-1', 'mine'], ['plain-2', 'workshop'], ['plain-3', 'market']]) state = run(state, 'BUILD', { tileId, typeId }, POPULATION_TILE_RULESET);
  for (const [tileId, workers] of [['field-1', 3], ['plain-1', 3], ['forest-1', 1], ['ore-1', 1], ['plain-2', 1]]) state = run(state, 'SET_WORKERS', { tileId, workers }, POPULATION_TILE_RULESET);
  state = run(state, 'END_WEEK', { expectedWeek: state.world.week }, POPULATION_TILE_RULESET);
  return run(state, 'NEXT_WEEK', {}, POPULATION_TILE_RULESET);
}

describe.each([
  [LEGACY_TILE_RULESET, 'haven.tile-trial.checkpoint.v1', 'haven.tile-population.checkpoint.v1', POPULATION_TILE_RULESET],
  [POPULATION_TILE_RULESET, 'haven.tile-population.checkpoint.v1', 'haven.tile-trial.checkpoint.v1', LEGACY_TILE_RULESET],
] as const)('%s isolated checkpoint', (ruleset, key, otherKey, otherRuleset) => {
  beforeEach(() => { values.set(otherKey, savedText(createTileTrialState(), otherRuleset)); });
  it('reads and writes only the selected slot and reports its own replacement', () => {
    const state = ruleset === POPULATION_TILE_RULESET ? populationPlan() : multiweekPlan(), before = structuredClone(state), other = values.get(otherKey);
    expect(saveLocalCheckpoint(state, ruleset)).toEqual({ success: true, replaced: false });
    expect(storage.getItem.mock.calls).toEqual([[key]]);
    expect(storage.setItem.mock.calls).toEqual([[key, savedText(state, ruleset)]]);
    expect(JSON.parse(values.get(key)!)).toMatchObject({ schemaVersion: 1, rulesetId: ruleset, state });
    storage.getItem.mockClear(); storage.setItem.mockClear();
    const loaded = readLocalCheckpoint(ruleset);
    expect(loaded).toEqual({ success: true, state });
    if (loaded.success) expect(loaded.state).not.toBe(state);
    expect(storage.getItem.mock.calls).toEqual([[key]]); expectUntouched();
    expect(saveLocalCheckpoint(createTileTrialState(), ruleset)).toEqual({ success: true, replaced: true });
    expect(values.get(otherKey)).toBe(other); expect(state).toEqual(before);
  });
  it('does not fall back when its own slot is missing', () => {
    const before = new Map(values);
    expect(readLocalCheckpoint(ruleset)).toMatchObject({ success: false, message: expect.stringContaining('No local checkpoint') });
    expect(storage.getItem.mock.calls).toEqual([[key]]); expect(values).toEqual(before); expectUntouched();
  });
  it('allows an explicit valid save to replace corrupt own bytes only', () => {
    values.set(key, '{broken'); const other = values.get(otherKey);
    expect(saveLocalCheckpoint(createTileTrialState(), ruleset)).toEqual({ success: true, replaced: true });
    expect(values.get(key)).toBe(savedText(createTileTrialState(), ruleset)); expect(values.get(otherKey)).toBe(other);
    expect(storage.removeItem).not.toHaveBeenCalled(); expect(storage.clear).not.toHaveBeenCalled();
  });
  it.each(['malformed', 'empty', 'version', 'ruleset', 'opposite mode', 'map', 'negative stock', 'report', 'extra field', 'workforce', 'oversize', 'UTF-8 oversize'])('rejects %s without changing either slot', kind => {
    const payload = JSON.parse(savedText(createTileTrialState(), ruleset));
    if (kind === 'version') payload.schemaVersion = 2;
    if (kind === 'ruleset') payload.rulesetId = 'future';
    if (kind === 'opposite mode') payload.rulesetId = otherRuleset;
    if (kind === 'map') payload.state.tiles[0].terrain = 'ore';
    if (kind === 'negative stock') payload.state.world.settlements.settlement_haven_01.inventory.gold = -1;
    if (kind === 'report') payload.state.phase = 'report';
    if (kind === 'extra field') payload.extra = true;
    if (kind === 'workforce') payload.state.tiles[0].building.workers = 100;
    const text = kind === 'malformed' ? '{' : kind === 'empty' ? '{}' : kind === 'oversize' ? ' '.repeat(1024 * 1024 + 1) : kind === 'UTF-8 oversize' ? 'é'.repeat(524289) : JSON.stringify(payload);
    values.set(key, text); const before = new Map(values);
    const result = readLocalCheckpoint(ruleset);
    expect(result).toMatchObject({ success: false, message: expect.stringContaining('left unchanged') });
    if (!result.success && kind.includes('oversize')) expect(result.message).toContain('1 MiB');
    expect(storage.getItem.mock.calls).toEqual([[key]]); expect(values).toEqual(before); expectUntouched();
  });
  it.each(['report', 'invalid'])('rejects %s state before any storage access', kind => {
    values.set(key, 'prior'); const before = new Map(values), state = kind === 'report' ? endWeek(createTileTrialState()) : { phase: 'planning' }, snapshot = structuredClone(state);
    expect(saveLocalCheckpoint(state, ruleset)).toMatchObject({ success: false });
    expect(storage.getItem).not.toHaveBeenCalled(); expectUntouched(); expect(values).toEqual(before); expect(state).toEqual(snapshot);
  });
  it.each(['window', 'getter', 'getItem', 'quota', 'setItem'])('preserves both slots and input on %s save failure', failure => {
    values.set(key, 'prior'); const before = new Map(values), state = populationPlan(), snapshot = structuredClone(state);
    if (failure === 'window') vi.stubGlobal('window', undefined);
    else if (failure === 'getter') vi.stubGlobal('window', { get localStorage() { throw new DOMException(secret, 'SecurityError'); } });
    else if (failure === 'getItem') storage.getItem.mockImplementation(() => { throw new Error(secret); });
    else storage.setItem.mockImplementation(() => { throw new DOMException(secret, failure === 'quota' ? 'QuotaExceededError' : 'SecurityError'); });
    const result = saveLocalCheckpoint(state, ruleset); expect(result.success).toBe(false);
    if (!result.success) { expect(result.message).toContain('Export checkpoint'); expect(result.message).not.toContain(secret); }
    expect(state).toEqual(snapshot); expect(values).toEqual(before);
    if (['window', 'getter', 'getItem'].includes(failure)) expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled(); expect(storage.clear).not.toHaveBeenCalled();
  });
  it.each(['window', 'getter', 'getItem'])('preserves both slots on %s read failure', failure => {
    values.set(key, savedText(createTileTrialState(), ruleset)); const before = new Map(values);
    if (failure === 'window') vi.stubGlobal('window', undefined);
    else if (failure === 'getter') vi.stubGlobal('window', { get localStorage() { throw new DOMException(secret, 'SecurityError'); } });
    else storage.getItem.mockImplementation(() => { throw new Error(secret); });
    const result = readLocalCheckpoint(ruleset); expect(result.success).toBe(false);
    if (!result.success) { expect(result.message).toContain('Import checkpoint'); expect(result.message).not.toContain(secret); }
    expect(values).toEqual(before); expectUntouched();
  });
  it('restores all gameplay without arrivals and preserves the next complete report', () => {
    const saved = ruleset === POPULATION_TILE_RULESET ? populationPlan() : multiweekPlan(), snapshot = structuredClone(saved);
    if (ruleset === POPULATION_TILE_RULESET) expect(saved.world.settlements.settlement_haven_01.cohorts[0].count).toBe(102);
    saveLocalCheckpoint(saved, ruleset); storage.setItem.mockClear(); const bytes = new Map(values);
    const decoded = readLocalCheckpoint(ruleset); expect(decoded.success).toBe(true); if (!decoded.success) return;
    const current = createTileTrialState(); current.revision = saved.revision + 10;
    const loaded = run(current, 'LOAD_TRIAL', { snapshot: decoded.state }, ruleset);
    expect(loaded.revision).toBe(Math.max(current.revision, saved.revision) + 1);
    expect({ ...loaded, revision: 0 }).toEqual({ ...saved, revision: 0 });
    const continued = executeTileTrialCommand(loaded, { type: 'END_WEEK', expectedRevision: loaded.revision, expectedWeek: loaded.world.week }, ruleset);
    const uninterrupted = executeTileTrialCommand(saved, { type: 'END_WEEK', expectedRevision: saved.revision, expectedWeek: saved.world.week }, ruleset);
    expect(continued.success).toBe(true); expect(uninterrupted.success).toBe(true); if (!continued.success || !uninterrupted.success) return;
    expect(continued.report).toEqual(uninterrupted.report);
    expect({ ...continued.nextState, revision: 0 }).toEqual({ ...uninterrupted.nextState, revision: 0 });
    if (ruleset === POPULATION_TILE_RULESET) expect(continued.report?.immigration).toMatchObject({ populationBefore: 102, arrivals: 2, populationAfter: 104 });
    for (const command of [{ snapshot: decoded.state, expectedRevision: current.revision - 1 }, { snapshot: { ...decoded.state, revision: Number.MAX_SAFE_INTEGER }, expectedRevision: current.revision }]) {
      const before = structuredClone(current), result = executeTileTrialCommand(current, { type: 'LOAD_TRIAL', ...command }, ruleset);
      expect(result.success).toBe(false); if (!result.success) expect(result.state).toBe(current);
      expect(current).toEqual(before);
    }
    expect(saved).toEqual(snapshot); expect(values).toEqual(bytes); expectUntouched();
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('explicit local save', () => {
  it('writes the unchanged export envelope once to the single slot and reports replacement', () => {
    const plan = multiweekPlan();
    expect(saveLocalCheckpoint(plan)).toEqual({ success: true, replaced: false });
    expect(storage.setItem).toHaveBeenCalledOnce(); expect(storage.setItem).toHaveBeenCalledWith(TILE_CHECKPOINT_KEY, savedText(plan));
    expect(JSON.parse(stored()!).rulesetId).toBe(LEGACY_TILE_RULESET);
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
    ['population ruleset', variant(s => { s.rulesetId = POPULATION_TILE_RULESET; })],
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
