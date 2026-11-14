import fs from 'node:fs';
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
 const name=`trace-isolated-${target.id}-${attempt}`;
 const command=`npx vitest run ${target.file} -t "^${target.fullName}$" --reporter=verbose`;
 const started=Date.now();
 const run=spawnSync(process.execPath,[root+'run-evidence.mjs',name,command],{encoding:'utf8',windowsHide:true});
 process.stdout.write(run.stdout??'');process.stderr.write(run.stderr??'');
 const text=fs.readFileSync(root+name+'.txt','utf8');
 const count=text.match(/Tests\s+(\d+) (?:passed|failed)/)?.[1];
 const line=text.split('\n').find(line=>line.includes(target.fullName.split(' ').slice(0,4).join(' '))&&/\d+ms/.test(line));
 const testMs=line?.match(/(\d+(?:\.\d+)?)\s*ms/)?.[1];
 result.runs.push({id:target.id,file:target.file,exactName:target.fullName,attempt,command,exit:run.status,wallMs:Date.now()-started,testMs:testMs?Number(testMs):null,matchedTests:count?Number(count):null,log:name+'.txt'});
 fs.writeFileSync(root+'silhouette/timeout-measurements.json',JSON.stringify(result,null,2)+'\n','utf8');
 if(Number(count)!==1)throw Error('HOLD: measurement did not select exactly one test; preserve logs');
}
result.finishedUTC=new Date().toISOString();
fs.writeFileSync(root+'silhouette/timeout-measurements.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
process.exitCode=1;
