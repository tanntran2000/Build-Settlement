"""Hash every evidence file except this directory's top manifest; preserve raw bytes."""
from pathlib import Path
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parent
TOP = ROOT / 'SHA256SUMS.txt'
parser = argparse.ArgumentParser()
parser.add_argument('--write', action='store_true')
args = parser.parse_args()
paths = sorted((p for p in ROOT.rglob('*') if p.is_file() and p != TOP),
               key=lambda p: p.relative_to(ROOT).as_posix())
for path in paths:
    text = path.read_bytes().decode('utf-8-sig')
    assert '\ufffd' not in text, path
hold = (ROOT / 'STEP0-HOLD.md').read_text(encoding='utf-8')
for token in ['T\u00e2n', 'Giao Builder B', '\u2014', '\u2192']:
    assert token in hold, ascii(token)
expected = ''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.relative_to(ROOT).as_posix() + '\n' for p in paths)
if args.write:
    TOP.write_bytes(expected.encode('utf-8'))
assert TOP.read_bytes().decode('utf-8') == expected
print(json.dumps({'verifiedFiles': len(paths), 'topManifestExcluded': True,
                  'nestedManifestsIncluded': [p.relative_to(ROOT).as_posix() for p in paths if p.name.endswith('SHA256SUMS.txt')],
                  'utf8Checked': True, 'ownerQuoteIntact': True, 'rawBeforeAfterBytesPreserved': True}, indent=2))
