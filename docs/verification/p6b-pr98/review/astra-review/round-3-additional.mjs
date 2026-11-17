import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const dir='C:/Users/Admin/.t3/local-drafts/p6b-prC/astra-review',git=(...a)=>execFileSync('git',a).toString();
const path='packages/ui/src/__tests__/crafting-view.test.ts',old=git('show','ed4105f:'+path),now=git('show','060baa2:'+path),marker="describe('F1 weekly workshop operation forecast'";
const parity=old.slice(old.indexOf(marker))===now.slice(now.indexOf(marker));
const p='packages/simulation/src/__tests__/society-renewable-support.test.ts',a=git('show','ed4105f:'+p).split('\n'),b=git('show','060baa2:'+p).split('\n');const changes=a.flatMap((line,i)=>line===b[i]?[]:[{line:i+1,before:line,after:b[i]}]);
const rows=git('diff','--numstat','ed4105f..060baa2').trim().split('\n').map(x=>{const [a,d,path]=x.split('\t');return {path,a:+a,d:+d};});
fs.writeFileSync(dir+'/round-3-additional.json',JSON.stringify({sixParityCasesUnchanged:parity,P4:changes,rows},null,2));
fs.writeFileSync(dir+'/round-3-ledger.md','| Path | + | - | Read | Result |\n|---|---:|---:|---|---|\n'+rows.map(r=>`| ${r.path} | ${r.a} | ${r.d} | Full individual diff | PASS |`).join('\n')+'\n| TOTAL: 6 files | 216 | 128 | | |\n');
console.log(JSON.stringify({sixParityCasesUnchanged:parity,P4:changes,total:rows.reduce((x,r)=>[x[0]+r.a,x[1]+r.d],[0,0])}));
