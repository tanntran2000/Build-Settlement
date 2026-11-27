from datetime import datetime, UTC
from pathlib import Path
from ctypes import WinDLL, c_uint32, byref
from ctypes.wintypes import FILETIME, BOOL
from hashlib import sha256
import json,os,socket,statistics,subprocess,sys,time,re

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction11')
attempt=int(sys.argv[1])
start_number=int(sys.argv[2])
assert 1<=attempt<=2 and 1<=start_number<=8
def git(*args): return subprocess.check_output(['git',*args],cwd=wt).decode().strip()
head,tree=git('rev-parse','HEAD','HEAD^{tree}').splitlines()
assert git('branch','--show-current')=='feat/money-purse'
assert 'HEAD '+head in (out/'test-commit.txt').read_text(encoding='utf-8')
origin=git('rev-parse','origin/main')
clean=lambda:git('rev-parse','HEAD')==head and not git('status','--porcelain=v1') and git('rev-parse','origin/main')==origin
assert clean()
def utc(): return datetime.now(UTC).isoformat()
win=WinDLL('kernel32',use_last_error=True)
set_state=win.SetThreadExecutionState
set_state.argtypes=[c_uint32];set_state.restype=c_uint32
get_times=win.GetSystemTimes
get_times.restype=BOOL
def counts():
    idle,sys,user=FILETIME(),FILETIME(),FILETIME()
    if not get_times(byref(idle),byref(sys),byref(user)):raise RuntimeError('GetSystemTimes failed')
    return tuple((x.dwHighDateTime<<32)|x.dwLowDateTime for x in (idle,sys,user))
def processes():
    cmd=r"""@(Get-Process | Where-Object {$null -ne $_.CPU} | Select-Object ProcessName,Id,CPU) | ConvertTo-Json -Compress"""
    p=subprocess.check_output(['powershell.exe','-NoProfile','-Command',cmd],cwd=wt)
    return {r['Id']:r for r in json.loads(p.decode('utf-8'))}
def ports():
    entries=[]
    for ip,family in [('127.0.0.1',socket.AF_INET),('::1',socket.AF_INET6)]:
        for port in (4173,4174):
            with socket.socket(family) as s:
                s.settimeout(0.5)
                code=s.connect_ex((ip,port))
                entries.append({'ip':ip,'port':port,'open':code==0})
    return entries
def quiet(label):
    f=out/f'gate-attempt{attempt}-{label}-environment.json'
    intervals=[]
    for i in range(12):
        assert clean()
        listening=ports()
        if any(p['open'] for p in listening): raise RuntimeError(f'Browser port occupied {listening}')
        before=processes()
        prev=counts()
        samples=[]
        for unused in range(3):
            time.sleep(2)
            cur=counts()
            idle,kernel,user=(a-b for a,b in zip(cur,prev))
            samples.append(round(100*(1-idle/(kernel+user)),2))
            prev=cur
        after=processes()
        top=sorted([{'process':v['ProcessName'],'pid':pid,
            'cpuSecondsDelta':round(v['CPU']-before.get(pid,{'CPU':0})['CPU'],3)}
            for pid,v in after.items()],key=lambda v:v['cpuSecondsDelta'],reverse=True)[:12]
        chosen=statistics.mean(samples)<=18 and max(samples)<=25
        intervals.append({'utc':utc(),'cpuPercentTwoSecondIntervals':samples,'meanPercent':round(statistics.mean(samples),2),
             'ports':listening,'topCpuProcesses':top,'selected':chosen})
        f.write_text(json.dumps({'head':head,'tree':tree,'baseRef':origin,'awakeApiFlags':'ES_CONTINUOUS|ES_SYSTEM_REQUIRED',
            'awakePriorState':f'0x{prior:08x}','measurements':intervals},indent=2)+'\n',encoding='utf-8',newline='\n')
        if chosen:
            print(label,samples,'ports free',flush=True)
            return
    raise RuntimeError('No quiet window in 12 samples')
commands=[
    ('diff',['git','diff','--check','origin/main...HEAD']),
    ('lint',['npm.cmd','run','lint']),
    ('typecheck',['npm.cmd','run','typecheck']),
    ('architecture',['npm.cmd','run','check:architecture']),
    ('architecture-tests',['npm.cmd','run','test:architecture']),
    ('unit',['npm.cmd','test']),
    ('build',['npm.cmd','run','build']),
    ('smoke',['npm.cmd','run','test:smoke']),
]
env={**os.environ,'NO_COLOR':'1','FORCE_COLOR':'0','VITEST_MAX_WORKERS':'3'}
env.pop('CI',None)
prior=set_state(0x80000001)
if not prior:raise OSError('SetThreadExecutionState failed')
try:
    if start_number!=8:quiet('before-gates')
    for n,(name,args) in enumerate(commands,1):
        if n<start_number:continue
        assert clean()
        if n==8:
            quiet('before-smoke')
            env['CI']='1'
        f=out/f'gate-attempt{attempt}-{n}-{name}.txt'
        with f.open('xb') as log:
            log.write((f'HEAD {head}\nTree {tree}\norigin/main {origin}\nUTC start {utc()}\n'
                       f'CI {env.get("CI","unset")}\nVITEST_MAX_WORKERS 3\nCommand {subprocess.list2cmdline(args)}\n\n').encode('utf-8'))
            log.flush()
            print('Gate',n,name,'started',flush=True)
            start=time.monotonic()
            r=subprocess.run(args,cwd=wt,env=env,stdout=log,stderr=subprocess.STDOUT)
            log.write(f'\nExit {r.returncode} in {time.monotonic()-start:.3f}s\nUTC end {utc()}\n'.encode('utf-8'))
        assert clean()
        print('Gate',n,name,'exit',r.returncode,flush=True)
        if r.returncode:sys.exit(r.returncode)
finally:
    set_state(0x80000000)
