import difflib
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
EVIDENCE = Path(__file__).resolve().parent
PACKET = EVIDENCE.parent
BASE = '95821832a8c95988c3203b4c38f5f9ae665978e9'
TREE = '83c11b3a8362be1c1c69f632808c76a0c101caa8'
sha = lambda b: hashlib.sha256(b).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
def obj(name, digest):
    data = (PACKET / name).read_bytes()
    assert sha(data) == digest
    result = json.loads(data)
    assert result['base'] == BASE and result['tree'] == TREE
    return result
def save(name, value):
    (EVIDENCE / name).write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))

tracked = obj('source-replacements.json', '1d4ac00048e5bb4a2ac0303afe5467142dfe80c3728cd93b3e32f6fe5dc19329')
generated = obj('generated-byte-proposals.json', '2cb27dda1668f6d8392b2979e76d1325a4045e2711fedbdb9e22975dca338f98')
expected = {}
for f in tracked['files']:
    path = f['path']
    current = git('show', BASE + ':' + path)
    assert sha(current) == f['before']['sha256']
    for h in reversed(f['replacements']):
        i, j = h['startByte'], h['endByte']
        assert current[i:j] == h['before'].encode('utf-8')
        current = current[:i] + h['after'].encode('utf-8') + current[j:]
    assert sha(current) == f['after']['sha256']
    expected[path] = current
for f in generated['files']:
    assert f['path'] not in expected
    data = f['text'].encode('utf-8')
    assert len(data) == f['bytes'] and sha(data) == f['sha256']
    expected[f['path']] = data

extras = []
def correction(path, replacements):
    original = expected[path]
    data = original
    for before, after in replacements:
        a, b = before.encode(), after.encode()
        assert data.count(a) == 1
        data = data.replace(a, b, 1)
    extras.append(dict(path=path, packetSHA256=sha(original), correctedSHA256=sha(data),
      changes=[dict(before=a, after=b) for a,b in replacements], finalNewline=data.endswith(b'\n')))
    expected[path] = data
correction('packages/simulation/src/household-week.ts', [
    ('Math.round(household.contract!.wageMilli * rules.renewalWageMultiplier / step)',
     'Math.ceil(household.contract!.wageMilli * rules.renewalWageMultiplier / step)')])
correction('packages/simulation/src/__tests__/household-week.test.ts', [
    ("it('renews 20 weeks (+25% rounded to whole Gold), clears notice and counters', () => {",
     "it.each([[1000, 2000], [2000, 3000]] as const)('renews 20 weeks at wage %s rounded up to %s, clears notice and counters', (previous, increased) => {"),
    ('household.contract = { weeksLeft: 0, wageMilli: 2000, unpaidWeeks: 2, stressHits: 2 };',
     'household.contract = { weeksLeft: 0, wageMilli: previous, unpaidWeeks: 2, stressHits: 2 };'),
    ('toStrictEqual({ weeksLeft: 20, wageMilli: 3000, unpaidWeeks: 0, stressHits: 0 });',
     'toStrictEqual({ weeksLeft: 20, wageMilli: increased, unpaidWeeks: 0, stressHits: 0 });')])

b41 = {p for p in expected if p.startswith(('packages/core/','packages/simulation/'))}
b42 = set(expected) - b41
def is_test(path):
    return '/__tests__/' in path or path.startswith('tests/')
steps = {'red41': {p for p in b41 if is_test(p)}, 'green41': {p for p in b41 if not is_test(p)},
         'red42': {p for p in b42 if is_test(p)}, 'green42': {p for p in b42 if not is_test(p)}}
arg = sys.argv[1]
assert git('rev-parse', 'origin/main').decode().strip() == BASE
save('correction21-byte-inventory.json', {'correction':21, 'base':BASE, 'files':extras})
if arg in steps:
    for path in sorted(steps[arg]):
        target = ROOT / path
        data = expected[path]
        if target.exists():
            blob = git('show', BASE + ':' + path)
            assert target.read_bytes().replace(b'\r\n', b'\n') == blob.replace(b'\r\n', b'\n'), path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        assert target.read_bytes() == data
        print(path, sha(data))
else:
    selection = b41 if arg == 'verify41' else set(expected)
    status_paths = set(git('diff', '--name-only', '-z', BASE).decode().strip('\0').split('\0'))
    untracked = git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0')
    status_paths.update(p for p in untracked.split('\0') if p)
    assert status_paths == selection, sorted(status_paths ^ selection)
    rows = []
    for path in sorted(selection):
        datum = expected[path]
        work = (ROOT / path).read_bytes()
        ref = sys.argv[2] if len(sys.argv) > 2 else None
        indexed = git('show', (ref if ref else '') + ':' + path)
        assert work == datum and indexed == datum, path
        rows.append(dict(path=path, sha256=sha(datum), bytes=len(datum), finalNewline=datum.endswith(b'\n')))
    save(arg + '-bytes.json', {'base':BASE, 'replacementsAndGenerated':rows})
    print(arg, len(rows), 'paths matched approved bytes including Correction 21')

