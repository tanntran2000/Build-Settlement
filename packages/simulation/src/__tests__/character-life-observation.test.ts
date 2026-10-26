import { describe, expect, it } from 'vitest';
import {
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, describeLong, describeShort,
  isLiveCharacterLifeSessionState, managerSlotTileIds, profileRows, summarizeOutside,
  TRIAL_BUILDINGS, weeklyWorkforceMilli, WORLD_TRAITS,
  type CharacterLifeSessionState, type CharacterView, type TileTrialReport,
} from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { observeCharacterLife, type Observation, type VisibleCharacter, type VisibleReport } from '../character-life-observation.js';
import * as simulation from '../index.js';

function life(): CharacterLifeSessionState {
  const r = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!r.success) throw Error(r.error.message);
  const s = r.value;
  s.profiles[0].appearance.measurements = { chestCm: 63, waistCm: 47, hipsCm: 169, disclosure: 'unknown' };
  s.profiles[0].private = { intimateHistory: { value: 'some', disclosure: 'unknown' } };
  expect(isLiveCharacterLifeSessionState(s)).toBe(true);
  return s;
}

function act(s: CharacterLifeSessionState, fields: Record<string, unknown>) {
  const r = executeCharacterLifeCommand(s, { expectedRevision: s.city.revision, ...fields });
  expect(r.success).toBe(true);
  if (!r.success) throw Error(r.error.message);
  expect(isLiveCharacterLifeSessionState(r.next)).toBe(true);
  return r;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

function keys(value: object, expected: readonly string[]) {
  expect(Reflect.ownKeys(value).sort()).toEqual([...expected].sort());
}

const stockKeys = ['gold', 'wheat', 'food', 'wood', 'iron'];
const characterKeys = ['id', 'name', 'shortDescription', 'longDescription', 'profileRows', 'stats', 'traits', 'relationship', 'adult'];
const reportKeys = ['week', 'before', 'after', 'taxMilli', 'farmBatchGoldMilli', 'farmExtraUpkeepMilli', 'upkeepPaidMilli',
  'unpaidUpkeepMilli', 'foodDemandMilli', 'foodConsumedMilli', 'happinessBefore', 'happinessAfter', 'goods', 'activities'];

function characterContract(c: VisibleCharacter) {
  c.profileRows.forEach(row => keys(row, ['label', 'value']));
  keys(c.stats, ['skills', 'health', 'needs', 'emotions']);
  keys(c.stats.skills, ['management', 'technical', 'medical', 'combat', 'negotiation']);
  keys(c.stats.needs, ['safety', 'nutrition', 'autonomy', 'recognition', 'intimacy', 'purpose']);
  keys(c.stats.emotions, ['joy', 'fear', 'anger', 'sadness', 'shame', 'jealousy', 'hope', 'stress']);
  c.traits.forEach(t => keys(t, ['id', 'name', 'summary']));
  if (c.relationship) keys(c.relationship, ['trust', 'affection', 'attraction', 'respect', 'fear', 'resentment', 'dependency', 'familiarity']);
  keys(c.adult, ['intimacyKnowledge', 'intimateHistory']);
}

function reportContract(r: VisibleReport) {
  keys(r, r.immigration ? [...reportKeys, 'immigration'] : reportKeys);
  keys(r.before, stockKeys); keys(r.after, stockKeys);
  keys(r.goods, ['demandMilli', 'servedMilli', 'fulfillmentBps', 'woodUsed', 'ironUsed', 'revenueMilli']);
  if (r.immigration) keys(r.immigration, ['populationBefore', 'arrivals', 'populationAfter']);
  r.activities.forEach(a => expect(typeof a).toBe('string'));
}

function contract(o: Observation) {
  keys(o, ['actionTypes', 'buildings', 'disabledReasons', 'freeManagerSlots', 'lastReport', 'npcs', 'outside',
    'phase', 'player', 'revision', 'settlement', 'tiles', 'week']);
  keys(o.settlement, ['stocks', 'residents', 'workforceMilli', 'assignedWorkers', 'happiness']);
  keys(o.settlement.stocks, stockKeys);
  keys(o.outside, ['total', 'mine', 'others', 'neutral', 'explored']);
  o.tiles.forEach(t => {
    keys(t, ['id', 'terrain', 'building']);
    if (t.building) keys(t.building, ['typeId', 'level', 'workers', 'enabled']);
  });
  o.buildings.forEach(b => {
    keys(b, ['typeId', 'name', 'cost', 'terrain', 'maxLevel', 'maxWorkers', 'upkeepMilli']);
    keys(b.cost, ['gold', 'wood', 'iron']);
    b.terrain.forEach(t => expect(typeof t).toBe('string'));
  });
  keys(o.player, characterKeys); characterContract(o.player);
  o.npcs.forEach(n => {
    keys(n, [...characterKeys, 'age', 'occupation', 'socialClass', 'legalStatus', 'postTileId', 'postLabel']);
    characterContract(n);
  });
  o.freeManagerSlots.forEach(s => keys(s, ['tileId', 'label']));
  if (o.lastReport) reportContract(o.lastReport);
  scan(o);
}

function scan(value: unknown) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) keys(value, [...value.map((_, i) => String(i)), 'length']);
  for (const [key, child] of Object.entries(value)) {
    expect(['seed', 'worldSeed', 'feature', 'knownBy', 'private', 'measurements', 'journal', 'path', 'hash',
      'profile', 'gender', 'memories', 'target', 'usefulWorkerSlots', 'renewableFoodMilli', 'reason']).not.toContain(key);
    scan(child);
  }
}

function rendered(c: VisibleCharacter, view: CharacterView) {
  expect(c.id).toBe(view.character.id); expect(c.name).toBe(view.character.name);
  expect(c.shortDescription).toBe(describeShort(view));
  expect(c.longDescription).toBe(describeLong(view));
  expect(c.profileRows).toEqual(profileRows(view));
  expect(c.stats).toEqual({ skills: view.character.skills, health: view.character.health,
    needs: view.character.needs, emotions: view.character.emotions });
}

const noPost = 'No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.';
const checkpointLock = 'Choose Plan next week before saving, continuing, exporting or importing.';
const planningActions = ['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED', 'END_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC'];

describe('explicit nested allowlist and disclosure', () => {
  it('exports the projector and exposes only rendered character fields and exact nested keys', () => {
    const s = life();
    for (const c of [s.player.character, ...s.npcs.map(n => n.character)]) {
      c.skills = { management: 11, technical: 22, medical: 33, combat: 44, negotiation: 55 };
      c.needs = { safety: 12, nutrition: 23, autonomy: 34, recognition: 45, intimacy: 56, purpose: 67 };
      c.emotions = { joy: 13, fear: 24, anger: 35, sadness: 46, shame: 57, jealousy: 68, hope: 79, stress: 80 };
      c.relationshipToPlayer = { trust: 14, affection: 25, attraction: 36, respect: 47, fear: 58, resentment: 69, dependency: 70, familiarity: 81 };
      c.health = 83;
    }
    expect(isLiveCharacterLifeSessionState(s)).toBe(true);
    const o = observeCharacterLife(s, null);
    expect(simulation.observeCharacterLife).toBe(observeCharacterLife);
    expect(simulation.executeCharacterLifeCommand).toBe(executeCharacterLifeCommand);
    contract(o);
    rendered(o.player, { ...s.player, role: 'player', postBuildingName: null });
    expect(o.player.relationship).toBeNull(); expect(o.player.traits).toEqual([]);
    expect(o.player.adult).toEqual({ intimacyKnowledge: null, intimateHistory: 'Not recorded' });
    o.npcs.forEach((n, i) => {
      const source = s.npcs[i];
      rendered(n, { character: source.character, profile: s.profiles[i], role: 'npc', postBuildingName: null });
      expect(n.relationship).toEqual(source.character.relationshipToPlayer);
      expect(n.traits).toEqual(source.traits.map(id => WORLD_TRAITS.find(t => t.id === id)));
      expect([n.age, n.occupation, n.socialClass, n.legalStatus]).toEqual([
        source.character.age, source.character.occupation, source.character.socialClass, source.character.legalStatus]);
      expect(n.postTileId).toBeNull(); expect(n.postLabel).toBe('Unassigned');
    });
    expect(o.npcs[0].profileRows.find(r => r.label === 'Measurements')?.value).toBe('Unknown');
    expect(o.npcs[0].adult.intimateHistory).toBe('Unknown');
    expect(o.lastReport).toBeNull();
  });

  it('changing undisclosed measurements/history changes no observation field', () => {
    const s = life(), changed = structuredClone(s), original = observeCharacterLife(freeze(s), null);
    changed.profiles[0].appearance.measurements = { chestCm: 91, waistCm: 72, hipsCm: 103, disclosure: 'unknown' };
    changed.profiles[0].private!.intimateHistory.value = 'none';
    expect(isLiveCharacterLifeSessionState(changed)).toBe(true);
    expect(observeCharacterLife(freeze(changed), null)).toEqual(original);
    contract(original);
  });

  it('known measurements appear only in the Measurements row; adult knowledge includes zero', () => {
    const s = life();
    s.profiles[0].appearance.measurements!.disclosure = 'known';
    s.profiles[0].traits.intimacyKnowledge = 0;
    s.player.profile.appearance.measurements = { chestCm: 91, waistCm: 72, hipsCm: 103, disclosure: 'known' };
    s.player.profile.traits.intimacyKnowledge = 37;
    s.player.profile.private = { intimateHistory: { value: 'some', disclosure: 'known' } };
    expect(isLiveCharacterLifeSessionState(s)).toBe(true);
    const o = observeCharacterLife(s, null);
    expect(o.npcs[0].profileRows.filter(r => r.label === 'Measurements')).toEqual([{ label: 'Measurements', value: '63 / 47 / 169 cm' }]);
    expect(o.player.profileRows.filter(r => r.label === 'Measurements')).toEqual([{ label: 'Measurements', value: '91 / 72 / 103 cm' }]);
    expect(o.npcs[0].adult.intimacyKnowledge).toBe(0);
    expect(o.player.adult).toEqual({ intimacyKnowledge: 37, intimateHistory: 'Some' });
    contract(o);
    const unknown = structuredClone(s);
    unknown.profiles[0].appearance.measurements!.disclosure = 'unknown';
    delete unknown.player.profile.appearance.measurements;
    expect(isLiveCharacterLifeSessionState(unknown)).toBe(true);
    const hidden = observeCharacterLife(unknown, null);
    for (const c of [o.npcs[0], o.player]) c.profileRows.find(r => r.label === 'Measurements')!.value = 'Unknown';
    expect(o).toEqual(hidden);
  });

  it.each([
    [undefined, 'Not recorded'],
    [{ value: 'some', disclosure: 'unknown' }, 'Unknown'],
    [{ value: 'none', disclosure: 'known' }, 'None'],
    [{ value: 'some', disclosure: 'known' }, 'Some'],
  ] as const)('history projects %j to %s', (history, expected) => {
    const s = life();
    if (history) s.profiles[0].private = { intimateHistory: { ...history } };
    else delete s.profiles[0].private;
    expect(isLiveCharacterLifeSessionState(s)).toBe(true);
    const o = observeCharacterLife(s, null);
    expect(o.npcs[0].adult.intimateHistory).toBe(expected);
    contract(o);
  });

  it('changing hidden seeds and feature placement preserves the entire observation', () => {
    const s = life();
    s.outside.tiles[0].knownBy = ['player', 'ai-1'];
    s.outside.tiles[10].owner = 'player'; s.outside.tiles[10].knownBy = ['player'];
    expect(isLiveCharacterLifeSessionState(s)).toBe(true);
    const changed = structuredClone(s);
    changed.outside.seed = 987654321;
    changed.city.world.worldMetadata.worldSeed = 123456789;
    const occupied = changed.outside.tiles.findIndex((t, i) => i >= 10 && t.feature !== null);
    const vacant = changed.outside.tiles.findIndex((t, i) => i >= 10 && t.feature === null);
    expect(occupied).toBeGreaterThanOrEqual(10); expect(vacant).toBeGreaterThanOrEqual(10);
    [changed.outside.tiles[occupied].feature, changed.outside.tiles[vacant].feature] =
      [changed.outside.tiles[vacant].feature, changed.outside.tiles[occupied].feature];
    changed.outside.tiles[11].knownBy = ['ai-2'];
    expect(isLiveCharacterLifeSessionState(changed)).toBe(true);
    const o = observeCharacterLife(s, null);
    expect(o.outside).toEqual({ total: 90, mine: 1, others: 10, neutral: 79, explored: 2 });
    expect(o.outside).toEqual(summarizeOutside(s.outside, 'player'));
    expect(observeCharacterLife(changed, null)).toEqual(o);
    contract(o);
  });
});

describe('actionable catalogues and phase controls', () => {
  it('projects every tile, offered building field, exact units and initial free labels', () => {
    const s = life(), city = s.city, settlement = city.world.settlements[city.world.activeSettlementId!];
    settlement.inventory = { gold: 30001, wheat: 2026, food: 4003, wood: 8004, iron: 4005 };
    expect(isLiveCharacterLifeSessionState(s)).toBe(true);
    const o = observeCharacterLife(s, null);
    expect([o.week, o.phase, o.revision]).toEqual([city.world.week, city.phase, city.revision]);
    expect(o.tiles).toEqual(city.tiles.map(t => ({ id: t.id, terrain: t.terrain, building: t.building && {
      typeId: t.building.typeId, level: t.building.level, workers: t.building.workers, enabled: t.building.enabled } })));
    expect(o.buildings.map(b => b.typeId)).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'market']);
    expect(o.buildings.map(b => b.typeId)).toEqual(Object.keys(TRIAL_BUILDINGS));
    o.buildings.forEach(b => {
      const d = TRIAL_BUILDINGS[b.typeId];
      expect(b).toEqual({ typeId: b.typeId, name: d.name, cost: { gold: d.cost.gold, wood: d.cost.wood, iron: d.cost.iron },
        terrain: d.terrain, maxLevel: d.maxLevel, maxWorkers: d.maxWorkers, upkeepMilli: d.upkeepMilli });
    });
    expect(o.settlement).toEqual({ stocks: { gold: 30001, wheat: 2026, food: 4003, wood: 8004, iron: 4005 },
      residents: 100, workforceMilli: weeklyWorkforceMilli(settlement.cohorts), assignedWorkers: 4, happiness: city.happiness });
    expect(o.settlement.residents).toBe(settlement.cohorts.reduce((sum, c) => sum + c.count, 0));
    expect(o.settlement.assignedWorkers).toBe(city.tiles.reduce((sum, t) => sum + (t.building?.workers ?? 0), 0));
    expect(o.settlement.stocks.gold / 1000).toBe(30.001);
    expect(o.actionTypes).toEqual(planningActions); expect(o.disabledReasons).toEqual([]);
    expect(o.freeManagerSlots).toEqual([
      { tileId: 'field-1', label: 'Manager — Farm (field-1)' },
      { tileId: 'plain-1', label: 'Manager — Food Processor (plain-1)' },
    ]);
    contract(o);
  });

  it('ASSIGN removes the occupied slot; REPLACE clears the post and restores its new label', () => {
    let s = life();
    s = act(s, { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-1' }).next;
    const assigned = observeCharacterLife(s, null);
    expect(assigned.freeManagerSlots).toEqual([{ tileId: 'field-1', label: 'Manager — Farm (field-1)' }]);
    expect(assigned.npcs[0].postLabel).toBe('Manager — Food Processor (plain-1)');
    expect(assigned.npcs[0].postTileId).toBe('plain-1');
    rendered(assigned.npcs[0], { character: s.npcs[0].character, profile: s.profiles[0], role: 'npc', postBuildingName: 'Food Processor' });
    expect(assigned.freeManagerSlots.map(p => p.tileId)).toEqual(managerSlotTileIds(s.city).filter(id => !s.npcs.some(n => n.postTileId === id)));
    s = act(s, { type: 'REPLACE', tileId: 'plain-1', typeId: 'market' }).next;
    const replaced = observeCharacterLife(s, null);
    expect(replaced.npcs.map(n => n.postTileId)).toEqual([null, null, null]);
    expect(replaced.npcs[0].postLabel).toBe('Unassigned');
    expect(replaced.freeManagerSlots).toEqual([
      { tileId: 'field-1', label: 'Manager — Farm (field-1)' }, { tileId: 'plain-1', label: 'Manager — Market (plain-1)' },
    ]);
    expect(replaced.freeManagerSlots.map(p => p.tileId)).toEqual(managerSlotTileIds(s.city).filter(id => !s.npcs.some(n => n.postTileId === id)));
    rendered(replaced.npcs[0], { character: s.npcs[0].character, profile: s.profiles[0], role: 'npc', postBuildingName: null });
    contract(assigned); contract(replaced);
  });

  it('zero free posts gives no reason when all NPCs are assigned, but explains an unassigned card once', () => {
    let all = act(life(), { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }).next;
    for (const [i, tileId] of ['field-1', 'plain-1', 'forest-1'].entries()) {
      all = act(all, { type: 'ASSIGN_NPC', npcId: `npc_starter_${i + 1}`, tileId }).next;
    }
    expect(observeCharacterLife(all, null).freeManagerSlots).toEqual([]);
    expect(observeCharacterLife(all, null).disabledReasons).toEqual([]);
    let one = life();
    for (const [i, tileId] of ['field-1', 'plain-1'].entries()) {
      one = act(one, { type: 'ASSIGN_NPC', npcId: `npc_starter_${i + 1}`, tileId }).next;
    }
    expect(observeCharacterLife(one, null).freeManagerSlots).toEqual([]);
    expect(observeCharacterLife(one, null).disabledReasons).toEqual([noPost]);
    const none = life();
    none.city.tiles.forEach(t => { t.building = null; });
    expect(isLiveCharacterLifeSessionState(none)).toBe(true);
    expect(observeCharacterLife(none, null).disabledReasons).toEqual([noPost]);
    const report = act(none, { type: 'END_WEEK', expectedWeek: 1 });
    expect(observeCharacterLife(report.next, report.report!).disabledReasons).toEqual([checkpointLock, noPost]);
    expect(observeCharacterLife(report.next, report.report!).actionTypes).toEqual(['NEXT_WEEK']);
  });
});

function reportFixture(): TileTrialReport {
  return {
    week: 7, before: { gold: 11001, wheat: 12002, food: 13003, wood: 14004, iron: 15005 },
    after: { gold: 21001, wheat: 22002, food: 23003, wood: 24004, iron: 25005 },
    taxMilli: 31001, farmBatchGoldMilli: 32002, farmExtraUpkeepMilli: 33003, upkeepPaidMilli: 34004,
    unpaidUpkeepMilli: 35005, foodDemandMilli: 36006, foodConsumedMilli: 37007, happinessBefore: 71, happinessAfter: 72,
    goods: { demandMilli: 41001, servedMilli: 42002, fulfillmentBps: 4303, woodUsed: 44004, ironUsed: 45005, revenueMilli: 46006 },
    activities: ['Farm completed a batch.', 'Market served goods.'],
    immigration: { populationBefore: 101, arrivals: 3, populationAfter: 104,
      target: 150, usefulWorkerSlots: 17, renewableFoodMilli: 5000, reason: 'arrivals' },
  };
}

describe('detached complete visible report', () => {
  it('selects every visible report field while omitting hidden immigration inputs and reason', () => {
    const report = freeze(reportFixture()), o = observeCharacterLife(freeze(life()), report);
    expect(o.lastReport).toEqual({
      week: 7, before: { gold: 11001, wheat: 12002, food: 13003, wood: 14004, iron: 15005 },
      after: { gold: 21001, wheat: 22002, food: 23003, wood: 24004, iron: 25005 },
      taxMilli: 31001, farmBatchGoldMilli: 32002, farmExtraUpkeepMilli: 33003, upkeepPaidMilli: 34004,
      unpaidUpkeepMilli: 35005, foodDemandMilli: 36006, foodConsumedMilli: 37007, happinessBefore: 71, happinessAfter: 72,
      goods: { demandMilli: 41001, servedMilli: 42002, fulfillmentBps: 4303, woodUsed: 44004, ironUsed: 45005, revenueMilli: 46006 },
      activities: ['Farm completed a batch.', 'Market served goods.'], immigration: { populationBefore: 101, arrivals: 3, populationAfter: 104 },
    });
    contract(o);
    const absent = reportFixture(); delete absent.immigration;
    const without = observeCharacterLife(life(), absent);
    expect(Object.hasOwn(without.lastReport!, 'immigration')).toBe(false);
    contract(without);
    const changed = reportFixture();
    changed.immigration = { populationBefore: 101, arrivals: 3, populationAfter: 104,
      target: 200, usefulWorkerSlots: 19, renewableFoodMilli: 6000, reason: 'liquidity' };
    expect(observeCharacterLife(life(), changed)).toEqual(o);
  });

  it('keeps the real END_WEEK report after NEXT_WEEK and preserves frozen report inputs', () => {
    const result = act(life(), { type: 'END_WEEK', expectedWeek: 1 }), r = result.report!;
    expect(r).toBeDefined(); expect(Object.isFrozen(r)).toBe(true);
    const o = observeCharacterLife(result.next, r);
    expect([o.week, o.phase, o.revision]).toEqual([result.next.city.world.week, 'report', result.next.city.revision]);
    expect(o.actionTypes).toEqual(['NEXT_WEEK']); expect(o.disabledReasons).toEqual([checkpointLock]);
    expect(o.lastReport).toEqual({ week: r.week, before: r.before, after: r.after,
      taxMilli: r.taxMilli, farmBatchGoldMilli: r.farmBatchGoldMilli, farmExtraUpkeepMilli: r.farmExtraUpkeepMilli,
      upkeepPaidMilli: r.upkeepPaidMilli, unpaidUpkeepMilli: r.unpaidUpkeepMilli,
      foodDemandMilli: r.foodDemandMilli, foodConsumedMilli: r.foodConsumedMilli,
      happinessBefore: r.happinessBefore, happinessAfter: r.happinessAfter, goods: r.goods, activities: r.activities,
      immigration: { populationBefore: r.immigration!.populationBefore, arrivals: r.immigration!.arrivals, populationAfter: r.immigration!.populationAfter },
    });
    const next = act(result.next, { type: 'NEXT_WEEK' }).next, retained = observeCharacterLife(next, r);
    expect(retained.actionTypes).toEqual(planningActions); expect(retained.disabledReasons).toEqual([]);
    expect(retained.lastReport).toEqual(o.lastReport);
    expect(observeCharacterLife(next, null).lastReport).toBeNull();
    contract(o); contract(retained);
  });

  it('all mutable nested projections detach from the session, frozen report, catalogue and future observations', () => {
    const s = freeze(life()), r = freeze(reportFixture());
    const sessionBefore = structuredClone(s), reportBefore = structuredClone(r), catalogueBefore = structuredClone(TRIAL_BUILDINGS);
    const o = observeCharacterLife(s, r), original = structuredClone(o);
    o.settlement.stocks.gold = 0; o.buildings[0].cost.gold = 0; o.buildings[0].terrain.push('changed');
    o.tiles[0].building!.workers = 0; o.tiles[0].id = 'changed';
    for (const c of [o.player, ...o.npcs]) {
      c.profileRows[0].value = 'changed'; c.profileRows.push({ label: 'changed', value: 'changed' });
      c.stats.skills.technical = 0; c.stats.needs.safety = 0; c.stats.emotions.joy = 0;
      c.adult.intimacyKnowledge = 99;
    }
    o.player.traits.push({ id: 'changed', name: 'changed', summary: 'changed' });
    o.npcs[0].traits[0].name = 'changed'; o.npcs[0].traits.push({ id: 'changed', name: 'changed', summary: 'changed' });
    o.npcs[0].relationship!.trust = 0; o.freeManagerSlots[0].label = 'changed';
    o.freeManagerSlots.push({ tileId: 'changed', label: 'changed' }); o.outside.total = 0;
    o.lastReport!.before.gold = 0; o.lastReport!.after.food = 0; o.lastReport!.goods.revenueMilli = 0;
    o.lastReport!.activities.push('changed'); o.lastReport!.immigration!.arrivals = 0;
    o.actionTypes.length = 0; o.disabledReasons.push('changed');
    expect(s).toEqual(sessionBefore); expect(r).toEqual(reportBefore); expect(TRIAL_BUILDINGS).toEqual(catalogueBefore);
    expect(Object.isFrozen(r)).toBe(true); expect(Object.isFrozen(r.before)).toBe(true);
    expect(Object.isFrozen(r.goods)).toBe(true); expect(Object.isFrozen(r.activities)).toBe(true);
    expect(observeCharacterLife(s, r)).toEqual(original);
    contract(original);
  });
});
