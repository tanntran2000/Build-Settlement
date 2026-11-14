import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
const ids=process.argv.slice(2).map(Number);
const proposals=JSON.parse(fs.readFileSync(path.join(root,'step0-proposed-edits.json'),'utf8'));
for(const id of ids){
 const p=proposals.find(p=>p.id===id);assert.ok(p,`Unknown P${id}`);
 const before=fs.readFileSync(p.file,'utf8');
 const escaped=p.before.split('\n').map(line=>line.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\r?\n');
 const matches=[...before.matchAll(new RegExp(escaped,'g'))];assert.equal(matches.length,1,`P${id} exact before anchor`);
 const anchor=matches[0][0],eol=anchor.includes('\r\n')?'\r\n':'\n';
 const after=(id===9?'':p.after).replaceAll('\n',eol);
 fs.writeFileSync(p.file,before.replace(anchor,after),'utf8');
 console.log(`P${id}: ${p.file}:${p.line}`);
}
