import { registerHooks, createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [root, dependencies, mode, variant, file, largestSave] = process.argv.slice(2);
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
const persist = await from('packages/persistence/src/index.ts');
const sim = await from('packages/simulation/src/character-life-command.ts');

function successful(result) {
  if (!result.success) throw Error(result.error.code + ' ' + result.error.message);
  return result;
}
function cmd(state, type, fields) {
  return successful(sim.executeCharacterLifeCommand(state, {type, expectedRevision:state.city.revision, ...fields}));
}
function planInput(seed, withRoster) {
  const input = successful(core.createCharacterLifeSession(seed,{...structuredClone(core.DEFAULT_PLAYER_DRAFT),currentName:'Market Keeper'})).value;
  const { city } = input;
  const holdings = city.world.settlements[city.world.activeSettlementId].inventory;
  for (const key of ['gold','food','wood','iron']) holdings[key] = 1_000_000;
  city.goodsStock.amountMilli = 1_000_000;
  if (!withRoster) return input;
  city.world.week = 9;
  city.society.wallRing = 2;
  for (const [id,typeId,level] of [['estate-1','mansion',3],['estate-2','retainers-hall',2],['house-5','retainers-hall',2]]) {
    city.tiles.find(tile=>tile.id===id).building = {typeId,level,workers:0,enabled:true};
  }
  const homes = [...Array(30).fill('estate-1'), ...Array(50).fill('estate-2'), ...Array(20).fill('house-5')];
  const keys = Array.from({length:8},(_,index)=>index+1).flatMap(week=>['guild','auction-house','slave-market']
    .flatMap(source=>[0,1,2,3,...(source==='guild'?[]:['lot'])].map(slot=>({week,source,slot}))));
  const used = new Set();
  for (const [index,home] of homes.entries()) {
    const {week,source,slot} = keys[index];
    let salt = 0, selected = core.generateNpc(seed,week,source,slot,salt);
    while (used.has(selected.npc.character.name)) selected = core.generateNpc(seed,week,source,slot,++salt);
    used.add(selected.npc.character.name);
    selected.npc.household.home=home;
    for (const key of Object.keys(selected.npc.life.history.counters)) selected.npc.life.history.counters[key]=1000;
    selected.npc.life.history.recent=Array.from({length:core.P7A_TRIAL.recentCap},()=>({week,kind:'post-cleared'}));
    input.npcs.push(selected.npc);
    input.profiles.push(selected.profile);
  }
  return input;
}
function ready(variant) {
  let input = planInput(variant === 'browser' ? 42 : 2026,variant !== 'browser');
  if (variant !== 'control') for (const [tileId,typeId] of [['service-1','guild'],['spec-2','auction-house'],['slum-1','slave-market']]) {
    input=cmd(input,'BUILD',{tileId,typeId}).next;
  }
  return input;
}
if (mode === 'prepare') {
  let state;
  if (variant === 'market') {
    const browserSave = readFileSync(largestSave, 'utf8');
    state = JSON.parse(browserSave).state;
    if (root !== dependencies) {
      delete state.city.society.acquisition;
      state.city.society.rulesetId = core.SOCIETY_RULESET;
    } else {
      assert.equal(successful(persist.serializeCharacterLifeSave(state)).text, browserSave);
    }
  } else {
    state = ready(variant);
  }
  const encoded = successful(persist.serializeCharacterLifeSave(state));
  assert.equal(successful(persist.deserializeCharacterLifeSave(encoded.text)).state.npcs.length,state.npcs.length);
  writeFileSync(file,encoded.text,{encoding:'utf8',flag:'wx'});
  const acquisition=state.city.society.acquisition;
  const comparable=structuredClone(state);
  delete comparable.city.society.acquisition;
  delete comparable.city.society.rulesetId;
  console.log(JSON.stringify({variant, bytes:Buffer.byteLength(encoded.text),sha256:sha(encoded.text),comparableSha:sha(JSON.stringify(comparable)),
    npcCount:state.npcs.length,stock:acquisition?.stock.length??0,lots:acquisition?.lots.length??0,
    actionsPerLot:acquisition?.lots.map(lot=>lot.raises.length)??[],departures:acquisition?.departures.length??0}));
} else {
  const source = readFileSync(file,'utf8');
  const { state } = JSON.parse(source);
  assert.equal(state.npcs.length,100);
  const expectedHash = sha(JSON.stringify(state));
  const elapsed = [], outcomes = [];
  for (let i=0;i<21;i+=1) {
    const start = process.hrtime.bigint();
    const result = mode === 'load'
      ? persist.deserializeCharacterLifeSave(source)
      : sim.executeCharacterLifeCommand(state,{type:'END_WEEK',expectedRevision:state.city.revision,expectedWeek:state.city.world.week});
    elapsed.push(Number(process.hrtime.bigint()-start)/1e6);
    const value = successful(result);
    const resultingState = mode === 'load' ? value.state : value.next;
    assert.equal(resultingState.npcs.length,100);
    assert.equal(resultingState.city.world.week,state.city.world.week+(mode==='load'?0:1));
    if (i===0||i===20) outcomes.push(sha(JSON.stringify(resultingState)));
  }
  assert.equal(outcomes[0],outcomes[1]);
  assert.equal(sha(JSON.stringify(state)),expectedHash);
  let draw;
  if (mode==='tick' && variant==='market' && state.city.society.acquisition) {
    const src = await from('packages/simulation/src/npc-acquisition.ts');
    draw = Array.from({length:21},()=>{
      const start=process.hrtime.bigint();
      const fresh=src.drawAcquisition(state.city.world.worldMetadata.worldSeed,state.city.world.week+1,state.city,state.npcs);
      const elapsed=Number(process.hrtime.bigint()-start)/1e6;
      assert.equal(fresh.stock.length,12);
      assert.equal(fresh.lots.length,2);
      return elapsed;
    });
  }
  console.log(JSON.stringify({variant,mode,pid:process.pid,node:process.version,inputSha256:sha(source),outcomeSha256:outcomes[0],
    sizeBytes:Buffer.byteLength(source),coldMs:elapsed[0],warmMs:elapsed.slice(1),drawMs:draw}));
}
