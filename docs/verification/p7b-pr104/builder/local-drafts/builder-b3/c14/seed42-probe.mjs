import { registerHooks, createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [root, dependencies, mode, variant, file] = process.argv.slice(2);
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

const view=await from('packages/ui/src/acquisition-view.ts');
const report=await from('packages/ui/src/report-letters.ts');
const make=()=>core.createCharacterLifeSession(42,{...structuredClone(core.DEFAULT_PLAYER_DRAFT),currentName:'Market Keeper'}).value;
const act=(s,type,fields={})=>{
 const r=sim.executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...fields}); if(!r.success)throw Error(r.error.message); return r;
};
let s=make();
for(const [tileId,typeId] of [['service-1','guild'],['spec-2','auction-house'],['slum-1','slave-market']]) s=act(s,'BUILD',{tileId,typeId}).next;
const guild=view.acquisitionView(s.city,s.npcs,'guild');
console.log(JSON.stringify({stock:guild.stock.map(o=>o.card), auction:view.acquisitionView(s.city,s.npcs,'auction-house').auction}));
const hired=act(s,'BUY_NPC',{source:'guild',slot:0,homeTileId:'estate-1'}).next;
const bid=act(hired,'BID_NPC',{source:'auction-house',homeTileId:'estate-1',raise:5000}).next;
console.log(JSON.stringify({afterBid:view.acquisitionView(bid.city,bid.npcs,'auction-house').auction,rows:report.householdReportRows(act(bid,'END_WEEK',{expectedWeek:1}).report)}));
const sold=act(s,'BUY_NPC',{source:'slave-market',slot:0,homeTileId:'estate-2'}).next;
let both=act(sold,'BUY_NPC',{source:'guild',slot:0,homeTileId:'estate-2'}).next;
both=act(both,'SELL_NPC',{npcId:both.npcs[0].character.id}).next;
both=act(both,'RELEASE_NPC',{npcId:both.npcs[0].character.id}).next;
console.log(JSON.stringify({departureRows:report.householdReportRows(act(both,'END_WEEK',{expectedWeek:1}).report)}));
const canBid=(seed,source)=>{
 const npc=core.generateNpc(seed,101,source,'lot').npc;
 const value=core.npcValueMilli(npc,source,true), starting=core.auctionOpeningMilli(value);
 const winning=Math.max(...core.auctionRivals(seed,101,source,value).map(x=>x.ceilingMilli));
 return winning>=starting+30000;
};
console.log('long transcripts both markets seed '+Array.from({length:1000},(_,i)=>i).find(seed=>canBid(seed,'auction-house')&&canBid(seed,'slave-market')));
