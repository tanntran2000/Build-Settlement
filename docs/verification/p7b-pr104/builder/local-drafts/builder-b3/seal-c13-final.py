from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import sys

BASE='b184357d235d164478584e36b96d063551124e66'
HERE=Path(__file__).resolve().parent
ROOT=Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf-8').replace('\r\n','\n')
def read(path):
    return (HERE/path).read_text(encoding='utf-8')
def write(path, text):
    (HERE/path).write_text(text,encoding='utf-8',newline='\n')
def hash_file(path):
    return sha256(path.read_bytes()).hexdigest()
def extract(log, pattern):
    items=re.findall(pattern,log,re.M)
    return items[-1] if items else None
def number(n):
    return f'{n:,}'

head,tree,main=git('rev-parse','HEAD','HEAD^{tree}','origin/main').splitlines()
assert head=='825ca5c27cc3d440705dffb6b41699d1dcbd2e4e' and tree=='b935bbe742992eb4cd792c93fe2881e1e67ea5fb'
assert main==BASE
assert git('status','--porcelain=v1','--untracked-files=all')==''
assert git('diff','--name-only',BASE,'--','docs')==''
assert len(git('rev-list',BASE+'..HEAD').splitlines())==3
ports=subprocess.check_output(['powershell.exe','-NoProfile','-Command',
   "$p=Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue; if ($p) { $p | Out-String; exit 1 }; '4173 and 4174 free'"],
   cwd=ROOT).decode('utf-8').strip()
assert ports=='4173 and 4174 free'
assert hash_file(HERE/'B3.3-HOLD.md')=='e80d8e6c0323a66afd93345df93b10e1f90e44928c74c661857663194ad4905d'
assert hash_file(HERE/'mobile-keyboard-proposal.patch')=='ac8fb2c0ebb6aaeb82b0c0bf785f83f6484b6eec8d14965625448039d4e2acc5'
assert 'verify-head: 86 paths verified' in read('c13-head-verifier.txt')
assert 'CI=1' in read('c13-acquisition-browser.txt') and '5 passed' in read('c13-acquisition-browser.txt')
now=datetime.now(timezone.utc).isoformat(timespec='seconds')
commits=git('log','-3','--format=%H %T %s%n%b')
write('final-worktree.txt',f'UTC {now}\nHEAD {head}\nTree {tree}\norigin/main {main}\n'
      f'git status --porcelain=v1 --untracked-files=all: empty\n{ports}\nCommits\n'+commits)
gates=[
    ('1','Diff check','gate-1-diff.txt'),
    ('2','Lint','gate-2-lint.txt'),
    ('3','Typecheck','gate-3-typecheck.txt'),
    ('4','Architecture','gate-4-architecture.txt'),
    ('5','Architecture tests','gate-5-architecture-tests.txt'),
    ('6','Unit tests','gate-6-unit.txt'),
    ('7','Build','gate-7-build.txt'),
    ('8','Full Chromium smoke','gate-8-smoke.txt'),
]
latest={}
for num, name, file in gates:
    path=HERE/file
    if not path.exists():
        latest[num]=dict(name=name,status='Pending',file=None)
        continue
    log=read(file)
    assert head in log and tree in log
    end=extract(log,r'^Exit (\d+)$')
    assert end is not None,file
    result='Pass' if end=='0' else 'Fail'
    row=dict(name=name,status=result,exit=int(end),file=file)
    if num=='6':
        passed=extract(log,r'^\s*Tests\s+([\d,]+) passed')
        if passed is not None: row['passed']=int(passed.replace(',',''))
    if num=='8':
        assert 'CI=1' in log
        passed=extract(log,r'^\s*([\d,]+) passed\b')
        failed=extract(log,r'^\s*([\d,]+) failed\b')
        if passed is not None: row['passed']=int(passed.replace(',',''))
        if failed is not None: row['failed']=int(failed.replace(',',''))
    latest[num]=row
status = 'HOLD' if len(sys.argv)>1 and sys.argv[1]=='hold' else 'Builder gates complete'
timing_path=HERE/'timings/comparison.json'
bundle_path=HERE/'bundle/bundle-and-served-hashes.json'
timing=json.loads(timing_path.read_text(encoding='utf-8')) if timing_path.exists() else None
bundle=json.loads(bundle_path.read_text(encoding='utf-8')) if bundle_path.exists() else None
if status!='HOLD':
    assert all(item['status']=='Pass' for item in latest.values())
    assert timing and timing['hold'] is False and timing['head']==head and timing['tree']==tree
    assert bundle and bundle['head']==head and bundle['tree']==tree
save_path=HERE/'b3.4-save-roundtrip.txt'
save=json.loads(extract(save_path.read_text(encoding='utf-8'),r'^(\{"npcCount":100,.*\})$')) if save_path.exists() else None
rollup=dict(utc=now,status=status,head=head,tree=tree,base=BASE,clean=True,portsFree=[4173,4174],
            verifierPaths=86,acquisitionBrowser=dict(ci=1,passed=5),gates=latest,bundle=bundle,timing=timing,save=save)
write('b3.4-results.json',json.dumps(rollup,ensure_ascii=False,indent=2)+'\n')
description=f'''# P7-B Builder evidence at {head[:7]}

**{status}**

Branch feat/p7b-acquisition-market. HEAD {head}. Tree {tree}. Base {BASE}. Git status empty. Ports 4173 and 4174 free.

Tân’s verbatim Correction 13 answer is “Duyệt sửa test (Recommended)”. The exact patch normalizes back to SHA-256 73b33d535fd6c31e070d65b3e327097fa4178138e68c03e9b20899cc4ee60c3b. The first application wrote CRLF due to the local Git checkout setting. The recovery verified that CRLF was the sole difference and restored the approved LF bytes before testing. All 86 paths matched the approved packet, Correction 12 item 4, and Correction 13 at the index and HEAD. [Correction 13](../binding-plan-d0e5a0b.md) · [Canonical byte verification](c13-canonical-newlines.txt) · [HEAD verifier](c13-head-verifier.txt)

**Acquisition browser** — all five cases passed with CI=1, including the two corrected mobile cases. [Browser output](c13-acquisition-browser.txt)

| Gate | Status | Evidence |
|---|---|---|
'''
for key,row in latest.items():
    extra=(' · '+number(row['passed'])+' passed') if 'passed' in row else ''
    if row.get('failed'): extra+=' · '+number(row['failed'])+' failed'
    link=f"[Full log]({row['file']})" if row['file'] else 'Pending'
    description+=f"| {key} {row['name']} | {row['status']}{extra} | {link} |\n"
if bundle:
    description+=f"\n**Bundle** — {number(bundle['jsGzipBytes'])} JS bytes and {number(bundle['cssGzipBytes'])} CSS bytes gzip, total {number(bundle['totalGzipBytes'])} vs {number(bundle['baseline']['totalGzipBytes'])} on main. Both preview servers served bytes matching disk. [Per-file measures and raw artifact](bundle/bundle-and-served-hashes.json) · [Served hashes log](before-smoke-served-hashes.txt)\n"
if save:
    description+=f"\n**Save** — {number(save['saveBytes'])} UTF-8 bytes with 100 NPCs, 12 offers and 2 lots. The empty-week control measured {number(save['emptyWeekBytes'])} bytes. JSON and stored-row round trips passed. [Round-trip log](b3.4-save-roundtrip.txt)\n"
if timing:
    description+='\n| Paired measure | Main warm median | B3 warm median | Median paired delta | Max baseline noise |\n|---|---:|---:|---:|---:|\n'
    for key,row in timing['aggregate'].items():
        description+=f"| {key} | {row['mainWarm']['median']:.2f} ms | {row['headWarm']['median']:.2f} ms | {row['medianDeltaMs']:+.2f} ms | {row['maxMainNoiseMs']:.2f} ms |\n"
    description+=f"\nPaired End Week HOLD criterion {str(timing['hold']).lower()}. [All run statistics](timings/comparison.json) · [Per-process raw data](timings/raw-timings.json)\n"
if (HERE/'c13-final-screenshots/acquisition-for-sale-1280.png').exists():
    description+='\n[For sale PNG](c13-final-screenshots/acquisition-for-sale-1280.png) · [Auction PNG](c13-final-screenshots/acquisition-auction-1280.png)\n'
description+='\n[Clean worktree and ports](final-worktree.txt) · [Gate environment before](environment-before-gates.txt) · [Machine-readable results](b3.4-results.json) · [SHA-256 manifest](SHA256SUMS.txt)\n'
write('B3.4-BUILDER.md',description)
historical=read('README.md')
if not historical.startswith('# P7-B Builder evidence at '):
    historical=historical.replace('# P7-B Builder evidence\n',
        f'# P7-B Builder evidence at {head[:7]}\n\n[Correction 13 and B3.4 Builder result](B3.4-BUILDER.md) · [Machine-readable results](b3.4-results.json)\n')
    historical=historical.replace('Start with [B3.3-HOLD.md](B3.3-HOLD.md). The owner-approved candidate remains available in the feature worktree. The last committed stage is B3.2. The proposal for the two mobile cases exists only in this folder.','The prior [B3.3 HOLD](B3.3-HOLD.md) and its original evidence are archived below. Correction 13 approved the two-hunk mobile keyboard test change.')
    historical=historical.replace('The external scripts for [final gates](run-gates.ps1), [served-build verification](served-and-bundle.mjs), and [paired timings](paired-timings.py) are prepared for the exact final head. The held candidate’s metrics use the individual measurement logs listed above.','See the current Builder report for exact-head gates and measurements. Verification is reproducible with the [gate runner](run-gates.ps1), [served-build verifier](served-and-bundle.mjs), and [paired timing runner](paired-timings.py).')
    write('README.md',historical)

def seal(directory):
    paths=sorted(path for path in directory.rglob('*') if path.is_file() and path!=directory/'SHA256SUMS.txt')
    target=directory/'SHA256SUMS.txt'
    target.write_text(''.join(hash_file(path)+'  '+path.relative_to(directory).as_posix()+'\n' for path in paths),
         encoding='utf-8',newline='\n')
    for line in target.read_text(encoding='utf-8').splitlines():
        wanted,name=line.split('  ',1)
        assert hash_file(directory/name)==wanted
    return len(paths)
for folder in sorted((d for d in HERE.rglob('*') if d.is_dir()),key=lambda d:len(d.parts),reverse=True):
    seal(folder)
print(f'{status}. {seal(HERE)} evidence hashes verified. Git clean. {ports}.')
