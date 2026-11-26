from datetime import datetime,timezone
from hashlib import sha256
from pathlib import Path
import json,re,subprocess,sys
b=Path(__file__).resolve().parent
base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
m11='63d2b2627b57d172be8459c64989e42ff650f692'
m12='06e6b1da57a41cea4918b66b14c76056e36f615d'
previous='e9afed5d8f37c36611706fb3cc8dd763707ca119'
plan=b.parent/'binding-plan-b839c02.md'
plan_sha='2a955c7fbb6166cf3ad607afc2057d81195edcf6a376c2ffbaa0cf5cc2d06835'
old_hold_sha='28f1a0acfe00247f905ed6bb76f7fa806724aa1abbcdc30e267518340d05da4a'
owner='Duyệt cả 2 (Recommended)'
branch='feat/money-difficulty'
paths=['tests/e2e/character-life-navigation.spec.ts','tests/e2e/tile-feedback-precision.spec.ts']
def git(*args): return subprocess.check_output(['git',*args])
def gt(*args): return git(*args).decode('utf-8').strip()
def sha(data):return sha256(data).hexdigest()
def read(name):return (b/name).read_text(encoding='utf-8-sig')
def write(name,content):(b/name).write_text(content,encoding='utf-8',newline='\n')
def link(name,label=None):
 p=b/name
 assert p.is_file(),p
 return f'[{label or p.name}]({p.as_posix()})'
def stamp():return datetime.now(timezone.utc).isoformat()
head,tree=gt('rev-parse','HEAD','HEAD^{tree}').splitlines()
assert gt('branch','--show-current')==branch
assert gt('rev-parse','origin/main')==base
assert not gt('status','--porcelain=v1','--untracked-files=all')
assert gt('rev-list','--reverse',base+'..HEAD').splitlines()==[m11,m12,previous,head]
assert gt('diff','--name-only',previous+'..HEAD').splitlines()==paths
assert sha(plan.read_bytes())==plan_sha
assert sha((b/'M1.4-HOLD.md').read_bytes())==old_hold_sha
carry=read('m1.4-c5-carry-scope.txt')
assert gt('diff','--stat','e9afed5..HEAD') in carry
assert 'All changed paths are inside tests/e2e/.' in carry
metrics=json.loads((b/'m1.4-measurements/measurements-summary.json').read_bytes())
assert metrics['head']==previous and metrics['base']==base
assert len(metrics['bundleGzipBytes'])==3 and all(x['main']==173845 and x['head']==174917 for x in metrics['bundleGzipBytes'])
scope=git('diff','--name-only','-z',base,head).split(b'\0')
additions=[l[1:] for l in git('diff','--no-ext-diff','--unified=0',base,head).splitlines() if l.startswith(b'+') and not l.startswith(b'+++ ')]
signature=re.compile(rb'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----'
 rb'|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}'
 rb'|sk-(?:proj-|svcacct-)[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{20,}')
assert not signature.search(b'\n'.join(additions)), 'A credential-shaped addition needs review.'
git('diff','--check','origin/main...HEAD')
focuslog=re.search(r'^Focused verification (.+)$',read('m1.4-c5-commit.txt'),re.M)[1]
focused=re.search(r'(?m)^  (\d+) passed \(',read(focuslog))[1]
assert '\nExit 0\n' in read(focuslog)
assert 'timed out in 5000ms' in read('m1.2-green-round3-unit.txt')
assert '3313 passed (3313)' in read('m1.2-green-round3-unit-attempt2.txt')
gate_defs=[
 ('diff','Diff check'),('lint','ESLint'),('typecheck','TypeScript and Svelte'),('architecture','Architecture scan'),
 ('architecture-tests','154 architecture tests'),('unit','3,313 unit tests'),('build','Production build'),('smoke','Full CI smoke, 419 tests'),
]
verified=[]
for i,(tag,label) in enumerate(gate_defs,1):
 candidates=sorted(b.glob(f'm1.4-c5-attempt*-gate-{i}-{tag}.txt'))
 assert candidates,tag
 src=candidates[-1]
 log=read(src.name)
 assert f'HEAD {head}' in log and f'HEAD tree {tree}' in log and '\nExit 0\n' in log,src
 verified.append((src.name,label))
assert 'Running 419 tests using 1 worker' in read(verified[-1][0])
assert re.search(r'(?m)^  419 passed \(',read(verified[-1][0]))
assert '3313 passed (3313)' in read(verified[5][0])
for tag,label in [('before-gates','Diff check'),('before-smoke','Full CI smoke, 419 tests')]:
 verified_name=next(n for n,d in verified if d==label)
 attempt=re.search(r'attempt(\d+)',verified_name)[1]
 idle=f'm1.4-c5-attempt{attempt}-{tag}-idle.txt'
 capture=f'environment-m1.4-c5-attempt{attempt}-{tag}.txt'
 assert ('Ports 4173 and 4174 free' in read(capture)) and head in read(capture)
 records=[json.loads(line) for line in read(idle).splitlines() if line.startswith('{')]
 assert records and 'Selected quiet window' in read(idle)
 assert records[-1]['meanCpuPercent']<=18 and max(records[-1]['twoSecondCpuPercent'])<=25
 if tag=='before-gates': idle_gates=(idle,capture,records[-1])
 else: idle_smoke=(idle,capture,records[-1],attempt)
post=f'environment-m1.4-c5-attempt{idle_smoke[3]}-after-smoke.txt'
assert 'Ports 4173 and 4174 free' in read(post) and head in read(post)
session=f'm1.4-c5-session-attempt{idle_smoke[3]}.txt'
state=f'm1.4-c5-attempt{idle_smoke[3]}-execution-environment.txt'
assert 'Stages 1-7 CI unset. Stage 8 CI=1.' in read(state)
assert 'Windows system sleep inhibited for this process while the child runs.' in read(session)
assert 'Process execution-state request released.' in read(session) and '\nExit 0\n' in read(session)
write('m1.4-c5-push-scope.txt',f'HEAD {head}\nTree {tree}\nBase {base}\n'
      +f'{len(scope)-1} changed paths across four approved commits. {len(additions)} added lines. '
      +'No match for the credential signatures scanned.\n'
      +'Diff check exited 0. Worktree and index are clean.\n')
tick=chr(96)
def code(x): return tick+x+tick
s2=metrics['timing']
def cp(which):return ' / '.join(f'{x:g}%' for x in which[2]['twoSecondCpuPercent'])
rows=[
 '# Money M1.4 Correction 5',
 '',
 f'Head {code(head)}. Tree {code(tree)}. Base {code(base)}.',
 '',
 f'Owner (Tân), verbatim “{owner}”. Correction 5 plan SHA-256 {code(plan_sha)}. '
 + link(plan,'Binding plan')+' · '+link('m1.4-c5-byte-verification.txt','Before/after hashes'),
 '',
 f'The two complete Playwright specs passed {focused} tests before the two-file commit. '
 + link(focuslog,'Focused run')+' · '+link('m1.4-c5-commit.txt','Commit'),
 '',
 '## Exact-head verification',
 '',
 '| Gate | Result | Exit | Evidence |','|---:|---|---:|---|',
]
rows.extend(f'| {i} | {label} | 0 | {link(name,"Full log")} |' for i,(name,label) in enumerate(verified,1))
rows += ['',f'Windows was kept awake. Six-second CPU measurements before gates were {cp(idle_gates)}. '
 'Before smoke they were '+cp(idle_smoke)+'. Ports 4173 and 4174 were free before the tests and after smoke. '
 +link(idle_gates[0],'Gate CPU intervals')+' · '+link(idle_gates[1],'Gate process sample')+' · '+
 link(idle_smoke[0],'Smoke CPU intervals')+' · '+link(idle_smoke[1],'Smoke process sample')+' · '+link(post,'Post-smoke host'), '',
 'The first M1.2 full unit run had one unchanged seeded NPC test exceed 5,000 ms. The full retry '
 'passed 3,313 tests at the original timeout with three Vitest workers. Correction 5 used the same three-worker setting for unit verification. '
 +link('m1.2-green-round3-unit.txt','Initial M1.2 unit run')+' · '+link('m1.2-green-round3-unit-attempt2.txt','Full M1.2 retry'),
 '', '## Carried measurements', '',
 f'Correction 5 carries these measurements from {code(previous)}. The recorded diff contains only the two approved tests under '
 +code('tests/e2e/')+'. '+link('m1.4-c5-carry-scope.txt','git diff --stat e9afed5..HEAD'),
 '',
 '- Bundle on three pairs. Main 173,845 gzip bytes and M1 174,917 gzip bytes. Headroom 25,083 bytes.',
 '- New saves. Main 17,422 bytes. Normal 17,525 empty and 17,578 populated. Easy 17,523 empty and 17,576 populated.',
 (f"- 100-NPC median paired median / p95 change. Normal {s2['main-normal']['medianDeltaMs']:+.3f} / "
 f"{s2['main-normal']['medianP95DeltaMs']:+.3f} ms. Easy {s2['main-easy']['medianDeltaMs']:+.3f} / "
 f"{s2['main-easy']['medianP95DeltaMs']:+.3f} ms. Main/main maximum absolute changes "
 f"{s2['main-main']['maxAbsMedianDeltaMs']:.3f} / {s2['main-main']['maxAbsP95DeltaMs']:.3f} ms."),
 '',link('m1.4-measurements/measurements-summary.json','Full measurements')+' · '+
 link('m1.4-measurements/raw-timings.json','Raw timing pairs'),
 '',
 '## Branch delivery','',
]
if 'published' in sys.argv[1:]:
 assert '\nExit 0\n' in read('m1.4-c5-push.txt') and '\nExit 0\n' in read('m1.4-c5-remote-head.txt')
 assert re.search(r'(?m)^'+head+r'\s+refs/heads/feat/money-difficulty$',read('m1.4-c5-remote-head.txt'))
 rows+=['Pushed '+code(branch)+'. The remote tip matches the tested head. '+
        link('m1.4-c5-push.txt','Git push')+' · '+link('m1.4-c5-remote-head.txt','Remote Git verification')]
else:
 rows+=['The exact head passed all eight checks. '+link('m1.4-c5-push-scope.txt','Push scope and secret-pattern scan')]
report='\n'.join(rows)+'\n'
assert owner in report and 'Tân' in report
write('M1.4-C5.md',report)
write('README.md','# Money M1 Builder evidence\n\n'+link('M1.4-C5.md','Correction 5 verification and delivery')+' · '+
      link('SHA256SUMS.txt','SHA-256 manifest')+'\n\nHistorical packets remain available. '+
      link('M1.4-HOLD.md','M1.4 HOLD')+' · '+link('round3-HOLD.md','Round 3 retune HOLD')+' · '+
      link('calibration-round3-summary.md','Round 3 scorecard')+' · '+link('M1.1-HOLD.md','M1.1 HOLD')+'\n')
manifest=b/'SHA256SUMS.txt'
files=sorted(f for f in b.rglob('*') if f.is_file() and f!=manifest)
write(manifest.name,''.join(f'{sha(f.read_bytes())}  {f.relative_to(b).as_posix()}\n' for f in files))
for line in read(manifest.name).splitlines():
 digest,name=line.split('  ',1)
 assert sha((b/name).read_bytes())==digest,name
print('HEAD',head,'tree',tree)
print('Verified',len(files),'manifest entries')
print('Report SHA-256',sha((b/'M1.4-C5.md').read_bytes()))
print('Manifest SHA-256',sha(manifest.read_bytes()))
