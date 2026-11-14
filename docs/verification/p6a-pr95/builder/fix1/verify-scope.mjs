import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/',base='f046e36c98fcfbbd16808e759b7b09f0f1f4c98e';
const git=args=>execFileSync('git',args,{encoding:'utf8'});
const before=file=>git(['show',base+':'+file]).replaceAll('\r\n','\n');
const after=file=>fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
const expected=['packages/ui/src/EquipmentView.svelte','packages/ui/src/items-view.ts','packages/ui/src/__tests__/items-view.test.ts','tests/e2e/character-life-navigation.helpers.ts','tests/e2e/items.spec.ts'].sort();
const changed=git(['diff','--name-only',base,'HEAD']).trim().split('\n').sort();
if(JSON.stringify(changed)!==JSON.stringify(expected))throw Error('Review round scope differs');
const a=JSON.parse(fs.readFileSync(root+'fix1/P7-amendment.json','utf8'));
if(before(a.file).replace(a.before,a.after)!==after(a.file))throw Error('Helper changes exceed P7 line');
const unit='packages/ui/src/__tests__/items-view.test.ts';
if(before(unit).replace('Authority 100 · Make room in inventory or temporary storage.','Authority 90+ for 4 weeks · Make room in inventory or temporary storage.')!==after(unit))throw Error('Unit changes exceed approved expectation');
const view='packages/ui/src/items-view.ts';
if(before(view).replace("authority:'Authority 100'","authority:'Authority 90+ for 4 weeks'")!==after(view))throw Error('View changes exceed approved label');
const test='tests/e2e/items.spec.ts',oldTest=before(test),newTest=after(test);
if(!newTest.startsWith(oldTest)||newTest.slice(oldTest.length).match(/\btest\(/g)?.length!==1||!newTest.includes('insideEquipment:true'))throw Error('Earlier item cases changed');
const component='packages/ui/src/EquipmentView.svelte';
for(const label of ['NPC silhouette','Character silhouette']){
 const re=new RegExp('<svg role="img" aria-label="'+label+'"[\\s\\S]*?<\\/svg>');
 if(before(component).match(re)?.[0]!==after(component).match(re)?.[0])throw Error('Accepted silhouette changed');
}
if(before(component).match(/<style>[\s\S]*$/)?.[0]!==after(component).match(/<style>[\s\S]*$/)?.[0])throw Error('Styles changed');
const untouched='packages/ui/src/__tests__/society-view.test.ts';
if(before(untouched)!==after(untouched)||git(['diff',base,'HEAD','--',untouched]).trim())throw Error('society-view.test.ts changed');
const result={HEAD:git(['rev-parse','HEAD']).trim(),tree:git(['rev-parse','HEAD^{tree}']).trim(),base,UTC:new Date().toISOString(),exit:0,changedFiles:changed,p7LineOnly:true,newUnitExpectationOnly:true,earlierItemCasesUnchanged:true,societyViewTestUnchanged:true,silhouettesUnchanged:true,stylesUnchanged:true};
fs.writeFileSync(root+'fix1/scope.json',JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify(result,null,2));
