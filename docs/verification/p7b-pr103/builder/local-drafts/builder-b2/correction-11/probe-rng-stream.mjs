import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const [root, dependencies, input, mode] = process.argv.slice(2);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ts = createRequire(resolve(dependencies, 'package.json'))('typescript');
const from = file => import(pathToFileURL(resolve(root, file)).href);
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
      let input = readFileSync(new URL(url), 'utf8');
      if(url.endsWith('/world/npc-life.ts')) {
        const key = 'return createSeededRandom((seed ^ hash ^ 0x4e504c31) >>> 0);';
        if(input.split(key).length!==2)throw Error('Could not locate RNG factory');
        input = input.replace(key, `const random = createSeededRandom((seed ^ hash ^ 0x4e504c31) >>> 0);
  const trace = { salt, draws: 0 }; globalThis.__rngProbe.push(trace);
  return () => { trace.draws += 1; return random(); };`);
      }
      const source = ts.transpileModule(input, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});
globalThis.__rngProbe = [];
const { generateNpc } = await from('packages/core/src/world/npc-generator.ts');
const phase = process.argv[4];
if(phase!=='before'&&phase!=='after')throw Error('Unknown phase');
for(const salt of [0,1]) {
  globalThis.__rngProbe.length=0;
  const value = generateNpc(0,1,'guild',0,salt);
  const rows = globalThis.__rngProbe;
  const base = rows.filter(row=>row.salt==='npc_w1_guild_0');
  const retries = rows.filter(row=>row.salt==='npc_w1_guild_0:name:1');
  if(base.length!==(phase==='before'?2:1)||retries.length!==salt)throw Error('Unexpected stream count');
  if(phase==='before'&&base[1].draws!==5)throw Error('Unexpected discarded draw count');
  console.log(JSON.stringify({phase,salt,streams:rows,name:value.npc.character.name,
    sampleSha256:createHash('sha256').update(JSON.stringify(value)).digest('hex')}));
}
