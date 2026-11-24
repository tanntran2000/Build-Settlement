from pathlib import Path
import hashlib
import shutil

c=Path(__file__).resolve().parent
f=c/'final'; base=c.parent
label='SHA256SUMS.txt'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pin='f88bc4ea6ceff0f4ea2cf417967c8588b376a2233b4fa374da2aed4f4c3b79d1'
prior=base/'correction-11-input-SHA256SUMS.txt'
if not prior.exists():
    assert sha(base/label)==pin
    shutil.copyfile(base/label,prior)
assert sha(prior)==pin

def write(folder):
    manifest=folder/label
    files=sorted(p for p in folder.rglob('*') if p.is_file() and p!=manifest)
    rows=[(sha(path),path.relative_to(folder).as_posix()) for path in files]
    manifest.write_text(''.join(f'{digest}  {path}\n' for digest,path in rows),encoding='utf-8',newline='\n')
    for row in manifest.read_text(encoding='utf-8').splitlines():
        digest,path=row.split('  ',1)
        assert sha(folder/path)==digest,(folder,path)
    print(str(folder),len(files),flush=True)

for folder in sorted(p for p in f.iterdir() if p.is_dir() and p.name in ('b2-3-smoke-artifacts','b2-3-isolated')):
    write(folder)
for folder in (f,c,base):
    write(folder)
