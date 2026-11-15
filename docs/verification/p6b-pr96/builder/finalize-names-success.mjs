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
assert.equal(head,'a60711120b8c3d7ff9759a14cbb7a6c09ec396c5');assert.equal(git('status','--porcelain=v1'),'');
const gates=JSON.parse(read('a3-gate-results.json'));assert.equal(gates.length,8);assert.ok(gates.every(g=>g.exit===0));
const log=read('a3-gates.txt');assert.ok(log.includes(`HEAD: ${head}`)&&log.includes(`Tree: ${tree}`));assert.ok(log.includes('CI=1'));assert.ok(log.includes('Ports before smoke: 4173/4174 free'));assert.ok(log.includes('Ports after smoke: 4173/4174 free'));
const unit=/Tests\s+(\d+) passed \((\d+)\)/.exec(log),smoke=[...log.matchAll(/^\s*(\d+) passed \(([^)]+)\)/gm)].at(-1);assert.ok(unit&&smoke);assert.equal(unit[1],unit[2]);assert.equal(Number(smoke[1]),370);
const cpu=Number(/_Total\s+(\d+)/.exec(log)?.[1]);assert.ok(Number.isFinite(cpu));
const targeted=JSON.parse(read('names-smoke-isolated-results.json')),inventory=JSON.parse(read('edit-inventory-names.json')),naming=JSON.parse(read('correction3-name-edits.json')),fixtures=JSON.parse(read('name-fixture-inspection.json')),bundle=JSON.parse(read('bundle-results.json')),state=JSON.parse(read('final-state.json'));
assert.equal(targeted.head,head);assert.equal(targeted.status,'GREEN');assert.equal(targeted.runs.length,22);assert.ok(targeted.runs.every(r=>r.exit===0&&r.attempt===1));
assert.equal(inventory.head,head);assert.equal(inventory.approvedExistingTestBlocks,59);assert.equal(inventory.unchangedApprovedEditsExceptP4,true);assert.equal(inventory.originalStep0InventoryUnchanged,true);assert.equal(inventory.approvedNewNames.length,32);
assert.equal(fixtures.head,head);assert.equal(fixtures.regenerated,false);assert.equal(fixtures.files.length,11);assert.ok(fixtures.files.every(f=>f.unchangedFromPreviousHead&&f.affectedItemNamePaths.length===0));
assert.equal(bundle.head,head);assert.equal(bundle.under200KB,true);assert.equal(state.head,head);assert.equal(state.ports4173And4174Free,true);
const summary={utc:new Date().toISOString(),status:'BUILDER_COMPLETE',head,tree,branch:git('branch','--show-current'),gateStartCPUPercent:cpu,gates,unit:{passed:Number(unit[1]),total:Number(unit[2])},smoke:{CI:'1',passed:Number(smoke[1]),duration:smoke[2]},previouslyFailingCases:{passed:22,total:22,eachSeparate:true,retries:0},naming:{renamed:32,preservedHistoricalWearables:26,uniqueNames:76,itemCatalogPinBefore:naming.previousItemCatalogPin,itemCatalogPinAfter:naming.itemCatalogPin,helperUnchanged:true,p4AfterTextRevised:true},fixtures:{filesUnchanged:11,regenerated:false,totalGoldenGenerations:1},bundleGzipBytes:bundle.totalsGzipBytes,bundleDeltaBytes:bundle.deltaBytesAgainstReportedMain,approvedExistingTestBlocks:59,approvedExistingTestFiles:inventory.approvedExistingTestFiles,changedFileCount:inventory.changedFileCount,publication:'Local Builder handoff only. No push/PR/merge. Independent review and docs-branch evidence publication remain with Orchestrator/Tester.'};
write('a3-summary.json',JSON.stringify(summary,null,2)+'\n');
write('commits.txt',`HEAD: ${head}\nTree: ${tree}\nStatus: empty\n\n${git('log','-4','--format=%H %s%n%b')}\n`);
const kb=n=>(n/1000).toFixed(2),delta=n=>(n>=0?'+':'')+(n/1000).toFixed(2);
const lines=[
 '# P6-B PR A Builder evidence — A1–A3 complete after correction 3','',
 '**All seven local gates and full CI=1 smoke pass at the clean final head. All 22 formerly failing cases passed separately first. The report helper is unchanged.**','',
 `- Branch: ${code(summary.branch)}`,
 `- Base: ${code('e85917733e229701830ad7f53dfcfbe2fefab831')}`,
 `- HEAD: ${code(head)}`,
 `- Tree: ${code(tree)}`,
 '- Git status: empty. Ports 4173/4174 free. No push, PR, merge, dependency installation or new worktree.',
 '- Tester: Codex, this Builder thread; date 2026-11-15 UTC. Claude/Astra independent review was not run by this Builder.','',
 '## Final-head validation','',
 `The 22 prior smoke failures were each run separately with CI=1 after building fresh assets at this head: **22/22 PASS, no failure rerun**. Then gates 1–7 ran again from gate 1, followed by the full CI=1 smoke in the same PowerShell script. CPU at gate start: **${cpu}%**, zero other detected test/build/review jobs. The full log records HEAD/tree/base, CPU/top processes, UTC, commands, outputs, exits, CI=1 and ports.`,
 '',
 '| Gate | Command | Result | Exit | Seconds |','|---|---|---|---:|---:|',
 ...gates.map(g=>`| ${g.gate===8?'Smoke':g.gate} | ${code(g.command)} | PASS | ${g.exit} | ${g.seconds.toFixed(2)} |`),
 '',
 `Unit: **${unit[1]}/${unit[2]} passed**. Full smoke: **${smoke[1]} passed**, ${smoke[2]}, **CI=1**, no smoke failure rerun. [Full gate log](a3-gates.txt), [22 individual commands/results](names-smoke-isolated-results.json).`,
 '',
 '## Correction 3 — exact naming fix','',
 `Commit ${code(head)}: ${code("fix(core): unique item names with Lord's and Retainer's prefixes")}. Exactly 32 new definition name values gain straight-apostrophe Lord's / Retainer's prefixes by kind. The 26 historical wearable definitions remain byte-identical; every other item field and JSON byte is preserved relative to b0c0b37 after reversing those 32 names. All 76 item display names are unique. No report-helper, command, week or UI product code changed.`,
 '',
 `RED before data edit: **3 failed / 42 passed**, exit 1, [names-red.txt](names-red.txt). New assertions cover global uniqueness and correct straight-apostrophe prefixes; the exact new-name expectation in the Builder-owned test was updated. GREEN: **94/94**, exit 0, [names-green.txt](names-green.txt). Full fixture/golden comparisons: **59/59**, exit 0, [names-fixtures-green.txt](names-fixtures-green.txt). Final full unit and smoke runs above prove the committed head.`,
 '',
 `ITEM_CATALOG: ${code(naming.previousItemCatalogPin)} → ${code(naming.itemCatalogPin)}. Only P4's effective after-text changes; original Step 0 package bytes remain historical and immutable. P1–P3, P5–P58 and P59 remain exact. No additional existing-test edit was needed. [P4 revision](p4-names-pin-revision.md), [all 32 name edits](correction3-name-edits.json), [full pin history](hash-pin-changes.md).`,
 '',
 `Inventory: **59 approved blocks in ${inventory.approvedExistingTestFiles} existing test files**, ${inventory.changedFileCount} total changed files. [Final inventory](edit-inventory-names.json), [verifier](verify-edits.mjs), [verification execution](final-edit-verification-names.txt). The verifier checks the raw helper hash and reconstructs item JSON byte-for-byte after reversing only the approved names.`,
 '',
 '## Golden and fixtures','',
 'The golden and ten v9 checkpoints store definition ids, not the affected item display names. All eleven files contain no affected item-name value and remain byte-identical to b0c0b37. Production comparison tests passed without generation flags. **No additional regeneration occurred; the golden generation total remains one.** All 53 historical fixture files remain unchanged. The committed A2 path diff remains valid: only ruleset/items state paths differ from main. [Inspection script](check-name-fixtures.mjs), [raw hashes and name-path results](name-fixture-inspection.json), [original path diff](golden-path-diff.txt).',
 '',
 '## Bundle versus supplied main','',
 '| Output | Main gzip kB | PR A gzip kB | Growth kB |','|---|---:|---:|---:|',
 `| JS | 126.72 | ${kb(bundle.totalsGzipBytes.JS)} | ${delta(bundle.deltaBytesAgainstReportedMain.JS)} |`,
 `| CSS | 6.74 | ${kb(bundle.totalsGzipBytes.CSS)} | ${delta(bundle.deltaBytesAgainstReportedMain.CSS)} |`,
 '',
 `Combined production gzip: **${kb(bundle.combinedGzipBytes)} kB**, below 200 kB. Node gzipSync(default compression), decimal kB; main is the supplied rounded baseline, not a new main build. [Script](measure-bundle.mjs), [raw results](bundle-results.json), [execution log](bundle-measurement.txt), [raw JS/CSS manifest](bundle-artifacts/SHA256SUMS.txt). Historical b0c0b37 bundle files/results are retained separately.`,
 '',
 '## Commit and HOLD history','',
 '| Work | Commit | Recorded evidence |','|---|---|---|',
 '| A1 | db7c65a1ccd0b679ae37d3214e71dd075bd3c69d | RED 45 failed / 47 passed; clean-head GREEN 157/157 |',
 '| A2 | 2a92985e20c5eb0eb0a9faa053bcd73f64410286 | RED 46 failed / 113 passed; clean-head GREEN 168/168 |',
 '| P59 | b0c0b37cb25601b69f03b8844ac8a3f957304d4d | Only the 60-week lord-health timeout became 15000 ms |',
 `| Naming fix | ${head} | RED → GREEN, 22 isolated smoke cases GREEN, full final-head gates/smoke GREEN |`,
 '',
 `All four commits end with ${code('Co-authored-by: Codex <noreply@openai.com>')}; [commit list](commits.txt). The 15000 ms owner-approved test limit remains; all other timeouts/thresholds are unchanged.`,
 '',
 'Original timeout HOLD: full suite 2556 passed / 1 timed out at 5000 ms; three isolated timings 1521/1285/1325 ms. Original smoke HOLD at b0c0b37: full CI=1 smoke 348 passed / 22 failed, all reproduced alone once at the unchanged duplicate-name helper. Owner correction 3 fixes the product names; no helper edit was made. [Historical b0c0b37 README](README-b0c0b37-smoke-hold.md), [original smoke log](a3-gates-b0c0b37-smoke-hold.txt), [old isolated reproductions](smoke-isolated-results-b0c0b37-smoke-hold.json). Earlier shell-quoting and new Smithy-test setup retries remain disclosed in the historical record.',
 '',
 '## Owner authority and integrity','',
 'Owner Tân, 2026-11-15, verbatim: "Sau Step 0"; "Duyệt, giao Builder A". Correction 1 choices, verbatim:','',
 '1. "Approve the 58 edits (Recommended)"','2. "Allow the 3 lines (Recommended)"','3. "Allow both (Recommended)"','4. "120 Gold, 3× rule (Recommended)"','',
 'Correction 2, verbatim: "Set this test to 15 s (Recommended)". Correction 3, verbatim: "Lord\'s / Retainer\'s prefix (Recommended)". Binding [plan](binding-plan-3bee3ae.md), including all three corrections; [spec](binding-spec-cd1b18a.md).','',
 'All text is UTF-8. SHA256SUMS.txt covers every file except itself, nested manifests included. Historical raw traces over 1 MB are retained locally with hashes; later docs-branch publication should use hashes for oversized artifacts and retain the raw bundle sample. Evidence is local as requested; no docs file was added to the product branch. Independent verdicts and committed evidence on the WP docs branch remain required before G5.','',
 'Assigned worktree retained with all four commits for Orchestrator/Tester; no environment removed; storage reclaimed 0 bytes.',''
];
write('README.md',lines.join('\n'));
write('smoke-finding.md',`# Resolved by Plan correction 3\n\nOwner Tân chose "Lord's / Retainer's prefix (Recommended)". At ${head}, only the 32 new product names were prefixed; all item names are now unique and the report helper is unchanged. All 22 formerly failing cases passed separately, and full CI=1 smoke passed ${smoke[1]}/${smoke[1]}.\n\nHistorical finding: [smoke-finding-b0c0b37-smoke-hold.md](smoke-finding-b0c0b37-smoke-hold.md). Current proof: [README.md](README.md), [names-smoke-isolated-results.json](names-smoke-isolated-results.json), [a3-gates.txt](a3-gates.txt).\n`);
const marker=`Task A3: complete after correction 3 at ${head}`;
if(!read('progress.md').includes(marker))fs.appendFileSync(path.join(out,'progress.md'),`\n${marker}, tree ${tree}. 32 names prefixed; old 26 wearables and helper unchanged; P4 after-text revised only. Names RED 3 fail/42 pass → GREEN 94/94; fixtures/golden 59/59, all eleven stored files unchanged, no regeneration. Prior 22 smoke failures now 22/22 pass separately with CI=1. Gates 1–7 and full CI=1 smoke exit 0; unit ${unit[1]}/${unit[2]}, smoke ${smoke[1]} (${smoke[2]}). Gate-start CPU ${cpu}%; no concurrent jobs. Bundle JS ${kb(bundle.totalsGzipBytes.JS)} / CSS ${kb(bundle.totalsGzipBytes.CSS)} kB; total ${kb(bundle.combinedGzipBytes)} kB. Status empty, ports free, no push/PR/merge.\n`,'utf8');
console.log(JSON.stringify(summary,null,2));
