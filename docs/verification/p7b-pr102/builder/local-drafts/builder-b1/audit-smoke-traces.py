import json,re,sys
from collections import Counter
from pathlib import Path
from zipfile import ZipFile

def inspect(traces):
    results = []
    for z in sorted(traces):
        with ZipFile(z) as archive:
            errors = [e for raw in archive.read('test.trace').splitlines() if (e := json.loads(raw)).get('type') == 'error']
        for e in errors:
            msg = re.sub(r'\x1b\[[0-9;]*m','',e['message'])
            match = re.search(r'-   "householdUpkeep": Object \{\r?\n-     "paidMilli": (\d+),\r?\n-     "unpaidMilli": (\d+),\r?\n-   \},', msg)
            first = e.get('stack', [None])[0]
            results.append({
                'trace': z.relative_to(root).as_posix(),
                'firstStack': {'file': str(Path(first['file']).relative_to(wt).as_posix()), 'line': first['line']} if first else None,
                'soleDifference': 'householdUpkeep field absent from reconstructed report' if match and '- Expected  - 4' in msg and '+ Received  + 0' in msg else None,
                'expectedHouseholdUpkeep': {'paidMilli': int(match[1]), 'unpaidMilli': int(match[2])} if match else None,
                'firstErrorLine': msg.splitlines()[0]
            })
    return results

root = Path(sys.argv[1])
wt = Path.cwd()
initial = inspect((root/'smoke-initial-attachments').glob('*/trace.zip'))
assert len(initial) == 56
solo = None
if len(sys.argv) == 3 and sys.argv[2] == '--complete':
    attempts = json.loads((root/'smoke-reruns'/'summary.json').read_text(encoding='utf-8'))
    assert len(attempts['results']) == attempts['expected'] == 56
    assert all(row['exactlyOneCase'] for row in attempts['results'])
    assert all(row['signal'] is None for row in attempts['results'])
    solo = inspect((root/'smoke-reruns').glob('*/**/trace.zip'))
    assert len(solo) == sum(row['exitCode'] != 0 for row in attempts['results'])
out = {'initial': initial, 'isolated': solo}
(root/'smoke-trace-diagnostics.json').write_text(json.dumps(out, indent=2, ensure_ascii=False)+'\n', encoding='utf-8', newline='\n')
for label, data in out.items():
    if data is not None:
        print(label, len(data), dict(Counter((e['soleDifference'] or e['firstErrorLine']) for e in data)))
