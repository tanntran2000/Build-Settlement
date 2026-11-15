import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const source='C:/Users/Admin/.t3/local-drafts/p6a-prC';
const local='C:/Users/Admin/.t3/local-drafts/p6b-prB-local-only';
const mode=process.argv[2],label=process.argv[3]??'full-smoke';
if(!['before','after'].includes(mode)||!/^[a-z0-9-]+$/.test(label))throw Error('Use before|after [safe-label]');
const dirs=['screenshots','accessibility'];
const sha=b=>createHash('sha256').update(b).digest('hex');
function scan(){const rows=[];for(const dir of dirs){const base=path.join(source,dir);if(!fs.existsSync(base))continue;function walk(current){for(const e of fs.readdirSync(current,{withFileTypes:true})){const p=path.join(current,e.name);if(e.isSymbolicLink())throw Error('Unexpected symlink');if(e.isDirectory())walk(p);else rows.push({relative:path.relative(source,p).replaceAll('\\','/'),sha256:sha(fs.readFileSync(p))});}}walk(base);}return rows;}
function target(relative){const p=path.resolve(source,relative);if(!dirs.some(dir=>p.startsWith(path.resolve(source,dir)+path.sep)))throw Error('Unsafe artifact path');return p;}
fs.mkdirSync(local,{recursive:true});
const manifest=path.join(local,`legacy-before-${label}.json`);
if(mode==='before'){
  if(fs.existsSync(manifest))throw Error('Backup already exists; choose another label');
  const rows=scan();for(const row of rows){const out=path.join(local,`legacy-original-${label}`,row.relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(target(row.relative),out);}
  fs.writeFileSync(manifest,JSON.stringify({source,utc:new Date().toISOString(),rows},null,2)+'\n');
  console.log(`Preserved ${rows.length} pre-existing hardcoded items.spec.ts artifacts outside PR B evidence.`);
}else{
  const before=JSON.parse(fs.readFileSync(manifest,'utf8')),generated=scan();
  for(const row of generated){const out=path.join(local,`legacy-generated-${label}`,row.relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(target(row.relative),out);}
  const old=new Set(before.rows.map(r=>r.relative));
  for(const row of generated)if(!old.has(row.relative))fs.unlinkSync(target(row.relative));
  for(const row of before.rows){fs.copyFileSync(path.join(local,`legacy-original-${label}`,row.relative),target(row.relative));if(sha(fs.readFileSync(target(row.relative)))!==row.sha256)throw Error('Restoration mismatch');}
  fs.writeFileSync(path.join(local,`legacy-after-${label}.json`),JSON.stringify({utc:new Date().toISOString(),generated,restoredOriginals:before.rows.length,restoration:'PASS'},null,2)+'\n');
  console.log(`Retained ${generated.length} generated artifacts outside evidence; restored all ${before.rows.length} original files byte-identically.`);
}
