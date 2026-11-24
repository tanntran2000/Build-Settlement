from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys

folder=Path(__file__).resolve().parent
base='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
base_tree='312797f184f6414064e5ecf81eb1fba7a7bc55d0'
main='f73595b449db84b988d44a44cd33620efca9ecad'
prior_path=folder.parent/'correction-10'/'verifier-final.json'
refs={folder.parent.parent/'binding-plan-befe6e8.md':'e0613ce89b9881b933ad93698b46af7f542f76862e51bfb924bb6d36be2f05cf',
      folder.parent.parent/'astra-review'/'astra-round1.md':'ab265db6c1a40fd28f3602f7ebffa0ef7d2827d888fe4e6b03b33565779e91bd'}
def git(*args):
    return subprocess.check_output(['git',*args])
def oid(revision):
    return git('rev-parse',revision).decode().strip()
def digest(value):
    return hashlib.sha256(value).hexdigest()
def tree_entries(obj):
    return {path:meta for item in git('ls-tree','-r','-z',obj).split(b'\0') if item for meta,path in [item.split(b'\t',1)]}

for path,pin in refs.items():
    assert digest(path.read_bytes())==pin,path
prior=json.loads(prior_path.read_bytes())
assert prior['head']==base and prior['verifiedTree']==oid(base+'^{tree}')==base_tree
assert oid('origin/main')==main
edits=[h for p in ('test-edits.json','product-edits.json') for h in json.loads((folder/p).read_bytes())]
assert {finding for edit in edits for finding in edit['findings']}=={'P1-1','P1-2','P1-3','P1-4','P2-1','P2-2','P2-3','P3-1','P3-2'}
contents={}
for edit in edits:
    path=edit['path']
    if path not in contents: contents[path]=git('show',base+':'+path)
    old,new=edit['before'].encode(),edit['after'].encode()
    assert contents[path].count(old)==1,(path,old)
    contents[path]=contents[path].replace(old,new,1)
assert len(contents)==8
mode=sys.argv[1]
if mode=='stage':
    assert oid('HEAD')==base
    assert not git('diff','--cached','--name-only','-z')
    assert not git('ls-files','--others','--exclude-standard','-z')
    assert {p.decode() for p in git('diff','--name-only','-z','HEAD').split(b'\0') if p}==set(contents)
    for path,body in contents.items(): assert Path(path).read_bytes()==body,path
    subprocess.run(['git','-c','core.autocrlf=false','add','--',*contents],check=True)
    mode='index'
if mode=='index':
    assert oid('HEAD')==base
    assert not git('diff','--name-only','-z')
    assert not git('ls-files','--others','--exclude-standard','-z')
    tree=git('write-tree').decode().strip()
    output=folder/'verifier-precommit.json'
else:
    assert mode=='final' and oid('HEAD^')==base and not git('status','--porcelain=v1','--untracked-files=all')
    tree=oid('HEAD^{tree}')
    output=folder/'verifier-final.json'
old_tree,new_tree=tree_entries(base),tree_entries(tree)
assert old_tree.keys()==new_tree.keys()
changed={p.decode() for p in old_tree if old_tree[p]!=new_tree[p]}
assert changed==set(contents),changed
files=[]
for path,body in sorted(contents.items()):
    assert old_tree[path.encode()].split(b' ')[:2]==new_tree[path.encode()].split(b' ')[:2],path
    assert git('show',tree+':'+path)==body,path
    files.append({'path':path,'beforeSha256':digest(git('show',base+':'+path)),'afterSha256':digest(body),
                  'edits':[h for h in edits if h['path']==path]})
pins_path='packages/core/src/world/__tests__/npc-generator.test.ts'
pattern=rb'const samplePins = \[.*?\] as const;'
old_pins=re.search(pattern,git('show',base+':'+pins_path),re.S).group()
new_pins=re.search(pattern,git('show',tree+':'+pins_path),re.S).group()
assert old_pins==new_pins
record={'verifiedHead':oid('HEAD'),'verifiedTree':tree,'verificationMode':mode,'relativeToHead':base,'relativeToTree':base_tree,
        'originMain':main,'priorVerifierSha256':digest(prior_path.read_bytes()),'pinnedInputs':{p.name:sha for p,sha in refs.items()},
        'baseTrackedBlobs':len(old_tree),'changedFiles':files,'otherTreeEntriesByteIdentical':True,'samplePinsByteIdentical':True,
        'samplePinsSha256':digest(old_pins),
        'totalPathsComparedToMain':len([x for x in git('diff','--name-only','--no-renames','-z',main,tree).split(b'\0') if x])}
output.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'Verified {len(files)} scoped files, {len(edits)} exact replacements. Remaining {len(old_tree)-len(files)} tracked blobs match {base[:7]}. Sample pins byte-identical.')
print(f'Tree {tree}')
