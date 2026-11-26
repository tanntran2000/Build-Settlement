
from pathlib import Path
from hashlib import sha256
from base64 import b64encode,b64decode
from datetime import datetime,timezone
import subprocess,json,os,re,runpy
root=Path(r'C:\Users\Admin\.t3\local-drafts\money-prM1')
out=root/'builder-m1'
scratch=(root/'_scratch/tree').resolve()
C={"tax":240,"goodsPrice":1900,"food":40000,"goods":30000,"gold":120000,"goodExtractionUpkeep":7500,"easy":{"taxBps":10000,"goodsPriceBps":16500,"lawPayBps":11500,"upkeepBps":8160,"levyMoneyBps":20000},"family":["logging","mine","quarry","sheep-pasture","herb-garden"]}
G='packages/core/src/data/tuning.json'
B='packages/core/src/data/buildings.json'
N='packages/core/src/data/npc-generator.json'
V='packages/core/src/data/validate.ts'
D='packages/core/src/trial/__tests__/difficulty.test.ts'
CAL='scripts/money-calibration.ts'
head='63d2b2627b57d172be8459c64989e42ff650f692'
sha=lambda b:sha256(b).hexdigest()
def js(name,x): (out/name).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n',encoding='utf8',newline='\n')
def entry(path,before,after,why):
    return {'path':path,'why':why,'beforeSha256':sha(before),'afterSha256':sha(after),
      'beforeBase64':b64encode(before).decode(),'afterBase64':b64encode(after).decode()}
def edit(src,anchors):
    eol=b'\r\n' if b'\r\n' in src else b'\n'
    after=src
    for old,new in anchors:
        a=old.encode().replace(b'\n',eol);b=new.encode().replace(b'\n',eol)
        assert after.count(a)==1,a
        after=after.replace(a,b)
    return after
def put(path,data):
    target=scratch/path
    assert target.resolve().is_relative_to(scratch)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(data)
    assert target.read_bytes()==data
def run(name,args):
    now=lambda:datetime.now(timezone.utc).isoformat()
    with (out/name).open('xb') as log:
        log.write((f'HEAD {head}\nScratch {scratch}\nUTC start {now()}\nCommand {subprocess.list2cmdline(args)}\n\n').encode())
        log.flush()
        r=subprocess.run(args,cwd=scratch,env=dict(os.environ,NO_COLOR='1',FORCE_COLOR='0'),stdout=log,stderr=subprocess.STDOUT)
        log.write(f'\nExit {r.returncode}\nUTC end {now()}\n'.encode())
    print(name,'exit',r.returncode,flush=True)
    return r.returncode
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==head
assert not (out/'calibration-round3.json').exists()
tracked=[p for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0') if p]
for name in tracked+[CAL,'packages/simulation/src/__tests__/difficulty-week.test.ts']:
    if not name.startswith(('packages/','scripts/','tests/','tools/')) and '/' in name:continue
    data=Path(name).read_bytes()
    target=scratch/name
    if not target.exists() or target.read_bytes()!=data:put(name,data)
raw=Path(D).read_bytes()
dtest=edit(raw,[
 ('goodsPriceBps: 10000, lawPayBps: 10000, upkeepBps: 10000,','goodsPriceBps: 10000, lawPayBps: 10000, upkeepBps: 10000, levyMoneyBps: 10000,'),
 ("['taxBps', 'goodsPriceBps', 'lawPayBps', 'upkeepBps']","['taxBps', 'goodsPriceBps', 'lawPayBps', 'upkeepBps', 'levyMoneyBps']"),
 ("it('floors the scaled milli amount and keeps Normal exact', () => {",
  "it('stores the Easy levy conversion for the later levy implementation', () => {\n  expect(difficultyProfile('easy').levyMoneyBps).toBe(20000);\n});\n\nit('floors the scaled milli amount and keeps Normal exact', () => {")])
changes=[entry(D,raw,dtest,'Normal identity/rejection and the Easy 2:1 value.')]
put(D,dtest)
unit=['node','node_modules/vitest/vitest.mjs','run',D]
assert run('round3-levy-field-red.txt',unit)==1
assert 'levyMoneyBps' in (out/'round3-levy-field-red.txt').read_text(encoding='utf8')
values=runpy.run_path(str(out/'retune-numeric-bytes.py'))['editNumbers']
m2={x['path']:b64decode(x['afterUtf8Base64']) for x in json.loads((out/'round2-data-bytes.json').read_bytes())}
patches={
 G:{f'DIFFICULTY_TRIAL.profiles.easy.{k}':v for k,v in C['easy'].items() if k!='levyMoneyBps'}|{
  'TILE_TRIAL_BALANCE.taxGoldPerResident':C['tax'],'GOODS_STOCK_TRIAL.initialFoodMilli':C['food'],
  'GOODS_STOCK_TRIAL.initialGoodsMilli':C['goods'],'GOODS_STOCK_TRIAL.goldPerGoodsMilli':C['goodsPrice'],
  'GOODS_STOCK_TRIAL.initialGoldMilli':C['gold']},
 B:{f'trial.{n}.upkeepMilli':C['goodExtractionUpkeep'] for n in C['family']}|{
  'trial.mansion.upkeepMilli':2000,'trial.retainers-hall.upkeepMilli':1000,'trial.workshop.upkeepMilli':500,'trial.watch-house.upkeepMilli':500},
 N:{'P7B_TRIAL.startGoldMilli':C['gold']}}
dataChanges=[]
for name,fields in patches.items():
    org=Path(name).read_bytes()
    updated,steps=values(m2[name],fields)
    if name==G:
        t=updated.decode()
        t=re.sub(r'("(normal|easy)": \{[^{}\r\n]*?)( \})',lambda m:m[1]+(', "levyMoneyBps": 10000' if m[2]=='normal' else ', "levyMoneyBps": 20000')+m[3],t)
        assert t.count('levyMoneyBps')==2
        updated=t.encode()
    put(name,updated)
    dataChanges.append(entry(name,org,updated,'Round 3 data only.')|{'round2Sha256':sha(m2[name]),'round2ToRound3':steps})
raw=Path(V).read_bytes()
updated=edit(raw,[
 ('            taxBps: number; goodsPriceBps: number; lawPayBps: number; upkeepBps: number;',
  '            taxBps: number; goodsPriceBps: number; lawPayBps: number; upkeepBps: number; levyMoneyBps: number;'),
 ('lawPayBps: bps, upkeepBps: bps });','lawPayBps: bps, upkeepBps: bps, levyMoneyBps: bps });')])
put(V,updated)
changes.append(entry(V,raw,updated,'Validate the future levy multiplier. The Normal profile must be identity.'))
raw=Path(CAL).read_bytes()
updated=edit(raw,[
 ('  homes: number; lawCosts:','  homes: number; homeUpkeepUnfunded: number; lawCosts:'),
 ('const homes = report.householdUpkeep?.paidMilli ?? 0;','const homes = report.householdUpkeep?.paidMilli ?? 0;\n    const homeUpkeepUnfunded = report.householdUpkeep?.unpaidMilli ?? 0;'),
 ('      homes,lawCosts,training,','      homes,homeUpkeepUnfunded,lawCosts,training,'),
 ('      firstZero:run.find(row=>row.end===0)?.week??null,goods:', '      firstUnpaidUpkeep:run.find(row=>row.scheduledUpkeepUnfunded>0||row.homeUpkeepUnfunded>0)?.week??null,\n      firstZero:run.find(row=>row.end===0)?.week??null,goods:')])
put(CAL,updated)
changes.append(entry(CAL,raw,updated,'Score the approved unfunded upkeep metric. The scenario commands are unchanged.'))
js('round3-data-bytes.json',{'head':head,'configuration':C,'files':dataChanges})
js('round3-levy-and-metric-byte-proposals.json',{'head':head,'files':changes})
assert run('round3-levy-field-green.txt',unit)==0
assert run('calibration-round3-run.txt',['node',CAL,str(out/'calibration-round3.json')])==0
data=json.loads((out/'calibration-round3.json').read_bytes())
print('Measured rows',len(data['rows']),'cells',len(data['summary']),'SHA-256',sha((out/'calibration-round3.json').read_bytes()))

