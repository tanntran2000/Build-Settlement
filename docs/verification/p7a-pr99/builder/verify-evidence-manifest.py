"""Hash every evidence file except the top manifest; preserve raw artifact bytes."""
from pathlib import Path
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parent
TOP = ROOT / 'SHA256SUMS.txt'
BINARY = {'.gz', '.tar', '.zip', '.png', '.jpg', '.webp', '.pdf'}


def files():
    return sorted((p for p in ROOT.rglob('*') if p.is_file() and p != TOP),
                  key=lambda p: p.relative_to(ROOT).as_posix())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    paths = files()
    for path in paths:
        if path.suffix.lower() not in BINARY:
            value = path.read_bytes().decode('utf-8-sig')
            assert '\ufffd' not in value, f'Replacement character: {path}'
    readme = (ROOT / 'README.md').read_text(encoding='utf-8-sig')
    for token in ['T\u00e2n', 'Duy\u1ec7t P7-A', 'Duy\u1ec7t, giao Builder A',
                  'Approve E51\u2013E53', 'Approve baseline comparison (Recommended)', 'Approve full smoke rerun (Recommended)', '\u2014', '\u2192']:
        assert token in readme, f'Missing intact UTF-8 token: {ascii(token)}'
    lines = [hashlib.sha256(path.read_bytes()).hexdigest() + '  ' +
             path.relative_to(ROOT).as_posix() for path in paths]
    expected = '\n'.join(lines) + '\n'
    if args.write:
        TOP.write_bytes(expected.encode('utf-8'))
    assert TOP.read_bytes().decode('utf-8') == expected, 'Manifest mismatch'
    nested = [p.relative_to(ROOT).as_posix() for p in paths
              if p.name.endswith('SHA256SUMS.txt')]
    print(json.dumps({'verifiedFiles': len(paths), 'topManifestExcluded': True,
                      'nestedManifestsIncluded': nested,
                      'textEncoding': 'UTF-8 (optional BOM accepted)',
                      'rawArtifactBytesPreserved': True,
                      'ownerQuotesIntact': True}, indent=2))


if __name__ == '__main__':
    main()
