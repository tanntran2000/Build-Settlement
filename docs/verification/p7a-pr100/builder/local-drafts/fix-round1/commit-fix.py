"""Commit only the owner-authorized one-line copy refactor after before/after checks."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import subprocess

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
git=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT,text=True,encoding='utf-8').strip()
baseline=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'))
assert git('rev-parse','HEAD')==baseline['head']
target=baseline['productPath']
before=(OUT/'npc-life-week-before.ts.txt').read_bytes()
expected=before.replace(baseline['beforeText'].encode(),baseline['afterText'].encode(),1)
assert before.count(baseline['beforeText'].encode())==1
assert (ROOT/target).read_bytes()==expected
actual={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in git('ls-files').splitlines()}
assert [p for p in actual if actual[p]!=baseline['files'][p]]==[target]
assert git('ls-files','--others','--exclude-standard')==''
assert git('diff','--name-only')==target
for name in ['test-before.txt','test-after.txt','typecheck-simulation.txt']:
    assert 'EXIT_CODE=0' in (OUT/name).read_text(encoding='utf-8'),name
diff=subprocess.check_output(['git','diff','--',target],cwd=ROOT)
(OUT/'diff.patch').write_bytes(diff)
(OUT/'npc-life-week-after.ts.txt').write_bytes(expected)
subprocess.run(['git','add','--',target],cwd=ROOT,check=True)
subprocess.run(['git','diff','--cached','--check'],cwd=ROOT,check=True)
subprocess.run(['git','commit','-m','perf(simulation): drop redundant npc clone in weekly life step','-m','Co-authored-by: Codex <noreply@openai.com>'],cwd=ROOT,check=True)
assert git('rev-parse','HEAD^')==baseline['head']
assert git('status','--porcelain=v1')==''
assert git('diff','--name-only',baseline['head']+'...HEAD')==target
pin={'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'base':'dac604054d7cbbf14a0a42209a3ff560380f2956','previousHead':baseline['head'],'branch':git('branch','--show-current'),'utc':dt.datetime.now(dt.timezone.utc).isoformat()}
(OUT/'B2-head.json').write_text(json.dumps(pin,indent=2)+'\n',encoding='utf-8')
(OUT/'commit.txt').write_text(git('show','-s','--format=fuller','HEAD')+'\n',encoding='utf-8')
(OUT/'edit-verification.json').write_text(json.dumps({'head':pin['head'],'tree':pin['tree'],'parent':baseline['head'],'changedProductPaths':[target],'changedLines':1,'allOther497TrackedRawFilesUnchanged':True,'testEdits':0,'goldenOrFixtureEdits':0,'timeoutThresholdConfigEdits':0,'gitStatus':'','exitCode':0},indent=2)+'\n',encoding='utf-8')
print(json.dumps(pin,indent=2))
