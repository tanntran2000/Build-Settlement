"""Invoke unchanged production generators once; verify approved exact output bytes."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

ROOT = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT = Path(__file__).resolve().parent
runner = OUT / 'run-evidence.py'

def run(log, flag, args):
    env = dict(os.environ, **{flag: '1'})
    result = subprocess.run([sys.executable, '-X', 'utf8', str(runner), log, '--', 'npm', 'test', '--', *args], cwd=ROOT, env=env)
    if result.returncode:
        sys.exit(result.returncode)

assert not (OUT / 'golden-generation-count.txt').exists(), 'HOLD: generation already reserved'
run('B1-generate-five-weeks.txt', 'GENERATE_CRISIS_FIXTURES', ['packages/simulation/src/__tests__/crisis-fixtures.test.ts', '-t', 'pins production-generated life-5-weeks bytes'])
run('B1-generate-laws.txt', 'GENERATE_LAW_FIXTURE', ['packages/simulation/src/__tests__/law-fixture.test.ts', '-t', 'pins the production-command Week 4 laws checkpoint and round-trips it'])
golden = 'packages/simulation/src/__tests__/fixtures/catalog-golden.json'
before = (OUT / 'proposals/before' / golden).read_bytes()
assert (ROOT / golden).read_bytes() == before
(OUT / 'golden-generator-input.json').write_bytes(before)
# The existing generator intentionally uses flag wx. Only this verified exact input
# is removed after preserving its bytes; no directory or unrelated output is deleted.
(OUT / 'golden-generation-count.txt').write_text('GENERATOR_INVOCATIONS=1\nGENERATOR=packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts\nFLAG=GENERATE_CATALOG_GOLDEN=1\n', encoding='utf-8')
(ROOT / golden).unlink()
run('B1-generate-golden.txt', 'GENERATE_CATALOG_GOLDEN', ['packages/simulation/src/__tests__/catalog-golden.test.ts'])
rows = []
for item in json.loads((OUT / 'B0-proposed-files.json').read_text()):
    data = (ROOT / item['file']).read_bytes()
    assert data == Path(item['afterCopy']).read_bytes(), 'HOLD: unapproved output: ' + item['file']
    rows.append({'path': item['file'], 'approvedBytesMatch': True, 'sha256': hashlib.sha256(data).hexdigest()})
(OUT / 'B1-generated-byte-verification.json').write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')
print('PASS: all six approved existing test/data files exactly match approved bytes; golden generator invoked once.')
