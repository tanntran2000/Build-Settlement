import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const history=path.resolve(root,'fix-round/pre-fix');
if(!history.startsWith(path.resolve(root)+path.sep))throw Error('Unsafe history path');
if(fs.existsSync(history))throw Error('History already exists; preserve it');
fs.mkdirSync(history,{recursive:true});
for(const name of ['README.md','final-summary.json','final-scope.json','edit-inventory.md','edit-inventory.json','immutable-and-inventory.txt','accessibility-summary.json','SHA256SUMS.txt','bundle','screenshots','accessibility']){
 const source=path.join(root,name);if(fs.existsSync(source))fs.cpSync(source,path.join(history,name),{recursive:true});
}
let script=fs.readFileSync(root+'verify-step0.mjs','utf8');
const anchor="  if (implemented) check(normalized(entry.file) === proposed, `Implemented file differs from approved candidate: ${entry.file}`);";
if(script.split(anchor).length!==2)throw Error('Verifier anchor');
script=script.replace(anchor,`  const p11=JSON.parse(fs.readFileSync(path.join(root,'P11-proposal.json'),'utf8'));
  if(entry.file===p11.file){
    check(proposed.split(p11.before).length===2,'P11 original anchor is not unique');
    proposed=proposed.replace(p11.before,p11.after);
  }
  if (implemented) check(normalized(entry.file) === proposed, \`Implemented file differs from approved P1–P11 blocks: \${entry.file}\`);`);
script=script.replace('inventoryBlocks: inventory.edits.length','inventoryBlocks: inventory.edits.length + 1');
fs.writeFileSync(root+'verify-correction9.mjs',script,'utf8');
const plan='C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-9d4a2d6.md';
fs.writeFileSync(root+'fix-round/binding-inputs.json',JSON.stringify({UTC:new Date().toISOString(),plan,sha256:createHash('sha256').update(fs.readFileSync(plan)).digest('hex'),ownerDecisions:['Approve all 4 incl. P11 (Recommended)','Use option D now (Recommended)'],existingTestBlock:'P11-proposal.json'},null,2)+'\n','utf8');
console.log('Preserved historical evidence; created P1–P11 verifier and correction 9 binding metadata.');
