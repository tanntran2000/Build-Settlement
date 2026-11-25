from hashlib import sha256
from pathlib import Path

folder = Path(__file__).resolve().parent
manifest = folder/'SHA256SUMS.txt'
assert 'Sửa cả 4 (Recommended)' in (folder/'README.md').read_text(encoding='utf-8')
assert 'Ghi sổ rủi ro, không chặn B3 (Recommended)' in (folder/'README.md').read_text(encoding='utf-8')
files = sorted(path for path in folder.rglob('*') if path.is_file() and path != manifest)
manifest.write_text(''.join(f'{sha256(path.read_bytes()).hexdigest()}  {path.relative_to(folder).as_posix()}\n' for path in files),
                    encoding='utf-8',newline='\n')
for entry in manifest.read_text(encoding='utf-8').splitlines():
    expected, name = entry.split('  ',1)
    assert sha256((folder/name).read_bytes()).hexdigest() == expected, name
print(f'Checked {len(files)} manifest entries.')
