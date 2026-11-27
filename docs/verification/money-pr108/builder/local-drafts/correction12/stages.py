from pathlib import Path
from hashlib import sha256
from base64 import b64decode
import json
import subprocess
import sys

here = Path(__file__).resolve().parent
main = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
expected = '0b2b3a6088d003301d48b460202327fb53546ede'
branch = 'feat/money-robbery'
entries = []
for name in ['existing-file-replacements.json','generated-byte-proposals.json']:
    pack = json.loads((here/name).read_bytes())
    assert pack['base'] == expected
    entries.extend(pack['files'])

def sha(out):
    return sha256(out).hexdigest()

def git(*args):
    return subprocess.check_output(['git',*args],cwd=main)
assert git('branch','--show-current').decode().strip() == branch, 'Wrong branch.'
assert git('merge-base','HEAD',expected).decode().strip() == expected

def payload(e):
    data = b64decode(e['afterBase64'], validate=True)
    assert sha(data) == e['afterSha256'] and data == e['afterUtf8'].encode()
    return data

phase = sys.argv[1]
if phase in ('apply','add'):
    selected = {e['path']:e for e in entries if e['stage'].startswith(sys.argv[2])}
    assert selected, sys.argv[2]
    if phase == 'apply':
        for path,e in selected.items():
            local=main/path
            if local.exists():
                assert sha(local.read_bytes()) in [e.get('beforeSha256'),e['afterSha256']], path
            else:
                assert 'beforeSha256' not in e, path
        for path,e in selected.items():
            local=main/path
            local.parent.mkdir(parents=True,exist_ok=True)
            local.write_bytes(payload(e))
            assert local.read_bytes() == payload(e)
    else:
        for path,e in selected.items():
            assert (main/path).read_bytes() == payload(e), path
        subprocess.run(['git','add','--',*sorted(selected)],check=True,cwd=main)
        staged=set(git('diff','--cached','--name-only','-z').decode().split('\0'))-{''}
        assert staged == set(selected), (staged,set(selected))
        for path,e in selected.items():
            assert git('show',':'+path).replace(b'\r\n',b'\n') == payload(e).replace(b'\r\n',b'\n'), path
    print(phase, len(selected), sorted(selected))
elif phase == 'verify':
    expected_by_path={e['path']:e for e in entries}
    changed=set(git('diff','--name-only','-z',expected+'...HEAD').decode().split('\0'))-{''}
    assert changed == expected_by_path.keys(), (sorted(changed-expected_by_path.keys()),sorted(expected_by_path.keys()-changed))
    for path,e in expected_by_path.items():
        assert git('show','HEAD:'+path).replace(b'\r\n',b'\n') == payload(e).replace(b'\r\n',b'\n'), path
        assert (main/path).read_bytes() == payload(e), path
    assert git('status','--porcelain','-z') == b''
    print('All', len(changed), 'committed paths reconstruct from the packet and worktree bytes match.')
else:
    raise SystemExit('Use apply <stage>, add <stage>, or verify')

