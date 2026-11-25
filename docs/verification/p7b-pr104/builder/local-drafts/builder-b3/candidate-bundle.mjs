import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const out=resolve(process.argv[2], 'b3.3-candidate-bundle');
mkdirSync(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const assets=resolve('packages/ui/dist/assets');
const files=readdirSync(assets).filter(name=>name.endsWith('.js')||name.endsWith('.css')).sort().map(name=>{
  const bytes=readFileSync(join(assets,name));
  const gzip=gzipSync(bytes);
  const zipped=basename(name)+'.gz';
  writeFileSync(join(out,zipped),gzip);
  return {name,bytes:bytes.length,sha256:sha(bytes),gzipBytes:gzip.length,gzipSha256:sha(gzip),rawArtifact:zipped};
});
const bundle=Object.fromEntries(['js','css'].map(type=>[type,files.filter(row=>row.name.endsWith('.'+type)).reduce((sum,row)=>sum+row.gzipBytes,0)]));
const total=bundle.js+bundle.css;
const result={scope:'B3.3 approved uncommitted candidate before HOLD',head:git('rev-parse','HEAD'),headTree:git('rev-parse','HEAD^{tree}'),
  baseline:{head:'b184357d235d164478584e36b96d063551124e66',js:150858,css:7567,total:158425},
  candidate:{...bundle,total},budgetBytes:200000,budgetHeadroomBytes:200000-total,deltaFromMainBytes:total-158425,files};
writeFileSync(join(out,'bundle.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result));
