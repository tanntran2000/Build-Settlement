import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(resolve('package.json'));
const ts = require('typescript');
registerHooks({
  load(url, context, next) {
    if (!url.startsWith('file:') || !url.endsWith('.ts')) return next(url, context);
    const source = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    return { format: 'module', source, shortCircuit: true };
  },
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
      const old = new URL(specifier, context.parentURL);
      const candidate = new URL(specifier.slice(0,-3)+'.ts', context.parentURL);
      if (!existsSync(fileURLToPath(old)) && existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
});
const core = await import(pathToFileURL(resolve('packages/core/src/index.ts')).href);
const simulation = await import(pathToFileURL(resolve('packages/simulation/src/character-life-command.ts')).href);

let longest = 0, match = [];
for (let seed=0; seed<1000; seed++) {
 const value=core.npcValueMilli(core.generateNpc(seed,1,'auction-house','lot').npc,'auction-house',true);
 const opening=core.auctionOpeningMilli(value);
 const rivals=core.auctionRivals(seed,1,'auction-house');
 const best=Math.max(...rivals.map(value=>value.ceilingMilli));
 const rounds=Math.floor((best-opening)/10000);
 if(rounds>longest){longest=rounds; match=[seed,value,opening,best]}
}
console.log({longest, match});