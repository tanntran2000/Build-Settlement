import { expect, it } from 'vitest';
import { createSocietyState, societyPopulation, type TileTrialState } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { societyFacilities } from '../society-facilities.js';
import { resolveWorkshopOperation } from '../workshop-operation.js';

const hall = { typeId: 'retainers-hall', level: 1, workers: 0, enabled: true };
const tile = (city: TileTrialState, id: string) => city.tiles.find(t => t.id === id)!;
const inventory = (city: TileTrialState) => city.world.settlements[city.world.activeSettlementId!].inventory;
const execute = executeTileTrialCommand as (state: TileTrialState, command: Record<string, unknown>, context?: undefined, occupied?: ReadonlySet<string>) => ReturnType<typeof executeTileTrialCommand>;
const run = (city: TileTrialState, command: Record<string, unknown>, occupied?: ReadonlySet<string>) =>
  execute(city, { ...command, expectedRevision: city.revision }, undefined, occupied);
function success(city: TileTrialState, command: Record<string, unknown>) {
  const result = run(city, command);
  expect(result.success).toBe(true);
  if (!result.success) throw Error(result.error.message);
  return result;
}
function refuse(city: TileTrialState, command: Record<string, unknown>, code: string, message: string, occupied?: ReadonlySet<string>) {
  const before = structuredClone(city);
  const result = run(city, command, occupied);
  expect(result).toStrictEqual({ success: false, state: before, error: { code, message } });
  expect(city).toStrictEqual(before);
  if (!result.success) expect(result.state).toBe(city);
}
function forRing4() {
  const city = createSocietyState();
  const society = city.society!;
  society.wallRing = 3;
  society.classes.merchants.common = 20;
  city.world.settlements[city.world.activeSettlementId!].cohorts[0].count = societyPopulation(society);
  Object.assign(inventory(city), { gold: 100000, wood: 60000, iron: 30000 });
  society.stocksMilli.stone = 45000;
  return city;
}
function setCountingHouse(city: TileTrialState) {
  tile(city, 'spec-2').building = { typeId: 'counting-house', level: 1, workers: 2, enabled: true };
}
function setYard(city: TileTrialState) {
  tile(city, 'plain-1').building!.workers = 0;
  tile(city, 'spec-3').building = { typeId: 'builders-yard', level: 1, workers: 2, enabled: true };
}
const extend = { type: 'EXTEND_WALL' };
const fixed = 'This estate is fixed. You can only upgrade its building.';

it.each(['absent', 'paused', 'understaffed'])('refuses Ring 4 with a %s Counting House', condition => {
  const city = forRing4();
  if (condition !== 'absent') {
    setCountingHouse(city);
    tile(city, 'spec-2').building!.enabled = condition !== 'paused';
    tile(city, 'spec-2').building!.workers = condition === 'paused' ? 0 : 1;
  }
  refuse(city, extend, 'PREREQUISITE_MISSING', 'An operating prerequisite building is required.');
});

it.each([
  ['gold', 99999], ['wood', 59999], ['iron', 29999], ['stone', 44999],
] as const)('refuses Ring 4 with only %s %i', (stock, value) => {
  const city = forRing4();
  setCountingHouse(city);
  if (stock === 'stone') city.society!.stocksMilli.stone = value;
  else inventory(city)[stock] = value;
  refuse(city, extend, 'INSUFFICIENT_RESOURCES', stock === 'stone' ? 'Not enough Stone to extend the wall.' : 'Not enough resources to extend the wall.');
});

it('charges the exact Ring 4 cost with no Yard discount and then reports completion', () => {
  const city = forRing4();
  setCountingHouse(city);
  setYard(city);
  const before = structuredClone(city);
  const next = success(city, extend).nextState;
  expect(next.society!.wallRing).toBe(4);
  expect(inventory(next)).toStrictEqual({ gold: 0, wheat: 0, food: 20000, wood: 0, iron: 0 });
  expect(next.society!.stocksMilli.stone).toBe(0);
  expect(next.revision).toBe(1);
  expect(city).toStrictEqual(before);
  refuse(next, extend, 'WALL_COMPLETE', 'All wall rings are open.');
});

it.each([
  ['house-12', 'retainers-hall'], ['house-13', 'retainers-hall'], ['house-14', 'retainers-hall'],
  ['service-7', 'guild'], ['service-8', 'guild'], ['spec-11', 'auction-house'], ['spec-12', 'auction-house'],
  ['slum-7', 'slave-market'], ['slum-8', 'slave-market'], ['slum-9', 'slave-market'],
])('locks %s until Ring 4', (tileId, typeId) => {
  const city = forRing4();
  const build = { type: 'BUILD', tileId, typeId };
  refuse(city, build, 'LOCKED_PLOT', 'Extend the wall first.');
  city.society!.wallRing = 4;
  expect(tile(success(city, build).nextState, tileId)).toStrictEqual({ id: tileId, terrain: 'town', building: { ...hall, typeId } });
});

it.each(['estate-1', 'estate-2'])('allows only UPGRADE on %s', tileId => {
  let city = createSocietyState();
  for (const command of [
    { type: 'BUILD', typeId: 'mansion' }, { type: 'REPLACE', typeId: 'retainers-hall' },
    { type: 'SET_ENABLED', enabled: false }, { type: 'SET_WORKERS', workers: 0 },
  ]) refuse(city, { ...command, tileId }, 'FIXED_BUILDING', fixed);
  setYard(city);
  const cost = tileId === 'estate-1' ? 20000 : 15000;
  const max = tileId === 'estate-1' ? 3 : 2;
  const typeId = tileId === 'estate-1' ? 'mansion' : 'retainers-hall';
  for (let level = 2; level <= max; level++) {
    const before = { ...inventory(city) };
    city = success(city, { type: 'UPGRADE', tileId }).nextState;
    expect(tile(city, tileId).building).toStrictEqual({ ...hall, typeId, level });
    expect(inventory(city)).toStrictEqual({ ...before, gold: before.gold - cost });
    expect(city.society!.stocksMilli.stone).toBe(0);
  }
  refuse(city, { type: 'UPGRADE', tileId }, 'MAX_LEVEL', 'This building is at its trial maximum level.');
});

it('protects an occupied housing Hall through trusted occupancy and can replace an empty one', () => {
  const city = createSocietyState();
  const tileId = 'house-1';
  tile(city, tileId).building = { ...hall };
  const replace = { type: 'REPLACE', tileId, typeId: 'common-housing' };
  refuse(city, replace, 'HOME_OCCUPIED', 'Move all residents out before replacing this home.', new Set([tileId]));
  refuse(city, { ...replace, tileId: 'estate-2' }, 'FIXED_BUILDING', fixed, new Set(['estate-2']));
  expect(tile(success(city, replace).nextState, tileId).building).toStrictEqual({ ...hall, typeId: 'common-housing' });
});

it.each([
  ['guild', 'Guild', 'service-1', 'service-2', 'hospital', 8000],
  ['auction-house', 'Auction House', 'spec-2', 'spec-3', 'warehouse', 12000],
  ['slave-market', 'Slave Market', 'slum-1', 'slum-2', 'slave-quarters', 6000],
] as const)('caps %s at one per city across BUILD and REPLACE', (typeId, name, first, second, oldType, cost) => {
  let city = createSocietyState();
  city.society!.wallRing = 2;
  const before = { ...inventory(city) };
  city = success(city, { type: 'BUILD', tileId: first, typeId }).nextState;
  expect(inventory(city)).toStrictEqual({ ...before, gold: 45000 - cost });
  expect(tile(success(city, { type: 'REPLACE', tileId: first, typeId }).nextState, first).building).toStrictEqual({ ...hall, typeId });
  tile(city, first).building!.enabled = false;
  const message = `Only one ${name} may be built per city.`;
  refuse(city, { type: 'BUILD', tileId: second, typeId }, 'ONE_PER_CITY', message);
  tile(city, second).building = { ...hall, typeId: oldType };
  refuse(city, { type: 'REPLACE', tileId: second, typeId }, 'ONE_PER_CITY', message);
});

it('caps Retainers Hall at two with atomic refusal on BUILD and REPLACE', () => {
  let city = createSocietyState();
  city.society!.wallRing = 2;
  city = success(city, { type: 'BUILD', tileId: 'house-5', typeId: 'retainers-hall' }).nextState;
  const message = "Only two Retainers' Halls may be built per city.";
  refuse(city, { type: 'BUILD', tileId: 'house-6', typeId: 'retainers-hall' }, 'HALL_LIMIT', message);
  refuse(city, { type: 'REPLACE', tileId: 'house-1', typeId: 'retainers-hall' }, 'HALL_LIMIT', message);
  const own = success(city, { type: 'REPLACE', tileId: 'house-5', typeId: 'retainers-hall' }).nextState;
  expect(tile(own, 'house-5').building).toStrictEqual(hall);
  expect(inventory(own)).toStrictEqual({ gold: 15000, wheat: 0, food: 20000, wood: 8000, iron: 4000 });
});

it('charges exactly 15000 Gold milli for a housing Hall with an operating Builders Yard', () => {
  const city = createSocietyState();
  city.society!.wallRing = 2;
  setYard(city);
  const target = { tileId: 'house-5', typeId: 'retainers-hall' };
  const pending = success(city, { type: 'BUILD', ...target }).nextState;
  expect(inventory(pending)).toStrictEqual({ gold: 30000, wheat: 0, food: 20000, wood: 8000, iron: 4000 });
  const replaced = success(pending, { type: 'REPLACE', ...target }).nextState;
  expect(inventory(replaced)).toStrictEqual({ gold: 15000, wheat: 0, food: 20000, wood: 8000, iron: 4000 });
});

it('keeps named beds outside resident housing and funds fixed upkeep', () => {
  const city = createSocietyState();
  const open = new Set(city.tiles.map(t => t.id));
  const expectedHousing = { free: 70, makers: 25, luminaries: 18, merchants: 15, elite: 0, bound: 0 };
  expect(societyFacilities(city, open).housing).toStrictEqual(expectedHousing);
  const absent = structuredClone(city);
  for (const t of absent.tiles) if (t.id.startsWith('estate-')) t.building = null;
  expect(societyFacilities(absent, open).housing).toStrictEqual(expectedHousing);
  const withHall = structuredClone(city);
  tile(withHall, 'house-5').building = { ...hall };
  expect(societyFacilities(withHall, open).housing).toStrictEqual(expectedHousing);
  const report = success(city, { type: 'END_WEEK', expectedWeek: 1 }).report!;
  const withoutHomes = success(absent, { type: 'END_WEEK', expectedWeek: 1 }).report!;
  expect(report.upkeepPaidMilli).toBe(withoutHomes.upkeepPaidMilli);
  expect(report.householdUpkeep).toStrictEqual({ paidMilli: 3000, unpaidMilli: 0 });
  expect(withoutHomes.householdUpkeep).toBe(undefined);
  expect(withoutHomes.after.gold - report.after.gold).toBe(3000);
});

it('preserves break-even immigration after household upkeep', () => {
  const city = createSocietyState();
  const society = city.society!;
  society.classes.free = 35;
  city.world.settlements[city.world.activeSettlementId!].cohorts[0].count = 80;
  tile(city, 'spec-1').building!.enabled = false;
  tile(city, 'slum-1').building = { ...hall, typeId: 'slave-quarters' };

  const operation = resolveWorkshopOperation(city);
  const result = success(city, { type: 'END_WEEK', expectedWeek: 1 });
  const report = result.report!;
  expect(report.immigration).toStrictEqual({
    populationBefore: 80, populationAfter: 81, arrivals: 1, target: 90,
    usefulWorkerSlots: 10, renewableFoodMilli: 4000, reason: 'arrivals',
  });
  // The town collects 30 milli per resident with its goods market closed.
  expect(operation.operatingDebitMilli).toBe(2700);
  expect(report.householdUpkeep).toStrictEqual({ paidMilli: 3000, unpaidMilli: 0 });
});

it('pays city operations first and skips household upkeep without overdrawing Gold', () => {
  const city = createSocietyState();
  inventory(city).gold = 0;

  const operation = resolveWorkshopOperation(city);
  const result = success(city, { type: 'END_WEEK', expectedWeek: 1 });
  const report = result.report!;
  expect(operation.byTile['plain-1']).toStrictEqual({ operating: true });
  expect(operation.fundedTileIds.filter(id => id.startsWith('estate-'))).toStrictEqual([]);
  expect(report.upkeepPaidMilli).toBe(2000);
  expect(report.unpaidUpkeepMilli).toBe(0);
  expect(report.householdUpkeep).toStrictEqual({ paidMilli: 1000, unpaidMilli: 2000 });
  expect(report.after.gold).toBe(450);
  expect(inventory(result.nextState).gold).toBe(450);
});
