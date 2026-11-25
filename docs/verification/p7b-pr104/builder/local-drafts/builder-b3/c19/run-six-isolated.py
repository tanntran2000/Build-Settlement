from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import subprocess
import sys

here=Path(__file__).resolve().parent
prior=here.parent/'c18'
root=Path.cwd()
manifest=json.loads((prior/'bundle'/'bundle-and-served-hashes.json').read_bytes())
head=subprocess.check_output(('git','rev-parse','HEAD')).decode().strip()
tree=subprocess.check_output(('git','rev-parse','HEAD^{tree}')).decode().strip()
assert (manifest['head'],manifest['tree'])==(head,tree)
for entry in manifest['manifest']:
    package=root/'packages/ui'
    dist=package/'dist' if entry['build']=='production' else package/'regression/dist'
    assert sha256((dist/'index.html').read_bytes()).hexdigest()==entry['indexSha256']
    for asset in entry['assets']:
        assert sha256((dist/asset['file']).read_bytes()).hexdigest()==asset['sha256']
print('Existing production and regression builds match the verified C18 assets. C19 changes only the test fixtures.',flush=True)

baseline=(prior/'gate-8-smoke.txt').read_text(encoding='utf-8')
sections=list(re.finditer(r'^\s*(\d+) failed\s*$',baseline,re.M))
assert sections and sections[-1].group(1)=='6'
cases=re.findall(r'^\s*\[chromium\] › (.+?\.spec\.ts):(\d+):\d+ › (.+?)\s*$',
                 baseline[sections[-1].end():],re.M)
assert len(cases)==6
env=dict(os.environ,CI='1')
output=here/'six-isolated'
output.mkdir(exist_ok=True)
seen=[]
for number,(file,old_line,title) in enumerate(cases,1):
    full_title=' '.join(title.split(' › '))
    pattern=re.escape(full_title).replace(chr(92)+' ',' ')+r'(?: @[^ ]+)*$'
    command=['node','node_modules/@playwright/test/cli.js','test',file.replace(chr(92),'/'),'--grep',pattern,
             '--output',str(output/f'{number:02}-artifacts')]
    selector=f'green-selection-{number:02}'
    operation=[sys.executable,str(here/'run.py')]
    listed=subprocess.run([*operation,selector,*command,'--list'],env=env,check=False)
    listing=(here/(selector+'.txt')).read_text(encoding='utf-8')
    assert listed.returncode==0 and re.search(r'^Total: 1 test in 1 file$',listing,re.M),(file,title)
    label=f'green-isolated-{number:02}'
    execution=subprocess.run([*operation,label,*command],env=env,check=False)
    report=(here/(label+'.txt')).read_text(encoding='utf-8')
    seen.append(dict(file=file,baselineLine=int(old_line),title=title,exit=execution.returncode,
                     exactlyOne='Running 1 test using 1 worker' in report,log=label+'.txt'))
data=dict(head=head,tree=tree,ci=1,utc=datetime.now(timezone.utc).isoformat(),results=seen)
(output/'results.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(data,ensure_ascii=True))
assert all(row['exit']==0 and row['exactlyOne'] for row in seen)
