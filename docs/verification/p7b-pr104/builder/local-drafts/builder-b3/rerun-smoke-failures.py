from pathlib import Path
from datetime import datetime, timezone
import json
import os
import re
import subprocess
import sys

ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
EVIDENCE = Path(__file__).resolve().parent
run = (EVIDENCE/'gate-8-smoke.txt').read_text(encoding='utf-8')
assert 'CI=1' in run and re.search(r'^Exit [1-9]\d*$',run,re.M), 'The exact CI smoke did not fail'
sections=list(re.finditer(r'^\s*(\d+) failed\s*$',run,re.M))
if not sections:
    raise SystemExit('No individually reported failed cases. Preserve the smoke infrastructure failure.')
tail = run[sections[-1].end():]
cases=[]
for match in re.finditer(r'^\s*\[chromium\] › (.+?\.spec\.ts):(\d+):\d+ › (.+?)\s*$',tail,re.M):
    item=match.groups()
    if item not in cases: cases.append(item)
assert len(cases)==int(sections[-1].group(1)),cases
env=dict(os.environ,CI='1')
out=EVIDENCE/'smoke-isolated-reruns'
out.mkdir(exist_ok=True)
results=[]
for i,(file,line,title) in enumerate(cases,1):
    # A line can expand multiple parameterized cases. Pin the leaf title too.
    leaf=title.split(' › ')[-1].strip()
    pattern=re.sub(r'([.*+?^$(){}\[\]\\|])',r'\\\1',leaf)+'$'
    command=['node','node_modules/@playwright/test/cli.js','test',file+':'+line,'--grep',pattern,'--output',str(out/f'{i:02}-artifacts')]
    label=f'smoke-isolated-{i:02}'
    rc=subprocess.call([sys.executable,str(EVIDENCE/'run.py'),label,*command],cwd=ROOT,env=env)
    text=(EVIDENCE/(label+'.txt')).read_text(encoding='utf-8')
    results.append(dict(file=file,line=int(line),title=title,command=command,exit=rc,
                        exactlyOne='Running 1 test using 1 worker' in text,log=label+'.txt'))
summary=dict(utc=datetime.now(timezone.utc).isoformat(),smoke='gate-8-smoke.txt',ci=1,results=results)
(out/'results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=True))
assert all(result['exactlyOne'] for result in results)
