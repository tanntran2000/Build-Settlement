from pathlib import Path
from hashlib import sha256
from base64 import b64decode, b64encode
from difflib import unified_diff
import json, re

p=Path(__file__).resolve().parent
root=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scratch=Path((p.parent/'.scratch-path').read_text().strip())
path='packages/simulation/src/__tests__/home-robbery.test.ts'
pack=p/'generated-byte-proposals.json'
data=json.loads(pack.read_bytes())
entry=next(e for e in data['files'] if e['path']==path)
old=b64decode(entry['afterBase64'])
assert old.endswith(b'\n\n')
assert (root/path).read_bytes()==(scratch/path).read_bytes()==old
fixed=old[:-1]
entry.update(afterBase64=b64encode(fixed).decode(), afterUtf8=fixed.decode(), afterBytes=len(fixed),
             afterSha256=sha256(fixed).hexdigest())
pack.write_bytes((json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode())
(root/path).write_bytes(fixed)
(scratch/path).write_bytes(fixed)
original=json.loads((p.parent/pack.name).read_bytes())
base=next(e['afterUtf8'] for e in original['files'] if e['path']==path)
diff=p/'correction12.diff'
text=diff.read_text('utf-8')
a=text.index('--- step0/'+path+'\n')
b=text.index('\n--- step0/',a)+1
hunks=''.join(unified_diff(base.splitlines(keepends=True),fixed.decode().splitlines(keepends=True),
                          fromfile='step0/'+path,tofile='correction12/'+path))
diff.write_bytes((text[:a]+hunks+text[b:]).encode())
compose=p/'compose.py'
text=compose.read_text('utf-8')
needle="exec((here/'tests.pyfrag').read_text('utf-8'))"
assert text.count(needle)==1
text=text.replace(needle,needle+f"\n# The added reserve cases terminate with exactly one newline.\nfiles[{path!r}] = files[{path!r}].rstrip(b'\\n') + b'\\n'")
compose.write_bytes(text.encode())
print('Removed one redundant EOF newline and refreshed its byte inventory.')

