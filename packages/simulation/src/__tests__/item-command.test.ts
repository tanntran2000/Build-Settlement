import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type CharacterLifeSessionState } from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';

function life(){const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return r.value;}
const items=(s:CharacterLifeSessionState)=>s.city.society!.items;
function add(s:CharacterLifeSessionState,defId:string,consumable=false){const i={id:items(s).nextItemId++,defId};(consumable?items(s).consumables:items(s).inventory).push(i);return i.id;}
const gold=(s:CharacterLifeSessionState)=>s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
function action(s:CharacterLifeSessionState,type:string,fields:Record<string,unknown>={}){return executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields});}
function ok(s:CharacterLifeSessionState,type:string,fields:Record<string,unknown>={}){const before=structuredClone(s);const r=action(s,type,fields);expect(s).toEqual(before);expect(r.success).toBe(true);if(!r.success)throw Error(r.error.code);expect(r.next.city.revision).toBe(s.city.revision+1);return r.next;}
function reject(s:CharacterLifeSessionState,type:string,fields:Record<string,unknown>,code:string){const before=structuredClone(s);expect(action(s,type,fields)).toMatchObject({success:false,error:{code}});expect(s).toEqual(before);}
it.each([['common-weapon','player'],['rare-weapon','npc_starter_1']])('equips and unequips %s', (defId,characterId)=>{
 let s=life();const itemId=add(s,defId);s=ok(s,'EQUIP_ITEM',{itemId,characterId});expect(items(s).equipped[characterId].weapon?.id).toBe(itemId);expect(items(s).inventory).toHaveLength(0);
 s=ok(s,'UNEQUIP_ITEM',{characterId,slot:'weapon'});expect(items(s).inventory).toEqual([{id:itemId,defId}]);expect(items(s).equipped[characterId]?.weapon).toBeUndefined();
});
it('rejects KIND_MISMATCH atomically',()=>{const s=life();reject(s,'EQUIP_ITEM',{itemId:add(s,'common-weapon'),characterId:'npc_starter_1'},'KIND_MISMATCH');});
it('rejects SLOT_MISMATCH for accessory into top and material equipped',()=>{
 const s=life();reject(s,'EQUIP_ITEM',{itemId:add(s,'common-ring'),characterId:'player',slot:'top'},'SLOT_MISMATCH');
 items(s).materials.iron=1;reject(s,'EQUIP_ITEM',{itemId:'iron',characterId:'player'},'SLOT_MISMATCH');
});
it('swaps a set and individual pieces both ways atomically',()=>{
 let s=life();const ids=['common-top','common-bottom','common-shoes'].map(d=>add(s,d));const set=add(s,'common-set');
 for(const itemId of ids)s=ok(s,'EQUIP_ITEM',{itemId,characterId:'player'});
 s=ok(s,'EQUIP_ITEM',{itemId:set,characterId:'player'});expect(Object.keys(items(s).equipped.player)).toEqual(['set']);expect(items(s).inventory.map(i=>i.id)).toEqual(ids);
 s=ok(s,'EQUIP_ITEM',{itemId:ids[0],characterId:'player'});expect(items(s).equipped.player.set).toBeUndefined();expect(items(s).inventory.some(i=>i.id===set)).toBe(true);
});
it('rejects a three-piece set swap when fewer than three spaces remain after removing the set',()=>{
 let s=life();for(const d of ['common-top','common-bottom','common-shoes']){const id=add(s,d);s=ok(s,'EQUIP_ITEM',{itemId:id,characterId:'player'});}
 const set=add(s,'common-set');while(items(s).inventory.length<49)add(s,'common-ring');
 reject(s,'EQUIP_ITEM',{itemId:set,characterId:'player'},'INVENTORY_FULL');
});
it('buys at exact price and rejects insufficient Gold without mutation',()=>{
 const s=life();const price=items(s).market[0].priceMilli;gold(s).gold=price;const next=ok(s,'BUY_ITEM',{offerIndex:0});expect(gold(next).gold).toBe(0);expect(items(next).inventory).toHaveLength(1);expect(items(next).market).toHaveLength(7);
 gold(s).gold=price-1;reject(s,'BUY_ITEM',{offerIndex:0},'NOT_ENOUGH_GOLD');
});
it.each([['common-weapon',1500],['rare-weapon',4500],['epic-weapon',12000]])('sells %s for 30 percent', (defId,price)=>{
 const s=life(),itemId=add(s,defId),before=gold(s).gold;const next=ok(s,'SELL_ITEM',{itemId});expect(gold(next).gold).toBe(before+price);expect(items(next).inventory).toHaveLength(0);
});
it('refuses sale of Legendary wearables',()=>{const s=life();reject(s,'SELL_ITEM',{itemId:add(s,'wardens-oath')},'NOT_SELLABLE');});
it('sells materials within stack bounds and refuses Legendary material',()=>{
 const s=life();items(s).materials.iron=2;items(s).materials.ruby=1;const before=gold(s).gold;
 const next=ok(s,'SELL_MATERIAL',{materialId:'iron',count:2});expect(gold(next).gold).toBe(before+600);expect(items(next).materials.iron).toBeUndefined();
 reject(s,'SELL_MATERIAL',{materialId:'iron',count:3},'ITEM_UNKNOWN');reject(s,'SELL_MATERIAL',{materialId:'ruby',count:1},'NOT_SELLABLE');
});
it('destroys an inventory item',()=>{const s=life();const next=ok(s,'DESTROY_ITEM',{itemId:add(s,'common-ring')});expect(items(next).inventory).toHaveLength(0);});
it('claims stored items only when space exists',()=>{
 const s=life(),id=items(s).nextItemId++;items(s).storage.push({item:{id,defId:'common-ring'},expiresWeek:4});
 expect(items(ok(s,'CLAIM_STORED_ITEM',{itemId:id})).storage).toHaveLength(0);
 while(items(s).inventory.length<50)add(s,'common-ring');reject(s,'CLAIM_STORED_ITEM',{itemId:id},'INVENTORY_FULL');
});
it.each([[1,5],[2,10],[3,15]])('potion %i heals %i, clamps at 100, costs no action, and targets only Player',(potion,heal)=>{
 const s=life();s.player.character.health=50;const itemId=add(s,`heal-potion-${potion}`,true);const npcHealth=s.npcs.map(n=>n.character.health);
 const next=ok(s,'USE_CONSUMABLE',{itemId});expect(next.player.character.health).toBe(50+heal);expect(next.npcs.map(n=>n.character.health)).toEqual(npcHealth);expect(items(next).consumables).toHaveLength(0);
 s.player.character.health=99;expect(ok(s,'USE_CONSUMABLE',{itemId}).player.character.health).toBe(100);
 reject(s,'USE_CONSUMABLE',{itemId,characterId:'npc_starter_1'},'FORBIDDEN');
});
it('buys potions at an operating Hospital and rejects absent or idle shops',()=>{
 const s=life();reject(s,'BUY_POTION',{tileId:'service-1',potion:1},'NO_SHOP');
 s.city.society!.classes.luminaries.common=20;s.city.society!.classes.free=47;
 s.city.tiles.find(t=>t.id==='service-1')!.building={typeId:'hospital',level:1,workers:2,enabled:true};s.city.society!.stocksMilli.herbs=1000;gold(s).gold=10000;
 expect(items(ok(s,'BUY_POTION',{tileId:'service-1',potion:2})).consumables[0].defId).toBe('heal-potion-2');
 s.city.society!.stocksMilli.herbs=0;reject(s,'BUY_POTION',{tileId:'service-1',potion:1},'NO_SHOP');
});
const commands=[['BUY_ITEM',{offerIndex:0}],['SELL_ITEM',{itemId:1}],['SELL_MATERIAL',{materialId:'iron',count:1}],['DESTROY_ITEM',{itemId:1}],['EQUIP_ITEM',{itemId:1,characterId:'player'}],['UNEQUIP_ITEM',{characterId:'player',slot:'weapon'}],['USE_CONSUMABLE',{itemId:1}],['BUY_POTION',{tileId:'service-1',potion:1}],['CLAIM_STORED_ITEM',{itemId:1}]] as const;
it.each(commands)('%s rejects Report and stale revision atomically',(type,fields)=>{
 const s=life();reject(s,type,{...fields,expectedRevision:1},'STALE_COMMAND');s.city.phase='report';reject(s,type,fields,'FORBIDDEN');
});
it('refuses full purchase inventory and permits consumable sale',()=>{
 const s=life();while(items(s).inventory.length<50)add(s,'common-ring');reject(s,'BUY_ITEM',{offerIndex:0},'INVENTORY_FULL');
 const id=add(s,'heal-potion-1',true),before=gold(s).gold;expect(gold(ok(s,'SELL_ITEM',{itemId:id})).gold).toBe(before+900);
});
it('equips an NPC whose id is a prototype name without touching global prototypes',()=>{
 const s=life();s.npcs[0].character.id='__proto__';s.profiles[0].id='__proto__';
 const itemId=add(s,'rare-weapon'),prior=Object.getOwnPropertyDescriptor(Object.prototype,'weapon');
 try {
  const next=ok(s,'EQUIP_ITEM',{itemId,characterId:'__proto__'});
  expect(Object.hasOwn(items(next).equipped,'__proto__')).toBe(true);
  expect(items(next).equipped.__proto__.weapon?.id).toBe(itemId);
  expect(Object.getOwnPropertyDescriptor(Object.prototype,'weapon')).toEqual(prior);
 } finally {if(prior)Object.defineProperty(Object.prototype,'weapon',prior);else Reflect.deleteProperty(Object.prototype,'weapon');}
});
