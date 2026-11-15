import { describe, expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, ITEM_CATALOG, RECIPES, type CharacterLifeSessionState } from '@haven/core';
import * as view from '../items-view.js';

function life() {
  const made = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!made.success) throw Error(made.error.message);
  const s = made.value;
  stock(s).gold = 100000;
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
