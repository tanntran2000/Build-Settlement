import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/Admin/.t3/local-drafts/p6b-prC', out=root+'/astra-review';
const git=(...a)=>execFileSync('git',a,{maxBuffer:20*1024*1024});
const base='43fcb9b',head='09a042a';
const rows=git('diff','--numstat',base+'..'+head).toString().trim().split('\n').map(s=>{const [a,d,path]=s.split('\t');return {path,added:+a,deleted:+d};});
const proposal=JSON.parse(fs.readFileSync(root+'/step0-proposed-edits.json','utf8'));
const edits=[...proposal.existingTestEdits,...proposal.outsideAllowlistEdits];
const reconstruction=[];
for(const path of [...new Set(edits.map(x=>x.path))]) {
 let text=git('show',base+':'+path).toString();
 const ids=[];
 for(const e of edits.filter(x=>x.path===path)) {if(text.split(e.before).length!==2)throw Error(e.id+' ambiguous');text=text.replace(e.before,e.after);ids.push(e.id);}
 reconstruction.push({path,ids,exact:Buffer.from(text).equals(git('show',head+':'+path))});
}
const entries=JSON.parse(fs.readFileSync(root+'/immutable-baseline.json','utf8')).entries;
const immutable=entries.map(e=>({path:e.path,equal:git('show',base+':'+e.path).equals(git('show',head+':'+e.path))}));
const tree={};for(const p of ['packages/core','packages/simulation','packages/persistence']){tree[p]={base:git('rev-parse',base+':'+p).toString().trim(),head:git('rev-parse',head+':'+p).toString().trim()};}
const audits=fs.readdirSync(root+'/accessibility').filter(x=>x.endsWith('.json')).map(name=>{const a=JSON.parse(fs.readFileSync(root+'/accessibility/'+name,'utf8'));return {name,viewport:a.viewport,texts:a.texts.length,controls:a.controls.length,contrastPass:a.texts.every(t=>t.ratio>=t.required),sizePass:a.texts.every(t=>t.size>=14),targetPass:a.controls.every(c=>c.width>=24&&c.height>=24),overflow:a.overflow};});
const result={head:git('rev-parse','HEAD').toString().trim(),headTree:git('rev-parse','HEAD^{tree}').toString().trim(),commits:+git('rev-list','--count',base+'..'+head),rows,total:{files:rows.length,added:rows.reduce((n,r)=>n+r.added,0),deleted:rows.reduce((n,r)=>n+r.deleted,0)},proposalSha256:createHash('sha256').update(fs.readFileSync(root+'/step0-proposed-edits.json')).digest('hex'),reconstruction,immutable:{count:immutable.length,failures:immutable.filter(x=>!x.equal)},tree,audits,status:git('--no-optional-locks','status','--porcelain').toString()};
fs.writeFileSync(out+'/independent-checks.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,rows:undefined,audits:{count:audits.length,failures:audits.filter(a=>!a.contrastPass||!a.sizePass||!a.targetPass||a.overflow)}},null,2));

