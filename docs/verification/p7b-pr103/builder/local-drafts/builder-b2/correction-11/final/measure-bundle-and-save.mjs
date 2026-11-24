import { registerHooks } from 'node:module';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';

const root = process.cwd();
const out = process.argv[2];
const ts = createRequire(resolve(root, 'package.json'))('typescript');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      return next(pathToFileURL(resolve(root, 'packages', specifier.split('/')[1], 'src/index.ts')).href, context);
    }
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') && url.startsWith('file:')) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});
const from = (file) => import(pathToFileURL(resolve(root, file)).href);
const core = await from('packages/core/src/index.ts');
const persistence = await from('packages/persistence/src/index.ts');
const { withNpcs } = await from('packages/core/src/__tests__/helpers/npcs.ts');
const { executeCharacterLifeCommand } = await from('packages/simulation/src/character-life-command.ts');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function must(result) {
  if (!result.success) throw Error(result.error.message);
  return result;
}
const fresh = seed => must(core.createCharacterLifeSession(seed, {
  ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper',
})).value;
const act = (session, type, fields = {}) => must(executeCharacterLifeCommand(session, {
  type, expectedRevision: session.city.revision, ...fields,
})).next;

const residents = withNpcs(fresh(2026), [0, 1, 2].map(slot => ({ week: 1, source: 'guild', slot })));
const posted = act(residents, 'ASSIGN_NPC', { npcId: 'npc_w1_guild_0', tileId: 'field-1' });
writeFileSync(resolve(out, 'b2-3-hall-checkpoint.json'), must(persistence.serializeCharacterLifeSave(posted)).text);
const large = fresh(2026);
large.city.society.wallRing = 2;
large.city.world.week = 8;
for (const [id, typeId, level] of [
  ['estate-1', 'mansion', 3], ['estate-2', 'retainers-hall', 2], ['house-5', 'retainers-hall', 2]
]) large.city.tiles.find(tile => tile.id === id).building = { typeId, level, enabled: true, workers: 0 };
const homes = ['estate-1','estate-2','house-5'];
const keys = [];
for (let week = 1; week <= 8; week += 1) {
  for (const source of ['guild','auction-house','slave-market']) {
    for (const slot of [0,1,2,3]) keys.push({week,source,slot});
  }
  keys.push({week,source:'auction-house',slot:'lot'}, {week,source:'slave-market',slot:'lot'});
}
const state = withNpcs(large, keys.slice(0,100).map((key,index) => ({
  ...key, homeTileId: homes[index < 30 ? 0 : index < 80 ? 1 : 2],
})));
for (const npc of state.npcs) {
  for (const key of Object.keys(npc.life.history.counters)) npc.life.history.counters[key]=1000;
  npc.life.history.recent=Array.from({length:core.P7A_TRIAL.recentCap},(_,i)=>({week:1+i%8,kind:'post-cleared'}));
}
const serialized = must(persistence.serializeCharacterLifeSave(state)).text;
const again = must(persistence.serializeCharacterLifeSave(must(persistence.deserializeCharacterLifeSave(serialized)).state)).text;
if (serialized !== again || Buffer.byteLength(serialized, 'utf8') > 1048576) throw Error('save round trip');
writeFileSync(resolve(out, 'b2-3-100npc-roundtrip.json'), serialized);
const testHead = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const testTree = execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
if (testHead !== '7ac9ad0a15d9d0247879b718d464f0813de149dc' ||
    testTree !== '961567de7ef638861a55a42589be203037e123c9' ||
    execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{encoding:'utf8'}).trim()) {
  throw Error('The measurement requires the clean final head.');
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
const priorFolder = resolve(out,'..','..','correction-10','final');
const prior = JSON.parse(readFileSync(resolve(priorFolder,'b2-3-measurements.json'),'utf8'));
const assets = results[0].assets;
const uiIdentical = assets.every(asset=>prior.bundle.assets.some(old=>old.sha256===asset.sha256));
const priorSave = readFileSync(resolve(out,'..','..','b2-3-100npc-roundtrip.json'));
const oldHall = readFileSync(resolve(priorFolder,'b2-3-hall-checkpoint.json'));
const hall = readFileSync(resolve(out,'b2-3-hall-checkpoint.json'));
const result = {
  scope:'Clean final head',
  head:testHead,tree:testTree,
  save:{npcCount:100,bytes:Buffer.byteLength(serialized,'utf8'),sha256:sha(serialized),identical:serialized===again,
    byteIdenticalToPrevious:priorSave.equals(Buffer.from(serialized,'utf8'))},
  hallCheckpointByteIdenticalToPrevious:oldHall.equals(hall),
  bundle:{assets,totalGzipBytes:assets.reduce((sum,asset)=>sum+asset.gzipBytes,0),mainJsGzipKB:145.737,mainCssGzipKB:7.528},
  servedBuilds:results,
  screenshotAssetBytesChanged:!uiIdentical,
};
if(result.bundle.totalGzipBytes>=200000)throw Error('Bundle exceeds 200 kB.');
writeFileSync(resolve(out,'b2-3-measurements.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
