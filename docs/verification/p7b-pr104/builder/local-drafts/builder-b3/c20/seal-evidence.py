from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import sys

here = Path(__file__).resolve().parent
state = sys.argv[1]
reason = sys.argv[2] if len(sys.argv)>2 else None
assert state in {'COMPLETE','HOLD'}
def git(*args):
    return subprocess.check_output(('git',*args)).decode('utf-8').strip()
def log(name):
    path=here/name
    return path.read_text(encoding='utf-8') if path.is_file() else ''
def data(name):
    path=here/name
    return json.loads(path.read_bytes()) if path.is_file() else None
def count(name,pattern):
    found=re.search(pattern,log(name),re.M)
    return int(found.group(1)) if found else None
def exit_code(name):
    return count(name,r'^Exit (\d+)$')
def link(name,label=None):
    return f'[{label or name}]({name})' if (here/name).is_file() else 'Pending'
def title(name):
    return '\n## '+name+'\n\n'

head,tree=git('rev-parse','HEAD'),git('rev-parse','HEAD^{tree}')
base,branch=git('rev-parse','origin/main'),git('branch','--show-current')
status=git('status','--porcelain=v1','--untracked-files=all')
msg=git('show','-s','--format=%B')
ports='Ports 4173 and 4174 free' in log('final-worktree.txt')
files=('gate-1-diff.txt','gate-2-lint.txt','gate-3-typecheck.txt','gate-4-architecture.txt','gate-5-architecture-tests.txt','gate-6-unit.txt','gate-7-build.txt','gate-8-smoke.txt')
names=('Diff check','Lint','Typecheck','Architecture','Architecture tests','Unit','Build','Chromium smoke with CI=1')
tests=(None,None,None,None,
       count(files[4],r'^(?:#|ℹ) pass (\d+)$'),
       count(files[5],r'^\s*Tests\s+(\d+) passed'),
       None,
       count(files[7],r'^\s*(\d+) passed \('))
failures=count(files[7],r'^\s*(\d+) failed\s*$')
bundle=data('bundle/bundle-and-served-hashes.json')
reruns=data('smoke-isolated-reruns/results.json')
byte_inventory=data('correction20-byte-inventory.json')
if state=='COMPLETE':
    assert all(exit_code(name)==0 for name in (*files,'green-seed25.txt','candidate-unit.txt','candidate-typecheck.txt',
        'candidate-verifier.txt','index-verifier.txt','final-head-verifier.txt','final-artifacts.txt','final-worktree.txt'))
    assert exit_code('red-seed25.txt')==1 and 'Generated NPC fixture is invalid.' in log('red-seed25.txt')
    assert not status and ports
    assert tests[-1]==415 and tests[5]==3264 and 'CI=1' in log(files[-1])
    assert bundle['head']==head and bundle['headroomBytes']>0
    assert msg.endswith('Co-authored-by: Codex <noreply@openai.com>')

results={'status':state,'reason':reason,'sealedUTC':datetime.now(timezone.utc).isoformat(timespec='seconds'),
 'head':head,'tree':tree,'base':base,'branch':branch,'gitStatus':status,'portsFree':ports,'commitMessage':msg,
 'byteInventory':byte_inventory,'bundle':bundle,'isolatedReruns':reruns,'gates':[]}
body=['# P7-B PR B3 — Correction 20 Builder evidence\n\n',
 '**'+state+'**'+(' — '+reason if reason else '')+'\n\n',
 f'- HEAD {head}\n- Tree {tree}\n- Main {base}\n- Branch {branch}\n',
 f'- Builder Codex. Sealed {results["sealedUTC"]}. Git status '+('empty' if not status else 'has changes')+'.\n',
 '- Local commit '+msg.splitlines()[0]+'.\n\n',
 'Owner (Tân), verbatim “Duyệt sửa helper (Recommended)”. '
 '[Binding Correction 20](../../binding-plan-71a7839.md) · [Astra round 3](../../astra-review/astra-round3.md)\n',
 title('Seed-25 RED and GREEN'),
 'The real dispatcher built a Guild and bought slot 2 as Ragna Fircrest with name salt 1. On 2dc0a65 the new case '
 'then failed because withNpcs threw Generated NPC fixture is invalid. The fixed fixture matches the dispatcher NPC, '
 'profile and acquisition state for both reconstructed and retained offers. Earlier residents and retained names are '
 'reserved before drawing new Guild slots in ascending order. '
 +link('red-seed25.txt','Baseline RED')+' · '+link('green-seed25.txt','Focused GREEN')+' · '+link('candidate-unit.txt','Full pre-commit units')+'\n',
 title('Byte verification'),
 'The verifier reconstructed the approved packet through 2dc0a65 and verified only the helper modification and the added test at HEAD. '
 'The remainder of the tree matches the reviewed base. No earlier assertion changed. '
 +link('correction20-byte-inventory.json','Every changed byte')+' · '+link('final-head-verifier.txt','Exact-head verifier')+'\n',
 title('Exact-head gates'),
 '| Gate | Result | Evidence |\n| --- | --- | --- |\n']
for number,(name,file,total) in enumerate(zip(names,files,tests),1):
    code=exit_code(file)
    result='Pending' if code is None else 'PASS' if code==0 else 'FAIL, exit '+str(code)
    if total is not None: result+=f', {total} passed'
    if number==8 and failures is not None: result+=f', {failures} failed'
    body.append(f'| {number}. {name} | {result} | {link(file,"Log and exit")} |\n')
    results['gates'].append({'name':name,'log':file,'exit':code,'passed':total,'result':result})
body.append('\n'+link('environment-before-gates.txt','CPU/processes before gates')+' · '+link('environment-before-smoke.txt','Before smoke')+' · '+
            link('environment-after-smoke.txt','After smoke')+' · '+link('before-smoke-served-hashes.txt','Served hashes')+'\n')
if reruns:
    body.append('\n'+link('smoke-isolated-reruns/results.json','Isolated reruns')+' · '+link('hold-diagnosis.md','Smoke and sleep diagnosis')+'\n')
if bundle:
    body.extend([title('Bundle'),f'Production totals {bundle["totalGzipBytes"]:,} gzip bytes. JS {bundle["jsGzipBytes"]:,} bytes. '
        f'CSS {bundle["cssGzipBytes"]:,} bytes. Delta {bundle["deltaGzipBytes"]:,} bytes. Budget headroom '
        f'{bundle["headroomBytes"]:,} bytes. '+link('bundle/per-file-comparison.json','Per-file comparison')+'\n'])
body.extend([title('Evidence integrity'),link('final-worktree.txt','Clean worktree and free ports')+' · '+
             link('risk-register.md','R-026 and replay risks')+' · [SHA-256 manifest](SHA256SUMS.txt)\n'])
(here/'README.md').write_text(''.join(body),encoding='utf-8',newline='\n')
(here/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

def manifest(folder):
    for nested in sorted(p for p in folder.iterdir() if p.is_dir() and p.name!='__pycache__'):
        manifest(nested)
    files=sorted(p for p in folder.rglob('*') if p.is_file() and p!=folder/'SHA256SUMS.txt' and '__pycache__' not in p.parts)
    (folder/'SHA256SUMS.txt').write_text(''.join(
      f'{sha256(p.read_bytes()).hexdigest()}  {p.relative_to(folder).as_posix()}\n' for p in files),encoding='utf-8',newline='\n')
manifest(here)
for line in (here/'SHA256SUMS.txt').read_text(encoding='utf-8').splitlines():
    wanted,name=line.split('  ',1)
    assert sha256((here/name).read_bytes()).hexdigest()==wanted,name
assert 'Duyệt sửa helper (Recommended)' in (here/'README.md').read_text(encoding='utf-8')
print(f'{state} {head} / {tree}. Evidence and nested manifests verified.')
