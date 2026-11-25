from datetime import datetime, timezone
from io import BytesIO
import json
from pathlib import Path
import statistics
import subprocess
import sys
import tarfile
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
BASE = '95821832a8c95988c3203b4c38f5f9ae665978e9'
OUT = HERE/'timings'
OUT.mkdir(exist_ok=True)
worker = HERE/'tick-worker.mjs'
def now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
def run(root,*args):
    command = ['node', str(worker), str(root), str(ROOT), *map(str,args)]
    start = now()
    invocation = subprocess.run(command,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if invocation.returncode:
        raise RuntimeError(subprocess.list2cmdline(command) + '\n' + invocation.stderr.decode('utf-8','replace'))
    row = json.loads(invocation.stdout)
    row.update(utcStart=start, utcFinish=now(), exit=invocation.returncode, command=subprocess.list2cmdline(command))
    if invocation.stderr:
        row['stderr'] = invocation.stderr.decode('utf-8','replace')
    return row
def write(name,data):
    (OUT/name).write_bytes((json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
def summary(xs):
    return dict(median=statistics.median(xs),minimum=min(xs),maximum=max(xs),samples=len(xs))
head,tree = git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
assert not git('status','--porcelain=v1')
assert git('rev-parse','origin/main').decode().strip() == BASE
reference = Path(sys.argv[1]).resolve()
prepared = run(ROOT,'prepare',OUT/'inputs','all',reference)
write('inputs.json', prepared)
raw,cases = {},{}
with tempfile.TemporaryDirectory(prefix='p7b-b4-main-timing-') as place:
    tmp = Path(place).resolve()
    assert tmp.is_relative_to(Path(tempfile.gettempdir()).resolve()) and tmp.name.startswith('p7b-b4-main-timing-')
    with tarfile.open(fileobj=BytesIO(git('-c','core.autocrlf=false','archive','--format=tar',BASE,
        '--','packages/core','packages/content','packages/simulation','packages/persistence'))) as tar:
        tar.extractall(tmp, filter='data')
    roots = {'A':tmp, 'A2':tmp, 'B':ROOT}
    for variant,input_info in prepared['inputs'].items():
        raw[variant] = rows = []
        for n in range(1,6):
            order = ['A','B','A2'] if n%2 else ['B','A','A2']
            pair = {key:run(roots[key],'tick',input_info['path'],variant) for key in order}
            assert {row['inputSha256'] for row in pair.values()} == {input_info['sha256']}
            assert pair['A']['outcomeSha256'] == pair['A2']['outcomeSha256']
            rows.append(dict(round=n,order=order,runs=pair))
            write('raw-timings.json', raw)
            print(f'{variant} round {n}/5 recorded',flush=True)
        main = [x for row in rows for sample in ('A','A2') for x in row['runs'][sample]['warmMs']]
        b4 = [x for row in rows for x in row['runs']['B']['warmMs']]
        deltas, noise = [],[]
        for row in rows:
            a, a2, b = (statistics.median(row['runs'][key]['warmMs']) for key in ('A','A2','B'))
            deltas.append(b-(a+a2)/2)
            noise.append(abs(a-a2))
        cases[variant] = dict(mainWarmMs=summary(main),b4WarmMs=summary(b4),pairedDeltasMs=deltas,
            medianPairedDeltaMs=statistics.median(deltas),mainToMainNoiseMs=noise,maxMainToMainNoiseMs=max(noise),
            mainColdMs=[row['runs'][key]['coldMs'] for row in rows for key in ('A','A2')],
            b4ColdMs=[row['runs']['B']['coldMs'] for row in rows])

results = dict(base=BASE,head=head,tree=tree,utcComplete=now(),rounds=5,warmTicksPerProcess=20,
    method=('Fresh Node processes, same v13 input bytes in main and B4, one cold tick and 20 warm ticks. '
        'Delta is B4 warm median minus the midpoint of the two main warm medians. Noise is the absolute main/main warm median gap. '
        'Control has 100 residents and no market. Other inputs share full market provenance, with short Gold and equipped exits tested separately.'),
    cases=cases)
write('comparison.json',results)
print(json.dumps(results,indent=2))

