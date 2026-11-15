import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prB';
const dist=path.join(repo,'packages/ui/dist'),artifacts=path.join(out,'bundle-artifacts');
fs.mkdirSync(artifacts,{recursive:true});
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(js|css)$/.test(entry.name))files.push(full);}}
walk(dist);files.sort();
const rows=files.map(file=>{
 const bytes=fs.readFileSync(file),relative=path.relative(dist,file).replaceAll('\\','/'),artifact=relative.replaceAll('/','_');
 fs.writeFileSync(path.join(artifacts,artifact),bytes);
 return {file:relative,artifact:`bundle-artifacts/${artifact}`,kind:file.endsWith('.js')?'JS':'CSS',bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')};
});
const totals=Object.fromEntries(['JS','CSS'].map(kind=>[kind,rows.filter(r=>r.kind===kind).reduce((sum,r)=>sum+r.gzipBytes,0)]));
const baseline={JS:129820,CSS:6740};
const result={utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:repo,encoding:'utf8'}).trim(),method:'Sum Node gzipSync(default compression) byte lengths of production dist JS/CSS; decimal kB (1000 bytes). Baseline is the supplied rounded main report, not a new main build.',baselineGzipKB:{JS:129.82,CSS:6.74},totalsGzipBytes:totals,deltaBytesAgainstReportedMain:Object.fromEntries(['JS','CSS'].map(k=>[k,totals[k]-baseline[k]])),combinedGzipBytes:totals.JS+totals.CSS,under200KB:totals.JS+totals.CSS<200000,files:rows};
if(!rows.some(r=>r.kind==='JS')||!rows.some(r=>r.kind==='CSS')||!result.under200KB)throw Error('Bundle budget/artifacts failed');
fs.writeFileSync(path.join(out,'bundle-results.json'),JSON.stringify(result,null,2)+'\n','utf8');
fs.writeFileSync(path.join(artifacts,'SHA256SUMS.txt'),rows.map(r=>`${r.sha256}  ${path.basename(r.artifact)}`).join('\n')+'\n','utf8');
console.log(JSON.stringify(result,null,2));
