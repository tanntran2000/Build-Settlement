"""Verify the untouched Step 0 baseline or the exact owner-approved final inventory."""
from pathlib import Path
import argparse
import datetime as dt
import hashlib
import json
import subprocess

ROOT = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT = Path(__file__).resolve().parent
BASE = 'dac604054d7cbbf14a0a42209a3ff560380f2956'
BASE_TREE = 'd2f31706d77d308a310b61857a8b293a898280e7'
DATA_BRANCH = '56124513aef2d85de128fe76bf3001654290c1c0'


def read_json(name):
    return json.loads((OUT / name).read_text(encoding='utf-8-sig'))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True, encoding='utf-8').strip()


def new_leaves(value, path):
    if isinstance(value, dict):
        return [leaf for key, item in value.items() for leaf in new_leaves(item, path + [str(key)])]
    if isinstance(value, list):
        return [leaf for index, item in enumerate(value) for leaf in new_leaves(item, path + [str(index)])]
    return ['.'.join(path)]


def diff(before, after, path=None):
    path = [] if path is None else path
    if isinstance(before, dict) and isinstance(after, dict):
        rows = []
        for key in sorted(before.keys() | after.keys()):
            if key not in before:
                rows += new_leaves(after[key], path + [key])
            elif key not in after:
                rows += new_leaves(before[key], path + [key])
            else:
                rows += diff(before[key], after[key], path + [key])
        return rows
    if isinstance(before, list) and isinstance(after, list):
        rows = []
        for index in range(max(len(before), len(after))):
            if index >= len(before):
                rows += new_leaves(after[index], path + [str(index)])
            elif index >= len(after):
                rows += new_leaves(before[index], path + [str(index)])
            else:
                rows += diff(before[index], after[index], path + [str(index)])
        return rows
    return [] if before == after and type(before) is type(after) else ['.'.join(path)]


parser = argparse.ArgumentParser()
parser.add_argument('--mode', choices=['preflight', 'final'], required=True)
args = parser.parse_args()
assert git('branch', '--show-current') == 'feat/p7a-npc-life-week'
assert git('rev-parse', 'refs/heads/feat/p7a-npc-life-data') == DATA_BRANCH
assert git('status', '--porcelain=v1') == ''
baseline = read_json('B0-byte-inventory.json')
assert baseline['head'] == BASE
planned = read_json('B0-planned-paths.json')
planned_set = {row['path'] for row in planned}
edits = read_json('B0-proposed-edits.json')
proposals = read_json('B0-proposed-files.json')
by_file = {}
for edit in edits:
    by_file.setdefault(edit['file'], []).append(edit)
for proposal in proposals:
    before = Path(proposal['beforeCopy']).read_bytes()
    after = Path(proposal['afterCopy']).read_bytes()
    assert sha(before) == proposal['beforeSha256']
    assert sha(after) == proposal['afterSha256']
    applied = before
    for edit in by_file[proposal['file']]:
        old, new = edit['beforeText'].encode('utf-8'), edit['afterText'].encode('utf-8')
        assert applied.count(old) == 1, edit['id']
        applied = applied.replace(old, new, 1)
    assert applied == after, proposal['file']
allowed_changes = []
for proposal in proposals:
    path = proposal['file']
    if not path.endswith('.json'):
        continue
    old = json.loads(Path(proposal['beforeCopy']).read_bytes())
    new = json.loads(Path(proposal['afterCopy']).read_bytes())
    if path.endswith('catalog-golden.json'):
        for old_entry, new_entry in zip(old, new, strict=True):
            assert {k:v for k,v in old_entry.items() if k != 'session'} == {k:v for k,v in new_entry.items() if k != 'session'}
            old_save, new_save = json.loads(old_entry['session']), json.loads(new_entry['session'])
            assert {k:v for k,v in old_save.items() if k != 'state'} == {k:v for k,v in new_save.items() if k != 'state'}
            allowed_changes += diff(old_save['state'], new_save['state'])
    else:
        assert {k:v for k,v in old.items() if k != 'state'} == {k:v for k,v in new.items() if k != 'state'}
        allowed_changes += diff(old['state'], new['state'])
assert len(allowed_changes) == 42
assert all(path.startswith('npcs.') and '.life.' in path for path in allowed_changes)
head, tree = git('rev-parse', 'HEAD'), git('rev-parse', 'HEAD^{tree}')
changed = set(git('diff', '--name-only', f'{BASE}...HEAD').splitlines())
if args.mode == 'preflight':
    assert head == BASE and tree == BASE_TREE and not changed
else:
    approval = read_json('B0-owner-approval.json')
    assert approval['owner'] == 'T\u00e2n' and approval['verbatim']
    assert approval['approvedEdits'] == [f'E{i:02}' for i in range(1, 10)]
    assert approval['approvedDecisions'] == ['D1', 'D2', 'D3', 'D4']
    assert approval['proposedEditsSha256'] == sha((OUT / 'B0-proposed-edits.json').read_bytes())
    assert approval['proposedFilesSha256'] == sha((OUT / 'B0-proposed-files.json').read_bytes())
    assert approval['whitespaceDelta'] == 'W01'
    assert changed == planned_set, {'unexpected': sorted(changed-planned_set), 'missing': sorted(planned_set-changed)}
    assert 'GENERATOR_INVOCATIONS=1' in (OUT / 'golden-generation-count.txt').read_text(encoding='utf-8-sig')
    for proposal in proposals:
        assert (ROOT / proposal['file']).read_bytes() == Path(proposal['afterCopy']).read_bytes(), proposal['file']
    for row in planned:
        data = (ROOT / row['path']).read_bytes()
        if row['status'] == 'new':
            assert data.endswith(b'\n') and not data.endswith(b'\n\n') and b'\r' not in data
            assert not data.startswith(b'\xef\xbb\xbf')
            data.decode('utf-8')
for row in baseline['files']:
    if args.mode == 'preflight' or row['path'] not in planned_set:
        assert sha((ROOT / row['path']).read_bytes()) == row['sha256'], row['path']
    elif row['path'] not in by_file:
        data = (ROOT / row['path']).read_bytes()
        trailing = len(data) - len(data.rstrip(b'\r\n'))
        assert trailing == row['trailingNewlineBytes'], (row['path'], 'unapproved EOF change')
        assert data.startswith(b'\xef\xbb\xbf') == row['utf8Bom']
        if row['crlf'] and not row['loneLf']:
            assert data.count(b'\n') == data.count(b'\r\n'), (row['path'], 'unapproved EOL normalization')
result = {'mode': args.mode, 'head': head, 'tree': tree, 'base': BASE,
          'utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'gitStatus': '',
          'trackedBaselineFiles': baseline['trackedFiles'], 'pathCount': len(changed),
          'plannedPaths': len(planned_set), 'proposedTransformations': len(edits),
          'existingTestFilesVerifiedExactly': 3 if args.mode == 'final' else 0,
          'projectedDataLeavesVerified': len(allowed_changes),
          'unexpectedPaths': sorted(changed-planned_set), 'unapprovedExistingTestEdits': [],
          'unchangedPrABranch': DATA_BRANCH, 'exitCode': 0,
          'scope': 'source/proposal inventory only; not a product test or gate result'}
if args.mode == 'final':
    result['files'] = []
    for row in planned:
        path = row['path']
        data = (ROOT / path).read_bytes()
        result['files'].append({'path': path, 'status': row['status'],
                                'sha256': sha(data), 'gitBlob': git('rev-parse', f'HEAD:{path}'),
                                'bytes': len(data), 'crlf': data.count(b'\r\n'),
                                'loneLf': data.count(b'\n')-data.count(b'\r\n'),
                                'trailingNewlineBytes': len(data)-len(data.rstrip(b'\r\n'))})
name = 'B0-verification.json' if args.mode == 'preflight' else 'edit-inventory-final.json'
(OUT / name).write_bytes((json.dumps(result, indent=2) + '\n').encode('utf-8'))
print(json.dumps(result, indent=2))
