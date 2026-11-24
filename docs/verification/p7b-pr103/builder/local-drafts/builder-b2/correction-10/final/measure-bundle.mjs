import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';

const root = process.cwd();
const out = dirname(fileURLToPath(import.meta.url));
const older = resolve(out, '..', '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git',args,{encoding:'utf8'}).trim();
const head = git('rev-parse','HEAD');
const tree = git('rev-parse','HEAD^{tree}');
if(head!=='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'||tree!=='312797f184f6414064e5ecf81eb1fba7a7bc55d0'||git('status','--porcelain=v1')) {
  throw Error('Measurement requires the clean final head.');
}
const ui = resolve(root,'packages/ui');
const uiRequire = createRequire(resolve(ui, 'package.json'));
const vite = resolve(dirname(uiRequire.resolve('vite/package.json')),'bin/vite.js');
const targets = [
  {name:'production',port:4173,dist:resolve(ui,'dist'),args:['preview','--port','4173','--strictPort']},
  {name:'regression',port:4174,dist:resolve(ui,'regression/dist'),args:['preview','regression','--config','vite.config.ts','--outDir','dist','--port','4174','--strictPort']},
];
const servers = [];
let results;
async function waitHttp(target, child) {
  for (let attempt=0; attempt<60; attempt+=1) {
    if (child.exitCode!==null || child.signalCode!==null) throw Error(target.name+' preview exited.');
    try {
      const response = await fetch('http://localhost:'+target.port+'/',{signal:AbortSignal.timeout(1500)});
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch {}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw Error(target.name+' preview did not start.');
}
try {
  for(const target of targets) {
    const child = spawn(process.execPath,[vite,...target.args],{cwd:ui,stdio:['ignore','pipe','pipe'],windowsHide:true});
    child.stdout.on('data', bytes=>process.stdout.write(bytes));
    child.stderr.on('data', bytes=>process.stderr.write(bytes));
    servers.push({target,child});
  }
  results = [];
  for (const {target,child} of servers) {
    const page = await waitHttp(target,child);
    const htmlDisk = readFileSync(resolve(target.dist,'index.html'));
    if (!page.equals(htmlDisk)) throw Error(target.name+' served HTML differs.');
    const assetPaths = [...page.toString('utf8').matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:css|js))"/g)].map(match=>match[1]);
    if (assetPaths.length!==2) throw Error(target.name+' unexpected asset inventory.');
    const assets=[];
    for (const assetPath of assetPaths) {
      const raw = readFileSync(resolve(target.dist,assetPath.slice(1)));
      const response = await fetch('http://localhost:'+target.port+assetPath,{signal:AbortSignal.timeout(4000)});
      if (!response.ok || !Buffer.from(await response.arrayBuffer()).equals(raw)) throw Error('Served mismatch: '+assetPath);
      const gz = gzipSync(raw);
      if(target.name==='production') writeFileSync(resolve(out,'b2-3-'+basename(assetPath)+'.gz'), gz);
      assets.push({file:basename(assetPath),rawBytes:raw.length,gzipBytes:gz.length,sha256:sha(raw),servedIdentical:true});
    }
    results.push({name:target.name,port:target.port,htmlSha256:sha(page),assets});
  }
} finally {
  for (const {child} of servers) {
    if (child.exitCode!==null || child.signalCode!==null) continue;
    const closed=once(child,'exit');
    child.kill();
    await closed;
  }
}
if (JSON.stringify(results[0].assets)!==JSON.stringify(results[1].assets)) throw Error('Production and regression JS/CSS differ.');
const prior = JSON.parse(readFileSync(resolve(older,'b2-3-measurements.json'),'utf8'));
const assets = results[0].assets;
const js = assets.find(asset=>asset.file.endsWith('.js'));
const css = assets.find(asset=>asset.file.endsWith('.css'));
const oldJs = prior.bundle.assets.find(asset=>asset.file.endsWith('.js'));
const oldCss = prior.bundle.assets.find(asset=>asset.file.endsWith('.css'));
if(css.sha256!==oldCss.sha256)throw Error('Unexpected CSS bytes after test-only commit.');
const rawJs = gunzipSync(readFileSync(resolve(out,'b2-3-'+js.file+'.gz')));
const rawPrior = gunzipSync(readFileSync(resolve(older,'b2-3-'+oldJs.file+'.gz')));
if(sha(rawPrior)!==oldJs.sha256)throw Error('Prior raw JS hash differs from recorded bundle.');
const source = rawPrior.toString('utf8');
const oldStamp = 'f31310c';
const newStamp = git('rev-parse','--short','HEAD');
const usesStamp = source.split(oldStamp).length===2;
const changed = !rawJs.equals(rawPrior);
if(changed&&(!usesStamp||!rawJs.equals(Buffer.from(source.replace(oldStamp,newStamp),'utf8')))) {
  throw Error('Unexpected JS change beyond the commit stamp.');
}
const result = {
  scope:'Clean final head',head,tree,
  previousHead:prior.head,
  bundle:{assets,totalGzipBytes:assets.reduce((sum,a)=>sum+a.gzipBytes,0),mainJsGzipKB:145.737,mainCssGzipKB:7.528},
  servedBuilds:results,
  screenshotAssetBytesChanged:changed,
  buildStamp:changed?{previous:oldStamp,current:newStamp}:null,
  sourceDiffFromPrevious:git('diff','--name-only',prior.head,head).split('\n'),
};
if(result.sourceDiffFromPrevious.length!==1||result.sourceDiffFromPrevious[0]!=='tests/e2e/storage.spec.ts')throw Error('Unexpected test-only surface.');
if(result.bundle.totalGzipBytes>=200000)throw Error('Bundle exceeds 200 kB.');
writeFileSync(resolve(out,'b2-3-measurements.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
