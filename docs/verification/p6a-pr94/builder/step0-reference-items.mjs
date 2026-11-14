// Proposed draw schedule for owner review. Independent reference only; no product edits.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const evidence=path.dirname(fileURLToPath(import.meta.url));
const {definitions:catalog,ITEM_TRIAL:t}=JSON.parse(fs.readFileSync('packages/core/src/data/items.json','utf8'));
const mix=(seed,week)=>(Math.imul(seed^0x9e3779b9,0x85ebca6b)^Math.imul(week+1,0xc2b2ae35))>>>0;
function rng(seed,week,salt){let state=mix(mix(seed,week),salt);return ()=>{state=(state+0x6d2b79f5)|0;let w=Math.imul(state^(state>>>15),state|1);w^=w+Math.imul(w^(w>>>7),w|61);return ((w^(w>>>14))>>>0)/4294967296;};}
const pool=rarity=>Object.keys(catalog).filter(id=>['equipment','accessory','outfit'].includes(catalog[id].category)&&catalog[id].rarity===rarity);
function market(seed,week){const r=rng(seed,week,0x49544d31);return ['common','rare','epic'].flatMap(rarity=>Array.from({length:t.marketCounts[rarity]},()=>({defId:pool(rarity)[Math.floor(r()*pool(rarity).length)],priceMilli:t.marketPricesMilli[rarity]})));}
function after(seed,weeks){
 const inventory=[],draws=[];
 for(let week=1;week<=weeks;week++){
  const r=rng(seed,week,0x49544631),roll=Math.floor(r()*10000);let ceiling=0,rarity=null;
  for(const candidate of ['common','rare','epic']){ceiling+=t.findOddsBps[candidate];if(roll<ceiling){rarity=candidate;break;}}
  const defId=rarity?pool(rarity)[Math.floor(r()*pool(rarity).length)]:null;
  if(defId)inventory.push({id:inventory.length+1,defId});draws.push({week,roll,rarity,defId});
 }
 return {draws,items:{nextItemId:inventory.length+1,inventory,consumables:[],materials:{},storage:[],equipped:{},market:market(seed,weeks+1),goals:{calm:false,authority:false,week52:false,research:false,rebellionSeen:false,authorityStreak:0}}};
}
const results={};
for(const [name,weeks] of [['life-5-weeks',5],['life-laws',3]]){
 const file=`packages/persistence/src/__tests__/fixtures/society-v8/${name}.json`,before=JSON.parse(fs.readFileSync(file,'utf8'));
 const reference=after(20261028,weeks);results[name]=reference;
 const proposal=structuredClone(before);proposal.state.city.society.items=reference.items;
 fs.mkdirSync(path.join(evidence,'proposed-fixtures'),{recursive:true});
 fs.writeFileSync(path.join(evidence,'proposed-fixtures',name+'.json'),JSON.stringify(proposal),'utf8');
}
const buildings=JSON.parse(fs.readFileSync('packages/core/src/data/buildings.json','utf8'));
const sha=v=>createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex');
const definition={name:'Drug Store',operation:'society',terrain:['town'],maxLevel:1,maxWorkers:0,cost:structuredClone(buildings.trial.hospital.cost),upkeepMilli:buildings.trial.hospital.upkeepMilli};
results.drugStore={definition,oldTrialHash:sha(buildings.trial),oldSocietyHash:sha(buildings.society)};
buildings.trial['drug-store']=definition;buildings.society['drug-store'].reserved=false;
Object.assign(results.drugStore,{proposedTrialHash:sha(buildings.trial),proposedSocietyHash:sha(buildings.society)});
fs.writeFileSync(path.join(evidence,'step0-proposed-items-and-pins.json'),JSON.stringify(results,null,2)+'\n','utf8');
console.log(JSON.stringify(results,null,2));
