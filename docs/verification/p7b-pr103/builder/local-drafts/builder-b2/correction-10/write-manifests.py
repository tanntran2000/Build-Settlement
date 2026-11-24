from pathlib import Path
import hashlib

def manifest(root):
    output=root/'SHA256SUMS.txt'
    files=sorted([p for p in root.rglob('*') if p.is_file() and p!=output])
    def sha(p):
        with p.open('rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()
    output.write_text(''.join(f'{sha(p)}  {p.relative_to(root).as_posix()}\n' for p in files),encoding='utf-8',newline='\n')
    for line in output.read_text(encoding='utf-8').splitlines():
        digest,name=line.split('  ',1)
        assert sha(root/name)==digest
    print(root.name,len(files))

root=Path(__file__).resolve().parent
manifest(root)
manifest(root.parent)
