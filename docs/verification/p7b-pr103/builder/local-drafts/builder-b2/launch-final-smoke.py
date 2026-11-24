from pathlib import Path
import datetime as dt
import subprocess
import sys
import json
import os

root=Path.cwd()
d=Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2')
bash=Path('C:/Program Files/Git/bin/bash.exe')
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip()
assert head=='f31310cb791f549a7672be47219c7578678b7058'
assert tree=='43ab9e682912eeadc3d4a4d2ef8ca1a7e3aba54d'
assert not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'])
metrics=json.loads((d/'b2-3-measurements.json').read_bytes())
assert metrics['head']==head and metrics['tree']==tree
assert all(a['servedIdentical'] for run in metrics['servedBuilds'] for a in run['assets'])
utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()
with (d/'b2-3-smoke.txt').open('wb') as log:
    log.write(f'UTC start {utc()}\nHEAD {head}\nTree {tree}\nVerified served-build hashes in b2-3-measurements.json\nCommand: Git Bash run-final-smoke.sh\n\n'.encode())
    log.flush()
    result=subprocess.run([str(bash),'--noprofile','--norc',str(d/'run-final-smoke.sh').replace('\\','/')],cwd=root,stdout=log,stderr=subprocess.STDOUT)
    log.write(f'\nUTC end {utc()}\nExit {result.returncode}\n'.encode())
report=d/'b2-3-smoke.json'
if report.exists():
    print(json.dumps(json.loads(report.read_bytes())['stats']))
else:
    print('Playwright JSON output was not written.')
print('\n'.join((d/'b2-3-smoke.txt').read_text(encoding='utf-8',errors='replace').splitlines()[-14:]))
sys.exit(result.returncode)

