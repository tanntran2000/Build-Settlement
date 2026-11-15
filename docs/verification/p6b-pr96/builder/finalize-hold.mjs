import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const read=file=>fs.readFileSync(path.join(out,file),'utf8').replace(/\r\n/g,'\n');
const write=(file,text)=>fs.writeFileSync(path.join(out,file),text,'utf8');
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}'),status=git('status','--porcelain=v1');
assert.equal(head,'2a92985e20c5eb0eb0a9faa053bcd73f64410286');assert.equal(status,'');
const gates=JSON.parse(read('a3-gate-results.json'));
assert.deepEqual(gates.map(g=>g.exit),[0,0,0,0,0,1]);
const unit=read('a3-gates.txt');assert.ok(unit.includes('Error: Test timed out in 5000ms.'));assert.ok(/2556 passed/.test(unit));
const alone=[1,2,3].map(run=>{
 const log=read(`a3-lord-health-alone-${run}.txt`),milliseconds=Number(/health one (\d+)ms/.exec(log)?.[1]);
 assert.ok(milliseconds>0);assert.ok(log.includes('Exit: 0'));assert.ok(log.includes('1 passed | 9 skipped'));
 return {run,testMilliseconds:milliseconds,exit:0,log:`a3-lord-health-alone-${run}.txt`};
});
const measurements={utc:new Date().toISOString(),head,tree,test:'packages/simulation/src/__tests__/lord-health.test.ts:73',name:'a Calm game below Crime 70 survives all 60 weeks from health one',fullSuite:{exit:1,passed:2556,failed:1,filesPassed:122,filesFailed:1,timeoutMilliseconds:5000,reportedTestMilliseconds:5437,runnerSeconds:61.87},isolated:alone,status:'HOLD',basis:'User PR A brief: if lord-health.test.ts:73 times out, measure it alone three times and HOLD; never change a timeout.',interpretation:'All three isolated runs pass under the unchanged 5000 ms timeout. This does not erase the full-suite failure or establish its root cause.',notRun:['gate 7 build','CI=1 smoke','bundle measurement']};
write('timeout-measurements.json',JSON.stringify(measurements,null,2)+'\n');
const candidates=JSON.parse(read('step0-candidates.json')),newPins=JSON.parse(read('a1-candidate-pins.json'));
write('hash-pin-changes.md','# Hash pins — PR A\n\nAll four existing pins match the owner-approved Step 0 candidates exactly. New pins have no baseline. ITEM_TRIAL and all other existing pins remain unchanged.\n\n| Constant | Before | After | Reason |\n|---|---|---|---|\n'+candidates.pins.map(p=>`| ${p.name} | \`${p.before}\` | \`${p.after}\` | ${p.reason} |`).join('\n')+`\n| RECIPES | new | \`${newPins.RECIPES}\` | 47 approved recipes |\n| CRAFT_TRIAL | new | \`${newPins.CRAFT_TRIAL}\` | Exact Decision 3 tuning |\n`);
const inventory=JSON.parse(read('edit-inventory-a2.json'));
const gateTable=[...gates.map(g=>`| ${g.gate} | \`${g.command}\` | ${g.exit===0?'PASS':'FAIL — timeout'} | ${g.exit} | ${g.seconds.toFixed(2)} |`),'| 7 | `npm run build` | NOT RUN — HOLD after gate 6 | — | — |','| Smoke | `CI=1 npm run test:smoke` | NOT RUN — HOLD after gate 6 | — | — |'].join('\n');
const commits=git('log','-2','--format=%H %s%n%b');
write('commits.txt',`HEAD: ${head}\nTree: ${tree}\nStatus: empty\n\n${commits}\n`);
const rawPath=fs.readFileSync(path.join(repo,'packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.txt'),'utf8');
write('golden-path-diff.txt',rawPath);
write('README.md',`# P6-B PR A Builder evidence — HOLD at A3

**Open \`timeout-measurements.json\` and the gate log for the owner decision. A1 and A2 are committed; A3 is incomplete.**

- Branch: \`feat/p6b-crafting-data\`
- Base: \`e85917733e229701830ad7f53dfcfbe2fefab831\`
- HEAD: \`${head}\`
- Tree: \`${tree}\`
- Final git status: empty. Ports 4173/4174 free. No push, PR, merge, dependency installation or new worktree.
- Tester: Codex, this Builder thread; date 2026-11-15 UTC. Independent review by Claude/Astra has not been run by this Builder.

## Mandatory HOLD

Full unit gate: **2556 passed, 1 failed / 2557** across 123 files. The only failure is \`lord-health.test.ts:73\`, “a Calm game below Crime 70 survives all 60 weeks from health one”: timeout 5000 ms, reported test time 5437 ms. Full runner duration 61.87 s; gate command elapsed 63.32 s; exit 1.

The brief explicitly requires three isolated measurements and HOLD for this timeout. Those runs passed, with unchanged timeout and assertions: **${alone.map(r=>r.testMilliseconds+' ms').join(' / ')}**; exits 0/0/0. Each targeted run intentionally selects one test and reports the other nine skipped; the full gate ran all 2557 tests. The isolated passes do not turn the full-suite result into PASS. No product or existing-test edit followed the timeout.

**Gate 7, CI=1 smoke, and bundle measurement were not run because the mandatory HOLD stopped the sequence. Smoke total: not available; CI=1 execution: not claimed.** The prepared \`measure-bundle.mjs\` has not run and there is no new bundle raw artifact. Main's supplied baseline remains JS 126.72 kB / CSS 6.74 kB gzip; PR A bundle growth is unmeasured.

## Results at final clean head

Gate-start CPU: **6%**, UTC 2026-11-15T02:05:19Z; zero other detected test/build/review job processes. Top current processes and the full sequential command output are at the top of [a3-gates.txt](a3-gates.txt).

| Gate | Command | Result | Exit | Seconds |
|---|---|---|---:|---:|
${gateTable}

Architecture self-tests: 154/154 passed. No timeout, threshold, matcher, CI configuration or command/week/UI product code was loosened or changed.

## Commits and RED → GREEN

| Task | Commit | RED | GREEN at clean task head |
|---|---|---|---|
| A1 | \`db7c65a1ccd0b679ae37d3214e71dd075bd3c69d\` | 45 failed / 47 passed; exit 1, [log](a1-red.txt) | 157/157 in six files; exit 0, [log](a1-head-green.txt) |
| A2 | \`${head}\` | 46 failed / 113 passed; exit 1, [log](a2-red.txt) | 168/168 in nine files; exit 0, [log](a2-head-green.txt) |

A1 commit: \`feat(core): material families, item ladders and recipe catalog\`.
A2 commit: \`feat(core): smithy, ruleset 09 and fixtures\`.
Both end with \`Co-authored-by: Codex <noreply@openai.com>\`; see [commits.txt](commits.txt). A1 core typecheck also passed.

Recorded re-runs: initial fixture-generation invocation lost quote characters across a nested PowerShell call, giving environment values trailing spaces and producing no files (exit 1); direct invocation preserved the quotes and passed 55/55 (exit 0), with both logs retained. Initial A2 GREEN had one new Smithy-test setup failure: the starting Processor occupied the two Makers workforce units. One fix freed them through real SET_WORKERS; every assertion and product datum stayed intact. The next A2 run passed 168/168. Golden generation ran once and passed 4/4. No full-gate rerun, timeout increase or hidden retry was made.

## Exact inventory, data and golden

- Exactly **58 owner-approved blocks in 35 existing test files**, verified against the base before/after package; **${inventory.changedFileCount} total changed files**. See [edit-inventory-a2.json](edit-inventory-a2.json), [verify-edits.mjs](verify-edits.mjs), and [step0-proposed-edits.md](step0-proposed-edits.md).
- Actual item data and all four changed pins match Step 0 exactly. All 26 prior wearable definitions and ITEM_TRIAL are unchanged; 32 new definitions complete the 54 non-Legendary ladder. New set prices are 15000/45000/120000. Recipes: 8 refine + 38 upgrade + 1 fixed. Full old/new pins: [hash-pin-changes.md](hash-pin-changes.md).
- Golden regenerated **once**, using the unchanged original generator. Path verification PASS: three seeds, ten new v9 scenarios, no state change outside ruleset/items. All 53 historical fixture files are byte-identical. Original generator and P6-A path evidence Git blobs are unchanged. The envelope ruleset identifier changes from 08 to 09 as specified; all other envelope fields and scenario/report metadata match. [Raw output](golden-path-diff.txt), [run log](a2-path-diff.txt). The script/output are committed at \`packages/simulation/src/__tests__/fixtures/p6b-crafting-path-diff.ts\` / \`.txt\`.

## Authority and evidence integrity

Owner Tân, 2026-11-15, verbatim: “Sau Step 0”. Plan approval: “Duyệt, giao Builder A”. The four Plan correction 1 choices, verbatim:

1. "Approve the 58 edits (Recommended)"
2. "Allow the 3 lines (Recommended)"
3. "Allow both (Recommended)"
4. "120 Gold, 3× rule (Recommended)"

Binding plan: [binding-plan-40b57c3.md](binding-plan-40b57c3.md), including Plan correction 1; spec: [binding-spec-cd1b18a.md](binding-spec-cd1b18a.md). Historical Step 0 HOLD files are retained as the original pre-approval record, superseded by [handoff-authorization.md](handoff-authorization.md).

This is the requested local Builder handoff. No docs files were added to the product branch. Independent verdicts and publication of evidence to the WP docs branch under AGENTS §6 remain with the Orchestrator/Tester; this package is not G5-ready.

All text is UTF-8. \`SHA256SUMS.txt\` covers every file except itself, including nested manifests if present; \`step0-manifest.mjs\` creates and verifies it. Existing assigned worktree retained for the owner/Tester with both commits; no environment removed; storage reclaimed 0 bytes.
`.replaceAll('\`','`'));
fs.appendFileSync(path.join(out,'progress.md'),`\nTask A2: complete, commit ${head}, tree ${tree}. a2-head-green.txt: 168/168, nine files, exit 0 at clean head. Path diff PASS for three golden seeds, ten v9 scenarios and 53 immutable historical fixtures. Golden generated once. One new-test setup fix freed Processor Makers through the dispatcher; no assertion/data change.\n\nTask A3: HOLD, not complete. a3-gates.txt at ${head}/${tree}: gate-start CPU 6%, zero concurrent test/build/review jobs; gates 1–5 exit 0; gate 6 exit 1 with 2556 passed/1 failed. lord-health.test.ts:73 timed out at 5000 ms (reported 5437 ms). Three mandatory isolated runs: ${alone.map(r=>r.testMilliseconds+' ms / exit '+r.exit).join('; ')}. No code edits or full-suite rerun after the timeout. Gate 7, CI=1 smoke and bundle measurement not run. Reason: the user brief explicitly orders three isolated measurements then HOLD. Final git status empty; ports 4173/4174 free.\n`,'utf8');
console.log(JSON.stringify({status:'HOLD',head,tree,isolated:alone,changedFileCount:inventory.changedFileCount,readme:'README.md',evidenceRoot:out},null,2));
