import {
  canSpendMoney, donationGoldMilli, hasWeeklyKeys, homeRobberyChaseChanceBps, homeRobberyLossMilli, homeRobberyRoll,
  isLiveCharacterLifeSessionState, PURSE_TRIAL, type CharacterLifeSessionState, type HomeRobberyResolution,
} from '@haven/core';
import type { CharacterLifeCommandResult } from './character-life-command.js';

export const PURSE_COMMAND_TYPES = ['SET_LEVY', 'DONATE_MONEY', 'ANSWER_ROBBERY'] as const;
export type PurseCommandType = typeof PURSE_COMMAND_TYPES[number];

const fields: Record<PurseCommandType, string> = { SET_LEVY: 'percent', DONATE_MONEY: 'amountMilli', ANSWER_ROBBERY: 'option' };
const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });
const whole = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);

export function executePurseCommand(
  session: CharacterLifeSessionState, type: PurseCommandType, raw: unknown,
): CharacterLifeCommandResult {
  if (session.city.phase !== 'planning')
    return type === 'ANSWER_ROBBERY'
      ? fail('FORBIDDEN', 'Choose Plan next week to answer.')
      : fail('FORBIDDEN', 'Plan next week before changing the purse.');
  if (!hasWeeklyKeys(raw, ['type', 'expectedRevision', fields[type]]))
    return fail('INVALID_COMMAND', 'Command must contain plain data fields.');
  if (raw.expectedRevision !== session.city.revision)
    return fail('STALE_COMMAND', 'The purse changed. Try again.');

  const next = structuredClone(session);
  const purse = next.player.purse;
  let robberyResolution: Readonly<HomeRobberyResolution> | undefined;
  if (type === 'ANSWER_ROBBERY') {
    const { option } = raw;
    if (option !== 'pay' && option !== 'chase' && option !== 'let-go')
      return fail('UNKNOWN_OPTION', 'Choose Pay, Chase or Let go.');
    const card = purse.robbery;
    if (!card) return fail('UNKNOWN_CARD', 'No home robbery is pending.');
    const { society, world } = next.city;
    if (society!.pendingCard) return fail('CARD_PENDING', 'Answer the crisis first.');
    const { security } = society!.order;
    if (option === 'chase' && security < PURSE_TRIAL.robberyChaseSecurityMin)
      return fail('CHASE_UNAVAILABLE', 'Needs Security ' + PURSE_TRIAL.robberyChaseSecurityMin + '.');
    const chased = option === 'chase' &&
      homeRobberyRoll(world.worldMetadata.worldSeed, card.week, 'home-robbery-chase') < homeRobberyChaseChanceBps(security);
    const lossMilli = chased ? 0 :
      homeRobberyLossMilli(card.excessMilli, option === 'pay' ? 'pay' : 'let-go');
    purse.moneyMilli -= lossMilli;
    purse.robbery = null;
    robberyResolution = Object.freeze({
      week: card.week, excessMilli: card.excessMilli, lossMilli,
      outcome: option === 'chase' ? (chased ? 'chase-success' : 'chase-failure') : option,
    });
  } else if (type === 'SET_LEVY') {
    const percent = raw.percent;
    if (!whole(percent) || percent < 0 || percent > PURSE_TRIAL.levyMaxPercent)
      return fail('INVALID_AMOUNT', 'Enter a whole levy percent from 0 to ' + PURSE_TRIAL.levyMaxPercent + '.');
    purse.levyPercent = percent === 0 ? 0 : percent;
  } else {
    const amount = raw.amountMilli;
    if (!whole(amount) || amount <= 0 || amount % 1000 !== 0)
      return fail('INVALID_AMOUNT', 'Enter a positive whole amount.');
    if (!canSpendMoney(purse, amount)) return fail('NOT_ENOUGH_MONEY', 'Not enough Money.');
    const { world, society } = next.city;
    const stock = world.settlements[world.activeSettlementId!].inventory;
    const gold = donationGoldMilli(amount, society!.difficulty);
    if (!whole(stock.gold + gold) || !whole(purse.donatedThisWeekMilli + amount))
      return fail('INVALID_AMOUNT', 'This donation is too large.');
    purse.moneyMilli -= amount;
    stock.gold += gold;
    purse.donatedThisWeekMilli += amount;
  }
  next.city.revision++;
  if (!isLiveCharacterLifeSessionState(next))
    return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.');
  return { success: true, next, ...(robberyResolution ? { robberyResolution } : {}) };
}
