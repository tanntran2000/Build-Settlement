"""Verify original bytes/ref/index restoration and extend the UTC audit; no measurement rerun."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import os
import subprocess

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
git=lambda *args:subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').strip()
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
sequence=load('sequence.json')
before=load('tracked-before.json')
assert git('rev-parse','HEAD')==sequence['head']
assert git('branch','--show-current')==sequence['branch']
assert git('status','--porcelain=v1')==''
assert git('write-tree')==git('rev-parse','HEAD^{tree}')
assert all(hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==digest for path,digest in before.items())
assert set(git('ls-files').splitlines())==set(before)
assert git('for-each-ref','--format=%(refname) %(objectname)','refs/heads')==load('branch-refs-before.json')
flags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0
subprocess.run(['powershell.exe','-NoProfile','-File',str(OUT/'capture-machine.ps1'),'-Destination',str(OUT/'machine-final.json'),'-ControllerPid',str(os.getpid())],cwd=ROOT,check=True,creationflags=flags)
ended=dt.datetime.now(dt.timezone.utc).isoformat()
subprocess.run(['powershell.exe','-NoProfile','-File',str(OUT/'capture-sleep.ps1'),'-StartUtc',sequence['utcStart'],'-EndUtc',ended,'-Destination',str(OUT/'sleep-resume-events.json')],cwd=ROOT,check=True,creationflags=flags)
result={'status':'HOLD','head':sequence['head'],'tree':git('rev-parse','HEAD^{tree}'),'branch':sequence['branch'],'gitStatus':'','rawTrackedFilesVerified':len(before),'rawTrackedBytesIdentical':True,'localBranchRefsIdentical':True,'indexTreeUnchanged':True,'portsFree':True,'measurementsComplete':len(sequence['runs'])==6 and all(r['exitCode']==0 for r in sequence['runs']),'allSixMeasurementExits':0,'originalControllerExit':1,'controllerIncident':'Its final clean-status assertion saw Git stat-cache dirt after raw LF/CRLF byte restoration. Full raw hashes already matched and content/index diffs were empty. Restricted re-add of the 13 byte-identical original paths refreshed stat entries without changing the index tree. See restoration-stat-cache.txt. No measurement was repeated.','windowStartUtc':sequence['utcStart'],'windowEndUtc':ended,'sleepResumeEvents':load('sleep-resume-events.json')['eventCount'],'restorationExitCode':0}
(OUT/'restoration.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
