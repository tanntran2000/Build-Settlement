from pathlib import Path
from datetime import datetime,timezone
import subprocess,re
b=Path(__file__).resolve().parent
old='fbad4d834689eb798c13bca27dccf5d16c1f6704'
paths={
 'packages/core/src/trial/__tests__/difficulty.test.ts',
 'packages/persistence/src/__tests__/money-save.test.ts',
 'packages/ui/src/CharacterLifeShell.svelte',
 'packages/ui/src/TileManagement.svelte',
 'packages/ui/src/__tests__/items-view.test.ts',
 'packages/ui/src/__tests__/outside-view.test.ts',
 'packages/ui/src/items-view.ts',
 'packages/ui/src/society-view.ts',
}
def git(*args): return subprocess.check_output(['git',*args])
def gt(*args):return git(*args).decode('utf-8').strip()
def read(name):return (b/name).read_text(encoding='utf-8')
assert gt('rev-parse','HEAD')==old and gt('branch','--show-current')=='feat/money-difficulty'
assert not gt('diff','--cached','--name-only')
red=read('m1.4-c6-red-attempt2.txt')
assert re.search(r'Tests\s+2 failed \| 30 passed \(32\)',red)
assert 'capacity: 80' in red or '"capacity": 80' in red
assert 'forecasts easy Hospital recovery' in red and 'Exit 1' in red
green=read('m1.4-c6-green.txt')
assert '32 passed (32)' in green and '\nExit 0\n' in green
full=read('m1.4-c6-full-unit.txt')
assert '3317 passed (3317)' in full and '\nExit 0\n' in full
assert {line[3:] for line in git('status','--porcelain=v1','--untracked-files=all','-z').decode().split('\0') if line}==paths
subprocess.run(['git','add','--',*sorted(paths)],check=True)
assert set(gt('diff','--cached','--name-only').splitlines())==paths
git('diff','--cached','--check')
output=gt('commit','-m','fix(ui): difficulty-aware storage and health forecasts')
head,tree,parent=gt('rev-parse','HEAD','HEAD^{tree}','HEAD^').splitlines()
assert parent==old and not gt('status','--porcelain=v1','--untracked-files=all')
assert set(gt('diff','--name-only','fbad4d8..HEAD').splitlines())==paths
stats=git('diff','--stat','fbad4d8..HEAD').decode()
details=f'UTC {datetime.now(timezone.utc).isoformat()}\nHEAD {head}\nTree {tree}\nParent {parent}\n'
(b/'m1.4-c6-commit.txt').write_text(output+'\n'+details,encoding='utf-8',newline='\n')
(b/'m1.4-c6-carry-scope.txt').write_text(details+'\nCommand git diff --stat fbad4d8..HEAD\n'+stats+'Exit 0\nOnly packages/ui/ and test files changed.\n',encoding='utf-8',newline='\n')
(b/'m1.4-c6-change.patch').write_bytes(git('diff','--binary','fbad4d8..HEAD'))
print(output)
print(details+stats)
