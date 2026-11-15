// Read-only Step 0 candidate calculation. Writes only under local-drafts.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const read=p=>JSON.parse(fs.readFileSync(path.join(repo,p),'utf8'));
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex');
const data=read('packages/core/src/data/items.json'), original=structuredClone(data.definitions);
const slots=['weapon','earrings','necklace','ring','hand','top','bottom','shoes','set'];
const families={metal:['iron','silver','gold','ruby'],mineral:['glass','nitrate','amethyst'],cloth:['linen','wool','silk'],herb:['green-leaf','red-leaf','purple-leaf'],paper:['paper','rubber']};
for(const [family,ids] of Object.entries(families))for(const id of ids)data.definitions[id].family=family;
// Proposed deterministic append order: slot, rarity, kind. Existing entries keep their order.
// Set prices: preserve the existing per-slot Common/Rare price; new Epic sets use
// 3 x Epic's regular price, following the existing set-price pattern. Owner review requested.
for(const slot of slots)for(const rarity of ['common','rare','epic'])for(const kind of ['player','npc']){
  if(Object.values(data.definitions).some(d=>d.slot===slot&&d.rarity===rarity&&d.kind===kind))continue;
  const main=original[`common-${slot}`],secondary=original[`rare-${slot}`];
  const name=slot==='set'?{common:'Travelling Set',rare:'Steward Set',epic:'Noble Set'}[rarity]:`${{common:'Plain',rare:'Fine',epic:'Masterwork'}[rarity]} ${slot[0].toUpperCase()+slot.slice(1)}`;
  data.definitions[`${rarity}-${slot}-${kind}`]={name,category:main.category,rarity,kind,slot,mainStat:main.mainStat,...(rarity==='common'?{}:{secondaryStat:secondary.secondaryStat}),...(kind==='player'?{regen:data.ITEM_TRIAL.bonuses[rarity].regen}:{}),basePriceMilli:data.ITEM_TRIAL.marketPricesMilli[rarity]*(slot==='set'?3:1)};
}
function mixSeed(seed,week){return (Math.imul(seed^0x9e3779b9,0x85ebca6b)^Math.imul(week+1,0xc2b2ae35))>>>0;}
function random(seed){let state=seed;return()=>{state=(state+0x6d2b79f5)|0;let word=Math.imul(state^(state>>>15),state|1);word^=word+Math.imul(word^(word>>>7),word|61);return((word^(word>>>14))>>>0)/4294967296;};}
function itemRandom(seed,week,stream){return random(mixSeed(mixSeed(seed,week),{market:0x49544d31,find:0x49544631}[stream]));}
function pool(defs,rarity){return Object.keys(defs).filter(id=>defs[id].slot&&defs[id].rarity===rarity);}
function market(defs,seed,week=1){const rng=itemRandom(seed,week,'market');return ['common','rare','epic'].flatMap(rarity=>Array.from({length:data.ITEM_TRIAL.marketCounts[rarity]},()=>({defId:pool(defs,rarity)[Math.floor(rng()*pool(defs,rarity).length)],priceMilli:data.ITEM_TRIAL.marketPricesMilli[rarity]})));}
function finds(defs,seed,weeks){const items=[];for(let week=1;week<=weeks;week++){const rng=itemRandom(seed,week,'find'),roll=Math.floor(rng()*10000);const rarity=roll<2500?'common':roll<3500?'rare':roll<4100?'epic':null;if(rarity)items.push({id:items.length+1,defId:pool(defs,rarity)[Math.floor(rng()*pool(defs,rarity).length)]});}return items;}
const oldPin='fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6';
if(hash(original)!==oldPin)throw Error('Base catalog mismatch');
const buildings=read('packages/core/src/data/buildings.json'),tuning=read('packages/core/src/data/tuning.json');
const pins=[{name:'ITEM_CATALOG',before:hash(original),after:hash(data.definitions),reason:'15 material families and 32 missing wearable ladder definitions'}];
for(const [key,name] of [['trial','TRIAL_BUILDINGS'],['society','SOCIETY_BUILDINGS']]){
  const before=hash(buildings[key]);
  if(key==='trial')buildings.trial.smithy={name:'Smithy',operation:'society',terrain:['town'],maxLevel:2,maxWorkers:1,cost:{gold:10000,wood:6000,iron:6000},upkeepMilli:1000};
  else buildings.society.smithy.reserved=false;
  pins.push({name,before,after:hash(buildings[key]),reason:key==='trial'?'Decision 4 Smithy definition appended':'Smithy no longer reserved'});
}
const before=hash(tuning.SOCIETY_TRIAL);tuning.SOCIETY_TRIAL.rulesetId='tile-society-09';pins.push({name:'SOCIETY_TRIAL',before,after:hash(tuning.SOCIETY_TRIAL),reason:'Ruleset 08 to 09; Market pool changes'});
let e2eSeed=0;for(;e2eSeed<100000;e2eSeed++){const m=market(data.definitions,e2eSeed);if(m.find(o=>data.definitions[o.defId].kind==='npc')?.defId==='rare-set')break;}
if(e2eSeed===100000)throw Error('No proposed e2e seed');
const result={note:'Read-only candidate; not a golden/fixture generation or a RED/GREEN run.',appendOrder:'slot -> rarity -> kind, after original entries',setPriceProposal:'Common 15000 / Rare 45000 / Epic 120000; clarify Decision 2 in owner HOLD',pins,markets:Object.fromEntries([0,42,2026,20261028,4294967295,12345,e2eSeed].map(seed=>[seed,{before:market(original,seed),after:market(data.definitions,seed)}])),lawFiveWeeks:{before:finds(original,20261028,5),after:finds(data.definitions,20261028,5),marketAfter:market(data.definitions,20261028,6)},e2eSeed,unchangedWearables:Object.entries(original).filter(([,d])=>d.slot).every(([id,d])=>JSON.stringify(d)===JSON.stringify(data.definitions[id])),wearableCount:Object.values(data.definitions).filter(d=>d.slot).length};
fs.writeFileSync(path.join(out,'step0-candidate-items.json'),JSON.stringify(data,null,2)+'\n','utf8');
fs.writeFileSync(path.join(out,'step0-candidates.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify({pins,e2eSeed,wearableCount:result.wearableCount,unchangedWearables:result.unchangedWearables,oldSeedFirstNpc:result.markets[12345].after.find(o=>data.definitions[o.defId].kind==='npc'),lawFiveWeeks:result.lawFiveWeeks},null,2));
