import { describe, expect, it } from 'vitest';
import { NPC_TEST_KEYS, withNpcs } from '@haven/core/testing/npcs';
import {
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, ITEM_CATALOG, RECIPES,
  isItemsState, isLiveCharacterLifeSessionState, type CharacterLifeSessionState, type CraftOrder,
} from '@haven/core';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { executeTileTrialCommand } from '../tile-trial.js';

function life() {
  const made=createCharacterLifeSession(42,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});
  if(!made.success)throw Error(made.error.message);
  const s=made.value,stock=goldStock(s);
  Object.assign(stock,{gold:1_000_000,wood:1_000_000,iron:1_000_000,food:1_000_000});
  for(const [tileId,typeId] of [['spec-2','smithy'],['service-1','hospital'],['slum-1','drug-store']] as const)
    s.city.tiles.find(t=>t.id===tileId)!.building={typeId,level:1,workers:0,enabled:true};
  return s;
}
const items=(s:CharacterLifeSessionState)=>s.city.society!.items;
const goldStock=(s:CharacterLifeSessionState)=>s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
function add(s:CharacterLifeSessionState,defId:string){const item={id:items(s).nextItemId++,defId};(ITEM_CATALOG[defId].category==='consumable'?items(s).consumables:items(s).inventory).push(item);return item;}
function stockRecipe(s:CharacterLifeSessionState,recipeId:string){
  let itemId:number|undefined;
  for(const input of RECIPES[recipeId].inputs)if(ITEM_CATALOG[input.defId].category==='material')items(s).materials[input.defId]=(items(s).materials[input.defId]??0)+input.count;
  else itemId=add(s,input.defId).id;
  return itemId;
}
function act(s:CharacterLifeSessionState,type:string,fields:Record<string,unknown>={}){
  const r=executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields});
  if(!r.success)throw Error(`${type}: ${r.error.code}`);
  return r.next;
}
function refuse(s:CharacterLifeSessionState,fields:Record<string,unknown>,code:string){
  const before=structuredClone(s),bytes=JSON.stringify(s);
  const r=executeCharacterLifeCommand(s,{expectedRevision:s.city.revision,...fields});
  expect(r).toMatchObject({success:false,error:{code}});
  expect(s).toEqual(before);expect(JSON.stringify(s)).toBe(bytes);
}
function held(s:CharacterLifeSessionState,recipeId='refine-silver'):CraftOrder {
  const recipe=RECIPES[recipeId];
  return {recipeId,items:recipe.inputs.filter(i=>ITEM_CATALOG[i.defId].category!=='material').map(i=>({id:items(s).nextItemId++,defId:i.defId})),
    materials:Object.fromEntries(Object.keys(ITEM_CATALOG).flatMap(id=>recipe.inputs.filter(i=>i.defId===id&&ITEM_CATALOG[id].category==='material').map(i=>[id,i.count]))),feeMilli:recipe.feeMilli};
}
function queued(recipeId='refine-silver') {const s=life(),tileId=RECIPES[recipeId].workshops[0]==='smithy'?'spec-2':'service-1';items(s).workshops={[tileId]:{orders:[held(s,recipeId)],ready:[]}};return s;}
const place={type:'PLACE_CRAFT_ORDER',tileId:'spec-2',recipeId:'refine-silver'};

describe('place craft orders',()=>{
  it.each([
    ['refine-silver','spec-2',undefined,{iron:2},1000],
    ['upgrade-rare-ring-player','spec-2','common-ring',{nitrate:1},3000],
    ['brew-heal-potion-1','service-1',undefined,{'green-leaf':2},1000],
  ] as const)('holds exact inputs and fee for %s without modifying the caller', (recipeId,tileId,defId,materials,feeMilli)=>{
    const s=life(),itemId=stockRecipe(s,recipeId),before=structuredClone(s),next=act(s,'PLACE_CRAFT_ORDER',{tileId,recipeId,...(itemId?{itemId}:{})});
    expect(items(next).workshops).toEqual({[tileId]:{orders:[{recipeId,items:defId?[{id:itemId,defId}]:[],materials,feeMilli}],ready:[]}});
    expect(items(next).inventory).toEqual([]);expect(items(next).consumables).toEqual([]);expect(items(next).materials).toEqual({});
    expect(goldStock(next).gold).toBe(1_000_000-feeMilli);expect(next.city.revision).toBe(s.city.revision+1);expect(s).toEqual(before);
    expect(isLiveCharacterLifeSessionState(next)).toBe(true);
  });
  it.each(Object.keys(RECIPES))('places catalog recipe %s with all inputs held once',recipeId=>{
    const s=life(),itemId=stockRecipe(s,recipeId),recipe=RECIPES[recipeId],tileId=recipe.workshops[0]==='smithy'?'spec-2':'service-1';
    const next=act(s,'PLACE_CRAFT_ORDER',{tileId,recipeId,...(itemId?{itemId}:{})});
    const order=items(next).workshops![tileId].orders[0];
    expect(order.recipeId).toBe(recipeId);expect(order.feeMilli).toBe(recipe.feeMilli);
    expect(order.items.map(i=>i.defId)).toEqual(recipe.inputs.filter(i=>ITEM_CATALOG[i.defId].category!=='material').map(i=>i.defId));
    expect(items(next).inventory.length+items(next).consumables.length).toBe(0);
  });
  it.each(['smithy','hospital','drug-store'])('queues at enabled %s without requiring workers or current Herbs/upkeep',typeId=>{
    const s=life(),tileId=typeId==='smithy'?'spec-2':typeId==='hospital'?'service-1':'slum-1',recipeId=typeId==='smithy'?'refine-silver':'brew-heal-potion-1';
    stockRecipe(s,recipeId);goldStock(s).gold=1000;
    expect(items(act(s,'PLACE_CRAFT_ORDER',{tileId,recipeId})).workshops![tileId].orders).toHaveLength(1);
  });
  it('RECIPE_UNKNOWN is atomic',()=>refuse(life(),{...place,recipeId:'unknown'},'RECIPE_UNKNOWN'));
  it.each(['wrong','unbuilt','disabled','unknown'])('NO_WORKSHOP for %s is atomic',kind=>{
    const s=life();stockRecipe(s,'refine-silver');
    if(kind==='wrong')s.city.tiles.find(t=>t.id==='spec-2')!.building!.typeId='library';
    if(kind==='unbuilt')s.city.tiles.find(t=>t.id==='spec-2')!.building=null;
    if(kind==='disabled')s.city.tiles.find(t=>t.id==='spec-2')!.building!.enabled=false;
    refuse(s,{...place,tileId:kind==='unknown'?'unknown':'spec-2'},'NO_WORKSHOP');
  });
  it('MISSING_INPUT for short material stack is atomic',()=>{const s=life();items(s).materials.iron=1;refuse(s,place,'MISSING_INPUT');});
  it.each(['missing','wrong','worn','storage','held'])('MISSING_INPUT for %s upgrade instance is atomic',kind=>{
    const s=life(),item=add(s,kind==='wrong'?'common-top':'common-ring');items(s).materials.nitrate=1;
    if(kind!=='wrong'&&kind!=='missing')items(s).inventory=[];
    if(kind==='worn')items(s).equipped.player={ring:item};
    if(kind==='storage')items(s).storage=[{item,expiresWeek:4}];
    if(kind==='held')items(s).workshops={'spec-2':{orders:[{recipeId:'upgrade-rare-ring-player',items:[item],materials:{nitrate:1},feeMilli:3000}],ready:[]}};
    refuse(s,{...place,recipeId:'upgrade-rare-ring-player',itemId:kind==='missing'?999:item.id},'MISSING_INPUT');
  });
  it('QUEUE_FULL at exactly six leaves the seventh inputs and fee untouched',()=>{
    let s=life();items(s).materials.iron=14;
    for(let i=0;i<6;i++)s=act(s,'PLACE_CRAFT_ORDER',{tileId:'spec-2',recipeId:'refine-silver'});
    expect(items(s).workshops!['spec-2'].orders).toHaveLength(6);refuse(s,place,'QUEUE_FULL');
  });
  it('NOT_ENOUGH_GOLD is atomic',()=>{const s=life();stockRecipe(s,'refine-silver');goldStock(s).gold=999;refuse(s,place,'NOT_ENOUGH_GOLD');});
  it.each(['PLACE_CRAFT_ORDER','CANCEL_CRAFT_ORDER'])('%s refuses Report and stale revision atomically',type=>{
    const s=life();stockRecipe(s,'refine-silver');const fields=type==='PLACE_CRAFT_ORDER'?place:{type,tileId:'spec-2',index:0};
    refuse(s,{...fields,expectedRevision:99},'STALE_COMMAND');s.city.phase='report';refuse(s,fields,'FORBIDDEN');
  });
  it('canonical tile ordering is independent of placement order',()=>{
    let s=life();stockRecipe(s,'refine-silver');stockRecipe(s,'brew-heal-potion-1');
    s=act(s,'PLACE_CRAFT_ORDER',{tileId:'spec-2',recipeId:'refine-silver'});s=act(s,'PLACE_CRAFT_ORDER',{tileId:'service-1',recipeId:'brew-heal-potion-1'});
    expect(Object.keys(items(s).workshops!)).toEqual(['service-1','spec-2']);
  });
});

describe('cancel and held inputs',()=>{
  it.each(['refine-silver','upgrade-rare-ring-player','upgrade-heal-potion-2','brew-heal-potion-1'])('cancel %s returns exact ids, stacks and Gold once',recipeId=>{
    const s=life(),itemId=stockRecipe(s,recipeId),before=structuredClone(s),tileId=RECIPES[recipeId].workshops[0]==='smithy'?'spec-2':'service-1';
    const placed=act(s,'PLACE_CRAFT_ORDER',{tileId,recipeId,...(itemId?{itemId}:{})}),next=act(placed,'CANCEL_CRAFT_ORDER',{tileId,index:0});
    expect(items(next)).toEqual(items(before));expect(goldStock(next)).toEqual(goldStock(before));
    refuse(next,{type:'CANCEL_CRAFT_ORDER',tileId,index:0},'ORDER_UNKNOWN');
  });
  it.each(['inventory','consumables','materials'])('INVENTORY_FULL when returning %s is atomic',destination=>{
    const recipeId=destination==='inventory'?'upgrade-rare-ring-player':destination==='consumables'?'upgrade-heal-potion-2':'refine-silver';
    const s=queued(recipeId);
    if(destination==='materials')items(s).materials.iron=998;
    else for(let i=0;i<50;i++)add(s,destination==='inventory'?'common-ring':'heal-potion-1');
    refuse(s,{type:'CANCEL_CRAFT_ORDER',tileId:Object.keys(items(s).workshops!)[0],index:0},'INVENTORY_FULL');
  });
  it('returns an older input before newer inventory ids and preserves ready outputs',()=>{
    let s=queued('upgrade-rare-ring-player');const output=add(s,'common-top');items(s).inventory=[];
    items(s).workshops!['spec-2'].ready=[{item:output}];add(s,'common-hand');
    s=act(s,'CANCEL_CRAFT_ORDER',{tileId:'spec-2',index:0});
    expect(items(s).inventory.map(i=>i.id)).toEqual([1,3]);expect(items(s).workshops!['spec-2']).toEqual({orders:[],ready:[{item:output}]});
  });
  it.each([-1,1,0.5,'0',NaN])('ORDER_UNKNOWN for index %s is atomic',index=>refuse(queued(),{type:'CANCEL_CRAFT_ORDER',tileId:'spec-2',index},'ORDER_UNKNOWN'));
  it.each(['EQUIP_ITEM','SELL_ITEM','DESTROY_ITEM','USE_CONSUMABLE'])('held input cannot be used by %s',type=>{
    const s=queued(type==='USE_CONSUMABLE'?'upgrade-heal-potion-2':'upgrade-rare-ring-player');
    refuse(s,{type,itemId:1,...(type==='EQUIP_ITEM'?{characterId:'player'}:{})},'ITEM_UNKNOWN');
  });
  it.each(['orders','ready'])('REPLACE refuses a busy %s tile through both entry points',location=>{
    const s=queued('upgrade-rare-ring-player');
    if(location==='ready'){const item=items(s).workshops!['spec-2'].orders[0].items[0];items(s).workshops!['spec-2']={orders:[],ready:[{item}]};}
    refuse(s,{type:'REPLACE',tileId:'spec-2',typeId:'library'},'WORKSHOP_BUSY');
    const before=structuredClone(s.city),r=executeTileTrialCommand(s.city,{type:'REPLACE',tileId:'spec-2',typeId:'library',expectedRevision:0});
    expect(r).toMatchObject({success:false,error:{code:'WORKSHOP_BUSY'}});expect(s.city).toEqual(before);
  });
  it('REPLACE succeeds after the last order is cancelled',()=>{
    let s=act(queued(),'CANCEL_CRAFT_ORDER',{tileId:'spec-2',index:0});
    s=act(s,'REPLACE',{tileId:'spec-2',typeId:'library'});expect(s.city.tiles.find(t=>t.id==='spec-2')!.building!.typeId).toBe('library');
  });
});

describe('canonical workshop state',()=>{
  it('accepts nonempty canonical queues and ready outputs through the parent session validator',()=>{
    const s=queued('upgrade-rare-ring-player');const item=add(s,'heal-potion-2');items(s).consumables=[];
    items(s).workshops!['spec-2'].ready=[{item},{material:'silver',count:1}];
    expect(isItemsState(items(s),['player'])).toBe(true);expect(isLiveCharacterLifeSessionState(s)).toBe(true);
  });
  const mutations:[string,(s:CharacterLifeSessionState)=>void][]=[
    ['empty map',s=>{items(s).workshops={};}],
    ['empty entry',s=>{items(s).workshops!['spec-2'].orders=[];}],
    ['unsorted tiles',s=>{items(s).workshops!['service-1']={orders:[held(s,'brew-heal-potion-1')],ready:[]};}],
    ['unknown recipe',s=>{items(s).workshops!['spec-2'].orders[0].recipeId='unknown';}],
    ['wrong fee',s=>{items(s).workshops!['spec-2'].orders[0].feeMilli=999;}],
    ['wrong stack',s=>{items(s).workshops!['spec-2'].orders[0].materials={iron:1};}],
    ['extra material',s=>{items(s).workshops!['spec-2'].orders[0].materials={iron:2,silver:1};}],
    ['duplicate held id',s=>{const order=held(s,'upgrade-rare-ring-player');items(s).workshops!['spec-2'].orders=[order];items(s).inventory=[order.items[0]];}],
    ['wrong held definition',s=>{const order=held(s,'upgrade-rare-ring-player');order.items[0].defId='common-top';items(s).workshops!['spec-2'].orders=[order];}],
    ['over-cap queue',s=>{items(s).workshops!['spec-2'].orders=Array.from({length:7},()=>held(s));}],
    ['sparse orders',s=>{items(s).workshops!['spec-2'].orders=new Array(1);}],
    ['sparse ready',s=>{items(s).workshops!['spec-2'].ready=new Array(1);}],
    ['ready count zero',s=>{items(s).workshops!['spec-2'].ready=[{material:'silver',count:0}];}],
    ['unknown ready material',s=>{items(s).workshops!['spec-2'].ready=[{material:'unknown',count:1}];}],
    ['ready duplicate id',s=>{const item=add(s,'common-ring');items(s).workshops!['spec-2'].ready=[{item}];}],
    ['wrong state key order',s=>{const {workshops,...rest}=items(s);s.city.society!.items={workshops,...rest};}],
    ['accessor',s=>{Object.defineProperty(items(s).workshops!['spec-2'],'orders',{enumerable:true,get(){throw Error('getter');}});}],
  ];
  it.each(mutations)('rejects %s without mutating it',(_name,mutate)=>{
    const s=queued();mutate(s);expect(isItemsState(items(s),['player'])).toBe(false);
  });
});

it.each([['spec-2','smithy'],['service-1','hospital'],['slum-1','drug-store']])('ASSIGN_NPC accepts %s (%s)',(tileId)=>{
  const next=act(withNpcs(life(),NPC_TEST_KEYS.slice(0,1)),'ASSIGN_NPC',{npcId:'npc_w1_guild_0',tileId});expect(next.npcs[0].postTileId).toBe(tileId);
});
