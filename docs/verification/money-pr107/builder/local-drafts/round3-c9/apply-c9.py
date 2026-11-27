from pathlib import Path
from hashlib import sha256
import json, sys, subprocess

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
root=Path('C:/Users/Admin/.t3/local-drafts/money-prM2')
out=root/'round3-c9'
mode=sys.argv[1]
assert mode in ('red','code')
out.mkdir(exist_ok=True)
def digest(data): return sha256(data).hexdigest()
pins={
 'binding-plan-f76aef5.md':'fc531ceee93f1947c53125c5efe015770c637b6fc1d010f55a4be4c6cd4cfdbd',
 'retune-c8/RETUNE-HOLD.md':'29312d35f5d0965bbffa2d260b12fbd4e2f543476c7132ff102f386a7db0cb55',
 'retune-c8/calibration-table.csv':'0f05eecce26121c663ced756b38af7051d671c49788e3d98aafb177db394a0b9',
 'retune-c8/proposed-tuning-bytes.json':'b9fe454222bf1c8443318857a0a62f9fcb0cfce8b717e58ee051a2e744bdf9b1',
 'retune-c8/m21-byte-inventory.json':'a0d6e9370642c98e37e67ea3aa87b1cb7d5158e27003c1381214cb2e20877f5a',
 'retune-c8/changed-test-expectations.json':'413502ebd1ce194fb68b87ac7c704d6c25b413d2f093175e2cd370cae2126b62',
 'retune-c8/SHA256SUMS.txt':'27aed40fc4e1bfe750e242596be42f097fb943e66217262662c4df4b779795d9',
}
for p,h in pins.items(): assert digest((root/p).read_bytes())==h,p
held=json.loads((root/'retune-c8/working-tree-sha256.json').read_bytes())
head=held['baseHead']
def git(*args): return subprocess.check_output(['git',*args],cwd=wt)
assert git('rev-parse','HEAD','HEAD^{tree}').decode().splitlines()==[head,held['baseTree']]
assert git('branch','--show-current').decode().strip()==held['branch']
assert not git('diff','--cached','--name-only')
def paths(data): return set(data.decode().strip('\0').split('\0'))-{''}
assert paths(git('diff','--name-only','-z'))|paths(git('ls-files','--others','--exclude-standard','-z'))==set(held['paths'])

staged=[]
def apply(path,*pairs):
    dest=wt/path
    raw=dest.read_bytes()
    assert digest(raw)==held['paths'][path],path
    src=raw.decode('utf-8')
    eol='\r\n' if b'\r\n' in raw and b'\n' not in raw.replace(b'\r\n',b'') else '\n'
    text=src.replace('\r\n','\n') if eol=='\r\n' else src
    for old,new,occurrences in pairs:
        assert text.count(old)==occurrences,(path,old,text.count(old),occurrences)
        text=text.replace(old,new)
    result=text.replace('\n',eol)
    staged.append({'path':path,'before':src,'after':result,
        'beforeSha256':digest(raw),'afterSha256':digest(result.encode('utf-8')),'eol':'CRLF' if eol=='\r\n' else 'LF',
        'endsWithNewline':raw.endswith(b'\n')})

core='packages/core/src/'
sim='packages/simulation/src/'
field='levySatisfactionPerPoint'
bps='levySatisfactionBpsPerPoint'
if mode=='red':
    for p, count in [('__tests__/catalog-data.test.ts',2),('__tests__/purse-tuning.test.ts',2)]:
        edits=[(field,bps,count)]
        if 'purse-tuning' in p: edits.append(('expected integer in [0, 100]', 'expected integer >= 0', 0))
        if 'purse-tuning' in p:
            edits[-1]=(f"['{bps}', 0.5, 'expected integer in [0, 100]']",f"['{bps}', 0.5, 'expected integer >= 0']",1)
        apply(core+p,*edits)
    apply(sim+'__tests__/purse-week.test.ts',
        ("  it.each([0, 1, 2, 3])('applies the levy at percent %i penalty to citizens before the Happiness report', percent => {",
         "  it.each([[0, 0], [1, 0], [2, 0], [3, 1], [5, 3], [10, 9], [20, 21]])(\n    'applies the levy at percent %i penalty to citizens before the Happiness report', (percent, penalty) => {",1),
        ("    const base = close(start()), r = close(start('normal', percent));",
         "    expect(levySatisfactionCost(percent)).toBe(penalty);\n    const base = close(start()), r = close(start('normal', percent));",1),
        ('baseline[group] - levySatisfactionCost(percent)','baseline[group] - penalty',1),
        ('base.report.happinessAfter - levySatisfactionCost(percent)','base.report.happinessAfter - penalty',1),
        ('  });\n\n  it(\'keeps the purse with the Player', '  });\n\n  it(\'keeps the purse with the Player',1))
else:
    red=json.loads((out/'c9-test-bytes.json').read_bytes())
    final_after={entry['path']:entry['afterSha256'] for entry in red['entries']}
    for p,h in held['paths'].items(): assert digest((wt/p).read_bytes())==final_after.get(p,h),p
    apply(core+'data/tuning.json',(f'"{field}": 2',f'"{bps}": 12000',1))
    apply(core+'data/validate.ts',
        (f'{field}: number;',f'{bps}: number;',1),
        (f'{field}: integerInRange(0, 100),',f'{bps}: nonnegative,',1))
    apply(core+'character/purse.ts',
        ('import { difficultyProfile, type DifficultyId }','import { applyDifficulty, difficultyProfile, type DifficultyId }',1),
        (f'  const penalty = Math.max(0, percent - PURSE_TRIAL.levyFreePercent) * PURSE_TRIAL.{field};',
         f'  const excessPercent = Math.max(0, percent - PURSE_TRIAL.levyFreePercent);\n  const penalty = applyDifficulty(excessPercent, PURSE_TRIAL.{bps});',1))
if mode=='red':
    for p,h in held['paths'].items():assert digest((wt/p).read_bytes())==h,p
for e in staged:
    (wt/e['path']).write_bytes(e['after'].encode('utf-8'))
name='c9-test-bytes.json' if mode=='red' else 'c9-code-bytes.json'
(out/name).write_text(json.dumps({'baseHead':head,'encoding':'UTF-8','entries':staged},ensure_ascii=False,indent=2)+'\n',
    encoding='utf-8',newline='\n')
print(mode,len(staged))
