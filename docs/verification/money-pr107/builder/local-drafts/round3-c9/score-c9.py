from pathlib import Path
from collections import defaultdict
from hashlib import sha256
import csv,json,re,sys

root=Path('C:/Users/Admin/.t3/local-drafts/money-prM2')
out=root/'round3-c9'
def read(p): return json.loads(p.read_bytes())
def first(rows,condition): return next((r['week'] for r in rows if condition(r)),None)
cal_log=(out/'calibration.txt').read_text(encoding='utf-8')
assert re.search(r'^Exit 0 in ',cal_log,re.M)
c8=read(root/'retune-c8/working-tree-sha256.json')['paths']
assert c8['scripts/money-calibration.ts']+'  scripts/money-calibration.ts' in cal_log
baseline=read(root/'BASELINE-f1fac94.json')['rows']
measured=read(out/'round-3.json')
assert measured['levyColumns']==[0,2,5,10,20]
assert len(measured['summary'])==90
zero=[{k:v for k,v in r.items() if k in baseline[0]} for r in measured['rows'] if r['levyPercent']==0]
baseline_equal=zero==baseline
groups=defaultdict(list)
for row in measured['rows']:
    groups[(row['seed'],row['difficulty'],row['style'],row['levyPercent'])].append(row)
assert len(groups)==90
tests={'unchangedM1ZeroPercentRows':baseline_equal}
table=[]
for summary in measured['summary']:
    seed=summary['seed']; diff=summary['difficulty']; style=summary['style']; levy=summary['levyPercent']
    rows=groups[(seed,diff,style,levy)]
    assert [r['week'] for r in rows]==list(range(1,len(rows)+1))
    below=first(rows,lambda r:r['happiness']<30)
    warning=first(rows,lambda r:r['crisisStage']=='warning')
    pace=summary['first15Money']
    data={'seed':seed,'difficulty':diff,'style':style,'levyPercent':levy,
        'closedWeeks':len(rows),'minHappiness':summary['minHappiness'],'firstHappinessBelow30':below,
        'below30Hunger':rows[below-1]['hungry'] if below else None,
        'below30Tension':rows[below-1]['tension'] if below else None,
        'firstRuntimeWarning':warning,'first15Money':pace,'firstUnpaidUpkeep':summary['firstUnpaidUpkeep'],
        'netGoldPer100Milli':summary['netPer100'],'grossGoldPer100Milli':summary['grossPer100'],
        'levyPaidGoldMilli':summary['totalLevyPaidMilli'],'levyMoneyMilli':summary['totalLevyMoneyMilli'],
        'levyShortfallGoldMilli':summary['totalLevyShortfallMilli'],'failure':summary['firstFailure'],'fallen':summary['fallen']}
    table.append(data)
    if style=='good' and levy==5:
        tests[f'{seed} {diff} 5% 15 Money pace']=pace is not None and (
            10<=pace<=15 if diff=='normal' else 5<=pace<=8)
        if diff=='normal':
            tests[f'{seed} normal 5% Happiness >=30 and no Warning']=len(rows)==40 and summary['minHappiness']>=30 and warning is None
    if style=='good' and diff=='normal' and levy==10:
        tests[f'{seed} normal 10% first below 30 W12-W18']=below is not None and 12<=below<=18
with (out/'round-3-table.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=table[0].keys(),lineterminator='\n')
    w.writeheader()
    w.writerows(table)
(out/'round-3-decision.json').write_text(json.dumps({'pass':all(tests.values()),'checks':tests},indent=2)+'\n',encoding='utf-8',newline='\n')
print(len(measured['rows']),'rows',len(table),'traces',sum(tests.values()),'/',len(tests),'criteria')
for row in table:
    if row['style']=='good' and (row['levyPercent']==5 or row['levyPercent']==10 and row['difficulty']=='normal'):
        print(row['seed'],row['difficulty'],row['levyPercent'],
              'min',row['minHappiness'],'below30',row['firstHappinessBelow30'],'warn',row['firstRuntimeWarning'],'15Money',row['first15Money'])
print('Checks',tests)
sys.exit(0 if all(tests.values()) else 1)
