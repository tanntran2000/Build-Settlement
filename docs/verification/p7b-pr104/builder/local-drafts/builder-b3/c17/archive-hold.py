from hashlib import sha256
import json
from pathlib import Path
import subprocess

here = Path(__file__).resolve().parent
def git(*args):
    return subprocess.check_output(('git', *args))
def hash_bytes(data):
    return sha256(data).hexdigest()

base = '8aa7dc4cefbc759ce2a7d158937011c3afe71549'
main = 'b184357d235d164478584e36b96d063551124e66'
assert git('rev-parse','HEAD').decode().strip() == base
assert git('rev-parse','origin/main').decode().strip() == main
assert b'PASS annotate: 10 scoped paths' in (here/'type-annotation-bytes.txt').read_bytes()
assert b"'report' does not exist" in (here/'candidate-typecheck.txt').read_bytes()
assert b'Tests  3263 passed' in (here/'candidate-unit.txt').read_bytes()
held = json.loads((here.parent/'c16'/'correction16-byte-inventory.json').read_bytes())
type_edit = json.loads((here/'correction17-type-inventory.json').read_bytes())
entries = held['entries']
assert len(entries) == 10
paths = sorted(entry['path'] for entry in entries)
assert sorted(git('diff','--name-only',base).decode().splitlines()) == paths
assert git('diff','--cached','--name-only') == b''
assert git('ls-files','--others','--exclude-standard') == b''
for entry in entries:
    path = entry['path']
    want = type_edit['finalSha256'] if path == type_edit['path'] else entry['newSha256']
    assert hash_bytes(Path(path).read_bytes()) == want, path

patch = here/'candidate-held.patch'
with patch.open('xb') as output:
    output.write(git('-c','core.autocrlf=false','diff','--binary','--full-index',base,'--',*paths))
git('-c','core.autocrlf=false','apply','--check','--reverse',str(patch))
print('Archived and reverse-checked all ten verified candidate files.', flush=True)

git('-c','core.autocrlf=false','restore','--source=HEAD','--worktree','--',*paths)
for entry in entries:
    assert hash_bytes(Path(entry['path']).read_bytes()) == entry['oldSha256'], entry['path']
if git('status','--porcelain=v1','--untracked-files=all'):
    # Refresh stat records after restoring and verifying the original file bytes.
    git('-c','core.autocrlf=false','add','--',*paths)
assert git('diff','--cached','--name-only') == b''
assert git('status','--porcelain=v1','--untracked-files=all') == b''
assert git('rev-parse','HEAD').decode().strip() == base
git('-c','core.autocrlf=false','apply','--check',str(patch))
print('Restored and hashed all original bytes. Status is empty and the saved patch passed the forward check.')
print('Patch SHA-256: '+hash_bytes(patch.read_bytes()))
