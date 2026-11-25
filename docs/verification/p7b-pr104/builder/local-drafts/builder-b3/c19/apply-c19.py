from pathlib import Path
from hashlib import sha256
import json
from base64 import b64encode
from difflib import SequenceMatcher
import runpy
import subprocess

here = Path(__file__).resolve().parent
scope = runpy.run_path(str(here/'scope-c19.py'))
base = 'dfcc524b043ee3135746121f4384342a8dbf6e5e'
def git(*args):
    return subprocess.check_output(('git', *args))
assert git('rev-parse','HEAD').decode().strip()==base
assert git('status','--porcelain=v1','--untracked-files=all')==b''
assert git('branch','--show-current').decode().strip()=='feat/p7b-acquisition-market'
changes = []
for path in sorted(scope['EDITS']):
    before=git('cat-file','blob',base+':'+path)
    assert b'\r\n' not in before and Path(path).read_bytes().replace(b'\r\n',b'\n')==before,path
    after=scope['replace_expected'](path,before)
    left,right=before.splitlines(keepends=True),after.splitlines(keepends=True)
    starts=[0]
    for line in left:
        starts.append(starts[-1]+len(line))
    spans=[]
    for op,start,end,new_start,new_end in SequenceMatcher(None,left,right,autojunk=False).get_opcodes():
        if op != 'equal':
            removed,added=b''.join(left[start:end]),b''.join(right[new_start:new_end])
            spans.append(dict(offset=starts[start],removedBase64=b64encode(removed).decode(),insertedBase64=b64encode(added).decode(),
                              removedUtf8=removed.decode(),insertedUtf8=added.decode()))
    changes.append((path,after,dict(path=path,oldSha256=sha256(before).hexdigest(),newSha256=sha256(after).hexdigest(),
                             oldBytes=len(before),newBytes=len(after),replacements=spans)))
index=here/'correction19-byte-inventory.json'
with index.open('x',encoding='utf-8',newline='\n') as output:
    output.write(json.dumps({'reviewedHead':base,
        'planSha256':'7af6beafd85ef7102215e265aca3b28c2a07198a832ec8152bbb9de44af66fd9',
        'encoding':'Zero-based original byte offsets. Payloads include line endings.',
        'entries':[entry for _,_,entry in changes]},ensure_ascii=False,indent=2)+'\n')
for path,after,entry in changes:
    Path(path).write_bytes(after)
    print(f'{path}: {len(entry["replacements"])} spans; {entry["oldSha256"]} -> {entry["newSha256"]}')
print('Applied only the two fixture scopes and the long-report command oracle week argument.')
