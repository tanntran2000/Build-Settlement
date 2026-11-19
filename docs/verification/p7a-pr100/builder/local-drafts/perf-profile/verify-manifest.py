"""Hash every profiling evidence file except this folder's own manifest."""
from pathlib import Path
import argparse
import hashlib
import json

OUT=Path(__file__).resolve().parent
manifest=OUT/'SHA256SUMS.txt'
parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
paths=sorted((p for p in OUT.rglob('*') if p.is_file() and p!=manifest),key=lambda p:p.relative_to(OUT).as_posix())
for path in paths:
    text=path.read_bytes().decode('utf-8-sig')
    assert '\ufffd' not in text,path
expected=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(OUT).as_posix()+'\n' for p in paths)
if args.write:manifest.write_bytes(expected.encode('utf-8'))
assert manifest.read_bytes().decode('utf-8')==expected
print(json.dumps({'profileFilesVerified':len(paths),'utf8Checked':True,'ownManifestExcluded':True,'nestedHistoricalManifestsIncluded':[p.name for p in paths if p.name.endswith('SHA256SUMS.txt')]},indent=2))
