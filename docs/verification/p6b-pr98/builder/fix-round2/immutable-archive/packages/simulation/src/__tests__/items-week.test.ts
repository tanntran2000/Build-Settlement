import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { createSocietyState, ITEM_CATALOG, ITEM_TRIAL, itemRandom, isItemsState, RESEARCH_TOPICS, type ItemWeekContext, type TileTrialState } from '@haven/core';
import { runTileTrialWeek } from '../tile-trial-week.js';

const skills = { management: 50, technical: 50, medical: 50, combat: 50, negotiation: 50 };
function context(ids: string[] = []): ItemWeekContext {
  return { postSkills: Object.fromEntries(ids.map(id => [id, { ...skills }])), postTraits: {}, playerSkills: { ...skills }, playerTraits: [], playerRegen: 0 };
}
function city(seed = 42, week = 1) {
  const s = createSocietyState();
  s.world.worldMetadata.worldSeed = seed; s.world.week = week;
  const stocks = s.world.settlements[s.world.activeSettlementId!].inventory;
  for (const key of ['gold', 'food', 'wood', 'iron'] as const) stocks[key] = 1_000_000;
  s.goodsStock!.amountMilli = 1_000_000;
  return s;
}
function seedFor(stream: 'find' | 'material', min: number, max: number) {
  for (let seed = 0; seed < 100_000; seed++) {
    const roll = Math.floor(itemRandom(seed, 1, stream)() * 10_000);
    if (roll >= min && roll < max) return seed;
  }
  throw Error('No seed in requested range');
}
const foundSeed = seedFor('find', 0, ITEM_TRIAL.findOddsBps.common);
function fill(s: TileTrialState, storage: boolean) {
  const items = s.society!.items;
  for (let i = 0; i < ITEM_TRIAL.inventoryCap; i++) items.inventory.push({ id: items.nextItemId++, defId: 'common-ring' });
  if (storage) for (let i = 0; i < ITEM_TRIAL.storageCap; i++) items.storage.push({ item: { id: items.nextItemId++, defId: 'common-ring' }, expiresWeek: 10 });
}

it('repeats the complete find, material, goal and next-week Market result for the same seed/week', () => {
  const a = city(foundSeed), b = structuredClone(a);
  a.society!.items.goals.rebellionSeen = b.society!.items.goals.rebellionSeen = true;
  const first = runTileTrialWeek(a, context(['field-1'])), second = runTileTrialWeek(b, context(['field-1']));
  expect(first.items).toBeDefined(); expect(first.items).toEqual(second.items); expect(a).toEqual(b);
  expect(a.society!.items.market.map(o => ITEM_CATALOG[o.defId].rarity)).toEqual(['common','common','common','common','rare','rare','epic','epic']);
  expect(a.society!.items.market).not.toEqual(createSocietyState().society!.items.market);
  expect(first.items.legendary).toMatchObject({ goal: 'calm' });
});

it.each([
  ['common', 0, 2500], ['rare', 2500, 3500], ['epic', 3500, 4100], ['nothing', 4100, 10_000],
] as const)('uses the catalog find odds for %s', (rarity, min, max) => {
  const s = city(seedFor('find', min, max)), r = runTileTrialWeek(s);
  expect([ITEM_TRIAL.findOddsBps.common, ITEM_TRIAL.findOddsBps.rare, ITEM_TRIAL.findOddsBps.epic]).toEqual([2500,1000,600]);
  if (rarity === 'nothing') expect(r.items.found).toBeNull();
  else { expect(r.items.found).toMatchObject({ stored: false, lost: false }); expect(ITEM_CATALOG[r.items.found!.defId].rarity).toBe(rarity); }
  expect(isItemsState(s.society!.items, ['player'])).toBe(true);
});

it.each([
  ['logging','forest-1'], ['mine','ore-1'], ['quarry','rock-1'], ['sheep-pasture','pasture-1'], ['herb-garden','meadow-1'], ['weaver','plain-2'],
] as const)('allows posted material drops only from the %s catalog pool', (typeId, tileId) => {
  const s = city(seedFor('material', 0, ITEM_TRIAL.materialOddsBps.common));
  const tile = s.tiles.find(t => t.id === tileId)!;
  tile.building = { typeId, level: 1, workers: 0, enabled: true };
  const r = runTileTrialWeek(s, context([tileId]));
  expect(r.items.materials).toHaveLength(1);
  const drop = r.items.materials[0];
  expect(drop).toMatchObject({ tileId, lost: false }); expect(ITEM_CATALOG[drop.materialId].building).toContain(typeId);
  expect(s.society!.items.materials[drop.materialId]).toBe(1);
});

it('does not draw drops for unposted buildings, unsupported buildings, or an absent rarity', () => {
  const seed = seedFor('material', 2800, 2850), s = city(seed);
  s.tiles.find(t => t.id === 'forest-1')!.building = { typeId: 'logging', level: 1, workers: 2, enabled: true };
  expect(runTileTrialWeek(s).items.materials).toEqual([]);
  const absent = city(seed);
  absent.tiles.find(t => t.id === 'meadow-1')!.building = { typeId: 'herb-garden', level: 1, workers: 0, enabled: true };
  expect(runTileTrialWeek(absent, context(['meadow-1', 'field-1'])).items.materials).toEqual([]);
});

it('reports a drop lost at a 999 stack without changing unrelated stocks', () => {
  const s = city(seedFor('material', 0, 2000));
  s.tiles.find(t => t.id === 'forest-1')!.building = { typeId: 'logging', level: 1, workers: 0, enabled: true };
  const id = Object.keys(ITEM_CATALOG).find(id => ITEM_CATALOG[id].category === 'material' && ITEM_CATALOG[id].rarity === 'common' && ITEM_CATALOG[id].building!.includes('logging'))!;
  s.society!.items.materials[id] = ITEM_TRIAL.stackCap;
  const control = structuredClone(s), r = runTileTrialWeek(s, context(['forest-1'])); runTileTrialWeek(control);
  expect(r.items.materials).toEqual([{ tileId: 'forest-1', materialId: id, lost: true }]);
  expect(s.society!.items.materials[id]).toBe(999); expect(s.world.settlements).toEqual(control.world.settlements);
});

it('puts a find in temporary storage when the inventory is full', () => {
  const s = city(foundSeed); fill(s, false);
  const r = runTileTrialWeek(s);
  expect(r.items.found).toMatchObject({ stored: true, lost: false });
  expect(s.society!.items.storage).toEqual([{ item: { id: 51, defId: r.items.found!.defId }, expiresWeek: 4 }]);
  expect(isItemsState(s.society!.items, ['player'])).toBe(true);
});
it('loses a find before expiring full storage, without spending gold or allocating an id', () => {
  const s = city(foundSeed); fill(s, true);
  s.society!.items.storage.forEach(e => e.expiresWeek = 1);
  const control = structuredClone(s), nextId = s.society!.items.nextItemId;
  const r = runTileTrialWeek(s); runTileTrialWeek(control);
  expect(r.items.found).toMatchObject({ stored: false, lost: true });
  expect(r.items.expired).toEqual(Array(10).fill('common-ring'));
  expect(s.society!.items.storage).toEqual([]); expect(s.society!.items.nextItemId).toBe(nextId);
  expect(s.world.settlements).toEqual(control.world.settlements);
});
it('expires an unclaimed item after exactly three weeks', () => {
  const s = city(42, 3); s.society!.items.nextItemId = 2;
  s.society!.items.storage = [{ item: { id: 1, defId: 'common-ring' }, expiresWeek: 4 }];
  expect(runTileTrialWeek(s).items.expired).toEqual([]);
  s.phase = 'planning'; expect(runTileTrialWeek(s).items.expired).toEqual(['common-ring']);
  expect(s.society!.items.storage).toEqual([]);
});

it.each(['calm','authority','week52','research'] as const)('awards the %s Legendary goal exactly once, excluding owned definitions', goal => {
  const s = city(42, goal === 'week52' ? 52 : 1), items = s.society!.items;
  const owned = Object.keys(ITEM_CATALOG).find(id => ITEM_CATALOG[id].rarity === 'legendary' && ITEM_CATALOG[id].category !== 'material')!;
  items.inventory.push({ id: items.nextItemId++, defId: owned });
  if (goal === 'calm') items.goals.rebellionSeen = true;
  if (goal === 'research') s.society!.research.completed = [...RESEARCH_TOPICS];
  let awarded: ReturnType<typeof runTileTrialWeek>['items']['legendary'] = null;
  for (let i = 0; i < (goal === 'authority' ? 4 : 1); i++) {
    if (goal === 'authority') s.society!.order.authority = 100;
    const r = runTileTrialWeek(s); s.phase = 'planning';
    if (goal === 'authority' && i < 3) expect(r.items.legendary).toBeNull();
    awarded = r.items.legendary;
  }
  expect(awarded).toMatchObject({ goal }); expect(awarded!.defId).not.toBe(owned);
  expect(ITEM_CATALOG[awarded!.defId].rarity).toBe('legendary'); expect(s.society!.items.goals[goal]).toBe(true);
  const next = runTileTrialWeek(s); expect(next.items.legendary).toBeNull();
  expect(s.society!.items.inventory.filter(i => i.defId === awarded!.defId)).toHaveLength(1);
});
it('remembers rebellion and resets the Authority streak below 90', () => {
  const s = city(); s.society!.crisis.stage = 'rebellion'; s.society!.items.goals.authorityStreak = 3;
  const r = runTileTrialWeek(s);
  expect(r.items.legendary).toBeNull(); expect(s.society!.items.goals.rebellionSeen).toBe(true);
  expect(s.society!.items.goals.authorityStreak).toBe(0);
});

// Captured from unmodified PR A head 5e9674e before the B1 implementation.
const baseline: Record<number, string> = {
  0: '4ba36423f0b05c8c696bedf7195101a669184ce344227c5573be7b229ea75b7a',
  42: 'dcdce3552130d92971b254f1c4fb15bfb41da44b7946293c57d099949fd6be14',
  20261028: '8145e422ca8691852501facec33098d76bf33061b8196536b73fc64aa8522177',
};
it.each([0,42,20261028])('preserves PR A crime, crisis, order and law reports for 60 weeks at seed %i', seed => {
  const s = city(seed), reports = [];
  for (let i = 0; i < 60; i++) {
    const r = runTileTrialWeek(s); s.phase = 'planning';
    reports.push({ crime: r.crimeEvent, crisis: r.crisis, order: r.order, laws: r.laws });
  }
  const hash = createHash('sha256').update(JSON.stringify(reports)).digest('hex');
  console.log('PR_A_REPORT_BASELINE', seed, hash);
  expect(hash).toBe(baseline[seed]);
});
