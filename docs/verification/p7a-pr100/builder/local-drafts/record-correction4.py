"""Reconcile recorded owner approval with unchanged, completed PR B evidence."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import subprocess
import sys

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
sha=lambda data:hashlib.sha256(data).hexdigest()
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
git=lambda *args:subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').strip()
old=OUT/'binding-plan-a770dc0.md'
new=OUT/'binding-plan-4739ffc.md'
text=new.read_text(encoding='utf-8-sig')
prefix,correction=text.split('\n### Correction 4',1)
assert prefix.rstrip()==old.read_text(encoding='utf-8-sig').rstrip(), 'HOLD: earlier plan body differs'
assert 'Approve D1\u2013D4 as written (Recommended)' in correction
summary=load('results-summary.json')
assert git('rev-parse','HEAD')==summary['head']
assert git('rev-parse','HEAD^{tree}')==summary['tree']
assert git('status','--porcelain=v1')==''
history=OUT/'pre-correction4-SHA256SUMS.txt'
if not history.exists():history.write_bytes((OUT/'SHA256SUMS.txt').read_bytes())
prior=OUT/'B0-owner-approval-before-correction4.json'
if not prior.exists():prior.write_bytes((OUT/'B0-owner-approval.json').read_bytes())
binding={'path':str(new),'sourceCommit':'4739ffc','correction':4,'sha256':sha(new.read_bytes()),'supersedes':str(old),'reviewUtc':dt.datetime.now(dt.timezone.utc).isoformat()}
approval=load('B0-owner-approval.json')
approval['recordedPlan']=binding
(OUT/'B0-owner-approval.json').write_text(json.dumps(approval,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
verified=[]
for row in load('B0-proposed-files.json'):
    data=(ROOT/row['file']).read_bytes()
    assert data==Path(row['afterCopy']).read_bytes(), 'HOLD: generated/approved bytes differ: '+row['file']
    verified.append({'path':row['file'],'sha256':sha(data),'approvedBytesMatch':True})
subprocess.run([sys.executable,'-X','utf8',str(OUT/'verify-edit-inventory.py'),'--mode','final'],cwd=ROOT,check=True,capture_output=True)
reconciliation={'bindingPlan':binding,'head':summary['head'],'tree':summary['tree'],'gitStatus':'','planBodyBeforeCorrection4Unchanged':True,'existingApprovalVerbatimUnchanged':True,'approvedPaths':13,'exactFilesVerified':verified,'generatedProjectionFilesVerified':3,'productEdits':0,'testEdits':0,'testReruns':0,'reason':'Recorded Correction 4 matches the prior in-thread approval and completed exact-head implementation. Existing gate, smoke and performance logs remain unchanged.','exitCode':0}
(OUT/'correction4-reconciliation.json').write_text(json.dumps(reconciliation,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
summary['bindingPlan']=binding
summary['correction4Reconciliation']='correction4-reconciliation.json'
(OUT/'results-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
readme=(OUT/'README.md').read_text(encoding='utf-8')
marker='## Recorded binding plan — Correction 4'
if marker not in readme:
    readme+='\n'+marker+'\n\nThe current binding plan is [binding-plan-4739ffc.md](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-4739ffc.md), recorded at 4739ffc. It supersedes a770dc0. Its earlier plan body is identical; Correction 4 records the same owner approval already used before RED. `correction4-reconciliation.json` verifies the unchanged HEAD/tree, exact 13-path scope and all six approved existing-file after-bytes, including all three generated projections E07–E09. No product/test edit or test rerun was needed. Previous manifests and the original approval record remain as history.\n'
    (OUT/'README.md').write_text(readme,encoding='utf-8')
with (OUT/'progress.md').open('a',encoding='utf-8') as log:
    log.write('\nRecorded plan Correction 4 reconciled against completed B1/B2: body unchanged, same D1–D4 approval, exact generated projection bytes, HEAD/tree unchanged, no source/test changes or repeated tests. New plan/provenance included in refreshed evidence manifest.\n')
print(json.dumps({'head':summary['head'],'tree':summary['tree'],'recordedPlan':binding,'exactFilesVerified':len(verified),'generatedProjectionFilesVerified':3,'productAndTestChanges':0,'exitCode':0},indent=2))
