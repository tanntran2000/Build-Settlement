import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),base='5e9674e31fb017f730dced4178514ebbfe1dbf24';
const proposals=JSON.parse(fs.readFileSync(path.join(root,'step0-proposed-edits.json'),'utf8'));
const files=[...new Set(proposals.map(p=>p.file))];
for(const file of files){
 let expected=execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'}).replaceAll('\r\n','\n');
 for(const p of proposals.filter(p=>p.file===file)){
  assert.equal(expected.split(p.before).length,2,`P${p.id}: original anchor`);
  expected=expected.replace(p.before,p.id===9?'':p.after);
 }
 assert.equal(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n'),expected,`${file}: differs beyond approved blocks`);
 console.log(`PASS exact approved edits: ${file}`);
}
const changed=execFileSync('git',['diff','--name-only',base],{encoding:'utf8'}).trim().split(/\r?\n/);
for(const file of changed.filter(f=>/\.(test|spec)\.ts$/.test(f)||f.startsWith('tests/e2e/'))){
 try{execFileSync('git',['cat-file','-e',`${base}:${file}`],{stdio:'ignore'});}catch{continue;}
 assert.ok(files.includes(file),`Unapproved existing test change: ${file}`);
}
console.log(`PASS: exactly ${proposals.length} approved blocks in ${files.length} existing test/support files; no other existing test changed.`);
const md=fs.readFileSync(path.join(root,'step0-proposed-edits.md'),'utf8').replace('# Step 0 — exact proposed existing-test edits','# P6-A PR B — executed existing-test edit inventory').replace('PROPOSALS ONLY: no repository test or product file has been edited.','Owner-approved P1–P22 applied; this script verified that each existing test differs only by these exact blocks.').replaceAll('Proposed after:','Applied after:');
fs.writeFileSync(path.join(root,'edit-inventory.md'),md.replace('Total: 22 proposed edit blocks in 12 existing test/support files, including conditional options. All wait for the owner\'s answer.','Total: 22 executed edit blocks in 12 existing test/support files. All were approved in Plan correction 5 and verified against the exact approved replacements.'),'utf8');
