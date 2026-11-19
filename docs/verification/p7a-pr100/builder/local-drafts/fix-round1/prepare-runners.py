"""Reuse measurement/gate logic, adapting only paths, pins and timing-hook recognition."""
from pathlib import Path
import difflib
import hashlib
import json
import shutil

OUT=Path(__file__).resolve().parent
PARENT=OUT.parent
PROFILE=OUT/'profile'
PROFILE.mkdir(exist_ok=True)
pin=json.loads((OUT/'B2-head.json').read_text(encoding='utf-8'))
provenance=[]
def adapted(source,target,after,reason):
    before=source.read_text(encoding='utf-8')
    target.write_text(after,encoding='utf-8')
    patch=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile=str(source),tofile=str(target)))
    (OUT/(target.name+'.adapter.patch')).write_text(patch,encoding='utf-8')
    provenance.append({'source':str(source),'target':str(target),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'targetSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'reason':reason})

source=PARENT/'perf-profile/profile-harness.mjs'
text=source.read_text(encoding='utf-8')
old="    const clone='  const next = structuredClone(npcs);';"
new="    const clone=code.includes('  const next = structuredClone(npcs);') ? '  const next = structuredClone(npcs);' : '  const next = npcs.map(npc => ({ ...npc, life: structuredClone(npc.life) }));';"
assert text.count(old)==1
adapted(source,PROFILE/'profile-harness.mjs',text.replace(old,new),'Only recognize the new one-line initializer in the existing in-memory timing hook. Workload, seed, timings, CPU sampling, raw retention and summary definitions unchanged. lifeCloneMs now times the targeted copy preparation, not a full NPC clone.')
source=PARENT/'perf-profile/run-profile.py';text=source.read_text(encoding='utf-8')
text=text.replace("HEAD='cf94804876ef2d02835112e06c355314bbcc16cd'","HEAD='"+pin['head']+"'")
text=text.replace("'Profile base vs head (Recommended)'","'Remove the extra clone (Recommended)'")
needle="        assert git('status','--porcelain=v1')==''\n        machine('machine-final.json')"
replacement="        index_tree=git('write-tree')\n        assert index_tree==git('rev-parse','HEAD^{tree}')\n        subprocess.run(['git','add','--',*changed],cwd=ROOT,check=True,capture_output=True)\n        assert git('write-tree')==index_tree\n        assert git('status','--porcelain=v1')==''\n        machine('machine-final.json')"
assert text.count(needle)==1
text=text.replace(needle,replacement)
text=text.replace("status='HOLD',executionComplete=","status='HOLD' if failure else 'MEASURED',executionComplete=")
text=text.replace("{'status':'HOLD','executionComplete':sequence['executionComplete']","{'status':sequence['status'],'executionComplete':sequence['executionComplete']")
adapted(source,PROFILE/'run-profile.py',text,'Pin the approved new head and owner decision; refresh stat-cache entries only after raw-byte/index-tree verification to handle checkout CRLF. No measurement change.')
for name in ['capture-machine.ps1','capture-sleep.ps1']:
    shutil.copyfile(PARENT/'perf-profile'/name,PROFILE/name)
shutil.copyfile(PARENT/'perf-profile/capture-sleep.ps1',OUT/'capture-sleep.ps1')
source=PARENT/'perf-profile/analyze-profile.py';text=source.read_text(encoding='utf-8').replace("'diagnosticStatus':'HOLD'","'diagnosticStatus':'MEASURED; acceptance assessed with fix evidence'")
adapted(source,PROFILE/'analyze-profile.py',text,'Reuse identical statistics/CPU summarization; status label is assessment pending, not an automatic HOLD or PASS.')

source=PARENT/'run-gates.ps1';text=source.read_text(encoding='utf-8')
text=text.replace("$taskEvidence = 'C:/Users/Admin/.t3/local-drafts/p7a-prB'","$taskEvidence = 'C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1'")
start=text.index('function Save-SleepEvents(');end=text.index('\ntry {',start)
text=text[:start]+'''function Save-SleepEvents([datetime]$StartUtc, [datetime]$EndUtc, [string]$Name) {
    & powershell.exe -NoProfile -File "$taskEvidence/capture-sleep.ps1" -StartUtc $StartUtc.ToUniversalTime().ToString('o') -EndUtc $EndUtc.ToUniversalTime().ToString('o') -Destination "$taskEvidence/$Name"
    if ($LASTEXITCODE -ne 0) { throw 'HOLD: UTC sleep/resume query failed.' }
}
'''+text[end:]
adapted(source,OUT/'run-gates.ps1',text,'Route evidence to fix-round1; reuse the corrected explicit UTC XPath sleep audit. Seven gates, CI echo and smoke unchanged.')
source=PARENT/'run-streamed-smoke.py';text=source.read_text(encoding='utf-8').replace('p7a-prB-local-only/full','p7a-prB-local-only/fix-round1/full')
adapted(source,OUT/'run-streamed-smoke.py',text,'Preserve prior Playwright artifacts by using a separate local-only output folder. Same full smoke command and asset proof.')
source=PARENT/'measure-bundle.mjs';text=source.read_text(encoding='utf-8').replace("const out = 'C:/Users/Admin/.t3/local-drafts/p7a-prB';","const out = 'C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1';")
adapted(source,OUT/'measure-bundle.mjs',text,'Separate output folder; identical production gzip measurement and main baseline.')
(OUT/'runner-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
print('Prepared reused runners. Only timing-hook initializer recognition differs in the measurement harness; full workload/sampling is unchanged.')
