from pathlib import Path
import os
import subprocess
import sys

ROOT = Path.cwd()
EVIDENCE = Path(__file__).parent
RUNNER = EVIDENCE / 'run.py'
VITEST = ROOT / 'node_modules/vitest/vitest.mjs'
def probe(name, path, pattern, edit, expected, received):
    print(name, flush=True)
    path = ROOT / path
    originals = path.read_bytes()
    try:
        changed = edit(originals)
        assert changed != originals
        path.write_bytes(changed)
        result = subprocess.run([sys.executable, str(RUNNER), name, 'node', str(VITEST), 'run',
                                 str(path.relative_to(ROOT)) if not path.name.endswith('.json') else
                                 'packages/persistence/src/__tests__/npc-life-records.test.ts', '-t', pattern], check=False)
        output = (EVIDENCE / (name + '.txt')).read_text(encoding='utf-8')
        assert result.returncode == 1 and expected in output and received in output and '1 failed' in output, name
    finally:
        path.write_bytes(originals)

def replace(before, after):
    def replace_once(value):
        assert value.count(before) == 1, before
        return value.replace(before, after)
    return replace_once

probe('red-probe-p1-4-card', 'packages/ui/src/__tests__/acquisition-view.test.ts', 'renders age, origin',
      replace(b'  expect(view).toStrictEqual({', b"  Object.assign(view, { title: '', origin: '', skills: [{ label: 'Incorrect', value: 39 }, { label: 'Incorrect', value: 36 }] });\n  expect(view).toStrictEqual({"),
      '"title": "Mature"', '"label": "Incorrect"')
probe('red-probe-p1-5-json', 'packages/simulation/src/__tests__/npc-acquisition.test.ts', 'rejects a malformed, missing',
      replace(b'    expect(refused).toStrictEqual({', b"    if (!refused.success) Object.assign(refused.error, { code: 'WRONG', message: 'Unrelated refusal.' });\n    expect(refused).toStrictEqual({"),
      '"code": "INVALID_SAVE_STATE"', '"message": "Unrelated refusal."')
probe('red-probe-p1-5-row', 'packages/simulation/src/__tests__/replay-checkpoint.test.ts', 'refuses an edited legal raise',
      replace(b'catch (caught) { rowError = caught; }', b"catch (caught) { rowError = caught instanceof StoreRecordError ? new StoreRecordError('world:outside') : caught; }"),
      'Expected: "city:city"', 'Received: "world:outside"')
probe('red-probe-p1-6-v12-bytes', 'packages/persistence/src/__tests__/fixtures/society-v12/life-laws.json', 'pins the original bytes',
      lambda raw: raw + b'\n', 'f21b183ab20596596c19357e620213b295bebd539e0ae19fa1f96652c78b8255',
      'Received:')
print('Four mutations caught at the targeted assertions. Original bytes restored.', flush=True)
