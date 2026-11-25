from pathlib import Path

here=Path(__file__).resolve().parent
source=(here.parent/'c18'/'verify-c18.py').read_text(encoding='utf-8')
prefix,marker,_=source.partition("if mode=='head':")
assert marker
prefix=prefix.replace("assert mode in {'rehydrate','annotate','worktree','index','head'}",
                      "assert mode in {'worktree','index','head'}")
prefix=prefix.replace("TYPE18 = HERE/'correction18-type-inventory.json'\n",'')
suffix=r"""
import runpy

C18_HEAD='dfcc524b043ee3135746121f4384342a8dbf6e5e'
C18_TREE='1bb1779f9e610d4ab3f83432625f52ba0eea45d1'
PLAN19_SHA='7af6beafd85ef7102215e265aca3b28c2a07198a832ec8152bbb9de44af66fd9'
C18_README_SHA='7fc3cc6ecf3390fe7b7cccd059f86d5fa23cae0eec9b88a8b39bc8dad24d737e'
C18_DIAGNOSIS_SHA='938b4ffd5a9f6be3a4f56a5d1e7acba73a4c1f1715feb5d768870277f3b5bd6d'
C18_TYPE_SHA='66d1d9fac57d821815691219f9ded5149cc ec26ad9f39f9dce7c820b0f11ad3b'.replace(' ','')
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

scope=runpy.run_path(str(HERE/'scope-c19.py'))
approved19=set(scope['EDITS'])
inventory=json.loads((HERE/'correction19-byte-inventory.json').read_bytes())
assert (inventory['reviewedHead'],inventory['planSha256'])==(C18_HEAD,PLAN19_SHA)
assert sorted(entry['path'] for entry in inventory['entries'])==sorted(approved19)
if mode=='head':
    assert git('status','--porcelain=v1','--untracked-files=all')==b''
    assert git('rev-parse','HEAD^').decode().strip()==C18_HEAD
    assert paths('diff','--name-only',C18_HEAD,'HEAD')==approved19
    assert paths('diff','--name-only',MAIN,'HEAD')==set(approved)|set(SCOPE)|approved19
    assert all(blob('HEAD',p)==blob(C18_HEAD,p) for p in (set(approved)|set(SCOPE))-approved19)
else:
    assert git('rev-parse','HEAD').decode().strip()==C18_HEAD
    assert paths('diff','--name-only',C18_HEAD)==approved19
    assert paths('diff','--cached','--name-only')==(approved19 if mode=='index' else set())
for entry in inventory['entries']:
    path=entry['path']
    before=blob(C18_HEAD,path)
    after=scope['replace_expected'](path,before)
    assert (len(before),digest(before))==(entry['oldBytes'],entry['oldSha256'])
    assert (len(after),digest(after))==(entry['newBytes'],entry['newSha256'])
    assert rebuild(before,entry['replacements'])==after
    actual=blob('HEAD',path) if mode=='head' else blob('',path) if mode=='index' else Path(path).read_bytes()
    assert actual==after,path
    if mode=='index': assert Path(path).read_bytes()==actual,path
    print(f'{path} {entry["oldSha256"]} -> {entry["newSha256"]} ({len(entry["replacements"])} spans)')
count=sum(len(entry['replacements']) for entry in inventory['entries'])
assert count==5
print(f'PASS {mode}: {count} Correction 19 byte spans across two scopes. Assertions and timeouts match the reviewed bytes. Extra paths: 0.')
"""
suffix=suffix.replace("'66d1d9fac57d821815691219f9ded5149cc ec26ad9f39f9dce7c820b0f11ad3b'.replace(' ','')",
                      "'66d1d9fac57d821815691219f9ded5149ccec26ad9f39f9dce7c820b0f11ad3b'")
(here/'verify-c19.py').write_text(prefix+suffix,encoding='utf-8',newline='\n')
