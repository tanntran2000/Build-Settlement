// Generate reviewable proposals only. This script never writes to the repository.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const files=git('ls-files').split('\n'),read=p=>fs.readFileSync(path.join(repo,p),'utf8').replace(/\r\n/g,'\n');
const candidate=JSON.parse(fs.readFileSync(path.join(out,'step0-candidates.json'),'utf8'));
const edits=[];
function add(file,before,after,reason){
 const text=read(file),at=text.indexOf(before);
 if(at<0||text.indexOf(before,at+1)>=0)throw Error(`Non-unique proposal ${file}: ${before.slice(0,90)}`);
 edits.push({file,line:text.slice(0,at).split('\n').length,before,after,reason});
}
const tests=files.filter(p=>/\.(test|spec)\.ts$/.test(p)&&!p.startsWith('docs/'));
for(const file of tests){
 for(const line of read(file).split('\n')){
  if(line.includes('tile-society-08')||line.includes('society-v8'))add(file,line,line.replaceAll('tile-society-08','tile-society-09').replaceAll('society-v8','society-v9'),'Decision 7: current ruleset / fixture route moves to 09 / v9. Keep the matcher, setup and all other fields unchanged; v8 files stay immutable.');
 }
}
const catalog='packages/core/src/__tests__/items-catalog.test.ts';
add(catalog,"it('contains 26 wearables: 9 Common, 9 Rare, 4 Epic, 4 Legendary; 3 potions and 15 materials', async () => {","it('contains 58 wearables: 18 Common, 18 Rare, 18 Epic, 4 Legendary; 3 potions and 15 materials', async () => {",'Decision 2: complete 54 non-Legendary ladder plus 4 Legendary.');
add(catalog,'  expect(worn).toHaveLength(26);','  expect(worn).toHaveLength(58);','Decision 2: exact complete catalog count.');
add(catalog,'  for(const [r,n] of Object.entries({common:9,rare:9,epic:4,legendary:4}))expect(worn.filter(d=>d.rarity===r)).toHaveLength(n);','  for(const [r,n] of Object.entries({common:18,rare:18,epic:18,legendary:4}))expect(worn.filter(d=>d.rarity===r)).toHaveLength(n);','Decision 2: 9 slots x 2 kinds per non-Legendary rarity; Legendary unchanged.');
add(catalog,"  expect(defs.filter(d=>d.slot==='set').map(d=>d.rarity)).toEqual(['common','rare']);","  expect(defs.filter(d=>d.slot==='set').map(d=>d.rarity)).toEqual(['common','rare','common','rare','epic','epic']);",'Decision 2: retain original sets first; append missing sets in rarity/kind order.');
const pins='packages/core/src/__tests__/catalog-data.test.ts';
for(const pin of candidate.pins){const line=read(pins).split('\n').find(s=>s.includes(pin.before));add(pins,line,line.replace(pin.before,pin.after),pin.reason+'; exact candidate JSON.stringify SHA-256.');}
const map='packages/core/src/trial/__tests__/society-map.test.ts';
add(map,"it('pins all nineteen active town building names to the approved catalog', () => {","it('pins all twenty active town building names to the approved catalog', () => {",'Decision 4: one active town building added.');
add(map,"    'drug-store': 'Drug Store',","    'drug-store': 'Drug Store',\n    smithy: 'Smithy',",'Decision 4: exact equality now includes Smithy.');
add(map,"    smithy: { staff: 'makers', reserved: true },\n",'', 'Decision 4: Smithy no longer belongs in the reserved subset; all remaining entries exact.');
const observation='packages/simulation/src/__tests__/character-life-observation.test.ts';
const buildingLine=read(observation).split('\n').find(s=>s.includes('expect(o.buildings.map(b => b.typeId)).toEqual(['));
add(observation,buildingLine,buildingLine.replace("'drug-store']);","'drug-store', 'smithy']);"),'Decision 4: Smithy appended to TRIAL_BUILDINGS; preserve ordered exact building-id assertion.');
const coreItems='packages/core/src/trial/__tests__/items.test.ts';
add(coreItems,"it('starts society v8 with a deterministic 4/2/2 market and an empty inventory',()=>{","it('starts society v9 with a deterministic 4/2/2 market and an empty inventory',()=>{",'Decision 7: test title follows the current ruleset.');
const records='packages/persistence/src/__tests__/item-records.test.ts';
add(records,"it('loads every new v8 Character Life fixture as current and round-trips exact bytes',()=>{","it('loads every new v9 Character Life fixture as current and round-trips exact bytes',()=>{",'Decision 7: test title follows the current fixture set.');
function marketBlock(file,index,seed,indent){
 const text=read(file),matches=[...text.matchAll(/market: (?:seed === 0 \? )?\[\n([\s\S]*?)\n\s*\]/g)];
 const match=matches[index];if(!match)throw Error('Market block not found '+file);
 const before=match[1];
 const oldIds=[...before.matchAll(/defId: '([^']+)'/g)].map(m=>m[1]);
 if(JSON.stringify(oldIds)!==JSON.stringify(candidate.markets[seed].before.map(o=>o.defId)))throw Error('Market RNG baseline mismatch '+file+':'+seed);
 const after=candidate.markets[seed].after.map(o=>`${indent}{ defId: '${o.defId}', priceMilli: ${o.priceMilli} },`).join('\n');
 add(file,before,after,`Decision 2: pin the enlarged pool's exact week-1 Market for seed ${seed}; preserve the whole-state matcher.`);
}
marketBlock('packages/core/src/trial/__tests__/society.test.ts',0,2026,'        ');
marketBlock('packages/core/src/trial/__tests__/society.test.ts',1,20261028,'      ');
const world='packages/core/src/world/__tests__/session.test.ts';
const wtext=read(world),start=wtext.indexOf('    { defId:',wtext.indexOf('market: seed === 0 ? [')),end=wtext.indexOf('\n  ] } } });',start);
const oldWorld=wtext.slice(start,end),parts=oldWorld.split('\n  ] : [\n');
for(const [i,seed] of [0,4294967295].entries())if(JSON.stringify([...parts[i].matchAll(/defId: '([^']+)'/g)].map(m=>m[1]))!==JSON.stringify(candidate.markets[seed].before.map(o=>o.defId)))throw Error('World baseline RNG mismatch');
const toLines=seed=>candidate.markets[seed].after.map(o=>`    { defId: '${o.defId}', priceMilli: ${o.priceMilli} },`).join('\n');
add(world,oldWorld,toLines(0)+'\n  ] : [\n'+toLines(4294967295),'Decision 2: exact ordered Markets for seed 0 and uint32-max, every outside-world assertion unchanged.');
const law='packages/simulation/src/__tests__/law-week.test.ts',ltext=read(law),ls=ltext.indexOf('  "nextItemId": 2,'),le=ltext.indexOf('\n}});',ls);
const oldLaw=ltext.slice(ls,le),newItems={nextItemId:2,inventory:candidate.lawFiveWeeks.after,consumables:[],materials:{},storage:[],equipped:{},market:candidate.lawFiveWeeks.marketAfter,goals:{calm:false,authority:false,week52:false,research:false,rebellionSeen:false,authorityStreak:0}};
const newLaw=JSON.stringify(newItems,null,2).slice(2,-2);
add(law,oldLaw,newLaw,'Decision 2: only the item find id and exact Market data change in this whole-object expectation; law and old non-item gameplay equality remain intact.');
add('tests/e2e/items.spec.ts','function funded(seed=12345) {',`function funded(seed=${candidate.e2eSeed}) {`,'Decision 2 expands Market pools. Seed 12345 now buys common-bottom-npc first (negotiation), and has no rare-set. Seed 82 first NPC offer is the unchanged rare-set. Preserve real BUY_ITEM, keyboard equip, item-id, management/Farm Wheat inequality and exact session equality assertions.');
// Order proposals by path/line, retaining base line numbers.
edits.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line);
for(const [i,e] of edits.entries())e.id=`P${i+1}`;
// Reject overlaps so an approved package is unambiguous.
for(let i=1;i<edits.length;i++){const a=edits[i-1],b=edits[i];if(a.file===b.file&&a.line+a.before.split('\n').length-1>b.line)throw Error('Overlapping proposals '+a.id+' '+b.id);}
const fileCounts=Object.fromEntries([...new Set(edits.map(e=>e.file))].map(file=>[file,edits.filter(e=>e.file===file).length]));
fs.writeFileSync(path.join(out,'step0-proposed-edits.json'),JSON.stringify({base:git('rev-parse','HEAD'),edits,fileCounts},null,2)+'\n','utf8');
let md='# P6-B PR A Step 0 proposed existing-test edits\n\nStatus: PROPOSED ONLY. Owner approval required before application.\n\nBase: `'+git('rev-parse','HEAD')+'`\n\n'+edits.length+' exact edit blocks across '+Object.keys(fileCounts).length+' existing test files. Base line numbers; no matcher, timeout or threshold is changed.\n\n';
md+='Catalog and pin values use `step0-candidate-items.json` and the deterministic append order recorded in `step0-candidates.mjs`. The set-price interpretation is explicitly pending owner clarification in `step0-preflight.md`.\n\n';
for(const e of edits)md+=`## ${e.id} - ${e.file}:${e.line}\n\n${e.reason}\n\nBefore:\n\n\`\`\`ts\n${e.before}\n\`\`\`\n\nAfter:\n\n\`\`\`ts\n${e.after||'// Delete this line; no replacement text.'}\n\`\`\`\n\n`;
fs.writeFileSync(path.join(out,'step0-proposed-edits.md'),md,'utf8');
const baselineFiles=files.filter(f=>/fixtures\/.+\.json$/.test(f)||/catalog-data\.test\.ts$/.test(f));
const baseline=baselineFiles.map(file=>({file,gitBlob:git('rev-parse',`HEAD:${file}`),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,file))).digest('hex')}));
fs.writeFileSync(path.join(out,'step0-immutable-baseline.json'),JSON.stringify(baseline,null,2)+'\n','utf8');
console.log(JSON.stringify({blocks:edits.length,files:Object.keys(fileCounts).length,fileCounts,baselineFiles:baseline.length},null,2));
