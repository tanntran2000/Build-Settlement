from base64 import b64decode, b64encode
from collections import Counter
from difflib import SequenceMatcher
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
BASE = '825ca5c27cc3d440705dffb6b41699d1dcbd2e4e'
MAIN = 'b184357d235d164478584e36b96d063551124e66'
PLAN_SHA = '499ec24321941230f28d653070d2d2b193b8e4be88cbcfb69124e389e7c3a9f7'
REVIEW_SHA = 'e4ac174223420005f28265d7126b5ee6b896d70a29960208152d4d202b70e2b9'
PLAN = HERE.parents[1] / 'binding-plan-4cc95f8.md'
REVIEW = HERE.parents[1] / 'astra-review' / 'astra-round1.md'
INVENTORY = HERE / 'correction14-byte-inventory.json'
SCOPE = {
    'packages/core/src/__tests__/catalog-data.test.ts': 'P2-3',
    'packages/core/src/data/validate.ts': 'P2-3',
    'packages/core/src/trial/__tests__/society-p7b.test.ts': 'P3-2',
    'packages/core/src/trial/acquisition-replay.ts': 'P1-1 P1-2 P2-1 P2-2',
    'packages/core/src/trial/acquisition.ts': 'P1-2 P2-2',
    'packages/core/src/trial/state.ts': 'P1-1',
    'packages/persistence/src/__tests__/item-records.test.ts': 'P3-2',
    'packages/persistence/src/__tests__/npc-life-records.test.ts': 'P1-6',
    'packages/persistence/src/__tests__/society-new-game-fixture.test.ts': 'P3-2',
    'packages/persistence/src/session-records.ts': 'P1-1',
    'packages/simulation/src/__tests__/npc-acquisition.test.ts': 'P1-1 P1-5',
    'packages/simulation/src/__tests__/npc-auction.test.ts': 'P1-2',
    'packages/simulation/src/__tests__/npc-homes.test.ts': 'P3-2',
    'packages/simulation/src/__tests__/replay-checkpoint.test.ts': 'P1-1 P1-2 P1-5 P2-1 P2-2',
    'packages/simulation/src/npc-acquisition.ts': 'P2-2',
    'packages/simulation/src/npc-auction.ts': 'P1-2',
    'packages/ui/src/AcquisitionPanel.svelte': 'P3-1',
    'packages/ui/src/__tests__/acquisition-view.test.ts': 'P1-4',
    'packages/ui/src/__tests__/character-life-session.test.ts': 'P3-2',
    'tests/e2e/acquisition.spec.ts': 'P1-3 P2-4 P3-1',
}
def git(*args):
    return subprocess.check_output(('git', *args))

def digest(value):
    return sha256(value).hexdigest()

def blob(revision, path):
    return git('cat-file', 'blob', revision + ':' + path)

def paths(*args):
    return set(git(*args).decode('utf-8').splitlines())

def spans(before, after):
    left, right = before.splitlines(keepends=True), after.splitlines(keepends=True)
    line_starts = [0]
    for line in left:
        line_starts.append(line_starts[-1] + len(line))
    for op, start, end, first, last in SequenceMatcher(None, left, right, autojunk=False).get_opcodes():
        if op != 'equal':
            yield {'offset': line_starts[start], 'removedBase64': b64encode(b''.join(left[start:end])).decode('ascii'),
                   'insertedBase64': b64encode(b''.join(right[first:last])).decode('ascii')}

def rebuild(before, changes):
    parts = []
    offset = 0
    for change in changes:
        start = change['offset']
        removed = b64decode(change['removedBase64'], validate=True)
        added = b64decode(change['insertedBase64'], validate=True)
        assert offset <= start and before[start:start+len(removed)] == removed
        parts.extend((before[offset:start], added))
        offset = start + len(removed)
    return b''.join([*parts, before[offset:]])

mode = sys.argv[1]
assert mode in {'capture', 'worktree', 'index', 'head'}
assert digest(PLAN.read_bytes()) == PLAN_SHA
review = REVIEW.read_bytes()
assert digest(review) == REVIEW_SHA
original = dict(re.findall(r'^\| [AM] \| \[([^\]]+)\].+\x60([0-9a-f]{64})\x60 \|$', review.decode('utf-8'), re.M))
assert len(original) == 86, len(original)
assert set(original) == paths('diff', '--name-only', MAIN, BASE)
assert all(digest(blob(BASE, path)) == sha for path, sha in original.items())
print('Approved 86-path packet plus Corrections 12–13 reverified at ' + BASE, flush=True)

head = git('rev-parse','HEAD').decode().strip()
assert git('rev-parse','origin/main').decode().strip() == MAIN
assert git('branch','--show-current').decode().strip() == 'feat/p7b-acquisition-market'
assert not git('ls-files','--others','--exclude-standard')
if mode in {'capture', 'worktree', 'index'}:
    assert head == BASE
    assert paths('diff','--name-only', BASE) == set(SCOPE)
    if mode == 'index':
        assert paths('diff','--cached','--name-only',BASE) == set(SCOPE)
    else:
        assert not git('diff','--cached','--name-only')
else:
    assert git('status','--porcelain=v1','--untracked-files=all') == b''
    assert git('rev-parse','HEAD^').decode().strip() == BASE
    assert paths('diff','--name-only',BASE,'HEAD') == set(SCOPE)
    assert paths('diff','--name-only',MAIN,'HEAD') == set(SCOPE) | set(original)

if mode == 'capture':
    entries = []
    for path, finding in sorted(SCOPE.items()):
        before, after = blob(BASE, path), Path(path).read_bytes()
        assert before != after
        assert (b'\r\n' in before) == (b'\r\n' in after), path
        entries.append({'path': path, 'finding': finding, 'oldSha256': digest(before), 'newSha256': digest(after),
                        'oldBytes': len(before), 'newBytes': len(after), 'replacements': list(spans(before,after))})
    data = {'reviewedHead': BASE, 'planSha256': PLAN_SHA, 'reviewSha256': REVIEW_SHA,
            'encoding': '0-based old byte offsets, including literal line endings; Base64 payloads', 'entries': entries}
    with INVENTORY.open('x',encoding='utf-8',newline='\n') as file:
        file.write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

inventory = json.loads(INVENTORY.read_bytes())
entries = inventory['entries']
assert inventory['reviewedHead'] == BASE and inventory['planSha256'] == PLAN_SHA and inventory['reviewSha256'] == REVIEW_SHA
assert Counter(entry['path'] for entry in entries) == Counter(SCOPE.keys())
for entry in entries:
    path = entry['path']
    assert entry['finding'] == SCOPE[path]
    before = blob(BASE, path)
    after = blob('HEAD', path) if mode == 'head' else blob('', path) if mode == 'index' else Path(path).read_bytes()
    assert (len(before), digest(before)) == (entry['oldBytes'], entry['oldSha256']), path
    assert (len(after), digest(after)) == (entry['newBytes'], entry['newSha256']), path
    assert rebuild(before, entry['replacements']) == after, path
    if mode == 'index':
        assert Path(path).read_bytes() == after, path
    print('{:25} {}  {} -> {}'.format(entry['finding'], path, entry['oldSha256'], entry['newSha256']))
if mode == 'head':
    assert all(digest(blob('HEAD', path)) == sha for path, sha in original.items() if path not in SCOPE)
print(f'PASS {mode}: {len(entries)} scoped paths, {sum(len(e["replacements"]) for e in entries)} exact byte spans. Extra paths: 0.')
