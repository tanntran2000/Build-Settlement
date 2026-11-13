import {readFileSync,readdirSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const dest=new URL('./',import.meta.url);
const base='5ff521e3971739ecde05a22dd96c74827c0ae363';
mkdirSync(new URL('baseline-bundle-artifacts/',dest),{recursive:true});
const files=readdirSync('packages/ui/dist/assets').filter(name=>/\.(js|css)$/.test(name)).map(name=>{
 const bytes=readFileSync('packages/ui/dist/assets/'+name);
 copyFileSync('packages/ui/dist/assets/'+name,new URL('baseline-bundle-artifacts/'+name,dest));
 return {name,bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')};
});
writeFileSync(new URL('base-bundle-sizes.json',dest),JSON.stringify({base,source:'unchanged-base production build performed by inspector-build.test.ts during full RED run',files},null,2)+'\n','utf8');
console.log(JSON.stringify({base,files},null,2));
