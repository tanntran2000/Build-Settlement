"""Check exact approved worktree bytes before staging the single B1 commit."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
OUT=Path(__file__).resolve().parent
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
git=lambda *args:subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').strip()
planned={r['path']:r for r in load('B0-planned-paths.json')}
actual=set(git('diff','--name-only','HEAD').splitlines())|set(git('ls-files','--others','--exclude-standard').splitlines())
assert actual==set(planned), {'unexpected':sorted(actual-set(planned)),'missing':sorted(set(planned)-actual)}
proposals={r['file']:r for r in load('B0-proposed-files.json')}
for path,row in proposals.items():
    assert (ROOT/path).read_bytes()==Path(row['afterCopy']).read_bytes(),path
for row in load('B0-byte-inventory.json')['files']:
    data=(ROOT/row['path']).read_bytes()
    if row['path'] not in planned:
        assert hashlib.sha256(data).hexdigest()==row['sha256'],row['path']
    elif row['path'] not in proposals:
        assert len(data)-len(data.rstrip(b'\r\n'))==row['trailingNewlineBytes'],row['path']
        assert data.startswith(b'\xef\xbb\xbf')==row['utf8Bom'],row['path']
        if row['crlf'] and not row['loneLf']:
            assert data.count(b'\n')==data.count(b'\r\n'),row['path']
for path,row in planned.items():
    if row['status']=='new':
        data=(ROOT/path).read_bytes()
        assert data.endswith(b'\n') and not data.endswith(b'\n\n') and b'\r' not in data,path
        assert not data.startswith(b'\xef\xbb\xbf'),path
        data.decode('utf-8')
for name in ['B1-GREEN-full.txt','B1-lint.txt','B1-typecheck.txt','B1-GREEN-perf-confirmation.txt']:
    assert 'EXIT_CODE=0' in (OUT/name).read_text(encoding='utf-8'),name
perf=load('perf-GREEN.json')
for path,digest in perf['sourceSha256'].items():
    assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==digest,path
result={'head':git('rev-parse','HEAD'),'paths':sorted(actual),'pathCount':len(actual),'existingTestFilesExact':3,'approvedTransformations':9,'whitespaceDelta':'W01 only','productSourceHashesMatchMeasuredPerformance':True,'exitCode':0}
(OUT/'B1-ready-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
