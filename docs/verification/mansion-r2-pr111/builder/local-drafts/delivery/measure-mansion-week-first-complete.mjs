import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire, registerHooks} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [baseDir, headDir, outputDir] = process.argv.slice(2).map(path => resolve(path));
const roots = [baseDir, headDir].map(root => pathToFileURL(root + '/').href);
const ts = createRequire(resolve(headDir, 'package.json'))('typescript');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonHash = value => sha(JSON.stringify(value));
const saveJson = (name, value) => writeFileSync(resolve(outputDir,name), JSON.stringify(value,null,2)+'\n','utf8');

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      const root = roots.find(url => context.parentURL?.startsWith(url)) ?? roots[1];
      const [, workspace, ...subpath] = specifier.split('/');
      const file = subpath.join('/') === 'testing/npcs' ? '__tests__/helpers/npcs.ts' : 'index.ts';
      return next(new URL('packages/'+workspace+'/src/'+file,root).href, context);
    }
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0,-3)+'.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href,context);
    }
    return next(specifier,context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const {outputText} = ts.transpileModule(readFileSync(new URL(url),'utf8'), {
        compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},
        fileName:url,
      });
      return {format:'module',source:outputText,shortCircuit:true};
    }
    return next(url,context);
  },
});

mkdirSync(outputDir,{recursive:true});
const from = (branch, file) => import(new URL('packages/'+file,roots[branch]).href);
const [a,b] = await Promise.all([0,1].map(index=>from(index,'simulation/src/character-life-command.ts')));
const [saveA,saveB] = await Promise.all([0,1].map(index=>from(index,'persistence/src/index.ts')));
const core=await from(1,'core/src/index.ts');
const {populate,town,stock}=await from(1,'simulation/src/__tests__/acquisition-fixture.ts');
const {runMansionWeek}=await from(1,'simulation/src/mansion-week.ts');

const base='13cf5b165c36872d1ac216e4a8a161b79f3fb7c5';
const git=(...args)=>execFileSync('git',args,{cwd:headDir,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
const baseTree=git('rev-parse',base+'^{tree}');
const headTree=git('write-tree');
assert.equal(git('diff','--name-only'),'','The staged measurement tree must match the working source.');
function fixture(difficulty) {
  const state=town(2026);
  state.city.society.difficulty=difficulty;
  const homes=[...Array(30).fill('estate-1'),...Array(50).fill('estate-2'),...Array(20).fill('house-5')];
  populate(state,homes);
  stock(state).gold=2_000_000;
  const catalog=core.MANSION_CATALOG;
  const ids=['master-suite','throne-room','maids-quarters','guard-quarters','training-yard','vault','bedroom','dungeon','bedroom'];
  const decorative=Object.keys(catalog.furniture).filter(id=>!catalog.furniture[id].addsBed);
  state.city.society.mansion={rooms:ids.map((typeId,i)=>{
    const furniture=decorative.slice(0,catalog.roomTypes[typeId].furnitureSlots[2]);
    if (i===6) furniture.push('single-bed','single-bed','single-bed');
    return {id:'room-'+(i+1),typeId,level:3,furniture};
  }),nextRoomSeq:ids.length+1};
  const suite=['wife','concubine','concubine','concubine','fucktoy'];
  const maids=['head-maid',...Array(9).fill('maid')];
  const guards=['captain',...Array(9).fill('guard')];
  const bedrooms=['accountant','maid','maid','guard','guard'];
  const roles=[...suite,...maids,...guards,...bedrooms];
  const rooms=[...Array(5).fill('room-1'),...Array(10).fill('room-3'),...Array(10).fill('room-4'),...Array(4).fill('room-7'),'room-9'];
  state.npcs.slice(0,30).forEach((npc,i)=>{
    Object.assign(npc.household,{role:roles[i],room:rooms[i]});
    npc.life.stress=20;
  });
  assert.equal(state.npcs.length,100);
  assert.equal(state.npcs.filter(npc=>npc.household.home==='estate-1').length,30);
  assert.deepEqual([...new Set(roles)].sort(),[...core.MANSION_ROLES].sort());
  assert.deepEqual([...new Set(ids)].sort(),Object.keys(catalog.roomTypes).sort());
  for(const room of state.city.society.mansion.rooms) assert.equal(
    room.furniture.filter(id=>!catalog.furniture[id].addsBed).length,catalog.roomTypes[room.typeId].furnitureSlots[room.level-1],
  );
  const encoded=saveB.serializeCharacterLifeSave(state);
  assert.equal(encoded.success,true,JSON.stringify(encoded));
  const parsedA=saveA.deserializeCharacterLifeSave(encoded.text);
  const parsedB=saveB.deserializeCharacterLifeSave(encoded.text);
  assert.equal(parsedA.success,true,JSON.stringify(parsedA));
  assert.equal(parsedB.success,true,JSON.stringify(parsedB));
  assert.deepEqual(parsedA.state,state);
  assert.deepEqual(parsedB.state,state);
  writeFileSync(resolve(outputDir,difficulty+'-full-mansion-v15.json'),encoded.text,'utf8');
  return {state, fixtureSha256:sha(encoded.text)};
}
function dispatch(api,state) {
  return api.executeCharacterLifeCommand(state,{
    type:'END_WEEK',expectedRevision:state.city.revision,expectedWeek:state.city.world.week,
  });
}
function expectResult(result) {
  assert.equal(result.success,true,JSON.stringify(result));
  assert(result.report);
  return result;
}
function stats(samples) {
  const sorted=[...samples].sort((a,b)=>a-b);
  return {n:sorted.length,median:sorted[Math.ceil(sorted.length/2)-1],p95:sorted[Math.ceil(.95*sorted.length)-1],max:sorted.at(-1),min:sorted[0]};
}
function sample(api,state,hash,count=8) {
  return Array.from({length:count},()=>{
    const input=structuredClone(state);
    const start=process.hrtime.bigint();
    const result=dispatch(api,input);
    const ms=Number(process.hrtime.bigint()-start)/1e6;
    assert.equal(jsonHash(expectResult(result)),hash);
    return ms;
  });
}
function neutralParity(difficulty) {
  const state=town(2026);
  state.city.society.difficulty=difficulty;
  const before=expectResult(dispatch(a,structuredClone(state)));
  const after=expectResult(dispatch(b,structuredClone(state)));
  const {mansion,...legacy}=after.report;
  assert.equal(mansion.upkeepPaid,true);
  assert.equal(JSON.stringify({...after,report:legacy}),JSON.stringify(before));
  return {difficulty, legacySha256:jsonHash(before), mansion};
}
const paired=[];
const pairedSummary=[];
const isolated=[];
const cases=['normal','easy'].map(difficulty=>({difficulty,...fixture(difficulty)}));
for (const {difficulty,state,fixtureSha256} of cases) {
  const before=expectResult(dispatch(a,structuredClone(state)));
  const after=expectResult(dispatch(b,structuredClone(state)));
  assert.equal(after.report.mansion.upkeepPaid,true);
  saveJson(difficulty+'-paired-representative.json',{
    base:{report:before.report, stateSha256:jsonHash(before.next)},
    head:{report:after.report, stateSha256:jsonHash(after.next)},
  });
  const hashA=jsonHash(before),hashB=jsonHash(after);
  sample(a,state,hashA,8);sample(b,state,hashB,8);
  const baseSamples=[],headSamples=[],deltas=[],noise=[],p95Delta=[],p95Noise=[];
  for(let block=0;block<8;block++){
    const aa1=sample(a,state,hashA), aa2=sample(a,state,hashA);
    const ab=block%2===0;
    const left=sample(ab?a:b,state,ab?hashA:hashB),right=sample(ab?b:a,state,ab?hashB:hashA);
    const baseMs=ab?left:right,headMs=ab?right:left;
    baseSamples.push(...baseMs);headSamples.push(...headMs);
    const delta=stats(headMs).median-stats(baseMs).median;
    const aaDelta=stats(aa2).median-stats(aa1).median;
    deltas.push(delta);noise.push(aaDelta);
    p95Delta.push(stats(headMs).p95-stats(baseMs).p95);
    p95Noise.push(stats(aa2).p95-stats(aa1).p95);
    paired.push({difficulty,fixtureSha256,block:block+1,order:ab?'AB':'BA',aa1,aa2,baseMs,headMs,delta,aaDelta});
  }
  const noiseBound=Math.max(...noise.map(Math.abs)),p95NoiseBound=Math.max(...p95Noise.map(Math.abs));
  pairedSummary.push({difficulty,fixtureSha256,hashA,hashB,baseMs:stats(baseSamples),headMs:stats(headSamples),
    pairedMedianDeltaMs:stats(deltas),aaMedianDeltaMs:stats(noise),
    pairedP95DeltaMs:stats(p95Delta),aaP95DeltaMs:stats(p95Noise),
    medianWithinNoise:stats(deltas).median<=noiseBound,tailWithinNoise:stats(p95Delta).median<=p95NoiseBound});
  const npcs=structuredClone(after.next.npcs);
  const charge={terms:core.mansionTerms(state),paid:true};
  const restore=npcs.flatMap(npc=>{
    const room=charge.terms.effectsByRoom.get(npc.household.room);
    return room?.npcStress||room?.npcAffection?[{npc,stress:npc.life.stress,affection:npc.character.relationshipToPlayer.affection}]:[];
  });
  const reset=()=>{for(const {npc,stress,affection} of restore){
    npc.life.stress=stress;npc.character.relationshipToPlayer.affection=affection;
  }};
  const expected=runMansionWeek(npcs,charge);
  for(let i=0;i<16000;i++){reset();runMansionWeek(npcs,charge);}
  const rawNs=[];
  for(let i=0;i<20000;i++){
    reset();
    const start=process.hrtime.bigint();
    const report=runMansionWeek(npcs,charge);
    rawNs.push(Number(process.hrtime.bigint()-start));
    assert.deepEqual(report,expected);
  }
  saveJson(difficulty+'-isolated-raw-ns.json',rawNs);
  const ms=stats(rawNs.map(ns=>ns/1e6));
  isolated.push({difficulty,fixtureSha256,ms,thresholdMedianMs:0.05,met:ms.median<=0.05});
}
const neutral=['normal','easy'].map(neutralParity);
writeFileSync(resolve(outputDir,'raw-paired.ndjson'),paired.map(row=>JSON.stringify(row)).join('\n')+'\n','utf8');
const summary={utc:new Date().toISOString(),node:process.version,base,baseTree,head,headTree,paired:pairedSummary,isolated,neutral};
saveJson('measurement-summary.json',summary);
console.log(JSON.stringify(summary,null,2));
if(pairedSummary.some(row=>!row.medianWithinNoise||!row.tailWithinNoise)||isolated.some(row=>!row.met))process.exitCode=1;

