import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createOutsideWorld, validateOutsideWorldConfig } from '../generate.js';
import { POPULATION_TILE_RULESET } from '../../trial/catalog.js';

// test-only fixture; not balance
const fixture = () => ({
  scenarioId: 'f12', generator: 'outside-gen-01', cityRulesetId: POPULATION_TILE_RULESET,
  actors: ['player', 'ai'],
  tiles: Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, owner: null, eligible: ![0, 5, 11].includes(i), knownBy: [] as string[] })),
  depositBudget: 2, lootBudget: 3, depositResources: ['wheat', 'wood', 'iron'],
});
function features(seed: number) {
  const result = createOutsideWorld(fixture(), seed);
  expect(result.success).toBe(true);
  if (!result.success) throw Error(result.error.message);
  return result.value.tiles.filter(t => t.feature).map(t => [t.id, t.feature]);
}
it('matches the independent F12 seed 123 oracle', () => {
  expect(features(123)).toEqual([
    ['t1', { kind: 'deposit', resource: 'iron' }], ['t3', { kind: 'loot', claimedBy: null }],
    ['t6', { kind: 'deposit', resource: 'wood' }], ['t7', { kind: 'loot', claimedBy: null }], ['t8', { kind: 'loot', claimedBy: null }],
  ]);
});
it('matches the independent F12 seed zero oracle', () => {
  expect(features(0)).toEqual([
    ['t4', { kind: 'deposit', resource: 'wood' }], ['t6', { kind: 'loot', claimedBy: null }],
    ['t7', { kind: 'deposit', resource: 'wood' }], ['t8', { kind: 'loot', claimedBy: null }], ['t10', { kind: 'loot', claimedBy: null }],
  ]);
});
it.each([false, true])('handles zero/one eligible tile (%s)', eligible => {
  const config = { ...fixture(), tiles: ['a', 'b', 'c'].map(id => ({ id, eligible: eligible && id === 'b', owner: null, knownBy: [] })), depositBudget: eligible ? 1 : 0, lootBudget: 0, depositResources: ['iron'] };
  const result = createOutsideWorld(config, 7);
  expect(result.success).toBe(true);
  if (result.success) expect(result.value.tiles.map(t => t.feature)).toEqual([null, eligible ? { kind: 'deposit', resource: 'iron' } : null, null]);
});
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
it('accepts deep frozen data and detaches every output array', () => {
  const config = freeze(fixture()), before = structuredClone(config), result = createOutsideWorld(config, 123);
  expect(result.success).toBe(true);
  if (!result.success) return;
  result.value.actors.push('other'); result.value.tiles[0].knownBy.push('player');
  expect(config).toEqual(before);
  const mutable = fixture(), generated = createOutsideWorld(mutable, 123);
  if (!generated.success) throw Error('generation failed');
  mutable.actors[0] = 'changed'; mutable.tiles[0].knownBy.push('ai');
  expect(generated.value.actors).toEqual(['player', 'ai']); expect(generated.value.tiles[0].knownBy).toEqual([]);
});
it.each([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, 1.5, '1', -1, 10])('rejects invalid deposit budget %s', depositBudget => {
  expect(createOutsideWorld({ ...fixture(), depositBudget }, 0)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_CONFIG' } });
});
it.each([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, 1.5, '1', -1, 8])('rejects invalid loot budget %s', lootBudget => {
  expect(createOutsideWorld({ ...fixture(), lootBudget }, 0)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_CONFIG' } });
});
it.each([-1, 4294967296, 1.5, NaN, '1', null])('rejects invalid seed %s after config validation', seed => {
  expect(createOutsideWorld(fixture(), seed)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_SEED' } });
  expect(createOutsideWorld({}, seed)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_CONFIG' } });
});
it.each([0, 4294967295])('accepts seed boundary %s', seed => expect(createOutsideWorld(fixture(), seed).success).toBe(true));
it('rejects hostile descriptors/prototypes without invoking getters or throwing', () => {
  const proxy = Proxy.revocable({}, {}); proxy.revoke();
  const getter = fixture(); let calls = 0; Object.defineProperty(getter.tiles, '0', { enumerable: true, get() { calls++; throw Error(); } });
  const symbol = fixture(); Object.assign(symbol.tiles, { [Symbol('extra')]: 1 });
  const extra = fixture(); Object.assign(extra.actors, { extra: true });
  const prototype = fixture(); Object.setPrototypeOf(prototype.tiles, {});
  const sparse = fixture(); delete sparse.tiles[0];
  const missing = fixture(); Reflect.deleteProperty(missing, 'generator');
  for (const config of [proxy.proxy, getter, symbol, extra, prototype, sparse, missing]) {
    expect(validateOutsideWorldConfig(config)).toMatchObject({ success: false, error: { code: 'INVALID_WORLD_CONFIG' } });
  }
  expect(calls).toBe(0);
});
it('keeps ambient seed sources and platform dependencies out of core world runtime', () => {
  const directory = new URL('../', import.meta.url);
  for (const file of readdirSync(directory).filter(f => f.endsWith('.ts'))) {
    expect(readFileSync(new URL(file, directory), 'utf8')).not.toMatch(/Math\.random|Date\.now|performance\.now|\bcrypto\b|\bwindow\b|\bdocument\b|node:/);
  }
});
