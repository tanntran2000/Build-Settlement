from pathlib import Path
from hashlib import sha256
import json, re, subprocess, sys

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scratch=Path(__file__).parent
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction11')
local=out.parent
mode=sys.argv[1]
assert mode in ('ready','pushed','hold')
reviewed='fa66b594391029ddb2cb43d98a90e9a8a4735446'
inputs={
    'binding-plan-db8b946.md':'b82d89dbeaf6875c93ea5bb9bb3ffa887040c3501b1a064e4bddeac21996b893',
    'astra-review/astra-round2.md':'1378ebcd77f1aecc6580c64e3756ad1ae8dfe0eecb678ee65c95514a21348bf7',
}
def git(*args):return subprocess.check_output(['git',*args],cwd=wt)
def sha(payload):return sha256(payload).hexdigest()
def read(name):return (out/name).read_text(encoding='utf-8')
def write(name,content):(out/name).write_text(content,encoding='utf-8',newline='\n')
def result(content):
    codes=re.findall(r'^Exit (\d+)(?: in |$)',content,re.M)
    return int(codes[-1]) if codes else None
for p,h in inputs.items():assert sha((local/p).read_bytes())==h,p
head,tree=git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()
origin=git('rev-parse','origin/main').decode().strip()
if mode!='hold':
    assert not git('status','--porcelain=v1')
    assert git('branch','--show-current').decode().strip()=='feat/money-purse'
    assert git('rev-parse','HEAD^').decode().strip()==reviewed
    assert 'HEAD '+head in read('test-commit.txt')
    assert git('diff','--name-only',reviewed+'..HEAD').decode().splitlines()==['tests/e2e/purse.spec.ts']
    assert 'Compared '+reviewed+'..'+head in read('measurement-carry-scope.txt')
    variant=read('mutation-smoke.txt')
    assert result(variant)==1 and '2 passed' in variant and '1 failed' in variant
    assert '−1 Money · +0.5 Gold' in variant and '−1 Money · 0 Gold' in variant
    assert result(read('mutation-build.txt'))==0
    assert result(read('focused-smoke.txt'))==0 and '3 passed' in read('focused-smoke.txt')
    assert result(read('e2e-tsc.txt'))==0
    for manifest, rels in [
        (local/'correction10/SHA256SUMS.txt', ['bundle.json']),
        (local/'round3-c9/SHA256SUMS.txt', ['measurement-1/measurement-summary.json', 'measurement-1/raw-timings.ndjson']),
    ]:
        checks=dict(line.split('  ',1)[::-1] for line in manifest.read_text(encoding='utf-8').splitlines())
        for rel in rels: assert sha((manifest.parent/rel).read_bytes())==checks[rel],rel
    bundle=json.loads((local/'correction10/bundle.json').read_bytes())
    assert bundle['totalGzipBytes']==178080
    for item in bundle['assets']:
        p=local/'correction10/gzip'/(item['file'].replace('/','-')+'.gz')
        assert len(p.read_bytes())==item['gzipBytes'] and sha(p.read_bytes())==item['gzipSha256']
body=['# Money M2 Correction 11 builder evidence','',
    f'**{mode.upper()}** · feat/money-purse · reviewed base {reviewed}.',
    f'Head {head} · tree {tree} · origin/main {origin}.','',
    'Owner Tân, verbatim — “tiếp tục đi”.','']
for path,digest in inputs.items():body.append(f'[{Path(path).name}](../{path}) SHA-256 {digest}.')
if mode=='hold':
    body.extend(['','## HOLD','',sys.argv[2]])
else:
    body.extend(['','## Restored Easy report case','',
        'The only change appends a third case to the Purse spec. The original 1280 and 1600 px cases remain byte-for-byte at the start of the file. The new case donates 1 Money through the UI on Easy, saves locally and reloads through Continue. It compares the exported purse with the exact saved 1,000-milli accumulator, ends the week and checks the Donation cell text “−1 Money · +0.5 Gold”. The shared report reader verifies the full rendered report and the case pins 1,000 Money milli and 500 Gold milli.',
        '',
        'The scratch mutation truncates only Donation Gold display to whole Gold. Both original cases passed and the restored case failed with “−1 Money · 0 Gold”. The renderer was restored in scratch after the run. The unmodified product passed all three.',
        '',
        '[Exact test bytes](test-bytes.json) · [Mutation bytes](mutation-bytes.json) · [Mutation build](mutation-build.txt) · [Mutation failure](mutation-smoke.txt) · [Focused pass](focused-smoke.txt) · [Browser source typecheck](e2e-tsc.txt).'])
body.extend(['','## Exact-head gates','','| Gate | Log and exit |','| --- | --- |'])
gates={}
for i,name in enumerate(('diff','lint','typecheck','architecture','architecture-tests','unit','build','smoke'),1):
    logs=[]
    for file in sorted(out.glob(f'gate-attempt*-{i}-{name}.txt')):
        log=file.read_text(encoding='utf-8')
        code=result(log)
        if code is None:continue
        assert log.startswith(f'HEAD {head}\nTree {tree}\n'),file.name
        assert 'CI '+('1' if i==8 else 'unset')+'\n' in log
        logs.append((file.name,code))
    if logs:gates[i]=logs[-1]
    body.append(f'| {i} {name} | '+(' · '.join(f'[{p}]({p}) exit {code}' for p,code in logs) or 'Pending')+' |')
if mode!='hold':
    assert len(gates)==8 and all(code==0 for _,code in gates.values())
    unit=read(gates[6][0])
    browser=read(gates[8][0])
    assert re.search(r'Tests\s+3383 passed \(3383\)',unit)
    assert re.search(r'^\s+422 passed\b',browser,re.M)
    body.extend(['','3,383 unit tests and 422 CI smoke cases passed.'])
first_smoke=out/'gate-attempt1-8-smoke.txt'
if first_smoke.exists() and result(first_smoke.read_text(encoding='utf-8')) not in (None,0):
    body.extend(['','The first full smoke hit the existing 60-second limit in the fulfillment report case. The same case passed in 44.2 seconds at the reviewed parent. The retry uses the same commit and suite with a fresh quiet-machine sample.'])
env=sorted(out.glob('gate-*-environment.json'))
body.extend(['','CPU samples, processes, ports and keep-awake. '+' · '.join(f'[{p.stem}]({p.name})' for p in env)+'.'])
if mode!='hold':
    body.extend(['','## Measurement carry-forward','',
        'The diff from fa66b59 is confined to tests/e2e/purse.spec.ts. Correction 11 permits carrying the 178,080 gzip-byte bundle (170,187 JS + 7,893 CSS) from fa66b59 and the paired 0% and 5% End Week timings from 546c48b, via Correction 10.',
        '',
        '[Diffstat](measurement-carry-scope.txt) · [Bundle](../correction10/bundle.json) · [Timing summary](../round3-c9/measurement-1/measurement-summary.json) · [Raw timing data](../round3-c9/measurement-1/raw-timings.ndjson).'])
if mode=='ready':
    diff=git('diff','--no-ext-diff','--unified=0',reviewed+'..HEAD')
    added=b'\n'.join(x[1:] for x in diff.splitlines() if x.startswith(b'+') and not x.startswith(b'+++'))
    patterns=(rb'\b(?:ghp_|gho_|ghu_|ghs_|github_pat_)[A-Za-z0-9_]{24,}',rb'-----BEGIN (?:OPENSSH |RSA |EC |)PRIVATE KEY-----',rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',rb'\bsk-(?:proj-)?[A-Za-z0-9_-]{25,}\b')
    n=sum(len(re.findall(p,added)) for p in patterns)
    write('push-scope-scan.txt',f'HEAD {head}\nAdded lines scanned {len(added.splitlines())}\nCredential pattern matches {n}\nExit {int(n!=0)}\n')
    assert n==0
if mode=='pushed':
    assert result(read('push.txt'))==result(read('remote-head.txt'))==0
    assert re.search('^'+head+r'\s+refs/heads/feat/money-purse$',read('remote-head.txt'),re.M)
    body.extend(['','Remote branch verified at the tested head. [Push](push.txt) · [Remote ref](remote-head.txt).'])
body.extend(['','Existing assigned worktree and scratch copy retained. Storage reclaimed 0 bytes.','','[SHA-256 manifest](SHA256SUMS.txt).',''])
doc='\n'.join(body)
assert 'tiếp tục đi' in doc and '—' in doc and '\ufffd' not in doc
write('README.md',doc)
for script in ('append-c11.txt','apply-c11.py','c11-mutation.py','run-c11.py','commit-c11.py','gates-c11.py','seal-c11.py'):
    (out/script).write_bytes((scratch/script).read_bytes())
entries=sorted(p for p in out.rglob('*') if p.is_file() and p.name!='SHA256SUMS.txt')
write('SHA256SUMS.txt',''.join(sha(p.read_bytes())+'  '+p.relative_to(out).as_posix()+'\n' for p in entries))
for line in read('SHA256SUMS.txt').splitlines():
    h,p=line.split('  ',1)
    assert sha((out/p).read_bytes())==h,p
print(mode,head,len(entries),'sealed files')
