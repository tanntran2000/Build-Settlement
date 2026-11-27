import { canSpendMoney, donationGoldMilli, levySatisfactionCost, PURSE_TRIAL, homeRobberyLossMilli, safeAmountMilli, type DifficultyId, type HomeRobberyOption, type PlayerCharacter } from '@haven/core';
import { formatMilli } from './milli-format.js';

export function parseDonationMilli(text: string): number | null {
  if (!/^[0-9]+$/.test(text)) return null;
  const amountMilli = Number(text) * 1000;
  return Number.isSafeInteger(amountMilli) && amountMilli > 0 ? amountMilli : null;
}

export function purseControls(purse: PlayerCharacter['purse'], input: string, locked: boolean, difficulty: DifficultyId) {
  const amountMilli = parseDonationMilli(input);
  const lockReason = locked ? 'Plan next week before changing the purse.' : '';
  const levyCost = levySatisfactionCost(purse.levyPercent);
  const donatedGoldMilli = donationGoldMilli(purse.donatedThisWeekMilli, difficulty);
  const happinessCost = levySatisfactionCost(purse.levyPercent, donatedGoldMilli);
  return {
    amountMilli,
    goldMilli: amountMilli === null ? null : donationGoldMilli(amountMilli, difficulty),
    happinessCost,
    levyCost,
    donationOffset: levyCost - happinessCost,
    decreaseReason: lockReason || (purse.levyPercent === 0 ? 'Weekly levy is at its minimum.' : ''),
    increaseReason: lockReason || (purse.levyPercent === PURSE_TRIAL.levyMaxPercent ? 'Weekly levy is at its maximum.' : ''),
    donateReason: lockReason || (amountMilli === null ? 'Enter a positive whole amount.' :
      canSpendMoney(purse, amountMilli) ? '' : (heldMoneyNotice(purse) || 'Not enough Money.')),
  };
}

export function heldMoneyNotice(purse: PlayerCharacter['purse']): string {
  const held = purse.robbery?.excessMilli ?? 0;
  return held > 0 ? formatMilli(held) + ' Money is held until the robbery is answered.' : '';
}

export function purseRisk(moneyMilli: number, security: number, difficulty: DifficultyId) {
  const safeMilli = safeAmountMilli(security, difficulty);
  return { safeMilli, atRiskMilli: Math.max(0, moneyMilli - safeMilli) };
}

export function homeRobberyOptions(purse: PlayerCharacter['purse'], security: number, locked: boolean) {
  const excess = purse.robbery?.excessMilli ?? 0;
  const pay = homeRobberyLossMilli(excess, 'pay');
  const loss = homeRobberyLossMilli(excess, 'let-go');
  const reportReason = locked ? 'Choose Plan next week to answer.' : '';
  const chaseReason = reportReason || (security < PURSE_TRIAL.robberyChaseSecurityMin
    ? 'Needs Security ' + PURSE_TRIAL.robberyChaseSecurityMin + '.' : '');
  return [
    { option: 'pay', label: 'Pay', lossMilli: pay, reason: reportReason },
    { option: 'chase', label: 'Chase', lossMilli: loss, reason: chaseReason },
    { option: 'let-go', label: 'Let go', lossMilli: loss, reason: reportReason },
  ] satisfies { option: HomeRobberyOption; label: string; lossMilli: number; reason: string }[];
}
