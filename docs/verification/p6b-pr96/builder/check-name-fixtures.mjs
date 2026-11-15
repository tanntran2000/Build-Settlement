import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const revision=JSON.parse(fs.readFileSync(path.join(out,'correction3-name-edits.json'),'utf8'));
const fixtures='packages/persistence/src/__tests__/fixtures/society-v9';
const files=['packages/simulation/src/__tests__/fixtures/catalog-golden.json',...fs.readdirSync(path.join(repo,fixtures)).map(name=>`${fixtures}/${name}`)];
const affectedNames=new Set(revision.names.flatMap(row=>[row.before,row.after]));
const rows=files.map(file=>{
 const bytes=fs.readFileSync(path.join(repo,file)),old=execFileSync('git',['show',`${revision.previousHead}:${file}`],{cwd:repo});
 assert.ok(bytes.equals(old),`Fixture bytes changed: ${file}`);
 const itemNamePaths=[];
 function walk(value,prefix=''){
  if(typeof value==='string'){
   if(affectedNames.has(value))itemNamePaths.push(prefix);
   if(prefix.endsWith('.session'))walk(JSON.parse(value),`${prefix}.decoded`);
  }else if(value&&typeof value==='object')for(const [key,child] of Object.entries(value))walk(child,prefix?`${prefix}.${key}`:key);
 }
 walk(JSON.parse(bytes.toString('utf8')));
 return {file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),affectedItemNamePaths:itemNamePaths,unchangedFromPreviousHead:true};
});
assert.ok(rows.every(row=>row.affectedItemNamePaths.length===0),'Affected item name was found in a stored fixture');
const result={utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),comparisonHead:revision.previousHead,files:rows,affectedItemNamesStored:false,regenerated:false,reason:'Golden and v9 checkpoints store item definition ids, not the affected display names. Production fixture/golden comparison tests run without generation flags and confirm unchanged bytes.'};
fs.writeFileSync(path.join(out,'name-fixture-inspection.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
