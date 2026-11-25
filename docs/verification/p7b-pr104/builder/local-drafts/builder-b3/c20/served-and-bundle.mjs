import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const repo=process.cwd(), ui=join(repo,'packages','ui'), out=resolve(process.argv[2]);
const require=createRequire(join(ui,'package.json'));
const vite=join(dirname(require.resolve('vite/package.json')),'bin','vite.js');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const head=git('rev-parse','HEAD'), tree=git('rev-parse','HEAD^{tree}');
assert.equal(git('status','--porcelain=v1'),'');
const bundleDir=join(out,'bundle');
mkdirSync(bundleDir,{recursive:true});
const rawBuilds=[
  { name:'production', root:join(ui,'dist'), port:4173, args:[] },
  { name:'regression', root:join(ui,'regression','dist'), port:4174, args:['regression','--config','vite.config.ts','--outDir','dist'] },
];
function assets(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const path=join(directory,entry.name);
    return entry.isDirectory()?assets(path):/[.](js|css)$/.test(entry.name)?[path]:[];
  });
}
const manifest=[];
for(const build of rawBuilds){
  const child=spawn(process.execPath,[vite,'preview',...build.args,'--port',String(build.port),'--strictPort'],
    {cwd:ui,windowsHide:true,stdio:'inherit'});
  const url='http://localhost:'+build.port;
  try {
    let response;
    for(let n=0;n<100;n+=1){
      if(child.exitCode!==null) throw Error('Preview exited: '+build.name);
      try{response=await fetch(url); if(response.ok)break;}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    if(!response?.ok)throw Error('Preview unavailable: '+build.name);
    const indexBytes=Buffer.from(await response.arrayBuffer());
    const localIndex=readFileSync(join(build.root,'index.html'));
    assert.deepEqual(indexBytes,localIndex);
    const files=[];
    for(const file of assets(build.root).sort()){
      const path=relative(build.root,file).replaceAll('\\','/');
      const local=readFileSync(file);
      const served=await fetch(url+'/'+path);
      assert(served.ok,path);
      assert.equal(sha(Buffer.from(await served.arrayBuffer())),sha(local),path);
      const compressed=gzipSync(local);
      const entry={file:path,bytes:local.length,sha256:sha(local),gzipBytes:compressed.length,gzipSha256:sha(compressed)};
      files.push(entry);
      if(build.name==='production')writeFileSync(join(bundleDir,path.replaceAll('/','-')+'.gz'),compressed);
    }
    manifest.push({build:build.name,port:build.port,indexSha256:sha(localIndex),assets:files});
    console.log(JSON.stringify(manifest.at(-1)));
  }finally{
    if(child.exitCode===null){const event=once(child,'exit');child.kill();await event;}
  }
}
const production=manifest[0].assets;
const jsGzipBytes=production.filter(row=>row.file.endsWith('.js')).reduce((sum,row)=>sum+row.gzipBytes,0);
const cssGzipBytes=production.filter(row=>row.file.endsWith('.css')).reduce((sum,row)=>sum+row.gzipBytes,0);
const totalGzipBytes=jsGzipBytes+cssGzipBytes;
const baseline={main:'b184357d235d164478584e36b96d063551124e66',jsGzipBytes:150858,cssGzipBytes:7567,totalGzipBytes:158425};
const data={head,tree,baseline,jsGzipBytes,cssGzipBytes,totalGzipBytes,deltaGzipBytes:totalGzipBytes-baseline.totalGzipBytes,
  limitBytes:200000,headroomBytes:200000-totalGzipBytes,manifest};
writeFileSync(join(bundleDir,'bundle-and-served-hashes.json'),JSON.stringify(data,null,2)+'\n','utf8');
console.log(JSON.stringify(data));
assert(totalGzipBytes<200000,'Exceeded the 200 kB gzip budget.');
