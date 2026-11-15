import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
assert.equal(head,'b0c0b37cb25601b69f03b8844ac8a3f957304d4d');assert.equal(git('status','--porcelain=v1'),'');
const source=path.join(out,'smoke-full-artifacts'),artifacts=JSON.parse(fs.readFileSync(path.join(source,'artifacts.json'),'utf8'));
const timeout=/(?:Test timeout|Test timed out|TimeoutError|Timed out \d+ms)/i;
const cases=artifacts.artifacts.filter(row=>row.file.endsWith('/error-context.md')).map((row,index)=>{
 const text=fs.readFileSync(path.join(source,row.file),'utf8');
 const title=/^- Name: (.+)$/m.exec(text)?.[1],location=/^- Location: (.+)$/m.exec(text)?.[1];
 assert.ok(title&&location);const file=location.replaceAll('\\','/').replace(/:\d+:\d+$/,'');
 const name=title.split(' >> ').slice(1).join(' ');
 const received=/^Received array:\s+(\[[^\r\n]+\])$/m.exec(text)?.[1];
 let definitions=[];if(received){try{definitions=JSON.parse(received).map(([id,d])=>({id,name:d.name,kind:d.kind}));}catch{}}
 return {index:index+1,file,title,name,sourceArtifact:row.file,timeout:timeout.test(text),definitions,rawError:text.split('# Error details')[1]?.split('# Page snapshot')[0]?.trim()};
});
fs.writeFileSync(path.join(out,'smoke-failed-cases.json'),JSON.stringify(cases,null,2)+'\n','utf8');
const resultFile=path.join(out,'smoke-isolated-results.json');
const previous=fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile,'utf8')):null;
if(previous)assert.equal(previous.head,head,'Previous isolated results belong to another head');
const results=previous?.runs??[];
const ports=()=>spawnSync('powershell.exe',['-NoProfile','-Command',"$p = @(Get-NetTCPConnection -LocalPort 4173,4174 -State Listen -ErrorAction SilentlyContinue); if ($p.Count) { $p | Select-Object LocalPort,OwningProcess | ConvertTo-Json -Compress; exit 1 } else { Write-Output 'PORTS_4173_4174_FREE'; exit 0 }"],{encoding:'utf8'});
for(const entry of cases){
 let repeats=entry.timeout||results.some(r=>r.case===entry.index&&r.timeout)?3:1;
 for(let run=1;run<=repeats;run++){
  const completed=results.find(r=>r.case===entry.index&&r.run===run);
  if(completed){assert.equal(completed.file,entry.file);assert.equal(completed.name,entry.name);continue;}
  const label=`case-${String(entry.index).padStart(2,'0')}-alone-${run}`,logName=`smoke-${label}.txt`,logFile=path.join(out,logName);
  const pre=ports();assert.equal(pre.status,0,`HOLD: port busy before ${label}; killed nothing`);
  const grep=entry.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const args=['node_modules/@playwright/test/cli.js','test',entry.file,'--grep',grep];
  const start=Date.now(),utc=new Date().toISOString();
  fs.writeFileSync(logFile,`HEAD: ${head}\nTree: ${tree}\nUTC: ${utc}\nCI=1\nCommand executable: ${process.execPath}\nArguments: ${JSON.stringify(args)}\n${pre.stdout}\n`,'utf8');
  const result=spawnSync(process.execPath,args,{cwd:repo,env:{...process.env,CI:'1'},encoding:'utf8',maxBuffer:20*1024*1024});
  const output=(result.stdout??'')+(result.stderr??''),seconds=(Date.now()-start)/1000;
  fs.appendFileSync(logFile,output+`\nExit: ${result.status}\nUTC end: ${new Date().toISOString()}\nElapsed seconds: ${seconds}\n`,'utf8');
  assert.ok(/Running 1 test using 1 worker/.test(output),`${label}: selection was not exactly one test; see log`);
  const capture=execFileSync(process.execPath,[path.join(out,'capture-smoke-artifacts.mjs'),label],{cwd:repo,encoding:'utf8'});
  const post=ports();fs.appendFileSync(logFile,`Ports after: ${post.stdout}\n`,'utf8');assert.equal(post.status,0,`HOLD: port busy after ${label}; killed nothing`);
  const measuredTimeout=timeout.test(output);if(measuredTimeout)repeats=3;
  results.push({case:entry.index,file:entry.file,name:entry.name,run,exit:result.status,seconds,timeout:measuredTimeout,log:logName,artifacts:`smoke-${label}-artifacts/artifacts.json`,capture:JSON.parse(capture).artifacts.map(r=>({file:r.file,bytes:r.bytes,sha256:r.sha256}))});
  fs.writeFileSync(path.join(out,'smoke-isolated-results.json'),JSON.stringify({head,tree,status:'HOLD',cases,runs:results},null,2)+'\n','utf8');
  console.log(`Case ${entry.index}/${cases.length}, run ${run}/${repeats}, exit ${result.status}, ${seconds.toFixed(2)} s: ${entry.name}`);
 }
}
console.log(`HOLD: completed required isolated reruns for ${cases.length} full-smoke failures. No product edit was made.`);
