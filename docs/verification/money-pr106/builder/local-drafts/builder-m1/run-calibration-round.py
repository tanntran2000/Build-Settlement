
from pathlib import Path
from hashlib import sha256
from datetime import datetime,timezone
import os,json,subprocess,sys
root=Path(r'C:\Users\Admin\.t3\local-drafts\money-prM1')
b=root/'builder-m1'
scratch=root/'_scratch/tree'
round=sys.argv[1]
assert round in ('round1','round2')
files=json.loads((b/f'{round}-data-bytes.json').read_bytes())
for item in files:assert sha256((scratch/item['path']).read_bytes()).hexdigest()==item['afterSha256']
for name in ['packages/simulation/src/tile-trial-week.ts','packages/simulation/src/workshop-operation.ts','packages/simulation/src/law-week.ts',
 'packages/core/src/character/validate.ts','packages/simulation/src/__tests__/difficulty-week.test.ts','scripts/money-calibration.ts','scripts/p7b-road-balance.ts']:
    assert (scratch/name).read_bytes()==Path(name).read_bytes(),name
result=b/f'calibration-{round}.json'
assert not result.exists(),result
command=['node','scripts/money-calibration.ts',str(result)]
def now():return datetime.now(timezone.utc).isoformat()
with (b/f'calibration-{round}-run.txt').open('wb') as f:
    f.write((f'M1.1 HEAD 63d2b2627b57d172be8459c64989e42ff650f692\nM1.1 tree 83a17c4de3eaad26b867155d512a2f898683b91b\n'
      f'UTC start {now()}\nCommand {subprocess.list2cmdline(command)}\nScratch {scratch}\n'+
      '\n'.join(f'{item["afterSha256"]}  {item["path"]}' for item in files)+'\n\n').encode())
    f.flush()
    run=subprocess.run(command,cwd=scratch,stdout=f,stderr=subprocess.STDOUT,env=dict(os.environ,NO_COLOR='1',FORCE_COLOR='0'))
    f.write(f'\nExit {run.returncode}\nUTC end {now()}\n'.encode())
print('Round',round,'exit',run.returncode)
for line in (b/f'calibration-{round}-run.txt').read_text(encoding='utf-8').splitlines()[-15:]:
    print(line.encode('ascii','backslashreplace').decode())
if run.returncode==0:
    data=json.loads(result.read_bytes())
    assert len(data['summary'])==18 and len(data['rows'])<=720
    print('Rows',len(data['rows']),'Grid cases',len(data['summary']),'SHA-256',sha256(result.read_bytes()).hexdigest())
sys.exit(run.returncode)
