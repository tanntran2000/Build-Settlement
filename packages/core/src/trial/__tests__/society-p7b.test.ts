import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import * as core from '../../index.js';
import { validateBuildings, validateTuning } from '../../data/validate.js';
import buildings from '../../data/buildings.json' with { type: 'json' };
import tuning from '../../data/tuning.json' with { type: 'json' };
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';

const hall = { typeId: 'retainers-hall', level: 1, workers: 0, enabled: true };
const plots = [
  ['housing', ['house-12', 'house-13', 'house-14']],
  ['service', ['service-7', 'service-8']],
  ['specialist', ['spec-11', 'spec-12']],
  ['slum', ['slum-7', 'slum-8', 'slum-9']],
] as const;
const oldSave = (version: number) => new URL(`../../../../persistence/src/__tests__/fixtures/society-v${version}/life-new-game.json`, import.meta.url);

it('starts with both fixed level-one estates and 43 town plots', () => {
  const city = core.createSocietyState();
  expect(city.tiles).toHaveLength(75);
  expect(city.tiles.filter(t => t.terrain !== 'town')).toHaveLength(30);
  expect(city.tiles.filter(t => core.societyPlot(t.id)?.tier !== 'estate' && t.terrain === 'town')).toHaveLength(43);
  expect(city.tiles.slice(-2)).toStrictEqual([
    { id: 'estate-1', terrain: 'town', building: { ...hall, typeId: 'mansion' } },
    { id: 'estate-2', terrain: 'town', building: hall },
  ]);
  for (const id of ['estate-1', 'estate-2']) expect(core.societyPlot(id)).toStrictEqual({ tier: 'estate', ring: 1 });
  for (const [tier, ids] of plots) for (const id of ids) {
    expect(core.societyPlot(id)).toStrictEqual({ tier, ring: 4 });
    expect(city.tiles.find(t => t.id === id)).toStrictEqual({ id, terrain: 'town', building: null });
  }
  expect(city.society!.wallRing).toBe(1);
  expect(city.world.settlements[city.world.activeSettlementId!].inventory.gold).toBe(120000);
});

it('reads NPC beds by type and level and pins the five catalog rows', () => {
  const lookup = (core as typeof core & { npcBeds?: (id: string, level: number) => number }).npcBeds;
  expect(typeof lookup).toBe('function');
  if (!lookup) throw Error('NPC bed lookup is missing');
  expect([1, 2, 3].map(level => lookup('mansion', level))).toStrictEqual([10, 20, 30]);
  expect([1, 2].map(level => lookup('retainers-hall', level))).toStrictEqual([25, 50]);
  expect([lookup('guild', 1), lookup('toString', 1), lookup('mansion', 0), lookup('mansion', 4), lookup('mansion', 1.5)]).toStrictEqual([0, 0, 0, 0, 0]);
  const rows = [
    ['mansion', 'Mansion', 'estate', 3, 20000, 2000, [10, 20, 30]],
    ['retainers-hall', "Retainers' Hall", 'estate', 2, 15000, 1000, [25, 50]],
    ['guild', 'Guild', 'service', 1, 8000, 1000, null],
    ['auction-house', 'Auction House', 'specialist', 1, 12000, 1000, null],
    ['slave-market', 'Slave Market', 'slum', 1, 6000, 1000, null],
  ] as const;
  for (const [id, name, tier, maxLevel, gold, upkeepMilli, npcBeds] of rows) {
    expect(core.TRIAL_BUILDINGS[id]).toStrictEqual({
      name, operation: 'society', terrain: ['town'], maxLevel, maxWorkers: 0, cost: { gold, wood: 0, iron: 0 }, upkeepMilli,
    });
    expect(core.SOCIETY_BUILDINGS[id]).toStrictEqual({
      tier, ...(id === 'retainers-hall' ? { alsoTier: 'housing' } : {}), staff: null, reserved: false, ...(npcBeds ? { npcBeds } : {}),
    });
  }
});

it.each([
  ['mansion', [10, 20], 'buildings.json#mansion.npcBeds: expected array of length 3'],
  ['mansion', [10, 10, 30], 'buildings.json#mansion.npcBeds.1: expected greater than previous level'],
  ['retainers-hall', [25, -1], 'buildings.json#retainers-hall.npcBeds.1: expected integer > 0'],
] as const)('rejects a malformed %s NPC bed table %j', (id, npcBeds, message) => {
  const bad = structuredClone(buildings) as { society: Record<string, object> };
  bad.society[id] = { ...bad.society[id], npcBeds };
  let failure: unknown;
  try { validateBuildings(bad); } catch (error) { failure = error; }
  expect(failure instanceof Error ? failure.message : null).toBe(message);
});

it("rejects missing and non-integer Retainers' Hall caps", () => {
  const failures = [{}, { maxPerCity: 1.5 }].map(RETAINERS_HALL_TRIAL => {
    try {
      validateTuning({ ...tuning, RETAINERS_HALL_TRIAL });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : null;
    }
  });
  const message = 'tuning.json#RETAINERS_HALL_TRIAL.maxPerCity: expected integer > 0';
  expect(failures).toStrictEqual([message, message]);
});

it.each([10, 11])('uses the v14 ruleset and refuses the v%i checkpoint unchanged', version => {
  const fresh = core.createCharacterLifeSession(42, { ...core.DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
  if (!fresh.success) throw Error(fresh.error.message);
  const before = structuredClone(fresh.value);
  const encoded = serializeCharacterLifeSave(fresh.value);
  if (!encoded.success) throw Error(encoded.error.message);
  const envelope = JSON.parse(encoded.text);
  expect([envelope.cityRulesetId, envelope.state.city.society.rulesetId]).toStrictEqual(['tile-society-14', 'tile-society-14']);
  const source = readFileSync(oldSave(version), 'utf8');
  expect(deserializeCharacterLifeSave(source)).toStrictEqual({
    success: false, error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' },
  });
  expect(readFileSync(oldSave(version), 'utf8')).toBe(source);
  expect(fresh.value).toStrictEqual(before);
  expect(serializeCharacterLifeSave(fresh.value)).toStrictEqual(encoded);
});

it.each(['empty', 'swapped', 'paused', 'staffed', 'duplicate acquisition', 'third Hall'])('rejects a v14 planning save with %s', problem => {
  const city = core.createSocietyState();
  const mansion = city.tiles.find(t => t.id === 'estate-1');
  const estateHall = city.tiles.find(t => t.id === 'estate-2');
  expect([mansion?.id, estateHall?.id]).toStrictEqual(['estate-1', 'estate-2']);
  if (!mansion?.building || !estateHall?.building) throw Error('Fixed homes are missing');
  const hallBuilding = estateHall.building;
  if (problem === 'empty') mansion.building = null;
  if (problem === 'swapped') [mansion.building, estateHall.building] = [estateHall.building, mansion.building];
  if (problem === 'paused') hallBuilding.enabled = false;
  if (problem === 'staffed') hallBuilding.workers = 1;
  if (problem === 'duplicate acquisition') {
    for (const id of ['service-1', 'service-2']) city.tiles.find(t => t.id === id)!.building = { ...hall, typeId: 'guild' };
  }
  if (problem === 'third Hall') {
    for (const id of ['house-1', 'house-2']) city.tiles.find(t => t.id === id)!.building = { ...hall };
  }
  expect(core.isTileTrialPlanningState(city)).toBe(false);
});
