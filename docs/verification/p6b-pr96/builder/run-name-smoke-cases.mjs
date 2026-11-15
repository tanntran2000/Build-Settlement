import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const expected=process.argv[2];assert.ok(/^[0-9a-f]{40}$/.test(expected??''));
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');assert.equal(head,expected);assert.equal(git('status','--porcelain=v1'),'');
const cases=JSON.parse(fs.readFileSync(path.join(out,'smoke-failed-cases.json'),'utf8'));assert.equal(cases.length,22);
const resultFile=path.join(out,'names-smoke-isolated-results.json');
const previous=fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile,'utf8')):null;
if(previous)assert.equal(previous.head,head);
const results=previous?.runs??[];
const save=status=>fs.writeFileSync(resultFile,JSON.stringify({head,tree,CI:'1',status,sourceFailuresHead:'b0c0b37cb25601b69f03b8844ac8a3f957304d4d',cases,runs:results},null,2)+'\n','utf8');
const ports=()=>spawnSync('powershell.exe',['-NoProfile','-Command',"$p = @(Get-NetTCPConnection -LocalPort 4173,4174 -State Listen -ErrorAction SilentlyContinue); if ($p.Count) { $p | Select-Object LocalPort,OwningProcess | ConvertTo-Json -Compress; exit 1 } else { Write-Output 'PORTS_4173_4174_FREE'; exit 0 }"],{encoding:'utf8',windowsHide:true});
for(const entry of cases){
 if(results.some(row=>row.case===entry.index&&row.exit===0)){continue;}
 for(let attempt=1;attempt<=2;attempt++){
  const label=`names-case-${String(entry.index).padStart(2,'0')}-run-${attempt}`,logName=`${label}.txt`,file=path.join(out,logName);
  const pre=ports();assert.equal(pre.status,0,`HOLD: port busy before ${label}; killed nothing`);
  const grep=entry.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),args=['node_modules/@playwright/test/cli.js','test',entry.file,'--grep',grep];
  const utc=new Date().toISOString(),start=Date.now();
  fs.writeFileSync(file,`HEAD: ${head}\nTree: ${tree}\nUTC: ${utc}\nCI=1\nExecutable: ${process.execPath}\nArguments: ${JSON.stringify(args)}\n${pre.stdout}\n`,'utf8');
  const result=spawnSync(process.execPath,args,{cwd:repo,env:{...process.env,CI:'1'},encoding:'utf8',maxBuffer:20*1024*1024,windowsHide:true});
  const output=(result.stdout??'')+(result.stderr??''),seconds=(Date.now()-start)/1000;
  fs.appendFileSync(file,output+`\nExit: ${result.status}\nUTC end: ${new Date().toISOString()}\nElapsed seconds: ${seconds}\n`,'utf8');
  assert.ok(/Running 1 test using 1 worker/.test(output),'Selection was not exactly one test');
  const post=ports();fs.appendFileSync(file,`Ports after: ${post.stdout}\n`,'utf8');
  results.push({case:entry.index,file:entry.file,name:entry.name,attempt,exit:result.status,seconds,utc,log:logName});save('RUNNING');
  assert.equal(post.status,0,`HOLD: port busy after ${label}; killed nothing`);
  console.log(`Case ${entry.index}/22 attempt ${attempt}, exit ${result.status}, ${seconds.toFixed(2)} s: ${entry.name}`);
  if(result.status===0){
   if(attempt===2){save('HOLD');throw Error('HOLD: a smoke failure was rerun once; preserve both outcomes');}
   break;
  }
  execFileSync(process.execPath,[path.join(out,'capture-smoke-artifacts.mjs'),label],{cwd:repo,encoding:'utf8'});
  if(attempt===2){save('HOLD');throw Error('HOLD: smoke failure reproduced on its one isolated rerun');}
 }
}
assert.equal(results.length,22);assert.ok(results.every(row=>row.exit===0));save('GREEN');
console.log('GREEN: all 22 formerly failing smoke cases pass separately at the clean naming-fix head; no failure rerun required.');
