import { hasWeeklyKeys, isLiveCharacterLifeSessionState, buildItemWeekContext, emptyHouseholdReport, levySatisfactionCost, donationGoldMilli, mansionTerms, type CharacterLifeSessionState, type HomeRobberyResolution, type TileTrialReport } from '@haven/core';
import { executeWorldNpcCityCommand, executeWorldNpcCommand } from './world-npc.js';
import { executeMansionCommand, MANSION_COMMAND_TYPES, type MansionCommandType } from './mansion-command.js';
import { executeItemCommand, ITEM_COMMAND_TYPES, type ItemCommandType } from './item-command.js';
import { recordNpcLifeEvent, runNpcLifeWeek } from './npc-life-week.js';
import { acquisitionWeekReport, drawAcquisition, executeAcquisitionCommand, isAcquisitionCommand, type AcquisitionCommandType } from './npc-acquisition.js';

import { executePurseCommand, PURSE_COMMAND_TYPES, type PurseCommandType } from './purse-command.js';
import { runHomeRobberyCheck, runLevyWeek } from './purse-week.js';
import { answerNotice, payNpcWages, runHouseholdWeek, settleDepartingEquipment } from './household-week.js';
import { runMansionWeek, type MansionWeekCharge } from './mansion-week.js';

export type CharacterLifeActionType = 'BUILD' | 'REPLACE' | 'UPGRADE'
  | 'SET_WORKERS' | 'SET_ENABLED' | 'END_WEEK' | 'NEXT_WEEK'
  | 'ENACT_LAW' | 'REPEAL_LAW' | 'CHOOSE_CARD_OPTION' | 'ASSIGN_NPC' | 'UNASSIGN_NPC' | 'MOVE_NPC_HOME' | 'ANSWER_NOTICE' | 'EXTEND_WALL' | 'SET_TRAINING' | 'CLEAR' | 'SET_RESEARCH' | 'BUILD_DEEP_SHAFT' | ItemCommandType | AcquisitionCommandType | PurseCommandType | MansionCommandType;
export type CharacterLifeCommandResult =
  | { success: true; next: CharacterLifeSessionState; report?: Readonly<TileTrialReport>; robberyResolution?: Readonly<HomeRobberyResolution> }
  | { success: false; error: { code: string; message: string } };

const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });

export function executeCharacterLifeCommand(session: unknown, raw: unknown): CharacterLifeCommandResult {
  if (isLiveCharacterLifeSessionState(session) && session.city.society?.crisis.stage === 'fallen') return fail('CITY_FALLEN','The city has fallen. Start a New Game.');
  let type: unknown;
  try {
    if (!raw || typeof raw !== 'object' || !hasWeeklyKeys(raw, Object.keys(raw))) {
      return fail('INVALID_COMMAND', 'Command must contain plain data fields.');
    }
    type = Object.getOwnPropertyDescriptor(raw, 'type')?.value;
  } catch { return fail('INVALID_COMMAND', 'Command must contain plain data fields.'); }
  if (typeof type !== 'string') return fail('INVALID_COMMAND', 'Command must contain plain data fields.');
  if (type === 'LOAD_TRIAL') return fail('INVALID_COMMAND', 'Load an NPC world checkpoint through Continue or Import.');
  if (ITEM_COMMAND_TYPES.includes(type as ItemCommandType)) {
    if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');
    return executeItemCommand(session,raw);
  }
  if (PURSE_COMMAND_TYPES.includes(type as PurseCommandType)) {
    if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');
    return executePurseCommand(session, type as PurseCommandType, raw);
  }
  if (MANSION_COMMAND_TYPES.includes(type as MansionCommandType)) {
    if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');
    return executeMansionCommand(session, type as MansionCommandType, raw);
  }
  if (isAcquisitionCommand(type)) {
    if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');
    return executeAcquisitionCommand(session, type, raw);
  }
  const societyAction = ['ENACT_LAW', 'REPEAL_LAW', 'CHOOSE_CARD_OPTION', 'EXTEND_WALL', 'SET_TRAINING', 'CLEAR', 'SET_RESEARCH', 'BUILD_DEEP_SHAFT'].includes(type) &&
    isLiveCharacterLifeSessionState(session) && !!session.city.society;
  if (!['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED', 'END_WEEK', 'NEXT_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC', 'MOVE_NPC_HOME', 'ANSWER_NOTICE'].includes(type) && !societyAction) {
    return fail('UNSUPPORTED_ACTION', 'This action is not supported in Character Life.');
  }
  if (!isLiveCharacterLifeSessionState(session)) return fail('INVALID_STATE', 'World session is invalid; nothing was changed.');

  if (type === 'ANSWER_NOTICE') return answerNotice(session, raw);
  if (type === 'END_WEEK' && session.player.purse.robbery && Object.getOwnPropertyDescriptor(raw as object, 'expectedRevision')?.value === session.city.revision) {
    return fail('CARD_PENDING', session.city.society?.pendingCard ? 'Answer the crisis first.' : 'Answer the robbery first.');
  }

  try {
    const wages = type === 'END_WEEK' && session.city.phase === 'planning' && !session.city.society?.pendingCard && !session.player.purse.robbery
      ? payNpcWages(session) : undefined;
    const opening = wages?.session ?? session;
    const world = { city: opening.city, outside: opening.outside, npcs: opening.npcs };
    const terms = type === 'END_WEEK' ? mansionTerms(world) : undefined;
    const mansion: MansionWeekCharge | undefined = terms ? { terms } : undefined;
    const result = type === 'ASSIGN_NPC' || type === 'UNASSIGN_NPC' || type === 'MOVE_NPC_HOME'
      ? executeWorldNpcCommand(world, raw)
      : type === 'END_WEEK' ? executeWorldNpcCityCommand(world, raw, buildItemWeekContext(opening),
        levySatisfactionCost(opening.player.purse.levyPercent,
          donationGoldMilli(opening.player.purse.donatedThisWeekMilli, opening.city.society!.difficulty)), mansion)
      : executeWorldNpcCityCommand(world, raw);
    if (!result.success) return result;

    const next = { city: result.next.city, outside: result.next.outside, npcs: result.next.npcs,
      player: structuredClone(session.player), profiles: structuredClone(session.profiles) };
    const posts = new Map(session.npcs.map(npc => [npc.character.id, npc.postTileId]));
    for (const npc of next.npcs) {
      const previous = posts.get(npc.character.id);
      if (previous !== undefined && previous !== npc.postTileId) {
        if (previous !== null) recordNpcLifeEvent(npc.life, next.city.world.week, 'post-cleared');
        if (npc.postTileId !== null) recordNpcLifeEvent(npc.life, next.city.world.week, 'post-assigned');
      }
    }
    let report=(result as {report?:Readonly<TileTrialReport>}).report;
    const lordHealthLoss=report?.crimeEvent?.lordHealthLoss??0;
    if(type==='END_WEEK'){
      if(!report)throw Error('End Week did not produce a report.');
      const health=next.player.character.health-lordHealthLoss;
      if(health<=0){
        next.player.character.health=0;
        next.city.society!.crisis.stage='fallen';next.city.society!.crisis.fallCause='wounds';next.city.society!.pendingCard=null;
        report.items.regen=0;
      }else next.player.character.health=Math.min(100,health+report.items.regen);
      const lifeWeek = runNpcLifeWeek(next.npcs, { week: next.city.world.week, authority: next.city.society!.order.authority });
      next.npcs = lifeWeek.npcs;
      if (lifeWeek.report.exhausted.length || lifeWeek.report.recovered.length || lifeWeek.report.birthdays.length) {
        Object.freeze(lifeWeek.report.exhausted); Object.freeze(lifeWeek.report.recovered); Object.freeze(lifeWeek.report.birthdays);
        report = Object.freeze({ ...report, npcLife: Object.freeze(lifeWeek.report) });
      }
      const { week, worldMetadata: { worldSeed } } = next.city.world;
      const householdWeek = runHouseholdWeek(next.npcs, { week, opening: session.npcs });
      next.npcs = householdWeek.npcs;
      if (householdWeek.leftIds.size) {
        next.profiles = next.profiles.filter(profile => !householdWeek.leftIds.has(profile.id));
        settleDepartingEquipment(next, householdWeek.leftIds);
      }
      const market = acquisitionWeekReport(worldSeed, session.city.society!.acquisition, report.week);
      const { left, notices } = householdWeek.report;
      const { wagesPaidMilli, unpaid } = wages!.report;
      if (wagesPaidMilli || unpaid.length || notices.length || left.length) {
        Object.freeze(left); Object.freeze(notices); Object.freeze(unpaid);
        const before = wagesPaidMilli
          ? Object.freeze({ ...report.before, gold: report.before.gold + wagesPaidMilli }) : report.before;
        report = Object.freeze({ ...report, before, household: Object.freeze({
          ...(market ?? emptyHouseholdReport()), left, wagesPaidMilli, unpaid, notices,
        }) });
        Object.freeze(report.household!.bought); Object.freeze(report.household!.sold);
        Object.freeze(report.household!.released); Object.freeze(report.household!.lotsToRivals);
      } else if (market) report = Object.freeze({ ...report, household: market });
      if (mansion) report = Object.freeze({ ...report, mansion: runMansionWeek(next.npcs, mansion) });
      const purse = runLevyWeek(next, report.taxMilli + report.goods.revenueMilli + (report.laws?.incomeMilli ?? 0));
      const robbery = runHomeRobberyCheck(next, report.week);
      next.player.purse.donatedThisWeekMilli = 0;
      const after = purse.levyPaidMilli > 0
        ? Object.freeze({ ...report.after, gold: report.after.gold - purse.levyPaidMilli }) : report.after;
      report = Object.freeze({ ...report, after, purse: robbery ? Object.freeze({ ...purse, robbery }) : purse });
      next.city.society!.acquisition = drawAcquisition(worldSeed, week, next.city, next.npcs);
    } else if (type === 'BUILD' || type === 'REPLACE' || type === 'SET_ENABLED') {
      const { week, worldMetadata: { worldSeed } } = next.city.world;
      next.city.society!.acquisition = drawAcquisition(worldSeed, week, next.city, next.npcs);
    }
    if (isLiveCharacterLifeSessionState(next)) return { ...result, next, ...(report ? { report } : {}) };
  } catch { return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.'); }
  return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.');
}
