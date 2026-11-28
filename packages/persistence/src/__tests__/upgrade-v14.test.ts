import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, isCharacterLifeSessionState, isTileTrialPlanningState } from '@haven/core';
import { withNpcs } from '@haven/core/testing/npcs';
import * as persistence from '../index.js';

const v14 = new URL('./fixtures/society-v14/', import.meta.url);
const fixture = (name: string) => readFileSync(new URL(name, v14), 'utf8');
const lifeText = () => fixture('life-new-game.json');
const parsed = () => JSON.parse(lifeText());
const encode = (state: unknown) => JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-14', state });

it.each(readdirSync(v14).filter(name => name.startsWith('life-')))('loads %s as v15 with grace from its saved week', name => {
  const text = fixture(name), old = JSON.parse(text);
  const loaded = persistence.deserializeCharacterLifeSave(text);
  expect(loaded.success).toBe(true);
  if (!loaded.success) throw Error(loaded.error.message);
  expect(loaded.state.city.society?.rulesetId).toBe('tile-society-15');
  expect(loaded.state.player.needs.graceEndsWeek).toBe(old.state.city.world.week + 8);
  expect(isCharacterLifeSessionState(loaded.state)).toBe(true);
  expect(fixture(name)).toBe(text);
});

it('converts the city-only fixture through its city reader', () => {
  expect(persistence.upgradeV14City).toBeTypeOf('function');
  const old = JSON.parse(fixture('new-game.json')).state;
  const before = JSON.stringify(old);
  const city = persistence.upgradeV14City(old);
  expect(city?.society?.rulesetId).toBe('tile-society-15');
  expect(isTileTrialPlanningState(city)).toBe(true);
  expect(JSON.stringify(old)).toBe(before);
});

function occupiedV14(level: number, residents: number) {
  const made = createCharacterLifeSession(42, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
  if (!made.success) throw Error(made.error.message);
  made.value.city.world.week = 35;
  made.value.city.tiles.find(tile => tile.id === 'estate-2')!.building!.level = 2;
  const full = withNpcs(made.value, Array.from({ length: residents + 1 }, (_, index) => ({ week: index + 1, source: 'guild' as const, slot: 0 })));
  full.city.tiles.find(tile => tile.id === 'estate-1')!.building!.level = level;
  full.player.purse.moneyMilli = 4567;
  const old = JSON.parse(JSON.stringify(full));
  old.npcs.reverse();
  old.profiles.reverse();
  for (const [index, npc] of old.npcs.entries()) {
    npc.household.home = index === 0 ? 'estate-2' : 'estate-1';
    delete npc.household.room;
    delete npc.household.role;
    delete npc.household.training;
  }
  delete old.player.needs;
  delete old.city.society.mansion;
  old.city.society.rulesetId = 'tile-society-14';
  return old;
}

it.each([[1, 3, [3]], [3, 30, [10, 10, 4, 4, 2]]] as const)('places %i-level Mansion residents in order across %i beds', (level, residents, expected) => {
  expect(persistence.upgradeV14Session).toBeTypeOf('function');
  const source = occupiedV14(level, residents), before = JSON.stringify(source);
  const upgraded = persistence.upgradeV14Session(source, 35);
  expect(isCharacterLifeSessionState(upgraded)).toBe(true);
  if (!upgraded) throw Error('Expected upgraded checkpoint.');
  const mansion = upgraded.city.society!.mansion;
  expect(mansion.rooms.slice(2).map(room => upgraded.npcs.filter(npc => npc.household.room === room.id).length)).toEqual(expected);
  expect(mansion.rooms.slice(2).every(room => room.level === 1)).toBe(true);
  expect(upgraded.npcs[0].household.room).toBeNull();
  const ordered = upgraded.npcs.slice(1).sort((a, b) => a.character.id < b.character.id ? -1 : 1);
  expect(ordered.map(npc => npc.household.room)).toEqual(expected.flatMap((n, i) => Array(n).fill(mansion.rooms[i + 2].id)));
  expect(JSON.stringify(persistence.upgradeV14Session(source, 35))).toBe(JSON.stringify(upgraded));
  const oldFields = JSON.parse(JSON.stringify(upgraded));
  oldFields.city.society.rulesetId = 'tile-society-14';
  delete oldFields.city.society.mansion;
  delete oldFields.player.needs;
  for (const { household } of oldFields.npcs) {
    delete household.room;
    delete household.role;
    delete household.training;
  }
  expect(JSON.stringify(oldFields)).toBe(before);
  expect(JSON.stringify(source)).toBe(before);
});

it('upgrades a portable World checkpoint without extending its format', () => {
  const { city, outside } = parsed().state;
  const oldWorld = { city, outside };
  const oldText = JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-14', state: oldWorld });
  const loaded = persistence.deserializeWorldSessionSave(oldText);
  expect(loaded.success).toBe(true);
  if (!loaded.success) throw Error(loaded.error.message);
  expect(Object.keys(loaded.state)).toEqual(['city', 'outside']);
  expect(city.society.rulesetId).toBe('tile-society-14');
});

it('keeps older and failed v14 files incompatible and categorizes damage in current files', () => {
  const v13 = readFileSync(new URL('./fixtures/society-v13/life-new-game.json', import.meta.url), 'utf8');
  const badOld = parsed().state;
  badOld.player.purse.moneyMilli = -1;
  const failureCode = (text: string) => {
    const result = persistence.deserializeCharacterLifeSave(text);
    return result.success ? null : result.error.code;
  };
  for (const text of [v13, encode(badOld)]) expect(failureCode(text)).toBe('INCOMPATIBLE_SAVE');
  const current = JSON.parse(readFileSync(new URL('./fixtures/society-v15/life-new-game.json', import.meta.url), 'utf8'));
  current.state.city.society.rulesetId = 'tile-society-14';
  expect(failureCode(JSON.stringify(current))).toBe('INVALID_SAVE_STATE');
  delete current.state;
  expect(failureCode(JSON.stringify(current))).toBe('INVALID_SAVE_STATE');
});

it('rejects an inline v14 IndexedDB item collection even if it is empty', () => {
  const state = parsed().state;
  const rows = persistence.sessionToRecords('main', state).filter(row => row.table !== 'items');
  const city = rows.find(row => row.table === 'city')!.value as typeof state.city;
  city.society.items = structuredClone(state.city.society.items);
  const before = structuredClone(rows);
  let error: unknown;
  try { persistence.recordsToSession(rows); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(persistence.StoreRecordError);
  expect((error as persistence.StoreRecordError).ref).toBe('city:city');
  expect(rows).toEqual(before);
});
