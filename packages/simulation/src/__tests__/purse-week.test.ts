import { describe, expect, it } from 'vitest';
import {
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, levySatisfactionCost, type DifficultyId,
} from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { runLevyWeek } from '../purse-week.js';

function make(difficulty: DifficultyId = 'normal') {
  const result = createCharacterLifeSession(2026, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Keeper' }, difficulty);
  if (!result.success) throw Error(result.error.message);
  return result.value;
}
function start(difficulty: DifficultyId = 'normal', percent = 0) {
  const s = make(difficulty);
  const command = executeCharacterLifeCommand(s, { type: 'SET_LEVY', percent, expectedRevision: s.city.revision });
  if (!command.success) throw Error(command.error.message);
  command.next.city.tiles.find(tile => tile.id === 'spec-1')!.building!.enabled = false;
  return command.next;
}
const stock = (s: ReturnType<typeof make>) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
function close(s: ReturnType<typeof make>) {
  const r = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedWeek: s.city.world.week, expectedRevision: s.city.revision });
  if (!r.success || !r.report) throw Error('Expected End Week report');
  return { ...r, report: r.report };
}

describe('weekly levy', () => {
  it.each([['normal', 1200], ['easy', 2400]] as const)('credits %s Money on a 24 Gold gross week and charges 1.2 Gold', (difficulty, money) => {
    const s = start(difficulty, 5), r = close(s);
    const base = close(start(difficulty));
    expect(r.report.taxMilli + r.report.goods.revenueMilli + r.report.laws!.incomeMilli).toBe(24000);
    expect(r.report.purse).toEqual({ levyPercent: 5, levyDueMilli: 1200, levyPaidMilli: 1200, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: money });
    expect(stock(r.next).gold).toBe(stock(base.next).gold - 1200);
    expect(r.report.after.gold).toBe(stock(r.next).gold);
    expect(r.next.player.purse.moneyMilli).toBe(money);
    expect(close(structuredClone(s))).toEqual(r);
  });

  it.each([['normal', 400], ['easy', 800]] as const)('caps the Gold charge at 0.4 in %s and reports a 0.8 shortfall', (difficulty, money) => {
    const s = start(difficulty, 5);
    stock(s).gold = 400;
    const report = runLevyWeek(s, 24000);
    expect(report.levyDueMilli - report.levyPaidMilli).toBe(800);
    expect(report.levyPaidMilli).toBe(400);
    expect(stock(s).gold).toBe(0);
    expect(s.player.purse.moneyMilli).toBe(money);
  });

  it('floors gross levy before scaling Money', () => {
    const s = start('easy', 5);
    expect(runLevyWeek(s, 24019)).toMatchObject({ levyDueMilli: 1200, levyPaidMilli: 1200, moneyAfterMilli: 2400 });
  });

  it.each([[0, 0], [1, 0], [2, 0], [3, 1], [5, 3], [10, 9], [20, 21]])(
    'applies the levy at percent %i penalty to citizens before the Happiness report', (percent, penalty) => {
    expect(levySatisfactionCost(percent)).toBe(penalty);
    const base = close(start()), r = close(start('normal', percent));
    const scores = r.next.city.society!.satisfaction;
    const baseline = base.next.city.society!.satisfaction;
    for (const group of ['free', 'makers', 'luminaries', 'merchants'] as const) {
      expect(scores[group]).toBe(baseline[group] - penalty);
      expect(r.report.society!.classes[group].satisfactionAfter).toBe(scores[group]);
    }
    expect(scores.bound).toBe(baseline.bound);
    expect(r.report.happinessAfter).toBe(r.next.city.happiness);
    expect(r.report.happinessAfter).toBe(Number((base.report.happinessAfter - penalty).toFixed(2)));
  });

  it('keeps the purse with the Player when the active pointer moves to a new city', () => {
    const s = start('normal', 5), world = s.city.world;
    const previous = world.settlements[world.activeSettlementId!];
    s.player.purse.moneyMilli = 9000;
    world.settlements.alternate = { ...structuredClone(previous), id: 'alternate' };
    previous.status = 'legacy';
    world.activeSettlementId = 'alternate';
    const r = close(s);
    expect(r.next.player.purse.moneyMilli).toBe(10200);
    expect(r.next.city.world.settlements[previous.id]).toEqual(previous);
    expect(Object.hasOwn(r.next.city.world.settlements[previous.id], 'purse')).toBe(false);
    expect(r.next.city.world.activeSettlementId).toBe('alternate');
  });
});
