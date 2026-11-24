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
const { executeCharacterLifeCommand } = await from('packages/simulation/src/character-life-command.ts');
const source = readFileSync(input, 'utf8');
const { state } = JSON.parse(source);
if (state.npcs.length !== 100 || state.profiles.length !== 100) throw Error('Expected 100 named NPCs and profiles.');
const stateBefore = sha(JSON.stringify(state));
const action = { type: 'END_WEEK', expectedRevision: state.city.revision, expectedWeek: state.city.world.week };
const ticksMs = [];
let firstResult, lastResult;
for (let i=0;i<(mode==='probe'?1:21);i+=1) {
  const before = process.hrtime.bigint();
  const result = executeCharacterLifeCommand(state, action);
  const elapsed = process.hrtime.bigint()-before;
  if(!result.success) throw Error(`${result.error.code}: ${result.error.message}`);
  if(result.next.npcs.length!==100 || result.next.city.world.week!==state.city.world.week+1 || !result.report) {
    throw Error('Unexpected roster, week or report.');
  }
  ticksMs.push(Number(elapsed)/1e6);
  if(i===0) firstResult=result.next;
  lastResult=result.next;
}
const outputSha256=sha(JSON.stringify(firstResult));
if(outputSha256!==sha(JSON.stringify(lastResult)))throw Error('Non-deterministic result.');
if(sha(JSON.stringify(state))!==stateBefore) throw Error('Input was mutated.');
let save;
if(mode==='probe') {
  const persist=await from('packages/persistence/src/index.ts');
  const a=persist.serializeCharacterLifeSave(state);
  if(!a.success)throw Error(a.error.message);
  const b=persist.deserializeCharacterLifeSave(a.text);
  if(!b.success)throw Error(b.error.message);
  const c=persist.serializeCharacterLifeSave(b.state);
  if(!c.success || c.text!==a.text)throw Error('Round trip mismatch.');
  save={bytes:Buffer.byteLength(a.text),sha256:sha(a.text),byteIdentical:true,inputByteIdentical:a.text===source};
}
console.log(JSON.stringify({node:process.version,pid:process.pid,inputSha256:sha(source),stateSha256:stateBefore,outputSha256,ticksMs,save}));
