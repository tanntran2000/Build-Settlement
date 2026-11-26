import { donationGoldMilli, levySatisfactionCost, PURSE_TRIAL, type DifficultyId, type PlayerCharacter } from '@haven/core';

export function parseDonationMilli(text: string): number | null {
  if (!/^[0-9]+$/.test(text)) return null;
  const amountMilli = Number(text) * 1000;
  return Number.isSafeInteger(amountMilli) && amountMilli > 0 ? amountMilli : null;
}

export function purseControls(purse: PlayerCharacter['purse'], input: string, locked: boolean, difficulty: DifficultyId) {
  const amountMilli = parseDonationMilli(input);
  const lockReason = locked ? 'Plan next week before changing the purse.' : '';
  return {
    amountMilli,
    goldMilli: amountMilli === null ? null : donationGoldMilli(amountMilli, difficulty),
    happinessCost: levySatisfactionCost(purse.levyPercent),
    decreaseReason: lockReason || (purse.levyPercent === 0 ? 'Weekly levy is at its minimum.' : ''),
    increaseReason: lockReason || (purse.levyPercent === PURSE_TRIAL.levyMaxPercent ? 'Weekly levy is at its maximum.' : ''),
    donateReason: lockReason || (amountMilli === null ? 'Enter a positive whole amount.' :
      amountMilli > purse.moneyMilli ? 'Not enough Money.' : ''),
  };
}
