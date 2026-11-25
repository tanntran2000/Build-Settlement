from hashlib import sha256
import json
from pathlib import Path
import subprocess

here = Path(__file__).resolve().parent
def git(*args):
    return subprocess.check_output(('git', *args))
base = '8aa7dc4cefbc759ce2a7d158937011c3afe71549'
assert git('rev-parse','HEAD').decode().strip() == base
assert git('rev-parse','origin/main').decode().strip() == 'b184357d235d164478584e36b96d063551124e66'
assert b'Exit 0' in (here/'held-candidate-verifier.txt').read_bytes()
assert b'Tests  3263 passed' in (here/'candidate-unit-recheck.txt').read_bytes()
inventory = json.loads((here/'correction16-byte-inventory.json').read_bytes())
entries = inventory['entries']
assert len(entries) == 10
paths = sorted(entry['path'] for entry in entries)
assert sorted(git('diff','--name-only',base).decode().splitlines()) == paths
assert git('diff','--cached','--name-only') == b''
assert git('ls-files','--others','--exclude-standard') == b''
for entry in entries:
    assert sha256(Path(entry['path']).read_bytes()).hexdigest() == entry['newSha256']

patch = here/'candidate-held.patch'
with patch.open('xb') as output:
    output.write(git('-c','core.autocrlf=false','diff','--binary','--full-index',base,'--',*paths))
git('-c','core.autocrlf=false','apply','--check','--reverse',str(patch))
print('Archived and reverse-checked all ten inventoried candidate files.', flush=True)
git('-c','core.autocrlf=false','restore','--source=HEAD','--worktree','--',*paths)
assert git('status','--porcelain=v1','--untracked-files=all') == b''
assert git('rev-parse','HEAD').decode().strip() == base
git('-c','core.autocrlf=false','apply','--check',str(patch))
print('Restored the clean reviewed checkout and checked that the saved patch can be reapplied.', flush=True)
print('Patch SHA-256: '+sha256(patch.read_bytes()).hexdigest())
