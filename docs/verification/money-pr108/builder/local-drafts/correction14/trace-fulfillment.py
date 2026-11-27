from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
import sys

path = Path(sys.argv[1])
with ZipFile(path) as trace:
    name = next(name for name in trace.namelist() if name.endswith('test.trace'))
    rows = [json.loads(row) for row in trace.read(name).splitlines()]
opened = {r['callId']:r for r in rows if r.get('type') == 'before'}
closed = {r['callId']:r for r in rows if r.get('type') == 'after'}
checks = []
for key, row in opened.items():
    if 'toHaveAttribute' in row.get('apiName', row.get('title', '')) and 'life-end-week' in str(row.get('params', {})):
        result = closed.get(key)
        checks.append({'callId':key, 'error':result.get('error') if result else 'pending',
                       'ms':round(result['endTime'] - row['startTime'], 3) if result else None})
errors = [r['message'] for r in rows if r.get('type') == 'error']
assert len(checks) == 10 and all(check['error'] is None for check in checks)
assert any('Test timeout of 60000ms exceeded.' in error for error in errors)
print(json.dumps({'traceSHA256':hashlib.sha256(path.read_bytes()).hexdigest(),
                  'checks':checks, 'maxMs':max(x['ms'] for x in checks),
                  'totalMs':round(sum(x['ms'] for x in checks), 3), 'errors':errors}, indent=2))
