import json from '../data/recipes.json' with { type: 'json' };
import { CatalogError, deepFreeze, validateRecipes } from '../data/validate.js';
import { ITEM_CATALOG, type MaterialFamily, type Rarity, type Slot } from './items.js';

export type RecipeKind = 'refine' | 'upgrade' | 'fixed';
export interface RecipeDefinition {
  kind: RecipeKind;
  workshops: ('smithy' | 'hospital' | 'drug-store')[];
  inputs: { defId: string; count: number }[];
  output: string;
  feeMilli: number;
}
export interface CraftTrial {
  marker: 'TRIAL';
  queueCap: number;
  skillSteps: number[];
  drugStoreBase: number;
  slotFamily: Record<Exclude<Slot, 'nipple' | 'vagina' | 'anus'>, MaterialFamily>;
  fees: {
    refine: Record<'rare' | 'epic', number>;
    upgrade: Record<'rare' | 'epic', number>;
    potion: Record<'1' | '2' | '3', number>;
  };
}
const data = validateRecipes(json);
export const RECIPES = deepFreeze(data.recipes);
export const CRAFT_TRIAL = deepFreeze(data.CRAFT_TRIAL);

export function recipeOutputTier(id: string): Rarity {
  if (!Object.hasOwn(RECIPES, id)) throw new CatalogError(`recipes.json#${id}`, 'id', 'unknown recipe id');
  return ITEM_CATALOG[RECIPES[id].output].rarity;
}
