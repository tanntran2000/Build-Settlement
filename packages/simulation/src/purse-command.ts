import {
  donationGoldMilli, hasWeeklyKeys, isLiveCharacterLifeSessionState, PURSE_TRIAL,
  type CharacterLifeSessionState,
} from '@haven/core';
import type { CharacterLifeCommandResult } from './character-life-command.js';

export const PURSE_COMMAND_TYPES = ['SET_LEVY', 'DONATE_MONEY'] as const;
export type PurseCommandType = typeof PURSE_COMMAND_TYPES[number];

const fields: Record<PurseCommandType, string> = { SET_LEVY: 'percent', DONATE_MONEY: 'amountMilli' };
const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });
const whole = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);

export function executePurseCommand(
  session: CharacterLifeSessionState, type: PurseCommandType, raw: unknown,
): CharacterLifeCommandResult {
  if (session.city.phase !== 'planning')
    return fail('FORBIDDEN', 'Plan next week before changing the purse.');
  if (!hasWeeklyKeys(raw, ['type', 'expectedRevision', fields[type]]))
    return fail('INVALID_COMMAND', 'Command must contain plain data fields.');
  if (raw.expectedRevision !== session.city.revision)
    return fail('STALE_COMMAND', 'The purse changed. Try again.');

  const next = structuredClone(session);
  const purse = next.player.purse;
  if (type === 'SET_LEVY') {
    const percent = raw.percent;
    if (!whole(percent) || percent < 0 || percent > PURSE_TRIAL.levyMaxPercent)
      return fail('INVALID_AMOUNT', 'Enter a whole levy percent from 0 to ' + PURSE_TRIAL.levyMaxPercent + '.');
    purse.levyPercent = percent === 0 ? 0 : percent;
  } else {
    const amount = raw.amountMilli;
    if (!whole(amount) || amount <= 0 || amount % 1000 !== 0)
      return fail('INVALID_AMOUNT', 'Enter a positive whole amount.');
    if (amount > purse.moneyMilli) return fail('NOT_ENOUGH_MONEY', 'Not enough Money.');
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
  return { success: true, next };
}
