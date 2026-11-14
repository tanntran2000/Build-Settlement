import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const text=fs.readFileSync(root+'smoke-full.txt','utf8').replace(/\u001b\[[0-9;]*m/g,'');
if(!/^EXIT=1$/m.test(text))throw Error('Expected a finished failed full smoke log');
const failedCount=Number([...text.matchAll(/(\d+) failed/g)].at(-1)?.[1]);
const failures=[];
for(const line of text.split(/\r?\n/)){
 if(!/^\s+\d+\) \[chromium\]/.test(line))continue;
 const m=line.match(/character-life-navigation-accessibility\.spec\.ts:(\d+):\d+ › accessibility at (\d+)px › (.+?)\s*$/);
 if(!m){
  const profile=line.match(/character-life-navigation\.spec\.ts:347:3 › full-body placeholder preserves profile disclosure at (375|1280)px/);
  if(profile){const width=Number(profile[1]);failures.push({file:'tests/e2e/character-life-navigation.spec.ts',line:347,width,test:`full-body placeholder preserves profile disclosure at ${width}px`,log:`smoke-rerun-${width}-profile`,filter:`-g at.${width}px`});continue;}
  if(/title\.spec\.ts:148:1 › Large report at 320px keeps all six letters and stock ledger inside the page/.test(line)){
   failures.push({file:'tests/e2e/title.spec.ts',line:148,width:320,test:'Large report at 320px keeps all six letters and stock ledger inside the page',log:'smoke-rerun-320-large-report',filter:''});continue;
  }
  throw Error('Unexpected failed case needs explicit isolated command: '+line);
 }
 const testLine=Number(m[1]),width=Number(m[2]);
 if(![250,329].includes(testLine)||![320,375,1280,1600].includes(width))throw Error('Unexpected test location');
 failures.push({file:'tests/e2e/character-life-navigation-accessibility.spec.ts',line:testLine,width,test:m[3],log:`smoke-rerun-${width}-${testLine===250?'baseline':'reflow'}`,filter:`-g accessibility.at.${width}px`});
}
if(failures.length!==failedCount||new Set(failures.map(f=>f.log)).size!==failedCount)throw Error('Failure inventory incomplete or duplicated');
fs.writeFileSync(root+'smoke-failures.json',JSON.stringify(failures,null,2)+'\n','utf8');
const artifactRoot='C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright/final-smoke';
const artifacts=[];
for(const dir of fs.readdirSync(artifactRoot,{withFileTypes:true}).filter(e=>e.isDirectory()))for(const name of ['measurements.json','reflow.json',...(dir.name.startsWith('title-Large-report')?['metrics.json']:[])]){
 const file=path.join(artifactRoot,dir.name,name);if(!fs.existsSync(file))continue;
 const bytes=fs.readFileSync(file),r=JSON.parse(bytes),problems=[...new Set(r.failures??[])];
 if(name==='metrics.json'){if(r.document>r.viewport)problems.push(`Document overflow: ${r.document} > ${r.viewport}`);for(const letter of r.letters)if(letter.scroll>letter.client)problems.push(`${letter.id} overflow: ${letter.scroll} > ${letter.client}`);}
 if(problems.length)artifacts.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),failures:problems,focusBelow3:(r.focus??[]).filter(f=>typeof f.ratio==='number'&&f.ratio<3).map(f=>({label:f.label,ratio:f.ratio}))});
}
fs.writeFileSync(root+'smoke-failure-details.json',JSON.stringify({HEAD:text.match(/^HEAD=(.+)$/m)[1],tree:text.match(/^TREE=(.+)$/m)[1],fullSmokeExit:1,failures,artifacts},null,2)+'\n','utf8');
console.log(JSON.stringify({failed:failedCount,isolatedRunsRequired:failures.length,failures},null,2));
