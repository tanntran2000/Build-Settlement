import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createCharacterLifeSession, createNpcWorldSession, DEFAULT_PLAYER_DRAFT, generateNpc,
  homeBeds, homeResidents, isCharacterLifeSessionState, isLiveCharacterLifeSessionState,
  NPC_GENERATOR_CATALOG, P7A_TRIAL, validateNpcGenerator,
  type AcquisitionSource, type CharacterLifeSessionState, type NpcHousehold, type WorldNpc,
} from '@haven/core';
import { deserializeCharacterLifeSave, recordsToSession, serializeCharacterLifeSave, sessionToRecords } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';

type Resident = WorldNpc & { household: NpcHousehold };
type Populated = Omit<CharacterLifeSessionState, 'npcs'> & { npcs: Resident[] };
type Key = { week: number; source: AcquisitionSource; slot: number | 'lot' };

const npcId = 'npc_w1_guild_0';
const oldSave = new URL('../../../persistence/src/__tests__/fixtures/society-v11/life-new-game.json', import.meta.url);
const incompatible = {
  success: false,
  error: { code: 'INCOMPATIBLE_SAVE', message: 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.' },
};
const building = (typeId: string, level: number) => ({ typeId, level, enabled: true, workers: 0 });

function newGame(seed = 2026) {
  const result = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
  if (!result.success) throw Error(result.error.message);
  return result.value;
}

function weekKeys(week: number): Key[] {
  const sources = ['guild', 'auction-house', 'slave-market'] as const;
  return [
    ...sources.flatMap(source => [0, 1, 2, 3].map(slot => ({ week, source, slot }))),
    { week, source: 'auction-house', slot: 'lot' },
    { week, source: 'slave-market', slot: 'lot' },
  ];
}

function populate(homes: readonly string[], maxBeds = false): Populated {
  const start = newGame();
  const session: Populated = { ...start, npcs: [], profiles: [] };
  session.city.society!.wallRing = 2;
  session.city.world.week = 8;
  for (const [id, contents] of [
    ['estate-1', building('mansion', maxBeds ? 3 : 1)],
    ['estate-2', building('retainers-hall', maxBeds ? 2 : 1)],
    ['house-5', building('retainers-hall', maxBeds ? 2 : 1)],
  ] as const) session.city.tiles.find(tile => tile.id === id)!.building = contents;
  const keys = [1, 2, 3, 4, 5, 6, 7, 8].flatMap(weekKeys);
  const names = new Set<string>();
  for (const [index, home] of homes.entries()) {
    const key = keys[index];
    let salt = 0;
    let draw = generateNpc(session.city.world.worldMetadata.worldSeed, key.week, key.source, key.slot, salt);
    while (names.has(draw.npc.character.name)) {
      salt += 1;
      draw = generateNpc(session.city.world.worldMetadata.worldSeed, key.week, key.source, key.slot, salt);
    }
    names.add(draw.npc.character.name);
    draw.npc.household.home = home;
    session.npcs.push(draw.npc);
    session.profiles.push(draw.profile);
  }
  return session;
}

function command(session: CharacterLifeSessionState, type: string, fields = {}) {
  return executeCharacterLifeCommand(session, { type, expectedRevision: session.city.revision, ...fields });
}

function success(session: CharacterLifeSessionState, type: string, fields = {}) {
  const result = command(session, type, fields);
  expect(result.success).toBe(true);
  if (!result.success) throw Error(result.error.message);
  expect(result.next.city.revision).toBe(session.city.revision + 1);
  return result.next;
}

function failure(session: CharacterLifeSessionState, type: string, fields: object, code: string, message?: string) {
  const original = structuredClone(session);
  const result = command(session, type, fields);
  expect(result.success).toBe(false);
  if (result.success) throw Error('Expected command refusal.');
  expect(result.error.code).toBe(code);
  if (message !== undefined) expect(result.error.message).toBe(message);
  expect(session).toStrictEqual(original);
}

function roundTrip(session: CharacterLifeSessionState) {
  const saved = serializeCharacterLifeSave(session);
  expect(saved.success).toBe(true);
  if (!saved.success) throw Error(saved.error.message);
  const loaded = deserializeCharacterLifeSave(saved.text);
  expect(loaded.success).toBe(true);
  if (!loaded.success) throw Error(loaded.error.message);
  expect(loaded.state).toStrictEqual(session);
  expect(serializeCharacterLifeSave(loaded.state)).toStrictEqual(saved);
  return { state: loaded.state, text: saved.text };
}

describe('NPC homes and v12 saves', () => {
  it('starts New Game with no NPCs or profiles, 120 Gold, and both fixed L1 homes', () => {
    const session = newGame();
    const world = createNpcWorldSession(2026);
    if (!world.success) throw Error(world.error.message);
    const gold = session.city.world.settlements.settlement_haven_01.inventory.gold;
    expect([world.value.npcs, session.npcs, session.profiles, gold]).toStrictEqual([[], [], [], 120000]);
    expect(session.player.character.name).toBe('Synthetic Keeper');
    for (const [tile, expected] of [['estate-1', building('mansion', 1)], ['estate-2', building('retainers-hall', 1)]] as const) {
      expect(session.city.tiles.find(row => row.id === tile)?.building).toStrictEqual(expected);
    }
    expect([homeBeds(session.city, 'estate-1'), homeBeds(session.city, 'estate-2')]).toStrictEqual([10, 25]);
    const loaded = roundTrip(session);
    expect([JSON.parse(loaded.text).cityRulesetId, loaded.state.city.society!.rulesetId]).toStrictEqual(['tile-society-13', 'tile-society-13']);
  });

  it('rejects 45000 in generator data once the live tuning is 120000', () => {
    const data = { ...NPC_GENERATOR_CATALOG, P7B_TRIAL: { ...NPC_GENERATOR_CATALOG.P7B_TRIAL, startGoldMilli: 45000 } };
    let error: unknown;
    try { validateNpcGenerator(data); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).name).toBe('CatalogError');
    expect((error as Error).message).toBe('npc-generator.json#P7B_TRIAL.startGoldMilli: expected 120000');
  });

  it('accepts 100 residents and refuses 31 in the Mansion or 101 in legal homes', () => {
    const homes = (estate1: number, estate2: number, hall: number) =>
      [...Array<string>(estate1).fill('estate-1'), ...Array<string>(estate2).fill('estate-2'), ...Array<string>(hall).fill('house-5')];
    const valid = populate(homes(30, 50, 20), true);
    expect(['estate-1', 'estate-2', 'house-5'].map(id => homeBeds(valid.city, id))).toStrictEqual([30, 50, 50]);
    expect(['estate-1', 'estate-2', 'house-5'].map(id => homeResidents(valid.npcs, id))).toStrictEqual([30, 50, 20]);
    expect([isCharacterLifeSessionState(valid), isLiveCharacterLifeSessionState(valid)]).toStrictEqual([true, true]);
    for (const invalid of [populate(homes(31, 49, 20), true), populate(homes(30, 50, 21), true)]) {
      const before = structuredClone(invalid);
      expect([isCharacterLifeSessionState(invalid), isLiveCharacterLifeSessionState(invalid)]).toStrictEqual([false, false]);
      expect(invalid).toStrictEqual(before);
    }
  });

  it('rejects household mutations while preserving an otherwise valid roster', () => {
    const valid = populate(['estate-2', 'estate-2']);
    expect(isCharacterLifeSessionState(valid)).toBe(true);
    for (const mutate of [
      (session: Populated) => { session.npcs[0].household.home = 'field-1'; },
      (session: Populated) => { session.npcs[1].character.name = session.npcs[0].character.name; },
      (session: Populated) => { session.npcs[0].character.legalStatus = 'citizen'; },
      (session: Populated) => { session.npcs[0].household.obedience = -1; },
      (session: Populated) => { session.npcs[0].household.home = 'estate-1'; session.npcs[0].postTileId = 'field-1'; },
    ]) {
      const session = structuredClone(valid);
      mutate(session);
      expect([isCharacterLifeSessionState(session), isLiveCharacterLifeSessionState(session)]).toStrictEqual([false, false]);
    }
  });

  it('rejects a v12 checkpoint with fractional NPC affection', () => {
    const { text } = roundTrip(populate(['estate-2']));
    const checkpoint = JSON.parse(text) as { state: CharacterLifeSessionState };
    checkpoint.state.npcs[0].character.relationshipToPlayer.affection = 20.5;
    expect(deserializeCharacterLifeSave(JSON.stringify(checkpoint))).toStrictEqual({
      success: false,
      error: { code: 'INVALID_SAVE_STATE', message: 'Checkpoint must contain a valid complete Character Life session in Planning.' },
    });
    expect([isCharacterLifeSessionState(checkpoint.state), isLiveCharacterLifeSessionState(checkpoint.state)]).toStrictEqual([false, false]);
  });

  it('keeps Hall posts through a move and reload, and clears the post on entering the Mansion', () => {
    const view = (session: CharacterLifeSessionState) => session.npcs[0] as Resident;
    const setup = populate(['estate-2']);
    expect(view(setup).character.id).toBe(npcId);
    const posted = success(setup, 'ASSIGN_NPC', { npcId, tileId: 'field-1' });
    const hall = success(posted, 'MOVE_NPC_HOME', { npcId, homeTileId: 'house-5' });
    expect([view(hall).household.home, view(hall).postTileId]).toStrictEqual(['house-5', 'field-1']);
    expect([view(posted).household.home, view(posted).postTileId]).toStrictEqual(['estate-2', 'field-1']);
    expect(roundTrip(hall).state.npcs[0].postTileId).toBe('field-1');
    const mansion = success(hall, 'MOVE_NPC_HOME', { npcId, homeTileId: 'estate-1' });
    expect([view(mansion).household.home, view(mansion).postTileId]).toStrictEqual(['estate-1', null]);
    expect(mansion.profiles).toStrictEqual(hall.profiles);
    expect(mansion.city.society!.items).toStrictEqual(hall.city.society!.items);
    expect(mansion.city.world.settlements).toStrictEqual(hall.city.world.settlements);
    failure(mansion, 'ASSIGN_NPC', { npcId, tileId: 'field-1' }, 'NOT_IN_HALL', "Only Retainers' Hall residents can hold a city post.");
  });

  it('refuses full or wrong homes, stale revisions and moves in Report', () => {
    const session = populate(['estate-2', ...Array<string>(10).fill('estate-1')]);
    expect(isCharacterLifeSessionState(session)).toBe(true);
    failure(session, 'MOVE_NPC_HOME', { npcId, homeTileId: 'estate-1' }, 'NO_BED', 'That home has no free bed.');
    failure(session, 'MOVE_NPC_HOME', { npcId, homeTileId: 'field-1' }, 'NOT_A_HOME', "Select the Mansion or a Retainers' Hall.");
    failure(session, 'MOVE_NPC_HOME', { npcId, homeTileId: 'house-5', expectedRevision: session.city.revision + 1 }, 'STALE_COMMAND');
    const reported = success(session, 'END_WEEK', { expectedWeek: session.city.world.week });
    failure(reported, 'MOVE_NPC_HOME', { npcId, homeTileId: 'house-5' }, 'FORBIDDEN');
  });

  it('protects fixed estates and occupied second Halls until residents move', () => {
    const occupied = populate(['house-5']);
    for (const tileId of ['estate-1', 'estate-2']) failure(occupied, 'REPLACE', { tileId, typeId: 'common-housing' }, 'FIXED_BUILDING');
    failure(occupied, 'REPLACE', { tileId: 'house-5', typeId: 'common-housing' }, 'HOME_OCCUPIED', 'Move all residents out before replacing this home.');
    const vacated = success(occupied, 'MOVE_NPC_HOME', { npcId, homeTileId: 'estate-2' });
    const replaced = success(vacated, 'REPLACE', { tileId: 'house-5', typeId: 'common-housing' });
    expect(replaced.city.tiles.find(tile => tile.id === 'house-5')!.building?.typeId).toBe('common-housing');
  });

  it('refuses the v11 portable checkpoint without mutating its bytes or the current state', () => {
    const bytes = readFileSync(oldSave);
    const before = Buffer.from(bytes);
    const session = newGame();
    const current = structuredClone(session);
    expect(deserializeCharacterLifeSave(bytes.toString('utf-8'))).toStrictEqual(incompatible);
    expect(bytes).toStrictEqual(before);
    expect(session).toStrictEqual(current);
    expect(deserializeCharacterLifeSave('{')).toStrictEqual({
      success: false,
      error: { code: 'INVALID_SAVE', message: 'Could not read a valid checkpoint JSON. Your game was preserved.' },
    });
  });

  it('round trips a 100-NPC full-history save byte for byte under 1 MiB', () => {
    const session = populate([...Array<string>(30).fill('estate-1'), ...Array<string>(50).fill('estate-2'), ...Array<string>(20).fill('house-5')], true);
    for (const npc of session.npcs) {
      for (const key of Object.keys(npc.life.history.counters)) npc.life.history.counters[key] = 1000;
      npc.life.history.recent = Array.from({ length: P7A_TRIAL.recentCap }, (_, index) => ({
        week: 1 + index % session.city.world.week, kind: 'post-cleared',
      }));
    }
    const { state, text } = roundTrip(session);
    expect(state.npcs).toHaveLength(100);
    expect(state.npcs.every(npc => npc.life.history.recent.length === P7A_TRIAL.recentCap)).toBe(true);
    expect(recordsToSession(sessionToRecords('hundred', state))).toStrictEqual(state);
    expect(Buffer.byteLength(text, 'utf8')).toBeLessThanOrEqual(1048576);
  });
});
