from pathlib import Path
from tempfile import mkdtemp
from tarfile import open as taropen
from datetime import datetime, timezone
from hashlib import sha256
import json, subprocess

here=Path(__file__).resolve().parent
repo=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
base='0b2b3a6088d003301d48b460202327fb53546ede'
reference=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/round3-c9/measurement-1')
root=Path(mkdtemp(prefix='money-m3-baseline-'))
tar=root/'baseline.tar'
cmd=['git','archive','--format=tar','--output='+str(tar),base,'packages/core/src','packages/simulation/src','packages/persistence/src','packages/content/src']
subprocess.run(cmd,check=True,cwd=repo)
with taropen(tar) as source:
    source.extractall(root,filter='data')
paths=[Path('packages')/p/'src/index.ts' for p in ('core','simulation','persistence','content')]
assert all((root/p).is_file() for p in paths)
records={
    'command':cmd,'base':base,'root':str(root),'archiveSha256':sha256(tar.read_bytes()).hexdigest(),
    'fixtureSha256':{d:sha256((reference/(d+'-100-npc.json')).read_bytes()).hexdigest()
                     for d in ['normal','easy']},
    'utc':datetime.now(timezone.utc).isoformat(),
}
(here/'benchmark-base.json').write_bytes((json.dumps(records,indent=2)+'\n').encode())
print(root)

