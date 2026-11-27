from datetime import datetime, UTC
from hashlib import sha256
from pathlib import Path
import json, re, subprocess, sys

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction11')
base='fa66b594391029ddb2cb43d98a90e9a8a4735446'
packet=json.loads((out/'test-bytes.json').read_text(encoding='utf-8'))
path=packet['path']
assert path=='tests/e2e/purse.spec.ts'
assert packet['baseHead']==base
def git(*args):return subprocess.check_output(['git',*args],cwd=wt)
def read(name):return (out/name).read_text(encoding='utf-8')
assert git('rev-parse','HEAD').decode().strip()==base
assert git('branch','--show-current').decode().strip()=='feat/money-purse'
assert git('diff','--name-only','HEAD').decode().splitlines()==[path]
assert not git('diff','--cached','--name-only') and not git('ls-files','--others','--exclude-standard')
for log,code in [('mutation-build.txt',0),('mutation-smoke.txt',1),('focused-smoke.txt',0),('e2e-tsc.txt',0)]:
    text=read(log)
    assert text.startswith('HEAD '+base+'\n'),log
    assert re.search(r'^Exit '+str(code)+r' in ',text,re.M),log
    if log!='mutation-build.txt': assert packet['afterSha256'] in text,log
assert '1 failed' in read('mutation-smoke.txt') and '2 passed' in read('mutation-smoke.txt')
assert '−1 Money · +0.5 Gold' in read('mutation-smoke.txt') and '−1 Money · 0 Gold' in read('mutation-smoke.txt')
assert '3 passed' in read('focused-smoke.txt')
before,after=(packet[k].encode('utf-8') for k in ('before','after'))
normalize=lambda b:b.replace(b'\r\n',b'\n')
assert after.startswith(before) and (wt/path).read_bytes()==after
assert git('show',f'{base}:{path}')==normalize(before)
for label,b in [('before',before),('after',after)]:
    assert sha256(b).hexdigest()==packet[label+'Sha256']
subprocess.run(['git','add','--',path],cwd=wt,check=True)
assert git('show',f':{path}')==normalize(after)
subprocess.run(['git','diff','--cached','--check'],cwd=wt,check=True)
r=subprocess.run(['git','commit','-m','test(e2e): restore fractional Easy donation report check'],cwd=wt,capture_output=True)
log=r.stdout+r.stderr
if r.returncode==0:
    assert not git('status','--porcelain=v1')
    head,tree=git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
    log+=f'\nUTC {datetime.now(UTC).isoformat()}\nHEAD {head}\nTree {tree}\n'.encode()
log+=f'Exit {r.returncode}\n'.encode()
(out/'test-commit.txt').write_bytes(log)
sys.stdout.buffer.write(log)
if r.returncode:sys.exit(r.returncode)
stat=git('diff','--stat',base+'..HEAD').decode()
assert git('diff','--name-only',base+'..HEAD').decode().splitlines()==[path]
assert git('diff','--numstat',base+'..HEAD').decode().split()[1:]==['0',path]
scope=(f'Compared {base}..{head}\nCommand git diff --stat {base}..HEAD\n{stat}\n'
    'The diff touches only tests/e2e/purse.spec.ts. Correction 11 permits carrying the bundle and End Week timings.\n'
    'Bundle from fa66b59, ../correction10/bundle.json and gzip/.\n'
    'End Week 0%/5% timings from 546c48b, ../round3-c9/measurement-1/measurement-summary.json and raw-timings.ndjson.\n')
(out/'measurement-carry-scope.txt').write_text(scope,encoding='utf-8',newline='\n')
print(scope)
