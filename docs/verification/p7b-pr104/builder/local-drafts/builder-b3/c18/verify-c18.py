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
assert mode in {'rehydrate','annotate','worktree','index','head'}
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


PLAN17_SHA = '993347f6f03c076b968dd75af7bfecef6cbd7b35b4f8dde96d9c0a8c8a5d0d90'
HELD_SHA = 'c03df67f9b3e1988fff779de4fa8f0dcd71008535665e46760377306c0c0ce78'
CANDIDATE_SHA = '6f1de8483a6204fa0ea52d69b67d33e45e67dec3924a5e5072d18205bcca37b5'
C16_README_SHA = '66a51801e60d21e9400cfcbae32243cae93c6bca32217d2df3933014d05cf31d'
TYPE_FILE = 'packages/core/src/trial/acquisition-replay.ts'
C16 = HERE.parent/'c16'
MARKER = b'function acquisitionKey(id: string) {'
SIGNATURE = b'function acquisitionKey(id: string)'
INSERTION = b": { boughtWeek: number; source: AcquisitionSource; slot: number | 'lot' } | undefined"

checked(DRAFTS/'binding-plan-98fccdf.md',PLAN17_SHA)
checked(C16/'README.md',C16_README_SHA)
patch = C16/'candidate-held.patch'
checked(patch,HELD_SHA)
candidate = json.loads(checked(C16/'correction16-byte-inventory.json',CANDIDATE_SHA))
assert (candidate['reviewedHead'],candidate['planSha256'],candidate['reviewSha256'])==(C14,PLAN_SHA,REVIEW2_SHA)

assert git('branch','--show-current').decode().strip()=='feat/p7b-acquisition-market'
assert git('rev-parse','origin/main').decode().strip()==MAIN
assert not git('ls-files','--others','--exclude-standard')
raw = {}
held = {}
entries = candidate['entries']
assert sorted(entry['path'] for entry in entries)==sorted(SCOPE)
for entry in entries:
    path = entry['path']
    assert entry['finding']==SCOPE[path]
    base = blob(C14,path)
    assert (len(base),digest(base))==(entry['oldBytes'],entry['oldSha256'])
    restored = rebuild(base,entry['replacements'])
    assert (len(restored),digest(restored))==(entry['newBytes'],entry['newSha256'])
    raw[path] = base
    held[path] = restored
assert len(entries)==10 and sum(len(entry['replacements']) for entry in entries)==30


PLAN18_SHA = 'ff406413cbf3e00bcf2880b4a102fb2f912b9c308ef816a793f15d45ffb05d77'
C17_README_SHA = '69fc6116cce95aebc138fd75565faffa6cb67ac4518083c2d038d069f001f0f3'
C17_PATCH_SHA = '800a1f910530b04fa8380cf437724b1b6ac397f8aaf21f8d22152f5a8970e442'
C17_TYPE_SHA = '87ef1295ca9ec268b5d832ad1dcbcf21c97b73fec71d24cc0725e510f679e7da'
C17 = HERE.parent/'c17'
FIXTURE = 'packages/simulation/src/__tests__/character-life-command.test.ts'
TYPE18 = HERE/'correction18-type-inventory.json'
checked(DRAFTS/'binding-plan-9a66d06.md', PLAN18_SHA)
checked(C17/'README.md', C17_README_SHA)
patch17 = C17/'candidate-held.patch'
checked(patch17, C17_PATCH_SHA)

def insertion(path, before, match, anchor, new):
    assert before.count(match)==1 and match.startswith(anchor), path
    entry = {'path':path, 'heldSha256':digest(before), 'offset':before.index(match)+len(anchor),
             'removedBase64':'', 'insertedUtf8':new.decode(), 'insertedBase64':b64encode(new).decode(), 'addedBytes':len(new)}
    after = rebuild(before,[entry])
    entry.update(finalSha256=digest(after), finalBytes=len(after))
    return entry, after

type17, parsed = insertion(TYPE_FILE, held[TYPE_FILE], MARKER, SIGNATURE, INSERTION)
type17.update(planSha256=PLAN17_SHA,heldInventorySha256=CANDIDATE_SHA)
assert json.loads(checked(C17/'correction17-type-inventory.json',C17_TYPE_SHA)) == type17
expected17 = {**held, TYPE_FILE:parsed}

if mode=='head':
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    assert git('rev-parse','HEAD^').decode().strip()==C14
    assert paths('diff','--name-only',C14,'HEAD')==set(SCOPE)
    assert paths('diff','--name-only',MAIN,'HEAD')==set(approved)|set(SCOPE)
    assert all(digest(blob('HEAD',path))==sha for path,sha in approved.items() if path not in SCOPE)
else:
    assert git('rev-parse','HEAD').decode().strip()==C14
    assert paths('diff','--cached','--name-only') == (set(SCOPE) if mode=='index' else set())

if mode=='rehydrate':
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    git('-c','core.autocrlf=false','apply','--check',str(patch17))
    git('-c','core.autocrlf=false','apply','--whitespace=nowarn',str(patch17))
    assert paths('diff','--name-only',C14)==set(SCOPE)
    assert all(Path(path).read_bytes()==data for path,data in expected17.items())
    print('PASS rehydrate: 10 files match 30 Correction 16 spans and the single 85-byte Correction 17 insertion.')
    sys.exit(0)

type18, fixture = insertion(FIXTURE, expected17[FIXTURE], b"const r = raw.type === 'ASSIGN_NPC'", b'const r',
                            b': delegates.WorldNpcCityResult')
type18.update(planSha256=PLAN18_SHA, heldPatchSha256=C17_PATCH_SHA)
if mode=='annotate':
    assert all(Path(path).read_bytes()==data for path,data in expected17.items())
    assert not TYPE18.exists()
    Path(FIXTURE).write_bytes(fixture)
    with TYPE18.open('x',encoding='utf-8',newline='\n') as output:
        output.write(json.dumps(type18,ensure_ascii=False,indent=2)+'\n')
assert json.loads(TYPE18.read_bytes())==type18

expected = {**expected17, FIXTURE:fixture}
if mode!='head':
    assert paths('diff','--name-only',C14)==set(SCOPE)
for path, data in sorted(expected.items()):
    actual = blob('HEAD',path) if mode=='head' else blob('',path) if mode=='index' else Path(path).read_bytes()
    assert actual==data,path
    if mode=='index':
        assert Path(path).read_bytes()==data,path
    print(f'{path}  {digest(raw[path])} -> {digest(data)}  {SCOPE[path]}')

emit_inputs = [{'path':path,'before':b64encode(held[path]).decode(),'after':b64encode(expected[path]).decode()}
               for path in (TYPE_FILE,FIXTURE)]
emitted = subprocess.check_output(('node',str(HERE/'emit-proof.cjs')),input=json.dumps(emit_inputs).encode())
print(emitted.decode().strip())
for correction, edit in ((17,type17),(18,type18)):
    print(f"Correction {correction} inserted {edit['addedBytes']} UTF-8 bytes at offset {edit['offset']} of {edit['path']}: {edit['insertedUtf8']}")
print(f'PASS {mode}: 10 scoped paths, 30 reconstructed Correction 16 spans and 2 type-only insertions. Extra paths: 0.')
