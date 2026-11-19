
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
const draft=process.argv[2]??"C:/Users/Admin/.t3/local-drafts/p7b-prB1";
const mode=process.argv[3]??'verify';
const base='27f4dc2e0ea6ed4f12e79fab6366d11fb555551b';
const git=(...args)=>execFileSync('git',args,{maxBuffer:8*1024*1024});
const blob=path=>git('cat-file','blob',base+':'+path).toString('utf8');
const digest=s=>createHash('sha256').update(s).digest('hex');
const pin=(file,hash)=>{
 const bytes=readFileSync(join(draft,file));
 assert.equal(digest(bytes),hash,file);
 return bytes.toString('utf8');
};
pin('binding-plan-97246f0.md','00bf415a55d9f0bc3afafe3b4bdb875205a7a39a68c2e4a82e518ca5c79e2557');
pin('builder-b1/README.md','13dee23e6dbeadab049a7870a9ee14899c9b6678f9900f958b2970b2e36a584d');
pin('STEP0-HOLD.md','466bf295c326e0b1453addc0167677a54f5269fdf41f48b2d875f858f7aced6a');
const packet=JSON.parse(pin('source-replacements.json','df05c5f3344c11dce410a1529f16afd1f9e89653345de094001b2c380a5ee686'));
const gen=JSON.parse(pin('generated-byte-proposals.json','a496533bd933f73a00fc81df77bc2d516ccba6052a60fd6d22bc5e101d15397e'));
const split=s=>s.match(/[^\n]*\n|[^\n]+$/g)??[];
const paths=Object.keys(packet.files).sort();
const expected=new Map();
assert.equal(packet.replacements.length,157);
assert.equal(paths.length,66);
for(const path of paths){
 const original=blob(path);
 assert.equal(digest(original),packet.files[path].gitBeforeSha256,path);
 const lines=split(original);
 for(const h of packet.replacements.filter(r=>r.file===path).reverse()){
  assert.equal(lines.slice(h.lines[0]-1,h.lines[1]).join(''),h.before,path+':'+h.lines);
  lines.splice(h.lines[0]-1,h.lines[1]-h.lines[0]+1,h.after);
 }
 const next=lines.join('');
 assert.equal(digest(next),packet.files[path].gitProposedSha256,path);
 expected.set(path,next);
}
const additions=[];
function change(scope,path,before,after){
 const value=expected.get(path);
 assert.equal(value.split(before).length,2,scope+' '+path);
 expected.set(path,value.replace(before,()=>after));
 additions.push({scope,path,before,after});
}
const e2e='tests/e2e/society.spec.ts', trial='packages/simulation/src/tile-trial.ts';
change('Correction 1 exact new assertions',e2e,'toMatchObject({gold:100000,wood:40000,iron:20000})','toStrictEqual({gold:100000,wheat:0,food:20000,wood:40000,iron:20000})');
change('Correction 1 exact new assertions',e2e,".getByTestId('trial-tile-estate-1')).toContainText('Mansion')",".locator('#trial-building-name-estate-1')).toHaveText('Mansion')");
change('Correction 1 exact new assertions',e2e,`.getByTestId('trial-tile-estate-2')).toContainText("Retainers' Hall")`,`.locator('#trial-building-name-estate-2')).toHaveText("Retainers' Hall")`);
const originalImport=split(blob(e2e))[6].trimEnd();
const updatedImport=originalImport.replace('characterWindow}', 'characterWindow,keyActivate}');
change('Correction 2 keyboard helper',e2e,originalImport,updatedImport);
change('Correction 1 Hall limit',trial,'        const level = c.type === "UPGRADE" ? tile.building!.level + 1 : 1;',`        if (c.type !== 'UPGRADE' && typeId === 'retainers-hall' && tile.building?.typeId !== typeId &&
            next.tiles.filter(other=>other.building?.typeId===typeId).length>=2)
          return fail('HALL_LIMIT',"Only two Retainers' Halls may be built per city.");
        const level = c.type === "UPGRADE" ? tile.building!.level + 1 : 1;`);
change('Correction 1 Hall limit','packages/core/src/trial/state.ts',`    return isTileTrialState(raw);`,`    if (tiles.filter(tile=>tile.building?.typeId==='retainers-hall').length>2) return false;
    return isTileTrialState(raw);`);
change('Correction 1 Hall limit','packages/ui/src/TileManagement.svelte',"'FIXED_BUILDING', 'HOME_OCCUPIED', 'ONE_PER_CITY'];","'FIXED_BUILDING', 'HOME_OCCUPIED', 'ONE_PER_CITY', 'HALL_LIMIT'];");
change('Correction 1 Hall limit','packages/ui/src/society-view.ts',`   return {typeId,label:alreadyBuilt?\`\${label} — One per city\`:label,available:!v.reserved&&!alreadyBuilt};`,`   const hallLimit=typeId==='retainers-hall'&&city.tiles.filter(t=>t.building?.typeId===typeId).length>=2&&
    city.tiles.find(t=>t.id===tileId)?.building?.typeId!==typeId;
   return {typeId,label:alreadyBuilt?\`\${label} — One per city\`:hallLimit?"Retainers' Hall — Two per city":label,available:!v.reserved&&!alreadyBuilt&&!hallLimit};`);
const pricing=expected.get(trial).match(/        const homeUpgrade[^\n]*\n        const discount[^\n]*\n        const costLevel[^\n]*\n/)[0];
change('Correction 2 flat home construction',trial,pricing,pricing.replace("c.type === 'UPGRADE' && ",'').replaceAll('homeUpgrade','homeConstruction'));
change('Correction 2 flat home construction',trial,'level===3&&!homeUpgrade?','level===3&&!homeConstruction?');
if(mode==='red'){
 const all=expected.get(e2e);
 const start=all.indexOf('for(const width of [1280,1600])test(');
 assert(start>=0);
 const end=all.indexOf("test('NPC choices",start);
 assert(end>start);
 const red=blob(e2e).replace(originalImport,()=>updatedImport).replace("test('NPC choices",()=>all.slice(start,end)+"test('NPC choices");
 const work=readFileSync(e2e,'utf8');
 assert.equal(work.replaceAll('\r\n','\n'),blob(e2e));
 writeFileSync(e2e,work.includes('\r\n')?red.replaceAll('\n','\r\n'):red);
 console.log('Installed only the two new desktop RED cases and their approved helper import.');
} else if (mode==='apply') {
 for(const [path,next] of expected) {
  const work=readFileSync(path,'utf8');
  if(path!==e2e) assert.equal(work.replaceAll('\r\n','\n'),blob(path),path);
  writeFileSync(path,packet.files[path].checkoutEofBefore==='CRLF'?next.replaceAll('\n','\r\n'):next);
 }
 console.log('Applied the 66 approved existing files and the enumerated corrections.');
} else {
 const additionsOnly=[
 'packages/core/src/trial/__tests__/society-p7b.test.ts',
 'packages/simulation/src/__tests__/tile-trial-p7b.test.ts',
 'packages/ui/src/__tests__/p7b-checkpoint.test.ts',
 'packages/simulation/src/__tests__/fixtures/p7b-path-diff.ts',
 'packages/simulation/src/__tests__/fixtures/p7b-path-diff.txt',
 ];
 for(const item of gen.files) {
  assert.equal(digest(item.before),item.beforeSha256,item.path);
  assert.equal(blob(item.baselinePath),item.before,item.path);
  assert.equal(digest(item.after),item.afterSha256,item.path);
  expected.set(item.path,item.after);
 }
 const final=mode==='head';
 const listed=git('diff','--name-only','-z',base,...(final?['HEAD']:[])).toString('utf8').split('\0').filter(Boolean);
 if(!final) listed.push(...git('ls-files','--others','--exclude-standard','-z').toString('utf8').split('\0').filter(Boolean));
 assert.deepEqual([...new Set(listed)].sort(),[...expected.keys(),...additionsOnly].sort(),'changed-path inventory');
 for(const [path,bytes] of expected) {
  const current=final?git('cat-file','blob','HEAD:'+path).toString('utf8'):readFileSync(path,'utf8');
  const approved=final||!packet.files[path]||packet.files[path].checkoutEofBefore!=='CRLF'?bytes:bytes.replaceAll('\n','\r\n');
  assert.equal(digest(current),digest(approved),path);
 }
 for(const path of additionsOnly.filter(p=>p.endsWith('.test.ts'))) {
  const source=readFileSync(path,'utf8');
  assert.doesNotMatch(source,/\.toMatchObject\(|\.toContain(?:Text)?\(|\.toBeGreaterThan\(|\.toBeLessThan\(/,path);
 }
 console.log(JSON.stringify({ok:true,mode,base,approvedSourceFiles:paths.length,approvedHunks:157,generatedFiles:gen.files.length,listedNewFiles:additionsOnly,additions},null,2));
}
