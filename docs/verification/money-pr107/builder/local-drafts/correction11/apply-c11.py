from datetime import datetime, UTC
from hashlib import sha256
from pathlib import Path
import json, subprocess

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
local=Path('C:/Users/Admin/.t3/local-drafts/money-prM2')
out=local/'correction11'
out.mkdir(exist_ok=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=wt,text=True).strip()
assert head=='fa66b594391029ddb2cb43d98a90e9a8a4735446'
assert not subprocess.check_output(['git','status','--porcelain=v1'],cwd=wt)
file=wt/'tests/e2e/purse.spec.ts'
before=file.read_bytes()
suffix=Path(__file__).with_name('append-c11.txt').read_bytes()
assert before.endswith(b'\n') and suffix.startswith(b'\n') and suffix.endswith(b'\n')
if b'\r\n' in before: suffix=suffix.replace(b'\n',b'\r\n')
after=before+suffix
record={'baseHead':head,'path':file.relative_to(wt).as_posix(),'beforeSha256':sha256(before).hexdigest(),
 'afterSha256':sha256(after).hexdigest(),'before':before.decode('utf-8'),'after':after.decode('utf-8')}
(out/'test-bytes.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
file.write_bytes(after)
print('Appended',len(suffix),'test bytes to',record['path'])
