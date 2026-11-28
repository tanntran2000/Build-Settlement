import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const base='13cf5b165c36872d1ac216e4a8a161b79f3fb7c5';
const evidence='C:/Users/Admin/.t3/local-drafts/mansion-r2';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:10_000_000});
const affected=git('diff','--name-only',base,'HEAD').trim().split(/\r?\n/);
const allowedCore=['index.ts','character/purse.ts','data/mansion.json','mansion/effects.ts','mansion/rules.ts','trial/types.ts'].map(path=>'packages/core/src/'+path);
const allowedSim=['character-life-command.ts','crime-week.ts','household-week.ts','mansion-command.ts','mansion-week.ts','order-week.ts','purse-command.ts','purse-week.ts','tile-trial-week.ts','tile-trial.ts','world-npc.ts',
  '__tests__/character-life-command.test.ts','__tests__/mansion-roles.test.ts','__tests__/mansion-week.test.ts',
  '__tests__/npc-acquisition.test.ts','__tests__/npc-life-week.test.ts'].map(path=>'packages/simulation/src/'+path);
const allowedUi=['CharacterLifeCharacters.svelte','CharacterLifeShell.svelte','HomeRobberyCard.svelte','MansionPanel.svelte','PursePanel.svelte','RolePicker.svelte',
  '__tests__/mansion-roles-view.test.ts','mansion-view.ts','purse-view.ts','report-letters.ts','society-view.ts'].map(path=>'packages/ui/src/'+path);
const allowed=new Set([...allowedCore,...allowedSim,...allowedUi,'scripts/money-calibration.ts','scripts/mansion-calibration.ts',
  'tests/e2e/character-life-navigation.helpers.ts','tests/e2e/mansion-roles.spec.ts']);
for(const path of affected) assert(allowed.has(path),path);
const inventory=JSON.parse(readFileSync(evidence+'/STEP0-byte-inventory.json','utf8'));
const paths=[...new Set(inventory.existingByteChanges.map(entry=>entry.path))];
const normalize=text=>text.replaceAll('\r\n','\n');
for(const path of paths) {
 let want=git('show',base+':'+path);
 for(const change of inventory.existingByteChanges.filter(entry=>entry.path===path)) {
   assert.equal(want.split(normalize(change.before.text)).length,2,path);
   want=want.replace(normalize(change.before.text),()=>normalize(change.after.text));
 }
 assert.equal(git('show','HEAD:'+path),want,path);
}
for(const row of inventory.preservedFixtures) {
 assert.equal(git('rev-parse','HEAD:'+row.path).trim(),row.gitBlob,row.path);
}
const diff=git('diff','--no-ext-diff','--unified=2',base,'HEAD','--',...paths);
writeFileSync(evidence+'/delivery/existing-expectations.diff',diff,'utf8');
const newLines=git('diff','--no-ext-diff','--unified=0',base,'HEAD').split('\n').filter(line=>line.startsWith('+')&&!line.startsWith('+++'));
const credential=/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|AKIA[A-Z0-9]{16})/;
assert.equal(newLines.some(line=>credential.test(line)),false,'Credential-like added line');
console.log('HEAD '+git('rev-parse','HEAD').trim());
console.log('Tree '+git('rev-parse','HEAD^{tree}').trim());
console.log(affected.length+' changed files in scope; '+inventory.existingByteChanges.length+
 ' exact test substitutions; '+inventory.preservedFixtures.length+' fixture blobs identical; no credential-pattern matches in additions.');

