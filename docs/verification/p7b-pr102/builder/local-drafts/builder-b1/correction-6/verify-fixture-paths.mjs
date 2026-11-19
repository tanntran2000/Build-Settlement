import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const review = 'ced2f88a67daffb8f9fe01fff67f966e82474fc1';
const mode = process.argv[2];
assert(['verify','head'].includes(mode));
const exec = (...args) => execFileSync('git',args,{maxBuffer:8*1024*1024});
const roots = ['packages/persistence/src/__tests__/fixtures', 'packages/simulation/src/__tests__/fixtures'];
const golden = roots[1] + '/catalog-golden.json';
const audit = roots[1] + '/p7b-path-diff.ts';
const after = mode === 'head' ? ['HEAD'] : [];
assert.equal(exec('diff','--name-only','-z',review,...after,'--',...roots).length, 0);
assert.equal(exec('ls-files','--others','--exclude-standard','-z','--',...roots).length, 0);
const files = exec('ls-tree','-r','--name-only','-z',review,'--',...roots).toString('utf8').split('\0').filter(Boolean);
const proof = execFileSync(process.execPath,[audit],{encoding:'utf8'});
assert.match(proof,/Forbidden paths: 0\./);
process.stdout.write(proof);
const json = files.filter(file => file.endsWith('.json'));
for (const path of json) {
  const previous = exec('cat-file','blob',review+':'+path);
  const current = mode === 'head' ? exec('cat-file','blob','HEAD:'+path) : readFileSync(path);
  assert(previous.equals(current), path+' changed after ced2f88');
}
const bytes=exec('cat-file','blob',review+':'+golden);
const hash=createHash('sha256').update(bytes).digest('hex');
console.log('Correction 6 fixture path diff versus '+review+': 0 changed paths.');
console.log('Byte-identical JSON fixtures audited: '+json.length+' (including the golden).');
console.log('Unchanged golden SHA-256: '+hash);
