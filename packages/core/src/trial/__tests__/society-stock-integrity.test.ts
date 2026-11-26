import { expect, it } from 'vitest';
import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
import {
  createCharacterLifeSession, createSocietyState, DEFAULT_PLAYER_DRAFT, GOODS_STOCK_RULESET,
  isCharacterLifeSessionState, isLiveCharacterLifeSessionState, isTileTrialPlanningState,
  isTileTrialState, managerSlotTileIds,
} from '../../index.js';

it.each(['goodsStock getter', 'amountMilli getter', 'hidden amountMilli', 'extra Goods field', 'extra root rulesetId'])(
  'rejects retained Goods descriptors and extra keys without invoking code: %s', kind => {
    let reads = 0;
    const state = createSocietyState();
    if (kind === 'goodsStock getter') Object.defineProperty(state, 'goodsStock', { enumerable: true, get() { reads++; return {}; } });
    if (kind === 'amountMilli getter') Object.defineProperty(state.goodsStock!, 'amountMilli', { enumerable: true, get() { reads++; return 0; } });
    if (kind === 'hidden amountMilli') Object.defineProperty(state.goodsStock!, 'amountMilli', { value: 0, enumerable: false });
    if (kind === 'extra Goods field') Object.assign(state.goodsStock!, { surprise: true });
    if (kind === 'extra root rulesetId') Object.assign(state, { rulesetId: GOODS_STOCK_RULESET });
    expect(isTileTrialState(state)).toBe(false);
    expect(isTileTrialPlanningState(state)).toBe(false);
    expect(reads).toBe(0);
  },
);

it('keeps the retained starting stocks while the Market is inside', () => {
  const state = createSocietyState();
  expect(state.world.settlements[state.world.activeSettlementId!].inventory)
    .toMatchObject({ food: 40000, gold: 120000, wood: 8000, iron: 4000, wheat: 0 });
  expect(state).toHaveProperty('goodsStock', { rulesetId: GOODS_STOCK_RULESET, amountMilli: 30000 });
  expect(state.tiles.find(t => t.id === 'spec-1')!.building)
    .toEqual({ typeId: 'town-market', level: 1, workers: 0, enabled: true });
});

it('accepts only the retained Goods marker and safe stock amounts in both validators', () => {
  for (const amountMilli of [0, 10000, Number.MAX_SAFE_INTEGER]) {
    const state = createSocietyState(); state.goodsStock!.amountMilli = amountMilli;
    expect(isTileTrialState(state)).toBe(true);
    expect(isTileTrialPlanningState(state)).toBe(true);
  }
  const invalid: unknown[] = [
    { rulesetId: 'unknown', amountMilli: 0 },
    { rulesetId: GOODS_STOCK_RULESET, amountMilli: 0, extra: 1 },
    undefined,
    ...[-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(amountMilli => ({ rulesetId: GOODS_STOCK_RULESET, amountMilli })),
  ];
  for (const goodsStock of invalid) {
    const state = { ...createSocietyState(), goodsStock };
    expect(isTileTrialState(state)).toBe(false);
    expect(isTileTrialPlanningState(state)).toBe(false);
  }
});

it.each([0, 20261028, 4294967295])('preserves seeded outside, NPC and Player data in detached society sessions: %s', seed => {
  const draft = { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' };
  const a = createCharacterLifeSession(seed, draft), b = createCharacterLifeSession(seed, draft);
  expect(a.success && b.success).toBe(true);
  if (!a.success || !b.success) throw Error('Factory failed');
  const first = withNpcs(a.value, NPC_TEST_KEYS), second = withNpcs(b.value, NPC_TEST_KEYS);
  expect({ ...second, city: first.city }).toEqual(first);
  expect(isCharacterLifeSessionState(second)).toBe(true);
  expect(isLiveCharacterLifeSessionState(second)).toBe(true);
  expect(managerSlotTileIds(first.city)).toEqual(['field-1', 'plain-1', 'spec-1']);
  expect(managerSlotTileIds(second.city)).toEqual(['field-1', 'plain-1', 'spec-1']);
  const before = structuredClone(first);
  second.city.goodsStock!.amountMilli = 0;
  second.outside.tiles[0].knownBy.length = 0;
  second.npcs[0].character.name = 'Changed';
  second.player.character.name = 'Changed';
  expect(first).toEqual(before);
});
