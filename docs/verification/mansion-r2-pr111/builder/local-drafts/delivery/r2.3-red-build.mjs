import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';

const git=(...args)=>execFileSync('git',args);
const changed=git('diff','--name-only','HEAD','--','packages/ui/src').toString('utf8').trim().split(/\r?\n/).filter(Boolean);
const current=changed.map(path=>[path,readFileSync(path),git('show','HEAD:'+path)]);
const head=git('rev-parse','HEAD').toString('utf8').trim();
assert.equal(head,'5c54d4914eb890e2dc433ccbcd37e2f7c70aff05');
try {
 for(const [path,,baseline] of current) writeFileSync(path,baseline);
 for(const command of ['npm run build --workspace=@haven/ui','npm run build:regression --workspace=@haven/ui']){
   console.log(command);
   const r=spawnSync('cmd.exe',['/d','/s','/c',command],{stdio:'inherit'});
   assert.equal(r.status,0,'Baseline build exit');
 }
} finally {
 for(const [path,original] of current) writeFileSync(path,original);
}
for(const [path,original] of current)assert.deepEqual(readFileSync(path),original);
console.log('The main and regression builds were compiled with the exact previous task UI files. Implementation bytes restored before browser test.');

