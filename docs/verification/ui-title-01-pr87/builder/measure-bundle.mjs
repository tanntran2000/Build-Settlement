import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const assets='packages/ui/dist/assets';
const results=fs.readdirSync(assets).filter(n=>n.endsWith('.js')||n.endsWith('.css')).map(name=>{
  const raw=fs.readFileSync(assets+'/'+name); return {file:assets+'/'+name,bytes:raw.length,gzipBytes:zlib.gzipSync(raw).length,sha256:crypto.createHash('sha256').update(raw).digest('hex'),containsBuildSha:name.endsWith('.js')?raw.includes(Buffer.from(head.slice(0,7))):null};
});
const result={head,recordedUtc:new Date().toISOString(),method:'Node gzipSync default compression; Vite display rounds to two decimal kB.',assets:results,totalGzipBytes:results.reduce((s,r)=>s+r.gzipBytes,0),budgetBytes:200000};
fs.writeFileSync('C:/Users/Admin/.t3/local-drafts/ui-title-01-prA/bundle-measurement.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(!results.some(r=>r.containsBuildSha)||result.totalGzipBytes>=result.budgetBytes)process.exit(1);
