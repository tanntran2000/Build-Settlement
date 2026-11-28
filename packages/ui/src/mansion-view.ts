import {
  canMoveToMansionRoom, mansionLevel, MANSION_CATALOG, MANSION_ROOM_TYPES, roomBeds,
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
  return { builds, rooms };
}
