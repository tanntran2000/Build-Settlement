import {
  canMoveToMansionRoom, isMansionStaffRole, mansionLevel, mansionPlanningEffects, mansionRoleRefusal, mansionTerms,
  MANSION_CATALOG, MANSION_ROLE_REFUSALS, MANSION_ROOM_TYPES, MANSION_STAFF_ROLES, roomBeds, safeAmountMilli,
  type TileTrialState, type WorldNpc,
} from '@haven/core';
import { formatMilli } from './milli-format.js';

type Cost = { gold: number; wood: number; iron: number };
const costLabel = ({ gold, wood, iron }: Cost) => formatMilli(gold) + ' Gold · ' + formatMilli(wood) + ' Wood · ' + formatMilli(iron) + ' Iron';
const moveMessages = {
  SUITE_ROLE_ONLY: 'This room is closed to moves.',
  MANSION_FULL: 'The Mansion has no free bed.',
  ROOM_FULL: 'That room has no free bed.',
};

export function mansionRoleOptions(city: TileTrialState, npcs: readonly WorldNpc[], npc: WorldNpc) {
  const roles = [null, ...MANSION_STAFF_ROLES];
  const current = npc.household.role;
  const options = roles.map(role => {
    const definition = role === null ? undefined : MANSION_CATALOG.roles[role];
    const refusal = mansionRoleRefusal(city, npcs, npc, role);
    return {
      role: role as typeof current,
      name: definition?.name ?? 'None',
      fitRoom: definition ? MANSION_CATALOG.roomTypes[definition.fitRoom].name : null,
      reason: refusal ? MANSION_ROLE_REFUSALS[refusal] : '',
    };
  });
  if (current !== null && !isMansionStaffRole(current)) {
    const role = MANSION_CATALOG.roles[current];
    options.unshift({
      role: current, name: role.name, fitRoom: MANSION_CATALOG.roomTypes[role.fitRoom].name,
      reason: 'This role is unavailable for assignment.',
    });
  }
  return options;
}

function mansionSummary(city: TileTrialState, npcs: readonly WorldNpc[]) {
  const state = { city, npcs }, terms = mansionTerms(state);
  const effects = mansionPlanningEffects(state, terms);
  if (!terms || !effects) return;
  const { security } = city.society!.order;
  const { difficulty } = city.society!;
  const gold = (label: string, milli: number) => ({ label, value: formatMilli(milli) + ' Gold' });
  const money = (label: string, milli: number) => ({ label, value: formatMilli(milli) + ' Money' });
  const safe = effects.safeAmount;
  return {
    comfort: effects.comfortSupply + ' / ' + terms.comfortNeed,
    upkeep: [
      gold('Mansion building', terms.buildingUpkeepMilli),
      gold('Rooms', terms.roomUpkeepMilli),
      ...terms.upkeepFactors.map(({ source, bps }) => ({ label: source, value: '× ' + bps / 100 + '%' })),
      gold('Total due', terms.upkeepMilli),
    ],
    safeAmount: [
      money('Security and difficulty', safeAmountMilli(security, difficulty)),
      money('Guards', safe.guard), money('Captain', safe.captain), money('Vault', safe.vault),
      money('Accountant', safe.accountant), money('Total safe', safeAmountMilli(security, difficulty, effects)),
    ],
  };
}

export function mansionRoomChoices(city: TileTrialState, npcs: readonly WorldNpc[], npc: WorldNpc) {
  return (city.society?.mansion.rooms ?? []).map(room => {
    const code = canMoveToMansionRoom(city, npcs, npc, room);
    return { id: room.id, label: MANSION_CATALOG.roomTypes[room.typeId].name + ' · ' + room.id, reason: code ? moveMessages[code] : '' };
  });
}

export function mansionView(city: TileTrialState, npcs: readonly WorldNpc[]) {
  const mansion = city.society!.mansion;
  const level = mansionLevel(city);
  const locked = city.phase === 'report';
  const inventory = city.world.settlements[city.world.activeSettlementId!].inventory;
  const fundsReason = (cost: Cost) => inventory.gold < cost.gold ? 'There is not enough Gold for that room.'
    : inventory.wood < cost.wood || inventory.iron < cost.iron ? 'There is not enough Wood or Iron for that room.' : '';
  const builds = MANSION_ROOM_TYPES.map(id => {
    const type = MANSION_CATALOG.roomTypes[id];
    const reason = locked ? 'Plan next week to build rooms.'
      : !level || type.unlockLevel > level ? 'Needs Mansion level ' + type.unlockLevel
      : mansion.rooms.filter(room => room.typeId === id).length >= type.maxCount[level - 1] ? 'The Mansion has reached the limit for this room type.'
      : fundsReason(type.cost[0]);
    return { id, name: type.name, cost: costLabel(type.cost[0]), reason };
  });
  const rooms = mansion.rooms.map(room => {
    const type = MANSION_CATALOG.roomTypes[room.typeId];
    const cost = room.level === 3 ? undefined : type.cost[room.level];
    const upgradeReason = locked ? 'Plan next week to upgrade rooms.'
      : !cost ? 'That room is already level 3.' : fundsReason(cost);
    return { ...room, name: type.name, reportAccess: type.reportAccess, beds: roomBeds(room), residents: npcs.filter(npc => npc.household.room === room.id),
      upgradeCost: cost ? costLabel(cost) : null, upgradeReason };
  });
  return { builds, rooms, summary: mansionSummary(city, npcs) };
}
