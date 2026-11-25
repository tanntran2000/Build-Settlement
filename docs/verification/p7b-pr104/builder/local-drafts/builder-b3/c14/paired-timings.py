from datetime import datetime, timezone
from io import BytesIO
import json
from pathlib import Path
import statistics
import subprocess
import tarfile
import tempfile

EVIDENCE = Path(__file__).resolve().parent
OUTPUT = EVIDENCE / 'timings'
OUTPUT.mkdir(exist_ok=True)
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
BASE = 'b184357d235d164478584e36b96d063551124e66'
WORKER = EVIDENCE/'bench-worker.mjs'
LARGEST = EVIDENCE/'save-size'/'largest-save.json'
assert LARGEST.is_file()
def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT)
head = git('rev-parse','HEAD').decode().strip()
tree = git('rev-parse','HEAD^{tree}').decode().strip()
assert git('status','--porcelain=v1')==b''
assert git('rev-parse','origin/main').decode().strip()==BASE
def utc():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')
def checked(root, command, variant, file):
    args = ['node',str(WORKER),str(root),str(ROOT),command,variant,str(file),str(LARGEST)]
    t = utc()
    result = subprocess.run(args,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(subprocess.list2cmdline(args)+'\n'+result.stderr.decode('utf-8',errors='replace'))
    value=json.loads(result.stdout)
    value.update(utcStart=t,utcFinish=utc(),command=subprocess.list2cmdline(args),exit=result.returncode)
    if result.stderr:
        value['stderr']=result.stderr.decode('utf-8',errors='replace')
    return value
def write(name,data):
    (OUTPUT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
def p95(data):
    return statistics.quantiles(data,n=20,method='inclusive')[18]
def median(data):
    return statistics.median(data)
def summary(data):
    return {'median':median(data),'p95':p95(data),'max':max(data),'over50':sum(x>50 for x in data)}
def read_existing(name):
    return (OUTPUT/name).exists()

results = {'baseline':BASE,'head':head,'tree':tree,'startUTC':utc(),'rounds':5,'warmTicksPerProcess':20,
 'method':'Five alternating triples on one machine. Each fresh process uses the same untouched checkpoint. The market checkpoint is the exact browser-measured save. Main uses the same shared state encoded via its v12 codec with the v13 acquisition subtree excluded. Baseline noise is the maximum absolute main-A/main-A2 warm-median gap. A warm cost is repeatable when at least four of five candidate deltas exceed that noise.'}
with tempfile.TemporaryDirectory(prefix='p7b-b3-main-timing-') as tmp:
    with tarfile.open(fileobj=BytesIO(git('archive','--format=tar',BASE))) as archive:
        archive.extractall(tmp,filter='data')
    roots={'main':Path(tmp),'head':ROOT}
    cases={}
    for variant in ('control','market'):
        inputs={}
        for version, root in roots.items():
            key=f'{version}-{variant}'
            file = OUTPUT/(key+'.json')
            if file.exists():
                raise RuntimeError('Benchmark inputs already exist: '+str(file))
            inputs[version]=checked(root,'prepare',variant,file)
        assert inputs['main']['comparableSha']==inputs['head']['comparableSha'], variant
        if variant=='market':
            assert (inputs['head']['stock'],inputs['head']['lots'],inputs['head']['actionsPerLot'],inputs['head']['departures'])==(12,2,[4,4],14)
            assert file.exists()
        cases[variant]={'inputs':inputs}
    write('inputs.json',cases)
    raw = {}
    for variant in cases:
        for mode in ('tick','load'):
            group=f'{variant}-{mode}'
            rows=[]
            for round_no in range(1,6):
                order=[('main','A'),('head','B'),('main','A2')] if round_no%2 else [('head','B'),('main','A'),('main','A2')]
                pair={}
                for version,label in order:
                    file=OUTPUT/(f'{version}-{variant}.json')
                    pair[label]=checked(roots[version],mode,variant,file)
                rows.append({'round':round_no,'order':[x[1] for x in order],'runs':pair})
                print(f'{group} {round_no}/5',flush=True)
            raw[group]=rows
            write('raw-timings.json',raw)

aggregate={}
for group,rows in raw.items():
    baseWarm,headWarm,baseCold,headCold,baseNoise,deltas,draw=[],[],[],[],[],[],[]
    for row in rows:
        pair=row['runs']
        baseWarm.extend(pair['A']['warmMs']+pair['A2']['warmMs'])
        headWarm.extend(pair['B']['warmMs'])
        baseCold.extend([pair['A']['coldMs'],pair['A2']['coldMs']])
        headCold.append(pair['B']['coldMs'])
        main,again,head_time=[median(pair[label]['warmMs']) for label in ('A','A2','B')]
        baseNoise.append(abs(main-again))
        deltas.append(head_time-(main+again)/2)
        draw.extend(pair['B'].get('drawMs',[]))
    limit=max(baseNoise)
    aggregate[group]={'mainWarm':summary(baseWarm),'headWarm':summary(headWarm),'mainColdMs':baseCold,'headColdMs':headCold,
                      'mainNoiseMs':baseNoise,'maxMainNoiseMs':limit,'pairedDeltasMs':deltas,'medianDeltaMs':median(deltas),
                      'warmCostAboveNoise':sum(delta>limit for delta in deltas)>=4}
    if draw: aggregate[group]['drawAcquisitionMs']=summary(draw)
results.update(finishUTC=utc(),cases=cases,aggregate=aggregate,
               hold=any(item['warmCostAboveNoise'] for item in aggregate.values()))
write('comparison.json',results)
print(json.dumps(results,indent=2))
if results['hold']: raise SystemExit(2)
