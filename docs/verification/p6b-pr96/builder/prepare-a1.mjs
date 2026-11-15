import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const {definitions}=JSON.parse(fs.readFileSync(path.join(out,'step0-candidate-items.json'),'utf8'));
const craft={marker:'TRIAL',queueCap:6,skillSteps:[60,80],drugStoreBase:1,slotFamily:{weapon:'metal',earrings:'mineral',necklace:'mineral',ring:'mineral',hand:'metal',top:'cloth',bottom:'cloth',shoes:'cloth',set:'cloth'},fees:{refine:{rare:1000,epic:3000},upgrade:{rare:3000,epic:8000},potion:{'1':1000,'2':2000,'3':4000}}};
const recipes={};
const chains=[['iron','silver','gold'],['glass','nitrate','amethyst'],['linen','wool','silk'],['green-leaf','red-leaf','purple-leaf']];
const workshops=family=>family==='herb'?['hospital','drug-store']:['smithy'];
for(const chain of chains)for(let i=1;i<3;i++){
 const output=chain[i],d=definitions[output];recipes[`refine-${output}`]={kind:'refine',workshops:workshops(d.family),inputs:[{defId:chain[i-1],count:2}],output,feeMilli:craft.fees.refine[d.rarity]};
}
for(const slot of Object.keys(craft.slotFamily))for(const rarity of ['rare','epic'])for(const kind of ['player','npc']){
 const output=Object.keys(definitions).find(id=>{const d=definitions[id];return d.slot===slot&&d.rarity===rarity&&d.kind===kind;});
 const input=Object.keys(definitions).find(id=>{const d=definitions[id];return d.slot===slot&&d.rarity===(rarity==='rare'?'common':'rare')&&d.kind===kind;});
 const material=chains.find(c=>definitions[c[0]].family===craft.slotFamily[slot])[rarity==='rare'?1:2];
 recipes[`upgrade-${output}`]={kind:'upgrade',workshops:['smithy'],inputs:[{defId:input,count:1},{defId:material,count:1}],output,feeMilli:craft.fees.upgrade[rarity]};
}
for(const tier of [2,3]){const output=`heal-potion-${tier}`;recipes[`upgrade-${output}`]={kind:'upgrade',workshops:['hospital','drug-store'],inputs:[{defId:`heal-potion-${tier-1}`,count:1},{defId:tier===2?'red-leaf':'purple-leaf',count:1}],output,feeMilli:craft.fees.potion[tier]};}
recipes['brew-heal-potion-1']={kind:'fixed',workshops:['hospital','drug-store'],inputs:[{defId:'green-leaf',count:2}],output:'heal-potion-1',feeMilli:1000};
const hash=v=>createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex');
const original=JSON.parse(execFileSync('git',['show','e859177:packages/core/src/data/items.json'],{cwd:repo,encoding:'utf8'}));
const oldWearables=Object.fromEntries(Object.entries(original.definitions).filter(([,d])=>d.slot));
fs.writeFileSync(path.join(out,'a1-candidate-recipes.json'),JSON.stringify({recipes,CRAFT_TRIAL:craft},null,2)+'\n','utf8');
fs.writeFileSync(path.join(out,'a1-candidate-pins.json'),JSON.stringify({RECIPES:hash(recipes),CRAFT_TRIAL:hash(craft),originalWearables:hash(oldWearables)},null,2)+'\n','utf8');
console.log(JSON.stringify({recipes:Object.keys(recipes).length,RECIPES:hash(recipes),CRAFT_TRIAL:hash(craft),originalWearables:hash(oldWearables)},null,2));
