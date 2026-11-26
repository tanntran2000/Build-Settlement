import { expect, it, vi } from 'vitest';
import { createSocietyState } from '@haven/core';

const balance = vi.hoisted(() => ({ tax: 30, goodsPrice: 1000 }));
import { runTileTrialWeek } from '../tile-trial-week.js';

vi.mock('../../../core/src/trial/catalog.js', async importOriginal => {
  const actual = await importOriginal<typeof import('@haven/core')>();
  const buildings = structuredClone(actual.TRIAL_BUILDINGS);
  for (const [id, upkeepMilli] of Object.entries({ farm: 1000, processor: 500, 'town-market': 500,
    'common-housing': 0, 'makers-rowhouses': 0, 'scholars-quarters': 0, 'merchant-townhouses': 0,
    mansion: 2000, 'retainers-hall': 1000 })) buildings[id].upkeepMilli = upkeepMilli;
  return { ...actual, TILE_TRIAL_BALANCE: { ...actual.TILE_TRIAL_BALANCE, taxGoldPerResident: balance.tax },
    TRIAL_BUILDINGS: buildings, trialBuilding: (id: string) => Object.hasOwn(buildings,id) ? buildings[id] : undefined };
});

vi.mock('../../../core/src/trial/goods-stock.js', async importOriginal => {
  const actual = await importOriginal<typeof import('@haven/core')>();
  return { ...actual, GOODS_STOCK_TRIAL: { ...actual.GOODS_STOCK_TRIAL, initialGoldMilli: 120000,
    initialFoodMilli: 20000, initialGoodsMilli: 10000, goldPerGoodsMilli: balance.goodsPrice } };
});

vi.mock('../../../core/src/trial/difficulty.js', async importOriginal => {
  const actual = await importOriginal<typeof import('@haven/core')>();
  return {
    ...actual,
    difficultyProfile: (id: 'normal' | 'easy') => id === 'normal' ? actual.difficultyProfile(id) :
      { taxBps: 15000, goodsPriceBps: 15000, lawPayBps: 12500, upkeepBps: 7500 },
  };
});

function week(difficulty: 'normal' | 'easy') {
  const city = createSocietyState(difficulty);
  city.society!.laws.active = ['licensed-vice'];
  return { city, report: runTileTrialWeek(city) };
}

it('normal uses the unscaled charges and credits', () => {
  const { report } = week('normal');
  expect(report.taxMilli).toBe(3000);
  expect(report.goods.revenueMilli).toBe(1450);
  expect(report.laws!.incomeMilli).toBe(1500);
  expect(report.upkeepPaidMilli).toBe(2000);
  expect(report.householdUpkeep!.paidMilli).toBe(3000);
});

it('Easy scales each credit and scheduled upkeep while preserving Farm batch cost', () => {
  const normal = week('normal').report, easy = week('easy').report;
  expect(easy.taxMilli).toBe(Math.floor(normal.taxMilli * 15000 / 10000));
  expect(easy.goods.revenueMilli).toBe(Math.floor(normal.goods.revenueMilli * 15000 / 10000));
  expect(easy.laws!.incomeMilli).toBe(Math.floor(normal.laws!.incomeMilli * 12500 / 10000));
  expect(easy.upkeepPaidMilli).toBe(1500);
  expect(easy.householdUpkeep!.paidMilli).toBe(2250);
  expect(easy.farmBatchGoldMilli).toBe(normal.farmBatchGoldMilli);
});

it('same seed, Easy profile and commands produce the same state and week report', () => {
  expect(week('easy')).toStrictEqual(week('easy'));
});
