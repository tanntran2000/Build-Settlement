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
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});
const core = await from('packages/core/src/index.ts');
const { NPC_TEST_KEYS, withNpcs } = await from('packages/core/src/__tests__/helpers/npcs.ts');
const { describeShort } = await from('packages/core/src/character/describe.ts');
const made = core.createCharacterLifeSession(3, { ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
if(!made.success)throw Error(made.error.message);
const s=withNpcs(made.value,NPC_TEST_KEYS);
console.log(JSON.stringify({ seed:3,key:NPC_TEST_KEYS[0],id:s.npcs[0].character.id,text:describeShort({ character:s.npcs[0].character,profile:s.profiles[0],role:'npc',postBuildingName:null }) },null,2));
