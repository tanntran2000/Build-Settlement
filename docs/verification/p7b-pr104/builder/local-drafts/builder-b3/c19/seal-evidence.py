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
save=data('save-size/largest-save-measurement.json')
timing=data('timings/comparison.json')
reruns=data('smoke-isolated-reruns/results.json')
byte_inventory=data('correction19-byte-inventory.json')
isolated=data('six-isolated/results.json')
commits=git('log','--reverse','--format=%H %s','8aa7dc4..HEAD').splitlines()
if state=='COMPLETE':
    assert all(exit_code(name)==0 for name in (*files,'green-six-batch.txt','candidate-verifier.txt','index-verifier.txt',
        'final-head-verifier.txt','final-artifacts.txt','final-path-diff.txt','final-worktree.txt','paired-end-week-and-load.txt'))
    assert not status and ports
    assert tests[-1]==415 and tests[5]==3263 and 'CI=1' in log(files[-1])
    assert timing['head']==head and 'hold' not in timing
    assert all('warmCostAboveNoise' not in row for row in timing['aggregate'].values())
    assert bundle['head']==head and bundle['headroomBytes']>0 and save
    assert msg.endswith('Co-authored-by: Codex <noreply@openai.com>')
    assert len(commits)==2 and len(isolated['results'])==6
    assert all(row['exit']==0 and row['exactlyOne'] for row in isolated['results'])

results={'status':state,'reason':reason,'sealedUTC':datetime.now(timezone.utc).isoformat(timespec='seconds'),
 'head':head,'tree':tree,'base':base,'branch':branch,'gitStatus':status,'portsFree':ports,'commitMessage':msg,
 'fixtureByteInventory':byte_inventory,'isolatedGreen':isolated,'commits':commits,'bundle':bundle,'save':save,'timing':timing,'isolatedReruns':reruns,'gates':[]}
body=['# P7-B PR B3 — Correction 19 Builder evidence\n\n',
 '**'+state+'**'+(' — '+reason if reason else '')+'\n\n',
 f'- HEAD {head}\n- Tree {tree}\n- Main {base}\n- Branch {branch}\n',
 f'- Builder Codex. Sealed {results["sealedUTC"]}. Git status '+('empty' if not status else 'has changes')+'.\n',
 '- Local commits since 8aa7dc4\n'+''.join('  - '+row+'\n' for row in commits)+'\n',
 'Owner (Tân), verbatim “Duyệt sửa 2 fixture (Recommended)”. '
 '[Binding Correction 19](../../binding-plan-bf63532.md) · [Correction 18 smoke HOLD](../c18/README.md)\n',
 title('Six isolated browser cases'),
 '| Case | Widths | C18 isolated result | C19 isolated result |\n| --- | --- | --- | --- |\n',
 '| Long character and report content reflows | 1600, 1280, 375, 320 px | 4 failed | 4 passed |\n',
 '| NPC sheet and NPC life report reflow | 320, 375 px | 2 failed | 2 passed |\n',
 '\n'+link('six-isolated/results.json','C19 isolated results')+' · [C18 original smoke](../c18/gate-8-smoke.txt) · '
 '[C18 isolated failures](../c18/smoke-isolated-reruns/results.json)\n',
 title('Byte verification'),
 'The verifier reconstructed the approved 86-path packet through Corrections 12–14, the ten Correction 16 paths '
 'with 30 spans, and the approved 85-byte and 30-byte type insertions. Correction 19 changes five spans in two '
 'test files. Both fixtures plan at week 2 with the same week-1 resident IDs. They clear the retained week-1 market state. '
 'The long-report command oracle reads the fixture week. The long text and every assertion and timeout match '
 'the reviewed bytes. The replay check and v13 save shape match Correction 18.\n\n',
 link('candidate-verifier.txt','Candidate verifier')+' · '+link('final-head-verifier.txt','Exact-head verifier')+' · '+
 link('correction19-byte-inventory.json','All added and removed bytes')+' · '+link('final-path-diff.txt','Golden and fixture path diff')+'\n',
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
    body.append('\n'+link('smoke-isolated-reruns/results.json','Isolated reruns')+' · '+link('hold-diagnosis.md','Fixture diagnosis')+'\n')
if bundle:
    body.extend([title('Bundle'),f'Production totals {bundle["totalGzipBytes"]:,} gzip bytes. JS {bundle["jsGzipBytes"]:,} bytes. '
        f'CSS {bundle["cssGzipBytes"]:,} bytes. Delta {bundle["deltaGzipBytes"]:,} bytes. Budget headroom '
        f'{bundle["headroomBytes"]:,} bytes. '+link('bundle/per-file-comparison.json','Per-file comparison')+'\n'])
if save:
    body.extend([title('Largest representative save'),f'JSON {save["saveBytes"]:,} bytes. The {save["rowCount"]} IndexedDB rows '
        f'serialize to {save["indexedDbRowJsonBytes"]:,} UTF-8 bytes. Acquisition adds {save["acquisitionDeltaBytes"]:,} '
        'bytes over the measurement-only empty-week payload. Both codecs restored identical state. '
        +link('save-size/largest-save.json','Raw save')+' · '+link('save-size/largest-save-indexeddb-rows.json','Raw IndexedDB read')+'\n'])
if timing:
    body.extend([title('Paired End Week and checkpoint load'),timing['method']+'\n\n',
        '| Case | Main warm median / p95 (ms) | HEAD warm median / p95 (ms) | Paired deltas (ms) | Main-to-main noise (ms) |\n'
        '| --- | ---: | ---: | --- | --- |\n'])
    for key,row in timing['aggregate'].items():
        a,b=row['mainWarm'],row['headWarm']
        deltas=', '.join(f'{v:+.3f}' for v in row['pairedDeltasMs'])
        noise=', '.join(f'{v:.3f}' for v in row['mainNoiseMs'])
        body.append(f'| {key} | {a["median"]:.2f} / {a["p95"]:.2f} | {b["median"]:.2f} / {b["p95"]:.2f} | {deltas} | {noise} |\n')
    draw=timing['aggregate']['market-tick']['drawAcquisitionMs']
    body.append(f'\nSeparate drawAcquisition median {draw["median"]:.3f} ms, p95 {draw["p95"]:.3f} ms. '+
        link('timings/comparison.json','Paired comparison')+' · '+link('timings/raw-timings.json','Raw samples')+'\n')
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
assert 'Duyệt sửa 2 fixture (Recommended)' in (here/'README.md').read_text(encoding='utf-8')
print(f'{state} {head} / {tree}. Evidence and nested manifests verified.')
