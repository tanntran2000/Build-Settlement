import fs from 'node:fs';import path from 'node:path';import {spawnSync,execFileSync} from 'node:child_process';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
for(const name of ['smoke-rerun-1600-baseline.raw.txt','smoke-isolated-session.raw.txt']){
 const source=path.resolve(root,name),destination=path.resolve(root,'aborted-launch-'+name);
 if(!source.startsWith(path.resolve(root)+path.sep)||!destination.startsWith(path.resolve(root)+path.sep))throw Error('Archive path outside evidence');
 if(fs.existsSync(source)){if(fs.existsSync(destination))throw Error('Preserve previous abort evidence');fs.renameSync(source,destination);}
}
const rows=JSON.parse(fs.readFileSync(root+'smoke-failures.json','utf8'));
const results=[];
for(const f of rows){
 const command=`npx playwright test ${f.file}:${f.line} ${f.filter} --list`;
 const r=spawnSync('cmd.exe',['/d','/s','/c',command],{encoding:'utf8',env:process.env,windowsHide:true});
 const output=r.stdout+r.stderr;if(r.status!==0||!output.includes('Total: 1 test in 1 file'))throw Error('Selection is not exactly one test: '+command+'\n'+output);
 results.push({command,exit:r.status,output});
}
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
fs.writeFileSync(root+'isolation-selection-check.json',JSON.stringify({HEAD:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),UTC:new Date().toISOString(),exit:0,abortedLaunch:{reason:'Nested Windows command quotes were stripped, selecting four widths instead of one. Cancelled with Ctrl-C before any case was reported complete; both raw streams preserved.',selectedCases:4,completedCases:0,sessionExit:1},results},null,2)+'\n','utf8');
console.log(`${results.length} selectors each list exactly one test. No browser test ran during this check.`);
