import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';
const root=process.cwd();
const folder='C:/Users/Admin/.t3/local-drafts/p7b-prB2/';
const draft=JSON.parse(readFileSync(folder+'core-source-proposals.json','utf8'));
const newFiles=JSON.parse(readFileSync(folder+'core-generated-proposals.json','utf8'));
const blobs={};
const pathKey=url=>relative(root,fileURLToPath(url)).replaceAll('\\','/');
const sha=x=>createHash('sha256').update(x).digest('hex');
const getPath=rel=>pathToFileURL(root+'/'+rel).href;
const pinned=rel=>execFileSync('git',['show','HEAD:'+rel],{encoding:'utf8',maxBuffer:4*1024*1024});
const groups=Object.groupBy(draft.hunks.filter(h=>h.path.startsWith('packages/')&&!h.path.includes('__tests__')),h=>h.path);
for(const [rel,list] of Object.entries(groups)){
 const original=pinned(rel);
 const rows=original.match(/[^\r\n]*(?:\r\n|\n|$)/g).filter(Boolean);
 for(const h of [...list].sort((a,b)=>b.from-a.from)){
   let proposal = typeof h.after === 'string' ? h.after : pinned(h.after.copyPath).split('\n').slice(h.after.copyFrom-1,h.after.copyTo).join('\n');
   if(h.old)proposal=rows[h.from-1].replace(/\r?\n$/,'').replace(h.old,h.after);
   rows.splice(h.from-1,(h.to??h.from)-h.from+1,proposal ? proposal+'\n' : '');
 }
 blobs[rel]=rows.join('');
}
Object.assign(blobs,newFiles);
const replacement = process.env.P7B_CORRECTION7_NAME;
if (replacement) blobs['packages/core/src/data/npc-generator.json'] = blobs['packages/core/src/data/npc-generator.json'].replace('"Briala"', JSON.stringify(replacement));
registerHooks({
 resolve(specifier,context,next){
  if(specifier.startsWith('file:')&&Object.hasOwn(blobs,pathKey(specifier)))return {url:specifier,shortCircuit:true};
  if(specifier.startsWith('@haven/'))return next(getPath('packages/'+specifier.split('/')[1]+'/src/index.ts'),context);
  if(specifier.startsWith('.') && context.parentURL?.startsWith('file:') && context.parentURL.endsWith('.ts')){
   const candidate=new URL(specifier.endsWith('.js')?specifier.slice(0,-3)+'.ts':specifier,context.parentURL);
   if(Object.hasOwn(blobs,pathKey(candidate)))return {url:candidate.href,shortCircuit:true};
   if(specifier.endsWith('.js')&&existsSync(candidate))return next(candidate.href,context);
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.startsWith('file:')){
   const rel=pathKey(url);
   if(url.endsWith('.ts')){
    const source=blobs[rel]??readFileSync(new URL(url),'utf8');
    const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}});
    return {format:'module',source:output.outputText,shortCircuit:true};
   }
   if(Object.hasOwn(blobs,rel)&&url.endsWith('.json'))return {format:'json',source:blobs[rel],shortCircuit:true};
  }
  return next(url,context);
 }
});
const core=await import('./packages/core/src/index.ts');
const sim=await import('./packages/simulation/src/index.ts');
const store=await import('./packages/persistence/src/index.ts');
const {withNpcs,NPC_TEST_KEYS}=await import(getPath('packages/core/src/__tests__/helpers/npcs.ts'));
const draftPlayer={...structuredClone(core.DEFAULT_PLAYER_DRAFT),currentName:'Synthetic Keeper'};
const start=seed=>{
 const r=core.createCharacterLifeSession(seed,draftPlayer);
 if(!r.success)throw Error(r.error.message);
 return r.value;
};
const act=(s,type,fields={})=>{
 const r=sim.executeCharacterLifeCommand(s,{type,...fields,expectedRevision:s.city.revision});
 if(!r.success)throw Error(type+': '+r.error.message);
 return r.next;
};
const assert=(v,message)=>{if(!v)throw Error(message)};
const collisionFreeKeys=week=>[
 ...['guild','auction-house','slave-market'].flatMap(source=>Array.from({length:core.P7B_TRIAL.stockSize},(_,slot)=>({week,source,slot}))),
 {week,source:'auction-house',slot:'lot'},{week,source:'slave-market',slot:'lot'}];
const samples=[];
for(const [seed,week,source,slot] of [[0,1,'guild',0],[42,3,'auction-house',2],[2026,4,'slave-market','lot'],[2026,1,'auction-house','lot']]){
 const value=core.generateNpc(seed,week,source,slot);
 assert(core.isCharacterProfile(value.profile,value.npc.character),'profile invalid');
 assert(core.isNpcHousehold(value.npc.household),'household invalid');
 assert(JSON.stringify(value)===JSON.stringify(core.generateNpc(seed,week,source,slot)),'nondeterministic');
 const salted=core.generateNpc(seed,week,source,slot,1);
 const copy=structuredClone(salted);
 copy.npc.character.name=value.npc.character.name;
 assert(JSON.stringify(copy)===JSON.stringify(value)&&salted.npc.character.name!==value.npc.character.name,'salt drift');
 samples.push({seed,week,source,slot,id:value.npc.character.id,name:value.npc.character.name,age:value.npc.character.age,origin:value.npc.life.origin,
   sha256:sha(JSON.stringify(value)),valueMilli:core.npcValueMilli(value.npc,source,slot==='lot')});
}
const weekOne=withNpcs(start(2026),collisionFreeKeys(1));
const selectedName = replacement || 'Briala';
const rowsWithName = npcs => npcs.filter(npc => npc.character.name.startsWith(selectedName + ' ')).map(npc => ({id:npc.character.id,name:npc.character.name}));
const pool=Array.from({length:500},(_,i)=>core.generateNpc(2026,i+1,'guild',0).npc);
const granny=pool.filter(n=>core.npcAgeTitle(n.character.age)==='Granny').length;
const pastMean=source=>Array.from({length:200},(_,i)=>core.generateNpc(2026,i+1,source,0).npc.life.history.counters['partners.outsider']).reduce((a,b)=>a+b,0)/200;
let play=start(2026);
assert(play.npcs.length===0&&play.profiles.length===0,'nonempty');
const inv=play.city.world.settlements.settlement_haven_01.inventory;
assert(inv.gold===120000,'wrong gold');
const openingGold=inv.gold;
const seedCase=withNpcs(play,NPC_TEST_KEYS.slice(0,1));
const npcId=seedCase.npcs[0].character.id;
const posted=act(seedCase,'ASSIGN_NPC',{npcId,tileId:'field-1'});
const moved=act(posted,'MOVE_NPC_HOME',{npcId,homeTileId:'estate-1'});
assert(moved.npcs[0].postTileId===null&&moved.npcs[0].household.home==='estate-1','move');
const bad=sim.executeCharacterLifeCommand(moved,{type:'ASSIGN_NPC',npcId,tileId:'field-1',expectedRevision:moved.city.revision});
assert(!bad.success&&bad.error.code==='NOT_IN_HALL','mansion post accepted');
inv.gold=1000000;
play.city.society.wallRing=2;
play=act(play,'UPGRADE',{tileId:'estate-1'});
play=act(play,'UPGRADE',{tileId:'estate-1'});
play=act(play,'UPGRADE',{tileId:'estate-2'});
play=act(play,'BUILD',{tileId:'house-5',typeId:'retainers-hall'});
play=act(play,'UPGRADE',{tileId:'house-5'});
while(play.city.world.week<8){
 play=act(play,'END_WEEK',{expectedWeek:play.city.world.week});
 play=act(play,'NEXT_WEEK');
}
const keys=Array.from({length:8},(_,i)=>collisionFreeKeys(i+1)).flat().slice(0,100);
const populated=withNpcs(play,keys.map((key,i)=>({...key,homeTileId:i<30?'estate-1':i<80?'estate-2':'house-5'})));
for(const npc of populated.npcs){
  for(const key of Object.keys(npc.life.history.counters)) npc.life.history.counters[key]=1000;
  npc.life.history.recent=Array.from({length:core.P7A_TRIAL.recentCap},(_,i)=>({week:1+i%populated.city.world.week,kind:'post-cleared'}));
}
const first=store.serializeCharacterLifeSave(populated);
assert(first.success,'save failed: '+first.error?.message);
const restored=store.deserializeCharacterLifeSave(first.text);
assert(restored.success,'restore failed: '+restored.error?.message);
const second=store.serializeCharacterLifeSave(restored.state);
assert(second.success&&second.text===first.text,'round trip differed');
const dataRaw=JSON.stringify(core.NPC_GENERATOR_CATALOG);
console.log(JSON.stringify({status:'In-process draft overlay projection, no gate or test run',openingGold,samples,correction7:{selectedName,specificDraw:core.generateNpc(112,1,'guild',0).npc.character.name,weekly14:rowsWithName(weekOne.npcs),draws500:rowsWithName(pool),roundTrip:rowsWithName(populated.npcs),catalogCanonicalSha256:sha(dataRaw)},weekOneUnique:new Set(weekOne.npcs.map(n=>n.character.name)).size,granniesIn500:granny,meanOutsiderPartnersOver200:{auctionHouse:pastMean('auction-house'),slaveMarket:pastMean('slave-market')},roundTripBytes:Buffer.byteLength(first.text),roundTripSha256:sha(first.text),roundTripByteIdentical:true,compactDataBytes:Buffer.byteLength(dataRaw),compactDataGzipBytes:gzipSync(dataRaw).length},null,2));
