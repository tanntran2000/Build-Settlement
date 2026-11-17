"""Verify the approved file set and every existing-test byte in candidate/final mode."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')
parser=argparse.ArgumentParser()
parser.add_argument('--mode',choices=['candidate','final'],required=True)
args=parser.parse_args()
root=Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
out=Path(__file__).resolve().parent
base='753e4503673df86830fba2ef2c9ef1e64a843729'
def git(*args): return subprocess.check_output(['git',*args],cwd=root).decode('utf-8')
status=git('status','--porcelain=v1')
if args.mode=='final':
    assert status=='', 'Final mode requires an empty git status.'
    actual=set(git('diff','--name-only',base,'HEAD').splitlines())
else:
    actual=set(git('diff','--name-only',base).splitlines())|set(git('ls-files','--others','--exclude-standard').splitlines())
correction2=json.loads((out/'A2-HOLD-proposed-edits.json').read_text(encoding='utf-8'))
assert 'Approve E51\u2013E53' in (out/'binding-plan-13cb618.md').read_text(encoding='utf-8')
expected=set((out/'step0-expected-paths.txt').read_text(encoding='utf-8').splitlines())|{row['file'] for row in correction2}
assert actual==expected, {'unexpected':sorted(actual-expected),'missing':sorted(expected-actual)}
rows=json.loads((out/'step0-proposed-edits.json').read_text(encoding='utf-8'))+correction2
tests={row['file'] for row in rows if row['file'].endswith(('.test.ts','.spec.ts'))}
for file in sorted(tests):
    source=git('show',base+':'+file).replace('\r\n','\n')
    lines=source.splitlines()
    for row in sorted((r for r in rows if r['file']==file),key=lambda r:r['line'],reverse=True):
        assert lines[row['line']-1]==row['before'], row
        lines[row['line']-1:row['line']]=row['after'].splitlines()
    wanted='\n'.join(lines)+'\n'
    observed=(root/file).read_text(encoding='utf-8').replace('\r\n','\n')
    assert observed==wanted, f'Unapproved existing-test edit: {file}'
inventory=[]
originals={}
for line in git('ls-tree','-r',base).splitlines():
    meta,file=line.split('\t',1)
    originals[file]=meta.split()[2]
for file in sorted(actual):
    data=(root/file).read_bytes()
    data.decode('utf-8')
    inventory.append({'path':file,'change':'modified' if file in originals else 'added',
      'baseGitBlob':originals.get(file),'finalGitBlob':git('hash-object','--path='+file,file).strip(),
      'workingFileSha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
result={'mode':args.mode,'base':base,'head':git('rev-parse','HEAD').strip(),'tree':git('rev-parse','HEAD^{tree}').strip(),
 'utc':dt.datetime.now(dt.timezone.utc).isoformat(),'pathCount':len(inventory),'existingTestFilesVerifiedExactly':len(tests),
 'approvedTestLineEdits':sum(r['file'] in tests for r in rows),'unexpectedPaths':[],'unapprovedExistingTestEdits':[], 'files':inventory}
(out/('edit-inventory-'+args.mode+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"PASS {args.mode}: {len(inventory)} approved paths; {len(tests)} existing test files match the exact approved transformations; no other existing-test edits.")
print('HEAD='+result['head']+' TREE='+result['tree'])
