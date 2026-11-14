import fs from 'node:fs';
const {definitions:catalog,ITEM_TRIAL:trial}=JSON.parse(fs.readFileSync('packages/core/src/data/items.json','utf8'));
const mix=(seed,week)=>(Math.imul(seed^0x9e3779b9,0x85ebca6b)^Math.imul(week+1,0xc2b2ae35))>>>0;
function market(seed){
 let state=mix(mix(seed,1),0x49544d31);
 const rng=()=>{state=(state+0x6d2b79f5)|0;let w=Math.imul(state^(state>>>15),state|1);w^=w+Math.imul(w^(w>>>7),w|61);return ((w^(w>>>14))>>>0)/4294967296;};
 return ['common','rare','epic'].flatMap(rarity=>{
  const pool=Object.keys(catalog).filter(id=>['equipment','accessory','outfit'].includes(catalog[id].category)&&catalog[id].rarity===rarity);
  return Array.from({length:trial.marketCounts[rarity]},()=>({defId:pool[Math.floor(rng()*pool.length)],priceMilli:trial.marketPricesMilli[rarity]}));
 });
}
for(const seed of [0,42,2026,20261028,4294967295])console.log(seed,JSON.stringify(market(seed)));
