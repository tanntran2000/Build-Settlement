"""Assemble diagnostic results without modifying the product worktree."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'baseline-comparison-matched'
LOCAL = ROOT.parent / 'p7a-prA-local-only'
WORK = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
BASE = '753e4503673df86830fba2ef2c9ef1e64a843729'
HEAD = '56124513aef2d85de128fe76bf3001654290c1c0'
TREE = 'd2f31706d77d308a310b61857a8b293a898280e7'
ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save_json(path, value):
    path.write_bytes((json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode('utf-8'))


def git(*args):
    return subprocess.check_output(['git', *args], cwd=WORK, text=True, encoding='utf-8').strip()


def log_field(text, name):
    return re.search(r'^' + re.escape(name) + r'=(.*)$', text, re.M).group(1).strip()


def trace_summary(directory):
    result = []
    for path in sorted(directory.rglob('trace.zip')):
        events = []
        scripts = set()
        contents = []
        with zipfile.ZipFile(path) as archive:
            contents = archive.namelist()
            for name in contents:
                if name.endswith('.network'):
                    for line in archive.read(name).decode('utf-8').splitlines():
                        event = json.loads(line)
                        url = event.get('snapshot', {}).get('request', {}).get('url', '')
                        if ':4173/' in url and '/assets/' in url and '.js' in url:
                            scripts.add(url)
                if name.endswith('.trace'):
                    for line in archive.read(name).decode('utf-8').splitlines():
                        event = json.loads(line)
                        if event.get('type') in ('before', 'after', 'error', 'console', 'log'):
                            events.append({'traceEntry': name, 'event': event})
        errors = [event for event in events if event['event'].get('error') or event['event'].get('type') == 'error']
        result.append({'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                       'entries': contents, 'servedProductionScripts': sorted(scripts),
                       'errorEvents': errors, 'lastActionEvents': events[-20:]})
    return result


def main():
    summary = read_json(DATA / 'summary.json')
    assert summary['operationalExitCode'] == 0 and len(summary['runs']) == 6, summary
    assert git('rev-parse', 'HEAD') == HEAD
    assert git('rev-parse', 'HEAD^{tree}') == TREE
    assert git('branch', '--show-current') == 'feat/p7a-npc-life-data'
    assert git('status', '--porcelain=v1') == ''
    assert git('rev-parse', 'refs/heads/feat/p7a-npc-life-data') == HEAD
    for stage in ('base', 'head'):
        build = (DATA / f'{stage}-build.txt').read_text(encoding='utf-8-sig')
        assert log_field(build, 'HEAD') == (BASE if stage == 'base' else HEAD)
        assert log_field(build, 'EXIT_CODE') == '0'
        assets = read_json(DATA / f'{stage}-built-assets.json')
        assert assets['head'] == (BASE if stage == 'base' else HEAD)
    cases = read_json(ROOT / 'smoke-failed-cases.json')
    rows = []
    for case in cases:
        row = {'index': case['index'], 'case': case['title'], 'selector': case['selector']}
        for stage in ('base', 'head'):
            stem = f"{stage}-{case['index']}"
            text = ANSI.sub('', (DATA / f'{stem}.txt').read_text(encoding='utf-8-sig'))
            assert text.count('Running 1 test using 1 worker') == 1, stem
            assert log_field(text, 'CI') == '1'
            assert log_field(text, 'HEAD') == (BASE if stage == 'base' else HEAD)
            assert re.search(r'WORKING_STATUS:\s*\n\s*OUTPUT:', text)
            test_result = re.search(r'^\s*(ok|x)\s+1\s+\[chromium\].*\(([^()]*)\)\s*$', text, re.M)
            assert test_result, stem
            exit_code = int(log_field(text, 'EXIT_CODE'))
            status = 'PASS' if test_result.group(1) == 'ok' else 'FAIL'
            assert (exit_code == 0) == (status == 'PASS')
            error = re.search(r'^\s*((?:Test timeout|Error:|TimeoutError:)[^\n]+)', text, re.M)
            source = re.search(r'\bat ([^\s]+\.ts:\d+(?::\d+)?)', text)
            row[stage] = {'status': status, 'testDurationReported': test_result.group(2),
                          'commandSeconds': float(log_field(text, 'SECONDS')), 'exitCode': exit_code,
                          'error': error.group(1).strip() if status == 'FAIL' and error else None,
                          'errorSource': source.group(1) if status == 'FAIL' and source else None,
                          'utcStart': log_field(text, 'UTC_START'), 'utcEnd': log_field(text, 'UTC_END'),
                          'log': f'baseline-comparison-matched/{stem}.txt',
                          'machine': f'baseline-comparison-matched/{stem}-machine.json',
                          'traces': trace_summary(LOCAL / 'baseline-comparison-matched' / stem)}
        row['baseAlsoFails'] = row['base']['status'] == 'FAIL'
        row['headOnlyFailure'] = row['base']['status'] == 'PASS' and row['head']['status'] == 'FAIL'
        rows.append(row)
    result = {'state': 'HOLD after owner-approved diagnostic comparison',
              'owner': 'T\u00e2n', 'ownerDecisionDate': '2026-11-17',
              'ownerDecisionVerbatim': 'Approve baseline comparison (Recommended)',
              'base': BASE, 'head': HEAD, 'tree': TREE, 'rows': rows,
              'productionBuilds': 'npm run build at each revision, followed by unchanged npm pretest:smoke on each isolated run',
              'npmCiRun': False, 'lockfileBlob': read_json(DATA / 'lockfile-check.json')['baseLockBlob'],
              'validWindow': read_json(DATA / 'sleep-resume-events.json'),
              'setupCorrection': 'Preliminary base attempts served a retained HEAD production asset at port 4173. They are excluded; all preliminary logs and trace asset proof are retained under baseline-comparison/.',
              'finalGitStatus': '', 'featureBranchUnchanged': True,
              'generatedAtUtc': dt.datetime.now(dt.timezone.utc).isoformat()}
    save_json(DATA / 'comparison-results.json', result)
    print(json.dumps({'rows': [{k: v for k, v in row.items() if k in ('case', 'baseAlsoFails', 'headOnlyFailure')}
                               for row in rows], 'output': str(DATA / 'comparison-results.json')}, indent=2))


if __name__ == '__main__':
    main()
