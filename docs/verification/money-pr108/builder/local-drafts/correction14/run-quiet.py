from pathlib import Path
from datetime import datetime, timezone
import ctypes, os, subprocess, sys, json, time

here=Path(__file__).resolve().parent
repo=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
step=sys.argv[1]
out=here/'M3.3'
out.mkdir(exist_ok=True)
path=out/step
path.mkdir(exist_ok=False)
env={**os.environ,'CI':'1','NO_COLOR':'1'}
now=lambda: datetime.now(timezone.utc).isoformat()
head,tree=subprocess.check_output(['git','rev-parse','HEAD','HEAD^{tree}'],cwd=repo,text=True).split()
base='0b2b3a6088d003301d48b460202327fb53546ede'
reference=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/round3-c9/measurement-1')
run=[('01-diff',['git','diff','--check','origin/main...HEAD']),
     ('02-lint',['npm','run','lint']), ('03-typecheck',['npm','run','typecheck']),
     ('04-check-architecture',['npm','run','check:architecture']), ('05-test-architecture',['npm','run','test:architecture']),
     ('06-unit',['npm','test']), ('07-build',['npm','run','build'])]
set_state=ctypes.WinDLL('kernel32',use_last_error=True).SetThreadExecutionState
set_state.argtypes=[ctypes.c_ulong]
set_state.restype=ctypes.c_ulong

def execute(label, args):
    executable=['cmd','/d','/c',*args] if args[0]=='npm' else args
    if args[0]=='python': executable=[sys.executable,*args[1:]]
    with (path/(label+'.txt')).open('xb') as f:
        def log(s):
            f.write((s+'\n').encode('utf-8')); f.flush()
        log(f'HEAD {head}\nTree {tree}\nBase {base}\nCI=1 {subprocess.list2cmdline(args)}\nStart UTC {now()}')
        proc=subprocess.run(executable,cwd=repo,env=env,stdout=f,stderr=subprocess.STDOUT)
        log(f'Exit {proc.returncode} | End UTC {now()}')
    print(f'{label}: {proc.returncode}',flush=True)
    return proc.returncode

def wait_for_quiet(label):
    samples = []
    for _ in range(12):
        selected = {'utc': now(),
            'cpu': json.loads(subprocess.check_output([sys.executable, str(reference / 'probe-idle.py')], cwd=repo)),
            'logicalCpus': os.cpu_count(), 'systemRequired': True,
            'node': subprocess.check_output(['node', '--version'], cwd=repo, text=True).strip(),
            'testedHead': head, 'testedTree': tree}
        samples.append(selected)
        (path / (label + '-ambient-samples.json')).write_bytes((json.dumps(samples, indent=2) + '\n').encode())
        print(label, json.dumps(selected), flush=True)
        cpu = selected['cpu']
        if cpu['meanCpuPercent'] <= 10 and max(cpu['twoSecondCpuPercent']) <= 20:
            (path / (label + '-environment.json')).write_bytes((json.dumps(selected, indent=2) + '\n').encode())
            return
        time.sleep(4)
    print('No quiet sample selected. The next phase did not start.', flush=True)
    sys.exit(3)

if not set_state(0x80000001): raise ctypes.WinError(ctypes.get_last_error())
try:
    wait_for_quiet('start')
    if step.startswith('smoke'):
        sys.exit(execute('08-smoke',['npm','run','test:smoke']))
    if step.startswith('gate'):
        codes=[execute(label,args) for label,args in run]
        if codes[-1] == 0:
            codes.append(execute('07b-bundle',['node',str(reference/'measure-bundle.mjs'),
                    str(repo/'packages/ui/dist'), str(path/'bundle-raw')]))
        if any(codes): sys.exit(1)
        wait_for_quiet('pre-smoke')
        sys.exit(execute('08-smoke',['npm','run','test:smoke']))
    if step.startswith('timing'):
        from hashlib import sha256
        measure = json.loads((here / 'benchmark-base.json').read_bytes())
        measure_root = measure['root']
        assert sha256((Path(measure_root) / 'baseline.tar').read_bytes()).hexdigest() == measure['archiveSha256']
        for difficulty, expected in measure['fixtureSha256'].items():
            assert sha256((reference / (difficulty + '-100-npc.json')).read_bytes()).hexdigest() == expected
        code = execute('isolated-week', ['node', str(here / 'measure-isolated.mjs'), str(repo), str(reference), str(path)])
        if code: sys.exit(code)
        wait_for_quiet('pre-paired')
        sys.exit(execute('paired-week',['node',str(here/'measure-week.mjs'),measure_root,str(repo),str(reference),str(path)]))
    raise SystemExit("Unknown phase.")
finally:
    set_state(0x80000000)

