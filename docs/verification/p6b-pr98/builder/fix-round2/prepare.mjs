import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root='C:/Users/Admin/.t3/local-drafts/p6b-prC',out=path.join(root,'fix-round2');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const name of ['README.md','final-summary.json','verify-edit-inventory.mjs'])fs.copyFileSync(path.join(root,name),path.join(out,'previous-'+name));
const approval={status:'approved',owner:'Tân',date:'2026-11-17',quote:'Share it now (Recommended)',
  base:'43fcb9b856c66606230d6d7ba49140ae94cfaa00',parent:'ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37',
  bindingPlan:'binding-plan-c00f9a3.md',bindingPlanSha256:sha(fs.readFileSync(path.join(root,'binding-plan-c00f9a3.md'))),
  additionalAllowedFiles:['packages/simulation/src/tile-trial-week.ts','packages/simulation/src/workshop-operation.ts','packages/simulation/src/index.ts'],
  scope:'Correction 6. One pure shared operation allocator used by End Week and UI. index.ts export only. Existing PR C UI/test files remain allowed. No existing-base-test edits; no golden, fixture, pin or no-order hash change. No push, PR update or merge.'};
fs.writeFileSync(path.join(out,'owner-approval.json'),JSON.stringify(approval,null,2)+'\n','utf8');
let verifier=fs.readFileSync(path.join(root,'verify-edit-inventory.mjs'),'utf8');
verifier=verifier.replace('// Final mode requires a clean committed final head', '// Correction 6: add --round2-approval <fix-round2/owner-approval.json>.\n// Final mode requires a clean committed final head');
verifier=verifier.replace('for (const path of changed) ensure(allowed.has(path)',`if(args.includes('--round2-approval')) {
  ensure(mode==='final','Round 2 is final mode only');
  const approval=JSON.parse(readFileSync(option('--round2-approval'),'utf8'));
  ensure(approval.status==='approved'&&approval.owner==='Tân'&&approval.quote==='Share it now (Recommended)'&&approval.base===base,'Correction 6 owner approval mismatch');
  ensure(sha(readFileSync(join(root,approval.bindingPlan)))===approval.bindingPlanSha256,'Correction 6 binding plan changed');
  const extra=['packages/simulation/src/tile-trial-week.ts','packages/simulation/src/workshop-operation.ts','packages/simulation/src/index.ts'];
  ensure(JSON.stringify(approval.additionalAllowedFiles)===JSON.stringify(extra),'Correction 6 file scope differs');
  for(const file of extra)allowed.add(file);
  const index='packages/simulation/src/index.ts',before=bytesAt(base,index),after=bytesAt('HEAD',index);
  ensure(after.subarray(0,before.length).equals(before)&&after.subarray(before.length).toString('utf8')==='export { resolveWorkshopOperation, type WorkshopTileOperation } from "./workshop-operation.js";\\n','Simulation index must change by this export only');
  console.log('CORRECTION_6: Share it now (Recommended); simulation allocator/week/index export scope approved');
}
for (const path of changed) ensure(allowed.has(path)`);
if(!verifier.includes('CORRECTION_6:'))throw Error('Verifier update failed');
fs.writeFileSync(path.join(root,'verify-edit-inventory.mjs'),verifier,'utf8');
let runner=fs.readFileSync(path.join(root,'fix-round1/run-gates.ps1'),'utf8').replaceAll('fix-round1','fix-round2');
runner=runner.replace("'C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json')", "'C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json','--round2-approval','C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/owner-approval.json')");
fs.writeFileSync(path.join(out,'run-gates.ps1'),runner,'utf8');
fs.writeFileSync(path.join(out,'measure-bundle.mjs'),fs.readFileSync(path.join(root,'fix-round1/measure-bundle.mjs'),'utf8').replaceAll('fix-round1','fix-round2'),'utf8');
fs.appendFileSync(path.join(out,'progress.md'),'\nRED: nine direct-function cases fail because resolveWorkshopOperation is absent; 158 old cases pass. GREEN: 303 tests in three files pass (crafting view, craft-week, item-effects), including unchanged six F1 parity cases and nine no-order hashes. Typecheck passes, no errors/warnings. Initial plan-tool count 335 was a clerical mistake; actual log says 303. No failed GREEN iteration.\n','utf8');
console.log('Correction 6 approval recorded; final verifier/runner/bundle prepared without changing frozen Step 0 proposal.');
