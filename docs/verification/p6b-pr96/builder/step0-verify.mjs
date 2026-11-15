import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const read=p=>fs.readFileSync(path.join(repo,p),'utf8').replace(/\r\n/g,'\n');
const {base,edits,fileCounts}=JSON.parse(fs.readFileSync(path.join(out,'step0-proposed-edits.json'),'utf8'));
const errors=[];
if(base!=='e85917733e229701830ad7f53dfcfbe2fefab831'||git('rev-parse','HEAD')!==base)errors.push('HEAD changed');
if(git('status','--porcelain=v1'))errors.push('Working tree is not clean');
for(const file of Object.keys(fileCounts)){
 const original=read(file);let proposed=original;
 for(const e of edits.filter(e=>e.file===file)){
  if(original.split(e.before).length!==2)errors.push(e.id+' does not have a unique before block');
  if(original.slice(0,original.indexOf(e.before)).split('\n').length!==e.line)errors.push(e.id+' line mismatch');
  if(e.before===e.after)errors.push(e.id+' is a no-op');
  proposed=proposed.replace(e.before,e.after);
 }
 if(/tile-society-08|society-v8/.test(proposed))errors.push(file+' retains an unaccounted current v8 reference');
}
const files=git('ls-files').split('\n');let auditedTests=0;
for(const file of files.filter(p=>/\.(test|spec)\.ts$/.test(p)&&!p.startsWith('docs/'))){
 auditedTests++;
 const text=read(file);
 if(/tile-society-08|society-v8/.test(text)&&!fileCounts[file])errors.push('Uninventoried current v8 test '+file);
}
const baseline=JSON.parse(fs.readFileSync(path.join(out,'step0-immutable-baseline.json'),'utf8'));
for(const entry of baseline){
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,entry.file))).digest('hex');
 if(sha256!==entry.sha256||git('rev-parse',`HEAD:${entry.file}`)!==entry.gitBlob)errors.push('Changed baseline '+entry.file);
}
const candidates=JSON.parse(fs.readFileSync(path.join(out,'step0-candidates.json'),'utf8'));
if(!candidates.unchangedWearables||candidates.wearableCount!==58)errors.push('Candidate violates preserved wearable / count invariant');
const outcome={utc:new Date().toISOString(),head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),status:git('status','--porcelain=v1'),auditedTestFiles:auditedTests,proposedBlocks:edits.length,proposedTestFiles:Object.keys(fileCounts).length,immutableBaselineFiles:baseline.length,checks:'Proposals uniquely match their base line numbers; all current v8 test references covered; no repository edits; golden/fixtures/pin source unchanged; candidate preserves all 26 existing wearables.',errors,exit:errors.length?1:0,note:'This is a read-only Step 0 evidence check, not implementation verification or a RED/GREEN run.'};
fs.writeFileSync(path.join(out,'step0-verification.txt'),JSON.stringify(outcome,null,2)+'\n','utf8');console.log(JSON.stringify(outcome,null,2));
process.exitCode=outcome.exit;
