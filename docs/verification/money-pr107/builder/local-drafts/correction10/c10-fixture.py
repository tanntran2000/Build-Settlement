from pathlib import Path
from hashlib import sha256
import json

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction10')
file=out/'unit-test-bytes.json'
original=file.read_bytes()
payload=json.loads(original)
path='packages/simulation/src/__tests__/purse-command.test.ts'
entry=next(e for e in payload['entries'] if e['path']==path)
dst=wt/path
old=dst.read_bytes()
assert old==entry['after'].encode('utf-8')
log=(out/'green-focus.txt').read_text(encoding='utf-8')
assert 'expected 6076 to be 6000' in log
a="    const closed = close(act(initial, 'SET_LEVY', { percent }).next);"
b="""    const noMarket = act(initial, 'SET_ENABLED', { tileId: 'spec-1', enabled: false }).next;
    const closed = close(act(noMarket, 'SET_LEVY', { percent }).next);"""
eol='\r\n' if b'\r\n' in old else '\n'
s=old.decode('utf-8')
assert s.count(a)==1
after=s.replace(a,b.replace('\n',eol))
assert s.endswith('\n')==after.endswith('\n')
entry['after']=after
entry['afterSha256']=sha256(after.encode('utf-8')).hexdigest()
(out/'unit-test-bytes-attempt1.json').write_bytes(original)
dst.write_bytes(after.encode('utf-8'))
file.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Disabled opening Goods sales in the wholly donatable levy fixture.')
