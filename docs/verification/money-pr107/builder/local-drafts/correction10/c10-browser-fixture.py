from pathlib import Path
from hashlib import sha256
import json,sys

scratch=Path(__file__).parent
wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction10')
file=out/'implementation-bytes.json'
path='tests/e2e/purse.spec.ts'
payload=json.loads(file.read_bytes())
e=next(row for row in payload['entries'] if row['path']==path)
before=(wt/path).read_bytes()
assert before==e['after'].encode('utf-8')
a=b'    s.city.society!.difficulty = difficulty;'
b=b'    s.city.society = { ...s.city.society!, difficulty };'
assert before.count(a)==1
after=before.replace(a,b)
e['after']=after.decode('utf-8')
e['afterSha256']=sha256(after).hexdigest()
(out/'implementation-bytes-attempt1.json').write_bytes(file.read_bytes())
(wt/path).write_bytes(after)
file.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
candidate=scratch/'packet'/path
assert candidate.read_bytes()==before
candidate.write_bytes(after)
print('Set difficulty by replacing the test fixture society record with a typed copy.')
