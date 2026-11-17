import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const base='43fcb9b856c66606230d6d7ba49140ae94cfaa00';
const expectedHead='09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const json=name=>JSON.parse(read(name));
const write=(name,value)=>fs.writeFileSync(path.join(root,name),value,'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ensure=(value,message)=>{if(!value)throw Error(message);};
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
ensure(head===expectedHead&&!git('status','--porcelain=v1'),'Final head must be clean and exact');
const results=json('c3-results.json');
const required=['gate1-diff-check','gate2-lint','gate3-typecheck','gate4-check-architecture','gate5-test-architecture','gate6-unit','gate7-build','c3-smoke-ci1','bundle-measurement','c3-final-inventory-immutable'];
for(const name of required)ensure(results.some(r=>r.name===name&&r.exit===0&&r.head===head&&r.tree===tree),`Missing exact-head PASS: ${name}`);
ensure(results.every(r=>r.exit===0&&r.head===head&&r.tree===tree),'A C3 command did not pass at the final head');
const strip=text=>text.replace(/\x1b\[[0-9;]*m/g,'');
const unit=Number(strip(read('gate6-unit.txt')).match(/Tests\s+(\d+) passed/)[1]);
const smoke=Number([...strip(read('c3-smoke-ci1.txt')).matchAll(/(\d+) passed \(/g)].at(-1)[1]);
ensure(unit===2911&&smoke===386,`Unexpected totals: ${unit} units, ${smoke} smoke`);
ensure(read('c3-smoke-ci1.txt').includes('CI=1'),'Smoke log must show CI=1');
const bundle=json('bundle-results.json');
ensure(bundle.head===head&&bundle.tree===tree&&bundle.under200KB,'Bundle identity/budget mismatch');
const proposal=json('step0-proposed-edits.json'),approval=json('owner-approval.json');
ensure(sha(fs.readFileSync(path.join(root,'step0-proposed-edits.json')))===approval.proposalSha256,'Frozen proposal changed');
const baseline=json('immutable-baseline.json');
const changed=git('diff','--name-only',`${base}...HEAD`).split('\n');
const c1='75ccc69faaf40102ad217f22debf555c508be0b8';
const c1Paths=new Set(git('diff','--name-only',`${base}...${c1}`).split('\n'));
const c2Paths=new Set(git('diff','--name-only',`${c1}...HEAD`).split('\n'));
const inventory={base,head,tree,approvedProposalSha256:approval.proposalSha256,
  approvedExistingTestEdits:proposal.existingTestEdits,approvedOutsideAllowlistEdits:proposal.outsideAllowlistEdits,
  existingEditCount:6,changedPathCount:changed.length,paths:changed.map(file=>({path:file,tasks:[c1Paths.has(file)&&'C1',c2Paths.has(file)&&'C2'].filter(Boolean),headBlob:git('rev-parse',`HEAD:${file}`)}))};
ensure(changed.length===11,'Expected exactly 11 changed product/test paths');
write('edit-inventory.json',JSON.stringify(inventory,null,2)+'\n');
write('edit-inventory.md',[
  '# PR C final edit inventory','',`Head: \`${head}\`; tree: \`${tree}\`; base: \`${base}\`.`,
  '',`Exactly **6 approved edits**: P1–P3 in the existing e2e helper and X1–X3 as 3 product lines in 2 extra files. **11 changed paths** overall. No other existing test edit. The exact literal blocks remain in step0-proposed-edits.md/.json, SHA256 \`${approval.proposalSha256}\`.`,
  '', '| Path | Task |', '|---|---|',...inventory.paths.map(row=>`| \`${row.path}\` | ${row.tasks.join(', ')} |`),
  '', 'Final verifier: `node verify-edit-inventory.mjs --mode final --approval owner-approval.json` from the assigned worktree. It requires clean committed HEAD and exact approval; verifies all 155 pre-existing test files plus the helper; groups X2/X3 for whole-file equality; rejects unlisted paths and compares all 86 immutable paths. See c3-final-inventory-immutable.txt, exit 0.','',
].join('\n'));
write('hash-pin-changes.md',[
  '# PR C hash-pin changes','', '**None.** Old → new is byte-identical for every protected pin source, core JSON data, fixture and golden path.',
  '',`Base \`${base}\` → head \`${head}\`. Protected set: ${baseline.entries.length} paths. Expected and actual changed path set: \`[]\`. No golden/fixture regeneration occurred.`,
  '', '| Protected pin source | Old SHA256 = new SHA256 |','|---|---|',
  ...baseline.entries.filter(e=>e.groups.includes('pin/snapshot source')).map(e=>`| \`${e.path}\` | \`${e.sha256}\` |`),
  '', 'The complete 86-path Git-blob/byte/SHA256 inventory is immutable-baseline.json. Final verification independently reads the base and final Git blobs. The core catalog/recipe pins and all 60-week no-order report/item/city hash literals remain unchanged.','',
].join('\n'));
const smokeRun=results.find(r=>r.name==='c3-smoke-ci1');
const auditFiles=fs.readdirSync(path.join(root,'accessibility')).filter(n=>n.endsWith('.json')).sort();
ensure(auditFiles.length===14,'Expected 14 raw accessibility measurements');
const audit=auditFiles.map(name=>{
  const file=path.join(root,'accessibility',name),data=JSON.parse(fs.readFileSync(file,'utf8')),mtime=fs.statSync(file).mtimeMs;
  ensure(mtime>=Date.parse(smokeRun.startUtc)&&mtime<=Date.parse(smokeRun.endUtc)+1000,`Audit was not refreshed in final smoke: ${name}`);
  const failures=[...data.clipped,...data.texts.filter(t=>t.ratio+.01<t.required||t.size<14).map(t=>t.text),...data.controls.filter(c=>c.width<24||c.height<24||c.left<-.5||c.right>data.viewport+.5).map(c=>c.text)];
  ensure(!data.overflow&&!failures.length,`Accessibility failure: ${name}`);
  return {file:`accessibility/${name}`,viewport:data.viewport,textRuns:data.texts.length,controls:data.controls.length,minActiveContrast:Math.min(...data.texts.filter(t=>t.required===4.5).map(t=>t.ratio)),failures,sha256:sha(fs.readFileSync(file))};
});
write('accessibility-summary.json',JSON.stringify({head,tree,finalSmoke:smokeRun,thresholds:{activeContrast:4.5,inactiveContrast:3,minTextPx:14,minControlPx:24,minFocusOutlinePx:2},measurements:audit},null,2)+'\n');
write('accessibility-summary.md',[
  '# PR C accessibility and screenshots','',`Final tested head \`${head}\`; tree \`${tree}\`. All raw measurements and screenshots were regenerated by the full CI=1 smoke at this head.`,
  '', '**PASS:** Smithy queue, Hospital Brew, Drug Store Brew and Quartermaster rows at 1280/1600; Smithy/Brew/report reflow at 320/375. Existing 320/375 suites also passed in the full smoke.',
  '', 'Unchanged measured requirements: active text contrast ≥4.5; inactive ≥3; text ≥14px; controls ≥24px; no clipping/page overflow; keyboard focus outline ≥2px. Actual Tab traversal checks focus and hidden ancestors. Buy/Brew uses roving tabs; inactive tab is reached with arrow keys. The 1280/1600 output ledger also keeps Destination on one line.',
  '', '| Raw measurement | Viewport | Text runs | Controls | Result |','|---|---:|---:|---:|---|',...audit.map(r=>`| ${r.file} | ${r.viewport} | ${r.textRuns} | ${r.controls} | PASS |`),
  '', 'PNG screenshots are actual 1280×1000 browser viewports, without screenshot-only CSS. See screenshots/ and screenshot-gallery.html. The report images separately show the Steward overview and complete Quartermaster output/idle ledger.','',
].join('\n'));
const shots=['smithy-queue','brew-tab','drug-store-brew','quartermaster-rows','steward-quartermaster'];
for(const shot of shots){const file=path.join(root,'screenshots',`${shot}-1280.png`),bytes=fs.readFileSync(file),mtime=fs.statSync(file).mtimeMs;ensure(bytes.readUInt32BE(16)===1280&&bytes.readUInt32BE(20)===1000,`Wrong screenshot viewport: ${shot}`);ensure(mtime>=Date.parse(smokeRun.startUtc)&&mtime<=Date.parse(smokeRun.endUtc)+1000,`Screenshot not final-head: ${shot}`);}
const names=['Smithy queue','Hospital Brew tab','Drug Store Brew tab','Quartermaster output and idle ledger','Steward letter overview'];
const combinedBefore=132.14+6.74,combinedAfter=bundle.combinedGzipBytes/1000;
write('screenshot-gallery.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px/1.5 var(--font-sans,system-ui);color:var(--foreground)}figure{margin:0 0 20px}figcaption{font-weight:650;margin-bottom:8px}img{width:100%;height:auto;border-radius:8px}details{margin:12px 0}summary{cursor:pointer;min-height:32px}svg{width:100%;height:150px}.note{color:var(--muted-foreground)}text{fill:currentColor;font:14px var(--font-sans,system-ui)}@media(max-width:500px){svg text{font-size:26px}}</style><figure><figcaption>Production gzip · ${combinedAfter.toFixed(2)} kB combined / 200 kB budget</figcaption><svg viewBox="0 0 700 136" role="img" aria-label="Combined JS and CSS gzip: main ${combinedBefore.toFixed(2)} kilobytes; PR C ${combinedAfter.toFixed(2)} kilobytes; budget 200 kilobytes"><text x="0" y="23">Main</text><rect x="110" y="4" width="${combinedBefore/200*430}" height="28" fill="var(--chart-1)"/><text x="550" y="23">${combinedBefore.toFixed(2)} kB</text><text x="0" y="69">PR C</text><rect x="110" y="50" width="${combinedAfter/200*430}" height="28" fill="var(--chart-2)"/><text x="550" y="69">${combinedAfter.toFixed(2)} kB</text><path d="M110 94H540" stroke="currentColor"/><text x="110" y="119">0</text><text x="495" y="119">200 kB</text></svg><p class="note">JS ${(bundle.totalsGzipBytes.JS/1000).toFixed(2)} kB · CSS ${(bundle.totalsGzipBytes.CSS/1000).toFixed(2)} kB. Main baseline uses the supplied rounded figures.</p></figure>${shots.map((shot,i)=>`<details${i===0?' open':''}><summary>${names[i]} · 1280px</summary><img alt="${names[i]} at 1280 pixels" src="${path.join(root,'screenshots',`${shot}-1280.png`).replaceAll('\\','/')}"></details>`).join('')}</html>`);
const local='C:/Users/Admin/.t3/local-drafts/p6b-prC-local-only';
write('LOCAL-ONLY.md',[
  '# Local-only artifacts','',`No Playwright trace is copied into this evidence directory. The runner uses the repository's existing retain-on-failure policy under \`${process.cwd().replaceAll('\\','/')}/test-results/\`; later test runs replace that temporary output. RED logs are retained here.`,
  '',`Legacy items.spec.ts writes to local-drafts/p6a-prC. Before the final smoke, its originals were backed up under \`${local}/legacy-original-c3-full-smoke/\`. Generated replacements were retained under \`${local}/legacy-generated-c3-full-smoke/\`, then all originals were restored byte-identically. See c3-legacy-before.txt/c3-legacy-after.txt and external legacy-before/after-c3-full-smoke.json manifests. Those copies are outside the PR C evidence package.`,
  '', 'No dependency install, additional worktree or clone. The assigned worktree is retained for Claude/Tester/Astra review. No storage cleanup or reclamation performed.','',
].join('\n'));
const gateTable=['| Gate | Result | Seconds | Log |','|---|---|---:|---|',...results.filter(r=>required.includes(r.name)).map(r=>`| ${r.name} | PASS (exit ${r.exit}) | ${r.seconds} | ${r.name}.txt |`)].join('\n');
const summary={head,tree,base,commits:[c1,head],status:'CLEAN',cpuAtGateStartPercent:3,units:unit,unitFiles:127,architectureTests:154,smoke,ci:1,approvedEdits:6,changedPaths:11,immutablePaths:86,immutableChanges:[],bundle,results};
write('final-summary.json',JSON.stringify(summary,null,2)+'\n');
write('README.md',[
  '# P6-B PR C — Builder evidence','', '**C1–C3 complete. Local branch ready for Claude/Tester and Astra review. No push, PR or merge.**',
  '',`Tested HEAD: \`${head}\`. Tree: \`${tree}\`. Base: \`${base}\` (merged PR B #97). Branch: \`feat/p6b-crafting-ui\`. Status empty. Ports 4173/4174 free. Builder Codex, 2026-11-15.`,
  '', 'Owner decisions, verbatim:', '', '1. Tân, 2026-11-15: "Giao Builder C".', '2. Tân, 2026-11-15: "Approve P1–P3 and X1–X3 (Recommended)".',
  '',`Approval covers the exact frozen step0-proposed-edits.json SHA256 \`${approval.proposalSha256}\`; recorded in owner-approval.json. Binding plan: binding-plan-6ff7e4f.md, correction 5; spec: binding-spec-cd1b18a.md.`,
  '', '## Commits and behaviour','',`- \`${c1}\` — feat(ui): workshop panel and brewing.`, `- \`${head}\` — feat(ui): crafting hints and report rows.`, '- Both commits end with `Co-authored-by: Codex <noreply@openai.com>`. Smithy recipes/cards, queue/capacity, held fee, Cancel and ready outputs; Hospital/Drug Store Buy/Brew tabs; keyboard/focus paths; material hints; complete conditional Quartermaster tables and strict visible parser.',
  '', 'Design ruling: crafting reports use full-width letters to keep the output table readable at PC widths. This costs vertical scrolling; legacy report layout and letter order remain. No unresolved blocker/deferred minor in the author self-review. Independent review remains pending.',
  '', '## RED and GREEN','', '| Task | RED before product edits | GREEN |','|---|---|---|',
  '| C1 | 64 new unit failures; valid-fixture e2e 4 missing-UI failures | 64 new units; 232 units with old item/report compatibility; 4/4 e2e |',
  '| C2 | 78 unit failures / 65 passes; corrected-modal e2e 6 missing hint/report failures / 6 panel passes; additional PC header RED 2 failures | 311 compatibility units; 16/16 e2e including readability, 1280/1600 audit, 320/375 reflow and parser; UI typecheck 0 errors/warnings |',
  '', 'All original runs are retained, including the new fixture workforce correction, roving-tab test correction, keyboard-modality probe correction and material-versus-wearable oracle correction. No existing assertion value, threshold or timeout was loosened. No test timeout occurred in task or final runs. See progress.md and c1-*/c2-*.txt for full commands, outputs, exits and UTC.',
  '', '## Scope and immutability','', '**6 approved edits; 11 changed paths.** P1–P3 only in the existing e2e helper; X1–X3 only in the two extra product files. See edit-inventory.md/.json and the frozen literal proposal. Final verifier PASS: all 155 existing test files plus the helper, exact restricted-file bytes and 86 immutable paths. Golden/fixture/pin changed set `[]`; no regeneration. See c3-final-inventory-immutable.txt, immutable-baseline.json and hash-pin-changes.md.',
  '', '## Final quiet-machine gates','', 'Gate-start CPU load **3%**, 8 logical processors. Full CPU/top-process/current-process counters and empty competing test/build job list are in c3-quiet-machine.txt and each gate header. One runner at a time; no delegated review job. Tested HEAD/tree above on every result.',
  '',gateTable,'',`Totals: **${unit} unit tests / 127 files**, **154 architecture tests**, **${smoke} full smoke cases, CI=1**, all pass. Gates 1–7 ran in order; CI echo and CI=1 smoke ran in the same PowerShell process. No smoke rerun, failed smoke case, timeout measurement or gate retry was required.`,
  '', '## Bundle, accessibility and owner screenshots','',`Production gzip: **JS ${(bundle.totalsGzipBytes.JS/1000).toFixed(2)} kB**, **CSS ${(bundle.totalsGzipBytes.CSS/1000).toFixed(2)} kB**, combined **${combinedAfter.toFixed(2)} kB < 200 kB**. Reported main baseline: JS 132.14 / CSS 6.74 kB; byte deltas ${bundle.deltaBytesAgainstReportedMain.JS} JS / ${bundle.deltaBytesAgainstReportedMain.CSS} CSS. Baseline is the supplied rounded report, not a new build of main. Script measure-bundle.mjs; full per-file bytes/gzip/SHA in bundle-results.json; raw JS/CSS under bundle-artifacts/ with nested SHA256SUMS.txt.`,
  '', 'Accessibility: 14 raw measurements in accessibility/, summarized in accessibility-summary.md/.json; every new desktop panel at 1280/1600 and new-panel reflow at 320/375 passed. Five actual 1280×1000 screenshots under screenshots/: smithy-queue, brew-tab, drug-store-brew, quartermaster-rows, steward-quartermaster. See screenshot-gallery.html for a preview. All refreshed in the final-head full smoke.',
  '', '## Reproduce and verify','', 'From the assigned worktree:', '', '```powershell', `node ${root.replaceAll('\\','/')}/verify-edit-inventory.mjs --mode final --approval ${root.replaceAll('\\','/')}/owner-approval.json`, `node ${root.replaceAll('\\','/')}/refresh-sha256.mjs --verify`, '```',
  '', 'run-c3-gates.ps1 records the actual gate procedure and requires -ExpectedHead. Do not repeat the legacy-backup label without preserving its existing backup. All local evidence is UTF-8. SHA256SUMS.txt covers every file except itself, including nested manifests; independent sha256sum -c verification is recorded after finalization. See LOCAL-ONLY.md for trace/output and legacy artifact locations.',
  '', 'No docs/ file is on the product branch. This local package must later be committed on the WP docs branch with exact-head evidence and independent verdicts under AGENTS.md §6 before G5. The assigned worktree remains for review; no cleanup/reclaimed storage.','',
].join('\n'));
fs.appendFileSync(path.join(root,'progress.md'),`\n- C3 complete at ${new Date().toISOString()}: gates 1–7 exit 0; ${unit} units, 154 architecture tests, ${smoke} CI=1 smoke cases; CPU start 3%; bundle ${combinedAfter.toFixed(2)} kB combined; exact inventory and all 86 immutable paths pass. No runtime failure/timeout/rerun. Ports free; status clean. Final evidence generated; SHA refresh/independent verification next. No push/PR/merge.\n`,'utf8');
write('runtime-state.json',JSON.stringify({phase:'All C3 runtime checks passed; handoff evidence generated',head,tree,unit,smoke,ci:1,execSessionId:null,remaining:'No product work. Checksum verification and visual handoff are recorded in the final Builder response. No push/PR/merge.'},null,2)+'\n');
console.log(JSON.stringify({head,tree,unit,smoke,changedPaths:changed.length,approvedEdits:6,immutable:86,auditFiles:audit.length,combinedGzipKB:combinedAfter},null,2));
