import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '../session.js';
import { isCharacterLifeSessionState } from '../validate.js';

function create(difficulty?: 'normal' | 'easy') {
  const made = createCharacterLifeSession(2026, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, difficulty);
  if (!made.success) throw Error(made.error.message);
  return made.value;
}

it('persists the starting difficulty and initializes the Player purse', () => {
  expect(create().city.society!.difficulty).toBe('normal');
  const state = create('easy');
  expect(state.city.society!.difficulty).toBe('easy');
  expect(state.player.purse).toStrictEqual({ moneyMilli: 0, levyPercent: 0, donatedThisWeekMilli: 0, robbery: null });
});

it.each([['moneyMilli', -1], ['levyPercent', 21], ['donatedThisWeekMilli', 1.5]] as const)(
  'refuses invalid purse %s = %s', (key, value) => {
    const state = create();
    state.player.purse[key] = value;
    expect(isCharacterLifeSessionState(state)).toBe(false);
  },
);

it('accepts a fully backed robbery card and refuses one milli more than Money', () => {
  const state = create();
  state.player.purse.moneyMilli = 4000;
  state.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
  expect(isCharacterLifeSessionState(state)).toBe(true);
  state.player.purse.robbery.excessMilli = 4001;
  expect(isCharacterLifeSessionState(state)).toBe(false);
});
