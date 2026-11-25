from pathlib import Path

here = Path(__file__).resolve().parent
source = (here.parent/'c17'/'verify-c17.py').read_text(encoding='utf-8')
prefix, marker, _ = source.partition("if mode in {'rehydrate','annotate','worktree','index'}")
assert marker
prefix = prefix.replace("TYPE_INVENTORY = HERE/'correction17-type-inventory.json'\n", '')
suffix = r"""
PLAN18_SHA = 'ff406413cbf3e00bcf2880b4a102fb2f912b9c308ef816a793f15d45ffb05d77'
C17_README_SHA = '69fc6116cce95aebc138fd75565faffa6cb67ac4518083c2d038d069f001f0f3'
C17_PATCH_SHA = '800a1f910530b04fa8380cf437724b1b6ac397f8aaf21f8d22152f5a8970e442'
C17_TYPE_SHA = '87ef1295ca9ec268b5d832ad1dcbc f21c97b73fec71d24cc0725e510f679e7da'.replace(' ','')
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
"""
suffix = suffix.replace("'87ef1295ca9ec268b5d832ad1dcbc f21c97b73fec71d24cc0725e510f679e7da'.replace(' ','')",
                        "'87ef1295ca9ec268b5d832ad1dcbcf21c97b73fec71d24cc0725e510f679e7da'")
(here/'verify-c18.py').write_text(prefix+suffix,encoding='utf-8',newline='\n')
