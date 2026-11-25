from hashlib import sha256
import json
from pathlib import Path
import re
import shutil
from zipfile import ZipFile

here=Path(__file__).resolve().parent
raw=Path('test-results')
log=(here/'gate-8-smoke.txt').read_text(encoding='utf-8')
summary=re.findall(r'^\s*(\d+) failed\s*$',log,re.M)
assert summary, 'The full smoke suite has no recorded failures.'
results=data=[]
for trace in sorted(raw.rglob('trace.zip')):
    with ZipFile(trace) as archive:
        raw_errors=[obj for line in archive.read('test.trace').decode('utf-8').splitlines()
                    if (obj:=json.loads(line)).get('type')=='error']
    if not raw_errors:
        continue
    destination=here/'smoke-full-failures'/trace.parent.name
    destination.mkdir(parents=True,exist_ok=True)
    shutil.copy2(trace,destination/'trace.zip')
    context=trace.parent/'error-context.md'
    if context.is_file():
        shutil.copy2(context,destination/context.name)
    data.append({'folder':trace.parent.name,'traceSha256':sha256(trace.read_bytes()).hexdigest(),
                 'errors':raw_errors})
assert len(data)==int(summary[-1]),len(data)
(here/'smoke-full-failures'/'trace-errors.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',
                                                      encoding='utf-8',newline='\n')
print(f'Archived all {len(data)} original failure traces and their captured errors.')
