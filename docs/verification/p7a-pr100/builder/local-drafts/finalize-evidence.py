"""Finalize successful exact-head Builder evidence without changing product files."""
from pathlib import Path
import datetime as dt
import base64
import gzip
import hashlib
import json
import re
import subprocess
import sys

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
LOCAL=OUT.parent/'p7a-prB-local-only'
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
git=lambda *args:subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').strip()
pin=load('B2-head.json')
assert git('rev-parse','HEAD')==pin['head'] and git('rev-parse','HEAD^{tree}')==pin['tree']
assert git('status','--porcelain=v1')==''
assert load('B2-summary.json')['operationalExitCode']==0
smoke=load('smoke-result.json')
assert smoke['smokeExitCode']==0 and smoke['servedAssetsMatched'] and smoke['ci']=='1'
assert load('served-assets.json')['allObservedAndMatched']
assert load('final-machine.json')['portListeners']==[]
subprocess.run([sys.executable,'-X','utf8',str(OUT/'verify-edit-inventory.py'),'--mode','final'],check=True,cwd=ROOT,capture_output=True)
check=subprocess.run(['node','packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts'],cwd=ROOT,capture_output=True,check=True)
assert check.stdout==(ROOT/'packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.txt').read_bytes()
(OUT/'golden-path-diff-final.txt').write_bytes(check.stdout)

gate_names=['gate-1-diff.txt','gate-2-lint.txt','gate-3-typecheck.txt','gate-4-architecture.txt','gate-5-architecture-tests.txt','gate-6-unit.txt','gate-7-build.txt']
gate_labels=['git diff --check origin/main...HEAD','npm run lint','npm run typecheck','npm run check:architecture','npm run test:architecture','npm test','npm run build']
gates=[]
logs=[]
for index,(name,label) in enumerate(zip(gate_names,gate_labels,strict=True),1):
    text=(OUT/name).read_text(encoding='utf-8')
    assert 'HEAD='+pin['head'] in text and 'TREE='+pin['tree'] in text
    code=int(re.search(r'^EXIT_CODE=(\d+)$',text,re.M)[1]); assert code==0
    gates.append({'gate':index,'command':label,'exitCode':code,'seconds':float(re.search(r'^SECONDS=([\d.]+)$',text,re.M)[1]),'log':name})
    logs.append(text)
(OUT/'gates-1-7.txt').write_text('\n'.join(logs),encoding='utf-8')
unit_text=(OUT/'gate-6-unit.txt').read_text(encoding='utf-8')
units=int(re.search(r'Tests\s+(\d+) passed',unit_text)[1]); assert units==3074
smoke_text=(OUT/'smoke-CI1.txt').read_text(encoding='utf-8')
smoke_pass=int(re.search(r'(\d+) passed \(',smoke_text)[1])
skipped=re.search(r'(\d+) skipped',smoke_text)
smoke_skipped=int(skipped[1]) if skipped else 0
assert not re.search(r'\d+ failed\s*\(',smoke_text)
assert 'CI=1' in smoke_text
sleep=load('sleep-resume-events.json')
machine=load('gate-start-machine.json')
bundle=load('bundle-results.json')
for entry in bundle['files']:
    if not entry['entry']:continue
    artifact=load('bundle-'+Path(entry['file']).name+'.raw.json')
    raw=base64.b64decode(artifact['raw'],validate=True)
    compressed=base64.b64decode(artifact['gzip'],validate=True)
    assert hashlib.sha256(raw).hexdigest()==entry['sha256']
    assert hashlib.sha256(compressed).hexdigest()==entry['gzipSha256']
    assert len(raw)==entry['bytes'] and len(compressed)==entry['gzipBytes']
    assert gzip.decompress(compressed)==raw
    raw.decode('utf-8')
    (OUT/('bundle-'+Path(entry['file']).name+'.raw.txt')).write_bytes(raw)
perf=load('perf-GREEN.json'); first=load('perf-GREEN.json.attempt1')
assert perf['exitCode']==0 and first['exitCode']==1
assert perf['sourceSha256']==first['sourceSha256'] and perf['finalSessionSha256']==first['finalSessionSha256']
for path,digest in perf['sourceSha256'].items():
    assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==digest
local_files=[]
if LOCAL.exists():
    for path in sorted(LOCAL.rglob('*')):
        if path.is_file():local_files.append({'path':str(path),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(OUT/'LOCAL-ONLY.json').write_text(json.dumps({'root':str(LOCAL),'reason':'Playwright output remains outside the UTF-8 evidence folder. Do not publish traces without independent review.','files':local_files},indent=2)+'\n',encoding='utf-8')

result={'head':pin['head'],'tree':pin['tree'],'base':pin['base'],'branch':pin['branch'],'gitStatus':'','commit':git('log','-1','--format=%B'),'utc':dt.datetime.now(dt.timezone.utc).isoformat(),'gates':gates,'gateStartCpu':machine['cpu'],'gateStartTopProcesses':machine['topProcesses'],'competingJobsAtStart':machine['competingJobs'],'portsAtStart':machine['portListeners'],'portsAtEnd':load('final-machine.json')['portListeners'],'unitPassed':units,'unitFiles':131,'smokePassed':smoke_pass,'smokeSkipped':smoke_skipped,'smokeCI':'1','smokeSeconds':smoke['seconds'],'servedAssetsMatched':True,'sleepResumeEvents':sleep['eventCount'],'editInventoryCount':13,'approvedExistingTransformations':9,'approvedWhitespaceDelta':'W01','newTests':43,'hashPinChanges':[],'goldenGenerationCount':1,'goldenAllowedLeaves':42,'goldenForbiddenLeaves':0,'perfMaxMs':{'firstEndWeek':first['endWeek']['max'],'confirmationEndWeek':perf['endWeek']['max'],'confirmationLife':perf['life']['max']},'bundle':bundle,'noPushPrOrMerge':True,'independentReview':'Owned by Orchestrator; not claimed by Builder'}
(OUT/'results-summary.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
table='\n'.join(f"| {g['gate']} | `{g['command']}` | PASS (exit 0) | {g['seconds']:.3f} s |" for g in gates)
current=bundle['current']; delta=bundle['deltaKB']
readme=f'''# P7-A PR B — Builder evidence

**B0–B2 complete at the exact head below.** Local Builder handoff only; no push, PR or merge. Independent review and evidence publication on the WP docs branch belong to the Orchestrator. This folder has no independent review verdict and is not a G5 approval.

| Revision | Value |
|---|---|
| HEAD | `{pin['head']}` |
| Tree | `{pin['tree']}` |
| Base | `{pin['base']}` |
| Branch | `{pin['branch']}` |
| Git status | Empty |
| Commit | `feat(simulation): npc stress, exhaustion, ageing and history` |
| Trailer | `Co-authored-by: Codex <noreply@openai.com>` |

Owner Tân, 2026-11-17: "Giao Builder B". Step 0 released by "Approve D1–D4 as written (Recommended)". `STEP0-HOLD.md` remains the original historical HOLD; `B0-owner-approval.json` releases precisely E01–E09/W01 and the 13 paths. No new scope decision was needed.

## Behavior and scope

Weekly life resolves after the tile week using the new clock and Authority. Stress, exhaustion/recovery, Arousal, birthdays, bounded event history, exhausted post-effect exclusion and optional report notes follow Decisions 5–7. Post assignments stay present during exhaustion. NPC health is unchanged. The ruleset remains tile-society-10. No new save fields, migration, UI product code, dependencies, timeout or configuration change.

`edit-inventory-final.json`, verified with `python verify-edit-inventory.py --mode final`, covers exactly 13 paths (9 existing, 4 new), all 9 approved transformations and W01. All 3 existing test source files and 3 generated data artifacts exactly match the approved after-bytes. Every other baseline tracked file is protected by its raw SHA256, including existing EOF newlines. W01 alone normalizes the generated golden CRLF→LF. The local PR A branch remains at 56124513aef2d85de128fe76bf3001654290c1c0. The single assigned worktree was reused; storage reclaimed: 0 bytes.

## RED and GREEN

Full RED before product edits: **46 failed / 156 passed in 10 files**, including all 43 new acceptance cases and three approved legacy assertions. RED perf failed because the weekly API did not exist. `B1-RED-product-state.json` proves the product sources were unchanged after RED. Targeted GREEN: **151/151 in 6 files**. B1 full GREEN: **3074/3074 in 131 files**. Precommit lint/typecheck also pass. No tests or thresholds were weakened.

The golden was regenerated **once**, using the unchanged generator. The two approved fixtures were regenerated with their unchanged targeted generators. `golden-generation-count.txt`, `B1-generated-byte-verification.json`, and the committed `p7a-week-path-diff.ts/.txt` prove **42 allowed life leaves, zero forbidden paths**, identical envelopes/ruleset/outer golden metrics, 71 unchanged fixtures (63 historical, 8 current), and 11 unchanged generator/earlier-evidence blobs. Final replay is `golden-path-diff-final.txt`. `hash-pin-changes.json` records all 3 generated artifact before/after hashes; assertion, catalog and craft-week city/report/item hash pins have **zero changes**.

## Performance

`measure-npc-life.mjs` measures 100 adult NPCs across 60 full END_WEEK ticks, plus the pure life step separately, with strict **max <50 ms** assertions. All raw per-tick samples and final sessions are retained. First GREEN attempt at 6% CPU: END_WEEK max **{first['endWeek']['max']:.4f} ms**, life max **{first['life']['max']:.4f} ms**, exit 1. Unchanged confirmation at 2% CPU: END_WEEK max **{perf['endWeek']['max']:.4f} ms**, mean **{perf['endWeek']['mean']:.4f} ms**; life max **{perf['life']['max']:.4f} ms**, mean **{perf['life']['mean']:.4f} ms**, exit 0. Both attempts have identical source and final-state hashes. The timing variation's cause is unconfirmed; no warm-up samples were discarded and no code, timeout, threshold or config changed between runs. Attempt 1 is preserved in `*.attempt1`; `B1-GREEN-perf-confirmation.txt` is the passing log. This is one failed measurement followed by a passing second measurement, not a claim that every observed tick in both attempts was under budget.

## Exact-head gates

Gate start UTC: `{machine['utc']}`. CPU: **{machine['cpu'][0]['LoadPercentage']}%**, 8 logical processors. Top process counters and no competing test/build/review jobs are recorded in `gate-start-machine.json`. Ports 4173/4174 were free. Gates ran sequentially with unchanged HEAD/tree and empty status. Every log includes HEAD, tree, UTC, command, CPU context and exit code.

| Gate | Command | Result | Wall time |
|---|---|---|---|
{table}

Same-shell `echo "CI=$env:CI"` recorded **CI=1** immediately before the full `CI=1 npm run test:smoke`: **{smoke_pass} passed, {smoke_skipped} skipped**, exit 0, {smoke['seconds']:.3f} s. The unchanged root production build came from gate 7; pretest:smoke built regression assets freshly. `served-assets.json` proves both HTTP entry assets match the fresh head production JS SHA256 and their served disk assets. No reused server. `smoke-CI1.txt`, `smoke-ci.txt`, `smoke-result.json` retain the command and full output. No isolated rerun was needed. The whole gate/smoke window is covered by `sleep-resume-events.json`: **{sleep['eventCount']} sleep/resume events**. Final ports are free and status is empty.

## Bundle and artifacts

Production entry gzip: JS **{current['jsGzipKB']:.2f} kB** ({current['jsGzipBytes']} bytes), CSS **{current['cssGzipKB']:.2f} kB** ({current['cssGzipBytes']} bytes). Owner-provided main baseline: JS 139.26 kB, CSS 7.15 kB; rounded deltas JS **{delta['js']:+.2f} kB**, CSS **{delta['css']:+.2f} kB**. Baselines are rounded, so sub-0.01 kB deltas are not precise byte comparisons. `measure-bundle.mjs` and `bundle-results.json` record the script, raw file/gzip hashes and exact bytes. `bundle-*.raw.json` contains lossless base64 raw/gzip artifacts while keeping this evidence UTF-8 only. Playwright outputs stay in sibling `p7a-prB-local-only`; `LOCAL-ONLY.json` lists every retained file with its SHA256.

`results-summary.json` is the machine-readable final report. `gates-1-7.txt` combines the full seven logs. `verify-evidence-manifest.py --write` regenerates the top manifest; without `--write` it verifies every file except that top manifest, including historical/nested manifests. All evidence text is checked as UTF-8 and owner quotes are preserved. No docs file is on the product branch. The top manifest will be refreshed and verified after this finalization script.
'''
(OUT/'README.md').write_text(readme,encoding='utf-8')
with (OUT/'README.md').open('a',encoding='utf-8') as log:
    log.write('\nThe final sleep audit uses explicit UTC SystemTime XPath and independently checks returned XML timestamps. The earlier FilterHashtable query interpreted dates in local time and included an 08:36 UTC event outside the 15:06–15:47 UTC gate window; its raw result is preserved in sleep-resume-events-filterHashtable-history.json. verify-sleep-window.ps1 corrects the query without rerunning or changing any gate/product/test. The exact UTC gate/smoke and performance windows both contain zero sleep/resume events. Lossless bundle artifacts are also exported as UTF-8 bundle-*.raw.txt, with raw/gzip lengths and SHA256 verified before export.\n')
if f"B2 complete at {pin['head']}" not in (OUT/'progress.md').read_text(encoding='utf-8'):
    with (OUT/'progress.md').open('a',encoding='utf-8') as log:log.write(f"\nB2 complete at {pin['head']}. Seven gates pass, {units} unit tests; CI=1 full smoke {smoke_pass} pass/{smoke_skipped} skipped; fresh served assets match both ports; final ports free/status empty. No push, PR or merge. Evidence finalized locally for Orchestrator review.\n")
print(json.dumps({'head':pin['head'],'tree':pin['tree'],'gates':gates,'unitPassed':units,'smokePassed':smoke_pass,'smokeSkipped':smoke_skipped,'bundle':current,'sleepEvents':sleep['eventCount']},indent=2))
