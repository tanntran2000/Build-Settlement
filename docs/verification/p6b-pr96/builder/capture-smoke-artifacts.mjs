import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const label=process.argv[2];if(!label||!/^[a-z0-9-]+$/.test(label))throw Error('A bounded artifact label is required');
const source=path.join(repo,'test-results'),target=path.join(out,`smoke-${label}-artifacts`),rows=[];
fs.mkdirSync(target,{recursive:true});
for(const entry of fs.readdirSync(source,{withFileTypes:true}))if(entry.isDirectory()){
 const folder=path.join(source,entry.name);
 if(!fs.existsSync(path.join(folder,'error-context.md')))continue;
 for(const name of ['error-context.md','trace.zip']){
  const original=path.join(folder,name);if(!fs.existsSync(original))continue;
  const relative=`${entry.name}/${name}`,dest=path.join(target,relative),bytes=fs.readFileSync(original);
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
  rows.push({file:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),over1MB:bytes.length>1000000});
 }
}
const result={utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),label,artifacts:rows,note:'Raw local failure artifacts preserved before a later Playwright run can replace test-results. Files over 1 MB should be represented by hashes for later docs-branch publication.'};
fs.writeFileSync(path.join(target,'artifacts.json'),JSON.stringify(result,null,2)+'\n','utf8');
fs.writeFileSync(path.join(target,'SHA256SUMS.txt'),rows.map(r=>`${r.sha256}  ${r.file}`).join('\n')+'\n','utf8');
console.log(JSON.stringify(result,null,2));
