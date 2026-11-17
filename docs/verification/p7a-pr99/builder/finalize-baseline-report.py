"""Publish the diagnostic-only handoff in local drafts; never edit product files."""
from pathlib import Path
import datetime as dt
import hashlib
import html
import json
import subprocess

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'baseline-comparison-matched'
WORK = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, text):
    path.write_bytes(text.encode('utf-8'))


def save_json(path, value):
    write(path, json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    subprocess.run(['python', '-X', 'utf8', str(ROOT / 'assemble-baseline-comparison.py')], check=True)
    result = read_json(DATA / 'comparison-results.json')
    sleep = read_json(DATA / 'whole-window-sleep-resume.json')
    machine = read_json(DATA / 'start-machine.json')
    final = read_json(DATA / 'final-machine.json')
    assert final['portListeners'] == [] and final['competingJobs'] == []
    rows = result['rows']
    result['wholeDiagnosticWindow'] = sleep
    result['initialCpuPercent'] = read_json(ROOT / 'baseline-comparison/start-machine.json')['cpu'][0]['LoadPercentage']
    result['matchedCpuPercent'] = machine['cpu'][0]['LoadPercentage']
    result['matchedRunsPassed'] = sum(row[stage]['status'] == 'PASS' for row in rows for stage in ('base', 'head'))
    result['headOnlyFailures'] = sum(row['headOnlyFailure'] for row in rows)
    result['setupNotes'] = [
        'Preliminary base tests loaded retained HEAD production JavaScript. The three import failures are excluded as baseline evidence; all six preliminary logs and three failure traces are retained.',
        'The next wrapper stalled during build-asset JSON serialization, before any test started. Only the verified owned helper was stopped, with no child processes or occupied ports. Plain-file text serialization was verified in 64 ms before the matched restart. No product files changed.'
    ]
    save_json(DATA / 'comparison-results.json', result)
    table = ['| Case | Base 753e450 | HEAD 56124513 | Error line (base / HEAD) |',
             '|---|---|---|---|']
    for row in rows:
        cells = []
        for stage in ('base', 'head'):
            value = row[stage]
            cells.append(f"{value['status']}; test {value['testDurationReported']}; command {value['commandSeconds']:.3f}s")
        errors = ' / '.join(row[stage]['errorSource'] or row[stage]['error'] or 'none' for stage in ('base', 'head'))
        table.append(f"| {row['case']} | {cells[0]} | {cells[1]} | {errors} |")
    table_text = '\n'.join(table)
    if result['headOnlyFailures']:
        conclusion = 'A HEAD-only failure was observed. Trace findings must be assessed before any PR A cause is asserted; no fix is authorized.'
    elif any(row['baseAlsoFails'] for row in rows):
        failed = ', '.join(row['case'] for row in rows if row['baseAlsoFails'])
        conclusion = f'Cases that fail on base too: {failed}. This comparison does not establish those failures as PR A regressions.'
    else:
        conclusion = 'All three cases passed on both revisions in the matched comparison. No HEAD-only failure was observed, so this comparison provides no trace-supported PR A cause. The earlier smoke timeouts were not reproduced in these six runs; their cause remains unestablished.'
    matched_start = read_json(DATA / 'summary.json')['windowStartUtc']
    matched_end = read_json(DATA / 'summary.json')['windowEndUtc']
    report = f'''# Baseline comparison \u2014 A3 HOLD

Owner T\u00e2n, 2026-11-17, verbatim: "Approve baseline comparison (Recommended)".

The approved diagnostic comparison is complete. **A3 remains on HOLD**, as requested. No product code, test, timeout or configuration was changed. No push, PR or merge was performed.

## Matched case \u00d7 revision results

{table_text}

Test durations are Playwright's rounded per-test values. Command durations are exact to three decimals and include the unchanged smoke prebuild, server startup and teardown. Each case selected exactly one test, with one worker and `CI=1`.

{conclusion}

The original full smoke result remains **384 passed, 3 failed, exit 1**. This isolated diagnostic comparison does not replace the required full smoke gate.

## Revision and build controls

- Base: `{result['base']}`, detached, tree `77cbeae3332cfaf26ba23e08ae67300d49d8c69d`.
- Feature HEAD: `{result['head']}`, tree `{result['tree']}`.
- Feature branch `feat/p7a-npc-life-data` stayed at the same SHA throughout; final git status is empty.
- Lockfile blobs are identical: `{result['lockfileBlob']}`. No `npm ci` was run.
- Each revision received the normal `npm run build`, then each isolated `npm run test:smoke` used its unchanged regression-build hook. Both production builds exited 0. Production assets and hashes are recorded in `baseline-comparison-matched/*-built-assets.json`; full commands/output are in the six case logs and two build logs.

## Machine and sleep evidence

Initial diagnostic CPU: **{result['initialCpuPercent']}%**. Matched restart CPU: **{result['matchedCpuPercent']}%**, with 8 logical processors. CPU/top-process snapshots were captured first, and before every build and case. No competing test/build/review command or listener on 4173/4174 was detected at those starts.

Matched run window: `{matched_start}` \u2192 `{matched_end}`. Whole diagnostic window, including setup attempts and the stopped helper: `{sleep['windowStartUtc']}` \u2192 `{sleep['windowEndUtc']}`. Recorded sleep/resume events: **{sleep['eventCount']}**. Raw query results are in `baseline-comparison-matched/whole-window-sleep-resume.json`. No Windows power setting was changed.

## Excluded setup attempts

1. The first smoke-only build rebuilt regression output at port 4174, while port 4173 retained the HEAD production asset `index-mINwSZb0.js`. Its three base checkpoint imports failed with the older-version alert. Network traces prove the mismatched asset. Those are setup failures, not valid base results; all preliminary logs, traces and asset proof remain under `baseline-comparison/` and the sibling LOCAL-ONLY trace directory. Preliminary HEAD runs passed, but the matched table above supersedes them for comparison.
2. The next wrapper stalled while serializing decorated PowerShell file text into build-asset metadata, before any test started. The verified owned helper alone was stopped after confirming no child process and no held required port. Plain-file string serialization then completed in 64 ms; the corrected wrapper produced the matched runs. The stopped helper metadata and the serialization check remain under `baseline-comparison-validated/`. No user process or test/server was stopped.

## Evidence and required next decision

`baseline-comparison-matched/comparison-results.json` contains the full matrix, exact revisions, UTC times and trace findings. `LOCAL-ONLY.txt` lists trace paths and hashes outside the evidence folder. Default `retain-on-failure` trace behavior was preserved; passing matched cases have no retained trace ZIP.

The worktree is left on the clean feature branch at the original HEAD, and ports 4173/4174 are free. Product commits remain A1 and A2 only. The owner decides whether to authorize another full `CI=1 npm run test:smoke` on an awake, quiet machine. No further tests or fixes are performed after this diagnostic HOLD.
'''
    write(ROOT / 'BASELINE-COMPARISON-HOLD.md', report)
    maximum = max(row[stage]['commandSeconds'] for row in rows for stage in ('base', 'head'))
    rendered_rows = []
    for row in rows:
        cells = []
        for stage in ('base', 'head'):
            value = row[stage]
            error = value['errorSource'] or value['error'] or 'none'
            width = value['commandSeconds'] / maximum * 100
            cells.append(f'<td><strong class="{value["status"].lower()}">{value["status"]}</strong><div>{html.escape(value["testDurationReported"])} test</div><div class="muted">{value["commandSeconds"]:.3f}s command</div><div class="track"><span class="{stage}" style="width:{width:.3f}%"></span></div><div class="error">Error: {html.escape(error)}</div></td>')
        rendered_rows.append(f'<tr><th scope="row">{html.escape(row["case"])}</th>{"".join(cells)}</tr>')
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{margin:0;color:var(--foreground);font:14px/1.45 var(--font-sans,system-ui,sans-serif)}
figure{margin:0}figcaption{font-size:16px;font-weight:650;margin-bottom:12px}
table{width:100%;table-layout:fixed;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:12px 8px 12px 0;border-bottom:1px solid var(--border);overflow-wrap:anywhere}th{font-weight:550}thead th{font-size:13px;color:var(--muted-foreground)}th:first-child{width:34%}td{font-variant-numeric:tabular-nums}.muted,.error,p{color:var(--muted-foreground);font-size:12px}.pass{color:var(--success)}.fail{color:var(--destructive)}.track{height:6px;background:var(--muted);margin:7px 0;border-radius:3px;overflow:hidden}.track span{height:6px;display:block}.base{background:var(--chart-1)}.head{background:var(--chart-2)}p{margin:10px 0 0}
</style><figure><figcaption>Isolated CI=1 smoke comparison</figcaption><table><thead><tr><th>Case</th><th>Base<br>753e450</th><th>HEAD<br>56124513</th></tr></thead><tbody>'''+''.join(rendered_rows)+'''</tbody></table><p>Bars compare command durations, including builds and server startup, on a shared scale. Per-test durations are rounded Playwright values. One case and one worker per invocation.</p><p>Matched production builds at both revisions. Diagnostic results only; A3 remains on HOLD.</p></figure></html>'''
    write(ROOT / 'baseline-comparison.html', page)
    readme_path = ROOT / 'README.md'
    readme = readme_path.read_text(encoding='utf-8-sig')
    owner_line = '5. "Approve baseline comparison (Recommended)"'
    if owner_line not in readme:
        readme = readme.replace('4. "Approve E51\u2013E53"', '4. "Approve E51\u2013E53"\n'+owner_line)
    start = readme.index('## Current A3 HOLD')
    end = readme.index('## Exact-head gates', start)
    section = '## Current A3 HOLD\n\nOwner-approved diagnostic comparison is complete; A3 remains on HOLD. [BASELINE-COMPARISON-HOLD.md](BASELINE-COMPARISON-HOLD.md) contains the matched table, method, setup corrections and limitations.\n\n'+table_text+'\n\n'+conclusion+' The original failed full smoke gate is unchanged.\n\n'
    readme = readme[:start] + section + readme[end:]
    write(readme_path, readme)
    previous = ROOT / 'A3-HOLD.md'
    previous_text = previous.read_text(encoding='utf-8-sig')
    if '## Subsequent owner-approved diagnostic' not in previous_text:
        previous_text += '\n## Subsequent owner-approved diagnostic\n\nThe baseline comparison requested above was approved by owner T\u00e2n, 2026-11-17, verbatim: "Approve baseline comparison (Recommended)". It is complete; see [BASELINE-COMPARISON-HOLD.md](BASELINE-COMPARISON-HOLD.md). A3 remains on HOLD after that diagnostic, as requested. The earlier owner-decision request in this historical report has been answered.\n'
        write(previous, previous_text)
    overall = read_json(ROOT / 'results-summary.json')
    overall['baselineComparison'] = {'report': 'BASELINE-COMPARISON-HOLD.md', 'results': 'baseline-comparison-matched/comparison-results.json',
                                     'matchedRunsPassed': result['matchedRunsPassed'], 'matchedRuns': 6,
                                     'headOnlyFailures': result['headOnlyFailures'], 'sleepResumeEventCount': sleep['eventCount'], 'state': 'HOLD'}
    save_json(ROOT / 'results-summary.json', overall)
    traces = []
    for folder in (WORK / 'test-results', WORK / 'playwright-report', ROOT.parent / 'p7a-prA-local-only'):
        if folder.exists():
            for path in sorted(folder.rglob('*.zip')):
                traces.append({'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    assert not list(ROOT.rglob('*.zip'))
    save_json(ROOT / 'LOCAL-ONLY.txt', {'playwrightTracesInEvidenceFolder': False, 'retainedOutsideEvidence': traces,
                                      'matchedRuns': 6, 'matchedRetainedTraces': sum(len(row[stage]['traces']) for row in rows for stage in ('base', 'head')),
                                      'note': 'Default retain-on-failure preserved. All ZIP traces remain outside this evidence folder; passing runs retain no trace.'})
    final_state = {'utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'head': result['head'], 'tree': result['tree'],
                   'branch': 'feat/p7a-npc-life-data', 'gitStatus': '', 'portsFree': True, 'listeners': [],
                   'portSnapshot': 'baseline-comparison-matched/final-machine.json', 'featureBranchUnchanged': True, 'pushPrMerge': 'not performed'}
    assert subprocess.check_output(['git', 'status', '--porcelain=v1'], cwd=WORK) == b''
    save_json(ROOT / 'final-state.txt', final_state)
    print(json.dumps({'matchedRunsPassed': result['matchedRunsPassed'], 'matchedRuns': 6, 'state': 'A3 HOLD', 'report': str(ROOT / 'BASELINE-COMPARISON-HOLD.md'), 'retainedTraceZips': len(traces)}, indent=2))


if __name__ == '__main__':
    main()
