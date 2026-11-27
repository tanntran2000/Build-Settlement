from datetime import UTC,datetime
from hashlib import sha256
from pathlib import Path
import json,os,re,subprocess,sys,time

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scratch=Path(__file__).parent
root=scratch/'packet'
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction10')
logs=out/'mutations'
logs.mkdir(exist_ok=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=wt).decode().strip()
assert head=='546c48b9f312144c494a48dd44fe41741c9c2470'
assert (root/'node_modules/@haven/simulation').resolve()==(root/'packages/simulation').resolve()
assert (root/'node_modules/@haven/core').resolve()==(root/'packages/core').resolve()
assert (root/'node_modules/@haven/ui').resolve()==(root/'packages/ui').resolve()
archive=scratch/'c10-head.tar'
subprocess.run(['git','archive','--format=tar',f'--output={archive}',head],cwd=wt,check=True)
subprocess.run(['tar','-xf',str(archive),'-C',str(root)],cwd=wt,check=True)
for name in ('unit-test-bytes.json','implementation-bytes.json'):
    for e in json.loads((out/name).read_bytes())['entries']:
        b=(wt/e['path']).read_bytes()
        assert sha256(b).hexdigest()==e['afterSha256'],e['path']
        (root/e['path']).write_bytes(b)
env={**os.environ,'NO_COLOR':'1','CI':'1'}
env.pop('FORCE_COLOR',None)
def mutate(path,a,b):
    file=root/path
    saved=file.read_bytes()
    end='\r\n' if b'\r\n' in saved else '\n'
    text=saved.decode('utf-8').replace('\r\n','\n')
    assert text.count(a)==1,(path,a,text.count(a))
    changed=text.replace(a,b).replace('\n',end).encode('utf-8')
    file.write_bytes(changed)
    return file,saved,changed

def run(label,args,expected,what=None):
    log=logs/(label+'.txt')
    if log.is_file():
        previous=log.read_text(encoding='utf-8')
        assert what in previous and f'Exit {expected} in ' in previous,label
        return previous
    with log.open('xb') as f:
        f.write((f'Base HEAD {head}\n{what or "Scratch setup"}\nUTC start {datetime.now(UTC).isoformat()}\n'
                 f'Command {subprocess.list2cmdline(args)}\n\n').encode('utf-8'));f.flush()
        started=time.monotonic()
        r=subprocess.run(args,cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT)
        f.write(f'\nExit {r.returncode} in {time.monotonic()-started:.3f}s\n'.encode('utf-8'))
    assert r.returncode==expected,(label,r.returncode,expected)
    return log.read_text(encoding='utf-8')

c='packages/core/src/'
s='packages/simulation/src/'
u='packages/ui/src/'
unit=s+'__tests__/purse-command.test.ts'
mutations=[
    ('refusal-message',s+'purse-command.ts','error: { code, message }','error: { code, message: message + " (wrong)" }',unit,'refuses levy 21'),
    ('whole-levy-receipt',s+'purse-week.ts','donationsMilli: purse.donatedThisWeekMilli,','donationsMilli: 1,',
        s+'__tests__/purse-week.test.ts','floors gross levy before scaling Money'),
    ('control-object-shape',u+'purse-view.ts','    amountMilli,\n','    amountMilli,\n    extra: true,\n',
        u+'__tests__/purse-view.test.ts','parses whole digits'),
    ('public-freeze',c+'character/purse.ts','deepFreeze(validateTuning(tuningJson).PURSE_TRIAL)','{ ...validateTuning(tuningJson).PURSE_TRIAL }',
        c+'__tests__/catalog-data.test.ts','tuning.json.*has recursively frozen typed views'),
    ('craft-gold-gate',s+'item-command.ts','if(purse.moneyMilli<recipe.feeMilli)','if(stock.gold===0||purse.moneyMilli<recipe.feeMilli)',
        s+'__tests__/craft-command.test.ts','queues at enabled'),
    ('craft-preview-gold-gate',u+'items-view.ts','  const building=state.tiles.find(t=>t.id===tileId)?.building,items=state.society!.items;',
        '  if(state.world.settlements[state.world.activeSettlementId!].inventory.gold===0)return [];\n  const building=state.tiles.find(t=>t.id===tileId)?.building,items=state.society!.items;',
        u+'__tests__/crafting-view.test.ts','allows Brew placement without staffing'),
    ('floor-two-clamps',s+'society-week.ts','clamp(society.satisfaction[id]-i.levyPenalty);',
        'clamp(clamp(society.satisfaction[id]-i.levyPenalty-2)+2);',unit,'keeps a funded citizen class at zero'),
    ('free-levy-gain',c+'character/purse.ts','return Math.max(0, penalty - offset);','return penalty - offset;',
        unit,'a positive .* donation leaves Happiness'),
    ('shipped-rate-zero',c+'data/tuning.json','"donateSatisfactionPerGoldMilli": 0.001','"donateSatisfactionPerGoldMilli": 0',
        unit,'uses shipped'),
    ('shipped-cap-zero',c+'data/tuning.json','"donateSatisfactionCapPerWeek": 2','"donateSatisfactionCapPerWeek": 0',
        unit,'uses shipped'),
    ('report-guard',s+'purse-command.ts',"if (session.city.phase !== 'planning')","if (false)",
        unit,'in Report or with an invalid command envelope'),
    ('revision-guard',s+'purse-command.ts',"if (raw.expectedRevision !== session.city.revision)","if (false)",
        unit,'in Report or with an invalid command envelope'),
    ('envelope-guard',s+'purse-command.ts',"if (!hasWeeklyKeys(raw, ['type', 'expectedRevision', fields[type]]))","if (false)",
        unit,'in Report or with an invalid command envelope'),
]
summary=[]
for label,path,old,new,test,query in mutations:
    f,b,changed=mutate(path,old,new)
    try:
        desc=f'Mutated {path}\nOriginal SHA-256 {sha256(b).hexdigest()}\nVariant SHA-256 {sha256(changed).hexdigest()}'
        text=run(label,['npm.cmd','test','--',test,'-t',query],1,desc)
        assert re.search(r'^ FAIL ',text,re.M) and (('AssertionError' in text) or ('NOT_ENOUGH_MONEY' in text)),label
        summary.append({'label':label,'path':path,'test':test,'query':query,'exit':1})
        print(label,'caught',flush=True)
    finally:
        f.write_bytes(b)

path=u+'report-letters.ts'
f,b,changed=mutate(path,'const credited = applyDifficulty(levyPaidMilli, difficultyProfile(difficulty).levyMoneyBps);',
    "const credited = applyDifficulty(levyPaidMilli, difficultyProfile('normal').levyMoneyBps);")
try:
    desc=f'Mutated {path} to render the Normal credit on Easy\nOriginal SHA-256 {sha256(b).hexdigest()}\nVariant SHA-256 {sha256(changed).hexdigest()}'
    run('easy-receipt-build',['npm.cmd','run','build','--workspace=@haven/ui'],0,desc)
    text=run('easy-receipt',['npm.cmd','run','test:smoke','--','tests/e2e/purse.spec.ts','--grep','1600'],1,desc)
    assert 'expect(levy[1]).toBe' in text
    summary.append({'label':'easy-receipt','path':path,'test':'tests/e2e/purse.spec.ts','query':'1600','exit':1})
    print('easy-receipt caught',flush=True)
finally:
    f.write_bytes(b)
(logs/'summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8',newline='\n')
print(len(summary),'broken variants caught',flush=True)
