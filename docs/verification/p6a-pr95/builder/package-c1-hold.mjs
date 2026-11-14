import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const tag=process.argv[2]??'C1';
if(!/^C1(?:-attempt3)?$/.test(tag))throw Error('Unexpected package tag');
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trimEnd();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const base='2c04321ba342871e6a858110ea2320a8e4df0d5d';
const baseline=JSON.parse(fs.readFileSync(root+'step0-immutable-baseline.json','utf8'));
const inventory=JSON.parse(fs.readFileSync(root+'step0-proposed-edits.json','utf8'));
const failures=[];
for(const e of baseline.files){
 if(sha(fs.readFileSync(e.file))!==e.sha256)failures.push('Immutable working bytes changed: '+e.file);
 if(git(['rev-parse',`${base}:${e.file}`])!==git(['rev-parse',`HEAD:${e.file}`]))failures.push('Immutable committed bytes changed: '+e.file);
}
for(const {file} of inventory.files){
 let expected=git(['show',`${base}:${file}`]).replace(/\r\n/g,'\n')+'\n';
 for(const e of inventory.edits.filter(e=>e.file===file&&e.task==='C1'))expected=expected.replace(e.before,e.after);
 if(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==expected)failures.push('Applied edit differs: '+file);
}
const tracked=git(['diff','--name-only','HEAD']).split('\n').filter(Boolean);
const untracked=git(['ls-files','--others','--exclude-standard']).split('\n').filter(Boolean);
const allowed=new Set(['packages/ui/src/CharacterProfile.svelte','packages/ui/src/CharacterLifeCharacters.svelte','packages/ui/src/EquipmentView.svelte','packages/ui/src/ItemCard.svelte','packages/ui/src/items-view.ts','packages/ui/src/__tests__/items-view.test.ts','tests/e2e/items.spec.ts','tests/e2e/character-life-boundary.spec.ts','tests/e2e/character-life-navigation.spec.ts']);
for(const file of [...tracked,...untracked]){
 if(!allowed.has(file))failures.push('Unexpected change: '+file);
 const destination=path.join(root,tag+'-working-tree-snapshot',file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(file,destination);
}
fs.writeFileSync(root+tag+'-working-tree.patch',git(['diff','--binary','HEAD'])+'\n','utf8');
const inputs=['C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-3acfafd.md','C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-b5ec12c.md','C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md','AGENTS.md'];
fs.writeFileSync(root+'binding-inputs.json',JSON.stringify(inputs.map(file=>({file,sha256:sha(fs.readFileSync(file))})),null,2)+'\n','utf8');
if(!process.env.P6C_STEP0_PORTS_UTC)throw Error('Check ports in this shell first');
const state={HEAD:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),UTC:new Date().toISOString(),exit:failures.length?1:0,status:'C1 anti-loop HOLD',branch:git(['branch','--show-current']),gitStatus:git(['status','--porcelain=v1']),commits:[],ports:{checkedUTC:process.env.P6C_STEP0_PORTS_UTC,4173:'free',4174:'free'},protectedFilesUnchanged:baseline.files.length,applied:inventory.edits.filter(e=>e.task==='C1').map(e=>e.id),pending:inventory.edits.filter(e=>e.task==='C2').map(e=>e.id),changedFiles:[...tracked,...untracked],failures};
fs.writeFileSync(root+tag+'-hold-state.json',JSON.stringify(state,null,2)+'\n','utf8');
function list(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const artifactRoot='C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright';
fs.writeFileSync(root+'LOCAL-ONLY.json',JSON.stringify({reason:'Large Playwright failure artifacts remain outside the evidence folder.',files:list(artifactRoot).map(file=>({file,bytes:fs.statSync(file).size,sha256:sha(fs.readFileSync(file))}))},null,2)+'\n','utf8');
const covered=list(root).filter(file=>path.relative(root,file).replaceAll('\\','/')!=='SHA256SUMS.txt').sort();
for(const file of covered)if(fs.readFileSync(file,'utf8').includes('\ufffd'))throw Error('Invalid UTF-8: '+file);
const report=fs.readFileSync(root+'C1-HOLD.md','utf8');if(!report.includes('\u2014')||!fs.readFileSync(root+'STEP0-HOLD.md','utf8').includes('T\u00e2n'))throw Error('Non-ASCII damaged');
const manifest=covered.map(file=>sha(fs.readFileSync(file))+'  '+path.relative(root,file).replaceAll('\\','/')).join('\n')+'\n';
fs.writeFileSync(root+'SHA256SUMS.txt',manifest,'utf8');
for(const line of manifest.trimEnd().split('\n')){const [expected,file]=line.split('  ');if(sha(fs.readFileSync(path.join(root,file)))!==expected)throw Error('Manifest mismatch: '+file);}
console.log(JSON.stringify({...state,evidenceFiles:covered.length+1,manifestEntries:covered.length},null,2));process.exitCode=state.exit;
