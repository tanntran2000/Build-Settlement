import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const read=file=>fs.readFileSync(path.join(out,file),'utf8').replace(/\r\n/g,'\n').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'');
const write=(file,text)=>fs.writeFileSync(path.join(out,file),text,'utf8');
const tick=String.fromCharCode(96),code=value=>tick+value+tick;
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
assert.equal(head,'b0c0b37cb25601b69f03b8844ac8a3f957304d4d');assert.equal(git('status','--porcelain=v1'),'');
const gates=JSON.parse(read('a3-gate-results.json'));assert.equal(gates.length,8);assert.ok(gates.every(g=>g.exit===0));
const gateLog=read('a3-gates.txt');assert.ok(gateLog.includes(`HEAD: ${head}`));assert.ok(gateLog.includes(`Tree: ${tree}`));
assert.ok(gateLog.includes('CI=1'));assert.ok(gateLog.includes('Ports before smoke: 4173/4174 free'));assert.ok(gateLog.includes('Ports after smoke: 4173/4174 free'));
const unit=/Tests\s+(\d+) passed \((\d+)\)/.exec(gateLog);assert.ok(unit);assert.equal(unit[1],unit[2]);
const smokeMatches=[...gateLog.matchAll(/\b(\d+) passed \(([^)\r\n]+)\)/g)],smoke=smokeMatches.at(-1);assert.ok(smoke);assert.ok(smoke[2].includes('m')||smoke[2].includes('s'));
const cpu=Number(/_Total\s+(\d+)/.exec(gateLog)?.[1]);assert.ok(Number.isFinite(cpu));
const inventory=JSON.parse(read('edit-inventory-a3.json')),bundle=JSON.parse(read('bundle-results.json'));
assert.equal(inventory.head,head);assert.equal(inventory.tree,tree);assert.equal(inventory.approvedExistingTestBlocks,59);assert.equal(inventory.p1ThroughP58Unchanged,true);
assert.equal(bundle.head,head);assert.equal(bundle.tree,tree);assert.equal(bundle.under200KB,true);
const summary={utc:new Date().toISOString(),status:'BUILDER_COMPLETE',head,tree,branch:git('branch','--show-current'),statusPorcelain:'',gateStartCPUPercent:cpu,gateResults:gates,unit:{passed:Number(unit[1]),total:Number(unit[2])},smoke:{passed:Number(smoke[1]),duration:smoke[2],CI:'1'},bundleGzipBytes:bundle.totalsGzipBytes,bundleDeltaBytes:bundle.deltaBytesAgainstReportedMain,approvedExistingTestBlocks:59,approvedExistingTestFiles:inventory.approvedExistingTestFiles,changedFileCount:inventory.changedFileCount,publication:'Local evidence only; no push, PR or merge. Independent review and docs-branch publication remain with Orchestrator/Tester.'};
write('a3-summary.json',JSON.stringify(summary,null,2)+'\n');
write('commits.txt',`HEAD: ${head}\nTree: ${tree}\nStatus: empty\n\n${git('log','-3','--format=%H %s%n%b')}\n`);
const kb=n=>(n/1000).toFixed(2),delta=n=>(n>=0?'+':'')+(n/1000).toFixed(2);
const rows=gates.map(g=>`| ${g.gate===8?'Smoke':g.gate} | ${code(g.command)} | PASS | ${g.exit} | ${g.seconds.toFixed(2)} |`);
const lines=[
 '# P6-B PR A Builder evidence — A1–A3 complete',
 '',
 '**All seven local gates and the full CI=1 smoke passed at the clean final head.** Independent review and later publication on the WP docs branch remain with the Orchestrator/Tester.',
 '',
 `- Branch: ${code(summary.branch)}`,
 `- Base: ${code('e85917733e229701830ad7f53dfcfbe2fefab831')}`,
 `- HEAD: ${code(head)}`,
 `- Tree: ${code(tree)}`,
 '- Git status: empty. Ports 4173/4174 free before and after smoke. Assigned worktree retained; no push, PR, merge, dependency installation or new worktree.',
 '- Tester: Codex, this Builder thread; date 2026-11-15 UTC. Claude/Astra independent review was not run by this Builder.',
 '',
 '## Final-head gate evidence',
 '',
 `CPU at gate start: **${cpu}%**; zero other detected test/build/review job processes. The top current processes, HEAD/tree/base, UTC timestamps, full outputs and exit codes are in [a3-gates.txt](a3-gates.txt). Gates ran sequentially from gate 1 in one PowerShell script. The script set the CI environment to 1, printed CI=1, and ran the full smoke after both ports were checked free.`,
 '',
 '| Gate | Command | Result | Exit | Seconds |',
 '|---|---|---|---:|---:|',
 ...rows,
 '',
 `Full unit suite: **${unit[1]}/${unit[2]} passed**. Full smoke: **${smoke[1]} passed**, ${smoke[2]}, **CI=1**, no smoke re-run. The owner-approved 60-week lord-health test has a 15000 ms timeout; all other timeouts and thresholds are unchanged.`,
 '',
 '## Bundle versus supplied main',
 '',
 '| Output | Main gzip kB | PR A gzip kB | Growth kB |',
 '|---|---:|---:|---:|',
 `| JS | 126.72 | ${kb(bundle.totalsGzipBytes.JS)} | ${delta(bundle.deltaBytesAgainstReportedMain.JS)} |`,
 `| CSS | 6.74 | ${kb(bundle.totalsGzipBytes.CSS)} | ${delta(bundle.deltaBytesAgainstReportedMain.CSS)} |`,
 '',
 `Combined production JS/CSS gzip: **${kb(bundle.combinedGzipBytes)} kB**, under 200 kB. Method: sum Node gzipSync(default compression) lengths of production dist JS/CSS using decimal kB. Main is the supplied rounded baseline, not a new main build. [Measurement script](measure-bundle.mjs), [raw results](bundle-results.json), [execution log](bundle-measurement.txt), and [raw artifacts with nested manifest](bundle-artifacts/SHA256SUMS.txt).`,
 '',
 '## Commits and RED → GREEN',
 '',
 '| Task | Commit | Evidence |',
 '|---|---|---|',
 `| A1 | ${code('db7c65a1ccd0b679ae37d3214e71dd075bd3c69d')} | RED 45 failed / 47 passed, exit 1; GREEN 157/157 at clean task head, exit 0 |`,
 `| A2 | ${code('2a92985e20c5eb0eb0a9faa053bcd73f64410286')} | RED 46 failed / 113 passed, exit 1; GREEN 168/168 at clean task head, exit 0 |`,
 `| A3 / P59 | ${code(head)} | Previous full-suite timeout retained; one approved timeout-only edit; final gates and smoke all pass |`,
 '',
 `Commit messages: ${code('feat(core): material families, item ladders and recipe catalog')}; ${code('feat(core): smithy, ruleset 09 and fixtures')}; ${code('test(simulation): give the 60-week lord-health test a 15 s timeout')}. All three end with ${code('Co-authored-by: Codex <noreply@openai.com>')}; see [commits.txt](commits.txt).`,
 '',
 '## Approved edits and candidate fidelity',
 '',
 `Exactly **59 approved blocks in ${inventory.approvedExistingTestFiles} existing test files**; **${inventory.changedFileCount} total changed files**. Original P1–P58 inventory bytes remain unchanged and their applied edits match exactly. P59 is recorded as the full before/after block at lord-health.test.ts:73 (closing line 84): ${code('});')} → ${code('}, 15000);')}. Nothing else in that file changes relative to 2a92985. [P59 inventory](p59-edit.md), [machine-readable block and original-package hashes](p59-edit.json), [final inventory](edit-inventory-a3.json), [verifier](verify-edits.mjs), [final verification log](final-edit-verification-a3.txt).`,
 '',
 'Actual item data and all four changed pins match Step 0 exactly. All 26 prior wearables, ITEM_TRIAL and other existing pins remain unchanged. The catalog has 54 non-Legendary wearables plus four Legendary; new set prices are 15000/45000/120000 milli-Gold. Recipes: 8 refine + 38 upgrade + 1 fixed. Full old/new pins: [hash-pin-changes.md](hash-pin-changes.md).',
 '',
 'Golden regenerated once during A2, never regenerated during this resumption. The committed path-diff output proves three golden seeds and ten new v9 scenarios change only ruleset/items state paths; all 53 historical fixtures are byte-identical. Envelope ruleset ids change from 08 to 09 as specified; all other envelope fields and scenario/report metadata match. Original generator and P6-A path evidence Git blobs stay unchanged. [Raw path diff](golden-path-diff.txt), [original execution log](a2-path-diff.txt).',
 '',
 '## HOLD history and re-runs',
 '',
 'The original gate-6 run at 2a92985 had 2556 passed / 1 failed: lord-health.test.ts:73 timed out at 5000 ms (reported 5437 ms). Three required isolated runs passed at 1521 / 1285 / 1325 ms. The Builder stopped and the owner answered through Plan correction 2. [Original gate log](a3-gates-2a92985-hold.txt), [measurements](timeout-measurements.json), [historical README](README-2a92985-hold.md). The final full sequence was rerun from gate 1 after committing P59; the original failure was not overwritten or hidden.',
 '',
 'Earlier recorded retries: initial fixture-generation invocation lost quote characters through nested PowerShell, produced no files, and failed; the corrected direct invocation passed 55/55. Initial A2 GREEN had one new-test setup failure because the starting Processor used both Makers workforce units; one setup fix freed them through real SET_WORKERS, preserving every assertion and datum. Next A2 run passed 168/168. All logs are retained. No further test, timeout or threshold changes were made.',
 '',
 '## Authority and integrity',
 '',
 'Owner Tân, 2026-11-15, verbatim: "Sau Step 0". Plan approval: "Duyệt, giao Builder A". Plan correction 1 choices, verbatim:',
 '',
 '1. "Approve the 58 edits (Recommended)"',
 '2. "Allow the 3 lines (Recommended)"',
 '3. "Allow both (Recommended)"',
 '4. "120 Gold, 3× rule (Recommended)"',
 '',
 'Plan correction 2 choice, verbatim: **"Set this test to 15 s (Recommended)"**.',
 '',
 'Binding plan: [binding-plan-00af2a9.md](binding-plan-00af2a9.md), including corrections 1 and 2; spec: [binding-spec-cd1b18a.md](binding-spec-cd1b18a.md). Original Step 0 and HOLD evidence are historical records, retained intact. No docs files were added to the product branch.',
 '',
 'All text is UTF-8. SHA256SUMS.txt covers every file except itself, nested manifests included; step0-manifest.mjs creates and verifies it. Evidence is local as requested. Independent verdicts and committed evidence on the WP docs branch are still needed before G5. The assigned worktree and all three commits are retained for the owner/Tester; no environment removed; storage reclaimed 0 bytes.',
 ''
];
write('README.md',lines.join('\n'));
const marker=`Task A3: complete at ${head}`;
if(!read('progress.md').includes(marker))fs.appendFileSync(path.join(out,'progress.md'),`\n${marker}, tree ${tree}. Gates 1–7 and full CI=1 smoke all exit 0; unit ${unit[1]}/${unit[2]}, smoke ${smoke[1]} (${smoke[2]}). Gate-start CPU ${cpu}%, zero other detected jobs; ports free before/after. P59 only; P1–P58 unchanged. Bundle JS ${kb(bundle.totalsGzipBytes.JS)} kB / CSS ${kb(bundle.totalsGzipBytes.CSS)} kB gzip; combined ${kb(bundle.combinedGzipBytes)} kB. Raw artifacts retained, local evidence refreshed. No push/PR/merge.\n`,'utf8');
console.log(JSON.stringify(summary,null,2));
