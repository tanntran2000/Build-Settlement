from pathlib import Path
import hashlib
p=Path('tests/e2e/acquisition.spec.ts')
raw=p.read_bytes()
approved='73b33d535fd6c31e070d65b3e327097fa4178138e68c03e9b20899cc4ee60c3b'
canonical=raw.replace(b'\r\n',b'\n')
sha=lambda b:hashlib.sha256(b).hexdigest()
print(f'Applied file before correction: {sha(raw)}; {raw.count(bytes((13,10)))} CRLF lines.')
assert canonical != raw and sha(canonical)==approved, 'Unexpected content mismatch beyond CRLF'
p.write_bytes(canonical)
print(f'Approved LF bytes restored: {sha(p.read_bytes())}.')
