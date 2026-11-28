import {
  applyDifficulty, difficultyProfile, donationGoldMilli, levyDueMilli, homeRobberyChanceBps, homeRobberyRoll, safeAmountMilli,
  type CharacterLifeSessionState, type HomeRobberyReport, type MansionPurseTerms, type PurseWeekReport,
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

export function runHomeRobberyCheck(session: CharacterLifeSessionState, week: number, mansion?: MansionPurseTerms): Readonly<HomeRobberyReport> | undefined {
  const { world, society } = session.city;
  const purse = session.player.purse;
  if (society!.crisis.stage === 'fallen') return;
  const excessMilli = purse.moneyMilli - safeAmountMilli(society!.order.security, society!.difficulty, mansion);
  if (excessMilli <= 0) return;
  const chanceBps = homeRobberyChanceBps(excessMilli, mansion);
  if (chanceBps === 0 || homeRobberyRoll(world.worldMetadata.worldSeed, week, 'home-robbery') >= chanceBps) return;
  purse.robbery = { id: 'home-robbery-w' + week, week, excessMilli };
  return Object.freeze({ outcome: 'pending', excessMilli });
}
