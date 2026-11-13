import json from '../data/items.json' with { type: 'json' };
import { deepFreeze, validateItems } from '../data/validate.js';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Category = 'material' | 'equipment' | 'accessory' | 'outfit' | 'consumable';
export type Slot = 'weapon' | 'earrings' | 'necklace' | 'ring' | 'hand' | 'top' | 'bottom' | 'shoes' | 'set' | 'nipple' | 'vagina' | 'anus';
export type Skill = 'management' | 'technical' | 'medical' | 'combat' | 'negotiation';
export type Skills = Record<Skill, number>;
export interface ItemDefinition {
  name: string; category: Category; rarity: Rarity; kind?: 'player' | 'npc'; slot?: Slot;
  mainStat?: Skill; secondaryStat?: Skill; regen?: number; exclusiveClass?: string;
  trait?: string; basePriceMilli: number; building?: string[];
}
export interface ItemTrial {
  marker: 'TRIAL'; bonuses: Record<Rarity,{main:number;secondary:number;regen:number}>;
  setMultiplier:number; marketCounts:Record<'common'|'rare'|'epic',number>;
  marketPricesMilli:Record<'common'|'rare'|'epic',number>; resaleBps:number;
  potionPricesMilli:Record<'1'|'2'|'3',number>; potionHeal:Record<'1'|'2'|'3',number>;
  findOddsBps:Record<'common'|'rare'|'epic',number>; materialOddsBps:Record<Rarity,number>;
  stackCap:number; inventoryCap:number; consumableCap:number; storageCap:number; storageWeeks:number;
  effects:{threshold:number;outputStep:number;outputPercent:number;outputCapPercent:number;securityStep:number;securityCap:number;authorityStep:number;marketStep:number;marketCapPercent:number;fatalStep:number;fatalCap:number;woundStep:number;woundFloor:number;wardenSecurity:number;crownAuthority:number;ironhideWoundReduction:number;ledgerOutputPercent:number};
}
const catalog = validateItems(json);
export const ITEM_CATALOG = deepFreeze(catalog.definitions);
export const ITEM_TRIAL = deepFreeze(catalog.ITEM_TRIAL);
