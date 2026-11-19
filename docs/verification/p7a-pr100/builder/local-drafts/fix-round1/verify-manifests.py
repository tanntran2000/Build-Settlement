"""Verify profile or fix evidence as raw UTF-8, including nested manifests."""
from pathlib import Path
import argparse
import hashlib
import json

parser=argparse.ArgumentParser();parser.add_argument('--scope',choices=['profile','fix'],required=True);parser.add_argument('--write',action='store_true');args=parser.parse_args()
root=Path(__file__).resolve().parent
if args.scope=='profile':root=root/'profile'
manifest=root/'SHA256SUMS.txt'
files=sorted((p for p in root.rglob('*') if p.is_file() and p!=manifest),key=lambda p:p.relative_to(root).as_posix())
for path in files:
    text=path.read_bytes().decode('utf-8-sig');assert '\ufffd' not in text,path
expected=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(root).as_posix()+'\n' for p in files)
if args.write:manifest.write_bytes(expected.encode('utf-8'))
assert manifest.read_bytes().decode('utf-8')==expected
print(json.dumps({'scope':args.scope,'filesVerified':len(files),'utf8Checked':True,'ownManifestExcluded':True,'nestedManifestsIncluded':[p.relative_to(root).as_posix() for p in files if p.name.endswith('SHA256SUMS.txt')]},indent=2))
