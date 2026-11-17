"""Finalize local Builder evidence only if the sole owner-approved full smoke passes."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import re
import shutil
import subprocess

OUT = Path(__file__).resolve().parent
RUN = OUT / 'full-smoke-rerun'
WORK = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
HEAD = '56124513aef2d85de128fe76bf3001654290c1c0'
TREE = 'd2f31706d77d308a310b61857a8b293a898280e7'
BASE = '753e4503673df86830fba2ef2c9ef1e64a843729'


def read(name):
    return (OUT / name).read_text(encoding='utf-8-sig')


def read_json(name):
    return json.loads(read(name))


def write(name, text):
    (OUT / name).write_bytes(text.encode('utf-8'))


def save_json(name, value):
    write(name, json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def git(*args):
    return subprocess.check_output(['git', *args], cwd=WORK, text=True, encoding='utf-8').strip()


assert git('rev-parse', 'HEAD') == HEAD
assert git('rev-parse', 'HEAD^{tree}') == TREE
assert git('branch', '--show-current') == 'feat/p7a-npc-life-data'
assert git('status', '--porcelain=v1') == ''
assert git('rev-parse', 'origin/main') == BASE
raw = read('full-smoke-rerun/full-smoke.txt')
plain = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', raw)
assert f'HEAD={HEAD}\n' in raw and f'TREE={TREE}\n' in raw and f'INDEX_TREE={TREE}\n' in raw
assert re.search(r'^CI=1$', raw, re.M) and re.search(r'^EXIT_CODE=0$', raw, re.M)
assert 'Running 387 tests using 1 worker' in plain
assert re.search(r'^\s*387 passed\s*\(', plain, re.M)
assert not re.search(r'^\s*\d+ (failed|skipped)\s*$', plain, re.M)
assert read('full-smoke-rerun/ci-echo.txt').strip() == 'CI=1'
run = read_json('full-smoke-rerun/smoke-result.json')
operation = read_json('full-smoke-rerun/summary.json')
assert run['smokeExitCode'] == 0 and run['servedAssetsMatched'] and run['gitStatusAfter'] == ''
assert operation['operationalExitCode'] == 0 and operation['gitStatus'] == ''
served = read_json('full-smoke-rerun/served-assets.json')
assert served['allObservedAndMatched'] and set(served['ports']) == {'4173', '4174'}
for port in served['ports'].values():
    assert port['matchesFreshHead'] and port['sha256'] == '7013ff433ef7c8f2880b23ee4d92adfb749c2d0a1deba5af41267243857fd820'
sleep = read_json('full-smoke-rerun/sleep-resume-events.json')
start = read_json('full-smoke-rerun/start-machine.json')
pre = read_json('full-smoke-rerun/pre-smoke-machine.json')
final = read_json('full-smoke-rerun/final-machine.json')
for machine in (start, pre, final):
    assert machine['head'] == HEAD and machine['tree'] == TREE
    assert not machine['competingJobs'] and not machine['portListeners']
build = read('full-smoke-rerun/production-build.txt')
assert f'HEAD={HEAD}\n' in build and re.search(r'^EXIT_CODE=0$', build, re.M)
previous_end = None
for name in ('gate-1-diff.txt', 'gate-2-lint.txt', 'gate-3-typecheck.txt', 'gate-4-architecture.txt',
             'gate-5-architecture-tests.txt', 'gate-6-unit.txt', 'gate-7-build.txt'):
    log = read(name)
    assert f'HEAD={HEAD}\n' in log and f'TREE={TREE}\n' in log and f'INDEX_TREE={TREE}\n' in log
    assert re.search(r'^EXIT_CODE=0$', log, re.M)
    assert re.search(r'WORKING_STATUS:\s*\n\s*OUTPUT:', log)
    first = dt.datetime.fromisoformat(re.search(r'^UTC_START=(.+)$', log, re.M)[1])
    last = dt.datetime.fromisoformat(re.search(r'^UTC_END=(.+)$', log, re.M)[1])
    assert previous_end is None or first >= previous_end
    previous_end = last
assert '3031 passed' in read('gate-6-unit.txt')
assert re.search(r'(?:pass|passed)\s+154', read('gate-5-architecture-tests.txt'))
inventory = read_json('edit-inventory-final.json')
assert inventory['mode'] == 'final' and inventory['head'] == HEAD and inventory['tree'] == TREE
assert inventory['pathCount'] == 60 and inventory['existingTestFilesVerifiedExactly'] == 35
assert not inventory['unexpectedPaths'] and not inventory['unapprovedExistingTestEdits']
assert 'GENERATOR_INVOCATIONS=1' in read('golden-generation-count.txt')
assert '841 allowed state leaves' in read('A3-final-path-diff.txt') and 'forbidden paths=0' in read('A3-final-path-diff.txt')
for commit in ('927f5be7bb0de8b3fff884daa3da89e98ae03e9e', HEAD):
    assert git('show', '-s', '--format=%B', commit).endswith('Co-authored-by: Codex <noreply@openai.com>')
assert re.search(r'^EXIT_CODE=1$', read('smoke-CI1.txt'), re.M)
assert read_json('baseline-comparison-matched/comparison-results.json')['matchedRunsPassed'] == 6

# Preserve the previous handoff documents as exact bytes before updating current state.
history = RUN / 'history-before-update'
assert not history.exists(), 'Do not overwrite historical handoff documents'
history.mkdir()
for name in ('README.md', 'results-summary.json', 'builder-author-review.md', 'A3-HOLD.md', 'BASELINE-COMPARISON-HOLD.md'):
    shutil.copyfile(OUT / name, history / name)
summary = read_json('results-summary.json')
old_smoke = summary['smoke']
summary['smokeHistory'] = [dict(old_smoke, log='smoke-CI1.txt', state='first full smoke failed; required isolated reruns retained'),
                           dict(summary['baselineComparison'], state='matched diagnostic complete; all six passed')]
summary['taskState'] = 'A0-A3 complete locally; independent testing/review pending'
summary['utc'] = dt.datetime.now(dt.timezone.utc).isoformat()
summary['smoke'] = {'ci': '1', 'passed': 387, 'failed': 0, 'skipped': 0, 'exitCode': 0,
                    'log': 'full-smoke-rerun/full-smoke.txt', 'seconds': run['seconds'],
                    'utcStart': run['utcStart'], 'utcEnd': run['utcEnd'], 'isolatedReruns': [],
                    'ownerDecisionVerbatim': 'Approve full smoke rerun (Recommended)',
                    'cpuBeforeProductionBuildPercent': start['cpu'][0]['LoadPercentage'],
                    'cpuBeforeSmokePercent': pre['cpu'][0]['LoadPercentage'],
                    'sleepResumeEventCount': sleep['eventCount'], 'servedHeadAssetsVerified': True}
save_json('results-summary.json', summary)
current = f'''## Final local verification

Owner T\u00e2n, 2026-11-17, verbatim: "Approve full smoke rerun (Recommended)".

**The owner-approved full smoke passed: 387 passed, 0 failed, 0 skipped, exit 0, CI=1.** It ran at the same unchanged clean HEAD/tree as gates 1\u20137. CPU was {start['cpu'][0]['LoadPercentage']}% before the fresh production build and {pre['cpu'][0]['LoadPercentage']}% immediately before smoke. Top processes, empty competing-job lists and free ports are in `full-smoke-rerun/*-machine.json`.

The normal fresh production build passed. HTTP response bytes on both 4173 and 4174 matched the pinned HEAD JavaScript SHA-256; see `full-smoke-rerun/built-assets.json` and `served-assets.json`. `ci-echo.txt` records the actual `CI=1` echo in the same PowerShell shell as the full smoke. The only CLI override is the output directory; all 387 tests run, one worker, zero retries, unchanged timeouts.

Full output: [full-smoke-rerun/full-smoke.txt](full-smoke-rerun/full-smoke.txt). Smoke UTC: `{run['utcStart']}` \u2192 `{run['utcEnd']}`, {run['seconds']:.3f} seconds. Whole-window sleep/resume events: **{sleep['eventCount']}**, captured in [sleep-resume-events.json](full-smoke-rerun/sleep-resume-events.json). No power setting changed. Final branch/status/ports are in `final-state.txt`.

Historical evidence is retained: the first full smoke failed 384/3; its required isolated runs failed/failed/passed. The later matched base/HEAD comparison passed all six cases. [A3-HOLD.md](A3-HOLD.md) and [BASELINE-COMPARISON-HOLD.md](BASELINE-COMPARISON-HOLD.md) preserve those findings and setup corrections. Their HOLDs were answered by the quoted owner approvals. Exact prior handoff documents are preserved in `full-smoke-rerun/history-before-update/`. No product source, test, timeout or config changed between these runs.

'''
readme = read('README.md').replace('A0\u2013A2 complete; A3 HOLD', 'A0\u2013A3 complete locally')
begin = readme.index('## Current A3 HOLD')
end = readme.index('## Exact-head gates', begin)
readme = readme[:begin] + current + readme[end:]
begin = readme.index('Full smoke: **')
end = readme.index('## Inventory, pins and golden', begin)
readme = readme[:begin] + 'The first full smoke and its failure/rerun evidence are historical. The final owner-approved full smoke result and served-build verification are recorded above; original logs remain unchanged.\n\n' + readme[end:]
readme = readme.replace('5. "Approve baseline comparison (Recommended)"', '\nSubsequent owner approvals, verbatim:\n\n- "Approve baseline comparison (Recommended)"\n- "Approve full smoke rerun (Recommended)"')
write('README.md', readme)
closure = '\n## Subsequent approved full smoke\n\nOwner T\u00e2n approved "Approve full smoke rerun (Recommended)" on 2026-11-17. That full run passed 387/387 at the unchanged HEAD/tree, with CI=1 and matched served HEAD assets. This historical HOLD is closed for local Builder verification; the original failures and diagnostic findings remain intact. See README.md and full-smoke-rerun/full-smoke.txt. Independent testing/review remains pending.\n'
for name in ('A3-HOLD.md', 'BASELINE-COMPARISON-HOLD.md'):
    write(name, read(name) + closure)
write('builder-author-review.md', read('builder-author-review.md').replace('Verification status: HOLD because the full smoke run failed; see smoke-CI1.txt and the isolated rerun logs', 'Verification status: the final owner-approved full CI=1 smoke passed; see full-smoke-rerun/full-smoke.txt. The first failed smoke and isolated reruns remain historical evidence') + '\n## Final owner-approved smoke\n\nThe final full CI=1 smoke passed 387/387 at the unchanged HEAD/tree. Fresh production assets were verified over HTTP on both ports. No source defect was established or source fix made during the diagnostic work. Local Builder verification is complete; this remains an author review, with independent Claude/Astra verdicts pending. Original failed smoke and baseline comparison remain historical evidence.\n')
traces = []
for folder in (WORK / 'test-results', WORK / 'playwright-report', OUT.parent / 'p7a-prA-local-only'):
    if folder.exists():
        for path in sorted(folder.rglob('*.zip')):
            traces.append({'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
assert not list(OUT.rglob('*.zip'))
save_json('LOCAL-ONLY.txt', {'playwrightTracesInEvidenceFolder': False, 'retainedOutsideEvidence': traces,
                           'note': 'Default retain-on-failure preserved. Historical trace ZIPs stay outside this evidence folder; passing full rerun retained none.'})
save_json('final-state.txt', {'utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'head': HEAD, 'tree': TREE,
                            'branch': 'feat/p7a-npc-life-data', 'gitStatus': '', 'portsFree': True, 'listeners': [],
                            'portSnapshot': 'full-smoke-rerun/final-machine.json', 'featureBranchUnchanged': True,
                            'pushPrMerge': 'not performed'})
with (OUT / 'progress.md').open('a', encoding='utf-8') as stream:
    stream.write(f'\nFinal approved full CI=1 smoke: 387 passed, 0 failed, exit 0; HEAD {HEAD}; tree {TREE}. Local A0-A3 complete; independent testing/review pending. First failed smoke and matched comparison preserved.\n')
print(json.dumps({'state': summary['taskState'], 'smoke': summary['smoke'], 'head': HEAD, 'tree': TREE}, indent=2))
