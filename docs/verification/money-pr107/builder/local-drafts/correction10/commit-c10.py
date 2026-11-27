from pathlib import Path
from hashlib import sha256
from datetime import datetime, UTC
import json,re,subprocess,sys

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction10')
base='546c48b9f312144c494a48dd44fe41741c9c2470'
def git(*args):return subprocess.check_output(['git',*args],cwd=wt)
def read(name):return (out/name).read_text(encoding='utf-8')
assert git('rev-parse','HEAD').decode().strip()==base
assert git('branch','--show-current').decode().strip()=='feat/money-purse'
assert not git('diff','--cached','--name-only')
assert re.search(r'^Exit 1 in ',read('red-product.txt'),re.M)
for name in ('green-focus-2.txt','e2e-tsc-2.txt','browser-focus-2.txt'):
    assert re.search(r'^Exit 0 in ',read(name),re.M),name
variants=json.loads(read('mutations/summary.json'))
assert len(variants)==14 and all(v['exit']==1 for v in variants)
entry={}
for name in ('unit-test-bytes.json','implementation-bytes.json'):
    data=json.loads(read(name))
    assert data['baseHead']==base
    entry.update({e['path']:e for e in data['entries']})
paths=set(git('diff','--name-only','HEAD').decode().splitlines())
assert paths==set(entry)
assert not git('ls-files','--others','--exclude-standard')
product={'packages/core/src/data/validate.ts','packages/ui/src/PursePanel.svelte','packages/ui/src/purse-view.ts'}
assert paths-product=={p for p in paths if '/__tests__/' in p or p.startswith('tests/e2e/')}
assert len(paths)==12
for p,e in entry.items():
    b=(wt/p).read_bytes()
    prior=e['before'].encode('utf-8')
    assert prior.replace(b'\r\n',b'\n')==git('show',f'{base}:{p}').replace(b'\r\n',b'\n'),p
    assert sha256(prior).hexdigest()==e['beforeSha256'],p
    assert sha256(b).hexdigest()==e['afterSha256'],p
    assert b==e['after'].encode('utf-8'),p
subprocess.run(['git','add','--',*sorted(paths)],cwd=wt,check=True)
subprocess.run(['git','diff','--cached','--check'],cwd=wt,check=True)
cmd=['git','commit','-m','fix: purse cost preview, levy divisor and stricter purse tests']
r=subprocess.run(cmd,cwd=wt,capture_output=True)
log=r.stdout+r.stderr
if r.returncode==0:
    head,tree=git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
    assert not git('status','--porcelain=v1')
    log+=f'\nUTC {datetime.now(UTC).isoformat()}\nHEAD {head}\nTree {tree}\n'.encode()
log+=f'Exit {r.returncode}\n'.encode()
(out/'fix-commit.txt').write_bytes(log)
sys.stdout.buffer.write(log)
if r.returncode:sys.exit(r.returncode)
stat=git('diff','--stat',base+'..HEAD').decode()
assert set(git('diff','--name-only',base+'..HEAD').decode().splitlines())==paths
carry=(f'Compared {base}..{head}\nCommand git diff --stat {base}..HEAD\n{stat}\n'
       'The diff is limited to packages/ui/, packages/core/src/data/validate.ts and tests.\n'
       'Simulation source and shipped tuning are unchanged. The divisor rule checks inputs when the profile is loaded.\n'
       'Correction 10 permits carrying the 0%/5% End Week timing evidence from the reviewed head.\n'
       'Source ../round3-c9/measurement-1/measurement-summary.json and raw-timings.ndjson.\n')
(out/'timing-carry-scope.txt').write_text(carry,encoding='utf-8',newline='\n')
print(carry)
