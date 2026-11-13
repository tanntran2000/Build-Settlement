from pathlib import Path
import subprocess, json, hashlib, datetime, re

p=Path(__file__).parent
def git(*args): return subprocess.check_output(['git',*args],encoding='utf8').strip()
head,tree=git('rev-parse','HEAD'),git('rev-parse','HEAD^{tree}')
assert git('status','--short')==''
gates=json.loads((p/'gate-results.json').read_text(encoding='utf8'))
assert len(gates)==7 and all(row['exit']==0 for row in gates)
smoke=(p/'smoke.txt').read_text(encoding='utf8')
assert 'Exit: 1' in smoke and '\nCI=1\n' in smoke
assert 'http://localhost:4173 is already used' in smoke
bundle=json.loads((p/'final-bundle-sizes.json').read_text(encoding='utf8'))
zero=json.loads((p/'inspector-zero-byte.json').read_text(encoding='utf8'))
assert bundle['head']==head and zero['head']==head
files=git('diff','--name-only','abf206a..HEAD').splitlines()
assert files==['packages/ui/src/__tests__/data-inspector.test.ts','packages/ui/src/main.ts']
(p/'final-diff.patch').write_bytes(subprocess.check_output(['git','diff','abf206a..HEAD','--',*files]))
(p/'status-short.txt').write_text(subprocess.check_output(['git','status','--short'],encoding='utf8'),encoding='utf8')
(p/'head-tree.txt').write_text(f'HEAD: {head}\nTree: {tree}\nPR base: 5ff521e3971739ecde05a22dd96c74827c0ae363\nFix parent: abf206a33a445706bf8f17f9791a61ceb8740b27\nUTC: {datetime.datetime.now(datetime.timezone.utc).isoformat()}\n',encoding='utf8')
table='\n'.join(f"| {i+1} | `{r['command']}` | {r['exit']} | [{r['log']}]({r['log']}) |" for i,r in enumerate(gates))
totals=[line.strip() for line in smoke.splitlines() if re.search(r'\d+ (?:passed|failed|skipped)',line)]
js=next(f for f in bundle['files'] if f['name'].endswith('.js'))
css=next(f for f in bundle['files'] if f['name'].endswith('.css'))
assert js['gzipBytes']<=108329+137
readme=f'''# DATA-01 PR C review fix round 1

Status: **HOLD — full smoke could not start because port 4173 was already occupied.** No browser test ran. Ports 4173 and 4174 were both occupied on the final scoped listener check. No unknown listener was killed or process/WMI scan performed. Claude must free those ports and release the HOLD before a new full smoke is attempted.

PR: https://github.com/tanntran2000/Build-Settlement/pull/92 (already open/pushed by Orchestrator before this round).
Tested HEAD: `{head}`. Tree: `{tree}`.
PR base: `5ff521e3971739ecde05a22dd96c74827c0ae363`.
Fix parent: `abf206a33a445706bf8f17f9791a61ceb8740b27`.
Branch: feat/data01-inspector. Builder: Codex. Date: 2026-11-13.
Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01.

## Finding and fix

Astra P2: inspector startup initialized the error log and installed normal runtime handlers. Malformed stored logs could be deleted and runtime errors/rejections could be persisted while inspecting, violating spec §8. The source review and its thread link are in review.md; that FAIL is the input to this round, not a fresh verdict at the new head.

main.ts now computes DEV inspector mode first. Only the inspector is mounted on that route. The normal branch retains the original initialize('weekly'), error handler, unhandledrejection handler, pagehide handler, and normal mount, in that order. Handler bodies, mount target and normal logging behavior are unchanged. The dynamic inspector import retains the explicit DEV guard; production ignores the inspector query parameter.

## RED → GREEN

red-startup.txt: 1 failed/79 passed (80), exit 1. Inspector startup called initialize('weekly') before the fix. Both normal-startup cases and all 57 unchanged existing error-log tests passed. This RED ran before the main.ts product edit.

green-startup.txt: 81/81 passed including the build test and all 57 existing error-log tests. Production child duration: 11829 ms, logged by the test. Inspector startup with malformed stored JSON performs no setItem/removeItem, preserves the bytes, calls no initialize and registers no runtime handlers. Normal DEV startup and production with an inspector query still initialize, preserve handler order/semantics, and mount the normal app.

Optional malformed-stored-ref regression passes: an otherwise valid entry containing ref='Jane Doe' loads without the ref and without discarding the entry. No error-log.ts change.

The test imports the real main module and real logger; only the Svelte components/mount are mocked. No new helper, dependency, timeout, config, existing-test or other product file change. A subsequent type-only `as const` tuple annotation precedes successful precommit typecheck and the final full-unit gate. Precommit log HEAD/tree identify the checkout parent, with uncommitted test/product edits; exact-head gates below cover the final committed source.

## Gates at the clean final head

| Gate | Command | Exit | Log |
| --- | --- | --- | --- |
{table}

The gates ran in order, one runner at a time, followed by the full smoke attempt. smoke.sh exports CI=1, immediately echoes `CI=$CI` as `CI=1`, and runs `CI=1 npm run test:smoke` in the same Bash shell. Full output: smoke.txt. Exit **1**, startup failure: `http://localhost:4173 is already used`. Browser-test total: **0 started, 0 passed, 0 failed**; no test-suite PASS is claimed. There is no failed test case to rerun in isolation. No isolated test or full-smoke rerun was attempted. The immediately previous head's 350/350 smoke is not evidence for this new head.

## Production measurement

Pinned-main production baseline: JS 108329 gzip bytes, CSS 5814 bytes (copied base-bundle-sizes.json; raw base artifacts and capture script remain in ../baseline-bundle-artifacts and ../measure-base-bundle.mjs).
Final JS: {js['gzipBytes']} gzip bytes, delta {js['gzipDeltaFromBase']:+d}; CSS: {css['gzipBytes']}, delta {css['gzipDeltaFromBase']:+d}. JS stays within main +137 bytes and under 200 kB. Metadata: final-bundle-sizes.json; raw artifacts: final-bundle-artifacts/. Measurement script asserts the +137-byte ceiling.

Inspector control: same ref API in both variants; control supplies only pinned-original main.ts in memory, without writing repository files or dist. Inspector added JS bytes: {zero['inspectorAddedJsBytes']}. Actual raw delta: {zero['rawByteDelta']:+d} bytes; current/control gzip: {zero['currentGzipBytes']}/{zero['controlGzipBytes']}. See inspector-zero-byte.txt and its script/control artifact. Production exclusion is also checked by the test that builds its own dist.

## Scope and handoff

Commit: fix(ui): keep the inspector route free of error-log storage. Body names Astra P2 and ends with Co-authored-by: Codex <noreply@openai.com>.

Edit inventory: main.ts startup routing only; data-inspector.test.ts startup regression plus optional malformed-stored-ref regression and mock cleanup. final-diff.patch captures the full two-file change from the pushed parent. Existing tests and inspector-build timeout remain unchanged. No amend, push, force push, PR creation or merge. One product fix attempt succeeded; no runner concurrency deviation.

T3 PR-link attempt failed: 'Pass threadId: this MCP client is not running inside a T3 thread.' The existing GitHub PR was not edited. Orchestrator retains PR ownership/publication.

The assigned worktree is retained. Ports are recorded in ports.txt: 3000 free, 4173 and 4174 occupied. Builder has no running server/test runner left from this round. Evidence is local for Orchestrator publication to the WP docs branch before G5 per AGENTS §6. All text is UTF-8; Tân, RED → GREEN and §8 are verified. SHA256SUMS.txt hashes every evidence file except itself.
'''
(p/'README.md').write_text(readme,encoding='utf8')
assert all(t in (p/'README.md').read_text(encoding='utf8') for t in ['Tân','RED → GREEN','§8'])
hashes=[]
for f in sorted(p.rglob('*')):
 if f.is_file() and f.name!='SHA256SUMS.txt':
  hashes.append(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(p).as_posix())
(p/'SHA256SUMS.txt').write_text('\n'.join(hashes)+'\n',encoding='utf8')
print(f'HEAD={head}\nTree={tree}\nEvidence files hashed={len(hashes)}\nUTF8 verified')
