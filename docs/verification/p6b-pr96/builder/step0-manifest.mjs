import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(path.relative(root,full).replaceAll('\\','/')!=='SHA256SUMS.txt')files.push(full);}}
walk(root);files.sort();
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(path.join(root,'SHA256SUMS.txt'),files.map(p=>`${digest(p)}  ${path.relative(root,p).replaceAll('\\','/')}`).join('\n')+'\n','utf8');
const bad=fs.readFileSync(path.join(root,'SHA256SUMS.txt'),'utf8').trim().split('\n').filter(line=>digest(path.join(root,line.slice(66)))!==line.slice(0,64));
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
if(!readme.includes('Tân')||!readme.includes('→')||!readme.includes('3× rule'))throw Error('Non-ASCII owner text was not preserved');
console.log(JSON.stringify({files:files.length,manifest:'SHA256SUMS.txt',errors:bad.length,utf8:files.filter(p=>/\.(md|txt|json|mjs|js|css|ps1)$/.test(p)).every(p=>{new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(p));return true;}),ownerTextPreserved:true}));
if(bad.length)process.exitCode=1;
