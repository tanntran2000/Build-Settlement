from pathlib import Path

here=Path(__file__).resolve().parent
source=(here.parent/'c19'/'verify-c19.py').read_text(encoding='utf-8')
prefix,marker,_=source.partition("if mode=='head':")
assert marker
prefix=prefix.replace("assert mode in {'worktree','index','head'}","assert mode in {'capture','worktree','index','head'}")
prefix=prefix.replace("assert not git('ls-files','--others','--exclude-standard')\n",'')
prefix=prefix.replace("scope=runpy.run_path(str(HERE/'scope-c19.py'))","scope=runpy.run_path(str(HERE.parent/'c19'/'scope-c19.py'))")
prefix=prefix.replace("json.loads((HERE/'correction19-byte-inventory.json').read_bytes())",
    "json.loads(checked(HERE.parent/'c19'/'correction19-byte-inventory.json',"
    "'e4f2b34908b4e52301a5fdfecfc71f105d31ebc40661453f6d7b1bbaef4b95d4'))")
suffix=r"""
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
"""
(here/'verify-c20.py').write_text(prefix+suffix,encoding='utf-8',newline='\n')
