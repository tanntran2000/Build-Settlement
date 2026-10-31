import { describe, expect, it, vi } from 'vitest';
import * as core from '@haven/core';
import { createSocietyState, isTileTrialState, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';

const stocks = (s: TileTrialState) => s.world.settlements[s.world.activeSettlementId!].inventory;
function city() {
  const s = createSocietyState();
  s.society!.classes.free = 50; s.society!.classes.makers.common = 50;
  s.society!.classes.luminaries.common = 0; s.society!.classes.merchants.common = 0;
  s.tiles.find(t => t.id === 'spec-1')!.building!.enabled = false;
  stocks(s).food = 4000;
  expect(isTileTrialState(s)).toBe(true);
  return s;
}
const raw = (s: TileTrialState) => ({ type: 'END_WEEK', expectedWeek: s.world.week, expectedRevision: s.revision });
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function rejected(s: TileTrialState, command: unknown, code: string) {
  const before = structuredClone(s), r = executeTileTrialCommand(s, command);
  expect(r).toMatchObject({ success: false, error: { code } });
  if (r.success) throw Error('Expected rejection');
  expect(r.state).toBe(s); expect(r).not.toHaveProperty('report'); expect(s).toEqual(before);
}
function success(s: TileTrialState) {
  const before = structuredClone(s), r = executeTileTrialCommand(s, raw(s));
  expect(r.success).toBe(true); expect(s).toEqual(before);
  if (!r.success) throw Error(r.error.message);
  expect(isTileTrialState(r.nextState)).toBe(true);
  return r;
}

describe('retained society command and production branches', () => {
  it.each([
    [10000, 0, 4, 4, 8500, 0, 8000, 4000],
    [1500, 0, 4, 4, 0, 0, 8000, 4000],
    [999, 0, 4, 4, 499, 0, 6000, 3000],
    [10000, 3000, 0, 2, 11500, 1000, 2000, 0],
    [10000, 0, 4, 0, 8500, 8000, 0, 4000],
  ])('whole batches conserve Gold/Wheat/Food for G%s W%s and %s/%s workers', (gold, wheat, farm, processor, g, w, food, batchGold) => {
    const s = city(); Object.assign(stocks(s), { gold, wheat });
    s.tiles[0].building!.workers = farm; s.tiles[1].building!.workers = processor;
    const r = success(freeze(s)), report = r.report!;
    expect(stocks(r.nextState)).toEqual({ gold: g, wheat: w, food, wood: 8000, iron: 4000 });
    expect(report.farmBatchGoldMilli).toBe(batchGold);
    const harvested = batchGold / 1000;
    const processed = (wheat + harvested * 2000 - w) / 2000;
    expect(Number.isInteger(processed)).toBe(true);
    expect(food).toBe(4000 + processed * 2000 - report.foodConsumedMilli);
    expect(report.before.gold + report.taxMilli - report.after.gold)
      .toBe(report.farmBatchGoldMilli + report.farmExtraUpkeepMilli + (report.unpaidUpkeepMilli === 0 ? 500 : 0));
    expect(report.goods.revenueMilli).toBe(0); expect(report.goods.woodUsed).toBe(0);
    expect(executeTileTrialCommand(s, raw(s))).toEqual(r);
  });
  it('harvests without processing when the Processor is paused', () => {
    const s = city(); s.tiles[0].building!.workers = 4;
    s.tiles[1].building!.enabled = false; s.tiles[1].building!.workers = 0;
    const r = success(s);
    expect(stocks(r.nextState)).toMatchObject({ wheat: 8000, food: 0 });
    expect(r.report!.farmBatchGoldMilli).toBe(4000);
  });
  it('rejects intermediate Wheat overflow before a later processing debit', () => {
    const s = city(); s.tiles[0].building!.workers = 4; s.tiles[1].building!.workers = 4;
    stocks(s).wheat = Number.MAX_SAFE_INTEGER - 7999;
    rejected(freeze(s), raw(s), 'EXECUTION_ERROR');
  });
  it('permits the exact intermediate Wheat limit and charges processing once', () => {
    const s = city(); s.tiles[0].building!.workers = 4; s.tiles[1].building!.workers = 4;
    stocks(s).wheat = Number.MAX_SAFE_INTEGER - 8000;
    const r = success(s);
    expect(stocks(r.nextState).wheat).toBe(Number.MAX_SAFE_INTEGER - 8000);
    expect(stocks(r.nextState).food).toBe(8000);
  });
  it.each(['food', 'wood', 'iron'] as const)('rejects intermediate %s overflow atomically', key => {
    const s = city();
    if (key === 'food') stocks(s).food = Number.MAX_SAFE_INTEGER - 3999;
    if (key === 'wood') {
      s.tiles.find(t => t.id === 'forest-1')!.building = { typeId: 'logging', level: 1, workers: 2, enabled: true };
      s.tiles.find(t => t.id === 'plain-2')!.building = { typeId: 'workshop', level: 1, workers: 1, enabled: true };
      stocks(s).wood = Number.MAX_SAFE_INTEGER - 3999;
    }
    if (key === 'iron') {
      s.tiles.find(t => t.id === 'ore-1')!.building = { typeId: 'mine', level: 1, workers: 1, enabled: true };
      stocks(s).iron = Number.MAX_SAFE_INTEGER - 999;
    }
    expect(isTileTrialState(s)).toBe(true); rejected(s, raw(s), 'EXECUTION_ERROR');
  });
  it('permits exact Food/Gold boundaries and preserves unrelated physical stocks', () => {
    const s = city(); stocks(s).gold = Number.MAX_SAFE_INTEGER - 3000;
    stocks(s).food = Number.MAX_SAFE_INTEGER - 4000;
    const r = success(s);
    expect(stocks(r.nextState).food).toBe(Number.MAX_SAFE_INTEGER - 4000);
    expect(stocks(r.nextState)).toMatchObject({ wood: 8000, iron: 4000 });
    const overflow = city(); stocks(overflow).gold = Number.MAX_SAFE_INTEGER - 2999;
    rejected(overflow, raw(overflow), 'EXECUTION_ERROR');
  });
  it.each(['week', 'revision', 'population'] as const)('rolls back the complete transaction on %s arithmetic overflow', kind => {
    const s = city();
    if (kind === 'week') s.world.week = Number.MAX_SAFE_INTEGER;
    if (kind === 'revision') s.revision = Number.MAX_SAFE_INTEGER;
    if (kind === 'population') {
      s.society!.classes.free = Number.MAX_SAFE_INTEGER; s.society!.classes.makers.common = 0;
      s.world.settlements[s.world.activeSettlementId!].cohorts[0].count = Number.MAX_SAFE_INTEGER;
      for (const t of s.tiles) if (t.building) t.building.workers = 0;
    }
    expect(isTileTrialState(s)).toBe(true); rejected(s, raw(s), 'EXECUTION_ERROR');
  });
  it.each([null, undefined, 1, true, 'END_WEEK', []])('rejects malformed command data %j without mutation', command => {
    rejected(freeze(city()), command, 'INVALID_COMMAND');
  });
  it('rejects unknown command fields and stale or repeated week/revision commands', () => {
    const s = city();
    rejected(s, { ...raw(s), type: 'future' }, 'INVALID_COMMAND');
    rejected(s, { ...raw(s), extra: 1 }, 'INVALID_COMMAND');
    rejected(s, { ...raw(s), expectedWeek: 0 }, 'WEEK_MISMATCH');
    rejected(s, { ...raw(s), expectedRevision: -1 }, 'STALE_COMMAND');
    rejected(s, { type: 'NEXT_WEEK', expectedRevision: s.revision }, 'FORBIDDEN');
    const r = success(s);
    rejected(r.nextState, raw(s), 'STALE_COMMAND');
    rejected(r.nextState, { ...raw(r.nextState) }, 'FORBIDDEN');
  });
  it('contains clone failures and thrown command objects without leaking a report', () => {
    const s = city(), before = structuredClone(s), proxy = new Proxy(s, {});
    const cloneFailure = executeTileTrialCommand(proxy, raw(s));
    expect(cloneFailure).toMatchObject({ success: false, error: { code: 'EXECUTION_ERROR' } });
    if (cloneFailure.success) throw Error();
    expect(cloneFailure.state).toBe(proxy); expect(cloneFailure).not.toHaveProperty('report');
    const hostile = new Proxy(raw(s), { get() { throw Object.create(null); } });
    expect(() => executeTileTrialCommand(s, hostile)).not.toThrow();
    rejected(s, hostile, 'EXECUTION_ERROR'); expect(s).toEqual(before);
  });
  it('uses one captured live command snapshot instead of rereading Proxy fields', () => {
    const s = city(), before = structuredClone(s), reads: Record<string, number> = {};
    const command = new Proxy(raw(s), { get(target, key, receiver) {
      if (typeof key === 'string') reads[key] = (reads[key] ?? 0) + 1;
      return key === 'expectedWeek' && reads.expectedWeek > 1 ? 0 : Reflect.get(target, key, receiver);
    } });
    const r = executeTileTrialCommand(s, command);
    expect(r.success).toBe(true); expect(reads).toEqual({ type: 1, expectedWeek: 1, expectedRevision: 1 });
    expect(s).toEqual(before);
  });
  it('preserves the invalid-state boundary for revoked Proxy inputs', () => {
    const { proxy, revoke } = Proxy.revocable(city(), {}); revoke();
    const r = executeTileTrialCommand(proxy, { type: 'END_WEEK', expectedWeek: 1, expectedRevision: 0 });
    expect(r).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
    if (r.success) throw Error(); expect(r.state).toBe(proxy); expect(r).not.toHaveProperty('report');
  });
  it('rolls back and publishes no report if the candidate state fails final validation', () => {
    const s = city(), before = structuredClone(s), validate = core.isTileTrialState;
    const spy = vi.spyOn(core, 'isTileTrialState').mockImplementationOnce(validate).mockReturnValueOnce(false);
    try {
      const r = executeTileTrialCommand(s, raw(s));
      expect(r).toMatchObject({ success: false, error: { code: 'INVALID_PLAN' } });
      if (r.success) throw Error(); expect(r.state).toBe(s); expect(r).not.toHaveProperty('report');
      expect(s).toEqual(before);
    } finally { spy.mockRestore(); }
  });
  it('preserves immutable report snapshots after next-state mutation', () => {
    const s = city(), r = success(freeze(s)), report = r.report!, saved = structuredClone(report);
    expect(Object.isFrozen(report)).toBe(true); expect(Object.isFrozen(report.before)).toBe(true);
    expect(Object.isFrozen(report.after)).toBe(true); expect(Object.isFrozen(report.activities)).toBe(true);
    stocks(r.nextState).gold = 0; stocks(r.nextState).food = 0;
    expect(report).toEqual(saved);
  });
});

it('follows the active pointer and leaves the legacy settlement byte-for-byte unchanged', () => {
  const s = city();
  const originalId = s.world.activeSettlementId!;
  const active = structuredClone(s.world.settlements[originalId]);
  active.id = 'alternate';
  s.world.settlements[originalId].status = 'legacy';
  s.world.settlements.alternate = active;
  s.world.activeSettlementId = 'alternate';
  const legacy = structuredClone(s.world.settlements[originalId]);
  const r = success(s);
  expect(r.nextState.world.settlements[originalId]).toEqual(legacy);
  expect(r.nextState.world.activeSettlementId).toBe('alternate');
  expect(r.nextState.world.settlements.alternate.inventory).not.toEqual(active.inventory);
});

it.each(['missing-active', 'negative-food', 'unsafe-week'])('rejects invalid society state atomically: %s', kind => {
  const s = city();
  if (kind === 'missing-active') s.world.activeSettlementId = null;
  if (kind === 'negative-food') stocks(s).food = -1;
  if (kind === 'unsafe-week') s.world.week = Number.MAX_SAFE_INTEGER + 1;
  rejected(s, raw(s), 'INVALID_STATE');
});
