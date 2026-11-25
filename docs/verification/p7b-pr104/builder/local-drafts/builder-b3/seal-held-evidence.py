from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import subprocess

HERE=Path(__file__).resolve().parent
ROOT=Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
BASE='b184357d235d164478584e36b96d063551124e66'
HEAD='822c695c2e59b7f2f1b5c5cd8a882f9f7f62a6f1'
TREE='3ebe68c4717b79a65667bdd658414f8e944654c5'
def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf-8').replace('\r\n','\n')
def read(name):
    return (HERE/name).read_text(encoding='utf-8')
def write(name,text):
    (HERE/name).write_text(text,encoding='utf-8',newline='\n')
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
heads=git('rev-parse','HEAD','HEAD^{tree}','origin/main').splitlines()
assert heads==[HEAD,TREE,BASE],heads
assert git('diff','--cached','--name-only')==''
assert git('diff','--name-only',BASE,'--','docs')==''
assert git('rev-list','--count',BASE+'..HEAD').strip()=='2'
status=git('status','--porcelain=v1','--untracked-files=all')
assert len(status.splitlines())==14
ports=subprocess.check_output(['powershell.exe','-NoProfile','-Command',
  "$listener=Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue; if($listener){$listener | Out-String; exit 1}; Write-Output '4173 and 4174 have no listening process'"],
  cwd=ROOT).decode('utf-8').replace('\r\n','\n')
assert 'no listening process' in ports
assert '349 passed' in read('b3.1-green.txt')
assert '174 passed' in read('b3.2-green.txt')
assert '176 passed' in read('b3.3-green-unit.txt')
assert '3 passed' in read('b3.3-green-browser.txt') and '2 failed' in read('b3.3-green-browser.txt')
for width in [320,375]:
    log=read(f'b3.3-green-mobile-{width}-isolated.txt')
    assert 'CI=1' in log and '1 failed' in log and 'Control unreachable after 160 Tabs: acq-spec-2-auction' in log and 'Exit 1' in log
    assert '"width":'+str(width) in read('b3.3-screenshots-and-mobile-diagnostic.txt')
assert '72 paths verified' in read('b3.2-head-verifier.txt')
assert '86 paths verified' in read('b3.3-held-verifier.txt')
assert 'Forbidden paths: 0' in read('b3.1-path-diff.txt')
for file in ['acquisition-for-sale-1280.png','acquisition-auction-1280.png']:
    png=(HERE/file).read_bytes()
    assert png[:8]==b'\x89PNG\r\n\x1a\n' and int.from_bytes(png[16:20],'big')==1280 and int.from_bytes(png[20:24],'big')==900
patch=json.loads(read('mobile-keyboard-proposal.json'))
assert patch['unapplied'] and sha(ROOT/patch['path'])==patch['before_sha256']
write('held-worktree.txt',f'UTC {datetime.now(timezone.utc).isoformat(timespec="seconds")}\n'
     'HEAD, tree, origin/main, in order\n'+'\n'.join(heads)+'\n'
     'Branch '+git('branch','--show-current')+
     'Staged diff: empty\n'
     'Status, 14 owner-approved B3.3 paths held before commit\n'+status+
     'Ports\n'+ports+'Commits\n'+git('log','-2','--format=%H %T %s%n%b'))
def seal(directory):
    files=sorted(path for path in directory.rglob('*') if path.is_file() and path!=directory/'SHA256SUMS.txt')
    manifest=directory/'SHA256SUMS.txt'
    manifest.write_text(''.join(sha(path)+'  '+path.relative_to(directory).as_posix()+'\n' for path in files),
        encoding='utf-8',newline='\n')
    for line in manifest.read_text(encoding='utf-8').splitlines():
        digest,name=line.split('  ',1)
        assert sha(directory/name)==digest
    return len(files)
for subdir in sorted((path for path in HERE.iterdir() if path.is_dir())):
    seal(subdir)
assert 'Yêu cầu kiểm replay đầy đủ' in read('README.md')
print('Verified worktree, port state, arrays of RED/GREEN logs, 1280x900 images and '+str(seal(HERE))+' evidence hashes.')
