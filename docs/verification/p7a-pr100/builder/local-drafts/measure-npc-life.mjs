// Quiet-machine acceptance measurement. No listener, build or dependency install.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const root='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out='C:/Users/Admin/.t3/local-drafts/p7a-prB';
const phase=process.argv[2];assert.ok(['RED','GREEN'].includes(phase));
const {createServer}=await import(pathToFileURL(root+'/packages/ui/node_modules/vite/dist/node/index.js').href);
const server=await createServer({root,configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false,watch:null},ssr:{noExternal:true}});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const result={phase,utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),budgetMs:50,npcs:100,weeks:60,lifeSamplesMs:[],endWeekSamplesMs:[]};
try {
  const core=await server.ssrLoadModule('/packages/core/src/index.ts');
  const {runNpcLifeWeek}=await server.ssrLoadModule('/packages/simulation/src/npc-life-week.ts');
  assert.equal(typeof runNpcLifeWeek,'function');
  const {executeCharacterLifeCommand}=await server.ssrLoadModule('/packages/simulation/src/character-life-command.ts');
  const made=core.createCharacterLifeSession(42,{...structuredClone(core.DEFAULT_PLAYER_DRAFT),currentName:'Synthetic Keeper'});
  assert.equal(made.success,true);let session=made.value;
  const templates=structuredClone(session.npcs),profiles=structuredClone(session.profiles);
  session.npcs=Array.from({length:100},(_,i)=>{const npc=structuredClone(templates[i%3]);npc.character.id=i<3?templates[i].character.id:`npc_perf_${i}`;npc.character.name=`Perf NPC ${i}`;npc.life=core.createNpcLife(42,npc.character.id,npc.character.age);return npc;});
  session.profiles=session.npcs.map((npc,i)=>({...structuredClone(profiles[i%3]),id:npc.character.id}));
  const inventory=session.city.world.settlements[session.city.world.activeSettlementId].inventory;
  for(const key of ['gold','food','wood','iron'])inventory[key]=1_000_000;
  session.city.goodsStock.amountMilli=1_000_000;
  assert.equal(core.isCharacterLifeSessionState(session),true);
  let life=structuredClone(session.npcs);
  for(let week=2;week<=61;week++){
    const start=performance.now();const next=runNpcLifeWeek(life,{week,authority:50});
    result.lifeSamplesMs.push(performance.now()-start);life=next.npcs;
  }
  for(let i=0;i<60;i++){
    const start=performance.now();const next=executeCharacterLifeCommand(session,{type:'END_WEEK',expectedRevision:session.city.revision,expectedWeek:session.city.world.week});
    result.endWeekSamplesMs.push(performance.now()-start);
    assert.equal(next.success,true);assert.ok(next.report);session=next.next;
    const planning=executeCharacterLifeCommand(session,{type:'NEXT_WEEK',expectedRevision:session.city.revision});assert.equal(planning.success,true);session=planning.next;
  }
  const stats=samples=>({min:Math.min(...samples),max:Math.max(...samples),mean:samples.reduce((a,b)=>a+b,0)/samples.length});
  result.life=stats(result.lifeSamplesMs);result.endWeek=stats(result.endWeekSamplesMs);
  result.finalSessionSha256=hash(session);result.sourceSha256={};
  for(const file of ['packages/simulation/src/npc-life-week.ts','packages/simulation/src/character-life-command.ts','packages/core/src/trial/items.ts','packages/core/src/trial/types.ts'])result.sourceSha256[file]=createHash('sha256').update(readFileSync(root+'/'+file)).digest('hex');
  writeFileSync(out+`/perf-${phase}-final-session.json`,JSON.stringify(session,null,2)+'\n','utf8');
  assert.equal(session.city.world.week,61);assert.equal(session.npcs.length,100);
  assert.ok(result.life.max<50,`NPC life tick max ${result.life.max} ms exceeds 50 ms`);
  assert.ok(result.endWeek.max<50,`End Week max ${result.endWeek.max} ms exceeds 50 ms`);
  result.exitCode=0;
}catch(error){result.exitCode=1;result.error=String(error);process.exitCode=1;}
finally{await server.close();writeFileSync(out+`/perf-${phase}.json`,JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify(result,null,2));}
