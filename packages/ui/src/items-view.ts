import { ITEM_CATALOG, ITEM_TRIAL, effectiveSkills, buildingWorkerCap, TRIAL_BUILDINGS, OUTSIDE_TRIAL, type ItemDefinition, type ItemsState, type Slot, type CharacterLifeSessionState, type Skill, type TileTrialState, type ItemWeekReport } from '@haven/core';

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
export const itemError=(code:string)=>({INVENTORY_FULL:'There is no room in the inventory.',KIND_MISMATCH:'Choose an item for this character.',SLOT_MISMATCH:'This item does not fit that slot.',STALE_COMMAND:'The inventory changed. Try again.',FORBIDDEN:'Plan next week before changing items.',ITEM_UNKNOWN:'This item is no longer available.',NOT_ENOUGH_GOLD:'Not enough Gold.',NO_SHOP:'This shop is not operating.',NOT_SELLABLE:'Legendary items cannot be sold.'}[code]??'The item action could not be completed.');

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
  }
  return rows;
}
