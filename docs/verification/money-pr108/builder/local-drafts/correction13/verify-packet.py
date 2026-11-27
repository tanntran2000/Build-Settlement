from base64 import b64decode
from hashlib import sha256
from pathlib import Path
import json, subprocess, sys

here=Path(__file__).resolve().parent
repo=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
base='0b2b3a6088d003301d48b460202327fb53546ede'
sim='8e329508f0cf86c6d9ba68d7c30fdc30e757b779'
approved='e2b340a32784ff7a72534fe02c8148bba45bc286317648f4b3db6cc3e2305f80'
sha=lambda value: sha256(value).hexdigest()

def git(*args):
    return subprocess.check_output(['git',*args],cwd=repo)

def paths(*args):
    return {r.decode('utf-8') for r in git(*args).split(b'\0') if r}

def canonical(data):
    return data.replace(b'\r\n',b'\n')

older=here.parent/'correction12'
entries={e['path']:e for f in ('existing-file-replacements.json','generated-byte-proposals.json')
         for e in json.loads((older/f).read_bytes())['files']}
overlay_data=(older/'proposed-checkpoint-assertion.json').read_bytes()
assert sha(overlay_data)==approved
overlay=json.loads(overlay_data)
path=overlay['path']
assert len(entries)==35 and entries[path]['afterSha256']==overlay['beforeSha256']
for field in ('afterSha256','afterBase64','afterUtf8'):
    entries[path][field]=overlay[field]
ui={name for name,e in entries.items() if e['stage'].startswith('ui-')}
assert git('branch','--show-current').strip()==b'feat/money-robbery'
assert git('merge-base','HEAD',base).decode().strip()==base
data={}
for name,e in entries.items():
    content=b64decode(e['afterBase64'],validate=True)
    assert sha(content)==e['afterSha256'] and e['afterUtf8'].encode()==content,name
    assert (repo/name).read_bytes()==content,name
    data[name]=content
for name in data.keys()-ui:
    assert canonical(git('show',sim+':'+name))==canonical(data[name]),name

if sys.argv[1]=='stage':
    assert git('rev-parse','HEAD').decode().strip()==sim
    dirty=paths('diff','HEAD','--name-only','-z') | paths('ls-files','--others','--exclude-standard','-z')
    assert dirty==ui,(dirty-ui,ui-dirty)
    assert not git('diff','--cached','--name-only')
    subprocess.run(['git','add','--',*sorted(ui)],check=True,cwd=repo)
    assert paths('diff','--cached','--name-only','-z')==ui
    for name in ui:
        assert canonical(git('show',':'+name))==canonical(data[name]),name
    print('Staged exactly',len(ui),'approved M3.2 paths and the Correction 13 overlay.')
elif sys.argv[1]=='head':
    assert git('rev-parse','HEAD^').decode().strip()==sim
    assert paths('diff','--name-only','-z',base+'...HEAD')==entries.keys()
    for name,content in data.items():
        assert canonical(git('show','HEAD:'+name))==canonical(content),name
    assert not git('status','--porcelain','-z')
    print('Verified all',len(data),'paths against the packet plus the single approved assertion.')
    print(git('rev-parse','HEAD','HEAD^{tree}').decode().strip())
else:
    raise SystemExit('Use stage or head')

