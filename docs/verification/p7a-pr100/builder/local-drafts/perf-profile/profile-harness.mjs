// Diagnostic-only shared harness. No repository writes, listener or gameplay warm-up.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Session } from 'node:inspector';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out=dirname(fileURLToPath(import.meta.url));
const [run,revision,expectedHead]=process.argv.slice(2);
assert.ok(/^0[1-6]-(base|head)$/.test(run));
assert.ok(['base','head'].includes(revision));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const save=(name,value)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n','utf8');
assert.equal(git('rev-parse','HEAD'),expectedHead);assert.equal(git('status','--porcelain=v1'),'');
const stats=values=>{
  const sorted=[...values].sort((a,b)=>a-b);
  return {n:values.length,max:Math.max(...values),p95:sorted[Math.ceil(.95*sorted.length)-1],mean:values.reduce((a,b)=>a+b,0)/values.length,over50:values.filter(v=>v>50).length};
};
const result={run,revision,head:expectedHead,tree:git('rev-parse','HEAD^{tree}'),utcStart:new Date().toISOString(),pid:process.pid,node:process.version,v8:process.versions.v8,execArgv:process.execArgv,seed:42,npcs:100,weeks:60,budgetMs:50,diagnosticOnly:true,p95Method:'nearest rank ceil(0.95*n)',warmView:'ticks 6-60; all raw ticks 1-60 retained',cpuSamplingUs:1000,instrumentation:'Read-only Vite transforms: head in-call life, life full-NPC clone, post-transition map/scan. Inspector CPU sampling covers END_WEEK plus intervening NEXT_WEEK on both revisions. Timers and sampling may perturb absolute duration; configuration is identical across the six processes.',sourceHashes:{},ticks:[]};
const profile={phase:'setup',current:null};globalThis.__p7Diagnostic=profile;
const transforms=[];
const plugin={name:'p7-diagnostic-timing',enforce:'pre',transform(input,id){
  const file=id.replaceAll('\\','/').split('?')[0];
  if(revision!=='head')return null;
  let code=input.replaceAll('\r\n','\n');
  if(file.endsWith('/packages/simulation/src/npc-life-week.ts')){
    const declaration='export function runNpcLifeWeek(';
    assert.equal(code.split(declaration).length,2);
    code=code.replace(declaration,'function __p7OriginalNpcLifeWeek(');
    const clone='  const next = structuredClone(npcs);';
    assert.equal(code.split(clone).length,2);
    code=code.replace(clone,'  const __p7CloneStart = performance.now();\n'+clone+'\n  globalThis.__p7Diagnostic.current.lifeCloneMs = performance.now() - __p7CloneStart;');
    code+='\nexport function runNpcLifeWeek(...args) {\n  const start = performance.now();\n  try { return __p7OriginalNpcLifeWeek(...args); }\n  finally { globalThis.__p7Diagnostic.current.lifeMs = performance.now() - start; }\n}\n';
  }else if(file.endsWith('/packages/simulation/src/character-life-command.ts')){
    const start=code.indexOf('    const posts = new Map('),end=code.indexOf('    let report=');
    assert.ok(start>=0&&end>start);
    code=code.slice(0,start)+'    const __p7PostStart = performance.now();\n'+code.slice(start,end)+'    if (globalThis.__p7Diagnostic.phase === "END_WEEK") globalThis.__p7Diagnostic.current.postTransitionsMs = performance.now() - __p7PostStart;\n'+code.slice(end);
  }else return null;
  const name=file.split('/').at(-1);
  writeFileSync(join(out,`${run}-instrumented-${name}.txt`),code,'utf8');
  transforms.push({file,originalSha256:sha(Buffer.from(input)),transformedSha256:sha(Buffer.from(code))});
  return {code,map:null};
}};
let server,inspector,started=false;
const post=(method,params={})=>new Promise((resolve,reject)=>inspector.post(method,params,(error,value)=>error?reject(error):resolve(value)));
try{
  const {createServer}=await import(pathToFileURL(root+'/packages/ui/node_modules/vite/dist/node/index.js').href);
  result.vite=JSON.parse(readFileSync(root+'/packages/ui/node_modules/vite/package.json','utf8')).version;
  server=await createServer({root,configFile:false,appType:'custom',plugins:[plugin],server:{middlewareMode:true,hmr:false,watch:null},ssr:{noExternal:true}});
  const core=await server.ssrLoadModule('/packages/core/src/index.ts');
  const {executeCharacterLifeCommand}=await server.ssrLoadModule('/packages/simulation/src/character-life-command.ts');
  const made=core.createCharacterLifeSession(42,{...structuredClone(core.DEFAULT_PLAYER_DRAFT),currentName:'Synthetic Keeper'});
  assert.equal(made.success,true);let session=made.value;
  const templates=structuredClone(session.npcs),profiles=structuredClone(session.profiles);
  session.npcs=Array.from({length:100},(_,i)=>{
    const npc=structuredClone(templates[i%3]);
    npc.character.id=i<3?templates[i].character.id:`npc_perf_${i}`;
    npc.character.name=`Perf NPC ${i}`;
    npc.life=core.createNpcLife(42,npc.character.id,npc.character.age);
    return npc;
  });
  session.profiles=session.npcs.map((npc,i)=>({...structuredClone(profiles[i%3]),id:npc.character.id}));
  const inventory=session.city.world.settlements[session.city.world.activeSettlementId].inventory;
  for(const key of ['gold','food','wood','iron'])inventory[key]=1_000_000;
  session.city.goodsStock.amountMilli=1_000_000;
  assert.equal(core.isCharacterLifeSessionState(session),true);
  assert.ok(session.npcs.every(npc=>npc.character.gender==='female'&&npc.character.age>=18&&npc.life));
  result.initialSessionSha256=sha(Buffer.from(JSON.stringify(session)));
  save(`${run}-initial-session.json`,session);
  inspector=new Session();inspector.connect();
  await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});await post('Profiler.start');started=true;
  // No runNpcLifeWeek pre-pass and no discarded command samples.
  for(let tick=1;tick<=60;tick++){
    const week=session.city.world.week;
    const raw={type:'END_WEEK',expectedRevision:session.city.revision,expectedWeek:week};
    profile.current={lifeMs:null,lifeCloneMs:null,postTransitionsMs:null};profile.phase='END_WEEK';
    const start=performance.now();
    const next=executeCharacterLifeCommand(session,raw);
    const end=performance.now();profile.phase='after END_WEEK';
    assert.equal(next.success,true,`END_WEEK tick ${tick}`);assert.ok(next.report);session=next.next;
    result.ticks.push({tick,weekBefore:week,weekAfter:session.city.world.week,startMs:start,endMs:end,endWeekMs:end-start,...profile.current});
    profile.phase='NEXT_WEEK';
    const planning=executeCharacterLifeCommand(session,{type:'NEXT_WEEK',expectedRevision:session.city.revision});
    assert.equal(planning.success,true,`NEXT_WEEK tick ${tick}`);session=planning.next;
  }
  profile.phase='done';
  const cpu=await post('Profiler.stop');started=false;save(`${run}.cpuprofile`,cpu.profile);
  assert.equal(session.city.world.week,61);assert.equal(session.npcs.length,100);
  assert.equal(result.ticks.length,60);
  assert.equal(transforms.length,revision==='head'?2:0);
  assert.ok(result.ticks.every(t=>revision==='head'?Number.isFinite(t.lifeMs)&&Number.isFinite(t.lifeCloneMs)&&Number.isFinite(t.postTransitionsMs):t.lifeMs===null));
  for(const [key,field] of [['endWeek','endWeekMs'],['life','lifeMs'],['lifeClone','lifeCloneMs'],['postTransitions','postTransitionsMs']]){
    result[key]=revision==='base'&&key!=='endWeek'?null:{all:stats(result.ticks.map(t=>t[field])),warm:stats(result.ticks.slice(5).map(t=>t[field])),firstFive:stats(result.ticks.slice(0,5).map(t=>t[field]))};
  }
  result.maxTick=result.ticks.reduce((best,t)=>t.endWeekMs>best.endWeekMs?t:best,result.ticks[0]).tick;
  result.overBudgetTicks=result.ticks.filter(t=>t.endWeekMs>50).map(t=>t.tick);
  result.finalSessionSha256=sha(Buffer.from(JSON.stringify(session)));
  save(`${run}-final-session.json`,session);
  result.exitCode=0;
}catch(error){result.exitCode=1;result.error=String(error.stack??error);process.exitCode=1;}
finally{
  if(inspector){if(started){try{const cpu=await post('Profiler.stop');save(`${run}-partial.cpuprofile`,cpu.profile);}catch{}}inspector.disconnect();}
  if(server)await server.close();
  for(const file of ['packages/simulation/src/character-life-command.ts','packages/core/src/trial/items.ts','packages/core/src/trial/types.ts',...(revision==='head'?['packages/simulation/src/npc-life-week.ts']:[])])result.sourceHashes[file]=sha(readFileSync(join(root,file)));
  result.transforms=transforms;result.harnessSha256=sha(readFileSync(fileURLToPath(import.meta.url)));result.utcEnd=new Date().toISOString();
  save(`${run}.json`,result);
  console.log(JSON.stringify({run,head:result.head,exitCode:result.exitCode,error:result.error,endWeek:result.endWeek,life:result.life,lifeClone:result.lifeClone,postTransitions:result.postTransitions,maxTick:result.maxTick,overBudgetTicks:result.overBudgetTicks},null,2));
}
