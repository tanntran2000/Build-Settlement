import hashlib
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = root / 'SHA256SUMS.txt'
paths = sorted(p for p in root.rglob('*') if p.is_file() and p != manifest)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest.write_bytes(''.join(f'{sha(p)}  {p.relative_to(root).as_posix()}\n' for p in paths).encode('utf-8'))
for line in manifest.read_text(encoding='utf-8').splitlines():
    expect, path = line.split('  ', 1)
    assert sha(root/path) == expect
readme = (root/'README.md').read_text(encoding='utf-8')
assert all(q in readme for q in ('Gold của city','Cô ấy mang đồ đi','Làm tròn lên 1 Gold','Duyệt tất cả','→'))
assert '\uFFFD' not in readme
print(f'{len(paths)} files verified | manifest SHA-256 {sha(manifest)}')

