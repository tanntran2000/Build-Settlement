import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const evidence=path.dirname(fileURLToPath(import.meta.url));
const files=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n');
const patterns={health:/health|lordHealthLoss|wound|Math\.max\(1/i,drug:/drug-store|Drug Store|reserved|TRIAL_BUILDINGS|SOCIETY_BUILDINGS/,posts:/NPC_MANAGER_BUILDING_TYPES|managerSlotTileIds|LOCKED_POST|postTileId|ASSIGN_NPC/,items:/market|\.items|Legendary|inventory|consumable/i,reports:/TileTrialReport|report.*(?:toEqual|keys)|toEqual\((?:expected|old|baseline)|society-v8|golden|fixture/i};
const index=[],hits=[];
for(const file of files.filter(f=>/\.(test|spec)\.(ts|mjs)$/.test(f)||/(?:__tests__|tests)\/.*\.ts$/.test(f))){
 const bytes=fs.readFileSync(file),text=bytes.toString('utf8'),found=[];
 text.split(/\r?\n/).forEach((text,i)=>{const topics=Object.entries(patterns).filter(([,regex])=>regex.test(text)).map(([name])=>name);if(topics.length)found.push({line:i+1,topics,text});});
 index.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),lines:text.split(/\r?\n/).length,hits:found.length});
 if(found.length)hits.push({file,hits:found});
}
fs.writeFileSync(path.join(evidence,'step0-test-file-index.json'),JSON.stringify(index,null,2)+'\n','utf8');
fs.writeFileSync(path.join(evidence,'step0-search-hits.json'),JSON.stringify(hits,null,2)+'\n','utf8');
const root='packages/persistence/src/__tests__/fixtures/society-v8';
const fixtureInfo=fs.readdirSync(root).filter(f=>f.endsWith('.json')).sort().map(name=>{
 const bytes=fs.readFileSync(`${root}/${name}`),envelope=JSON.parse(bytes),s=envelope.state,city=s.city??s;
 return {name,sha256:createHash('sha256').update(bytes).digest('hex'),week:city.world.week,health:s.player?.character.health,authority:city.society.order.authority,posts:s.npcs?.map(n=>n.postTileId),items:city.society.items};
});
fs.writeFileSync(path.join(evidence,'step0-v8-fixture-manifest.json'),JSON.stringify(fixtureInfo,null,2)+'\n','utf8');
console.log(`Scanned ${index.length} tracked test/support files; ${hits.length} have topic hits. Recorded all 10 v8 fixtures without running tests or generators.`);
