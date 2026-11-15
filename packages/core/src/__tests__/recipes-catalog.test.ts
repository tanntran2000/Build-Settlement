import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import * as core from '../index.js';
import * as validation from '../data/validate.js';

// Catches missing ladders, changed historical definitions and invalid recipe economics.
const slots = ['weapon','earrings','necklace','ring','hand','top','bottom','shoes','set'] as const;
const tiers = ['common','rare','epic'] as const;
const families = {metal:['iron','silver','gold','ruby'],mineral:['glass','nitrate','amethyst'],cloth:['linen','wool','silk'],herb:['green-leaf','red-leaf','purple-leaf'],paper:['paper','rubber']};
const slotFamily = {weapon:'metal',earrings:'mineral',necklace:'mineral',ring:'mineral',hand:'metal',top:'cloth',bottom:'cloth',shoes:'cloth',set:'cloth'};
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');
const loadItems = () => JSON.parse(readFileSync(new URL('../data/items.json',import.meta.url),'utf8'));
const load = () => {
  expect(validation.validateRecipes).toBeTypeOf('function');
  return JSON.parse(readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
};
it('has exactly one non-Legendary wearable per slot, tier and wearer', () => {
  const wearables=Object.values(core.ITEM_CATALOG).filter(d=>d.slot&&d.rarity!=='legendary');
  expect(wearables).toHaveLength(54);
  for(const slot of slots)for(const rarity of tiers)for(const kind of ['player','npc'])expect(wearables.filter(d=>d.slot===slot&&d.rarity===rarity&&d.kind===kind)).toHaveLength(1);
});
it('preserves all 22 historical non-Legendary and four Legendary definitions byte for byte', () => {
  const originalIds=['common-weapon','rare-weapon','common-earrings','rare-earrings','common-necklace','rare-necklace','common-ring','rare-ring','common-hand','rare-hand','common-top','rare-top','common-bottom','rare-bottom','common-shoes','rare-shoes','epic-weapon','epic-top','epic-hand','epic-necklace','wardens-oath','crown-of-embers','ironhide-gloves','ledger-of-plenty','common-set','rare-set'];
  expect(hash(Object.fromEntries(originalIds.map(id=>[id,core.ITEM_CATALOG[id]])))).toBe('1413b93d1dbd2392ed64fa8b847cc6ad6a69cc57371b0c7d8b459580d9b72b25');
});
it('gives each new definition the approved id, stats, name, regen and price', () => {
  const newDefinitions=Object.entries(core.ITEM_CATALOG).filter(([id])=>/-(player|npc)$/.test(id));
  expect(newDefinitions).toHaveLength(32);
  for(const [id,d] of newDefinitions){
    const slot=d.slot!,rarity=d.rarity as typeof tiers[number];
    expect(id).toBe(`${rarity}-${slot}-${d.kind}`);
    expect(d.mainStat).toBe(core.ITEM_CATALOG[`common-${slot}`].mainStat);
    expect(d.secondaryStat).toBe(rarity==='common'?undefined:core.ITEM_CATALOG[`rare-${slot}`].secondaryStat);
    expect(d.regen).toBe(d.kind==='player'?{common:1,rare:2,epic:3}[rarity]:undefined);
    const name=slot==='set'?{common:'Travelling Set',rare:'Steward Set',epic:'Noble Set'}[rarity]:`${{common:'Plain',rare:'Fine',epic:'Masterwork'}[rarity]} ${slot[0].toUpperCase()+slot.slice(1)}`;
    expect(d.name).toBe(name);
    expect(d.basePriceMilli).toBe({common:5000,rare:15000,epic:40000}[rarity]*(slot==='set'?3:1));
  }
});
it('assigns every material to its approved family', () => {
  for(const [family,ids] of Object.entries(families))for(const id of ids)expect(core.ITEM_CATALOG[id].family).toBe(family);
  expect(Object.values(core.ITEM_CATALOG).filter(d=>d.category==='material')).toHaveLength(15);
});
it.each([
  ['missing family','iron',undefined,'items.json#iron.family: expected metal | mineral | cloth | herb | paper'],
  ['unknown family','iron','wood','items.json#iron.family: expected metal | mineral | cloth | herb | paper'],
  ['family on a wearable','common-ring','mineral','items.json#common-ring.family: material only'],
] as const)('rejects %s',(_name,id,family,message)=>{
  const copy=loadItems();copy.definitions[id].family=family;
  expect(()=>validation.validateItems(copy)).toThrow(message);
});
it('validates all 47 recipes and recursively freezes both public views', () => {
  const copy=load();expect(validation.validateRecipes(copy)).toEqual({recipes:core.RECIPES,CRAFT_TRIAL:core.CRAFT_TRIAL});
  expect(Object.keys(core.RECIPES)).toHaveLength(47);
  const frozen=(value:unknown)=>{if(value&&typeof value==='object'){expect(Object.isFrozen(value)).toBe(true);Object.values(value).forEach(frozen);}};
  frozen(core.RECIPES);frozen(core.CRAFT_TRIAL);
});
it('contains eight 2-to-1 same-family one-tier refinements and no Legendary output', () => {
  load();const refine=Object.entries(core.RECIPES).filter(([,r])=>r.kind==='refine');expect(refine).toHaveLength(8);
  expect(refine.map(([,r])=>r.output)).toEqual(['silver','gold','nitrate','amethyst','wool','silk','red-leaf','purple-leaf']);
  for(const [id,r] of refine){
    expect(id).toBe(`refine-${r.output}`);expect(r.inputs).toHaveLength(1);expect(r.inputs[0].count).toBe(2);
    const input=core.ITEM_CATALOG[r.inputs[0].defId],output=core.ITEM_CATALOG[r.output];
    expect(input.category).toBe('material');expect(output.category).toBe('material');expect(output.family).toBe(input.family);
    expect(tiers.indexOf(output.rarity as typeof tiers[number])).toBe(tiers.indexOf(input.rarity as typeof tiers[number])+1);
    expect(r.feeMilli).toBe(output.rarity==='rare'?1000:3000);
  }
});
it('contains 38 upgrades keeping slot and wearer with one matching material', () => {
  load();const upgrade=Object.entries(core.RECIPES).filter(([,r])=>r.kind==='upgrade');expect(upgrade).toHaveLength(38);
  for(const [id,r] of upgrade){
    expect(id).toBe(`upgrade-${r.output}`);expect(r.inputs).toHaveLength(2);expect(r.inputs.map(i=>i.count)).toEqual([1,1]);
    const item=core.ITEM_CATALOG[r.inputs[0].defId],material=core.ITEM_CATALOG[r.inputs[1].defId],output=core.ITEM_CATALOG[r.output];
    expect(output.slot).toBe(item.slot);expect(output.kind).toBe(item.kind);expect(material.category).toBe('material');
    expect(material.family).toBe(output.slot?slotFamily[output.slot as keyof typeof slotFamily]:'herb');
    expect(material.rarity).toBe(output.rarity);
    expect(tiers.indexOf(output.rarity as typeof tiers[number])).toBe(tiers.indexOf(item.rarity as typeof tiers[number])+1);
    expect(r.feeMilli).toBe(output.category==='consumable'?(output.rarity==='rare'?2000:4000):(output.rarity==='rare'?3000:8000));
  }
});
it('brews exactly one fixed Heal Potion I from two Green Leaves', () => {
  load();expect(Object.entries(core.RECIPES).filter(([,r])=>r.kind==='fixed')).toEqual([['brew-heal-potion-1',{kind:'fixed',workshops:['hospital','drug-store'],inputs:[{defId:'green-leaf',count:2}],output:'heal-potion-1',feeMilli:1000}]]);
});
it('routes metal/mineral/cloth to Smithy and herbs to Hospital and Drug Store', () => {
  load();for(const r of Object.values(core.RECIPES)){
    const output=core.ITEM_CATALOG[r.output];const family=output.family??(output.slot?slotFamily[output.slot as keyof typeof slotFamily]:'herb');
    expect(r.workshops).toEqual(family==='herb'?['hospital','drug-store']:['smithy']);
    expect(output.rarity).not.toBe('legendary');for(const input of r.inputs)expect(core.ITEM_CATALOG[input.defId].rarity).not.toBe('legendary');
  }
});
it('pins RECIPES and the exact CRAFT_TRIAL decision', () => {
  load();expect(hash(core.RECIPES)).toBe('7ccddfc8953ff24d17edf085224ffa8d9937a93080f6021d6379a38e11cc8065');
  expect(hash(core.CRAFT_TRIAL)).toBe('587e7927288b57df15e2ffa68b1f3244b8eba3b92b107c0da40e58fcdad7d6b8');
  expect(core.CRAFT_TRIAL).toEqual({marker:'TRIAL',queueCap:6,skillSteps:[60,80],drugStoreBase:1,slotFamily,fees:{refine:{rare:1000,epic:3000},upgrade:{rare:3000,epic:8000},potion:{'1':1000,'2':2000,'3':4000}}});
});
it('looks up the output rarity of each recipe and refuses an unknown id', () => {
  load();expect(core.recipeOutputTier).toBeTypeOf('function');
  expect(core.recipeOutputTier('brew-heal-potion-1')).toBe('common');expect(core.recipeOutputTier('refine-silver')).toBe('rare');expect(core.recipeOutputTier('upgrade-epic-set-npc')).toBe('epic');
  expect(()=>core.recipeOutputTier('missing')).toThrow('recipes.json#missing.id: unknown recipe id');
});
const malformed: {name:string;id:string;change:(r:any)=>void;field:string;rule:string}[] = [
  {name:'wrong upgrade family',id:'upgrade-rare-ring-player',change:r=>r.inputs[1].defId='silver',field:'inputs',rule:'material family must be mineral'},
  {name:'unknown input',id:'upgrade-rare-ring-player',change:r=>r.inputs[0].defId='missing',field:'inputs.0.defId',rule:'unknown item id'},
  {name:'unknown output',id:'upgrade-rare-ring-player',change:r=>r.output='missing',field:'output',rule:'unknown item id'},
  {name:'Legendary output',id:'upgrade-rare-ring-player',change:r=>r.output='crown-of-embers',field:'output',rule:'Legendary output is forbidden'},
  {name:'Legendary material output',id:'refine-gold',change:r=>r.output='ruby',field:'output',rule:'Legendary output is forbidden'},
  {name:'Legendary input',id:'brew-heal-potion-1',change:r=>r.inputs[0].defId='ruby',field:'inputs.0.defId',rule:'Legendary input is forbidden'},
  {name:'wrong refine count',id:'refine-silver',change:r=>r.inputs[0].count=1,field:'inputs',rule:'refine requires 2 of one material'},
  {name:'wrong refine family',id:'refine-silver',change:r=>r.inputs[0].defId='glass',field:'inputs',rule:'refine materials must have the same family'},
  {name:'skipped refine tier',id:'refine-gold',change:r=>r.inputs[0].defId='iron',field:'output',rule:'rarity must be one tier above input'},
  {name:'wearable refine input',id:'refine-silver',change:r=>r.inputs[0].defId='common-weapon',field:'inputs',rule:'refine requires 2 of one material'},
  {name:'wrong upgrade slot',id:'upgrade-rare-ring-player',change:r=>r.inputs[0].defId='common-necklace',field:'output',rule:'upgrade must preserve slot and kind'},
  {name:'wrong upgrade kind',id:'upgrade-rare-ring-player',change:r=>r.inputs[0].defId='common-ring-npc',field:'output',rule:'upgrade must preserve slot and kind'},
  {name:'wrong material tier',id:'upgrade-rare-ring-player',change:r=>r.inputs[1].defId='glass',field:'inputs',rule:'material rarity must equal output rarity'},
  {name:'skipped upgrade tier',id:'upgrade-epic-ring-player',change:r=>r.inputs[0].defId='common-ring',field:'output',rule:'rarity must be one tier above input'},
  {name:'extra upgrade item',id:'upgrade-rare-ring-player',change:r=>r.inputs.push({defId:'iron',count:1}),field:'inputs',rule:'upgrade requires 1 item and 1 material'},
  {name:'wrong upgrade count',id:'upgrade-rare-ring-player',change:r=>r.inputs[0].count=2,field:'inputs',rule:'upgrade requires 1 item and 1 material'},
  {name:'wrong fee',id:'upgrade-rare-ring-player',change:r=>r.feeMilli=1000,field:'feeMilli',rule:'must equal TRIAL fee 3000'},
  {name:'negative fee',id:'refine-silver',change:r=>r.feeMilli=-1,field:'feeMilli',rule:'expected integer >= 0'},
  {name:'zero count',id:'refine-silver',change:r=>r.inputs[0].count=0,field:'inputs.0.count',rule:'expected integer > 0'},
  {name:'fractional count',id:'refine-silver',change:r=>r.inputs[0].count=1.5,field:'inputs.0.count',rule:'expected integer > 0'},
  {name:'missing workshop',id:'refine-silver',change:r=>r.workshops=[],field:'workshops',rule:'expected nonempty array'},
  {name:'unknown workshop',id:'refine-silver',change:r=>r.workshops=['farm'],field:'workshops.0',rule:'expected smithy | hospital | drug-store'},
  {name:'wrong workshop',id:'refine-silver',change:r=>r.workshops=['hospital'],field:'workshops',rule:'metal recipes require smithy'},
  {name:'wrong herb workshop',id:'brew-heal-potion-1',change:r=>r.workshops=['smithy'],field:'workshops',rule:'herb recipes require hospital or drug-store'},
  {name:'duplicate workshops',id:'refine-silver',change:r=>r.workshops=['smithy','smithy'],field:'workshops',rule:'duplicate workshop'},
  {name:'unexpected field',id:'refine-silver',change:r=>r.random=true,field:'random',rule:'unexpected field'},
];
it.each(malformed)('rejects $name with an exact catalog reference', ({id,change,field,rule}) => {
  const copy=load();change(copy.recipes[id]);const before=JSON.stringify(copy);
  let error:unknown;try{validation.validateRecipes(copy);}catch(caught){error=caught;}
  expect(error).toBeInstanceOf(validation.CatalogError);expect((error as Error).message).toBe(`recipes.json#${id}.${field}: ${rule}`);expect(JSON.stringify(copy)).toBe(before);
});
it.each([
  ['queueCap',0,'expected integer > 0'],['skillSteps',[80,60],'expected strictly ascending skill steps in [0, 100]'],['drugStoreBase',-1,'expected integer >= 0'],
] as const)('rejects malformed TRIAL %s', (field,value,rule) => {
  const copy=load();copy.CRAFT_TRIAL[field]=value;expect(()=>validation.validateRecipes(copy)).toThrow(`recipes.json#CRAFT_TRIAL.${field}: ${rule}`);
});
