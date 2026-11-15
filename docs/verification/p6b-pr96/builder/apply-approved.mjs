import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const {base,edits}=JSON.parse(fs.readFileSync(path.join(out,'step0-proposed-edits.json'),'utf8'));
const a1=new Set([4,5,6,7,8,20,21,22,42,49].map(n=>`P${n}`));
const task=process.argv[2];assert.ok(['A1','A2'].includes(task));
const selected=edits.filter(e=>a1.has(e.id)===(task==='A1'));
for(const file of new Set(selected.map(e=>e.file))){
 const original=execFileSync('git',['show',`${base}:${file}`],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n');
 const filePath=path.join(repo,file),current=fs.readFileSync(filePath,'utf8').replace(/\r\n/g,'\n');
 let expected=original;
 if(task==='A2')for(const e of edits.filter(e=>e.file===file&&a1.has(e.id)))expected=expected.replace(e.before,e.after);
 assert.equal(current,expected,`Unexpected pre-edit bytes: ${file}`);
 for(const e of selected.filter(e=>e.file===file)){assert.equal(expected.split(e.before).length,2,e.id);expected=expected.replace(e.before,e.after);}
 fs.writeFileSync(filePath,expected,'utf8');
}
fs.writeFileSync(path.join(out,`${task.toLowerCase()}-applied-edits.json`),JSON.stringify({task,base,edits:selected},null,2)+'\n','utf8');
console.log(`${task}: applied ${selected.length} approved exact blocks in ${new Set(selected.map(e=>e.file)).size} files; nothing else in those files.`);
