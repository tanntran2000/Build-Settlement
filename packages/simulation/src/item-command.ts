import {
  hasWeeklyKeys, isLiveCharacterLifeSessionState, isItemsState, isOpenItemSlot, isWearable,
  ITEM_CATALOG, ITEM_TRIAL, buildingWorkerCap, trialBuilding, OUTSIDE_TRIAL,
  type CharacterLifeSessionState, type ItemInstance, type Slot,
} from '@haven/core';
import type { CharacterLifeCommandResult } from './character-life-command.js';

export const ITEM_COMMAND_TYPES = ['BUY_ITEM','SELL_ITEM','SELL_MATERIAL','DESTROY_ITEM','EQUIP_ITEM','UNEQUIP_ITEM','USE_CONSUMABLE','BUY_POTION','CLAIM_STORED_ITEM'] as const;
export type ItemCommandType = typeof ITEM_COMMAND_TYPES[number];
const fields:Record<ItemCommandType,string[]>={BUY_ITEM:['offerIndex'],SELL_ITEM:['itemId'],SELL_MATERIAL:['materialId','count'],DESTROY_ITEM:['itemId'],EQUIP_ITEM:['itemId','characterId'],UNEQUIP_ITEM:['characterId','slot'],USE_CONSUMABLE:['itemId'],BUY_POTION:['tileId','potion'],CLAIM_STORED_ITEM:['itemId']};
const fail=(code:string,message=code):CharacterLifeCommandResult=>({success:false,error:{code,message}});
const count=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>=0;
const safe=(v:number):number=>{if(!Number.isSafeInteger(v)||v<0)throw Error('Unsafe item arithmetic');return v;};

export function executeItemCommand(session:CharacterLifeSessionState,raw:unknown):CharacterLifeCommandResult {
 try {
  if(!isLiveCharacterLifeSessionState(session)||!session.city.society)return fail('FORBIDDEN');
  const characterIds=[session.player.character.id,...session.npcs.map(n=>n.character.id)];
  if(!isItemsState(session.city.society.items,characterIds))return fail('FORBIDDEN');
  if(session.city.society.crisis.stage==='fallen'||session.city.phase!=='planning')return fail('FORBIDDEN');
  if(!raw||typeof raw!=='object'||!hasWeeklyKeys(raw,Object.keys(raw)))return fail('FORBIDDEN');
  const type=raw.type as ItemCommandType;
  if(!ITEM_COMMAND_TYPES.includes(type))return fail('FORBIDDEN');
  if(!count(raw.expectedRevision)||raw.expectedRevision!==session.city.revision)return fail('STALE_COMMAND');
  if(type==='EQUIP_ITEM'&&Object.hasOwn(raw,'slot'))return fail('SLOT_MISMATCH');
  if(type==='USE_CONSUMABLE'&&Object.hasOwn(raw,'characterId'))return fail('FORBIDDEN');
  if(!hasWeeklyKeys(raw,['type','expectedRevision',...fields[type]]))return fail('FORBIDDEN');
  const next=structuredClone(session),s=next.city.society!.items;
  const stock=next.city.world.settlements[next.city.world.activeSettlementId!].inventory;
  const locate=(id:unknown)=>[s.inventory,s.consumables].map(list=>({list,index:list.findIndex(i=>i.id===id)})).find(p=>p.index>=0);
  const receive=(item:ItemInstance):boolean=>{
    const list=ITEM_CATALOG[item.defId].category==='consumable'?s.consumables:s.inventory;
    if(list.length>=(list===s.inventory?ITEM_TRIAL.inventoryCap:ITEM_TRIAL.consumableCap))return false;
    list.push(item);list.sort((a,b)=>a.id-b.id);return true;
  };
  const purchase=(defId:string,price:number):CharacterLifeCommandResult|null=>{
    if(stock.gold<price)return fail('NOT_ENOUGH_GOLD');
    if(!receive({id:s.nextItemId,defId}))return fail('INVENTORY_FULL');
    s.nextItemId=safe(s.nextItemId+1);stock.gold-=price;return null;
  };
  if(type==='BUY_ITEM'||type==='SELL_ITEM'||type==='SELL_MATERIAL'){
    if(!next.city.tiles.some(t=>t.building?.typeId==='town-market'&&t.building.enabled))return fail('NO_SHOP');
  }
  if(type==='BUY_ITEM'){
    if(!count(raw.offerIndex)||!s.market[raw.offerIndex])return fail('ITEM_UNKNOWN');
    const offer=s.market[raw.offerIndex],error=purchase(offer.defId,offer.priceMilli);if(error)return error;s.market.splice(raw.offerIndex,1);
  } else if(type==='BUY_POTION'){
    if(![1,2,3].includes(raw.potion as number))return fail('ITEM_UNKNOWN');
    const b=next.city.tiles.find(t=>t.id===raw.tileId)?.building;
    if(!b?.enabled||!['hospital','drug-store'].includes(b.typeId))return fail('NO_SHOP');
    if(b.typeId==='hospital'&&(b.workers!==buildingWorkerCap(b.typeId,b.level)||stock.gold<safe(trialBuilding(b.typeId)!.upkeepMilli*b.level)||next.city.society!.stocksMilli.herbs<safe(OUTSIDE_TRIAL.hospitalHerbsPerLevelMilli*b.level)))return fail('NO_SHOP');
    const tier=String(raw.potion) as '1'|'2'|'3',error=purchase(`heal-potion-${tier}`,ITEM_TRIAL.potionPricesMilli[tier]);if(error)return error;
  } else if(type==='SELL_MATERIAL'){
    const id=raw.materialId;
    if(typeof id!=='string'||!Object.hasOwn(ITEM_CATALOG,id)||ITEM_CATALOG[id].category!=='material'||!count(raw.count)||raw.count<1||!s.materials[id]||s.materials[id]<raw.count)return fail('ITEM_UNKNOWN');
    const d=ITEM_CATALOG[id];if(d.rarity==='legendary')return fail('NOT_SELLABLE');
    stock.gold=safe(stock.gold+safe(Math.floor(safe(d.basePriceMilli*ITEM_TRIAL.resaleBps)/10000)*raw.count));
    s.materials[id]-=raw.count;if(s.materials[id]===0)delete s.materials[id];
  } else if(type==='CLAIM_STORED_ITEM'){
    const index=s.storage.findIndex(v=>v.item.id===raw.itemId);if(index<0)return fail('ITEM_UNKNOWN');
    if(!receive(s.storage[index].item))return fail('INVENTORY_FULL');s.storage.splice(index,1);
  } else if(type==='UNEQUIP_ITEM'){
    if(typeof raw.characterId!=='string'||!characterIds.includes(raw.characterId))return fail('ITEM_UNKNOWN');
    if(!isOpenItemSlot(raw.slot))return fail('SLOT_MISMATCH');
    const worn=Object.hasOwn(s.equipped,raw.characterId)?s.equipped[raw.characterId]:undefined,item=worn?.[raw.slot];if(!worn||!item)return fail('ITEM_UNKNOWN');
    if(!receive(item))return fail('INVENTORY_FULL');delete worn[raw.slot];if(!Object.keys(worn).length)delete s.equipped[raw.characterId];
  } else {
    if(type==='EQUIP_ITEM'&&typeof raw.itemId==='string'&&Object.hasOwn(ITEM_CATALOG,raw.itemId)&&!isWearable(ITEM_CATALOG[raw.itemId]))return fail('SLOT_MISMATCH');
    const found=locate(raw.itemId);if(!found)return fail('ITEM_UNKNOWN');
    const item=found.list[found.index],d=ITEM_CATALOG[item.defId];
    if(type==='SELL_ITEM'){
      if(d.rarity==='legendary')return fail('NOT_SELLABLE');
      stock.gold=safe(stock.gold+Math.floor(safe(d.basePriceMilli*ITEM_TRIAL.resaleBps)/10000));found.list.splice(found.index,1);
    } else if(type==='DESTROY_ITEM')found.list.splice(found.index,1);
    else if(type==='USE_CONSUMABLE'){
      if(found.list!==s.consumables)return fail('SLOT_MISMATCH');
      const tier=item.defId.replace('heal-potion-','') as '1'|'2'|'3';if(!Object.hasOwn(ITEM_TRIAL.potionHeal,tier))return fail('ITEM_UNKNOWN');
      next.player.character.health=Math.min(100,next.player.character.health+ITEM_TRIAL.potionHeal[tier]);found.list.splice(found.index,1);
    } else if(type==='EQUIP_ITEM'){
      if(!isWearable(d)||!isOpenItemSlot(d.slot))return fail('SLOT_MISMATCH');
      if(typeof raw.characterId!=='string'||!characterIds.includes(raw.characterId))return fail('ITEM_UNKNOWN');
      if(d.kind!==(raw.characterId===session.player.character.id?'player':'npc'))return fail('KIND_MISMATCH');
      const worn=Object.hasOwn(s.equipped,raw.characterId)?s.equipped[raw.characterId]:{},slots:Slot[]=d.slot==='set'?['set','top','bottom','shoes']:['top','bottom','shoes'].includes(d.slot)?[d.slot,'set']:[d.slot];
      const displaced=slots.flatMap(slot=>worn[slot]?[worn[slot]!]:[]);
      if(s.inventory.length-1+displaced.length>ITEM_TRIAL.inventoryCap)return fail('INVENTORY_FULL');
      found.list.splice(found.index,1);for(const slot of slots)delete worn[slot];for(const old of displaced)receive(old);
      worn[d.slot]=item;Object.defineProperty(s.equipped,raw.characterId,{value:worn,enumerable:true,writable:true,configurable:true});
    }
  }
  // Match the item table's ascending-id reconstruction, regardless of equip order.
  const firstId=(worn:Partial<Record<Slot,ItemInstance>>)=>Math.min(...Object.values(worn).map(i=>i.id));
  s.equipped=Object.fromEntries(Object.entries(s.equipped).sort((a,b)=>firstId(a[1])-firstId(b[1])).map(([id,worn])=>[id,Object.fromEntries(Object.entries(worn).sort((a,b)=>a[1].id-b[1].id))]));
  next.city.revision=safe(next.city.revision+1);
  if(!isItemsState(s,characterIds)||!isLiveCharacterLifeSessionState(next))return fail('FORBIDDEN');
  return {success:true,next};
 } catch {return fail('FORBIDDEN');}
}
