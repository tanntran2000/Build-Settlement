"""Six authorized alternating diagnostic processes; always restore original worktree bytes."""
from pathlib import Path
import base64
import datetime as dt
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
BASE='dac604054d7cbbf14a0a42209a3ff560380f2956'
HEAD='b94d3083dd71722f329b1bf444fa9dec9b0fd309'
BRANCH='feat/p7a-npc-life-week'
FLAGS=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0
utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').strip()
def save(name,data):(OUT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def ps(script,*args):
    result=subprocess.run(['powershell.exe','-NoProfile','-File',str(OUT/script),*map(str,args)],cwd=ROOT,capture_output=True,creationflags=FLAGS)
    if result.returncode:raise RuntimeError((result.stdout+result.stderr).decode('utf-8',errors='replace'))
def machine(name):ps('capture-machine.ps1','-Destination',OUT/name,'-ControllerPid',os.getpid())
def files():return {p:sha((ROOT/p).read_bytes()) for p in git('ls-files').splitlines()}
def checkout(label,*args):
    started=utc();result=subprocess.run(['git',*args],cwd=ROOT,capture_output=True)
    (OUT/f'{label}.txt').write_text(f'UTC={started}\nCOMMAND={json.dumps(["git",*args])}\n'+(result.stdout+result.stderr).decode('utf-8',errors='replace')+f'\nEXIT_CODE={result.returncode}\n',encoding='utf-8')
    if result.returncode:raise RuntimeError(f'HOLD: checkout failed at {label}')

assert not (OUT/'sequence.json').exists(),'HOLD: this six-run sequence already started; never overwrite'
assert git('branch','--show-current')==BRANCH and git('rev-parse','HEAD')==HEAD
assert git('status','--porcelain=v1')==''
assert git('rev-parse',f'{BASE}:package-lock.json')==git('rev-parse',f'{HEAD}:package-lock.json')
node=shutil.which('node');assert node
window_start=utc()
machine('machine-start.json')
ps('capture-sleep.ps1','-StartUtc',window_start,'-EndUtc',utc(),'-Destination',OUT/'sleep-start.json')
before=files();save('tracked-before.json',before)
changed=git('diff','--name-only',f'{BASE}...{HEAD}').splitlines();assert len(changed)==13
raw={p:base64.b64encode((ROOT/p).read_bytes()).decode('ascii') for p in changed}
save('restore-bytes.json',raw)
refs=git('for-each-ref','--format=%(refname) %(objectname)','refs/heads')
save('branch-refs-before.json',refs)
sequence={'owner':'Tân','verbatim':'Remove the extra clone (Recommended)','base':BASE,'head':HEAD,'branch':BRANCH,'utcStart':window_start,'nodeExecutable':node,'harnessSha256':sha((OUT/'profile-harness.mjs').read_bytes()),'sequence':['base','head','base','head','base','head'],'runs':[],'status':'RUNNING','lockfileSame':True,'dependencyInstall':False,'noWarmupDiscarded':True}
save('sequence.json',sequence)
failure=None
try:
    for number,revision in enumerate(sequence['sequence'],1):
        name=f'{number:02}-{revision}';expected=BASE if revision=='base' else HEAD
        if revision=='base':checkout('checkout-'+name,'switch','--detach',BASE)
        else:checkout('checkout-'+name,'switch',BRANCH)
        assert git('rev-parse','HEAD')==expected and git('status','--porcelain=v1')==''
        assert git('rev-parse','refs/heads/'+BRANCH)==HEAD
        machine('machine-'+name+'.json')
        command=[node,str(OUT/'profile-harness.mjs'),name,revision,expected]
        started=utc();clock=time.monotonic()
        result=subprocess.run(command,cwd=ROOT,capture_output=True,creationflags=FLAGS)
        ended=utc();seconds=time.monotonic()-clock
        (OUT/(name+'.txt')).write_text(f'HEAD={expected}\nTREE={git("rev-parse","HEAD^{tree}")}\nUTC_START={started}\nCOMMAND={json.dumps(command)}\nOUTPUT:\n'+(result.stdout+result.stderr).decode('utf-8',errors='replace')+f'\nEXIT_CODE={result.returncode}\nSECONDS={seconds:.3f}\nUTC_END={ended}\n',encoding='utf-8')
        record={'run':name,'revision':revision,'head':expected,'exitCode':result.returncode,'seconds':seconds,'utcStart':started,'utcEnd':ended}
        sequence['runs'].append(record);save('sequence.json',sequence)
        print(json.dumps(record),flush=True)
        if result.returncode:raise RuntimeError('HOLD: measurement execution failed at '+name)
        sample=json.loads((OUT/(name+'.json')).read_text(encoding='utf-8'))
        print(json.dumps({'run':name,'endWeek':sample['endWeek'],'life':sample['life'],'overBudgetTicks':sample['overBudgetTicks']}),flush=True)
except Exception as error:failure=str(error)
finally:
    try:
        if git('branch','--show-current')!=BRANCH:checkout('restore-feature-branch','switch',BRANCH)
        assert git('rev-parse','HEAD')==HEAD and git('rev-parse','refs/heads/'+BRANCH)==HEAD
        # Git checkout can normalize CRLF. Restore only the 13 originally captured
        # paths to exactly their starting bytes, without creating an authored diff.
        for path,encoded in raw.items():
            target=(ROOT/path).resolve();assert target.is_relative_to(ROOT.resolve())
            target.write_bytes(base64.b64decode(encoded,validate=True))
        after=files();save('tracked-after.json',after)
        assert before==after,'HOLD: raw tracked bytes changed'
        assert refs==git('for-each-ref','--format=%(refname) %(objectname)','refs/heads'),'HOLD: local branch ref moved'
        index_tree=git('write-tree')
        assert index_tree==git('rev-parse','HEAD^{tree}')
        subprocess.run(['git','add','--',*changed],cwd=ROOT,check=True,capture_output=True)
        assert git('write-tree')==index_tree
        assert git('status','--porcelain=v1')==''
        machine('machine-final.json')
        save('restoration.json',{'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'branch':git('branch','--show-current'),'gitStatus':'','trackedFilesVerified':len(before),'rawTrackedBytesIdentical':True,'localBranchRefsIdentical':True,'portsFree':True,'utc':utc(),'exitCode':0})
    except Exception as error:failure=(failure+'; ' if failure else '')+'RESTORATION: '+str(error)
    ended=utc()
    try:ps('capture-sleep.ps1','-StartUtc',window_start,'-EndUtc',ended,'-Destination',OUT/'sleep-resume-events.json')
    except Exception as error:failure=(failure+'; ' if failure else '')+'SLEEP AUDIT: '+str(error)
    sequence.update(utcEnd=ended,status='HOLD' if failure else 'MEASURED',executionComplete=failure is None and len(sequence['runs'])==6,failure=failure)
    save('sequence.json',sequence)
    print(json.dumps({'status':sequence['status'],'executionComplete':sequence['executionComplete'],'failure':failure,'utcEnd':ended}),flush=True)
sys.exit(1 if failure else 0)
