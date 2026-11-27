from pathlib import Path
from datetime import datetime, UTC
from hashlib import sha256
from statistics import median
from ctypes import WinDLL, c_uint32
import json, math, os, subprocess, sys

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
drafts=Path('C:/Users/Admin/.t3/local-drafts')
root=drafts/'money-prM2'
archive=drafts/'money-prM2-scratch-f1fac94'/'base'
out=root/'round3-c9'
archive_head='f1fac9498f47fc7be8f6498ee3321800e14f2894'
m1=drafts/'money-prM1/builder-m1'
attempt=int(sys.argv[1])
dir=out/f'measurement-{attempt}'
dir.mkdir()
def hash_bytes(data): return sha256(data).hexdigest()
def utc():return datetime.now(UTC).isoformat()
def git(*args):return subprocess.check_output(['git',*args],cwd=wt)
head,tree=git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
assert 'HEAD '+head in (out/'ui-commit.txt').read_text(encoding='utf-8')
assert not git('status','--porcelain=v1')
worker_original=(m1/'m1.4-bench-worker.mjs').read_text(encoding='utf-8')
worker=worker_original.replace("difficulty = 'normal']","difficulty = 'normal', levyPercent = '0']")
worker=worker.replace("robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 201 },","robbery: null,")
worker=worker.replace("  const expectedHash = sha(JSON.stringify(state));",
    "  state.player.purse.levyPercent = Number(levyPercent);\n  const expectedHash = sha(JSON.stringify(state));")
worker=worker.replace("inputSha256:sha(source),outcomeSha256:", "inputSha256:expectedHash,sourceSha256:sha(source),levyPercent:Number(levyPercent),outcomeSha256:")
assert len(worker)>len(worker_original)
worker_dest=dir/'measure-worker.mjs'
worker_dest.write_text(worker,encoding='utf-8',newline='\n')
bundle_dest=dir/'measure-bundle.mjs'
bundle_dest.write_bytes((m1/'measure-bundle.mjs').read_bytes())
for p in ('packages/core/src/data/tuning.json','packages/simulation/src/character-life-command.ts','packages/core/src/index.ts',
          'packages/core/src/character/validate.ts','packages/persistence/src/character-life-save.ts'):
    raw=(archive/p).read_bytes().replace(b'\r\n',b'\n')
    assert raw==git('show',f'{archive_head}:{p}').replace(b'\r\n',b'\n'),p
log=dir/'commands.txt'
log.write_text(f'HEAD {head}\nTree {tree}\nBase {archive_head}\n',encoding='utf-8',newline='\n')
def run(args):
    argv=[str(x) for x in args]
    with log.open('a',encoding='utf-8',newline='\n') as f:
        print(utc(),subprocess.list2cmdline(argv),file=f,flush=True)
        p=subprocess.run(argv,cwd=wt,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        print(p.stdout.decode('utf-8'),file=f,end='')
        if p.stderr:print(p.stderr.decode('utf-8',errors='replace'),file=f,end='')
        print(f'\nExit {p.returncode}\n',file=f)
    if p.returncode:raise RuntimeError('measurement command failed '+str(p.returncode))
    return json.loads(p.stdout)

def measure_stats(values):
    order=sorted(values)
    return {'medianMs':round(median(values),6),'p95Ms':round(order[math.ceil(0.95*len(order))-1],6),
            'maxMs':round(max(values),6),'above50ms':sum(x>50 for x in values),'samples':len(values)}

win=WinDLL('kernel32',use_last_error=True)
state=win.SetThreadExecutionState
state.argtypes=[c_uint32];state.restype=c_uint32
prior=state(0x80000001)
if not prior:raise RuntimeError('SetThreadExecutionState failed')
try:
    bundle=run(['node',bundle_dest,wt/'packages/ui/dist',dir/'gzip'])
    (dir/'bundle.json').write_text(json.dumps(bundle,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('Gzip bytes',bundle['totalGzipBytes'],flush=True)
    save={}
    fixtures={}
    for difficulty in ('normal','easy'):
        for label,src in (('base',archive),('head',wt)):
            for variant in ('empty','populated'):
                fn=dir/f'{label}-{difficulty}-{variant}-save.json'
                key=f'{label}-{difficulty}-{variant}'
                save[key]=run(['node',worker_dest,src,wt,'fresh-save',variant,fn,'',difficulty])
        for variant in ('empty','populated'):
            assert save[f'base-{difficulty}-{variant}']['sha256']==save[f'head-{difficulty}-{variant}']['sha256']
        path=dir/(difficulty+'-100-npc.json')
        f=run(['node',worker_dest,archive,wt,'prepare','control',path,'',difficulty])
        assert f['npcCount']==100
        fixtures[difficulty]=(path,f)
    (dir/'save-size.json').write_text(json.dumps(save,indent=2)+'\n',encoding='utf-8',newline='\n')
    arms={'base0':(archive,0),'base0repeat':(archive,0),'head0':(wt,0),'base5':(archive,5),'head5':(wt,5)}
    keys=list(arms)
    observed={}
    rawlog=dir/'raw-timings.ndjson'
    env_probe=m1/'probe-m1.4-c5-idle.py'
    probe_dest=dir/'probe-idle.py'
    probe_dest.write_bytes(env_probe.read_bytes())
    idle_samples=[]
    for i in range(12):
        probe=run(['python.exe',probe_dest])
        idle_samples.append(probe)
        if probe['meanCpuPercent']<=18 and max(probe['twoSecondCpuPercent'])<=25:break
    else:
        raise RuntimeError('No quiet measurement window')
    top_script=r'''@(Get-Process | Where-Object {$null -ne $_.CPU} | Sort-Object CPU -Descending | Select-Object -First 12 ProcessName,Id,CPU) | ConvertTo-Json -Compress'''
    top=run(['powershell.exe','-NoProfile','-Command',top_script])
    (dir/'environment.json').write_text(json.dumps({'idleSamples':idle_samples,'topTotalCpuProcesses':top,
        'keepAwakePriorState':f'0x{prior:08x}'},indent=2)+'\n',encoding='utf-8',newline='\n')
    for difficulty in ('normal','easy'):
        path,f=fixtures[difficulty]
        pairs=[]
        for block in range(8):
            order=keys[block%len(keys):]+keys[:block%len(keys)]
            if block>=len(keys):order=list(reversed(order))
            row={}
            for name in order:
                src,levy=arms[name]
                data=run(['node',worker_dest,src,wt,'tick','control',path,'',difficulty,levy])
                assert data['levyPercent']==levy and len(data['warmMs'])==20
                row[name]=data
                with rawlog.open('a',encoding='utf-8',newline='\n') as raw:
                    print(json.dumps({'difficulty':difficulty,'block':block,'arm':name,'measurement':data}),file=raw)
            assert row['base0']['outcomeSha256']==row['head0']['outcomeSha256']
            assert row['base0']['inputSha256']==row['head0']['inputSha256']==row['base0repeat']['inputSha256']
            assert row['base5']['inputSha256']==row['head5']['inputSha256']
            pairs.append(row)
            print(difficulty,'paired block',block+1,'of 8',flush=True)
        results={n:measure_stats([ms for row in pairs for ms in row[n]['warmMs']]) for n in keys}
        def paired(left,right):
            return [median(p[right]['warmMs'])-median(p[left]['warmMs']) for p in pairs]
        noise=paired('base0','base0repeat')
        def diffs(left,right):
            vals=paired(left,right)
            p95left=lambda p: measure_stats(p[left]['warmMs'])['p95Ms']
            p95right=lambda p: measure_stats(p[right]['warmMs'])['p95Ms']
            return {'medianOfPairedMedianDeltasMs':round(median(vals),6),
                    'medianOfPairedP95DeltasMs':round(median([p95right(p)-p95left(p) for p in pairs]),6),
                    'rawMedianDeltasMs':[round(v,6) for v in vals]}
        observed[difficulty]={'arms':results,'deltas':{'0% head minus base':diffs('base0','head0'),
            '5% head minus base':diffs('base5','head5'),'head 5% minus 0%':diffs('head0','head5')},
            'noiseMedianMs':round(median(noise),6),'noiseMaxAbsPairedMedianDeltaMs':round(max(map(abs,noise)),6),
            'noiseDeltasMs':[round(v,6) for v in noise],
            'fixtureSha256':f['sha256']}
    result={'head':head,'tree':tree,'base':archive_head,'bundle':bundle,'save':save,
            'cpuBefore':probe,'keepAwakePriorState':f'0x{prior:08x}','timings':observed}
    (dir/'measurement-summary.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(json.dumps(observed,indent=2),flush=True)
finally:
    state(0x80000000)
