import hashlib
import json
from pathlib import Path
import subprocess
import sys

here = Path(__file__).resolve().parent
packet = here.parent
root = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
base = '95821832a8c95988c3203b4c38f5f9ae665978e9'
sha = lambda data: hashlib.sha256(data).hexdigest()
def read(folder, name):
    return json.loads((folder / name).read_bytes())
def git(*args):
    return subprocess.check_output(['git', *args], cwd=root, stderr=subprocess.PIPE)
def paths(blob):
    return set(blob.decode('utf-8').strip('\0').split('\0')) - {''}

expected = {f['path']: f['after']['sha256'] for f in read(packet, 'source-replacements.json')['files']}
expected.update({f['path']: f['sha256'] for f in read(packet, 'generated-byte-proposals.json')['files']})
rounding = read(here, 'correction21-byte-inventory.json')['files']
fixes = read(here, 'proposed-hold-fixes.json')['files']
for f in rounding:
    assert expected[f['path']] == f['packetSHA256']
    expected[f['path']] = f['correctedSHA256']
assert sha((here/'proposed-hold-fixes.patch').read_bytes()) == '070e60c0305ad1d6df7480f9dc4512bd3c7c5155ac62d739d3103d8214610b85'
for f in fixes:
    assert expected[f['path']] == f['heldSHA256']
    expected[f['path']] = f['proposedSHA256']

stage, ref = sys.argv[1:3]
if stage == 'b42':
    c23 = read(here, 'proposed-b42-locator-fix.json')
    assert sha((here/'proposed-b42-locator-fix.patch').read_bytes()) == '0d443aa0ad77475458d576f7defe750b47160e729071b48ac4b7a0554dd6cd55'
    assert expected[c23['path']] == c23['heldSHA256']
    expected[c23['path']] = c23['proposedSHA256']
    c24 = read(here, 'proposed-gate6-contract-expectation.json')
    assert sha((here/'proposed-gate6-contract-expectation.patch').read_bytes()) == 'c2ec85aa8f555a8b86c923cf3ef59cd4b7078841a533236a2f648b62dd204d39'
    assert sha(git('show', c24['head'] + ':' + c24['path'])) == c24['heldGitBlobSHA256']
    assert c24['path'] not in expected
    expected[c24['path']] = c24['proposedGitBlobSHA256']
    wages = read(here, 'c24-goods-stock-expectation.json')
    assert wages['path'] == 'tests/e2e/goods-stock.spec.ts'
    assert wages['path'] not in expected
    assert wages['before'] == '  expect(debit).toBe(30000);'
    assert wages['after'] == '  expect(debit).toBe(30000 + 20000);'
    goods = git('show', wages['head'] + ':' + wages['path'])
    assert sha(goods) == wages['gitBeforeSHA256']
    assert goods.count(wages['before'].encode()) == 1
    adjusted = goods.replace(wages['before'].encode(), wages['after'].encode(), 1)
    assert sha(adjusted) == wages['gitAfterSHA256']
    assert sha((here/'c24-goods-stock-expectation.patch').read_bytes()) == wages['patchSHA256']
    expected[wages['path']] = wages['gitAfterSHA256']
selection = {p for p in expected if p.startswith(('packages/core/', 'packages/simulation/'))} if stage == 'b41' else set(expected)
assert git('rev-parse','origin/main').decode().strip() == base
assert git('branch','--show-current').decode().strip() == 'feat/p7b-servants-wages'
seen = paths(git('diff', '--name-only', '-z', base)) | paths(git('ls-files', '--others', '--exclude-standard', '-z'))
assert seen == selection, sorted(seen ^ selection)
indexed = selection if ref == 'worktree' else paths(git('diff','--name-only','-z','--cached',base) if ref == 'index' else git('diff','--name-only','-z',base,ref))
assert indexed == selection, sorted(indexed ^ selection)
for path in sorted(selection):
    work = (root/path).read_bytes()
    if stage == 'b42' and path == wages['path']:
        assert sha(work) in {wages['workingAfterSHA256'], wages['gitAfterSHA256']}, path
        work = work.replace(b'\r\n', b'\n')
    assert sha(work) == expected[path], path
    if ref != 'worktree':
        blob = git('show', ('' if ref == 'index' else ref) + ':' + path)
        assert blob == work, path
    print(expected[path], path)
print(stage, ref, len(selection), 'files match approved packet + approved corrections')

