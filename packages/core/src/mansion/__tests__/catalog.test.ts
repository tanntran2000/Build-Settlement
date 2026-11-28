import { expect, it, vi } from 'vitest';
import * as core from '../../index.js';

it('pins the eight rooms, eight roles and sixteen furniture entries', () => {
  const catalog = core.MANSION_CATALOG;
  expect(catalog).toBeDefined();
  expect(Object.keys(catalog.roomTypes)).toEqual(['master-suite', 'maids-quarters', 'guard-quarters', 'training-yard', 'vault', 'bedroom', 'dungeon', 'throne-room']);
  expect(Object.keys(catalog.roles)).toEqual(['maid', 'head-maid', 'guard', 'captain', 'accountant', 'fucktoy', 'concubine', 'wife']);
  expect(Object.keys(catalog.furniture)).toEqual([
    'single-bed', 'bookshelf', 'armchair', 'sofa', 'sex-toys', 'mini-shrine', 'cooking-tools', 'pen-and-quill',
    'incense-jar', 'weapon-rack', 'medicine-cabinet', 'tool-bench', 'lute', 'game-table', 'telescope', 'shackles',
  ]);
  const { furnitureSlots, maxSingleBeds, beds } = catalog.roomTypes.bedroom;
  expect({ furnitureSlots, maxSingleBeds, beds }).toEqual({ furnitureSlots: [2, 3, 4], maxSingleBeds: 3, beds: 1 });
  const { needsGraceWeeks, fitMultiplierBps, maidsQuartersUpkeepBps } = catalog;
  expect({ needsGraceWeeks, fitMultiplierBps, maidsQuartersUpkeepBps }).toEqual({ needsGraceWeeks: 8, fitMultiplierBps: 15000, maidsQuartersUpkeepBps: 9000 });
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

it.each([
  ['needsGraceWeeks', (raw: Record<string, unknown>) => { raw.needsGraceWeeks = '8'; }],
  ['calibration.lightRoleStressRelief', (raw: Record<string, unknown>) => { delete (raw.calibration as Record<string, unknown>).lightRoleStressRelief; }],
  ['arousalPerWeek', (raw: Record<string, unknown>) => { delete raw.arousalPerWeek; }],
] as const)('checks the imported JSON independently at %s', async (path, change) => {
  const raw = structuredClone(core.MANSION_CATALOG);
  change(raw);
  vi.resetModules();
  vi.doMock('../../data/mansion.json', () => ({ default: raw }));
  try {
    await expect(import('../catalog.js')).rejects.toThrow('mansion.json#' + path + ':');
  } finally {
    vi.doUnmock('../../data/mansion.json');
    vi.resetModules();
  }
});

it('uses the loaded catalog keys and data-defined beds for new room and furniture ids', async () => {
  const raw = structuredClone(core.MANSION_CATALOG);
  const candidate = { ...raw,
    roomTypes: { ...raw.roomTypes, 'guest-room': { ...raw.roomTypes.bedroom, name: 'Guest Room', migrationPriority: null } },
    furniture: { ...raw.furniture, 'guest-cot': { ...raw.furniture['single-bed'], fitRooms: ['guest-room'] } },
  };
  vi.resetModules();
  vi.doMock('../../data/mansion.json', () => ({ default: candidate }));
  try {
    const catalog = await import('../catalog.js');
    const rules = await import('../rules.js');
    expect(catalog.isMansionRoomType('guest-room')).toBe(true);
    expect(catalog.isMansionFurniture('guest-cot')).toBe(true);
    expect(rules.roomBeds({ id: 'room-3', typeId: 'guest-room', level: 1, furniture: ['guest-cot'] })).toBe(2);
  } finally {
    vi.doUnmock('../../data/mansion.json');
    vi.resetModules();
  }
});
