import {
  describeLong, describeShort, managerSlotTileIds, profileRows, REQUIRED_EMOTIONS, REQUIRED_NEEDS,
  REQUIRED_RELATIONSHIP, REQUIRED_SKILLS, summarizeOutside, TRIAL_BUILDINGS, WEEKLY_RESOURCE_KEYS,
  weeklyWorkforceMilli, WORLD_TRAITS,
  type CharacterLifeSessionState, type CharacterView, type NamedCharacter, type Relationship8D,
  type TileTrialReport, type TileTrialState, type WeeklyStocks,
} from '@haven/core';
import type { CharacterLifeActionType } from './character-life-command.js';

export interface VisibleCharacter {
  id: string; name: string; shortDescription: string; longDescription: string;
  profileRows: { label: string; value: string }[];
  stats: { skills: NamedCharacter['skills']; health: number;
    needs: NamedCharacter['needs']; emotions: NamedCharacter['emotions'] };
  traits: { id: string; name: string; summary: string }[];
  relationship: Relationship8D | null;
  adult: { intimacyKnowledge: number | null;
    intimateHistory: 'Not recorded' | 'Unknown' | 'None' | 'Some' };
}
export interface VisibleReport {
  goodsStock?: TileTrialReport['goodsStock'];
  week: number; before: WeeklyStocks; after: WeeklyStocks;
  taxMilli: number; farmBatchGoldMilli: number; farmExtraUpkeepMilli: number;
  upkeepPaidMilli: number; unpaidUpkeepMilli: number;
  foodDemandMilli: number; foodConsumedMilli: number;
  happinessBefore: number; happinessAfter: number;
  goods: { demandMilli: number; servedMilli: number; fulfillmentBps: number;
    woodUsed: number; ironUsed: number; revenueMilli: number };
  activities: string[];
  immigration?: { populationBefore: number; arrivals: number; populationAfter: number };
}
export interface Observation {
  week: number; phase: TileTrialState['phase']; revision: number;
  actionTypes: CharacterLifeActionType[]; disabledReasons: string[];
  settlement: { stocks: WeeklyStocks; goodsStock?: TileTrialState['goodsStock']; residents: number;
    workforceMilli: number; assignedWorkers: number; happiness: number };
  tiles: { id: string; terrain: string; building: {
    typeId: string; level: number; workers: number; enabled: boolean;
  } | null }[];
  buildings: { typeId: string; name: string;
    cost: { gold: number; wood: number; iron: number };
    terrain: string[]; maxLevel: number; maxWorkers: number; upkeepMilli: number }[];
  player: VisibleCharacter;
  npcs: (VisibleCharacter & { age: number; occupation: NamedCharacter['occupation'];
    socialClass: NamedCharacter['socialClass']; legalStatus: NamedCharacter['legalStatus'];
    postTileId: string | null; postLabel: string })[];
  freeManagerSlots: { tileId: string; label: string }[];
  outside: { total: number; mine: number; others: number; neutral: number; explored: number };
  lastReport: VisibleReport | null;
}

function numbers<K extends string>(source: Record<K, number>, keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map(key => [key, source[key]])) as Record<K, number>;
}

function visibleCharacter(view: CharacterView, traitIds: string[]): VisibleCharacter {
  const c = view.character, history = view.profile.private?.intimateHistory;
  return {
    id: c.id, name: c.name, shortDescription: describeShort(view), longDescription: describeLong(view),
    profileRows: profileRows(view),
    stats: { skills: numbers(c.skills, REQUIRED_SKILLS), health: c.health,
      needs: numbers(c.needs, REQUIRED_NEEDS), emotions: numbers(c.emotions, REQUIRED_EMOTIONS) },
    traits: traitIds.map(id => {
      const trait = WORLD_TRAITS.find(t => t.id === id)!;
      return { id: trait.id, name: trait.name, summary: trait.summary };
    }),
    relationship: view.role === 'player' ? null : numbers(c.relationshipToPlayer, REQUIRED_RELATIONSHIP),
    adult: { intimacyKnowledge: view.profile.traits.intimacyKnowledge ?? null,
      intimateHistory: !history ? 'Not recorded' : history.disclosure === 'unknown' ? 'Unknown'
        : history.value === 'none' ? 'None' : 'Some' },
  };
}

function visibleReport(r: Readonly<TileTrialReport>): VisibleReport {
  const report: VisibleReport = {
    week: r.week, before: numbers(r.before, WEEKLY_RESOURCE_KEYS), after: numbers(r.after, WEEKLY_RESOURCE_KEYS),
    taxMilli: r.taxMilli, farmBatchGoldMilli: r.farmBatchGoldMilli, farmExtraUpkeepMilli: r.farmExtraUpkeepMilli,
    upkeepPaidMilli: r.upkeepPaidMilli, unpaidUpkeepMilli: r.unpaidUpkeepMilli,
    foodDemandMilli: r.foodDemandMilli, foodConsumedMilli: r.foodConsumedMilli,
    happinessBefore: r.happinessBefore, happinessAfter: r.happinessAfter,
    goods: { demandMilli: r.goods.demandMilli, servedMilli: r.goods.servedMilli, fulfillmentBps: r.goods.fulfillmentBps,
      woodUsed: r.goods.woodUsed, ironUsed: r.goods.ironUsed, revenueMilli: r.goods.revenueMilli },
    activities: [...r.activities],
  };
  if (r.goodsStock) report.goodsStock = { ...r.goodsStock };
  if (r.immigration) report.immigration = { populationBefore: r.immigration.populationBefore,
    arrivals: r.immigration.arrivals, populationAfter: r.immigration.populationAfter };
  return report;
}

// The caller validates the live session; this boundary only projects rendered fields.
export function observeCharacterLife(session: CharacterLifeSessionState, lastReport: Readonly<TileTrialReport> | null): Observation {
  const city = session.city, settlement = city.world.settlements[city.world.activeSettlementId!];
  const postName = (tileId: string) => TRIAL_BUILDINGS[city.tiles.find(t => t.id === tileId)!.building!.typeId].name;
  const slotLabel = (tileId: string) => `Manager — ${postName(tileId)} (${tileId})`;
  const held = new Set(session.npcs.map(n => n.postTileId));
  const freeManagerSlots = managerSlotTileIds(city).filter(id => !held.has(id)).map(tileId => ({ tileId, label: slotLabel(tileId) }));
  const disabledReasons: string[] = [];
  if (city.phase === 'report') disabledReasons.push('Choose Plan next week before saving, continuing, exporting or importing.');
  if (freeManagerSlots.length === 0 && session.npcs.some(n => n.postTileId === null)) {
    disabledReasons.push('No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.');
  }
  return {
    week: city.world.week, phase: city.phase, revision: city.revision,
    actionTypes: city.phase === 'report' ? ['NEXT_WEEK']
      : ['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED', 'END_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC',
        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING'] as const : [])],
    disabledReasons,
    settlement: { stocks: numbers(settlement.inventory, WEEKLY_RESOURCE_KEYS),
      ...(city.goodsStock ? { goodsStock: { ...city.goodsStock } } : {}),
      residents: settlement.cohorts.reduce((sum, c) => sum + c.count, 0), workforceMilli: weeklyWorkforceMilli(settlement.cohorts),
      assignedWorkers: city.tiles.reduce((sum, t) => sum + (t.building?.workers ?? 0), 0), happiness: city.happiness },
    tiles: city.tiles.map(t => ({ id: t.id, terrain: t.terrain, building: t.building ? {
      typeId: t.building.typeId, level: t.building.level, workers: t.building.workers, enabled: t.building.enabled,
    } : null })),
    buildings: Object.entries(TRIAL_BUILDINGS).map(([typeId, d]) => ({ typeId, name: d.name,
      cost: { gold: d.cost.gold, wood: d.cost.wood, iron: d.cost.iron }, terrain: [...d.terrain],
      maxLevel: d.maxLevel, maxWorkers: d.maxWorkers, upkeepMilli: d.upkeepMilli })),
    player: visibleCharacter({ character: session.player.character, profile: session.player.profile,
      role: 'player', postBuildingName: null }, []),
    npcs: session.npcs.map((n, i) => ({
      ...visibleCharacter({ character: n.character, profile: session.profiles[i], role: 'npc',
        postBuildingName: n.postTileId === null ? null : postName(n.postTileId) }, n.traits),
      age: n.character.age, occupation: n.character.occupation, socialClass: n.character.socialClass,
      legalStatus: n.character.legalStatus, postTileId: n.postTileId,
      postLabel: n.postTileId === null ? 'Unassigned' : slotLabel(n.postTileId),
    })),
    freeManagerSlots, outside: summarizeOutside(session.outside, 'player'),
    lastReport: lastReport === null ? null : visibleReport(lastReport),
  };
}
