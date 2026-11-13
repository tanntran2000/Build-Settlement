import {readFileSync,readdirSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
const evidence=new URL('./',import.meta.url),out=new URL('./final-bundle-artifacts/',evidence);
mkdirSync(out,{recursive:true});
const baseline=JSON.parse(readFileSync(new URL('./base-bundle-sizes.json',evidence),'utf8'));
const files=readdirSync('packages/ui/dist/assets').filter(name=>/\.(js|css)$/.test(name)).sort().map(name=>{
 const source=path.join('packages/ui/dist/assets',name),bytes=readFileSync(source);
 copyFileSync(source,new URL(name,out));
 const base=baseline.files.find(row=>row.name.endsWith(path.extname(name)));
 return {name,bytes:bytes.length,gzipBytes:gzipSync(bytes).length,gzipDeltaFromBase:gzipSync(bytes).length-base.gzipBytes,sha256:createHash('sha256').update(bytes).digest('hex')};
});
const result={head:execFileSync('git',['rev-parse','HEAD']).toString('utf8').trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}']).toString('utf8').trim(),base:baseline.base,files};
writeFileSync(new URL('./final-bundle-sizes.json',evidence),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
const jsGzip=files.filter(row=>row.name.endsWith('.js')).reduce((sum,row)=>sum+row.gzipBytes,0);
if(jsGzip>108329+137)throw Error(`Production JS ${jsGzip} exceeds base plus 137 bytes`);
