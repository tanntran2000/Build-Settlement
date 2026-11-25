from base64 import b64decode, b64encode
from difflib import SequenceMatcher
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
DRAFTS = HERE.parents[1]
MAIN = 'b184357d235d164478584e36b96d063551124e66'
C13 = '825ca5c27cc3d440705dffb6b41699d1dcbd2e4e'
C14 = '8aa7dc4cefbc759ce2a7d158937011c3afe71549'
C14_MANIFEST = '0b4b50dc18814709903b1485e9b52e7dcbf2ecc312a22cea8100a6ea18b3f91f'
REVIEW1_SHA = 'e4ac174223420005f28265d7126b5ee6b896d70a29960208152d4d202b70e2b9'
REVIEW2_SHA = '95ddfbfed8d80da6ed3acabba49e11a9e0d33bbc5dcaf2422588e5c42a0056c7'
PLAN_SHA = '3d0d37de274f4161e4b0872ce42f61d3cd3831e1a8e5e0e5eb7d7513b907e11a'
INVENTORY = HERE/'correction16-byte-inventory.json'
SCOPE = {
    'packages/core/src/__tests__/helpers/npcs.ts': 'R2-1 current-week test fixture offer proof',
    'packages/core/src/character/validate.ts': 'R2-1 through R2-4 Character Life JSON boundary',
    'packages/core/src/trial/acquisition-replay.ts': 'R2-1 through R2-4 replay, continuity and world compatibility',
    'packages/persistence/src/session-records.ts': 'R2-1 through R2-4 Character Life row boundary',
    'packages/persistence/src/__tests__/item-records.test.ts': 'R2-1 synthetic colon owner without a live purchase',
    'packages/persistence/src/__tests__/items-rebuild-order.test.ts': 'R2-1 synthetic numeric and prototype owners without live purchases',
    'packages/simulation/src/__tests__/character-life-command.test.ts': 'R2-1 exact parity oracle for legal retained fixture purchases',
    'packages/simulation/src/__tests__/character-life-observation.test.ts': 'R2-1 exact retained-purchase report for the legal fixture',
    'packages/simulation/src/__tests__/npc-homes.test.ts': 'R2-1 earlier purchase dates for a market-free existing roster',
    'packages/simulation/src/__tests__/replay-checkpoint.test.ts': 'R2-1 through R2-4 regression coverage',
}

def git(*args):
    return subprocess.check_output(('git', *args))
def digest(data):
    return sha256(data).hexdigest()
def blob(ref,path):
    return git('cat-file','blob',ref+':'+path)
def paths(*args):
    return set(git(*args).decode('utf-8').splitlines())

def spans(before, after):
    left, right = before.splitlines(keepends=True), after.splitlines(keepends=True)
    offsets = [0]
    for line in left:
        offsets.append(offsets[-1] + len(line))
    for tag, start, end, first, last in SequenceMatcher(None,left,right,autojunk=False).get_opcodes():
        if tag != 'equal':
            yield {'offset':offsets[start], 'removedBase64':b64encode(b''.join(left[start:end])).decode(),
                   'insertedBase64':b64encode(b''.join(right[first:last])).decode()}

def rebuild(before, replacements):
    parts = []
    cursor = 0
    for entry in replacements:
        pos = entry['offset']
        removed = b64decode(entry['removedBase64'],validate=True)
        inserted = b64decode(entry['insertedBase64'],validate=True)
        assert cursor <= pos and before[pos:pos+len(removed)] == removed
        parts.extend((before[cursor:pos],inserted))
        cursor = pos+len(removed)
    return b''.join([*parts,before[cursor:]])

def checked(path, sha):
    content = path.read_bytes()
    assert digest(content) == sha, path
    return content

mode = sys.argv[1]
assert mode in {'capture','index','head'}
checked(DRAFTS/'binding-plan-6f83a48.md',PLAN_SHA)
checked(DRAFTS/'astra-review'/'astra-round2.md',REVIEW2_SHA)
review1 = checked(DRAFTS/'astra-review'/'astra-round1.md',REVIEW1_SHA).decode('utf-8')
approved = dict(re.findall(r'^\| [AM] \| \[([^\]]+)\].+\x60([0-9a-f]{64})\x60 \|$',review1,re.M))
assert len(approved)==86 and set(approved)==paths('diff','--name-only',MAIN,C13)
assert all(digest(blob(C13,path))==sha for path,sha in approved.items())
c14_dir = HERE.parent/'c14'
manifest = dict(line.split('  ',1)[::-1] for line in checked(c14_dir/'SHA256SUMS.txt',C14_MANIFEST).decode().splitlines())
c14_name = 'correction14-byte-inventory.json'
c14_entries = json.loads(checked(c14_dir/c14_name,manifest[c14_name]))['entries']
assert len(c14_entries)==20 and sum(len(e['replacements']) for e in c14_entries)==53
assert git('rev-parse',C14+'^').decode().strip()==C13
assert set(e['path'] for e in c14_entries)==paths('diff','--name-only',C13,C14)
for entry in c14_entries:
    path = entry['path']
    before, after = blob(C13,path), blob(C14,path)
    assert digest(before)==entry['oldSha256'] and digest(after)==entry['newSha256']
    assert rebuild(before,entry['replacements'])==after
    approved[path] = entry['newSha256']
assert all(digest(blob(C14,path))==sha for path,sha in approved.items())
print(f'Approved packet + Corrections 12–14 verified for {len(approved)} paths at {C14}.')

assert git('branch','--show-current').decode().strip()=='feat/p7b-acquisition-market'
assert git('rev-parse','origin/main').decode().strip()==MAIN
assert not git('ls-files','--others','--exclude-standard')
if mode == 'head':
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    assert git('rev-parse','HEAD^').decode().strip()==C14
    assert paths('diff','--name-only',C14,'HEAD')==set(SCOPE)
    assert paths('diff','--name-only',MAIN,'HEAD')==set(approved)|set(SCOPE)
    assert all(digest(blob('HEAD',path))==sha for path,sha in approved.items() if path not in SCOPE)
else:
    assert git('rev-parse','HEAD').decode().strip()==C14
    assert paths('diff','--name-only',C14)==set(SCOPE)
    staged = paths('diff','--cached','--name-only',C14)
    assert staged == (set(SCOPE) if mode=='index' else set())

if mode == 'capture':
    entries = []
    for path,finding in sorted(SCOPE.items()):
        before, after = blob(C14,path), Path(path).read_bytes()
        assert before != after and (b'\r\n' in before)==(b'\r\n' in after)
        entries.append({'path':path,'finding':finding,'oldSha256':digest(before),'newSha256':digest(after),
                        'oldBytes':len(before),'newBytes':len(after),'replacements':list(spans(before,after))})
    data = {'reviewedHead':C14,'planSha256':PLAN_SHA,'reviewSha256':REVIEW2_SHA,
            'encoding':'Zero-based old byte offsets. Base64 spans include all changed line endings.','entries':entries}
    with INVENTORY.open('x',encoding='utf-8',newline='\n') as output:
        output.write(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

inventory = json.loads(INVENTORY.read_bytes())
assert (inventory['reviewedHead'],inventory['planSha256'],inventory['reviewSha256'])==(C14,PLAN_SHA,REVIEW2_SHA)
entries=inventory['entries']
assert sorted(e['path'] for e in entries)==sorted(SCOPE)
for entry in entries:
    path=entry['path']
    assert entry['finding']==SCOPE[path]
    before=blob(C14,path)
    after=blob('HEAD',path) if mode=='head' else blob('',path) if mode=='index' else Path(path).read_bytes()
    assert (len(before),digest(before))==(entry['oldBytes'],entry['oldSha256'])
    assert (len(after),digest(after))==(entry['newBytes'],entry['newSha256'])
    assert rebuild(before,entry['replacements'])==after
    if mode=='index': assert Path(path).read_bytes()==after
    print(f'{path}  {entry["oldSha256"]} -> {entry["newSha256"]}  {entry["finding"]}')
print(f'PASS {mode}: {len(entries)} scoped paths, {sum(len(e["replacements"]) for e in entries)} exact byte spans. Extra paths: 0.')
