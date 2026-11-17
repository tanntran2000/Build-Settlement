import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root='C:/Users/Admin/.t3/local-drafts/p6b-prC',out=path.join(root,'fix-round2');
const base='43fcb9b856c66606230d6d7ba49140ae94cfaa00',head='060baa24d44d6a61c2b184a77ab161ae6f62d610';
const git=(...a)=>execFileSync('git',a,{maxBuffer:64*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const ensure=(v,m)=>{if(!v)throw Error(m);};
ensure(git('rev-parse','HEAD').toString('utf8').trim()===head&&!git('status','--porcelain=v1').length,'Archive requires exact clean final head');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'immutable-baseline.json'),'utf8'));
const approval=JSON.parse(fs.readFileSync(path.join(out,'timeout-owner-approval.json'),'utf8')),edit=approval.edit;
const paths=[...baseline.entries.map(e=>e.path),edit.path];
const archive=git('-c','core.autocrlf=false','archive','--format=tar',head,'--',...paths);
const files=new Map();
const tarText=b=>b.toString('utf8').replace(/\0.*$/s,'');
for(let at=0;at+512<=archive.length;){
  const header=archive.subarray(at,at+512);if(header.every(b=>b===0))break;
  const size=parseInt(tarText(header.subarray(124,136)).trim()||'0',8),type=String.fromCharCode(header[156]);
  const prefix=tarText(header.subarray(345,500)),name=(prefix?prefix+'/':'')+tarText(header.subarray(0,100));
  const bytes=archive.subarray(at+512,at+512+size);
  if(type==='0'||type==='\0')files.set(name,Buffer.from(bytes));
  at+=512+Math.ceil(size/512)*512;
}
ensure(files.size===paths.length,'Archive entry count differs (including any unsupported long path)');
const dir=path.join(out,'immutable-archive');fs.mkdirSync(dir,{recursive:true});
const manifest=[];
for(const file of paths){
  const bytes=files.get(file),before=git('show',`${base}:${file}`);
  const expected=file===edit.path?Buffer.from(before.toString('utf8').replace(edit.before,edit.after),'utf8'):before;
  ensure(bytes&&bytes.equals(expected),`Archived bytes differ outside approved P4: ${file}`);
  const entry=baseline.entries.find(e=>e.path===file);if(entry)ensure(sha(bytes)===entry.sha256,`Archived SHA differs: ${file}`);
  const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  manifest.push(`${sha(bytes)}  ${file}`);
}
fs.writeFileSync(path.join(dir,'SHA256SUMS.txt'),manifest.join('\n')+'\n','utf8');
const checked=execFileSync('C:/Program Files/Git/usr/bin/sha256sum.exe',['-c','SHA256SUMS.txt'],{cwd:dir,encoding:'utf8'});
const result={utc:new Date().toISOString(),base,head,tree:git('rev-parse','HEAD^{tree}').toString('utf8').trim(),method:'git -c core.autocrlf=false archive --format=tar HEAD -- <86 protected paths and P4>; decode tar bytes; compare base/P4; sha256sum.exe -c SHA256SUMS.txt',archiveSha256:sha(archive),archiveBytes:archive.length,protectedFiles:86,approvedTestExceptions:1,archiveFiles:files.size,result:'PASS',sha256sumExit:0};
fs.writeFileSync(path.join(out,'immutable-archive-results.json'),JSON.stringify(result,null,2)+'\n','utf8');
fs.writeFileSync(path.join(out,'immutable-archive-check.txt'),`HEAD: ${head}\nTREE: ${result.tree}\nUTC: ${result.utc}\n${result.method}\n${checked}\nEXIT: 0\n`,'utf8');
console.log(JSON.stringify(result,null,2));
