import {
  hasWeeklyKeys, isLiveCharacterLifeSessionState, isMansionStaffRole, P7B_TRIAL, returnEquippedToStorage,
  type CharacterLifeSessionState, type HouseholdReport, type WorldNpc,
} from '@haven/core';
import type { CharacterLifeCommandResult } from './character-life-command.js';
import { ACQUISITION_MESSAGES, executeAcquisitionCommand } from './npc-acquisition.js';
import { trialSafe } from './tile-trial-week.js';

const rules = P7B_TRIAL.household;
const [statMin, statMax] = P7B_TRIAL.statRange;
const clampStat = (value: number) => Math.min(statMax, Math.max(statMin, value));

export function payNpcWages(session: CharacterLifeSessionState): {
  session: CharacterLifeSessionState;
  report: Pick<HouseholdReport, 'wagesPaidMilli' | 'unpaid'>;
} {
  const report = { wagesPaidMilli: 0, unpaid: [] as string[] };
  if (!session.npcs.length) return { session, report };
  const { city } = session, { world } = city;
  const id = world.activeSettlementId!, settlement = world.settlements[id];
  const opening = settlement.inventory.gold;
  let gold = opening, npcs = session.npcs;
  for (const [index, npc] of session.npcs.entries()) {
    const { household, character } = npc;
    const contract = household.contract;
    if (household.status !== 'servant' || !contract) continue;
    if (gold >= contract.wageMilli) {
      gold -= contract.wageMilli;
      continue;
    }
    report.unpaid.push(character.name);
    if (npcs === session.npcs) npcs = session.npcs.slice();
    npcs[index] = {
      ...npc,
      household: { ...household, contract: { ...contract, unpaidWeeks: trialSafe(contract.unpaidWeeks + 1) },
        obedience: clampStat(household.obedience - rules.unpaidObedienceLoss) },
      character: { ...character, relationshipToPlayer: { ...character.relationshipToPlayer,
        affection: clampStat(character.relationshipToPlayer.affection - rules.unpaidAffectionLoss) } },
    };
  }
  report.wagesPaidMilli = opening - gold;
  if (gold === opening) return { session: npcs === session.npcs ? session : { ...session, npcs }, report };
  const settlements = { ...world.settlements, [id]: { ...settlement, inventory: { ...settlement.inventory, gold } } };
  return { session: { ...session, city: { ...city, world: { ...world, settlements } }, npcs }, report };
}

// Character Life owns these detached NPCs after runNpcLifeWeek. Their order still matches the opening roster.
export function runHouseholdWeek(npcs: WorldNpc[], input: { week: number; opening: readonly WorldNpc[] }) {
  const report: Pick<HouseholdReport, 'notices' | 'left'> = { notices: [], left: [] };
  const leftIds = new Set<string>();
  for (const [index, npc] of npcs.entries()) {
    const { household, character, life } = npc, { contract } = household;
    if (household.notice === 'renewal') {
      leftIds.add(character.id);
      report.left.push(character.name);
      continue;
    }
    if (household.notice === 'lifelong') {
      household.notice = null;
      household.lifelongAskWeek = input.week;
    }
    const atStressLimit = life.stress === statMax;
    household.obedience = clampStat(household.obedience +
      (household.home === 'estate-1' ? rules.mansionObedienceGain : 0) -
      (atStressLimit ? rules.stressObedienceLoss : 0));
    if (household.status !== 'servant' || !contract) continue;
    if (atStressLimit && input.opening[index].life.stress < statMax) contract.stressHits = trialSafe(contract.stressHits + 1);
    contract.weeksLeft = Math.max(0, contract.weeksLeft - 1);
    if (contract.weeksLeft === 0) {
      if (isMansionStaffRole(household.role)) household.role = null;
      if (contract.unpaidWeeks >= rules.unpaidRefusalWeeks || contract.stressHits >= rules.stressRefusalHits) {
        leftIds.add(character.id);
        report.left.push(character.name);
        continue;
      }
      household.notice = 'renewal';
    } else if (character.relationshipToPlayer.affection >= rules.lifelongAffectionMin &&
        household.obedience >= rules.lifelongObedienceMin &&
        (household.lifelongAskWeek === null || household.lifelongAskWeek <= input.week - rules.lifelongAskGapWeeks)) {
      household.notice = 'lifelong';
    }
    if (household.notice) report.notices.push(character.name);
  }
  return { npcs: leftIds.size ? npcs.filter(npc => !leftIds.has(npc.character.id)) : npcs, report, leftIds };
}

// Voluntary release retains the B3 storage refusal. Automatic departures must complete the week.
export function settleDepartingEquipment(session: CharacterLifeSessionState, ids: ReadonlySet<string>): void {
  const society = session.city.society!;
  const week = session.city.world.week;
  for (const id of ids) {
    if (!Object.hasOwn(society.items.equipped, id)) continue;
    const returned = returnEquippedToStorage(society.items, id, week);
    if (returned) society.items = returned;
    else delete society.items.equipped[id]; // She takes her equipped gear if it cannot all fit.
  }
}

const fail = (code: string, message: string): CharacterLifeCommandResult => ({ success: false, error: { code, message } });

export function answerNotice(session: CharacterLifeSessionState, raw: unknown): CharacterLifeCommandResult {
  if (!hasWeeklyKeys(raw, ['type', 'npcId', 'choice', 'expectedRevision']) || typeof raw.npcId !== 'string' ||
      typeof raw.choice !== 'string') return fail('INVALID_COMMAND', 'Select an NPC and a notice response.');
  if (raw.expectedRevision !== session.city.revision) return fail('STALE_COMMAND', ACQUISITION_MESSAGES.STALE_COMMAND);
  if (session.city.phase !== 'planning') return fail('FORBIDDEN', 'Read the report, then choose Plan next week.');
  const index = session.npcs.findIndex(npc => npc.character.id === raw.npcId);
  const notice = session.npcs[index]?.household.notice;
  if (!notice) return fail('NOTICE_MISSING', 'That NPC has no pending notice.');
  const allowed = notice === 'renewal' ? ['renew', 'release'] : ['accept', 'decline'];
  if (!allowed.includes(raw.choice)) return fail('NOTICE_CHOICE', 'Choose a response for this notice.');
  if (raw.choice === 'release') return executeAcquisitionCommand(session, 'RELEASE_NPC',
    { type: 'RELEASE_NPC', npcId: raw.npcId, expectedRevision: raw.expectedRevision });
  try {
    const next = structuredClone(session), household = next.npcs[index].household;
    household.notice = null;
    if (raw.choice === 'renew') {
      const step = rules.renewalWageStepMilli;
      const wageMilli = trialSafe(Math.ceil(household.contract!.wageMilli * rules.renewalWageMultiplier / step) * step);
      household.contract = { weeksLeft: P7B_TRIAL.contractWeeks, wageMilli, unpaidWeeks: 0, stressHits: 0 };
    } else if (raw.choice === 'accept') {
      household.status = 'lifelong';
      household.contract = null;
    } else {
      household.lifelongAskWeek = next.city.world.week;
    }
    next.city.revision = trialSafe(next.city.revision + 1);
    if (isLiveCharacterLifeSessionState(next)) return { success: true, next };
  } catch { /* keep the original session */ }
  return fail('EXECUTION_ERROR', 'The action failed validation; the original session was preserved.');
}
