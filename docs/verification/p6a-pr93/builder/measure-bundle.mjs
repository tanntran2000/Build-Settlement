// Run from repo root after npm run build. --capture writes the raw artifact once;
// otherwise verify the current bundle against the committed artifact manifest.
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const evidence=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const assets='packages/ui/dist/assets';
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=fs.readdirSync(assets).filter(n=>/\.(js|css)$/.test(n)).sort().map(name=>{
 const bytes=fs.readFileSync(path.join(assets,name));return {name,bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:hash(bytes)};
});
const sum=ext=>files.filter(f=>f.name.endsWith(ext)).reduce((n,f)=>n+f.gzipBytes,0);
const report={utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),files,
 baselineGzipKB:{js:108.46,css:5.81},gzipBytes:{js:sum('.js'),css:sum('.css')},
 growthGzipKB:{js:sum('.js')/1000-108.46,css:sum('.css')/1000-5.81}};
assert.ok(report.gzipBytes.js+report.gzipBytes.css<200000,'UI JS+CSS must stay under 200 KB gzip');
const manifest=path.join(evidence,'bundle-measurement.json');
if(process.argv.includes('--capture')){
 fs.writeFileSync(manifest,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 const largest=files.filter(f=>f.name.endsWith('.js')).sort((a,b)=>b.bytes-a.bytes)[0];
 fs.writeFileSync(path.join(evidence,'bundle-raw.js.gz'),gzipSync(fs.readFileSync(path.join(assets,largest.name))),{flag:'wx'});
}else{
 const prior=JSON.parse(fs.readFileSync(manifest,'utf8'));assert.deepEqual(files,prior.files);
 const raw=fs.readFileSync(path.join(evidence,'bundle-raw.js.gz'));
 const largest=files.filter(f=>f.name.endsWith('.js')).sort((a,b)=>b.bytes-a.bytes)[0];
 assert.equal(hash(raw),hash(gzipSync(fs.readFileSync(path.join(assets,largest.name)))));
}
console.log(JSON.stringify(report,null,2));
console.log('PASS: bundle budget and raw artifact verified.');
