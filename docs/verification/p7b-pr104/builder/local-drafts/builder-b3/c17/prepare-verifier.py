from pathlib import Path

here = Path(__file__).resolve().parent
source = (here.parent/'c16'/'verify-c16.py').read_text(encoding='utf-8')
prefix, marker, _ = source.partition("assert git('branch','--show-current')")
assert marker
prefix = prefix.replace("assert mode in {'capture','index','head'}", "assert mode in {'rehydrate','annotate','worktree','index','head'}")
prefix = prefix.replace("INVENTORY = HERE/'correction16-byte-inventory.json'\n", '')
suffix = r"""
PLAN17_SHA = '993347f6f03c076b968dd75af7bfecef6cbd7b35b4f8dde96d9c0a8c8a5d0d90'
HELD_SHA = 'c03df67f9b3e1988fff779de4fa8f0dcd71008535665e46760377306c0c0ce78'
CANDIDATE_SHA = '6f1de8483a6204fa0ea52d69b67d33e45e67dec3924a5e5072d18205bcca37b5'
C16_README_SHA = '66a51801e60d21e9400cfcbae32243cae93c6bca32217d2df3933014d05cf31d'
TYPE_FILE = 'packages/core/src/trial/acquisition-replay.ts'
C16 = HERE.parent/'c16'
TYPE_INVENTORY = HERE/'correction17-type-inventory.json'
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

if mode in {'rehydrate','annotate','worktree','index'}:
    assert git('rev-parse','HEAD').decode().strip()==C14
    assert paths('diff','--cached','--name-only') == (set(SCOPE) if mode=='index' else set())
else:
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    assert git('rev-parse','HEAD^').decode().strip()==C14
    assert paths('diff','--name-only',C14,'HEAD')==set(SCOPE)
    assert paths('diff','--name-only',MAIN,'HEAD')==set(approved)|set(SCOPE)
    assert all(digest(blob('HEAD',path))==sha for path,sha in approved.items() if path not in SCOPE)

if mode=='rehydrate':
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    git('-c','core.autocrlf=false','apply','--check',str(patch))
    git('-c','core.autocrlf=false','apply','--whitespace=nowarn',str(patch))
    assert paths('diff','--name-only',C14)==set(SCOPE)
    assert all(Path(path).read_bytes()==expected for path,expected in held.items())
    print('PASS rehydrate: all 10 files and 30 Correction 16 byte spans matched before any type edit.')
    sys.exit(0)

before = held[TYPE_FILE]
assert before.count(MARKER)==1
size = before.index(MARKER)+len(SIGNATURE)
edit = {'path':TYPE_FILE,'heldSha256':digest(before),'offset':size,'removedBase64':'',
        'insertedUtf8':INSERTION.decode(),'insertedBase64':b64encode(INSERTION).decode(),'addedBytes':len(INSERTION)}
after = rebuild(before,[edit])
edit.update(finalSha256=digest(after),finalBytes=len(after),planSha256=PLAN17_SHA,heldInventorySha256=CANDIDATE_SHA)
if mode=='annotate':
    assert all(Path(path).read_bytes()==expected for path,expected in held.items())
    assert not TYPE_INVENTORY.exists()
    Path(TYPE_FILE).write_bytes(after)
    with TYPE_INVENTORY.open('x',encoding='utf-8',newline='\n') as output:
        output.write(json.dumps(edit,ensure_ascii=False,indent=2)+'\n')
assert json.loads(TYPE_INVENTORY.read_bytes())==edit

expected = {**held,TYPE_FILE:after}
if mode != 'head':
    assert paths('diff','--name-only',C14)==set(SCOPE)
for path, content in sorted(expected.items()):
    actual = blob('HEAD',path) if mode=='head' else blob('',path) if mode=='index' else Path(path).read_bytes()
    assert actual==content, path
    if mode=='index':
        assert Path(path).read_bytes()==content, path
    print(f'{path}  {digest(raw[path])} -> {digest(content)}  {SCOPE[path]}')
print(f"Correction 17 inserted {len(INSERTION)} UTF-8 bytes at offset {size} in {TYPE_FILE}: {INSERTION.decode()}")
print(f'PASS {mode}: 10 scoped paths, 30 reconstructed Correction 16 spans and 1 Correction 17 insertion. Extra paths: 0.')
"""
(here/'verify-c17.py').write_text(prefix + suffix, encoding='utf-8', newline='\n')
