from pathlib import Path
from hashlib import sha256
import json,re

root=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/round3-c9')
raw_dir=root/'original-log-order'
change_list=[]
header=re.compile(rb'HEAD [0-9a-f]{40}\nTree [0-9a-f]{40}\norigin/main [0-9a-f]{40}\nUTC start [^\n]+\nCI [^\n]+\nVITEST_MAX_WORKERS 3\nCommand [^\n]+\n\n')
for p in sorted(root.glob('gate-attempt*-*-*.txt')):
    raw=p.read_bytes()
    if not re.search(rb'^Exit \d+ in ',raw,re.M):continue
    match=header.search(raw)
    assert match and not header.search(raw,match.end()),p
    if match.start()==0:continue
    raw_dir.mkdir(exist_ok=True)
    (raw_dir/p.name).write_bytes(raw)
    fixed=match[0]+raw[:match.start()]+raw[match.end():]
    assert len(raw)==len(fixed)
    p.write_bytes(fixed)
    change_list.append({'log':p.name,'originalSha256':sha256(raw).hexdigest(),
      'normalizedSha256':sha256(fixed).hexdigest(),'headerOffset':match.start(),'headerLength':len(match[0])})
journal=root/'log-order-normalization.json'
if change_list:
    prior=json.loads(journal.read_bytes()) if journal.is_file() else []
    journal.write_text(json.dumps(prior+change_list,indent=2)+'\n',encoding='utf-8',newline='\n')
print(len(change_list),'completed logs normalized')
