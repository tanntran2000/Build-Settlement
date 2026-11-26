from pathlib import Path
from hashlib import sha256
import json,re,subprocess,sys
b=Path(__file__).resolve().parent
plan=b.parent/'binding-plan-88108cf.md'
review=b.parent/'astra-review/astra-round2.md'
base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
old='3f1467ac278ab1ad8379c7ca58bced6e121d9c4a'
sha=lambda x:sha256(x).hexdigest()
def git(*args):return subprocess.check_output(['git',*args])
def gt(*args):return git(*args).decode('utf-8').strip()
def read(name):return (b/name).read_text(encoding='utf-8-sig')
def write(name,data):(b/name).write_text(data,encoding='utf-8',newline='\n')
def link(p,label):
 path=b/p
 assert path.is_file(),path
 return f'[{label}]({path.as_posix()})'
assert sha(plan.read_bytes())=='7e577952ea687d144ee192458c47d91802ba30060363cb68e4622699d34c36e6'
assert sha(review.read_bytes())=='c9762e5e9ecc1e77c954e03a6281de50e798b88c2040e8ebb213d54b7180737b'
head,tree,parent,main=gt('rev-parse','HEAD','HEAD^{tree}','HEAD^','origin/main').splitlines()
assert parent==old and main==base and gt('branch','--show-current')=='feat/money-difficulty'
assert not gt('status','--porcelain=v1','--untracked-files=all')
assert gt('log','-1','--format=%s')=='fix(ui): storage preview follows end-week staffing'
assert set(gt('diff','--name-only','3f1467a..HEAD').splitlines())=={'packages/ui/src/society-view.ts','packages/ui/src/__tests__/outside-view.test.ts'}
assert gt('diff','--stat','3f1467a..HEAD') in read('m1.4-c7-carry-scope.txt')
git('diff','--check','origin/main...HEAD')
added=b'\n'.join(line[1:] for line in git('diff','--no-ext-diff','--unified=0',base,head).splitlines() if line.startswith(b'+') and not line.startswith(b'+++ '))
patterns=rb'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|sk-(?:proj-|svcacct-)[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{20,}'
assert not re.search(patterns,added)
write('m1.4-c7-push-scope.txt',f'HEAD {head}\nTree {tree}\nParent {old}\nBase {base}\nClean worktree and index. Diff check exited 0. Credential signatures scanned had zero matches.\n')
gates=[]
for i,tag in enumerate(('diff','lint','typecheck','architecture','architecture-tests','unit','build','smoke'),1):
 logs=sorted(b.glob(f'm1.4-c7-attempt*-gate-{i}-{tag}.txt'))
 assert logs,tag
 log=read(logs[-1].name)
 assert f'HEAD {head}' in log and f'HEAD tree {tree}' in log and '\nExit 0\n' in log,logs[-1]
 gates.append(logs[-1].name)
assert '3319 passed (3319)' in read(gates[5])
assert re.search(r'(?m)^  419 passed \(',read(gates[-1]))
assert '23 passed (23)' in read('m1.4-c7-green.txt') and '3319 passed (3319)' in read('m1.4-c7-full-unit.txt')
pre=[]
for idx,sample in ((0,'before-gates'),(7,'before-smoke')):
 attempt=re.search(r'attempt(\d+)',gates[idx])[1]
 idle=f'm1.4-c7-attempt{attempt}-{sample}-idle.txt'
 capture=f'environment-m1.4-c7-attempt{attempt}-{sample}.txt'
 assert 'Ports 4173 and 4174 free' in read(capture)
 lines=read(idle)
 assert 'Selected quiet window' in lines and 'Top process CPU seconds' in lines
 pre.append((idle,[json.loads(line) for line in lines.splitlines() if line.startswith('{')][-1]))
assert 'Ports 4173 and 4174 free' in read(f'environment-m1.4-c7-attempt{attempt}-after-smoke.txt')
session=f'm1.4-c7-session-attempt{attempt}.txt'
assert 'Windows system sleep inhibited' in read(session) and 'Process execution-state request released.' in read(session)
assert '\nExit 0\n' in read(session) and 'Stage 8 CI=1.' in read(f'm1.4-c7-attempt{attempt}-execution-environment.txt')
size_log=read('m1.4-c7-bundle.txt')
assert f'HEAD {head}' in size_log and '\nExit 0\n' in size_log
size=next(json.loads(l) for l in size_log.splitlines() if l.startswith('{"gzipLevel"'))
total=size['totalGzipBytes']
assert total<200000
for a in size['assets']:
 assert sha((b/'m1.4-c7-gzip'/(a['file'].replace('/','-')+'.gz')).read_bytes())==a['gzipSha256']
timings=json.loads((b/'m1.4-measurements/measurements-summary.json').read_bytes())['timing']
normal=timings['main-normal']['medianDeltaMs']
easy=timings['main-easy']['medianDeltaMs']
noise=timings['main-main']['maxAbsMedianDeltaMs']
tick=chr(96)
code=lambda s:tick+s+tick
rows=['# Money M1.4 Correction 7','',f'Head {code(head)}. Tree {code(tree)}. Parent {code(old)}. Base {code(base)}.',
 '', 'Owner Tân, verbatim. Warehouse staffing: “Sửa luôn trong M1”. Normal forecast changes: “Chấp nhận (Recommended)”. '
 +link(plan,'Binding plan')+' · '+link(review,'Astra round 2'),
 '', 'The storage panel runs the actual weekly calculation on a detached city after the existing wage and item-context prelude. It checks funded Warehouses against the staffing at the end of the week. Source stocks and the displayed amount come from the input city. The usual path without a staffed and funded Warehouse keeps base capacity.',
 '', 'Astra’s seed-2026 fixture showed 80 in RED on both difficulties. GREEN shows 40, matching the week that releases the worker, spoils 35,000 milli Wood and leaves 40,000 milli. Both cases compare the input session’s JSON bytes after the calculation. Normal forecast parity is accepted and the simulation source is identical. '
 +link('m1.4-c7-change.patch','Two-file diff')+' · '+link('m1.4-c7-red.txt','Expected RED')+' · '+link('m1.4-c7-green.txt','23 focused passes')+' · '+link('m1.4-c7-full-unit.txt','3,319 unit passes'),
 '', 'The C6 report and its generator now contain the intended curly quotation marks and middle dot. '
 +link('m1.4-c7-utf8-repair.txt','Before and after SHA-256')+' · '+link('m1.4-c7-utf8-audit.txt','UTF-8 audit'),
 '', '## Exact-head verification','', '| Gate | Result | Evidence |','|---:|---|---|']
for i,(name,label) in enumerate(zip(gates,['Diff check','ESLint','TypeScript and Svelte','Architecture scan','154 architecture tests','3,319 unit tests','Build','419 CI smoke tests']),1):
 rows.append(f'| {i} | {label}, exit 0 | {link(name,"Full log")} |')
rows+=['',f"CPU averaged {pre[0][1]['meanCpuPercent']}% before gates and {pre[1][1]['meanCpuPercent']}% before the passing smoke. Ports 4173 and 4174 were free at the recorded boundaries. Windows keep-awake covered the session. "
 +link(pre[0][0],'CPU and processes before gates')+' · '+link(pre[1][0],'CPU and processes before smoke')+' · '+link(session,'Session log')]
if attempt=='2':
 rows+=['','The initial C7 full smoke had a failure at the original timeout. The full same-head retry passed. '+link('m1.4-c7-attempt1-gate-8-smoke.txt','First full smoke')]
rows+=['','## Measurements','',
 f'- Production JS and CSS total {total:,} gzip bytes on this head. Headroom to 200,000 is {200000-total:,} bytes. '+link('m1.4-c7-bundle.txt','Bundle remeasurement'),
 f'- 100-NPC median paired End Week Δ carried from e9afed5. Normal {normal:+.3f} ms, Easy {easy:+.3f} ms, main/main maximum absolute paired median Δ {noise:.3f} ms. '
 +link('m1.4-c7-carry-scope.txt','git diff --stat 3f1467a..HEAD')+' · '+link('m1.4-measurements/measurements-summary.json','Timing measurements'),
 '', '## Branch delivery','']
if 'published' in sys.argv[1:]:
 assert '\nExit 0\n' in read('m1.4-c7-push.txt') and '\nExit 0\n' in read('m1.4-c7-remote-head.txt')
 assert re.search(r'(?m)^'+head+r'\s+refs/heads/feat/money-difficulty$',read('m1.4-c7-remote-head.txt'))
 rows+=['The pushed branch tip matches the tested head. '+link('m1.4-c7-push.txt','Push log')+' · '+link('m1.4-c7-remote-head.txt','Remote head')]
else:
 rows+=['The exact head passed all checks. '+link('m1.4-c7-push-scope.txt','Push scope and credential-pattern scan')]
write('M1.4-C7.md','\n'.join(rows)+'\n')
write('README.md','# Money M1 Builder evidence\n\n'+link('M1.4-C7.md','Correction 7 verification and delivery')+' · '+link('SHA256SUMS.txt','SHA-256 manifest')+
 '\n\n'+link('M1.4-C6.md','Correction 6 evidence')+' · '+link('M1.4-C5.md','Correction 5 evidence')+' · '+link('M1.4-HOLD.md','M1.4 HOLD')+'\n')
subprocess.run([sys.executable,str(b/'audit-m1.4-c7-utf8.py')],check=True)
manifest=b/'SHA256SUMS.txt'
files=sorted(p for p in b.rglob('*') if p.is_file() and p!=manifest)
write(manifest.name,''.join(f'{sha(p.read_bytes())}  {p.relative_to(b).as_posix()}\n' for p in files))
for record in read(manifest.name).splitlines():
 digest,name=record.split('  ',1)
 assert sha((b/name).read_bytes())==digest
print('HEAD',head,'tree',tree,'bundle gzip bytes',total)
print('Verified manifest entries',len(files))
print('Report SHA-256',sha((b/'M1.4-C7.md').read_bytes()))
print('Manifest SHA-256',sha(manifest.read_bytes()))
