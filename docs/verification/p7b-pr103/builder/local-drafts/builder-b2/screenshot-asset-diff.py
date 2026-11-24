from pathlib import Path
import gzip
import json
import subprocess

folder=Path(__file__).resolve().parent
report=json.loads((folder/'b2-3-measurements.json').read_bytes())
assert not report['screenshotAssetsIdenticalToCandidate']
a=gzip.decompress((folder/'candidate-index-DQBrCdBW.js.gz').read_bytes())
b=gzip.decompress((folder/'b2-3-index-xNyhfJ1L.js.gz').read_bytes())
assert a.count(b'58b4f2d')==1 and a.replace(b'58b4f2d',b'f31310c')==b
assert (folder/'candidate-index-BJ9v1KVg.css.gz').read_bytes()==(folder/'b2-3-index-BJ9v1KVg.css.gz').read_bytes()
print('Bundle delta: Git build stamp 58b4f2d -> f31310c (seven JS bytes), CSS byte-identical.')
print('Product UI source paths unchanged:', not subprocess.check_output(['git','diff','--name-only','62c34cb35c597b26f936f938f924d6449e0094ad','HEAD','--','packages/ui',':(exclude)packages/ui/src/__tests__/**']))
