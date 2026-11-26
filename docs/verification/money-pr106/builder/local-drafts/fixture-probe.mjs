import { registerHooks } from 'node:module';
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
const root = new URL('./', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      return next(new URL('packages/' + specifier.split('/')[1] + '/src/index.ts', root).href, context);
    }
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});


const core = await import('@haven/core');
const db = await import('@haven/persistence');
const sim = await import('./packages/simulation/src/tile-trial-week.ts');
const { runCatalogScenario,CATALOG_SEEDS } = await import('./packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts');
const fixtureRoot = new URL('./packages/persistence/src/__tests__/fixtures/', root);
const source = new URL('society-v13/',fixtureRoot), target = new URL('society-v14/',fixtureRoot);
const hash = x => createHash('sha256').update(x).digest('hex');
const read = path => readFileSync(path,'utf8');
const purse = () => ({ moneyMilli:0, levyPercent:0, donatedThisWeekMilli:0, robbery:null });
const identify = (state, difficulty) => {
  state.city.society.rulesetId = core.SOCIETY_RULESET;
  state.city.society.difficulty = difficulty;
  state.player.purse = purse();
};
const check = value => { if (!value.success) throw Error(JSON.stringify(value.error)); return value; };
mkdirSync(target,{recursive:true});
let count = 0;
for (const file of readdirSync(source).sort()) {
  const original = read(new URL(file,source)), envelope = JSON.parse(original);
  let bytes;
  if (file === 'new-game.json') {
    const state = core.createSocietyState();
    bytes = JSON.stringify({ format: envelope.format, schemaVersion: envelope.schemaVersion, rulesetId: core.SOCIETY_RULESET, state });
  } else {
    identify(envelope.state,'normal');
    bytes = check(db.serializeCharacterLifeSave(envelope.state)).text;
    assert.equal(check(db.serializeCharacterLifeSave(check(db.deserializeCharacterLifeSave(bytes)).state)).text,bytes);
  }
  writeFileSync(new URL(file,target),bytes);
  console.log(file,'bytes',Buffer.byteLength(original),Buffer.byteLength(bytes));
  count++;
}
const oldText = read(new URL('life-new-game.json',source));
const oldState = JSON.parse(oldText).state;
assert.equal(db.deserializeCharacterLifeSave(oldText).error.code,'INCOMPATIBLE_SAVE');
const stage = structuredClone(oldState); stage.city.society.rulesetId = core.SOCIETY_RULESET;
const detached = db.sessionToRecords('main',stage);
for(const row of detached) {
  if(row.table==='meta') row.value.rulesetId='tile-society-13';
  if(row.table==='city') row.value.society.rulesetId='tile-society-13';
}
const oldCopy = structuredClone(detached);
assert.deepEqual(db.recordsToSession(detached),oldState);
assert.equal(db.serializeCharacterLifeSave(db.recordsToSession(detached)).error.code,'INCOMPATIBLE_SAVE');
assert.deepEqual(detached,oldCopy);
console.log('Historical JSON and detached row representation refused unchanged');
for(const difficulty of ['normal','easy']) {
  const state=check(core.createCharacterLifeSession(2026,{...core.DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'},difficulty)).value;
  state.player.purse={moneyMilli:1201,levyPercent:5,donatedThisWeekMilli:1000,robbery:{id:'home-robbery-w1',week:1,excessMilli:201}};
  const encoded=check(db.serializeCharacterLifeSave(state)).text;
  const store=db.createMemoryGameStore();
  await store.replaceSlot('main',db.sessionToRecords('main',check(db.deserializeCharacterLifeSave(encoded)).state));
  const rows=await store.read('main');
  const rebuilt=db.recordsToSession(rows);
  assert.deepEqual(rebuilt.player.purse,state.player.purse);
  assert.equal(rebuilt.city.society.difficulty,difficulty);
  assert.equal(check(db.serializeCharacterLifeSave(rebuilt)).text,encoded);
  console.log(difficulty,'populated JSON and memory-store bytes',Buffer.byteLength(encoded));
}
const goldFile=new URL('./packages/simulation/src/__tests__/fixtures/catalog-golden.json',root);
const golden=CATALOG_SEEDS.map(runCatalogScenario);
writeFileSync(goldFile,JSON.stringify(golden,null,2)+'\n');
console.log('Golden',hash(read(goldFile)), 'fixtures',count);
const craftHashes=[];
for (const seed of CATALOG_SEEDS) {
  const city=core.createSocietyState(); city.world.worldMetadata.worldSeed=seed;
  const inventory=city.world.settlements[city.world.activeSettlementId].inventory;
  for(const key of ['gold','food','wood','iron']) inventory[key]=1_000_000;
  city.goodsStock.amountMilli=1_000_000;
  const reports=[],items=[];
  for(let week=0;week<60;week++) {
    reports.push(sim.runTileTrialWeek(city));
    items.push(structuredClone(city.society.items));
    city.phase='planning';
  }
  const {acquisition,difficulty,...v12}=city.society;
  const digest = obj => hash(JSON.stringify(obj));
  craftHashes.push({seed,reports:digest(reports),items:digest(items),city:digest(city),priorCity:digest({...city,society:{...v12,rulesetId:'tile-society-12'}})});
}
console.log('Craft hashes',JSON.stringify(craftHashes));
