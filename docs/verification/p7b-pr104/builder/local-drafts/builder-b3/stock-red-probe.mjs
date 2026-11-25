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
const starting = core.createCharacterLifeSession(42, { ...core.DEFAULT_PLAYER_DRAFT, currentName:'Market Keeper' });
assert.equal(starting.success,true);
const act = (state,type,fields) => simulation.executeCharacterLifeCommand(state, { type,expectedRevision:state.city.revision,...fields });
const built = act(starting.value,'BUILD',{tileId:'service-1',typeId:'guild'});
assert.equal(built.success,true);
const failures = [];
const check = (label, checkCase) => {
  try { checkCase(); console.log('PASS control: '+label); }
  catch (error) { failures.push(label); console.log('FAIL expected RED: '+label+'\n'+error.message); }
};
check('New Game has the v13 acquisition sentinel', () => assert.deepEqual(starting.value.city.society.acquisition, {week:0,stock:[],lots:[],departures:[]}));
check('Guild BUILD draws four offers', () => assert.equal(built.next.city.society.acquisition?.stock.length,4));
check('BUY_NPC admits an NPC with profile', () => {
  const result = act(built.next,'BUY_NPC',{source:'guild',slot:0,homeTileId:'estate-1'});
  assert.deepEqual(result.success ? [result.next.npcs.length,result.next.profiles.length] : result.error.code,[1,1]);
});
check('SELL_NPC directs missing market to NO_BUILDING', () => {
  const hired = act(built.next,'BUY_NPC',{source:'guild',slot:0,homeTileId:'estate-1'});
  const result = act(hired.success ? hired.next : built.next,'SELL_NPC',{npcId:hired.success ? hired.next.npcs[0].character.id : 'npc_w1_guild_0'});
  assert.equal(result.success ? 'success' : result.error.code,'NO_BUILDING');
});
check('No acquisition activity omits report household', () => {
  const r=act(starting.value,'END_WEEK',{expectedWeek:1});
  assert.equal(r.success,true);
  assert.equal(Object.hasOwn(r.report,'household'),false);
});
if (failures.length) process.exitCode = 1;
