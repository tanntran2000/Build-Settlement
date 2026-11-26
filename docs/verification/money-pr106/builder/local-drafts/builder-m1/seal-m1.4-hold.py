from datetime import datetime,timezone
from hashlib import sha256
from pathlib import Path
import base64,json,re,subprocess,sys
b=Path(__file__).resolve().parent
repo=Path.cwd()
plan=b.parent/'binding-plan-da79182.md'
measure=b/(sys.argv[1] if len(sys.argv)>1 else 'm1.4-measurements')
base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
head='e9afed5d8f37c36611706fb3cc8dd763707ca119'
tree='29f27649e984eda84b76909b2f53ae6a3ab9e120'
s2='06e6b1da57a41cea4918b66b14c76056e36f615d'
binding='eeefa6934e37e490ebbcb49288f8d00e4f0f11aa20d72ef009e9f2186e7f0e79'
sha=lambda data:sha256(data).hexdigest()
stamp=lambda:datetime.now(timezone.utc).isoformat()
def link(path,label=None,line=None):
 p=b/path if isinstance(path,str) else path
 assert p.exists(),p
 target=p.as_posix()+(f':{line}' if line else '')
 return f'[{label or p.name}]({target})'
def git(*args):return subprocess.check_output(['git',*args],text=True,encoding='utf-8').strip()
def read(name):return (b/name).read_text(encoding='utf-8')
def write(name,data):(b/name).write_text(data,encoding='utf-8',newline='\n')
def readjson(p):return json.loads(p.read_bytes())
assert sha(plan.read_bytes())==binding
assert sha((b/'round3-HOLD.md').read_bytes())=='1c5fc0bf18849e9a273c0b295e292a92088f20f510ded86a02c450c43af027c8'
assert git('rev-parse','HEAD','HEAD^{tree}').splitlines()==[head,tree]
assert git('branch','--show-current')=='feat/money-difficulty'
assert git('rev-parse','origin/main')==base
assert not git('status','--porcelain=v1','--untracked-files=all')
assert not git('diff','--cached','--name-only')
git('diff','--check','origin/main...HEAD')
assert git('rev-parse','HEAD^')==s2
assert git('rev-parse','HEAD^^')=='63d2b2627b57d172be8459c64989e42ff650f692'
tick=chr(96)
code=lambda x:tick+x+tick
items=(
 ('1','diff','Git diff check'),('2','lint','ESLint'),('3','typecheck','TypeScript and Svelte'),
 ('4','architecture','Architecture scan'),('5','architecture-tests','154 architecture tests'),
 ('6','unit','3,313 unit tests'),('7','build','Production build'),('8','smoke','Full CI smoke, 417 passed and 2 failed'),
)
table=[]
for i,path,label in items:
 logfile=f'm1.4-attempt1-gate-{i}-{path}.txt'
 log=read(logfile)
 required=1 if i=='8' else 0
 assert f'HEAD {head}' in log and f'HEAD tree {tree}' in log and f'\nExit {required}\n' in log,logfile
 table.append(f'| {i} | {label} | {required} | {link(logfile,"Full output")} |')
assert re.search(r'^  2 failed\s*$[\s\S]*^  417 passed \(41\.3m\)\s*$',read('m1.4-attempt1-gate-8-smoke.txt'),re.M)
artifact_folder=b/'m1.4-smoke-failures'
failproposals=[
 ('m1.4-food-stock-pin-proposal.json','character-life-navigation--d7c6d-able-when-sidebar-collapses-chromium',213),
 ('m1.4-stock-ledger-fixture-proposal.json','tile-feedback-precision-st-57686-i-digits-and-a-negative-net-chromium',143)]
sha_lines=[]
for name,folder,line in failproposals:
 rec=readjson(b/name); actual=(repo/rec['path']).read_bytes()
 draft=base64.b64decode(rec['afterBase64'],validate=True)
 assert base64.b64decode(rec['beforeBase64'],validate=True)==actual
 assert sha(actual)==rec['beforeSha256'] and sha(draft)==rec['afterSha256']
 assert (artifact_folder/folder/'trace.zip').is_file()
 sha_lines.append(f"{sha((b/name).read_bytes())}  {name}")
stamped=f"UTC {stamp()}\nBranch feat/money-difficulty\nHEAD {head}\nTree {tree}\nBase {base}\n"
commits=git('log','--format=%H %s','origin/main..HEAD')
write('m1.4-final-worktree.txt',stamped+commits+'\nGit status and index empty.\nBoth proposed test files match their before bytes. git diff --check origin/main...HEAD exited 0.\n'+'\n'.join(sha_lines)+'\n')
labels=('m1.4-attempt1-before-gates','m1.4-attempt1-before-smoke','m1.4-after-smoke','m1.4-before-measurements','m1.4-after-measurements')
load=[]
for label in labels:
 f=f'environment-{label}.txt';log=read(f)
 stored=re.search(r'(?m)^Intel\(R\).*? +(\d+)\s*$',log)
 assert stored,log
 load.append((label,stored[1],f))
a,z=failproposals
food_error=artifact_folder/a[1]/'error-context.md'
ledger_error=artifact_folder/z[1]/'error-context.md'
pending=(f"1. The collapsed-sidebar case expects 20 Food at {link(repo/'tests/e2e/character-life-navigation.spec.ts','character-life-navigation.spec.ts',213)}. "
 "It imports the approved fresh state and receives 40. Update the literal to 40 while preserving both loads and the exact text assertion. "
 +link(a[0],'Exact proposed bytes')+' · '+link(food_error,'Failure context')+'\n\n'
 f"2. The ledger oracle at {link(repo/'tests/e2e/tile-feedback-precision.spec.ts','tile-feedback-precision.spec.ts',143)} returns "
 "EXECUTION_ERROR. The original fixture has 3,000 milli of safe-integer headroom and credits 24,000 milli in tax before debits. "
 "The proposed fixture leaves 30,000 milli of headroom and enables four scheduled extraction charges. A direct production-engine probe gives "
 "opening 9,007,199,254,710,991 milli, net −12,150 milli and closing 9,007,199,254,698,841 milli. "
 "The negative net and grouped-cell assertions stay in place. "
 +link(z[0],'Exact proposed bytes')+' · '+link(ledger_error,'Failure context')+' · '+link('m1.4-stock-ledger-engine-probe.txt','Engine probe')+'\n')
drafts_measure=measure/'measurements-summary.json'
assert drafts_measure.exists()
measured=readjson(drafts_measure)
assert measured['head']==head and measured['headTree']==tree and measured['base']==base
bundle=measured['bundleGzipBytes']
assert len(bundle)==3
bundle_rows=['| Pair | Main gzip bytes | Head gzip bytes | Delta | Headroom to 200,000 |','|---:|---:|---:|---:|---:|']
for i,row in enumerate(bundle,1):
 bundle_rows.append(f"| {i} | {row['main']:,} | {row['head']:,} | {row['head']-row['main']:+,} | {200000-row['head']:,} |")
save=measured['saveBytes']
save_rows=['| Checkpoint | UTF-8 bytes |','|---|---:|']
save_rows.extend(f"| {name.replace('-', ' ')} | {size:,} |" for name,size in save.items())
save_rows.append('| 100-NPC market checkpoint in smoke | 293,945 |')
save_rows.append('| 100-NPC IndexedDB row JSON in smoke | 309,606 |')
timing=measured['timing']
timing_rows=['| 100-NPC comparison | A warm median / p95 ms | B warm median / p95 ms | Median paired median Δ ms | Median paired p95 Δ ms | Max |Δ median| / |Δ p95| ms |',
 '|---|---:|---:|---:|---:|---:|']
timing_rows[0]=timing_rows[0].replace('Max |Δ median| / |Δ p95| ms','Max absolute median / p95 Δ ms')
for name in ['main-main','main-normal','main-easy']:
 m=timing[name]
 a_ms=m['aWarm'];z_ms=m['bWarm']
 timing_rows.append(f"| {name} | {a_ms['medianMs']:.3f} / {a_ms['p95Ms']:.3f} | {z_ms['medianMs']:.3f} / {z_ms['p95Ms']:.3f} | {m['medianDeltaMs']:+.3f} | {m['medianP95DeltaMs']:+.3f} | {m['maxAbsMedianDeltaMs']:.3f} / {m['maxAbsP95DeltaMs']:.3f} |")
assert measured['pairedRunsPerGroup']==10 and measured['timingWarmPerProcess']==20
section='\n'.join(bundle_rows)+'\n\n'+'\n'.join(save_rows)+'\n\n'+'\n'.join(timing_rows)
section+='\n\n10 AB/BA pairs per group, 20 warm ticks per fresh process. Main/main is the noise reference. R-026 is open. '
section+=link(drafts_measure,'Numeric summary')+' · '+link(measure/'raw-timings.json','Raw timings')+' · '+link(measure/'timing-inputs.json','Input digests')+' · '+link(measure/'bundle-pairs.json','Bundle pairs')+' · '+link(measure/'save-byte-diff.json','Save byte diff')
out='# Money M1.4 HOLD\n\n'+f"**Full smoke finished at 417 passed and 2 failed.** The local branch is {code('feat/money-difficulty')} at {code(head)}. Tree {code(tree)}. Base {code(base)}. Both follow-up test proposals await owner approval. The worktree and Git index are clean.\n\n"
out+=f"Owner Tân’s Correction 4 response was “Duyệt, làm tiếp (Recommended)”. SHA-256 {code(binding)}. "+link(plan,'Binding plan')+' · '+link('m1.4-final-worktree.txt','Final worktree and commit evidence')+'\n\n'
out+='## Completed implementation\n\n'
out+=f"- M1.2 {code(s2)}. Applied all approved bytes. The first full run had one unchanged seeded NPC test exceed the 5,000 ms limit. The full retry passed 3,313 tests with three concurrent Vitest workers and the original timeout. "+link('m1.2-correction4-applied.txt','Applied SHA-256s')+' · '+link('m1.2-commit.txt','Commit')+' · '+link('m1.2-green-round3-unit.txt','First unit run')+' · '+link('m1.2-green-round3-unit-attempt2.txt','Full GREEN')+'\n'
out+=f"- M1.3 {code(head)}. The 1,280- and 1,600-pixel cases first failed at the missing Difficulty field. Both then passed with the approved UI, including keyboard selection, read-only display, IndexedDB save/reload and byte equality. "+link('m1.3-red-browser.txt','RED')+' · '+link('m1.3-green-browser.txt','GREEN')+' · '+link('m1.3-commit.txt','Commit')+'\n\n'
out+='## Exact-head gates\n\n| Gate | Command or result | Exit | Evidence |\n|---:|---|---:|---|\n'+'\n'.join(table)+'\n\n'
out+=f"Ports 4173 and 4174 were free at the recorded boundaries. The system keep-awake request covered the gates and full smoke. CPU snapshots showed {load[0][1]}% before gates, {load[1][1]}% before smoke, {load[2][1]}% after smoke, and {load[3][1]}% / {load[4][1]}% before / after measurements. Background browser processes were active in the pre-gate and pre-smoke samples. "+' · '.join(link(x[2],x[0].replace('m1.4-','').replace('-', ' ')) for x in load)+'\n\n'
out+='## Smoke failures and exact proposals\n\n'+pending+'\n'
out+='The earlier retune test inventory missed both browser fixtures. The proposed bytes are separate from the tested branch. Browser verification for those proposals awaits approval. '+link('m1.4-smoke-last-run.json','Playwright result IDs')+'\n\n'
out+='## Bundle, save and paired timings\n\n'+section+'\n\n'
out+='## Approval boundary\n\nThe two exact test changes need owner approval before applying them and validating the resulting head. The branch remains local. Storage reclaimed was 0 bytes. '+link('SHA256SUMS.txt','Evidence hashes')+'\n'
write('M1.4-HOLD.md',out)
readme='# Money M1 Builder evidence\n\nOpen '+link('M1.4-HOLD.md','M1.4 HOLD')+' for the final gate results, both exact test proposals and the measurements.\n\n'
readme+='- '+link('m1.2-commit.txt','M1.2 commit')+' · '+link('m1.3-commit.txt','M1.3 commit')+' · '+link('m1.4-final-worktree.txt','Exact current head')+'\n'
readme+='- '+link('m1.4-attempt1-gate-8-smoke.txt','Full CI smoke')+' · '+link(drafts_measure,'Measurements')+' · '+link('SHA256SUMS.txt','Evidence manifest')+'\n'
readme+='- '+link('round3-HOLD.md','Round 3 HOLD')+' · '+link('calibration-round3-summary.md','Approved 18-cell calibration')+' · '+link('retune-HOLD.md','Round 2 HOLD')+' · '+link('M1.1-HOLD.md','M1.1 HOLD')+'\n'
write('README.md',readme)
manifest=b/'SHA256SUMS.txt'
cases=sorted(f for f in b.rglob('*') if f.is_file() and f!=manifest)
write('SHA256SUMS.txt',''.join(f'{sha(f.read_bytes())}  {f.relative_to(b).as_posix()}\n' for f in cases))
for line in read('SHA256SUMS.txt').splitlines():
 digest,name=line.split('  ',1)
 assert sha((b/name).read_bytes())==digest,name
text=read('M1.4-HOLD.md')
assert 'Duyệt, làm tiếp (Recommended)' in text and 'Tân' in text
print('Manifest entries',len(cases))
print('M1.4-HOLD SHA-256',sha((b/'M1.4-HOLD.md').read_bytes()))
print('SHA256SUMS SHA-256',sha(manifest.read_bytes()))
