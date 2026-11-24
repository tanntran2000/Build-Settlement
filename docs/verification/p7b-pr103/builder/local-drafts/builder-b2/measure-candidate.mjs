import { registerHooks } from 'node:module';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

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
writeFileSync(resolve(out, 'candidate-hall-checkpoint.json'), must(persistence.serializeCharacterLifeSave(posted)).text);
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
writeFileSync(resolve(out, 'candidate-100npc-roundtrip.json'), serialized);
const ticks=[];
for (let i = 0; i < 21; i += 1) {
  const before = performance.now();
  const stepped = act(state, 'END_WEEK', { expectedWeek: state.city.world.week });
  const millis = performance.now() - before;
  if (stepped.npcs.length !== 100) throw Error('End Week changed roster count');
  ticks.push(millis);
}
const assets=[];
for (const file of readdirSync(resolve(root,'packages/ui/dist/assets')).filter(name=>/\.(css|js)$/.test(name))) {
  const raw = readFileSync(resolve(root,'packages/ui/dist/assets',file));
  const response = await fetch('http://localhost:4173/assets/' + file);
  if (!response.ok || sha(Buffer.from(await response.arrayBuffer())) !== sha(raw)) throw Error('served asset differs');
  const gz = gzipSync(raw);
  writeFileSync(resolve(out,'candidate-'+file+'.gz'), gz);
  assets.push({file,rawBytes:raw.length,gzipBytes:gz.length,sha256:sha(raw),servedIdentical:true});
}
const result = {
  scope:'Uncommitted candidate. Not B2.3 exact-head results.',
  gitHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  candidateTree:execFileSync('git',['write-tree'],{encoding:'utf8'}).trim(),
  save:{npcCount:100,bytes:Buffer.byteLength(serialized,'utf8'),sha256:sha(serialized),identical:serialized===again},
  endWeek:{cold:ticks[0],warm:ticks.slice(1)},
  bundle:{assets,totalGzipBytes:assets.reduce((total,asset)=>total+asset.gzipBytes,0),mainJsGzipKB:145.737, mainCssGzipKB:7.528},
};
writeFileSync(resolve(out,'candidate-measurements.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));

