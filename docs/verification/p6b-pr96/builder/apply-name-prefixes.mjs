import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const previousHead='b0c0b37cb25601b69f03b8844ac8a3f957304d4d';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),previousHead);
const file='packages/core/src/data/items.json',original=fs.readFileSync(path.join(repo,file),'utf8'),data=JSON.parse(original);
const baseline=JSON.parse(execFileSync('git',['show','e859177:packages/core/src/data/items.json'],{cwd:repo,encoding:'utf8'}));
const hash=value=>createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');
const oldPin=hash(data.definitions);assert.equal(oldPin,'7d1cc84733e7b5837cb596ea04b558943e8927689f7352fc35ea555e95581635');
const added=Object.keys(data.definitions).filter(id=>!Object.hasOwn(baseline.definitions,id));assert.equal(added.length,32);
const names=added.map(id=>{
 const definition=data.definitions[id];assert.ok(['player','npc'].includes(definition.kind));
 const before=definition.name,after=(definition.kind==='player'?"Lord's ":"Retainer's ")+before;
 definition.name=after;return {id,kind:definition.kind,before,after};
});
assert.equal(new Set(Object.values(data.definitions).map(d=>d.name)).size,Object.keys(data.definitions).length);
const restored=structuredClone(data);for(const row of names)restored.definitions[row.id].name=row.before;assert.deepEqual(restored,JSON.parse(original));
for(const [id,d] of Object.entries(baseline.definitions))if(d.slot)assert.equal(JSON.stringify(data.definitions[id]),JSON.stringify(d));
const newPin=hash(data.definitions),packageData=JSON.parse(fs.readFileSync(path.join(out,'step0-proposed-edits.json'),'utf8'));
const p4=packageData.edits.find(e=>e.id==='P4');assert.ok(p4);assert.ok(p4.after.includes(oldPin));
const after=p4.after.replace(oldPin,newPin),pinPath=path.join(repo,p4.file),pinText=fs.readFileSync(pinPath,'utf8');assert.equal(pinText.split(p4.after).length,2);
const helper='tests/e2e/character-life-navigation.helpers.ts';
const revision={utc:new Date().toISOString(),base:packageData.base,previousHead,owner:'Tân',ownerQuote:"Lord's / Retainer's prefix (Recommended)",plan:'binding-plan-3bee3ae.md',names,previousItemCatalogPin:oldPin,itemCatalogPin:newPin,p4:{...p4,previousAfter:p4.after,after,reason:'Plan correction 3: unique display names for only the 32 new Player/NPC definitions; all prior definitions and other fields unchanged.'},helper:{file:helper,sha256:createHash('sha256').update(fs.readFileSync(path.join(repo,helper))).digest('hex')}};
const bytes=JSON.stringify(data,null,2)+'\n';
fs.writeFileSync(path.join(out,'correction3-candidate-items.json'),bytes,'utf8');
fs.writeFileSync(path.join(out,'correction3-name-edits.json'),JSON.stringify(revision,null,2)+'\n','utf8');
fs.writeFileSync(path.join(repo,file),bytes,'utf8');
fs.writeFileSync(pinPath,pinText.replace(p4.after,after),'utf8');
const tick=String.fromCharCode(96),block=tick.repeat(3);
fs.writeFileSync(path.join(out,'p4-names-pin-revision.md'),[
 '# P4 after-text revision — Plan correction 3','',
 'Owner Tân, 2026-11-15, verbatim: "Lord\'s / Retainer\'s prefix (Recommended)".','',
 `File: ${p4.file}:${p4.line}. This supersedes only P4\'s effective after-text; original Step 0 package files are retained unchanged as historical evidence. P1–P3, P5–P58 and P59 remain exact.`,
 '',`Previous approved after pin: ${oldPin}`,`New after pin: ${newPin}`,'',
 'Base before-text:',block+'ts',p4.before.trimEnd(),block,'','Revised after-text:',block+'ts',after.trimEnd(),block,'',
 'Reason: prefix the 32 new definitions with straight-apostrophe Lord\'s / Retainer\'s names so every item has a unique display name. No other data field changes.',''
 ].join('\n'),'utf8');
const pinsPath=path.join(out,'hash-pin-changes.md'),pins=fs.readFileSync(pinsPath,'utf8');
fs.writeFileSync(pinsPath,pins.replace('All four existing pins match the owner-approved Step 0 candidates exactly.','Three existing pins match Step 0 exactly; ITEM_CATALOG includes the owner-approved Plan correction 3 naming revision.').replace(oldPin,newPin).replace('15 material families and 32 missing wearable ladder definitions |','15 material families, 32 missing wearables, and correction 3 unique Lord\'s / Retainer\'s names |')+`\n## Correction 3 pin history\n\nITEM_CATALOG at ${previousHead}: ${oldPin} → ${newPin}. Only the 32 newly added name fields change. Owner choice, verbatim: "Lord's / Retainer's prefix (Recommended)". Original Step 0 candidates are preserved; correction3-candidate-items.json and correction3-name-edits.json record the approved new data and effective P4 after-text.\n`,'utf8');
console.log(JSON.stringify({renamed:names.length,preservedHistoricalWearables:26,oldPin,newPin,effectiveEdit:'P4 after-text only',helperUnchanged:true},null,2));
