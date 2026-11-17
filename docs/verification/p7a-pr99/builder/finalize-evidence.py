"""Assemble the Builder handoff only after all exact-head gates and smoke pass."""
import datetime as dt
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import tarfile

sys.stdout.reconfigure(encoding='utf-8')
root=Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
out=Path(__file__).resolve().parent
base='753e4503673df86830fba2ef2c9ef1e64a843729'
def git(*args): return subprocess.check_output(['git',*args],cwd=root).decode('utf-8').strip()
def read(name): return (out/name).read_text(encoding='utf-8-sig')
def sha(data): return hashlib.sha256(data).hexdigest()
head=git('rev-parse','HEAD'); tree=git('rev-parse','HEAD^{tree}')
hold='--hold' in sys.argv
assert head=='56124513aef2d85de128fe76bf3001654290c1c0'
assert tree=='d2f31706d77d308a310b61857a8b293a898280e7'
assert git('status','--porcelain=v1')==''
assert git('rev-parse','origin/main')==base
names=['gate-1-diff.txt','gate-2-lint.txt','gate-3-typecheck.txt','gate-4-architecture.txt','gate-5-architecture-tests.txt','gate-6-unit.txt','gate-7-build.txt']
gates=[]; previous=None
for number,name in enumerate(names,1):
    log=read(name)
    assert f'HEAD={head}\n' in log and f'TREE={tree}\n' in log and f'INDEX_TREE={tree}\n' in log,name
    assert re.search(r'^EXIT_CODE=0$',log,re.M),name
    assert log.split('WORKING_STATUS:\n',1)[1].split('OUTPUT:\n',1)[0].strip()=='',name
    start=dt.datetime.fromisoformat(re.search(r'^UTC_START=(.+)$',log,re.M)[1])
    end=dt.datetime.fromisoformat(re.search(r'^UTC_END=(.+)$',log,re.M)[1])
    if previous: assert start>=previous, 'Gate order changed'
    previous=end
    gates.append({'gate':number,'file':name,'command':json.loads(re.search(r'^COMMAND=(.+)$',log,re.M)[1]),'exitCode':0,'seconds':float(re.search(r'^SECONDS=(.+)$',log,re.M)[1]),'utcStart':start.isoformat(),'utcEnd':end.isoformat()})
smoke=read('smoke-CI1.txt')
assert f'HEAD={head}\n' in smoke and f'TREE={tree}\n' in smoke
assert re.search(r'^CI=1$',smoke,re.M)
smoke_code=int(re.search(r'^EXIT_CODE=(\d+)$',smoke,re.M)[1])
assert (smoke_code!=0 if hold else smoke_code==0)
assert read('smoke-ci.txt').strip()=='CI=1'
clean_smoke=re.sub(r'\x1b\[[0-9;]*m','',smoke)
passed=re.findall(r'(\d+) passed\s*\(',clean_smoke)
assert passed,'Smoke passed total not found'
smoke_passed=int(passed[-1])
skipped=re.findall(r'^\s*(\d+) skipped\s*$',clean_smoke,re.M)
smoke_skipped=int(skipped[-1]) if skipped else 0
failed=re.findall(r'^\s*(\d+) failed\s*$',clean_smoke,re.M)
smoke_failed=int(failed[-1]) if failed else 0
isolated=[]
if hold:
    for p in sorted(out.glob('smoke-isolated-*.txt')):
        log=p.read_text(encoding='utf-8-sig')
        assert f'HEAD={head}' in log and re.search(r'^CI=1$',log,re.M),p
        assert re.search(r'Running 1 test using 1 worker',log),p
        isolated.append({'file':p.name,'exitCode':int(re.search(r'^EXIT_CODE=(\d+)$',log,re.M)[1])})
    assert smoke_failed>0 and len(isolated)==smoke_failed,'Every failed smoke case needs one isolated rerun'
assert '3031 passed' in read('gate-6-unit.txt')
assert re.search(r'(?:pass|passed)\s+154',read('gate-5-architecture-tests.txt'))
machine=json.loads(read('gate-start-machine.json'))
assert machine['head']==head and machine['tree']==tree
assert not machine['competingJobs'] and not machine['portListeners']
assert 'GENERATOR_INVOCATIONS=1' in read('golden-generation-count.txt')
bundle=json.loads(read('bundle-results.json'))
assert bundle['head']==head and bundle['tree']==tree
for item in bundle['files']:
    if item['entry']:
        artifact=out/('bundle-'+Path(item['file']).name+'.gz')
        assert sha(artifact.read_bytes())==item['gzipSha256']
        assert sha(gzip.decompress(artifact.read_bytes()))==item['sha256']
inventory=json.loads(read('edit-inventory-final.json'))
assert inventory['mode']=='final' and inventory['head']==head and inventory['tree']==tree
assert inventory['pathCount']==60 and inventory['existingTestFilesVerifiedExactly']==35
assert not inventory['unexpectedPaths'] and not inventory['unapprovedExistingTestEdits']
pathlog=read('A3-final-path-diff.txt')
assert f'HEAD={head}' in pathlog and '841 allowed state leaves' in pathlog and 'forbidden paths=0' in pathlog

# Verify committed bytes through a canonical Git archive. This is an evidence
# artifact, never an additional checkout or execution environment.
archive=subprocess.check_output(['git','-c','core.autocrlf=false','archive','--format=tar','HEAD'],cwd=root)
(out/'product-head.tar').write_bytes(archive)
archive_rows=[]
with tarfile.open(fileobj=io.BytesIO(archive),mode='r:') as tar:
    for item in inventory['files']:
        data=tar.extractfile(item['path']).read()
        blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
        assert blob==item['finalGitBlob'],item['path']
        archive_rows.append({'path':item['path'],'gitBlob':blob,'archiveSha256':sha(data),'bytes':len(data)})
(out/'archive-verification.txt').write_text(json.dumps({'head':head,'tree':tree,'command':'git -c core.autocrlf=false archive --format=tar HEAD','archiveSha256':sha(archive),'verifiedFiles':archive_rows},indent=2)+'\n',encoding='utf-8')

# Pin provenance: preserve every approved before/after string and verify actual data.
pins=json.loads(read('step0-scan-summary.txt'))['pins']
catalog=json.loads((root/'packages/core/src/data/npc-life.json').read_text(encoding='utf-8'))
tuning=json.loads((root/'packages/core/src/data/tuning.json').read_text(encoding='utf-8'))
views={'SOCIETY_TRIAL':tuning['SOCIETY_TRIAL'],'NPC_ORIGINS':catalog['origins'],'NPC_HOBBIES':catalog['hobbies'],'P7A_TRIAL':catalog['P7A_TRIAL']}
for name,value in views.items(): assert sha(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode())==pins[name]['after']
citypins=json.loads(read('A2-HOLD-proposed-edits.json'))
for item in citypins: assert item['after'] in (root/item['file']).read_text(encoding='utf-8')
(out/'hash-pin-changes.json').write_text(json.dumps({'catalogs':pins,'cityPins':citypins,'reportAndItemPinsUnchanged':True,'approval':'Plan corrections 1 and 2; binding-plan-13cb618.md'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

added=subprocess.check_output(['git','diff','--unified=0',base,'HEAD'],cwd=root).decode('utf-8')
added_lines='\n'.join(line[1:] for line in added.splitlines() if line.startswith('+') and not line.startswith('+++'))
secret=re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:AKIA|ASIA)[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}')
assert not secret.search(added_lines),'Credential pattern detected'
(out/'added-lines-secret-scan.txt').write_text(f'HEAD={head}\nTREE={tree}\nUTC={dt.datetime.now(dt.timezone.utc).isoformat()}\nSCOPE=added diff lines only\nPATTERNS=private-key headers, AWS access keys, GitHub token prefixes, API key prefixes\nMATCHES=0\nEXIT_CODE=0\n',encoding='utf-8')
(out/'product-diff.patch').write_bytes(subprocess.check_output(['git','diff','--binary',base,'HEAD'],cwd=root))
(out/'gates-1-7.txt').write_text('\n\n'.join(f'GATE {i}\n'+read(name) for i,name in enumerate(names,1)),encoding='utf-8')

cpu=machine['cpu'][0]['LoadPercentage']
summary={'taskState':'A3 HOLD' if hold else 'A0-A3 complete','head':head,'tree':tree,'base':base,'utc':dt.datetime.now(dt.timezone.utc).isoformat(),'gitStatus':'','gates':gates,'cpuAtGateStartPercent':cpu,'architectureTestsPassed':154,'unitPassed':3031,'smoke':{'ci':'1','passed':smoke_passed,'failed':smoke_failed,'skipped':smoke_skipped,'exitCode':smoke_code,'isolatedReruns':isolated},'bundle':bundle['current'],'editInventoryPaths':60,'existingTestFilesExact':35,'approvedLineEditsTotal':53,'goldenGeneratorInvocations':1,'goldenSeeds':3,'v10Fixtures':10,'allowedChangedLeaves':841,'forbiddenChangedPaths':0,'historicalFixturesUnchanged':63,'protectedGeneratorEvidenceBlobsUnchanged':9,'independentTester':'Claude (pending handoff)','independentReviewer':'Astra (pending handoff)','pushPrMerge':'not performed','storageReclaimedBytes':0}
(out/'results-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

review=f'''# Builder author review — PR A

HEAD {head}; tree {tree}; base {base}. This is an author review, not an independent Astra verdict.

- Scope: final-mode verifier confirms all 60 paths and every existing-test byte against E01–E53. Only the nine named product files changed; no weekly simulation code, UI product code, docs, dependency manifest or lockfile changed.
- Review Focus 5: the A1 acceptance tests and final 3,031-test suite cover unknown origin/hobby, duplicates, stat 101, caps 101/201/301, and 21 history events. StoreRecordError identifies characters:npc_starter_1; stored records and checkpoint bytes remain unchanged on refusal.
- Current v10 strictly requires life. Historical 01–09 uses the approved old three-key validator solely for the unchanged refusal path, with all historical fixture tests retained. No migration or life injection.
- The independent NPC life stream uses the existing seeded PRNG. Golden/fixture path verification proves all pre-existing NPC fields (including health), reports, seed summaries and other state unchanged except the approved ruleset envelope/state paths. Starter shown ages remain 27/31/24 at week 1.
- Fixed shape/ranges, distinct hobbies, seeded construction, age/title boundaries, hostile descriptors/symbols/prototypes and persistence round trips are covered. Exhaustion recovery and weekly/report/UI behavior remain PR B/C scope.

No source defect or deferred minor was identified in this author pass. Verification status: {'HOLD because the full smoke run failed; see smoke-CI1.txt and the isolated rerun logs' if hold else 'all requested local gates and smoke passed'}. Claude's independent testing and Astra's review remain pending. No subagent or separate execution environment was created.
'''
(out/'builder-author-review.md').write_text(review,encoding='utf-8')

gate_table='\n'.join(f"| {g['gate']} | `{' '.join(g['command'])}` | 0 | {g['seconds']:.3f} | [{g['file']}]({g['file']}) |" for g in gates)
readme=f'''# P7-A PR A — Builder handoff

**{'A0–A2 complete; A3 HOLD' if hold else 'A0–A3 complete'} at local HEAD `{head}`**, tree `{tree}`. Base `{base}`. Product git status is empty. No push, PR or merge, as instructed. PR number: not assigned. Builder: Codex. Date: {dt.datetime.now(dt.timezone.utc).date().isoformat()} UTC.

## Binding owner decisions

Owner Tân, 2026-11-17, verbatim:

1. "Duyệt P7-A"
2. "Duyệt, giao Builder A"
3. "Approve all 4 (Recommended)"
4. "Approve E51–E53"

`binding-plan-13cb618.md` is the binding plan and contains corrections 1–2. Earlier binding copies and both HOLD reports are retained as historical evidence. Those HOLDs are closed by the quoted owner decisions.

## Commits and RED → GREEN

| Task | Commit | Verification |
|---|---|---|
| A1 | `927f5be7bb0de8b3fff884daa3da89e98ae03e9e` — feat(core): npc life sheet state and catalog | RED 73 failed / 213 passed; GREEN 286/286 across six files, exit 0 |
| A2 | `{head}` — feat(core): ruleset 10 with npc life | RED 82 failed / 88 passed; pre-correction full suite 3 failed / 3,028 passed; owner-approved E51–E53; GREEN 3,031/3,031 across 130 files, exit 0 |

Both commits end with `Co-authored-by: Codex <noreply@openai.com>`. RED logs precede each task's product edits. A1 also retained the original and corrected core typecheck logs for a new-test symbol-index typing error; one test-only correction, then exit 0. No existing assertion, timeout or threshold was changed beyond the approved exact transformations.

## Exact-head gates

CPU at gate start: **{cpu}%**, 8 logical processors. `gate-start-machine.json` contains the UTC sample, instantaneous top processes, zero competing test/build/review commands and no listeners on 4173/4174. Gates ran sequentially at the same clean head/tree.

| Gate | Command | Exit | Seconds | Full log |
|---|---|---:|---:|---|
{gate_table}

Architecture tests: **154 passed**. Unit tests: **3,031 passed / 130 files**. `gates-1-7.txt` concatenates all seven full logs with commands, HEAD/tree, UTC and exit codes.

Full smoke: **{smoke_passed} passed, {smoke_failed} failed, {smoke_skipped} skipped**, exit **{smoke_code}**, with **CI=1**. `smoke-CI1.txt` records the environment and full command/output; `smoke-ci.txt` records the actual echo. PowerShell used `$env:CI = '1'` and `echo "CI=$env:CI"` in the same shell as the seven gates and `npm run test:smoke`, equivalent to `CI=1 npm run test:smoke`. {'Each failed test was rerun alone exactly once; see smoke-isolated-*.txt. The required HOLD remains in force regardless of isolated results. Windows sleep/resume during the full run is recorded in smoke-machine-suspend.json; this is evidence of an interrupted run, not a claim that the full smoke passed.' if hold else 'No smoke rerun was needed.'} Both ports were checked before smoke; final ports are recorded in `final-state.txt`.

## Inventory, pins and golden

- `verify-edit-inventory.py --mode final` and `edit-inventory-final.json`: **60 approved paths; 35 existing test files exactly match E01–E53**. No other existing-test edits, docs, dependency changes or UI/weekly product code.
- `hash-pin-changes.json`: full old → new catalog pins for SOCIETY_TRIAL, NPC_ORIGINS, NPC_HOBBIES, P7A_TRIAL, plus the three city pins. Report/item pins remain unchanged. `craft-pin-investigation.json` and raw seed artifacts show that changing only the in-memory city ruleset back to 09 recovers the original pins.
- Golden regenerated **once**, using the unchanged generator. `golden-generation-count.txt`, `A2-golden-generation.txt` and `catalog-golden-before.json` retain the command/provenance and original bytes.
- `A3-final-path-diff.txt`: **3 seeds, 10 v10 scenarios, 841 allowed state leaves, zero forbidden paths**, exact envelope-only 09 → 10 changes; **63 historical fixtures and 9 generator/evidence blobs unchanged**. Script/output are also committed on the product branch.
- `product-head.tar` was made by `git -c core.autocrlf=false archive --format=tar HEAD`; `archive-verification.txt` verifies all 60 changed files against their committed Git blobs. `product-diff.patch` retains the full diff; `added-lines-secret-scan.txt` found zero targeted credential patterns in added lines.

## Production bundle versus main

The baseline is the owner's provided main measurement at `{base}`: JS **137.41 kB**, CSS **7.15 kB** gzip (decimal kB). The final production build is JS **{bundle['current']['jsGzipKB']:.2f} kB**, CSS **{bundle['current']['cssGzipKB']:.2f} kB** gzip. JS nominal delta **+{bundle['deltaKB']['js']:.2f} kB**; CSS unchanged at reported precision. The baseline is rounded to two decimals; the raw current result is {bundle['current']['jsGzipBytes']} JS bytes and {bundle['current']['cssGzipBytes']} CSS bytes gzip.

`measure-bundle.mjs` is the measurement script; `bundle-results.json` contains all per-file raw/compressed sizes and hashes. `bundle-*.gz` are raw measured production entry artifacts. They were captured directly after gate 7, before smoke's separate regression build. The bundle stays below the 200 kB gzip budget.

## Review and retained environment

`builder-author-review.md` is an author review only. Independent Tester Claude and Reviewer Astra verdicts/T3 links remain pending handoff; this package does not claim G4/G5 completion. Evidence is local by instruction and must later be committed by the Orchestrator/Tester on the WP docs branch before G5.

Reused and retained: `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01`, branch `feat/p7a-npc-life-data`, for independent testing/review. No worktree or clone was created or removed; other pre-existing environments were left untouched. Storage reclaimed: **0 bytes**.

All text evidence is UTF-8; Vietnamese owner quotes and — / → markers are checked. Binary archive/gzip artifacts are hashed as binary. SHA256SUMS.txt covers every file recursively except that top manifest itself, including nested manifests. Playwright traces remain outside this folder; any retained trace locations are listed in LOCAL-ONLY.txt.
'''
(out/'README.md').write_text(readme,encoding='utf-8')
traces=[]
for folder in [root/'test-results',root/'playwright-report',out.parent/'p7a-prA-local-only']:
    if folder.exists():
        for p in sorted(folder.rglob('*.zip')): traces.append({'path':str(p),'sha256':sha(p.read_bytes())})
(out/'LOCAL-ONLY.txt').write_text(json.dumps({'playwrightTracesInEvidenceFolder':False,'retainedOutsideEvidence':traces,'note':'Trace archives, if any, remain in the test runner outputs and are not copied into this evidence folder.'},indent=2)+'\n',encoding='utf-8')
with (out/'progress.md').open('a',encoding='utf-8') as f:
    f.write(f'\nA3 {"HOLD" if hold else "complete"} at {head}, tree {tree}: all seven gates exit 0; architecture 154/154; unit 3031/3031; smoke CI=1 {smoke_passed} passed, {smoke_failed} failed, {smoke_skipped} skipped; exit {smoke_code}. Isolated reruns: {isolated}. Production gzip JS {bundle["current"]["jsGzipKB"]:.2f} kB, CSS {bundle["current"]["cssGzipKB"]:.2f} kB. Final evidence/manifest verification follows.\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
