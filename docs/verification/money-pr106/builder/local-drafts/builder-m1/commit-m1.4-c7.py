from pathlib import Path
from datetime import datetime,timezone
import subprocess
b=Path(__file__).resolve().parent
old='3f1467ac278ab1ad8379c7ca58bced6e121d9c4a'
paths={'packages/ui/src/society-view.ts','packages/ui/src/__tests__/outside-view.test.ts'}
def git(*args):return subprocess.check_output(['git',*args])
def gt(*args):return git(*args).decode('utf-8').strip()
def report(name):return (b/name).read_text(encoding='utf-8')
assert gt('rev-parse','HEAD')==old and gt('branch','--show-current')=='feat/money-difficulty'
assert not gt('diff','--cached','--name-only')
red=report('m1.4-c7-red.txt')
assert '2 failed | 7 passed (9)' in red and '"capacity": 80' in red and '"capacity": 40' in red
assert '23 passed (23)' in report('m1.4-c7-green.txt') and '\nExit 0\n' in report('m1.4-c7-green.txt')
assert '3319 passed (3319)' in report('m1.4-c7-full-unit.txt') and '\nExit 0\n' in report('m1.4-c7-full-unit.txt')
assert {line[3:] for line in git('status','--porcelain=v1','--untracked-files=all','-z').decode().split('\0') if line}==paths
subprocess.run(['git','add','--',*sorted(paths)],check=True)
assert set(gt('diff','--cached','--name-only').splitlines())==paths
git('diff','--cached','--check')
output=gt('commit','-m','fix(ui): storage preview follows end-week staffing')
head,tree,parent=gt('rev-parse','HEAD','HEAD^{tree}','HEAD^').splitlines()
assert parent==old and not gt('status','--porcelain=v1','--untracked-files=all')
assert set(gt('diff','--name-only','3f1467a..HEAD').splitlines())==paths
stats=git('diff','--stat','3f1467a..HEAD').decode()
details=f'UTC {datetime.now(timezone.utc).isoformat()}\nHEAD {head}\nTree {tree}\nParent {parent}\n'
(b/'m1.4-c7-commit.txt').write_text(output+'\n'+details,encoding='utf-8',newline='\n')
(b/'m1.4-c7-carry-scope.txt').write_text(details+'\nCommand git diff --stat 3f1467a..HEAD\n'+stats+'Exit 0\nOnly packages/ui/ and its tests changed.\n',encoding='utf-8',newline='\n')
(b/'m1.4-c7-change.patch').write_bytes(git('diff','--binary','3f1467a..HEAD'))
print(output)
print(details+stats)
