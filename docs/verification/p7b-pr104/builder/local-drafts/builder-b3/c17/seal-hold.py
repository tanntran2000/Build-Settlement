from hashlib import sha256
from pathlib import Path
folder = Path(__file__).resolve().parent
manifest = folder/'SHA256SUMS.txt'
for name,marker in {
    'candidate-typecheck.txt':'TS2339:',
    'red-baseline.txt':'8 failed',
    'green-round2.txt':'8 passed',
    'candidate-unit.txt':'3263 passed',
    'held-candidate-verifier.txt':'PASS worktree: 10 scoped paths',
    'candidate-path-diff.txt':'Forbidden paths: 0.',
    'final-worktree.txt':'Git status empty. Ports 4173 and 4174 free.',
    'README.md':'Duyệt sửa kiểu + fixture (Recommended)',
}.items():
    assert marker in (folder/name).read_text(encoding='utf-8'), name
files = sorted(path for path in folder.rglob('*') if path.is_file() and path != manifest)
manifest.write_text(''.join(f'{sha256(path.read_bytes()).hexdigest()}  {path.relative_to(folder).as_posix()}\n' for path in files),
                    encoding='utf-8',newline='\n')
for entry in manifest.read_text(encoding='utf-8').splitlines():
    expected, name = entry.split('  ',1)
    assert sha256((folder/name).read_bytes()).hexdigest() == expected, name
print(f'Checked {len(files)} manifest entries.')
