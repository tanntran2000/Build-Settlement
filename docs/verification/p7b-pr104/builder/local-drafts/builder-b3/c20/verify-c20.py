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
assert mode in {'capture','worktree','index','head'}
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


import runpy

C18_HEAD='dfcc524b043ee3135746121f4384342a8dbf6e5e'
C18_TREE='1bb1779f9e610d4ab3f83432625f52ba0eea45d1'
PLAN19_SHA='7af6beafd85ef7102215e265aca3b28c2a07198a832ec8152bbb9de44af66fd9'
C18_README_SHA='7fc3cc6ecf3390fe7b7cccd059f86d5fa23cae0eec9b88a8b39bc8dad24d737e'
C18_DIAGNOSIS_SHA='938b4ffd5a9f6be3a4f56a5d1e7acba73a4c1f1715feb5d768870277f3b5bd6d'
C18_TYPE_SHA='66d1d9fac57d821815691219f9ded5149ccec26ad9f39f9dce7c820b0f11ad3b'
C18=HERE.parent/'c18'
checked(DRAFTS/'binding-plan-bf63532.md',PLAN19_SHA)
checked(C18/'README.md',C18_README_SHA)
checked(C18/'hold-diagnosis.md',C18_DIAGNOSIS_SHA)
assert git('rev-parse',C18_HEAD+'^').decode().strip()==C14
assert git('rev-parse',C18_HEAD+'^{tree}').decode().strip()==C18_TREE
assert paths('diff','--name-only',C14,C18_HEAD)==set(SCOPE)
assert paths('diff','--name-only',MAIN,C18_HEAD)==set(approved)|set(SCOPE)
assert all(digest(blob(C18_HEAD,path))==sha for path,sha in approved.items() if path not in SCOPE)

type18, fixture = insertion(FIXTURE, expected17[FIXTURE], b"const r = raw.type === 'ASSIGN_NPC'", b'const r',
                            b': delegates.WorldNpcCityResult')
type18.update(planSha256=PLAN18_SHA,heldPatchSha256=C17_PATCH_SHA)
assert json.loads(checked(C18/'correction18-type-inventory.json',C18_TYPE_SHA))==type18
expected18={**expected17,FIXTURE:fixture}
assert all(blob(C18_HEAD,path)==data for path,data in expected18.items())
emit_inputs=[{'path':path,'before':b64encode(held[path]).decode(),'after':b64encode(expected18[path]).decode()}
             for path in (TYPE_FILE,FIXTURE)]
proof=subprocess.check_output(('node',str(HERE/'emit-proof.cjs')),input=json.dumps(emit_inputs).encode())
print(proof.decode().strip())
print('Corrections 16–18 reconstructed against reviewed dfcc524: 10 paths, 30 earlier spans and 2 type-only insertions.')

scope=runpy.run_path(str(HERE.parent/'c19'/'scope-c19.py'))
approved19=set(scope['EDITS'])
inventory=json.loads(checked(HERE.parent/'c19'/'correction19-byte-inventory.json','e4f2b34908b4e52301a5fdfecfc71f105d31ebc40661453f6d7b1bbaef4b95d4'))
assert (inventory['reviewedHead'],inventory['planSha256'])==(C18_HEAD,PLAN19_SHA)
assert sorted(entry['path'] for entry in inventory['entries'])==sorted(approved19)

C19_HEAD='2dc0a650b597e86df68673437add18e356723037'
C19_TREE='aa7417db9948c096073681bde90423d93d85742f'
PLAN20_SHA='887164c35ffc07ba45ffef319159bf10d7266986b30686f8736e2d3ba0b8914b'
REVIEW3_SHA='6eff9a7f2e448b9c829b308e49ea10f96fd39d16b0bad32ea95b96a0a6276128'
C19_SHA='16b7023abd0cab573fa695629980165f6b8e18d18ebbf25a8bc020f49816f06b'
HELPER='packages/core/src/__tests__/helpers/npcs.ts'
TEST='packages/simulation/src/__tests__/guild-fixture-names.test.ts'
c20paths={HELPER,TEST}
inventory20=HERE/'correction20-byte-inventory.json'
checked(DRAFTS/'binding-plan-71a7839.md',PLAN20_SHA)
checked(DRAFTS/'astra-review'/'astra-round3.md',REVIEW3_SHA)
checked(HERE.parent/'c19'/'README.md',C19_SHA)
assert git('rev-parse',C19_HEAD+'^').decode().strip()==C18_HEAD
assert git('rev-parse',C19_HEAD+'^{tree}').decode().strip()==C19_TREE
assert paths('diff','--name-only',C18_HEAD,C19_HEAD)==approved19

approved_paths=set(approved)|set(SCOPE)|approved19
assert paths('diff','--name-only',MAIN,C19_HEAD)==approved_paths
assert all(blob(C19_HEAD,p)==blob(C18_HEAD,p) for p in approved_paths-approved19)
for entry in inventory['entries']:
    path=entry['path']
    before=blob(C18_HEAD,path)
    after=scope['replace_expected'](path,before)
    assert (len(before),digest(before))==(entry['oldBytes'],entry['oldSha256'])
    assert (len(after),digest(after))==(entry['newBytes'],entry['newSha256'])
    assert rebuild(before,entry['replacements'])==after==blob(C19_HEAD,path)
assert sum(len(e['replacements']) for e in inventory['entries'])==5
print('Pinned base verified at 2dc0a65, including all approved Corrections 12–14 and 16–19.')

untracked=paths('ls-files','--others','--exclude-standard')
if mode=='head':
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    assert git('rev-parse','HEAD^').decode().strip()==C19_HEAD
    assert paths('diff','--name-status',C19_HEAD,'HEAD')=={'M\t'+HELPER,'A\t'+TEST}
    assert paths('diff','--name-only',MAIN,'HEAD')==approved_paths|c20paths
    assert all(blob('HEAD',p)==blob(C19_HEAD,p) for p in approved_paths-c20paths)
else:
    assert git('rev-parse','HEAD').decode().strip()==C19_HEAD
    if mode=='index':
        assert not untracked
        assert paths('diff','--cached','--name-status',C19_HEAD)=={'M\t'+HELPER,'A\t'+TEST}
        assert not git('diff','--name-only')
    else:
        assert untracked=={TEST}
        assert paths('diff','--name-only',C19_HEAD)=={HELPER}
        assert not git('diff','--cached','--name-only')

original={HELPER:blob(C19_HEAD,HELPER),TEST:b''}
if mode=='capture':
    entries20=[]
    for path in sorted(c20paths):
        before,after=original[path],Path(path).read_bytes()
        assert before!=after and b'\r\n' not in after
        changes=list(spans(before,after))
        for item in changes:
            item.update(removedUtf8=b64decode(item['removedBase64']).decode(),
                        insertedUtf8=b64decode(item['insertedBase64']).decode())
        entries20.append(dict(path=path,status='M' if before else 'A',oldSha256=digest(before),newSha256=digest(after),
                             oldBytes=len(before),newBytes=len(after),replacements=changes))
    with inventory20.open('x',encoding='utf-8',newline='\n') as output:
        output.write(json.dumps(dict(reviewedHead=C19_HEAD,planSha256=PLAN20_SHA,reviewSha256=REVIEW3_SHA,
            encoding='Zero-based old byte offsets. Base64 and UTF-8 payloads preserve all line endings.',
            entries=entries20),ensure_ascii=False,indent=2)+'\n')
correction=json.loads(inventory20.read_bytes())
assert (correction['reviewedHead'],correction['planSha256'],correction['reviewSha256'])==(C19_HEAD,PLAN20_SHA,REVIEW3_SHA)
assert sorted(e['path'] for e in correction['entries'])==sorted(c20paths)
for entry in correction['entries']:
    path=entry['path']
    before=original[path]
    after=blob('HEAD',path) if mode=='head' else blob('',path) if mode=='index' else Path(path).read_bytes()
    assert entry['status']==('M' if before else 'A')
    assert (len(before),digest(before))==(entry['oldBytes'],entry['oldSha256'])
    assert (len(after),digest(after))==(entry['newBytes'],entry['newSha256'])
    assert rebuild(before,entry['replacements'])==after
    for change in entry['replacements']:
        assert b64decode(change['removedBase64']).decode()==change['removedUtf8']
        assert b64decode(change['insertedBase64']).decode()==change['insertedUtf8']
    if path==TEST:
        assert (HERE/'guild-fixture-names.test.ts').read_bytes()==after
    if mode=='index':
        assert Path(path).read_bytes()==after
    print(f"{entry['status']} {path}: {entry['oldSha256']} -> {entry['newSha256']} ({len(entry['replacements'])} spans)")
count=sum(len(e['replacements']) for e in correction['entries'])
print(f'PASS {mode}: {count} Correction 20 byte spans across the helper and the new test. Extra paths: 0.')
