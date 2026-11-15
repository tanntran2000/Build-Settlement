import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const read=file=>fs.readFileSync(path.join(repo,file),'utf8').replace(/\r\n/g,'\n');
const {base,edits,fileCounts}=JSON.parse(fs.readFileSync(path.join(out,'step0-proposed-edits.json'),'utf8'));
const phase=process.argv[2]??'A2';
const a1=JSON.parse(fs.readFileSync(path.join(out,'a1-applied-edits.json'),'utf8')).edits;
const naming=phase==='NAMES'?JSON.parse(fs.readFileSync(path.join(out,'correction3-name-edits.json'),'utf8')):null;
const p59=['A3','NAMES'].includes(phase)?JSON.parse(fs.readFileSync(path.join(out,'p59-edit.json'),'utf8')):null;
const effectiveEdits=naming?edits.map(e=>e.id==='P4'?{...e,after:naming.p4.after}:e):edits;
const expectedEdits=phase==='A1'?a1:p59?[...effectiveEdits,p59]:effectiveEdits;
if(p59){
 for(const [file,sha] of Object.entries(p59.approvedPackageSHA256))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex'),sha,`P1–P58 inventory changed: ${file}`);
 const oldFile=execFileSync('git',['show',`${p59.base}:${p59.file}`],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
 assert.equal(oldFile.split(p59.before).length,2,'P59 before block not unique');
 assert.equal(read(p59.file),oldFile.replace(p59.before,p59.after),'P59 changed other file bytes');
}
for(const file of Object.keys(fileCounts)){
 let expected=execFileSync('git',['show',`${base}:${file}`],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
 for(const e of expectedEdits.filter(e=>e.file===file))expected=expected.replace(e.before,e.after);
 assert.equal(read(file),expected,`Unapproved existing-test edit: ${file}`);
}
const itemCandidate=naming?'correction3-candidate-items.json':'step0-candidate-items.json';
assert.equal(read('packages/core/src/data/items.json'),fs.readFileSync(path.join(out,itemCandidate),'utf8'));
if(naming){
 const before=JSON.parse(fs.readFileSync(path.join(out,'step0-candidate-items.json'),'utf8')),after=JSON.parse(read('packages/core/src/data/items.json'));
 assert.equal(naming.names.length,32);
 for(const row of naming.names){assert.equal(after.definitions[row.id].name,row.after);after.definitions[row.id].name=row.before;}
 assert.deepEqual(after,before,'Data differs beyond the 32 approved name fields');
 let restoredBytes=read('packages/core/src/data/items.json');
 for(const row of naming.names){assert.equal(restoredBytes.split(JSON.stringify(row.after)).length,2);restoredBytes=restoredBytes.replace(JSON.stringify(row.after),JSON.stringify(row.before));}
 const previousBytes=execFileSync('git',['show',`${naming.previousHead}:packages/core/src/data/items.json`],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
 assert.equal(restoredBytes,previousBytes,'Item JSON bytes differ beyond the 32 new name strings');
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(repo,naming.helper.file))).digest('hex'),naming.helper.sha256,'Report helper bytes changed');
}
assert.equal(read('packages/core/src/data/recipes.json'),fs.readFileSync(path.join(out,'a1-candidate-recipes.json'),'utf8'));
const oldItems=JSON.parse(execFileSync('git',['show',`${base}:packages/core/src/data/items.json`],{cwd:repo,encoding:'utf8'}));
const items=JSON.parse(read('packages/core/src/data/items.json'));
let preserved=0;
for(const [id,d] of Object.entries(oldItems.definitions))if(d.slot){assert.equal(JSON.stringify(items.definitions[id]),JSON.stringify(d));preserved++;}
assert.deepEqual(items.ITEM_TRIAL,oldItems.ITEM_TRIAL);
const baseline=JSON.parse(fs.readFileSync(path.join(out,'step0-immutable-baseline.json'),'utf8'));
let historical=0;
for(const entry of baseline.filter(e=>e.file.includes('/fixtures/')&&!e.file.endsWith('/catalog-golden.json'))){
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(repo,entry.file))).digest('hex'),entry.sha256,entry.file);historical++;
}
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const candidate=JSON.parse(fs.readFileSync(path.join(out,'step0-candidates.json'),'utf8'));
const buildings=JSON.parse(read('packages/core/src/data/buildings.json')),tuning=JSON.parse(read('packages/core/src/data/tuning.json'));
const actual={ITEM_CATALOG:hash(items.definitions),TRIAL_BUILDINGS:hash(buildings.trial),SOCIETY_BUILDINGS:hash(buildings.society),SOCIETY_TRIAL:hash(tuning.SOCIETY_TRIAL)};
for(const p of candidate.pins)assert.equal(actual[p.name],naming&&p.name==='ITEM_CATALOG'?naming.itemCatalogPin:phase==='A1'&&p.name!=='ITEM_CATALOG'?p.before:p.after,p.name);
if(phase!=='A1'){
 const oldSociety=execFileSync('git',['show',`${base}:packages/core/src/trial/society.ts`],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
 assert.equal(read('packages/core/src/trial/society.ts'),oldSociety.replace("export const SOCIETY_RULESET = 'tile-society-08';","export const SOCIETY_RULESET = 'tile-society-09';"));
 assert.equal(tuning.SOCIETY_TRIAL.rulesetId,'tile-society-09');
 const oldTuning=JSON.parse(execFileSync('git',['show',`${base}:packages/core/src/data/tuning.json`],{cwd:repo,encoding:'utf8'}));
 oldTuning.SOCIETY_TRIAL.rulesetId='tile-society-09';assert.deepEqual(tuning,oldTuning);
 const oldBuildings=JSON.parse(execFileSync('git',['show',`${base}:packages/core/src/data/buildings.json`],{cwd:repo,encoding:'utf8'}));
 oldBuildings.trial.smithy={name:'Smithy',operation:'society',terrain:['town'],maxLevel:2,maxWorkers:1,cost:{gold:10000,wood:6000,iron:6000},upkeepMilli:1000};oldBuildings.society.smithy.reserved=false;assert.deepEqual(buildings,oldBuildings);
}
const changed=git('diff','--name-only',base).split(/\r?\n/).filter(Boolean);
assert.ok(!changed.some(f=>f.startsWith('docs/')));
const untracked=git('ls-files','--others','--exclude-standard').split(/\r?\n/).filter(Boolean);
const changedFiles=[...new Set([...changed,...untracked])].sort();
const allowed=new Set([...Object.keys(fileCounts),...['data/items.json','data/recipes.json','data/validate.ts','data/buildings.json','data/tuning.json','trial/items.ts','trial/recipes.ts','trial/society.ts','index.ts','__tests__/recipes-catalog.test.ts'].map(f=>`packages/core/src/${f}`),
 'packages/persistence/src/session-records.ts','packages/persistence/src/__tests__/society-v8-fixture.test.ts','packages/simulation/src/__tests__/smithy-data.test.ts',
 ...['catalog-golden.json','p6b-crafting-path-diff.ts','p6b-crafting-path-diff.txt'].map(f=>`packages/simulation/src/__tests__/fixtures/${f}`),
 ...fs.readdirSync(path.join(repo,'packages/persistence/src/__tests__/fixtures/society-v8')).map(f=>`packages/persistence/src/__tests__/fixtures/society-v9/${f}`)]);
assert.deepEqual(changedFiles.filter(f=>!allowed.has(f)),[],'Changed file outside the corrected PR A allowlist');
if(phase!=='A1'){
 const source=execFileSync('git',['show',`${base}:packages/persistence/src/session-records.ts`],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
 assert.equal(read('packages/persistence/src/session-records.ts'),source.replace('([1-7])','([1-8])').replace('    if (!hasWeeklyKeys(raw.society, keys)) return false;',"    if (v >= 8) keys.push('items');\n    if (!hasWeeklyKeys(raw.society, keys)) return false;"));
}
const inventory={utc:new Date().toISOString(),phase,base,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),approvedExistingTestBlocks:expectedEdits.length,approvedExistingTestFiles:new Set(expectedEdits.map(e=>e.file)).size,p59,p4Revision:naming?.p4,p1ThroughP58Unchanged:p59&&!naming?true:undefined,originalStep0InventoryUnchanged:p59?true:undefined,unchangedApprovedEditsExceptP4:naming?true:undefined,approvedNewNames:naming?.names,itemCandidate,preservedWearables:preserved,historicalFixtureFilesUnchanged:historical,pins:actual,candidateDataIdentical:true,changedFileCount:changedFiles.length,changedFiles,exit:0};
fs.writeFileSync(path.join(out,`edit-inventory-${phase.toLowerCase()}.json`),JSON.stringify(inventory,null,2)+'\n','utf8');
console.log(JSON.stringify(inventory,null,2));
