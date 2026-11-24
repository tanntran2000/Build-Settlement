from pathlib import Path
import hashlib
import json

root=Path(__file__).resolve().parent
manifest='SHA256SUMS.txt'
def run(folder):
    files=sorted([p for p in folder.rglob('*') if p.is_file() and p!=folder/manifest],key=lambda p: p.relative_to(folder).as_posix())
    rows=[(hashlib.file_digest(path.open('rb'),'sha256').hexdigest(),path.relative_to(folder).as_posix()) for path in files]
    target=folder/manifest
    target.write_text(''.join(f'{digest}  {name}\n' for digest,name in rows),encoding='utf-8',newline='\n')
    for line in target.read_text(encoding='utf-8').splitlines():
        digest,name=line.split('  ',1)
        with (folder/name).open('rb') as data:
            assert hashlib.file_digest(data,'sha256').hexdigest()==digest, (folder,name)
    return len(rows)
counts={}
for folder in sorted(path for path in root.iterdir() if path.is_dir() and path.name.startswith('b2-3-')):
    counts[folder.name]=run(folder)
counts['builder-b2']=run(root)
print(json.dumps(counts,indent=2))
