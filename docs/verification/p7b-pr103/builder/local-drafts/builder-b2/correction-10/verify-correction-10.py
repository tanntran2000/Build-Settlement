import hashlib
import json
from pathlib import Path
import subprocess
import sys

out=Path(__file__).resolve().parent
evidence=out.parent
main='f73595b449db84b988d44a44cd33620efca9ecad'
previous='f31310cb791f549a7672be47219c7578678b7058'
previous_tree='43ab9e682912eeadc3d4a4d2ef8ca1a7e3aba54d'
plan=evidence.parent/'binding-plan-4d5f937.md'
hold=evidence/'B2-3-HOLD.md'
inputs={
    plan:'ae6b5ceea46f630c4694f48f84193884a6a7c572809a997aa78609f92b8010d9',
    hold:'9b72a274a3af7d60d7129af4c8e79969c9a6e4a0b35a03588bf1efe923fb460c',
}
path='tests/e2e/storage.spec.ts'
hunks=[
    ('import { makeLife,importLife,exportLife,go }', 'import { makeLife,makeLifeWithNpcs,importLife,exportLife,go }'),
    (' const legacy=bytes(),b=makeLife(54321);await page.addInitScript', ' const legacy=bytes(),b=makeLifeWithNpcs(54321);await page.addInitScript'),
]

def git(*args):
    return subprocess.check_output(['git',*args])

def oid(revision):
    return git('rev-parse',revision).decode().strip()

def digest(data):
    return hashlib.sha256(data).hexdigest()

for pin,sha in inputs.items():
    assert digest(pin.read_bytes())==sha,pin
prior=json.loads((evidence/'verifier-final.json').read_bytes())
assert prior['head']==previous and prior['verifiedTree']==previous_tree and oid(previous+'^{tree}')==previous_tree
assert oid('origin/main')==main
before=git('show',previous+':'+path)
expected=before
for old,new in hunks:
    assert expected.count(old.encode())==1,old
    expected=expected.replace(old.encode(),new.encode(),1)
assert expected.count(b'const before=(await readStoredRecords(page)).filter(r=>r.table!==\'system\');expect(before).toHaveLength(7);')==1

mode=sys.argv[1]
if mode=='apply':
    assert oid('HEAD')==previous and not git('status','--porcelain=v1','--untracked-files=all')
    assert Path(path).read_bytes().replace(b'\r\n',b'\n')==before
    Path(path).write_bytes(expected)
    subprocess.run(['git','-c','core.autocrlf=false','add','--',path],check=True)
    assert not git('diff','--name-only','-z')
    tree=git('write-tree').decode().strip()
    revision=tree
    report_name='verifier-precommit.json'
else:
    assert mode=='verify' and oid('HEAD^')==previous and not git('status','--porcelain=v1','--untracked-files=all')
    revision='HEAD'
    tree=oid(revision+'^{tree}')
    report_name='verifier-final.json'
assert git('diff','--name-only','--no-renames','-z',previous,tree)==path.encode()+b'\0'
assert git('show',tree+':'+path)==expected
tracked_count=len(git('diff','--name-only','--no-renames','-z',main,tree).split(b'\0'))-1
assert tracked_count==prior['totalPathsCompared']==112
report={**prior,'head':oid('HEAD'),'verifiedTree':tree,'verificationRevision':revision,
        'correction10':{'path':path,'edits':[{'before':old,'after':new} for old,new in hunks],
                        'baseHead':previous,'baseTree':previous_tree,'beforeSha256':digest(before),'afterSha256':digest(expected),
                        'planSha256':inputs[plan],'holdSha256':inputs[hold], 'assertionsByteIdentical':True}}
(out/report_name).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'Verified {tracked_count} paths via Corrections 7–10 on tree {tree}. One test-only Correction 10 change. All assertion bytes identical.')
