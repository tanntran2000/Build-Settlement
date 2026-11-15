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
const gates=JSON.parse(read('a3-gate-results.json'));assert.equal(gates.length,8);assert.ok(gates.slice(0,7).every(g=>g.exit===0));assert.equal(gates[7].exit,1);
const log=read('a3-gates.txt'),isolated=JSON.parse(read('smoke-isolated-results.json'));
const unit=/Tests\s+(\d+) passed \((\d+)\)/.exec(log);assert.ok(unit);assert.equal(unit[1],unit[2]);assert.ok(log.includes('CI=1'));assert.equal(isolated.head,head);
const passed=[...log.matchAll(/^\s*(\d+) passed \(([^)]+)\)/gm)].at(-1),failed=[...log.matchAll(/^\s*(\d+) failed\s*$/gm)].at(-1);
assert.ok(passed&&failed);assert.equal(isolated.cases.length,Number(failed[1]));
for(const entry of isolated.cases){
 const runs=isolated.runs.filter(r=>r.case===entry.index);assert.ok(runs.length>=1);
 assert.equal(runs.length,entry.timeout||runs.some(r=>r.timeout)?3:1);
 for(const run of runs){
  const text=read(run.log);assert.ok(text.includes('CI=1'));assert.ok(text.includes(`Exit: ${run.exit}`));
  if(run.exit!==0){
   const captured=JSON.parse(read(run.artifacts)),contextFile=captured.artifacts.find(row=>row.file.endsWith('/error-context.md'));
   assert.ok(contextFile);const context=read(path.join(path.dirname(run.artifacts),contextFile.file));
   assert.ok(context.includes('Expected length: 1')&&context.includes('Received length: 2'),'Isolated failure differs from the duplicate-name assertion');
   const received=/^Received array:\s+(\[[^\r\n]+\])$/m.exec(context)?.[1];assert.ok(received);
   assert.deepEqual(JSON.parse(received).map(([id])=>id),entry.definitions.map(d=>d.id),'Isolated matching definitions differ');
  }
 }
}
const isolatedFailures=isolated.runs.filter(r=>r.exit!==0).length;
const failureNames=[...log.matchAll(/^\s+\[chromium\] › (tests[^\r\n]+)$/gm)].map(m=>m[1]);
const cpu=Number(/_Total\s+(\d+)/.exec(log)?.[1]);assert.ok(Number.isFinite(cpu));
const inventory=JSON.parse(read('edit-inventory-a3.json')),bundle=JSON.parse(read('bundle-results.json')),state=JSON.parse(read('final-state.json'));
assert.equal(inventory.head,head);assert.equal(inventory.approvedExistingTestBlocks,59);assert.equal(inventory.p1ThroughP58Unchanged,true);assert.equal(bundle.head,head);assert.equal(bundle.under200KB,true);assert.equal(state.head,head);assert.equal(state.ports4173And4174Free,true);
const summary={utc:new Date().toISOString(),status:'HOLD_SMOKE',head,tree,gateStartCPUPercent:cpu,gates,unit:{passed:Number(unit[1]),total:Number(unit[2])},smoke:{CI:'1',passed:Number(passed[1]),failed:Number(failed[1]),duration:passed[2],failureNames,isolated:{cases:isolated.cases.length,runs:isolated.runs.length,failedRuns:isolatedFailures,results:'smoke-isolated-results.json'}},bundleGzipBytes:bundle.totalsGzipBytes,bundleDeltaBytes:bundle.deltaBytesAgainstReportedMain,approvedExistingTestBlocks:59,approvedExistingTestFiles:inventory.approvedExistingTestFiles,changedFileCount:inventory.changedFileCount,noFurtherProductEdits:true,basis:'Original PR A brief: if smoke fails, rerun that test alone once, report both runs, and HOLD.'};
write('a3-summary.json',JSON.stringify(summary,null,2)+'\n');
write('commits.txt',`HEAD: ${head}\nTree: ${tree}\nStatus: empty\n\n${git('log','-3','--format=%H %s%n%b')}\n`);
const kb=n=>(n/1000).toFixed(2),delta=n=>(n>=0?'+':'')+(n/1000).toFixed(2);
const helper='tests/e2e/character-life-navigation.helpers.ts';
const source=fs.readFileSync(path.join(repo,helper),'utf8').replace(/\r\n/g,'\n').split('\n').slice(236,241).join('\n');
write('smoke-finding.md',[
 '# Smoke HOLD — report parser assumes unique item names','',
 `HEAD: ${code(head)}; tree: ${code(tree)}. Full CI=1 smoke: ${passed[1]} passed / ${failed[1]} failed, exit 1. Isolated runs: ${isolated.runs.length}, ${isolatedFailures} failed.`,
 '',`Primary source: ${helper}:237–241. The existing helper filters by item.name and requires exactly one definition.`,
 '',tick.repeat(3)+'ts',source,tick.repeat(3),'',
 'The approved catalog completes both Player/NPC ladders with shared display names. The full-smoke failures below resolve two matching definitions where this helper expects one. P1–P58 did not include this helper; P59 authorises only the lord-health timeout. No additional edit has been applied.','',
 '| Case | Test | Matching definition ids | Isolated outcome |','|---:|---|---|---|',
 ...isolated.cases.map(c=>`| ${c.index} | ${c.file}: ${c.name.replaceAll('|','\\|')} | ${c.definitions.map(d=>code(d.id)).join(', ')} | ${isolated.runs.filter(r=>r.case===c.index).map(r=>`run ${r.run}: exit ${r.exit}, ${r.seconds.toFixed(2)} s`).join('; ')} |`),'',
 'Commands, HEAD/tree, UTC, CI=1, complete output and exit codes are retained in each smoke-case-XX-alone-N.txt log. Full artifacts were copied before reruns; every isolated run has its own artifact folder. See smoke-isolated-results.json for links and hashes.','',
 'HOLD follows the original PR A brief: "If the smoke fails, rerun that test alone once, report both runs, and HOLD." Any timeout case is instead measured three times as instructed in the owner’s latest message. No timeout was changed beyond approved P59.','',
 'Next owner action: review the parser assumption and decide whether to authorise a separate exact test-helper edit.',''
 ].join('\n'));
const lines=[
 '# P6-B PR A Builder evidence — HOLD after full smoke',
 '',
 '**P59 is committed. Gates 1–7 pass at the clean final head. Full CI=1 smoke fails; each failed case was rerun alone as required. A3 remains on HOLD.**',
 '',
 `- Branch: ${code(git('branch','--show-current'))}`,
 `- Base: ${code('e85917733e229701830ad7f53dfcfbe2fefab831')}`,
 `- HEAD: ${code(head)}`,
 `- Tree: ${code(tree)}`,
 '- Git status: empty. Ports 4173/4174 free at final inspection. No push, PR, merge, dependency installation or new worktree.',
 '- Tester: Codex, Builder, 2026-11-15 UTC. Claude/Astra independent review was not run by this Builder.',
 '',
 '## Smoke HOLD',
 '',
 `Full smoke with CI=1: **${passed[1]} passed, ${failed[1]} failed**, ${passed[2]}, exit 1. Full unit suite: **${unit[1]}/${unit[2]} passed**, exit 0. The P59 timeout issue did not recur.`,
 '',
 'The report parser at character-life-navigation.helpers.ts:238–239 filters ITEM_CATALOG by display name and asserts one match. The approved ladders give shared names to Player and NPC definitions. For example, “Fine Ring” matches rare-ring (NPC) and rare-ring-player (Player): expected length 1, received 2. The helper is outside P1–P59 and was not edited. Every failed case and its matching ids are listed in smoke-finding.md.',
 '',
 `The original brief requires an isolated rerun then HOLD: **${isolated.cases.length} cases, ${isolated.runs.length} isolated runs, ${isolatedFailures} failed runs**, all with CI=1 and one selected test per run. No further product, assertion, setup, loop, timeout or threshold edit was made after P59. Full artifacts were copied before reruns replaced test-results; every isolated run has its own artifact folder. See [smoke finding](smoke-finding.md), [full artifacts](smoke-full-artifacts/artifacts.json), and [isolated commands/results/artifact hashes](smoke-isolated-results.json).`,
 '',
 '## Final-head gates',
 '',
 `All gates were rerun from gate 1 at ${code(head)} on a quiet machine. CPU at start: **${cpu}%**; zero other detected test/build/review jobs. HEAD/tree/base, UTC times, top processes, full outputs, exit codes, CI=1 and the pre-smoke port check are in [a3-gates.txt](a3-gates.txt). One runner at a time; ports were checked free again before the isolated run.`,
 '',
 '| Gate | Command | Result | Exit | Seconds |',
 '|---|---|---|---:|---:|',
 ...gates.map(g=>`| ${g.gate===8?'Smoke':g.gate} | ${code(g.command)} | ${g.exit===0?'PASS':'FAIL — duplicate name'} | ${g.exit} | ${g.seconds.toFixed(2)} |`),
 '',
 '## Bundle versus supplied main',
 '',
 '| Output | Main gzip kB | PR A gzip kB | Growth kB |',
 '|---|---:|---:|---:|',
 `| JS | 126.72 | ${kb(bundle.totalsGzipBytes.JS)} | ${delta(bundle.deltaBytesAgainstReportedMain.JS)} |`,
 `| CSS | 6.74 | ${kb(bundle.totalsGzipBytes.CSS)} | ${delta(bundle.deltaBytesAgainstReportedMain.CSS)} |`,
 '',
 `Combined production gzip: **${kb(bundle.combinedGzipBytes)} kB**, under 200 kB. Main is the supplied rounded baseline, not a new main build. Node gzipSync(default compression), decimal kB. [Script](measure-bundle.mjs), [raw per-file results](bundle-results.json), [execution log](bundle-measurement.txt), [raw JS/CSS and nested manifest](bundle-artifacts/SHA256SUMS.txt).`,
 '',
 '## P59 and preserved scope',
 '',
 `Commit ${code(head)}: ${code('test(simulation): give the 60-week lord-health test a 15 s timeout')}. It changes exactly one line in one file: closing line 84 of the test starting at lord-health.test.ts:73, ${code('});')} → ${code('}, 15000);')}. The rest of that file is identical to 2a92985. It ends with ${code('Co-authored-by: Codex <noreply@openai.com>')}.`,
 '',
 `Inventory: **59 approved blocks / ${inventory.approvedExistingTestFiles} existing test files**, ${inventory.changedFileCount} total changed files. P1–P58 source inventory bytes and their exact applied blocks are unchanged. P59 full before/after, file:line and owner quote: [p59-edit.md](p59-edit.md), [p59-edit.json](p59-edit.json). Final [inventory](edit-inventory-a3.json), [verifier](verify-edits.mjs), [verification log](final-edit-verification-a3.txt). No other timeout or threshold changed.`,
 '',
 'Actual data/pins still match the approved Step 0 candidates. All 26 previous wearables, ITEM_TRIAL and other existing pins remain unchanged. Full hash changes: [hash-pin-changes.md](hash-pin-changes.md). Golden was generated once in A2, never during this resumption. The committed path diff proves three seeds and ten new v9 scenarios change only ruleset/items state paths; all 53 historical fixtures are byte-identical. [Golden path diff](golden-path-diff.txt).',
 '',
 '## Earlier task evidence and HOLD history',
 '',
 '- A1: db7c65a1ccd0b679ae37d3214e71dd075bd3c69d, material families/ladders/recipes; RED 45 failed / 47 passed, exit 1; clean-head GREEN 157/157, exit 0.',
 '- A2: 2a92985e20c5eb0eb0a9faa053bcd73f64410286, Smithy/ruleset/fixtures; RED 46 failed / 113 passed, exit 1; clean-head GREEN 168/168, exit 0.',
 '- Original gate-6 HOLD: 2556 passed / 1 timeout at 5000 ms, reported 5437 ms. Three isolated measurements 1521/1285/1325 ms. Owner answered through Plan correction 2. [Original log](a3-gates-2a92985-hold.txt), [measurements](timeout-measurements.json), [historical README](README-2a92985-hold.md).',
 '- Earlier retries remain disclosed in the historical README: fixture-generation shell quoting corrected once; new Smithy-test setup freed occupied Makers once. No assertion or data change was made for either.',
 '',
 '## Authority and integrity',
 '',
 'Owner Tân, 2026-11-15, verbatim: "Sau Step 0"; "Duyệt, giao Builder A". Plan correction 1 choices, verbatim:',
 '',
 '1. "Approve the 58 edits (Recommended)"',
 '2. "Allow the 3 lines (Recommended)"',
 '3. "Allow both (Recommended)"',
 '4. "120 Gold, 3× rule (Recommended)"',
 '',
 'Plan correction 2 choice, verbatim: **"Set this test to 15 s (Recommended)"**. Binding [plan](binding-plan-00af2a9.md), including both corrections; [spec](binding-spec-cd1b18a.md).',
 '',
 'All text is UTF-8. SHA256SUMS.txt covers every file except itself, including nested manifests. Raw local trace files over 1 MB are listed in artifact inventories with hashes; later docs-branch publication should retain their hashes rather than committing oversized files. The raw production JS/CSS sample is retained. Evidence remains local as requested; no docs files on the product branch. Independent review and docs-branch evidence publication remain pending before G5.',
 '',
 'Assigned worktree retained with all three commits; no environment removed; storage reclaimed 0 bytes. Next owner action: review smoke-finding.md and decide whether to authorise a separate exact edit to the report test helper.',
 ''
];
write('README.md',lines.join('\n'));
const marker=`Task A3: HOLD after full smoke at ${head}`;
if(!read('progress.md').includes(marker))fs.appendFileSync(path.join(out,'progress.md'),`\n${marker}, tree ${tree}. Gates 1–7 exit 0; unit ${unit[1]}/${unit[2]}; full CI=1 smoke ${passed[1]} passed / ${failed[1]} failed (${passed[2]}), exit 1. Isolated CI=1 reruns: ${isolated.cases.length} cases, ${isolated.runs.length} runs, ${isolatedFailures} failed runs. Helper character-life-navigation.helpers.ts:238–239 is outside P1–P59 and untouched. CPU at gate start ${cpu}%; no concurrent jobs. Bundle JS ${kb(bundle.totalsGzipBytes.JS)} / CSS ${kb(bundle.totalsGzipBytes.CSS)} kB, total ${kb(bundle.combinedGzipBytes)} kB. Final status empty, ports free, no push/PR/merge.\n`,'utf8');
console.log(JSON.stringify(summary,null,2));
