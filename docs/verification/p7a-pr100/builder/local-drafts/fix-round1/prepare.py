"""Capture the authorized fix baseline and reuse unchanged evidence runners."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import shutil
import subprocess

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
PARENT=OUT.parent
git=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT,text=True,encoding='utf-8').strip()
assert git('rev-parse','HEAD')=='cf94804876ef2d02835112e06c355314bbcc16cd'
assert git('branch','--show-current')=='feat/p7a-npc-life-week'
assert git('status','--porcelain=v1')==''
assert not (OUT/'baseline.json').exists(),'Do not overwrite the fix baseline'
files={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in git('ls-files').splitlines()}
binding=PARENT/'binding-plan-25b82ac.md'
record={'owner':'Tân','verbatim':'Remove the extra clone (Recommended)','bindingPlan':str(binding),'bindingCommit':'25b82ac','bindingSha256':hashlib.sha256(binding.read_bytes()).hexdigest(),'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'utc':dt.datetime.now(dt.timezone.utc).isoformat(),'files':files,'existingImmutableTest':'npc-life-week.test.ts:111 frozen inputs and detached life.hobbies; overflow and Character Life original-input preservation are also covered','productPath':'packages/simulation/src/npc-life-week.ts','beforeText':'  const next = structuredClone(npcs);\n','afterText':'  const next = npcs.map(npc => ({ ...npc, life: structuredClone(npc.life) }));\n','testEdits':0}
(OUT/'baseline.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(OUT/'npc-life-week-before.ts.txt').write_bytes((ROOT/record['productPath']).read_bytes())
for name in ['run-evidence.py','run-streamed-smoke.py','run-gates.ps1','measure-bundle.mjs']:
    shutil.copyfile(PARENT/name,OUT/name)
for name in ['README.md','results-summary.json','SHA256SUMS.txt']:
    shutil.copyfile(PARENT/name,OUT/('prior-parent-'+name))
print('Captured 498 tracked-file hashes and immutable baseline; copied evidence runners outside the repo.')
