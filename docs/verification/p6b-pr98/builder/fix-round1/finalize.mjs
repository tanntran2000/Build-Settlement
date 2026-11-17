import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(out);
const head='ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37',parent='09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f',base='43fcb9b856c66606230d6d7ba49140ae94cfaa00';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const read=(dir,name)=>fs.readFileSync(path.join(dir,name),'utf8');
const write=(dir,name,value)=>fs.writeFileSync(path.join(dir,name),value,'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ensure=(value,message)=>{if(!value)throw Error(message);};
const link=(dir,name,label=name)=>`[${label}](${path.join(dir,name).replaceAll('\\','/')})`;
const tree=git('rev-parse','HEAD^{tree}');
ensure(git('rev-parse','HEAD')===head&&!git('status','--porcelain=v1'),'Final head/status mismatch');
const results=JSON.parse(read(out,'c3-results.json'));
const required=['gate1-diff-check','gate2-lint','gate3-typecheck','gate4-check-architecture','gate5-test-architecture','gate6-unit','gate7-build','c3-smoke-ci1','bundle-measurement','c3-final-inventory-immutable'];
for(const name of required)ensure(results.some(r=>r.name===name&&r.exit===0&&r.head===head&&r.tree===tree),`Missing final-head pass: ${name}`);
ensure(results.every(r=>r.exit===0),'A final command failed');
const strip=s=>s.replace(/\x1b\[[0-9;]*m/g,'');
const units=Number(strip(read(out,'gate6-unit.txt')).match(/Tests\s+(\d+) passed/)[1]);
const smoke=Number([...strip(read(out,'c3-smoke-ci1.txt')).matchAll(/(\d+) passed \(/g)].at(-1)[1]);
ensure(units===2926&&smoke===387,'Unexpected final test totals');
ensure(read(out,'c3-smoke-ci1.txt').includes('CI=1'),'CI=1 missing');
const cpu=Number(read(out,'c3-quiet-machine.txt').split('\n').find(line=>line.includes('Intel(R)')).match(/\s(\d+)\s+\d+\s*$/)[1]);
const bundle=JSON.parse(read(out,'bundle-results.json'));
ensure(bundle.head===head&&bundle.tree===tree&&bundle.under200KB,'Bundle head/budget mismatch');
const fixPaths=git('diff','--name-only',`${parent}..HEAD`).split('\n');
const expected=['packages/ui/src/WorkshopPanel.svelte','packages/ui/src/__tests__/crafting-view.test.ts','packages/ui/src/items-view.ts','tests/e2e/crafting.spec.ts'].sort();
ensure(JSON.stringify(fixPaths.slice().sort())===JSON.stringify(expected),'Fix exceeded the four allowed files');
const allPaths=git('diff','--name-only',`${base}...HEAD`).split('\n');
ensure(allPaths.length===11,'PR changed path count mismatch');
const unchangedPackages=['core','simulation','persistence'].map(name=>{
  const before=git('rev-parse',`${base}:packages/${name}`),after=git('rev-parse',`HEAD:packages/${name}`);
  ensure(before===after,`${name} tree changed`);return {name,baseTree:before,headTree:after};
});
const proposal=JSON.parse(read(root,'step0-proposed-edits.json')),approval=JSON.parse(read(root,'owner-approval.json'));
ensure(sha(fs.readFileSync(path.join(root,'step0-proposed-edits.json')))===approval.proposalSha256,'Approved package changed');
const inventory={base,parent,head,tree,approvedProposalSha256:approval.proposalSha256,approvedEdits:6,changedPathCount:11,fixPaths,allPaths,unchangedPackages,existingTestEdits:proposal.existingTestEdits,outsideAllowlistEdits:proposal.outsideAllowlistEdits};
write(out,'edit-inventory.json',JSON.stringify(inventory,null,2)+'\n');
write(root,'edit-inventory.json',JSON.stringify(inventory,null,2)+'\n');
const inventoryText=['# PR C edit inventory — fix round 1','',`Head \`${head}\`; tree \`${tree}\`; base \`${base}\`; fix parent \`${parent}\`.`,
  '', '**Six original approved edits remain exact:** P1–P3 in the helper; X1–X3 as three lines in two extra product files. No further existing-base-test edit. All 86 protected paths unchanged. Core/simulation/persistence subtree hashes equal base.',
  '', '**Fix commit: four files only.** The two test files were introduced by this PR. Their new cases cover operation parity; the normal-capacity unit fixture now explicitly supplies Herbs so its existing capacity assertions still describe an operating Hospital.',
  '', '| Fix path |','|---|',...fixPaths.map(p=>`| \`${p}\` |`),'', '**Entire PR: eleven changed paths.**',...allPaths.map(p=>`- \`${p}\``),
  '',`Final verification: ${link(out,'c3-final-inventory-immutable.txt')}. Reproduce from assigned worktree: \`node ${path.join(root,'verify-edit-inventory.mjs').replaceAll('\\','/')} --mode final --approval ${path.join(root,'owner-approval.json').replaceAll('\\','/')}\`.`, ''].join('\n');
write(out,'edit-inventory.md',inventoryText);write(root,'edit-inventory.md',inventoryText);
const run=results.find(r=>r.name==='c3-smoke-ci1');
const audits=fs.readdirSync(path.join(root,'accessibility')).filter(name=>name.endsWith('.json')).sort().map(name=>{
  const file=path.join(root,'accessibility',name),data=JSON.parse(fs.readFileSync(file,'utf8')),mtime=fs.statSync(file).mtimeMs;
  ensure(mtime>=Date.parse(run.startUtc)&&mtime<=Date.parse(run.endUtc)+1000,`Stale audit: ${name}`);
  ensure(!data.overflow&&!data.clipped.length&&!data.texts.some(t=>t.ratio+.01<t.required||t.size<14)&&!data.controls.some(c=>c.width<24||c.height<24||c.left<-.5||c.right>data.viewport+.5),`Audit failure: ${name}`);
  return {file:`accessibility/${name}`,viewport:data.viewport,textRuns:data.texts.length,controls:data.controls.length,sha256:sha(fs.readFileSync(file))};
});
ensure(audits.length===14,'Accessibility raw artifact count mismatch');
const auditSummary={head,tree,smokeRun:run,measurements:audits};
write(root,'accessibility-summary.json',JSON.stringify(auditSummary,null,2)+'\n');
write(root,'accessibility-summary.md',`# PR C accessibility — fix round 1\n\nHead \`${head}\`; tree \`${tree}\`. Fourteen raw measurements refreshed in the final-head CI=1 full smoke: all desktop panels at 1280/1600 and new-panel reflow at 320/375. All recorded contrast, text-size, control-size, clipping, overflow and keyboard assertions pass. Existing 320/375 suites also pass. No threshold or timeout changed.\n`);
for(const name of ['smithy-queue','brew-tab','drug-store-brew','quartermaster-rows','steward-quartermaster']){
  const file=path.join(root,'screenshots',`${name}-1280.png`),b=fs.readFileSync(file),mtime=fs.statSync(file).mtimeMs;
  ensure(b.readUInt32BE(16)===1280&&b.readUInt32BE(20)===1000,'Screenshot dimensions mismatch');
  ensure(mtime>=Date.parse(run.startUtc)&&mtime<=Date.parse(run.endUtc)+1000,`Stale screenshot: ${name}`);
}
const summary={base,parent,head,tree,pr:'https://github.com/tanntran2000/Build-Settlement/pull/98',fixCommit:head,cpuAtGateStartPercent:cpu,units,unitFiles:127,architectureTests:154,smoke,ci:1,approvedEdits:6,changedPaths:11,fixChangedPaths:4,immutablePaths:86,immutableChanges:[],unchangedPackages,bundle,results,builderPushed:false,review:'Astra round 1 FAIL at parent; F1 fixed locally, re-review pending'};
write(out,'final-summary.json',JSON.stringify(summary,null,2)+'\n');write(root,'final-summary.json',JSON.stringify(summary,null,2)+'\n');
const gateTable=['| Gate | Result | Seconds | Log |','|---|---|---:|---|',...results.filter(r=>required.includes(r.name)).map(r=>`| ${r.name} | PASS, exit 0 | ${r.seconds} | ${link(out,r.name+'.txt')} |`)].join('\n');
const readme=['# PR #98 — Builder fix round 1','', '**F1 fixed locally. Final local gates pass; ready for Astra re-review. No push, PR update or merge.**',
  '',`HEAD \`${head}\`; tree \`${tree}\`; branch \`feat/p6b-crafting-ui\`; fix parent \`${parent}\`; original PR base \`${base}\`. Clean status, ports 4173/4174 free.`,
  '',`Commit: **fix(ui): weekly craft capacity follows operating rules**, ending \`Co-authored-by: Codex <noreply@openai.com>\`. Four changed files in this commit; entire PR remains eleven paths.`,
  '', '## Finding and fix','',`Astra round 1 at parent: FAIL, one P2 F1 only. ${link(root,'astra-review/review.md','Original review')}. Weekly counts ignored funded operation and Hospital Herbs; explanatory caveats did not satisfy parity.`,
  '', 'Workshop forecast now returns zero and an English reason for unpaid upkeep / insufficient Herbs. It credits guaranteed tax and law income before tile-order funding, includes Farm batch debits, produces funded Herbs before tile-order Hospital consumption, then applies existing staffing and effective-skill capacity. It reads state only. Shared authorityTaxBps, lawTerms, effectiveSkills and TRIAL data are reused; the private simulation prelude ordering is projected inside the existing UI allowlist. No core/simulation/persistence change, no clock/RNG, and D2 placement eligibility is unchanged.',
  '', '## RED and GREEN','',`- RED: ${link(root,'f1-red-unit-full.txt')} — 15 new failures / 143 passes; ${link(root,'f1-red-e2e.txt')} — panel 1-of-2 differs from actual no-Herbs End Week zero.`,
  `- GREEN: ${link(root,'f1-green-unit-valid-meadow.txt')} — 326 compatibility units; ${link(root,'f1-green-e2e.txt')} — 17/17 crafting e2e; ${link(root,'f1-ui-typecheck.txt')} — 0 errors/warnings.`,
  '- Six unit scenarios compare forecast against actual dispatcher End Week with six queued orders and unchanged input. They cover no Herbs, supplied Hospital, same-week Herb output, unfunded Hospital and funded/unfunded Drug Store. Other tests cover tile-order Herb allocation and tax funding from zero opening Gold.',
  '- Initial GREEN found the new Herb Garden fixture still locked behind Ring 1; corrected its setup to Ring 2. Existing normal-capacity assertions are unchanged, with explicit Herbs in their healthy fixture. No existing-base-test assertion, timeout or threshold was changed.',
  '', '## Exact-head final gates','',`CPU at start **${cpu}%**; ${link(out,'c3-quiet-machine.txt','CPU and top processes')}. One runner only, no competing test/build job detected.`, '',gateTable,
  '',`**${units} units / 127 files; 154 architecture tests; ${smoke}/${smoke} full smoke cases with CI=1, first run PASS.** No final gate retry, smoke rerun or timeout. CI echo and full smoke ran in the same shell. ${link(out,'c3-ci-environment.txt')}.`,
  '', '## Scope, artifacts and checksums','',`Six approved P1–P3/X1–X3 edits remain exact. All 86 protected paths and all existing-base test/helper files pass final verification; core/simulation/persistence subtree hashes equal base. ${link(root,'edit-inventory.md')} and ${link(out,'c3-final-inventory-immutable.txt')}. Frozen approval SHA ff0bf9a602286768e96c007e27c679e67660d92ec6b152a3746a021f5773014b is unchanged.`,
  '',`Bundle gzip: JS **${bundle.totalsGzipBytes.JS} bytes**, CSS **${bundle.totalsGzipBytes.CSS} bytes**, combined **${bundle.combinedGzipBytes} bytes < 200000**. Main supplied baseline: JS 132.14 / CSS 6.74 kB. Deltas: ${bundle.deltaBytesAgainstReportedMain.JS} / ${bundle.deltaBytesAgainstReportedMain.CSS} bytes. ${link(out,'measure-bundle.mjs','Script')} · ${link(out,'bundle-results.json','Raw per-file measurements')} · raw JS/CSS and nested manifest under fix-round1/bundle-artifacts/.`,
  '', 'Five actual 1280×1000 screenshots under screenshots/ and all fourteen accessibility JSON audits were refreshed in the final full smoke. No screenshots-only CSS. Original screenshot filenames are retained; their bytes reflect the new head. The 35 legacy P6-A artifacts were backed up/restored byte-identically using the separate fix-round1-full-smoke label.',
  '',`All evidence is UTF-8. Top-level ${link(root,'SHA256SUMS.txt')} covers every file except itself, including nested manifests and the unmodified Astra review package. ${link(out,'finalize-checksums.ps1','Checksum procedure')} freezes the transcript then refreshes/rechecks coverage. Historical original gate/bundle logs are preserved; prior Builder README/summary are in fix-round1/previous-builder-readme.md and pre-fix-summary.json.`,
  '', 'Original owner decisions remain verbatim in owner-approval.json and binding-plan-6ff7e4f.md: Tân, 2026-11-15, "Giao Builder C"; "Approve P1–P3 and X1–X3 (Recommended)". This correction was requested by the Orchestrator as an existing spec-parity fix requiring no owner decision. Independent verdict at the new local head remains pending. No docs file on the product branch; committed WP docs evidence is still required before G5.', ''].join('\n');
write(out,'README.md',readme);write(root,'README.md',readme);
write(root,'hash-pin-changes.md',`# PR C hash-pin changes — fix round 1\n\nNone. At head \`${head}\`, all 86 protected golden/fixture/data/pin files remain byte-identical to base \`${base}\`. Core, simulation and persistence subtree hashes also equal base. No golden/fixture regenerated. Full byte/SHA inventory: immutable-baseline.json; final-mode verification: fix-round1/c3-final-inventory-immutable.txt.\n`);
write(root,'LOCAL-ONLY.md',`# Local-only artifacts\n\nPlaywright temporary output/traces stay in the assigned worktree's test-results/ folder, outside this evidence package. Later runs replace temporary output; RED/GREEN logs are retained here.\n\nLegacy items.spec.ts artifact originals for this fix were backed up under C:/Users/Admin/.t3/local-drafts/p6b-prC-local-only/legacy-original-fix-round1-full-smoke/; generated replacements are retained under legacy-generated-fix-round1-full-smoke/. All 35 originals were restored byte-identically. See fix-round1/c3-legacy-before.txt and c3-legacy-after.txt plus the external legacy-before/after-fix-round1-full-smoke.json manifests. Original c3-full-smoke backups are historical and retained.\n\nNo new worktree/clone or dependency install. Assigned worktree retained for review; storage reclaimed: 0.\n`);
const shotNames=['smithy-queue','brew-tab','drug-store-brew','quartermaster-rows','steward-quartermaster'];
const titles=['Smithy queue','Hospital Brew tab','Drug Store Brew tab','Quartermaster ledger','Steward overview'];
const current=bundle.combinedGzipBytes/1000,main=132.14+6.74;
write(root,'screenshot-gallery.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px/1.5 var(--font-sans,system-ui);color:var(--foreground)}figure{margin:0 0 20px}figcaption{font-weight:650;margin-bottom:8px}img{width:100%;height:auto;border-radius:8px}details{margin:12px 0}summary{cursor:pointer;min-height:32px}svg{width:100%;height:150px}.note{color:var(--muted-foreground)}text{fill:currentColor;font:14px var(--font-sans,system-ui)}@media(max-width:500px){svg text{font-size:26px}}</style><figure><figcaption>Production gzip · ${current.toFixed(2)} kB combined / 200 kB budget</figcaption><svg viewBox="0 0 700 136" role="img" aria-label="Main ${main.toFixed(2)} kilobytes; fix round 1 ${current.toFixed(2)} kilobytes; budget 200 kilobytes"><text x="0" y="23">Main</text><rect x="110" y="4" width="${main/200*430}" height="28" fill="var(--chart-1)"/><text x="550" y="23">${main.toFixed(2)} kB</text><text x="0" y="69">Fix R1</text><rect x="110" y="50" width="${current/200*430}" height="28" fill="var(--chart-2)"/><text x="550" y="69">${current.toFixed(2)} kB</text><path d="M110 94H540" stroke="currentColor"/><text x="110" y="119">0</text><text x="495" y="119">200 kB</text></svg><p class="note">JS ${(bundle.totalsGzipBytes.JS/1000).toFixed(2)} kB · CSS ${(bundle.totalsGzipBytes.CSS/1000).toFixed(2)} kB. Baseline uses supplied rounded main figures.</p></figure>${shotNames.map((name,index)=>`<details${index===0?' open':''}><summary>${titles[index]} · 1280px</summary><img alt="${titles[index]} at 1280 pixels" src="${path.join(root,'screenshots',name+'-1280.png').replaceAll('\\','/')}"></details>`).join('')}</html>`);
write(out,'runtime-state.json',JSON.stringify({phase:'All local checks passed; evidence generated',head,tree,units,smoke,execSessionId:null,builderPushed:false,remaining:'Checksum verification and final handoff; no PR update/push/merge.'},null,2)+'\n');
write(root,'runtime-state.json',JSON.stringify({phase:'Fix-round1 runtime checks complete',head,tree,units,smoke,builderPushed:false,details:'fix-round1/final-summary.json'},null,2)+'\n');
fs.appendFileSync(path.join(out,'progress.md'),`\nFinal runtime checks PASS at ${new Date().toISOString()}: ${units} units, 154 architecture, ${smoke} smoke, CPU ${cpu}%, no retry/timeout. Clean head ${head}; ports free. Bundle and all 86 immutable paths pass. Final evidence generated; checksum freeze/verification next.\n`,'utf8');
console.log(JSON.stringify({head,tree,cpu,units,smoke,fixPaths,combinedGzipBytes:bundle.combinedGzipBytes},null,2));
