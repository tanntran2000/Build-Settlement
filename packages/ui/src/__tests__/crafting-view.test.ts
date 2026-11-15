import { describe, expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, ITEM_CATALOG, RECIPES, type CharacterLifeSessionState, type ItemWeekReport, type TileTrialReport } from '@haven/core';
import * as view from '../items-view.js';
import { reportLetters } from '../report-letters.js';
import { executeCharacterLifeCommand } from '@haven/simulation';

function life() {
  const made = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!made.success) throw Error(made.error.message);
  const s = made.value;
  stock(s).gold = 100000;
  s.city.society!.stocksMilli.herbs = 10000;
  for (const [id, typeId, workers] of [['spec-2', 'smithy', 1], ['service-1', 'hospital', 2], ['slum-1', 'drug-store', 0]] as const) {
    s.city.tiles.find(t => t.id === id)!.building = { typeId, level: 1, workers, enabled: true };
  }
  return s;
}
const stock = (s: CharacterLifeSessionState) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
const items = (s: CharacterLifeSessionState) => s.city.society!.items;
function supply(s: CharacterLifeSessionState, recipeId: string) {
  for (const input of RECIPES[recipeId].inputs) {
    if (ITEM_CATALOG[input.defId].category === 'material') items(s).materials[input.defId] = input.count;
    else {
      const item = { id: items(s).nextItemId++, defId: input.defId };
      (ITEM_CATALOG[input.defId].category === 'consumable' ? items(s).consumables : items(s).inventory).push(item);
    }
  }
}

describe('C1 crafting recipe projection', () => {
  it('lists only owned and affordable Smithy recipes, grouped Refine / Upgrade without mutation', () => {
    const s = life(); supply(s, 'refine-silver'); supply(s, 'upgrade-rare-ring-player');
    const before = JSON.stringify(s);
    const rows = view.craftingRecipes(s.city, 'spec-2');
    expect(rows.map(r => [r.recipeId, r.group])).toEqual([['refine-silver', 'Refine'], ['upgrade-rare-ring-player', 'Upgrade']]);
    expect(rows[1]).toMatchObject({ before: 'common-ring', output: 'rare-ring-player', feeMilli: 3000, inputs: RECIPES['upgrade-rare-ring-player'].inputs });
    expect(JSON.stringify(s)).toBe(before);
    stock(s).gold = 999;
    expect(view.craftingRecipes(s.city, 'spec-2')).toEqual([]);
  });
  it.each(Object.keys(RECIPES))('offers catalog recipe %s only at its workshop, with exact single-order fields', recipeId => {
    const s = life(), recipe = RECIPES[recipeId]; supply(s, recipeId);
    const tileId = recipe.workshops[0] === 'smithy' ? 'spec-2' : 'service-1';
    const row = view.craftingRecipes(s.city, tileId).find(r => r.recipeId === recipeId)!;
    expect(row).toBeDefined();
    const item = [...items(s).inventory, ...items(s).consumables][0];
    expect(row.fields).toEqual({ tileId, recipeId, ...(item ? { itemId: item.id } : {}) });
    expect(row.inputs).toEqual(recipe.inputs); expect(row.output).toBe(recipe.output); expect(row.feeMilli).toBe(recipe.feeMilli);
    expect(view.craftingRecipes(s.city, tileId === 'spec-2' ? 'service-1' : 'spec-2').some(r => r.recipeId === recipeId)).toBe(false);
  });
  it('excludes equipped, stored and held items and chooses the lowest owned instance id', () => {
    const s = life(); items(s).materials.nitrate = 1;
    items(s).equipped.player = { ring: { id: 1, defId: 'common-ring' } };
    items(s).storage = [{ item: { id: 2, defId: 'common-ring' }, expiresWeek: 3 }];
    items(s).workshops = { 'spec-2': { orders: [{ recipeId: 'upgrade-rare-ring-player', items: [{ id: 3, defId: 'common-ring' }], materials: { nitrate: 1 }, feeMilli: 3000 }], ready: [] } };
    expect(view.craftingRecipes(s.city, 'spec-2')).toEqual([]);
    items(s).inventory = [{ id: 5, defId: 'common-ring' }, { id: 4, defId: 'common-ring' }];
    expect(view.craftingRecipes(s.city, 'spec-2')[0].fields).toEqual({ tileId: 'spec-2', recipeId: 'upgrade-rare-ring-player', itemId: 4 });
  });
  it('allows Brew placement without staffing, Herbs stock or upkeep, but not without the fee', () => {
    const s = life(); supply(s, 'brew-heal-potion-1');
    s.city.tiles.find(t => t.id === 'service-1')!.building!.workers = 0;
    s.city.society!.stocksMilli.herbs = 0; stock(s).gold = 1000;
    expect(view.potionShop(s.city, 'service-1')).toBe(false);
    for (const tileId of ['service-1', 'slum-1']) expect(view.craftingRecipes(s.city, tileId).map(r => r.recipeId)).toContain('brew-heal-potion-1');
    stock(s).gold = 999; expect(view.craftingRecipes(s.city, 'service-1')).toEqual([]);
  });
  it('hides placement recipes for absent/paused workshops and a full queue', () => {
    const s = life(); supply(s, 'refine-silver');
    expect(view.craftingRecipes(s.city, 'missing')).toEqual([]);
    s.city.tiles.find(t => t.id === 'spec-2')!.building!.enabled = false;
    expect(view.craftingRecipes(s.city, 'spec-2')).toEqual([]);
    s.city.tiles.find(t => t.id === 'spec-2')!.building!.enabled = true;
    items(s).workshops = { 'spec-2': { orders: Array.from({ length: 6 }, () => ({ recipeId: 'refine-silver', items: [], materials: { iron: 2 }, feeMilli: 1000 })), ready: [] } };
    expect(view.craftingRecipes(s.city, 'spec-2')).toEqual([]);
  });
});

describe('C1 workshop capacity and errors', () => {
  it.each([[0, 100, 0], [1, 59, 1], [1, 60, 2], [1, 79, 2], [1, 80, 3]])('Smithy workers %i, technical %i gives %i capacity', (workers, skill, expected) => {
    const s = life(), npc = s.npcs[0]; npc.postTileId = 'spec-2'; npc.character.skills.technical = skill;
    s.city.tiles.find(t => t.id === 'spec-2')!.building!.workers = workers;
    expect(view.workshopCapacity(s.city, s.npcs, 'spec-2')).toBe(expected);
  });
  it('counts effective posted skill including worn gear and never another NPC or the Player', () => {
    const s = life(), npc = s.npcs[0]; npc.postTileId = 'spec-2'; npc.character.skills.technical = 59;
    const gear = Object.entries(ITEM_CATALOG).find(([, d]) => d.kind === 'npc' && d.rarity === 'common' && d.mainStat === 'technical')!;
    items(s).equipped[npc.character.id] = { [gear[1].slot!]: { id: 1, defId: gear[0] } };
    const before = JSON.stringify(s);
    expect(view.workshopCapacity(s.city, s.npcs, 'spec-2')).toBe(2); expect(JSON.stringify(s)).toBe(before);
    npc.postTileId = null; expect(view.workshopCapacity(s.city, s.npcs, 'spec-2')).toBe(1);
  });
  it('requires full Hospital staffing, uses medical steps, and gives worker-free Drug Store base one', () => {
    const s = life(), npc = s.npcs[0]; npc.postTileId = 'service-1'; npc.character.skills.medical = 80;
    expect(view.workshopCapacity(s.city, s.npcs, 'service-1')).toBe(4);
    s.city.tiles.find(t => t.id === 'service-1')!.building!.workers = 1;
    expect(view.workshopCapacity(s.city, s.npcs, 'service-1')).toBe(0);
    expect(view.workshopCapacity(s.city, s.npcs, 'slum-1')).toBe(1);
    npc.postTileId = 'slum-1'; expect(view.workshopCapacity(s.city, s.npcs, 'slum-1')).toBe(3);
    s.city.tiles.find(t => t.id === 'slum-1')!.building!.enabled = false;
    expect(view.workshopCapacity(s.city, s.npcs, 'slum-1')).toBe(0);
    expect(view.workshopCapacity(s.city, s.npcs, 'missing')).toBe(0);
  });
  it.each([
    ['RECIPE_UNKNOWN', 'This recipe is no longer available.'],
    ['NO_WORKSHOP', 'Choose an enabled workshop for this recipe.'],
    ['MISSING_INPUT', 'The required inputs are no longer available.'],
    ['QUEUE_FULL', 'The workshop queue is full.'],
    ['ORDER_UNKNOWN', 'This order is no longer available.'],
    ['WORKSHOP_BUSY', 'Cancel orders and make room for ready outputs before replacing this workshop.'],
  ])('shows the specific command error %s', (code, message) => expect(view.itemError(code)).toBe(message));
});

describe('C2 Smithy hints', () => {
  it.each(Object.entries(ITEM_CATALOG))('gives only upgradeable Smithy wearables their exact next material: %s', (id, definition) => {
    const recipe = definition.slot ? Object.values(RECIPES).find(r => r.kind === 'upgrade' && r.workshops.includes('smithy') && r.inputs.some(i => i.defId === id)) : undefined;
    const material = recipe?.inputs.find(i => ITEM_CATALOG[i.defId].category === 'material');
    const hint = view.craftingHint(definition);
    if (material) expect(hint).toBe(`Can upgrade at the Smithy · Needs ${material.count} ${ITEM_CATALOG[material.defId].name} (${view.itemTitle(ITEM_CATALOG[material.defId].rarity)}).`);
    else expect(hint).toBeNull();
  });
});

describe('C2 crafting Quartermaster rows', () => {
  const legacy: ItemWeekReport = { materials: [], found: null, expired: [], legendary: null, hospitalOperated: false, regen: 1 };
  const crafted: NonNullable<ItemWeekReport['crafted']> = [
    { tileId: 'spec-2', recipeId: 'upgrade-rare-ring-player', output: 'rare-ring-player', place: 'inventory' },
    { tileId: 'spec-2', recipeId: 'refine-silver', output: 'silver', place: 'materials' },
    { tileId: 'service-1', recipeId: 'brew-heal-potion-1', output: 'heal-potion-1', place: 'consumables' },
    { tileId: 'service-1', recipeId: 'upgrade-heal-potion-2', output: 'heal-potion-2', place: 'storage' },
    { tileId: 'spec-2', recipeId: 'refine-nitrate', output: 'nitrate', place: 'ready' },
  ];
  it('names crafted, refined, brewed, waiting and idle events with every exact destination, without mutation', () => {
    const report = { ...legacy, crafted, workshopsIdle: ['slum-1'] }, before = JSON.stringify(report);
    expect(view.itemReportRows(report, 'quartermaster')).toEqual([
      { label: 'Item crafted', value: "Lord's Fine Ring · spec-2 · Inventory", tone: 'gain' },
      { label: 'Material refined', value: 'Silver · spec-2 · Material stack', tone: 'gain' },
      { label: 'Potion brewed', value: 'Heal Potion I · service-1 · Potion inventory', tone: 'gain' },
      { label: 'Potion brewed', value: 'Heal Potion II · service-1 · Temporary storage', tone: 'gain' },
      { label: 'Waiting for room', value: 'Nitrate · spec-2 · Waiting for room', tone: 'loss' },
      { label: 'Workshop idle', value: 'slum-1 · No orders completed. Check workers, supplies and upkeep.', tone: 'loss' },
    ]);
    expect(JSON.stringify(report)).toBe(before);
    expect(view.itemReportRows(report, 'steward')).toEqual([]);
  });
  it('adds no rows for a legacy report or empty optional fields', () => {
    expect(view.itemReportRows(legacy, 'quartermaster')).toEqual([]);
    expect(view.itemReportRows({ ...legacy, crafted: [], workshopsIdle: [] }, 'quartermaster')).toEqual([]);
  });
  it('keeps the four-row summary cap while leaving all source details intact', () => {
    const report = { items: { ...legacy, crafted, workshopsIdle: ['slum-1'] }, before: { gold: 0 }, after: { gold: 0 }, taxMilli: 0, upkeepPaidMilli: 0, unpaidUpkeepMilli: 0, foodConsumedMilli: 0, foodDemandMilli: 0, goods: { servedMilli: 0, demandMilli: 0 }, happinessBefore: 50, happinessAfter: 50 } as TileTrialReport;
    const before = JSON.stringify(report), letters = reportLetters(report), quartermaster = letters.find(l => l.id === 'quartermaster')!;
    expect(quartermaster.rows).toHaveLength(4);
    expect(quartermaster.rows.map(r => r.label)).toEqual(['Item crafted', 'Material refined', 'Waiting for room', 'Workshop idle']);
    expect(report.items.crafted).toHaveLength(5); expect(JSON.stringify(report)).toBe(before);
  });
});

describe('F1 weekly workshop operation forecast', () => {
  function operatingLife() {
    const s = life();
    s.city.society!.classes.free = 37; s.city.society!.classes.makers.common = 30; s.city.society!.classes.luminaries.common = 20;
    return s;
  }
  it('gives a fully staffed funded Hospital zero and a reason when no Herbs can arrive', () => {
    const s = operatingLife(); s.city.society!.stocksMilli.herbs = 0;
    expect(view.workshopCapacity(s.city, [], 'service-1')).toBe(0);
    expect(view.workshopForecast(s.city, [], 'service-1')).toEqual({ capacity: 0, reason: 'Idle this week: not enough Herbs.' });
  });
  it.each(['spec-2', 'service-1', 'slum-1'])('gives unfunded %s zero and an upkeep reason', tileId => {
    const s = operatingLife(); stock(s).gold = 0; s.city.society!.stocksMilli.herbs = 10000;
    expect(view.workshopCapacity(s.city, [], tileId)).toBe(0);
    expect(view.workshopForecast(s.city, [], tileId)).toEqual({ capacity: 0, reason: 'Idle this week: upkeep unpaid.' });
  });
  it('uses workers and effective medical steps when the Hospital is funded and supplied', () => {
    const s = operatingLife(); s.city.society!.stocksMilli.herbs = 1000;
    const npc = s.npcs[0]; npc.postTileId = 'service-1'; npc.character.skills.medical = 80;
    expect(view.workshopForecast(s.city, s.npcs, 'service-1')).toEqual({ capacity: 4, reason: null });
  });
  it('gives funded worker-free Drug Store base one', () => {
    const s = operatingLife();
    expect(view.workshopForecast(s.city, [], 'slum-1')).toEqual({ capacity: 1, reason: null });
  });
  it('uses same-week Herb output before Hospital consumption, independent of tile placement order', () => {
    const s = operatingLife(); s.city.society!.stocksMilli.herbs = 0;
    s.city.society!.wallRing = 2;
    s.city.society!.outside['meadow-1'].wild = false;
    s.city.tiles.find(t => t.id === 'meadow-1')!.building = { typeId: 'herb-garden', level: 1, workers: 2, enabled: true };
    const herb = s.city.tiles.findIndex(t => t.id === 'meadow-1'); s.city.tiles.push(...s.city.tiles.splice(herb, 1));
    const before = JSON.stringify(s);
    expect(view.workshopForecast(s.city, [], 'service-1')).toEqual({ capacity: 2, reason: null });
    expect(JSON.stringify(s)).toBe(before);
  });
  it('allocates Herbs to fully staffed Hospitals in tile order and excludes paused producers', () => {
    const s = operatingLife(); s.city.society!.stocksMilli.herbs = 1000;
    s.city.tiles.find(t => t.id === 'service-2')!.building = { typeId: 'hospital', level: 1, workers: 2, enabled: true };
    expect(view.workshopForecast(s.city, [], 'service-1')).toEqual({ capacity: 2, reason: null });
    expect(view.workshopForecast(s.city, [], 'service-2')).toEqual({ capacity: 0, reason: 'Idle this week: not enough Herbs.' });
    s.city.society!.stocksMilli.herbs = 0;
    s.city.tiles.find(t => t.id === 'plain-2')!.building = { typeId: 'herb-garden', level: 1, workers: 2, enabled: false };
    expect(view.workshopCapacity(s.city, [], 'service-1')).toBe(0);
  });
  it('credits this-week tax before upkeep, so zero opening Gold need not mean idle', () => {
    const s = operatingLife(); stock(s).gold = 0;
    for (const tile of s.city.tiles) if (tile.building && tile.id !== 'slum-1') tile.building.enabled = false;
    expect(view.workshopForecast(s.city, [], 'slum-1')).toEqual({ capacity: 1, reason: null });
  });
  it.each(['no-herbs', 'supplied', 'same-week-herbs', 'unfunded', 'drug-funded', 'drug-unfunded'])('matches actual End Week throughput for %s without changing the input', scenario => {
    let s = operatingLife();
    const tileId = scenario.startsWith('drug-') ? 'slum-1' : 'service-1';
    s.city.society!.items.materials['green-leaf'] = 12;
    for (let index = 0; index < 6; index++) {
      const result = executeCharacterLifeCommand(s, { type: 'PLACE_CRAFT_ORDER', expectedRevision: s.city.revision, tileId, recipeId: 'brew-heal-potion-1' });
      if (!result.success) throw Error(result.error.message); s = result.next;
    }
    s.city.society!.stocksMilli.herbs = scenario === 'no-herbs' || scenario === 'same-week-herbs' ? 0 : 1000;
    if (scenario.includes('unfunded')) stock(s).gold = 0;
    if (scenario === 'same-week-herbs') {
      s.city.society!.wallRing = 2;
      const tile = s.city.tiles.find(t => t.id === 'meadow-1')!; tile.building = { typeId: 'herb-garden', level: 1, workers: 2, enabled: true };
      Object.assign(s.city.society!.outside['meadow-1'], { wild: false, clearMilli: 4000 });
      s.city.tiles.find(t => t.id === 'field-1')!.building!.workers = 1;
    }
    const before = JSON.stringify(s), forecast = view.workshopForecast(s.city, s.npcs, tileId);
    expect(JSON.stringify(s)).toBe(before);
    const resolved = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: s.city.world.week });
    if (!resolved.success) throw Error(`Parity fixture: ${resolved.error.code}: ${resolved.error.message}`);
    if (!resolved.report) throw Error('Parity fixture did not produce a report');
    expect(resolved.report.items.crafted?.filter(row => row.tileId === tileId).length ?? 0).toBe(forecast.capacity);
    expect(!!resolved.report.items.workshopsIdle?.includes(tileId)).toBe(forecast.capacity === 0);
  });
});
