import { createHash } from 'node:crypto';
import { NPC_TEST_KEYS, withNpcs } from '@haven/core/testing/npcs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '@haven/core';
import { createSocietyState, createItemsState, isItemsState, RECIPES, ITEM_CATALOG, buildItemWeekContext,
  createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, type ItemsState, type CraftOrder, type ItemWeekContext, type TileTrialState } from '@haven/core';
import { runTileTrialWeek } from '../tile-trial-week.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { completeCraftOrders as complete } from '../craft-week.js';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Captured from untouched 0de2d1f before the first PR B product edit.
const noOrderBaseline: Record<number, {reports:string;items:string;city:string}> = {
  0: {reports:'9393b71033175e5dc6c1da65ed116a574521672d2c1a3631141ba57e654d8a45',items:'cddabceee23c2746d4dd3408d05e71ee624dd800d8a0f761cb88f130122deb65',city:'cb607d6b5265d7785f66cc110ef489bf616c242efac0b965be55a09b75708693'},
  42: {reports:'6238af7420c55fcf75acef911011bb4b50138231397853150d5433cf76fbb319',items:'283da6a1e4fed8fdc3a419e72e00827020ab1ace63f68277db0c1d7cee5616e8',city:'e648285ab2b75d05498b2a3fb6bf72c362a0c8a63b5beeef0ced78b4360e0577'},
  20261028: {reports:'e7c96f5378373cc7108072dbda1dbb123d60dfd623c49c8a1f0f69368da7275d',items:'3ad4de4ea7c6a0687ac6d8481778a2513e841dd061e1712429d8bb2dacc31515',city:'a2bf676b0d60745f0350eb54ce1884b35151d541bf30d54b6deb3f2fb4e28af5'},
};
it.each([0, 42, 20261028])('preserves all no-order reports and item states for sixty weeks at seed %i', seed => {
  const city = createSocietyState();
  city.world.worldMetadata.worldSeed = seed;
  const stocks = city.world.settlements[city.world.activeSettlementId!].inventory;
  for (const key of ['gold', 'food', 'wood', 'iron'] as const) stocks[key] = 1_000_000;
  city.goodsStock!.amountMilli = 1_000_000;
  const reports = [], itemStates = [];
  for (let i = 0; i < 60; i++) {
    reports.push(runTileTrialWeek(city));
    itemStates.push(structuredClone(city.society!.items));
    city.phase = 'planning';
  }
  expect({ reports:hash(reports),items:hash(itemStates),city:hash(city) }).toEqual(noOrderBaseline[seed]);
  expect(city.world.week).toBe(61);
  expect(isItemsState(city.society!.items, ['player'])).toBe(true);
});

const skills=(value=0)=>({management:value,technical:value,medical:value,combat:value,negotiation:value});
function context(tileId:string,value:number):ItemWeekContext{return {postSkills:{[tileId]:skills(value)},postTraits:{},playerSkills:skills(),playerTraits:[],playerRegen:0};}
function tiles():TileTrialState['tiles'] {return [
  {id:'spec-2',terrain:'town',building:{typeId:'smithy',level:2,workers:2,enabled:true}},
  {id:'service-1',terrain:'town',building:{typeId:'hospital',level:1,workers:2,enabled:true}},
  {id:'slum-1',terrain:'town',building:{typeId:'drug-store',level:1,workers:0,enabled:true}},
];}
function input(tileList=tiles(),week=5,ctx?:ItemWeekContext){return {tiles:tileList,operatingIds:new Set(tileList.map(t=>t.id)),week,ctx};}
function order(items:ItemsState,recipeId:string):CraftOrder{
  const recipe=RECIPES[recipeId];
  return {recipeId,items:recipe.inputs.filter(i=>ITEM_CATALOG[i.defId].category!=='material').map(i=>({id:items.nextItemId++,defId:i.defId})),
    materials:Object.fromEntries(recipe.inputs.filter(i=>ITEM_CATALOG[i.defId].category==='material').map(i=>[i.defId,i.count])),feeMilli:recipe.feeMilli};
}
function queued(recipeIds:string[],tileId='spec-2'){
  const items=createItemsState(42);items.workshops={[tileId]:{orders:recipeIds.map(id=>order(items,id)),ready:[]}};return items;
}
function add(items:ItemsState,defId:string){const item={id:items.nextItemId++,defId};(ITEM_CATALOG[defId].category==='consumable'?items.consumables:items.inventory).push(item);return item;}
afterEach(()=>vi.restoreAllMocks());

describe('capacity and workshop operation',()=>{
  it.each([[0,100,0],[1,59,1],[1,60,2],[1,79,2],[1,80,3],[2,0,2],[2,80,4]])('Smithy workers %i and skill %i complete %i',async(workers,skill,want)=>{
    const items=queued(Array(6).fill('refine-silver')),tileList=tiles();tileList[0].building!.workers=workers;
    const result=await complete(items,input(tileList,5,context('spec-2',skill)));
    expect(result.crafted).toHaveLength(want);expect(items.materials.silver??0).toBe(want);
    expect(items.workshops!['spec-2'].orders).toHaveLength(6-want);
    expect(result.workshopsIdle).toEqual(want?[]:['spec-2']);
  });
  it.each([[59,1],[60,2],[79,2],[80,3]])('Drug Store without workers at medical %i completes %i',async(skill,want)=>{
    const items=queued(Array(6).fill('brew-heal-potion-1'),'slum-1');
    const result=await complete(items,input(tiles(),5,context('slum-1',skill)));
    expect(result.crafted).toHaveLength(want);expect(items.consumables).toHaveLength(want);
  });
  it('uses technical for Smithy and medical for Hospital/Drug Store',async()=>{
    const items=queued(Array(6).fill('refine-silver')),ctx=context('spec-2',0);ctx.postSkills['spec-2'].medical=100;
    expect((await complete(items,input(tiles(),5,ctx))).crafted).toHaveLength(2);
    const herbs=queued(Array(6).fill('brew-heal-potion-1'),'service-1'),medical=context('service-1',0);medical.postSkills['service-1'].technical=100;
    expect((await complete(herbs,input(tiles(),5,medical))).crafted).toHaveLength(2);
  });
  it.each(['unpaid','disabled','unbuilt','zero workers','partial Hospital','idle Hospital'])('keeps every held input and reports %s as idle',async(kind)=>{
    const hospital=kind.includes('Hospital'),tileId=hospital?'service-1':'spec-2',items=queued([hospital?'brew-heal-potion-1':'refine-silver'],tileId),tileList=tiles();
    const b=tileList.find(t=>t.id===tileId)!,data=input(tileList,5,context(tileId,100));
    if(kind==='unpaid'||kind==='idle Hospital')data.operatingIds.delete(tileId);
    if(kind==='disabled')b.building!.enabled=false;
    if(kind==='unbuilt')b.building=null;
    if(kind==='zero workers')b.building!.workers=0;
    if(kind==='partial Hospital')b.building!.workers=1;
    const before=structuredClone(items),result=await complete(items,data);
    expect(items).toEqual(before);expect(result).toEqual({crafted:[],workshopsIdle:[tileId]});
  });
  it('keeps FIFO order rather than choosing a recipe by kind or tier',async()=>{
    const items=queued(['refine-silver','refine-nitrate','refine-wool']);
    const result=await complete(items,input());
    expect(result.crafted.map(r=>r.recipeId)).toEqual(['refine-silver','refine-nitrate']);
    expect(items.workshops!['spec-2'].orders.map(r=>r.recipeId)).toEqual(['refine-wool']);
  });
  it('completes tiles in ascending id independent of tile-array order',async()=>{
    const items=createItemsState(42);items.workshops={'service-1':{orders:[order(items,'brew-heal-potion-1')],ready:[]},'slum-1':{orders:[order(items,'brew-heal-potion-1')],ready:[]}};
    const result=await complete(items,input(tiles().reverse()));
    expect(result.crafted.map(r=>r.tileId)).toEqual(['service-1','slum-1']);expect(items.consumables.map(i=>i.id)).toEqual([1,2]);
  });
});

describe('outputs, ready delivery and determinism',()=>{
  it.each(Object.keys(RECIPES))('completes %s once with its exact output and a fresh item id',async recipeId=>{
    const tileId=RECIPES[recipeId].workshops[0]==='smithy'?'spec-2':'service-1',items=queued([recipeId],tileId),nextId=items.nextItemId,defId=RECIPES[recipeId].output,definition=ITEM_CATALOG[defId];
    const result=await complete(items,input());
    const place=definition.category==='material'?'materials':definition.category==='consumable'?'consumables':'inventory';
    expect(result).toEqual({crafted:[{tileId,recipeId,output:defId,place}],workshopsIdle:[]});
    if(place==='materials'){expect(items.materials[defId]).toBe(1);expect(items.nextItemId).toBe(nextId);}
    else {expect(items[place]).toEqual([{id:nextId,defId}]);expect(items.nextItemId).toBe(nextId+1);}
    if(RECIPES[recipeId].kind==='upgrade'){
      const from=ITEM_CATALOG[RECIPES[recipeId].inputs[0].defId];expect(definition.slot).toBe(from.slot);expect(definition.kind).toBe(from.kind);
    }
    expect(Object.hasOwn(items,'workshops')).toBe(false);expect(isItemsState(items,['player'])).toBe(true);
  });
  it.each(['upgrade-rare-ring-player','brew-heal-potion-1'])('full destination for %s uses P6-A storage expiry',async recipeId=>{
    const items=queued([recipeId],recipeId.startsWith('upgrade')?'spec-2':'service-1');
    for(let i=0;i<50;i++)add(items,recipeId.startsWith('upgrade')?'common-ring':'heal-potion-1');
    const nextId=items.nextItemId,result=await complete(items,input());
    expect(result.crafted[0].place).toBe('storage');expect(items.storage).toEqual([{item:{id:nextId,defId:RECIPES[recipeId].output},expiresWeek:8}]);
  });
  it('delivers all ready outputs before any tile can consume the last free slot',async()=>{
    const items=createItemsState(42);for(let i=0;i<49;i++)add(items,'heal-potion-1');
    const ready={id:items.nextItemId++,defId:'heal-potion-2'};
    items.workshops={'service-1':{orders:[order(items,'brew-heal-potion-1')],ready:[]},'slum-1':{orders:[],ready:[{item:ready}]}};
    const result=await complete(items,input());
    expect(items.consumables.at(-1)).toEqual(ready);expect(result.crafted[0].place).toBe('storage');expect(items.storage[0].item.defId).toBe('heal-potion-1');
  });
  it('retains everything full at once, never expires ready, then delivers each exactly once',async()=>{
    const items=createItemsState(42);
    for(let i=0;i<50;i++){add(items,'common-ring');add(items,'heal-potion-1');}
    for(let i=0;i<10;i++)items.storage.push({item:{id:items.nextItemId++,defId:'common-ring'},expiresWeek:2000});
    items.materials.silver=999;
    items.workshops={'service-1':{orders:[order(items,'brew-heal-potion-1')],ready:[]},'spec-2':{orders:[order(items,'refine-silver'),order(items,'upgrade-rare-ring-player')],ready:[]}};
    const result=await complete(items,input());
    expect(result.crafted.map(r=>r.place)).toEqual(['ready','ready','ready']);
    const ready=structuredClone(items.workshops),nextId=items.nextItemId;
    expect(ready!['spec-2'].ready[0]).toEqual({material:'silver',count:1});expect(isItemsState(items,['player'])).toBe(true);
    await complete(items,input(tiles(),1000));expect(items.workshops).toEqual(ready);expect(items.nextItemId).toBe(nextId);
    items.inventory.shift();items.consumables.shift();items.materials.silver=998;
    await complete(items,input(tiles(),1001));expect(Object.hasOwn(items,'workshops')).toBe(false);expect(items.materials.silver).toBe(999);
    expect(items.inventory.filter(i=>i.defId==='rare-ring-player')).toHaveLength(1);
    const delivered=structuredClone(items);await complete(items,input(tiles(),1002));expect(items).toEqual(delivered);expect(items.nextItemId).toBe(nextId);
  });
  it('can deliver a ready item while its workshop is disabled and removes the empty entry',async()=>{
    const items=createItemsState(42),item={id:items.nextItemId++,defId:'rare-ring-player'};items.workshops={'spec-2':{orders:[],ready:[{item}]}};
    const tileList=tiles();tileList[0].building!.enabled=false;
    expect(await complete(items,input(tileList))).toEqual({crafted:[],workshopsIdle:[]});expect(items.inventory).toEqual([item]);expect(Object.hasOwn(items,'workshops')).toBe(false);
  });
  it('uses no random stream and gives identical results for identical orders',async()=>{
    const a=queued(['refine-silver','upgrade-rare-ring-player']),b=structuredClone(a);
    const rng=vi.spyOn(core,'itemRandom');const random=vi.spyOn(Math,'random');
    const first=await complete(a,input()),second=await complete(b,input());
    expect(a).toEqual(b);expect(first).toEqual(second);expect(rng).not.toHaveBeenCalled();expect(random).not.toHaveBeenCalled();
  });
  it('does not add any key or change any byte when no orders have ever existed',async()=>{
    const items=createItemsState(42),before=JSON.stringify(items);
    expect(await complete(items,input())).toEqual({crafted:[],workshopsIdle:[]});expect(JSON.stringify(items)).toBe(before);
  });
});

function session(){
  const made=createCharacterLifeSession(42,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!made.success)throw Error();
  const s=made.value,city=s.city;for(const tile of city.tiles)if(tile.building)tile.building.workers=0;
  city.tiles.find(t=>t.id==='spec-2')!.building={typeId:'smithy',level:2,workers:2,enabled:true};
  city.tiles.find(t=>t.id==='service-1')!.building={typeId:'hospital',level:1,workers:2,enabled:true};
  city.tiles.find(t=>t.id==='slum-1')!.building={typeId:'drug-store',level:1,workers:0,enabled:true};
  city.society!.classes.free-=8;city.society!.classes.luminaries.common+=8;city.society!.stocksMilli.herbs=10000;
  const stocks=city.world.settlements[city.world.activeSettlementId!].inventory;Object.assign(stocks,{gold:1_000_000,food:1_000_000,wood:1_000_000,iron:1_000_000});city.goodsStock!.amountMilli=1_000_000;
  return s;
}
it('End Week integrates crafted rows after the old item steps using effective posted skill',()=>{
  const s=withNpcs(session(),NPC_TEST_KEYS.slice(0,1)),items=s.city.society!.items;
  s.npcs[0].postTileId='spec-2';s.npcs[0].character.skills.technical=59;
  const gear=add(items,'rare-hand');items.inventory=[];items.equipped.npc_w1_guild_0={hand:gear};
  items.workshops={'spec-2':{orders:Array.from({length:6},()=>order(items,'refine-silver')),ready:[]}};
  const effective=buildItemWeekContext(s).postSkills['spec-2'].technical;expect(effective).toBeGreaterThanOrEqual(60);expect(effective).toBeLessThan(80);
  const r=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:0,expectedWeek:1});expect(r.success).toBe(true);if(!r.success)throw Error(r.error.code);
  expect(r.report!.items.crafted).toHaveLength(3);expect(r.next.city.society!.items.workshops!['spec-2'].orders).toHaveLength(3);
  expect(Object.hasOwn(r.report!.items,'workshopsIdle')).toBe(false);
});
it.each(['unpaid','disabled','no Herbs','partial staffing'])('End Week reports %s without completing Hospital orders',kind=>{
  const s=session(),b=s.city.tiles.find(t=>t.id==='service-1')!.building!;
  if(kind==='unpaid'){
    const settlement=s.city.world.settlements[s.city.world.activeSettlementId!];settlement.inventory.gold=0;settlement.cohorts[0].count=20;
    s.city.society!.classes.free=0;s.city.society!.classes.makers.common=0;s.city.society!.classes.merchants.common=0;
    s.city.tiles.find(t=>t.id==='spec-2')!.building!.workers=0;
  }
  if(kind==='disabled'){b.enabled=false;b.workers=0;}
  if(kind==='no Herbs')s.city.society!.stocksMilli.herbs=0;
  if(kind==='partial staffing')b.workers=1;
  s.city.society!.items.workshops={'service-1':{orders:[order(s.city.society!.items,'brew-heal-potion-1')],ready:[]}};
  const r=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:0,expectedWeek:1});expect(r.success).toBe(true);if(!r.success)throw Error(r.error.code);
  expect(r.report!.items.workshopsIdle).toEqual(['service-1']);expect(r.report!.items.crafted).toBeUndefined();expect(r.next.city.society!.items.workshops!['service-1'].orders).toHaveLength(1);
});
