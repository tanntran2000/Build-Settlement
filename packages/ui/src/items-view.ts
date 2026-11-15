import { ITEM_CATALOG, ITEM_TRIAL, effectiveSkills, buildingWorkerCap, TRIAL_BUILDINGS, OUTSIDE_TRIAL, type ItemDefinition, type ItemsState, type Slot, type CharacterLifeSessionState, type Skill, type TileTrialState, type ItemWeekReport } from '@haven/core';
import { CRAFT_TRIAL, RECIPES, TILE_TRIAL_BALANCE, LAW_CATALOG, lawTerms, isWearable, isOpenItemSlot, type WorldNpc } from '@haven/core';
import { authorityTaxBps, FARM_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI } from '@haven/simulation';

export const itemTitle = (s: string) => s.replace(/(^|[-_ ])\w/g, part => part.replace(/[-_]/g,' ').toUpperCase());
const everyday: Slot[] = ['earrings','necklace','top','bottom','shoes','ring','weapon','hand'];
export function equipmentSlots(kind: 'player'|'npc') {
  return [...everyday,...(kind==='npc'?['nipple','vagina','anus'] as Slot[]:[])].map(id=>({id,label:itemTitle(id),locked:!everyday.includes(id)}));
}
export function itemPresentation(d: ItemDefinition) {
  const colours:Record<string,string>={makers:'#b78149',luminaries:'#79b8ff',merchants:'#f1ce62',free:'#83c785',slaves:'#c3c3c3',bound:'#c3c3c3'};
  return {rarity:itemTitle(d.rarity),frame:d.rarity,colour:d.kind==='player'?'#ff9990':colours[d.exclusiveClass??'']??'#ffffff',exclusive:d.exclusiveClass?`Exclusive ${itemTitle(d.exclusiveClass)}`:''};
}
function character(s: CharacterLifeSessionState,id:string) {
  return id===s.player.character.id?s.player.character:s.npcs.find(n=>n.character.id===id)!.character;
}
function worn(s:CharacterLifeSessionState,id:string) { return Object.values(s.city.society!.items.equipped[id]??{}).map(i=>ITEM_CATALOG[i.defId]); }
export function characterTotals(s:CharacterLifeSessionState,id:string) {
  const c=character(s,id), player=id===s.player.character.id, defs=worn(s,id), effective=effectiveSkills(c.skills,defs,player?null:c.socialClass);
  return {skills:(Object.keys(effective) as Skill[]).map(skill=>({skill,base:c.skills[skill],value:effective[skill],bonus:effective[skill]-c.skills[skill]})),
    regen:player?1+defs.reduce((n,d)=>n+(d.regen??0)*(d.slot==='set'?ITEM_TRIAL.setMultiplier:1),0):null};
}
export function itemPreview(s:CharacterLifeSessionState,id:string,d:ItemDefinition) {
  const c=character(s,id), social=id===s.player.character.id?null:c.socialClass;
  const before=effectiveSkills(c.skills,worn(s,id),social);
  const removed=d.slot==='set'?['set','top','bottom','shoes']:['top','bottom','shoes'].includes(d.slot??'')?[d.slot,'set']:[d.slot];
  const after=effectiveSkills(c.skills,[...worn(s,id).filter(old=>!removed.includes(old.slot)),d],social);
  return (Object.keys(before) as Skill[]).map(skill=>({skill,before:before[skill],after:after[skill]}));
}
export function matchesItem(d:ItemDefinition,filter:string,slot:string):boolean {
  if(filter==='Player'||filter==='NPC')return d.kind===filter.toLowerCase();
  if(filter==='This slot')return d.slot===slot||(d.slot==='set'&&['top','bottom','shoes'].includes(slot));
  return filter==='All'||d.category===filter.toLowerCase();
}
export function materialRows(items:ItemsState) {
  return Object.entries(items.materials).map(([id,count])=>({id,name:ITEM_CATALOG[id].name,rarity:itemTitle(ITEM_CATALOG[id].rarity),count})).sort((a,b)=>a.name.localeCompare(b.name));
}
export const itemError=(code:string)=>({INVENTORY_FULL:'There is no room in the inventory.',KIND_MISMATCH:'Choose an item for this character.',SLOT_MISMATCH:'This item does not fit that slot.',STALE_COMMAND:'The inventory changed. Try again.',FORBIDDEN:'Plan next week before changing items.',ITEM_UNKNOWN:'This item is no longer available.',NOT_ENOUGH_GOLD:'Not enough Gold.',NO_SHOP:'This shop is not operating.',NOT_SELLABLE:'Legendary items cannot be sold.',RECIPE_UNKNOWN:'This recipe is no longer available.',NO_WORKSHOP:'Choose an enabled workshop for this recipe.',MISSING_INPUT:'The required inputs are no longer available.',QUEUE_FULL:'The workshop queue is full.',ORDER_UNKNOWN:'This order is no longer available.',WORKSHOP_BUSY:'Cancel orders and make room for ready outputs before replacing this workshop.'}[code]??'The item action could not be completed.');

export function parseItemCount(text:string,available:number):number|null {
  if(!/^\d+$/.test(text))return null;const count=Number(text);
  return Number.isSafeInteger(count)&&count>0&&count<=available?count:null;
}
export function potionShop(state:TileTrialState,tileId:string):boolean {
  const b=state.tiles.find(t=>t.id===tileId)?.building;if(!b?.enabled)return false;
  if(b.typeId==='drug-store')return true;
  const gold=state.world.settlements[state.world.activeSettlementId!].inventory.gold;
  return b.typeId==='hospital'&&b.workers===buildingWorkerCap(b.typeId,b.level)&&gold>=TRIAL_BUILDINGS.hospital.upkeepMilli*b.level&&state.society!.stocksMilli.herbs>=OUTSIDE_TRIAL.hospitalHerbsPerLevelMilli*b.level;
}
export function healthLine(session:CharacterLifeSessionState):string {
  const hospital=session.city.tiles.some(t=>t.building?.typeId==='hospital'&&potionShop(session.city,t.id));
  return `Health ${session.player.character.health} / 100 · Regen +${characterTotals(session,session.player.character.id).regen!+Number(hospital)}/week`;
}
export const ITEM_GOAL_LABELS={calm:'Calm city',authority:'Authority 90+ for 4 weeks',week52:'Week 52',research:'Research complete'} as const;
export const WORKSHOP_IDLE_COPY='No orders completed. Check workers, supplies and upkeep.';
type CraftedOutput=NonNullable<ItemWeekReport['crafted']>[number];
export const craftWork=(entry:CraftedOutput)=>RECIPES[entry.recipeId].kind==='refine'?'Refined':ITEM_CATALOG[entry.output].category==='consumable'?'Brewed':'Crafted';
export const craftDestination=(place:CraftedOutput['place'])=>({inventory:'Inventory',consumables:'Potion inventory',materials:'Material stack',storage:'Temporary storage',ready:'Waiting for room'}[place]);
export function craftingHint(definition:ItemDefinition):string|null {
  if(!definition.slot||!['common','rare'].includes(definition.rarity))return null;
  const recipe=Object.values(RECIPES).find(recipe=>recipe.kind==='upgrade'&&recipe.workshops.includes('smithy')&&recipe.inputs.some(input=>ITEM_CATALOG[input.defId].name===definition.name));
  const material=recipe?.inputs.find(input=>ITEM_CATALOG[input.defId].category==='material');
  return material?`Can upgrade at the Smithy · Needs ${material.count} ${ITEM_CATALOG[material.defId].name} (${itemTitle(ITEM_CATALOG[material.defId].rarity)}).`:null;
}
export function itemReportRows(report:ItemWeekReport,id:'steward'|'quartermaster') {
  const rows:{label:string;value:string;tone:'gain'|'loss'|'muted'}[]=[];
  const add=(label:string,value:string,tone:'gain'|'loss'|'muted')=>rows.push({label,value,tone});
  if(id==='steward'){
    if(report.legendary)add('Legendary earned',`${ITEM_CATALOG[report.legendary.defId].name} · ${ITEM_GOAL_LABELS[report.legendary.goal]}`,'gain');
    for(const goal of report.pendingLegendary??[])add('Reward waiting',`${ITEM_GOAL_LABELS[goal]} · Make room in inventory or temporary storage.`,'loss');
  }else{
    for(const m of report.materials)add(m.lost?'Material lost':'Material found',`${ITEM_CATALOG[m.materialId].name} · ${m.tileId}${m.lost?' · stack full (999)':''}`,m.lost?'loss':'gain');
    if(report.found){const f=report.found;add(f.lost?'Item lost':'Item found',`${ITEM_CATALOG[f.defId].name} · ${f.lost?'inventory and temporary storage full':f.stored?'temporary storage':'inventory'}`,f.lost?'loss':'gain');}
    for(const id of report.expired)add('Expired item',ITEM_CATALOG[id].name,'loss');
    for(const entry of report.crafted??[]){
      const label=entry.place==='ready'?'Waiting for room':({Refined:'Material refined',Brewed:'Potion brewed',Crafted:'Item crafted'} as const)[craftWork(entry)];
      add(label,`${ITEM_CATALOG[entry.output].name} · ${entry.tileId} · ${craftDestination(entry.place)}`,entry.place==='ready'?'loss':'gain');
    }
    for(const tileId of report.workshopsIdle??[])add('Workshop idle',`${tileId} · ${WORKSHOP_IDLE_COPY}`,'loss');
  }
  return rows;
}

// Planning projection only: placement does not require workers, Herbs or upkeep.
export function craftingRecipes(state:TileTrialState,tileId:string) {
  const building=state.tiles.find(t=>t.id===tileId)?.building,items=state.society!.items;
  if(!building?.enabled||(items.workshops?.[tileId]?.orders.length??0)>=CRAFT_TRIAL.queueCap)return [];
  const gold=state.world.settlements[state.world.activeSettlementId!].inventory.gold;
  const owned=[...items.inventory,...items.consumables].sort((a,b)=>a.id-b.id);
  return Object.entries(RECIPES).flatMap(([recipeId,recipe])=>{
    if(!recipe.workshops.some(type=>type===building.typeId)||gold<recipe.feeMilli)return [];
    if(!recipe.inputs.every(input=>ITEM_CATALOG[input.defId].category==='material'?(items.materials[input.defId]??0)>=input.count:owned.some(item=>item.defId===input.defId)))return [];
    const itemInput=recipe.inputs.find(input=>ITEM_CATALOG[input.defId].category!=='material');
    const item=itemInput?owned.find(item=>item.defId===itemInput.defId):undefined;
    return [{recipeId,group:recipe.kind==='refine'?'Refine':recipe.kind==='upgrade'?'Upgrade':'Brew',inputs:recipe.inputs,
      before:itemInput?.defId,output:recipe.output,feeMilli:recipe.feeMilli,fields:{tileId,recipeId,...(item?{itemId:item.id}:{})}}];
  });
}

function postedEquipment(state:TileTrialState,npcs:readonly WorldNpc[],tileId:string) {
  const npc=npcs.find(n=>n.postTileId===tileId),equipped=state.society!.items.equipped;
  const worn=npc?Object.values(Object.hasOwn(equipped,npc.character.id)?equipped[npc.character.id]:{}).map(item=>ITEM_CATALOG[item.defId]):[];
  return {npc,worn};
}

// Project only the operation prelude of runTileTrialWeek. Shared tax/law/skill
// helpers and TRIAL data supply the rules; no clock, RNG or caller state changes.
function workshopOperation(state:TileTrialState,npcs:readonly WorldNpc[]) {
  const society=state.society!,settlement=state.world.settlements[state.world.activeSettlementId!];
  const baseTax=settlement.cohorts.reduce((total,c)=>total+BigInt(c.count),0n)*BigInt(TILE_TRIAL_BALANCE.taxGoldPerResident);
  const modifier=authorityTaxBps(society.order.authority)+lawTerms(society.laws.active).taxBps;
  // Counting House/positive tax top-ups and law costs happen after operation.
  let gold=BigInt(settlement.inventory.gold)+(modifier<0?baseTax*BigInt(10000+modifier)/10000n:baseTax);
  for(const id of society.laws.active)gold+=BigInt(LAW_CATALOG[id].effect.incomeMilli??0);
  const funded:TileTrialState['tiles']=[],idle=new Map<string,string>();
  for(const tile of state.tiles){
    const b=tile.building;if(!b?.enabled)continue;
    const d=TRIAL_BUILDINGS[b.typeId],due=BigInt(d.upkeepMilli)*BigInt(b.level);
    const batches=d.operation==='farm'?Math.min(b.workers,FARM_MAX_BATCHES,Number(gold/BigInt(FARM_GOLD_PER_BATCH_MILLI))):0;
    const batchGold=BigInt(batches)*BigInt(FARM_GOLD_PER_BATCH_MILLI),debit=due>batchGold?due:batchGold;
    if(gold<debit){idle.set(tile.id,'Idle this week: upkeep unpaid.');continue;}
    gold-=debit;funded.push(tile);
  }
  // All funded Herb output arrives before any Hospital consumes Herbs.
  let herbs=BigInt(society.stocksMilli.herbs);
  for(const tile of funded){
    const b=tile.building!;
    if(TRIAL_BUILDINGS[b.typeId].operation!=='herbs'||b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
    const {npc,worn}=postedEquipment(state,npcs,tile.id),effects=ITEM_TRIAL.effects;
    const skill=npc?effectiveSkills(npc.character.skills,worn,npc.character.socialClass).management:0;
    const skillPercent=Math.min(effects.outputCapPercent,Math.floor(Math.max(0,skill-effects.threshold)/effects.outputStep)*effects.outputPercent);
    const ledger=npc&&worn.some(d=>isWearable(d)&&isOpenItemSlot(d.slot)&&(!d.exclusiveClass||d.exclusiveClass===npc.character.socialClass)&&d.trait==='ledger')?effects.ledgerOutputPercent:0;
    herbs+=BigInt(b.workers)*BigInt(OUTSIDE_TRIAL.perWorker.herbs)*BigInt(100+skillPercent+ledger)/100n;
  }
  for(const tile of funded){
    const b=tile.building!;if(b.typeId!=='hospital'||b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
    const due=BigInt(b.level)*BigInt(OUTSIDE_TRIAL.hospitalHerbsPerLevelMilli);
    if(herbs<due)idle.set(tile.id,'Idle this week: not enough Herbs.');else herbs-=due;
  }
  return idle;
}

export function workshopForecast(state:TileTrialState,npcs:readonly WorldNpc[],tileId:string):{capacity:number;reason:string|null} {
  const b=state.tiles.find(t=>t.id===tileId)?.building;
  if(!b||!['smithy','hospital','drug-store'].includes(b.typeId))return {capacity:0,reason:'No workshop selected.'};
  if(!b.enabled)return {capacity:0,reason:'Idle this week: workshop paused.'};
  const reason=workshopOperation(state,npcs).get(tileId);
  if(reason)return {capacity:0,reason};
  if(b.typeId!=='drug-store'&&b.workers===0)return {capacity:0,reason:'Idle this week: no workers.'};
  if(b.typeId==='hospital'&&b.workers!==buildingWorkerCap(b.typeId,b.level))return {capacity:0,reason:'Idle this week: Hospital is not fully staffed.'};
  const {npc,worn}=postedEquipment(state,npcs,tileId);
  const skill=npc?effectiveSkills(npc.character.skills,worn,npc.character.socialClass)[b.typeId==='smithy'?'technical':'medical']:0;
  return {capacity:(b.typeId==='drug-store'?CRAFT_TRIAL.drugStoreBase:b.workers)+CRAFT_TRIAL.skillSteps.filter(step=>skill>=step).length,reason:null};
}
export const workshopCapacity=(state:TileTrialState,npcs:readonly WorldNpc[],tileId:string):number=>workshopForecast(state,npcs,tileId).capacity;
