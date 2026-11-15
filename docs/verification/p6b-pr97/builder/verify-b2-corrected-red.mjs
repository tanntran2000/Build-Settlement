import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const evidence=dirname(fileURLToPath(import.meta.url));
const files=['packages/core/src/trial/types.ts','packages/simulation/src/tile-trial-week.ts','packages/persistence/src/session-records.ts','packages/simulation/src/craft-week.ts'];
const saved=files.map(path=>({path,bytes:readFileSync(path)}));
try {
  for(const {path} of saved){
    writeFileSync(join(evidence,`b2-red-proof-${path.split('/').at(-1)}.txt`),readFileSync(path));
    if(path.endsWith('/craft-week.ts'))unlinkSync(path);
    else writeFileSync(path,execFileSync('git',['show',`4480ed8:${path}`]));
  }
  const args=['node_modules/vitest/vitest.mjs','run','packages/simulation/src/__tests__/craft-week.test.ts','packages/persistence/src/__tests__/craft-records.test.ts','--maxWorkers=1','--reporter=default','--reporter=json',`--outputFile=${join(evidence,'b2-red-corrected.json')}`];
  const run=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024});
  const log=`UTC: ${new Date().toISOString()}\nHEAD: 4480ed81effbdae282de7d3b6d4cb023a137bc7c\nB2 product files temporarily restored to exact B1 bytes; new craft-week.ts absent. Always restored in finally.\nFixture correction: upgrade-heal-potion-2 requires one red-leaf; green-leaf alone was insufficient. First RED/GREEN attempt retained.\nCOMMAND: node ${args.join(' ')}\n${run.stdout}\n${run.stderr}\nEXIT: ${run.status}\n`;
  writeFileSync(join(evidence,'b2-red-corrected.txt'),log,'utf8');
  console.log(log.slice(-1800));
  if(run.status!==1)throw Error('Expected a failing corrected full RED suite');
} finally {for(const {path,bytes} of saved)writeFileSync(path,bytes);}
