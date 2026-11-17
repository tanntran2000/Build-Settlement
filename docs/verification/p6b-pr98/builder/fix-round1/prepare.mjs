import fs from 'node:fs';
const root='C:/Users/Admin/.t3/local-drafts/p6b-prC/',out=root+'fix-round1/';
fs.copyFileSync(root+'README.md',out+'previous-builder-readme.md');
fs.copyFileSync(root+'final-summary.json',out+'pre-fix-summary.json');
let runner=fs.readFileSync(root+'run-c3-gates.ps1','utf8')
  .replace("$evidence='C:/Users/Admin/.t3/local-drafts/p6b-prC'", "$evidence='C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1'")
  .replaceAll("'c3-full-smoke'", "'fix-round1-full-smoke'")
  .replace("'C:/Users/Admin/.t3/local-drafts/p6b-prC/measure-bundle.mjs'", "'C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/measure-bundle.mjs'");
if(!runner.includes("$evidence='C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1'"))throw Error('Gate output location did not change');
fs.writeFileSync(out+'run-gates.ps1',runner,'utf8');
const bundle=fs.readFileSync(root+'measure-bundle.mjs','utf8').replace("out='C:/Users/Admin/.t3/local-drafts/p6b-prC'", "out='C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1'");
if(!bundle.includes("out='C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1'"))throw Error('Bundle output location did not change');
fs.writeFileSync(out+'measure-bundle.mjs',bundle,'utf8');
console.log('Fix-round1 runner and bundle outputs isolated; previous README/summary retained.');
