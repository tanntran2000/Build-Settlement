"""Finalize this fix's exact-head evidence; preserve prior rounds and performance HOLD."""
from pathlib import Path
import base64
import datetime as dt
import gzip
import hashlib
import json
import re
import subprocess

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
PARENT=OUT.parent
LOCAL=PARENT.parent/'p7a-prB-local-only/fix-round1'
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
git=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT,text=True,encoding='utf-8').strip()
pin=load('B2-head.json');baseline=load('baseline.json')
assert git('rev-parse','HEAD')==pin['head'] and git('rev-parse','HEAD^{tree}')==pin['tree']
assert git('rev-parse','HEAD^')==baseline['head'] and git('rev-list','--count',baseline['head']+'..HEAD')=='1'
assert git('status','--porcelain=v1')==''
assert git('diff','--name-only',baseline['head']+'...HEAD')==baseline['productPath']
for path,digest in baseline['files'].items():
    raw=(ROOT/path).read_bytes()
    if path==baseline['productPath']:
        before=(OUT/'npc-life-week-before.ts.txt').read_bytes()
        assert raw==before.replace(baseline['beforeText'].encode(),baseline['afterText'].encode(),1)
    else:assert hashlib.sha256(raw).hexdigest()==digest,path
assert load('profile/sequence.json')['executionComplete']
gates=[];logs=[]
names=['gate-1-diff.txt','gate-2-lint.txt','gate-3-typecheck.txt','gate-4-architecture.txt','gate-5-architecture-tests.txt','gate-6-unit.txt','gate-7-build.txt']
commands=['git diff --check origin/main...HEAD','npm run lint','npm run typecheck','npm run check:architecture','npm run test:architecture','npm test','npm run build']
for number,(name,command) in enumerate(zip(names,commands,strict=True),1):
    log=(OUT/name).read_text(encoding='utf-8')
    assert 'HEAD='+pin['head'] in log and 'TREE='+pin['tree'] in log
    code=int(re.search(r'^EXIT_CODE=(\d+)$',log,re.M)[1]);assert code==0
    gates.append({'gate':number,'command':command,'exitCode':code,'seconds':float(re.search(r'^SECONDS=([\d.]+)$',log,re.M)[1]),'log':name})
    logs.append(log)
(OUT/'gates-1-7.txt').write_text('\n'.join(logs),encoding='utf-8')
units=int(re.search(r'Tests\s+(\d+) passed',(OUT/'gate-6-unit.txt').read_text(encoding='utf-8'))[1]);assert units==3074
smoke=load('smoke-result.json');assert smoke['ci']=='1'
text=(OUT/'smoke-CI1.txt').read_text(encoding='utf-8')
passed=re.search(r'(\d+) passed \(',text)
smoke_passed=int(passed[1]) if passed else 0
skipped=re.search(r'(\d+) skipped',text);smoke_skipped=int(skipped[1]) if skipped else 0
smoke_failed=smoke['smokeExitCode']!=0
if not smoke_failed:assert smoke_passed==387 and smoke_skipped==0 and smoke['servedAssetsMatched']
if smoke_failed:assert (OUT/'smoke-isolated-summary.json').exists(),'HOLD: isolate every failed case once before finalizing'
assert not load('final-machine.json')['portListeners']
machine=load('gate-start-machine.json');sleep=load('sleep-resume-events.json')
bundle=load('bundle-results.json');old_bundle=json.loads((PARENT/'bundle-results.json').read_text(encoding='utf-8'))
assert bundle['head']==pin['head'] and bundle['tree']==pin['tree']
for entry in bundle['files']:
    if not entry['entry']:continue
    artifact=load('bundle-'+Path(entry['file']).name+'.raw.json')
    raw=base64.b64decode(artifact['raw'],validate=True);packed=base64.b64decode(artifact['gzip'],validate=True)
    assert hashlib.sha256(raw).hexdigest()==entry['sha256'] and hashlib.sha256(packed).hexdigest()==entry['gzipSha256']
    assert gzip.decompress(packed)==raw and len(packed)==entry['gzipBytes'];raw.decode('utf-8')
    (OUT/('bundle-'+Path(entry['file']).name+'.raw.txt')).write_bytes(raw)
local=[]
for path in sorted(LOCAL.rglob('*')):
    if path.is_file():local.append({'path':str(path),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(OUT/'LOCAL-ONLY.json').write_text(json.dumps({'root':str(LOCAL),'files':local},indent=2)+'\n',encoding='utf-8')
profile=load('profile/summary.json');comparison=load('previous-head-comparison.json')
result={'status':'HOLD: strict cold-tick performance budget remains breached','head':pin['head'],'tree':pin['tree'],'previousHead':pin['previousHead'],'base':pin['base'],'branch':pin['branch'],'gitStatus':'','commitMessage':git('log','-1','--format=%B'),'commitCountOnPreviousHead':1,'diff':'diff.patch','productFilesChanged':1,'productLinesChanged':1,'testFilesChanged':0,'allOther497RawFilesUnchanged':True,'beforeTests':43,'afterTargetedTests':82,'unitPassed':units,'unitFiles':131,'gates':gates,'gateStartCpu':machine['cpu'],'gateStartTopProcesses':machine['topProcesses'],'gateSleepResumeEvents':sleep['eventCount'],'gateWindowStartUtc':sleep['windowStartUtc'],'gateWindowEndUtc':sleep['windowEndUtc'],'smoke':smoke,'smokePassed':smoke_passed,'smokeSkipped':smoke_skipped,'smokeFailed':smoke_failed,'profile':'profile/summary.json','profileHeadMinusBase':profile['headMinusBase'],'changeFromPreviousHead':comparison,'bundle':bundle,'previousHeadBundle':old_bundle,'bundleDeltaVsPreviousHeadBytes':{k:bundle['current'][k]-old_bundle['current'][k] for k in ['jsGzipBytes','cssGzipBytes']},'portsFree':True,'noPushPrMerge':True,'utc':dt.datetime.now(dt.timezone.utc).isoformat()}
(OUT/'results-summary.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
table='\n'.join(f"| {g['gate']} | `{g['command']}` | PASS, exit 0 | {g['seconds']:.3f} s |" for g in gates)
current=bundle['current'];old=old_bundle['current']
readme=f'''# PR B fix round 1 — verification and performance HOLD

Owner Tân, verbatim: "Remove the extra clone (Recommended)". Binding plan correction 5 at `25b82ac`; [binding copy](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-25b82ac.md). One local commit, no push/PR creation/merge. The authorized code change is complete; strict cold-tick performance acceptance remains **HOLD** and needs owner/Astra assessment.

| Revision | Value |
|---|---|
| HEAD | `{pin['head']}` |
| Tree | `{pin['tree']}` |
| Previous head / direct parent | `{pin['previousHead']}` |
| Main base | `{pin['base']}` |
| Branch | `{pin['branch']}` |
| Git status / ports | Empty; 4173/4174 free |

Commit: `perf(simulation): drop redundant npc clone in weekly life step`, ending `Co-authored-by: Codex <noreply@openai.com>`.

## Exact diff and behavior

Only `packages/simulation/src/npc-life-week.ts:17` changed:

```diff
-  const next = structuredClone(npcs);
+  const next = npcs.map(npc => ({{ ...npc, life: structuredClone(npc.life) }}));
```

This drops the full NPC-array deep clone. A shallow NPC container plus deep life copy preserves the standalone weekly API's input immutability and detached mutable life data. The weekly step writes life only. The Character Life dispatcher already owns detached character/post records. The existing frozen-input test and nested hobby mutation assertion remain unchanged; no new test was needed. All 497 other tracked raw files are byte-identical to cf94804, including every existing test, golden, fixture, timeout and config. No golden regeneration or hash-pin change.

Before edit: **43/43 tests pass** in npc-life-week.test.ts. After edit: **82/82 pass** across the same 43 cases, Character Life commands and catalog golden scenarios. Simulation typecheck passes. No RED was required for this owner-approved pure perf refactor. `diff.patch`, before/after source snapshots, baseline.json and edit-verification.json capture exact scope.

## Matched profile

[Full profile tables](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/README.md), [raw/statistical summary](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/summary.json), and [change from previous head](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/previous-head-comparison.json).

Six alternating base/new-head processes, same seed 42 / 100 adult NPCs / 60 END_WEEK ticks / 1 ms CPU sampling. Every raw tick retained, separate ticks 6–60 view. Timing-hook recognition is minimally adapted for the new initializer; all workload/sampling/statistics are unchanged, with exact adapter patches/provenance retained. The raw field lifeCloneMs now measures targeted copy preparation. All initial states match the previous batch, and all new-head final serialized states match the previous head.

New head has **3/180 raw breaches, all at tick 1**, and **0/165 warmed breaches**. Base has 3/180 raw and 1/165 warmed breaches. New − base pooled mean **+3.804 ms**, maximum **+16.611 ms**; warmed mean **+3.217 ms**, maximum **−8.325 ms**. New − previous head pooled mean **−4.058 ms**, maximum **−33.747 ms**; warmed mean **−4.788 ms**, maximum **−64.664 ms**. Direct life-step mean **3.022 → 1.616 ms (−46.5%)**; copy preparation **2.943 → 1.546 ms (−47.5%)**. Different batches/ambient load and the prior outlier limit causal conclusions. The earlier late tail was not reproduced, but strict <50 ms acceptance is not met by all cold ticks. No threshold or warm-up exemption was introduced.

## Exact-head gates and smoke

Start CPU **{machine['cpu'][0]['LoadPercentage']}%**; CPU/top processes and no competing test/build/review job are recorded before gates. Ports were free. Seven gates ran sequentially at this clean fixed HEAD/tree.

| Gate | Command | Result | Wall time |
|---|---|---|---:|
{table}

Same-shell echo records **CI=1** before full smoke. Smoke: **{smoke_passed} passed / {smoke_skipped} skipped**, exit {smoke['smokeExitCode']}, {smoke['seconds']:.3f} s. Failed smoke: {smoke_failed}. On failure every failed case is isolated once and recorded in smoke-isolated-summary.json. On success no isolated rerun is needed. `served-assets.json` checks both HTTP JS entry hashes against fresh gate-7 production bytes and served disk bytes. Regression assets are rebuilt by pretest:smoke. Sleep/resume events for the complete UTC gate/smoke window: **{sleep['eventCount']}**, using explicit SystemTime XPath. Final machine snapshot verifies clean status and free ports.

## Bundle and evidence

Production gzip: JS **{current['jsGzipKB']:.3f} kB / {current['jsGzipBytes']} bytes**, CSS **{current['cssGzipKB']:.3f} kB / {current['cssGzipBytes']} bytes**. Previous-head JS **{old['jsGzipKB']:.3f} kB**, CSS **{old['cssGzipKB']:.3f} kB**. Main owner baseline remains JS 139.26 kB / CSS 7.15 kB (rounded). Raw file/gzip bytes/hashes are in bundle-results.json; lossless base64 artifacts and exported raw UTF-8 text accompany the measurement script. Embedded build SHA also changes bundle bytes, so size deltas are measurements, not exact attribution to the expression alone.

All scripts, logs, profile CPU traces and per-tick JSON are local evidence. Playwright outputs remain outside this folder under `{LOCAL}` and are listed in LOCAL-ONLY.json. Nested profile and fix manifests, plus the parent top manifest, cover every file except each manifest's own scope. Prior parent README/results/manifest are retained as history. Independent review and docs-branch evidence publication remain Orchestrator responsibilities.
'''
(OUT/'README.md').write_text(readme,encoding='utf-8')
parent_readme=(PARENT/'README.md').read_text(encoding='utf-8')
if '## Historical evidence before fix round 1' not in parent_readme:
    first,rest=parent_readme.split('\n',1)
    latest=f'''\n\n**Current head: `{pin['head']}`, tree `{pin['tree']}`. Fix round 1 is implemented and verified; performance acceptance remains HOLD for cold-tick breaches.** Owner: "Remove the extra clone (Recommended)"; binding correction 5 at 25b82ac. See [fix-round1/README.md](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/README.md) and [fix-round1/results-summary.json](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/results-summary.json) for the exact one-line diff, before/after tests, new profiles, exact-head gates/smoke and bundle. No push, PR creation or merge.\n\n## Historical evidence before fix round 1\n'''
    (PARENT/'README.md').write_text(first+latest+rest,encoding='utf-8')
root_summary={'status':result['status'],'head':pin['head'],'tree':pin['tree'],'previousHead':pin['previousHead'],'base':pin['base'],'branch':pin['branch'],'gitStatus':'','bindingPlan':'binding-plan-25b82ac.md','latestEvidence':'fix-round1/results-summary.json','historicalSummary':'fix-round1/prior-parent-results-summary.json','unitPassed':units,'smokePassed':smoke_passed,'smokeCI':'1','performanceAcceptance':'HOLD; raw cold tick breaches retained','noPushPrMerge':True}
(PARENT/'results-summary.json').write_text(json.dumps(root_summary,indent=2)+'\n',encoding='utf-8')
with (PARENT/'progress.md').open('a',encoding='utf-8') as f:f.write('\nFix round 1: one-line NPC/life targeted-copy refactor committed at '+pin['head']+'. Existing tests unchanged; before 43, after 82, final unit '+str(units)+', CI=1 smoke '+str(smoke_passed)+'. Six matched profiles retained; raw cold-tick budget still breached, so performance acceptance remains HOLD. No push/PR/merge.\n')
print(json.dumps({'status':result['status'],'head':pin['head'],'tree':pin['tree'],'unitPassed':units,'smokePassed':smoke_passed,'smokeExit':smoke['smokeExitCode'],'bundle':current,'gateSleepEvents':sleep['eventCount']},indent=2))
