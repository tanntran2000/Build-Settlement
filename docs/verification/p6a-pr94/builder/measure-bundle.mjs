// Run from the repo root after the exact-head production build. Keep one raw gzip artifact.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const evidence=path.dirname(fileURLToPath(import.meta.url)),assets='packages/ui/dist/assets';
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
const files=fs.readdirSync(assets).filter(n=>/\.(js|css)$/.test(n)).sort().map(name=>{
 const bytes=fs.readFileSync(path.join(assets,name));return {name,bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:hash(bytes)};
});
const sum=ext=>files.filter(f=>f.name.endsWith(ext)).reduce((n,f)=>n+f.gzipBytes,0);
const report={utc:new Date().toISOString(),head:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),files,
 baselineGzipKB:{js:114.37,css:5.81},gzipBytes:{js:sum('.js'),css:sum('.css')},
 growthGzipKB:{js:sum('.js')/1000-114.37,css:sum('.css')/1000-5.81}};
assert.ok(report.gzipBytes.js+report.gzipBytes.css<200000,'UI JS+CSS must stay under 200 KB gzip');
const manifest=path.join(evidence,'bundle-measurement.json');
const largest=files.filter(f=>f.name.endsWith('.js')).sort((a,b)=>b.bytes-a.bytes)[0];
const artifact=gzipSync(fs.readFileSync(path.join(assets,largest.name)));
if(process.argv.includes('--capture')){
 fs.writeFileSync(manifest,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(path.join(evidence,'bundle-raw.js.gz'),artifact,{flag:'wx'});
}else{
 const prior=JSON.parse(fs.readFileSync(manifest,'utf8'));assert.equal(prior.head,report.head);assert.equal(prior.tree,report.tree);assert.deepEqual(files,prior.files);
 assert.equal(hash(fs.readFileSync(path.join(evidence,'bundle-raw.js.gz'))),hash(artifact));
}
console.log(JSON.stringify(report,null,2));
console.log('PASS: bundle budget and raw artifact verified.');
