from pathlib import Path
from datetime import datetime, timezone
import ctypes, os, subprocess, sys, json

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

quiet_ps=r"""
$ports=@([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object { $_.Port -in @(4173,4174) } | ForEach-Object Port)
$first=@{}
Get-Process | Where-Object { $null -ne $_.CPU } | ForEach-Object { $first[$_.Id]=$_.CPU }
Start-Sleep -Seconds 2
$leaders=@(Get-Process | Where-Object { $null -ne $_.CPU -and $first.ContainsKey($_.Id) } | ForEach-Object {
    [pscustomobject]@{Name=$_.ProcessName;CPUSeconds=[Math]::Round(($_.CPU-$first[$_.Id]),3)}
} | Sort-Object CPUSeconds -Descending | Select-Object -First 10)
[pscustomobject]@{portsInUse=$ports;topProcesses=$leaders} | ConvertTo-Json -Depth 5
"""

def condition():
    listener=subprocess.check_output(['powershell.exe','-NoProfile','-NonInteractive','-Command',quiet_ps],cwd=repo)
    quiet=json.loads(listener)
    quiet['cpu']=json.loads(subprocess.check_output([sys.executable, str(reference/'probe-idle.py')],cwd=repo))
    quiet['logicalCpus']=os.cpu_count()
    quiet['systemRequired']=True
    quiet['node']=subprocess.check_output(['node','--version'],cwd=repo,text=True).strip()
    quiet['testedHead'],quiet['testedTree']=head,tree
    (path/'environment.json').write_bytes((json.dumps(quiet,indent=2)+'\n').encode())
    print(json.dumps(quiet),flush=True)
    if quiet['portsInUse']:
        raise SystemExit('A required Playwright port was already listening.')

if not set_state(0x80000001): raise ctypes.WinError(ctypes.get_last_error())
try:
    condition()
    if step.startswith('gate'):
        codes=[execute(label,args) for label,args in run]
        if codes[-1] == 0:
            codes.append(execute('07b-bundle',['node',str(reference/'measure-bundle.mjs'),
                    str(repo/'packages/ui/dist'), str(path/'bundle-raw')]))
        if any(codes): sys.exit(1)
        sys.exit(execute('08-smoke',['npm','run','test:smoke']))
    if step.startswith('timing'):
        measure_root=sys.argv[2]
        sys.exit(execute('paired-week',['node',str(here/'measure-week.mjs'),measure_root,str(repo),str(reference),str(path)]))
    raise SystemExit("Unknown phase.")
finally:
    set_state(0x80000000)

