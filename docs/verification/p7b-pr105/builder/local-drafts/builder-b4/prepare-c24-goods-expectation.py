import difflib
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

here = Path(__file__).resolve().parent
root = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
sha = lambda data: hashlib.sha256(data).hexdigest()
def git(*args):
    return subprocess.check_output(['git',*args],cwd=root)
head, tree = git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
assert head == 'e983fa9f826387bfa4a7ef7b0b54cff561687cb6'
assert not git('status','--porcelain=v1')
log = (here/'gate-8-smoke-c24.txt').read_text(encoding='utf-8')
assert '415 passed' in log and '2 failed' in log and 'Exit 1' in log
assert log.count('Expected: 30000') == log.count('Received: 50000') == 2
for case in (root/'test-results').glob('goods-stock-Society-five-week-*'):
    if not case.is_dir():
        continue
    copied = here/'scope-proof-goods-stock'/case.name
    copied.mkdir(parents=True, exist_ok=True)
    for name in ['error-context.md','trace.zip','goods-week5-report.png']:
        if (case/name).is_file():
            shutil.copy2(case/name,copied/name)
path = 'tests/e2e/goods-stock.spec.ts'
file = (root/path).read_bytes()
blob = git('show','HEAD:'+path)
a, b = b'  expect(debit).toBe(30000);', b'  expect(debit).toBe(30000 + 20000);'
assert file.replace(b'\r\n',b'\n') == blob.replace(b'\r\n',b'\n')
assert file.count(a) == blob.count(a) == 1
updated = file.replace(a,b,1)
start = file.index(a)
patch = ''.join(difflib.unified_diff(file.decode('utf-8').splitlines(keepends=True),updated.decode('utf-8').splitlines(keepends=True),
    fromfile='a/'+path,tofile='b/'+path)).encode('utf-8')
(here/'c24-goods-stock-expectation.patch').write_bytes(patch)
index = {'correction24Item2':True,'head':head,'tree':tree,'path':path,'line':file[:start].count(b'\n')+1,
    'startByte':start,'endByte':start+len(a),'before':a.decode('utf-8'),'after':b.decode('utf-8'),
    'workingBeforeSHA256':sha(file),'workingAfterSHA256':sha(updated),'gitBeforeSHA256':sha(blob),
    'gitAfterSHA256':sha(blob.replace(a,b,1)),'patchSHA256':sha(patch),
    'reason':'Five full weekly reports include 4,000 milli of approved B4 wages per week. Both viewport cases already match every full report and checkpoint; retain the original 30,000-milli debit and add the exact 20,000-milli wages to the final equality.',
    'red':'gate-8-smoke-c24.txt','greenExpected':'c24-goods-stock-green.txt'}
(here/'c24-goods-stock-expectation.json').write_bytes((json.dumps(index,ensure_ascii=False,indent=2)+'\n').encode())
print(path + ':' + str(index['line']))
print('Patch SHA-256 ' + index['patchSHA256'])

