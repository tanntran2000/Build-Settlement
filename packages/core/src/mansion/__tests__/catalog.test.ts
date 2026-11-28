import { expect, it } from 'vitest';
import * as core from '../../index.js';

it('pins the eight rooms, eight roles and sixteen furniture entries', () => {
  const catalog = core.MANSION_CATALOG;
  expect(catalog).toBeDefined();
  expect(Object.keys(catalog.roomTypes)).toEqual(['master-suite', 'maids-quarters', 'guard-quarters', 'training-yard', 'vault', 'bedroom', 'dungeon', 'throne-room']);
  expect(Object.keys(catalog.roles)).toEqual(['maid', 'head-maid', 'guard', 'captain', 'accountant', 'fucktoy', 'concubine', 'wife']);
  expect(Object.keys(catalog.furniture)).toHaveLength(16);
  expect(catalog.roomTypes.bedroom).toMatchObject({ furnitureSlots: [2, 3, 4], maxSingleBeds: 3, beds: 1 });
  expect(catalog).toMatchObject({ needsGraceWeeks: 8, fitMultiplierBps: 15000, maidsQuartersUpkeepBps: 9000 });
});

it('rejects an unknown effect with a catalog path', () => {
  expect(core.validateMansionCatalog).toBeTypeOf('function');
  const raw = structuredClone(core.MANSION_CATALOG);
  Object.assign(raw.roomTypes['master-suite'].effects[0], { kind: 'unknown' });
  expect(() => core.validateMansionCatalog(raw)).toThrow('mansion.json#roomTypes.master-suite.effects[0].kind: unknown effect kind');
});

it('rejects a negative resource cost with a catalog path', () => {
  expect(core.validateMansionCatalog).toBeTypeOf('function');
  const raw = structuredClone(core.MANSION_CATALOG);
  Object.assign(raw.roomTypes.bedroom.cost[0], { gold: -1 });
  expect(() => core.validateMansionCatalog(raw)).toThrow('mansion.json#roomTypes.bedroom.cost[0].gold: must be ≥ 0');
});
