from pathlib import Path
import hashlib
import shutil

final=Path(__file__).resolve().parent
correction=final.parent
root=correction.parent
name='SHA256SUMS.txt'

def sha(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest()

def archive(source, target, expected=None):
    if not target.exists():
        if expected:
            assert sha(source)==expected,source
        shutil.copyfile(source,target)
    if expected:
        assert sha(target)==expected,target

def manifest(folder):
    target=folder/name
    files=sorted(p for p in folder.rglob('*') if p.is_file() and p!=target)
    rows=[(sha(p),p.relative_to(folder).as_posix()) for p in files]
    target.write_text(''.join(f'{digest}  {path}\n' for digest,path in rows),encoding='utf-8',newline='\n')
    for line in target.read_text(encoding='utf-8').splitlines():
        digest,path=line.split('  ',1)
        assert sha(folder/path)==digest,(folder,path)
    print(str(folder),len(rows),flush=True)

archive(root/name,root/'correction-10-launch-hold-SHA256SUMS.txt','f9f801f971e8563786115b34a36e9e76ad274ce7a667b3d684576a170a9ff723')
archive(correction/name,correction/'launch-hold-SHA256SUMS.txt')
for folder in sorted(p for p in final.iterdir() if p.is_dir() and p.name in ('b2-3-smoke-artifacts','b2-3-isolated')):
    manifest(folder)
for folder in (final,correction,root):
    manifest(folder)
