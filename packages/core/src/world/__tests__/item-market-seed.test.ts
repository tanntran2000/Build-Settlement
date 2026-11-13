import { expect, it } from 'vitest';
import { createCharacterLifeSession, createWorldSession, DEFAULT_PLAYER_DRAFT } from '../../index.js';

function world(seed: number) {
  const result = createWorldSession(seed);
  if (!result.success) throw Error(result.error.message);
  return result.value;
}

function newGame(seed: number) {
  const result = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!result.success) throw Error(result.error.message);
  return result.value;
}

it('draws different week-1 Markets for different world-session seeds', () => {
  expect(world(0).city.society!.items.market).not.toEqual(world(42).city.society!.items.market);
});

it('draws different week-1 Markets through the real New Game path', () => {
  expect(newGame(0).city.society!.items.market).not.toEqual(newGame(42).city.society!.items.market);
});

it.each([0, 42])('repeats the week-1 Market for the same New Game seed %s', seed => {
  expect(newGame(seed).city.society!.items.market).toEqual(newGame(seed).city.society!.items.market);
  expect(newGame(seed).city.society!.items.market).toEqual(world(seed).city.society!.items.market);
});
