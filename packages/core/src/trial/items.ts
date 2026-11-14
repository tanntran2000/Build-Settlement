import json from '../data/items.json' with { type: 'json' };
import { deepFreeze, validateItems } from '../data/validate.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { readDenseArray } from '../world/arrays.js';
import { createSeededRandom } from '../world/random.js';
import { mixSeed } from './crime.js';
import type { CharacterLifeSessionState } from '../character/types.js';

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

export interface ItemInstance { id:number; defId:string }
export interface ItemsState {
  nextItemId:number; inventory:ItemInstance[]; consumables:ItemInstance[]; materials:Record<string,number>;
  storage:{item:ItemInstance;expiresWeek:number}[];
  equipped:Record<string,Partial<Record<Slot,ItemInstance>>>;
  market:{defId:string;priceMilli:number}[];
  goals:{calm:boolean;authority:boolean;week52:boolean;research:boolean;rebellionSeen:boolean;authorityStreak:number};
}
export interface ItemWeekContext { postSkills:Record<string,Skills>;postTraits:Record<string,string[]>;playerSkills:Skills;playerTraits:string[];playerRegen:number }
export const ITEM_STREAM_SALT = Object.freeze({market:0x49544d31,find:0x49544631,material:0x49544d32,legendary:0x49544c31});
export function itemRandom(seed:number,week:number,stream:keyof typeof ITEM_STREAM_SALT):()=>number {
  return createSeededRandom(mixSeed(mixSeed(seed,week),ITEM_STREAM_SALT[stream]));
}
export function drawItemMarket(seed:number,week:number):ItemsState['market'] {
  const rng=itemRandom(seed,week,'market');
  const market:ItemsState['market']=[];
  for(const rarity of ['common','rare','epic'] as const){
    const pool=Object.keys(ITEM_CATALOG).filter(id=>isWearable(ITEM_CATALOG[id])&&ITEM_CATALOG[id].rarity===rarity);
    for(let i=0;i<ITEM_TRIAL.marketCounts[rarity];i++)market.push({defId:pool[Math.floor(rng()*pool.length)],priceMilli:ITEM_TRIAL.marketPricesMilli[rarity]});
  }
  return market;
}
export function drawItemRarity(odds:Partial<Record<Rarity,number>>,rng:()=>number):Rarity|null {
  const roll=Math.floor(rng()*10000);let boundary=0;
  for(const rarity of ['common','rare','epic','legendary'] as const){
    boundary+=odds[rarity]??0;if(roll<boundary)return rarity;
  }
  return null;
}
export function createItemsState(seed:number):ItemsState {
  return {nextItemId:1,inventory:[],consumables:[],materials:{},storage:[],equipped:{},market:drawItemMarket(seed,1),
    goals:{calm:false,authority:false,week52:false,research:false,rebellionSeen:false,authorityStreak:0}};
}
export const isWearable=(d:ItemDefinition):boolean=>['equipment','accessory','outfit'].includes(d.category);
export const isOpenItemSlot=(slot:unknown):slot is Slot=>['weapon','earrings','necklace','ring','hand','top','bottom','shoes','set'].includes(slot as string);
const count=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>=0;
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&hasWeeklyKeys(v,Object.keys(v));
const orderedKeys=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>hasWeeklyKeys(v,keys)&&Object.keys(v).every((key,i)=>key===keys[i]);
export function isItemsState(raw:unknown,characterIds:readonly string[]):raw is ItemsState {
  try {
    if(!orderedKeys(raw,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals'])||!count(raw.nextItemId)||raw.nextItemId<1)return false;
    const nextItemId=raw.nextItemId,ids=new Set<number>();
    const instance=(v:unknown,category:'wearable'|'consumable'|'any'):v is ItemInstance=>{
      if(!orderedKeys(v,['id','defId'])||!count(v.id)||v.id<1||v.id>=nextItemId||ids.has(v.id)||typeof v.defId!=='string'||!Object.hasOwn(ITEM_CATALOG,v.defId))return false;
      const d=ITEM_CATALOG[v.defId];if(!isWearable(d)&&d.category!=='consumable')return false;
      if(category==='wearable'&&!isWearable(d)||category==='consumable'&&d.category!=='consumable')return false;
      ids.add(v.id);return true;
    };
    const inventory=readDenseArray(raw.inventory),consumables=readDenseArray(raw.consumables),storage=readDenseArray(raw.storage),market=readDenseArray(raw.market);
    if(!inventory||!consumables||!storage||!market||inventory.length>ITEM_TRIAL.inventoryCap||consumables.length>ITEM_TRIAL.consumableCap||storage.length>ITEM_TRIAL.storageCap||market.length>Object.values(ITEM_TRIAL.marketCounts).reduce((a,b)=>a+b,0))return false;
    // Lists share the ascending-id order used to rebuild item-table records.
    for(const [list,category] of [[inventory,'wearable'],[consumables,'consumable']] as const){
      let previousId=0;
      for(const item of list){
        if(!instance(item,category)||item.id<=previousId)return false;
        previousId=item.id;
      }
    }
    let previousStorageId=0;
    for(const entry of storage){
      if(!orderedKeys(entry,['item','expiresWeek'])||!count(entry.expiresWeek)||entry.expiresWeek<1||!instance(entry.item,'any')||entry.item.id<=previousStorageId)return false;
      previousStorageId=entry.item.id;
    }
    if(!plain(raw.materials)||!Object.entries(raw.materials).every(([id,n])=>Object.hasOwn(ITEM_CATALOG,id)&&ITEM_CATALOG[id].category==='material'&&count(n)&&n>=1&&n<=ITEM_TRIAL.stackCap))return false;
    if(!plain(raw.equipped))return false;
    const ownerFirstIds:[string,number][]=[];
    for(const [characterId,worn] of Object.entries(raw.equipped)){
      if(!characterIds.includes(characterId)||!plain(worn)||!Object.keys(worn).length)return false;
      if(Object.hasOwn(worn,'set')&&['top','bottom','shoes'].some(s=>Object.hasOwn(worn,s)))return false;
      let previousWornId=0;
      for(const [slot,item] of Object.entries(worn)){
        if(!isOpenItemSlot(slot)||!instance(item,'wearable')||item.id<=previousWornId)return false;
        if(previousWornId===0)ownerFirstIds.push([characterId,item.id]);
        previousWornId=item.id;
        const d=ITEM_CATALOG[item.defId];if(d.slot!==slot||d.kind!==(characterId==='player'?'player':'npc'))return false;
      }
    }
    // Rebuild inserts owners at their first item id; integer-like keys enumerate first in JS.
    const ownerKeys=Object.keys(Object.fromEntries(ownerFirstIds.sort((a,b)=>a[1]-b[1])));
    if(!Object.keys(raw.equipped).every((key,i)=>key===ownerKeys[i]))return false;
    if(!market.every(v=>hasWeeklyKeys(v,['defId','priceMilli'])&&typeof v.defId==='string'&&Object.hasOwn(ITEM_CATALOG,v.defId)&&isWearable(ITEM_CATALOG[v.defId])&&ITEM_CATALOG[v.defId].rarity!=='legendary'&&count(v.priceMilli)))return false;
    return hasWeeklyKeys(raw.goals,['calm','authority','week52','research','rebellionSeen','authorityStreak'])&&count(raw.goals.authorityStreak)&&['calm','authority','week52','research','rebellionSeen'].every(k=>typeof (raw.goals as Record<string,unknown>)[k]==='boolean');
  } catch {return false;}
}
function applies(d:ItemDefinition,socialClass:string|null):boolean {return isWearable(d)&&isOpenItemSlot(d.slot)&&(!d.exclusiveClass||d.exclusiveClass===socialClass);}
export function effectiveSkills(base:Skills,worn:readonly ItemDefinition[],socialClass:string|null):Skills {
  const result={...base};
  for(const d of worn)if(applies(d,socialClass)){
    const bonus=ITEM_TRIAL.bonuses[d.rarity],m=d.slot==='set'?ITEM_TRIAL.setMultiplier:1;
    if(d.mainStat)result[d.mainStat]+=bonus.main*m;
    if(d.secondaryStat)result[d.secondaryStat]+=bonus.secondary*m;
  }
  for(const key of Object.keys(result) as Skill[])result[key]=Number.isFinite(result[key])?Math.min(100,Math.max(0,result[key])):0;
  return result;
}
export function buildItemWeekContext(session:CharacterLifeSessionState):ItemWeekContext {
  const equipped=session.city.society!.items.equipped;
  const definitions=(id:string)=>Object.values(Object.hasOwn(equipped,id)?equipped[id]:{}).map(i=>ITEM_CATALOG[i.defId]);
  const player=definitions(session.player.character.id),postSkills:Record<string,Skills>={},postTraits:Record<string,string[]>={};
  const traits=(defs:ItemDefinition[],socialClass:string|null)=>defs.filter(d=>applies(d,socialClass)&&d.trait).map(d=>d.trait!);
  for(const npc of session.npcs)if(npc.postTileId){
    const worn=definitions(npc.character.id),socialClass=npc.character.socialClass;
    postSkills[npc.postTileId]=effectiveSkills(npc.character.skills,worn,socialClass);postTraits[npc.postTileId]=traits(worn,socialClass);
  }
  return {postSkills,postTraits,playerSkills:effectiveSkills(session.player.character.skills,player,null),playerTraits:traits(player,null),
    playerRegen:player.filter(d=>d.kind==='player'&&applies(d,null)).reduce((n,d)=>n+(d.regen??0)*(d.slot==='set'?ITEM_TRIAL.setMultiplier:1),0)};
}
