import datetime as dt
import json
from pathlib import Path
import subprocess
import sys

folder=Path(__file__).resolve().parent
paths=sorted({row['path'] for row in json.loads((folder/'test-edits.json').read_bytes())})
phase=sys.argv[1]
assert phase in ('red','green')
base='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert head==base
if phase=='red':
    assert sorted(subprocess.check_output(['git','diff','--name-only','HEAD'],text=True).splitlines())==paths
    assert not subprocess.check_output(['git','diff','--cached','--name-only'])
args=['node','node_modules/vitest/vitest.mjs','run','--reporter=json',*paths]
utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()
start=utc()
result=subprocess.run(args,capture_output=True)
(folder/f'targeted-{phase}-raw.json').write_bytes(result.stdout)
(folder/f'targeted-{phase}-stderr.txt').write_bytes(result.stderr)
report=json.loads(result.stdout.decode('utf-8'))
rows=[{'file':Path(f['name']).name,'name':a['title'],'status':a['status']}
      for f in report['testResults'] for a in f['assertionResults']]
failures=[row for row in rows if row['status']=='failed']
expected={
 'P2-1': ('rejects a v12 checkpoint with fractional NPC affection',1),
 'P2-2': ('caps the generator trait range at the four available traits',1),
 'P2-3': ('names the parent field for invalid generator row',9),
 'P3-2': ('refuses invalid unsigned seed',5),
}
summary={'phase':phase,'head':head,'command':args,'utcStart':start,'utcEnd':utc(),'exit':result.returncode,
         'total':len(rows),'failures':failures,'findings':{flag:[row for row in rows if row['name'].startswith(prefix)] for flag,(prefix,_) in expected.items()}}
(folder/f'targeted-{phase}-summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8',newline='\n')
assert report['numTotalTestSuites'] >= len(paths) and len(rows)>=75
for flag,(_,amount) in expected.items():
    rr=summary['findings'][flag]
    assert len(rr)==amount and all(x['status']==('failed' if phase=='red' else 'passed') for x in rr),(flag,rr)
assert len([r for r in rows if r['name'].startswith('generates deterministically at unsigned seed endpoint') and r['status']=='passed'])==2
assert result.returncode==(1 if phase=='red' else 0)
assert len(failures)==(sum(n for _,n in expected.values()) if phase=='red' else 0)
print(f'{phase.upper()}: {len(rows)} targeted cases; expected failures {len(failures)}; Vitest exit {result.returncode}.')
for flag,cases in summary['findings'].items():
    print(flag,len(cases),cases[0]['status'])
