import { ITEM_CATALOG, ITEM_TRIAL, effectiveSkills, type ItemDefinition, type ItemsState, type Slot, type CharacterLifeSessionState, type Skill } from '@haven/core';

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
