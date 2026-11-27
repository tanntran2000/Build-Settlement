import {
  applyDifficulty, difficultyProfile, donationGoldMilli, levyDueMilli, type CharacterLifeSessionState, type PurseWeekReport,
} from '@haven/core';
import { trialSafe } from './workshop-operation.js';

export function runLevyWeek(session: CharacterLifeSessionState, grossIncomeMilli: number): Readonly<PurseWeekReport> {
  const purse = session.player.purse;
  const { world, society } = session.city;
  const stock = world.settlements[world.activeSettlementId!].inventory;
  const due = purse.levyPercent === 0 ? 0 : levyDueMilli(trialSafe(grossIncomeMilli), purse.levyPercent);
  const paid = Math.min(stock.gold, due);
  const money = applyDifficulty(paid, difficultyProfile(society!.difficulty).levyMoneyBps);
  const moneyAfterMilli = trialSafe(purse.moneyMilli + money);
  stock.gold -= paid;
  purse.moneyMilli = moneyAfterMilli;
  return Object.freeze({
    levyPercent: purse.levyPercent, levyDueMilli: due, levyPaidMilli: paid,
    donationsMilli: purse.donatedThisWeekMilli,
    donationGoldMilli: donationGoldMilli(purse.donatedThisWeekMilli, society!.difficulty), moneyAfterMilli,
  });
}
