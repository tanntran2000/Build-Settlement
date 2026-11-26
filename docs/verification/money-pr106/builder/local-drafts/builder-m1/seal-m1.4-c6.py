from pathlib import Path
from hashlib import sha256
import json,re,subprocess,sys
b=Path(__file__).resolve().parent
plan=b.parent/'binding-plan-384cadd.md'
review=b.parent/'astra-review/astra-round1.md'
base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
old='fbad4d834689eb798c13bca27dccf5d16c1f6704'
sha=lambda x:sha256(x).hexdigest()
def git(*args):return subprocess.check_output(['git',*args])
def gt(*args):return git(*args).decode('utf-8').strip()
def read(name):return (b/name).read_text(encoding='utf-8-sig')
def write(name,data):(b/name).write_text(data,encoding='utf-8',newline='\n')
def link(p,label):
 path=b/p
 assert path.is_file(),path
 return f'[{label}]({path.as_posix()})'
assert sha(plan.read_bytes())=='f45a306ce615a5d0996c83bf15ef554bef6b5141a40f8e7a71eee6883c0bb558'
assert sha(review.read_bytes())=='6017dbbcb4b54b0bea749139d160ddb0f478680a032f4b6918e6933f5c8f857a'
head,tree,parent,main=gt('rev-parse','HEAD','HEAD^{tree}','HEAD^','origin/main').splitlines()
assert parent==old and main==base and gt('branch','--show-current')=='feat/money-difficulty'
assert not gt('status','--porcelain=v1','--untracked-files=all')
assert gt('log','-1','--format=%s')=='fix(ui): difficulty-aware storage and health forecasts'
paths=gt('diff','--name-only','fbad4d8..HEAD').splitlines()
assert len(paths)==8 and all(p.startswith('packages/ui/') or '/__tests__/' in p for p in paths)
assert gt('diff','--stat','fbad4d8..HEAD') in read('m1.4-c6-carry-scope.txt')
git('diff','--check','origin/main...HEAD')
added=b'\n'.join(line[1:] for line in git('diff','--no-ext-diff','--unified=0',base,head).splitlines() if line.startswith(b'+') and not line.startswith(b'+++ '))
patterns=rb'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|sk-(?:proj-|svcacct-)[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{20,}'
assert not re.search(patterns,added)
write('m1.4-c6-push-scope.txt',f'HEAD {head}\nTree {tree}\nParent {old}\nBase {base}\nClean worktree and index. Diff check exited 0. Credential signatures scanned had zero matches.\n')
gates=[]
for i,tag in enumerate(('diff','lint','typecheck','architecture','architecture-tests','unit','build','smoke'),1):
 logs=sorted(b.glob(f'm1.4-c6-attempt*-gate-{i}-{tag}.txt'))
 assert logs,tag
 log=read(logs[-1].name)
 assert f'HEAD {head}' in log and f'HEAD tree {tree}' in log and '\nExit 0\n' in log,logs[-1]
 gates.append(logs[-1].name)
assert '3317 passed (3317)' in read(gates[5])
assert re.search(r'(?m)^  419 passed \(',read(gates[-1]))
assert '32 passed (32)' in read('m1.4-c6-green.txt') and '3317 passed (3317)' in read('m1.4-c6-full-unit.txt')
assert 'timed out in 5000ms' in read('m1.2-green-round3-unit.txt') and '3313 passed (3313)' in read('m1.2-green-round3-unit-attempt2.txt')
pre=[]
for idx,sample in ((0,'before-gates'),(7,'before-smoke')):
 attempt=re.search(r'attempt(\d+)',gates[idx])[1]
 idle=f'm1.4-c6-attempt{attempt}-{sample}-idle.txt'
 capture=f'environment-m1.4-c6-attempt{attempt}-{sample}.txt'
 assert 'Ports 4173 and 4174 free' in read(capture)
 lines=read(idle)
 assert 'Selected quiet window' in lines and 'Top process CPU seconds' in lines
 pre.append((idle,[json.loads(line) for line in lines.splitlines() if line.startswith('{')][-1]))
assert 'Ports 4173 and 4174 free' in read(f'environment-m1.4-c6-attempt{attempt}-after-smoke.txt')
session=f'm1.4-c6-session-attempt{attempt}.txt'
assert 'Windows system sleep inhibited' in read(session) and 'Process execution-state request released.' in read(session)
assert '\nExit 0\n' in read(session)
assert 'Stage 8 CI=1.' in read(f'm1.4-c6-attempt{attempt}-execution-environment.txt')
size_log=read('m1.4-c6-bundle.txt')
assert f'HEAD {head}' in size_log and '\nExit 0\n' in size_log
size=next(json.loads(l) for l in size_log.splitlines() if l.startswith('{"gzipLevel"'))
total=size['totalGzipBytes']
assert total<200000
for a in size['assets']:
 path=b/'m1.4-c6-gzip'/(a['file'].replace('/','-')+'.gz')
 assert sha(path.read_bytes())==a['gzipSha256']
timings=json.loads((b/'m1.4-measurements/measurements-summary.json').read_bytes())['timing']
normal=timings['main-normal']['medianDeltaMs']
easy=timings['main-easy']['medianDeltaMs']
noise=timings['main-main']['maxAbsMedianDeltaMs']
tick=chr(96)
code=lambda s:tick+s+tick
rows=['# Money M1.4 Correction 6','',f'Head {code(head)}. Tree {code(tree)}. Parent {code(old)}. Base {code(base)}.',
 '', 'Owner Tân, verbatim “Duyệt sửa cả 4 (Recommended)”. '+link(plan,'Binding plan')+' · '+link(review,'Astra round 1'),
 '', 'The two refusal paths compare the complete error envelope. The five Normal validator cases compare the complete error message.',
 '', 'The two forecasts share the weekly workshop allocator. The Character Life views include the same wage and item-context prelude. The Planning potion gate remains the existing predicate. '
 +link('m1.4-c6-change.patch','Eight-file diff')+' · '+link('m1.4-c6-commit.txt','Commit'),
 '', 'The first RED fixture setup was rejected by validation. After setting paused workers to zero and using a valid Hospital workforce, RED reproduced both Easy disagreements and both Normal equivalents passed. '
 +link('m1.4-c6-red.txt','Initial setup')+' · '+link('m1.4-c6-red-attempt2.txt','Expected RED')+' · '+link('m1.4-c6-green.txt','32 focused passes')+' · '+link('m1.4-c6-full-unit.txt','3,317 unit passes before commit'),
 '', '## Exact-head gates', '', '| Gate | Result | Evidence |','|---:|---|---|']
for i,(name,label) in enumerate(zip(gates,['Diff check','ESLint','TypeScript and Svelte','Architecture scan','154 architecture tests','3,317 unit tests','Build','419 CI smoke tests']),1):
 rows.append(f'| {i} | {label}, exit 0 | {link(name,"Full log")} |')
rows+=['',f"CPU averaged {pre[0][1]['meanCpuPercent']}% before gates and {pre[1][1]['meanCpuPercent']}% before CI smoke. Both ports were free and Windows keep-awake covered the session. "
 +link(pre[0][0],'CPU and processes before gates')+' · '+link(pre[1][0],'CPU and processes before smoke')+' · '+link(session,'Session log'),
 '', *(['The first full smoke hit the existing 60,000 ms deadline in “fulfillment states match strip and report.” Its trace shows passing assertions up to the deadline. The full retry used the same head, assertions and timeout. '
  +link('m1.4-c6-attempt1-gate-8-smoke.txt','First full smoke')
  +' · '+link('m1.4-c6-fulfillment-attempt1-artifacts/error-context.md','Timeout context')] if attempt=='2' else []),
 '', 'The first M1.2 unit run had one unchanged seeded NPC test exceed 5,000 ms. The full retry passed 3,313 cases with the original timeout. '+link('m1.2-green-round3-unit.txt','M1.2 first run')+' · '+link('m1.2-green-round3-unit-attempt2.txt','M1.2 retry'),
 '', '## Measurements','',
 f'- Exact-head production JS and CSS totaled {total:,} gzip bytes, with {200000-total:,} bytes to the 200,000-byte limit. '+link('m1.4-c6-bundle.txt','Bundle remeasurement'),
 f'- 100-NPC median paired End Week Δ carried from e9afed5. Normal {normal:+.3f} ms, Easy {easy:+.3f} ms, main/main maximum absolute paired median Δ {noise:.3f} ms. Only UI and tests changed since fbad4d8. '
 +link('m1.4-c6-carry-scope.txt','Carry scope')+' · '+link('m1.4-measurements/measurements-summary.json','Raw measurement summary'),
 '', '## Branch delivery','']
if 'published' in sys.argv[1:]:
 assert '\nExit 0\n' in read('m1.4-c6-push.txt') and '\nExit 0\n' in read('m1.4-c6-remote-head.txt')
 assert re.search(r'(?m)^'+head+r'\s+refs/heads/feat/money-difficulty$',read('m1.4-c6-remote-head.txt'))
 rows+=['The pushed branch tip matches the tested head. '+link('m1.4-c6-push.txt','Push log')+' · '+link('m1.4-c6-remote-head.txt','Remote head')]
else:
 rows+=['The exact head passed all checks. '+link('m1.4-c6-push-scope.txt','Push scope and credential-pattern scan')]
write('M1.4-C6.md','\n'.join(rows)+'\n')
assert 'Duyệt sửa cả 4 (Recommended)' in read('M1.4-C6.md')
write('README.md','# Money M1 Builder evidence\n\n'+link('M1.4-C6.md','Correction 6 verification and delivery')+' · '+link('SHA256SUMS.txt','SHA-256 manifest')+
 '\n\n'+link('M1.4-C5.md','Correction 5 evidence')+' · '+link('M1.4-HOLD.md','M1.4 HOLD')+' · '+link('round3-HOLD.md','Round 3 HOLD')+'\n')
manifest=b/'SHA256SUMS.txt'
files=sorted(p for p in b.rglob('*') if p.is_file() and p!=manifest)
write(manifest.name,''.join(f'{sha(p.read_bytes())}  {p.relative_to(b).as_posix()}\n' for p in files))
for record in read(manifest.name).splitlines():
 digest,name=record.split('  ',1)
 assert sha((b/name).read_bytes())==digest
print('HEAD',head,'tree',tree,'bundle gzip bytes',total)
print('Verified manifest entries',len(files))
print('Report SHA-256',sha((b/'M1.4-C6.md').read_bytes()))
print('Manifest SHA-256',sha(manifest.read_bytes()))
