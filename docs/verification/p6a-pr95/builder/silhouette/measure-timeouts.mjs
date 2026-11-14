import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const targets=[
 {id:'lord-health',file:'packages/simulation/src/__tests__/lord-health.test.ts',fullName:'a Calm game below Crime 70 survives all 60 weeks from health one'},
 {id:'renewable-support',file:'packages/simulation/src/__tests__/society-renewable-support.test.ts',fullName:'society renewable support and transaction ports preserves complete gameplay and assignments through sixty weeks of snapshot restores'},
];
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
const result={HEAD:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),UTC:new Date().toISOString(),ownerDecision:'Rerun, no timeout change (Recommended)',existingTimeoutMs:5000,status:'HOLD after the requested measurements, irrespective of isolated outcomes',runs:[]};
for(const target of targets)for(let attempt=1;attempt<=3;attempt++){
 if(!/^[A-Za-z0-9 ]+$/.test(target.fullName))throw Error('Unexpected test-name characters');
 const name=`trace-measured-${target.id}-${attempt}`;
 const args=[path.resolve('node_modules/vitest/vitest.mjs'),'run',target.file,'-t',target.fullName,'--reporter=json','--outputFile='+root+name+'.json'];
 const command='node '+args.map(a=>JSON.stringify(a)).join(' ');
 const started=Date.now(),startUTC=new Date().toISOString();
 const run=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true});
 const raw=(run.stdout??'')+(run.stderr??'');
 fs.writeFileSync(root+name+'.raw.txt',raw,'utf8');
 fs.writeFileSync(root+name+'.txt',`HEAD=${result.HEAD}\nTREE=${result.tree}\nUTC=${startUTC}\nEXIT=${run.status}\nCOMMAND=${command}\nARGS_JSON=${JSON.stringify(args)}\nFINISHED=${new Date().toISOString()}\n\n`+raw,'utf8');
 const report=JSON.parse(fs.readFileSync(root+name+'.json','utf8'));
 const selected=report.testResults.flatMap(f=>f.assertionResults).filter(a=>a.status==='passed'||a.status==='failed');
 const correct=selected.length===1&&selected[0].fullName.endsWith(target.fullName);
 result.runs.push({id:target.id,file:target.file,exactName:target.fullName,attempt,command,exit:run.status,wallMs:Date.now()-started,testMs:selected[0]?.duration??null,matchedTests:selected.length,exactNameMatched:correct,log:name+'.txt',rawReport:name+'.json'});
 fs.writeFileSync(root+'silhouette/timeout-measurements.json',JSON.stringify(result,null,2)+'\n','utf8');
 console.log(JSON.stringify(result.runs.at(-1)));
 if(!correct)throw Error('HOLD: measurement did not select exactly the named test; preserve logs');
}
result.finishedUTC=new Date().toISOString();
fs.writeFileSync(root+'silhouette/timeout-measurements.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
process.exitCode=1;
