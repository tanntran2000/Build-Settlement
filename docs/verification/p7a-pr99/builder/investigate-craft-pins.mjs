// Read-only HOLD investigation. Uses the installed Vite SSR loader without a
// listening HTTP/HMR server, builds, dependency installation, or repository edits.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01';
const out='C:/Users/Admin/.t3/local-drafts/p7a-prA';
const {createServer}=await import(pathToFileURL(root+'/packages/ui/node_modules/vite/dist/node/index.js').href);
const server=await createServer({root,configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false,watch:null},ssr:{noExternal:true}});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const source=readFileSync(root+'/packages/simulation/src/__tests__/craft-week.test.ts','utf8');
const pins=[...source.matchAll(/^\s+(\d+): \{reports:'([^']+)',items:'([^']+)',city:'([^']+)'\},/gm)].map(m=>({seed:Number(m[1]),reports:m[2],items:m[3],city:m[4]}));
assert.equal(pins.length,3);
const results=[];
try {
  const {createSocietyState}=await server.ssrLoadModule('/packages/core/src/index.ts');
  const {runTileTrialWeek}=await server.ssrLoadModule('/packages/simulation/src/tile-trial-week.ts');
  for(const pin of pins){
    const city=createSocietyState();
    city.world.worldMetadata.worldSeed=pin.seed;
    const stocks=city.world.settlements[city.world.activeSettlementId].inventory;
    for(const key of ['gold','food','wood','iron'])stocks[key]=1_000_000;
    city.goodsStock.amountMilli=1_000_000;
    const reports=[],items=[];
    for(let i=0;i<60;i++){
      reports.push(runTileTrialWeek(city));items.push(structuredClone(city.society.items));city.phase='planning';
    }
    assert.equal(city.society.rulesetId,'tile-society-10');
    const normalized={...city,society:{...city.society,rulesetId:'tile-society-09'}};
    const actual={reports:hash(reports),items:hash(items),city:hash(city)};
    const normalizedCity=hash(normalized);
    assert.equal(actual.reports,pin.reports);assert.equal(actual.items,pin.items);assert.equal(normalizedCity,pin.city);
    writeFileSync(`${out}/craft-no-order-seed-${pin.seed}.json`,JSON.stringify({city,reports,items},null,2)+'\n','utf8');
    results.push({seed:pin.seed,before:pin.city,after:actual.city,normalizedCity,reportsUnchanged:true,itemsUnchanged:true,week:city.world.week});
  }
  const result={utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),candidateTree:execFileSync('git',['write-tree'],{cwd:root,encoding:'utf8'}).trim(),results};
  writeFileSync(out+'/craft-pin-investigation.json',JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  console.log('PASS: changing only the in-memory final city ruleset back to 09 restores all three original city pins; reports/items hashes are unchanged. No source or test edit made.');
} finally {await server.close();}
