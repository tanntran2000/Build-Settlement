from pathlib import Path
from collections import defaultdict
from hashlib import sha256
import csv, json, sys

out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/retune-c8')
w=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
def hash_file(p): return sha256(p.read_bytes()).hexdigest()

def first(run, condition):
    return next((row['week'] for row in run if condition(row)),None)

def warning(row):
    return row['crisisStage']=='warning'

def ontime(week):
    return week is not None and week<=15

entries=[]
for round_name in sys.argv[1:]:
    obj=json.loads((out/(round_name+'.json')).read_text(encoding='utf-8'))
    assert obj['levyColumns']==[0,2,5,10,20]
    groups=defaultdict(list)
    for row in obj['rows']:
        groups[(row['seed'],row['difficulty'],row['style'],row['levyPercent'])].append(row)
    assert set(groups)=={(s,d,t,l) for s in (2026,2027,2028)
        for d in ('normal','easy') for t in ('good','average','bad') for l in (0,2,5,10,20)}
    assert len(obj['summary'])==len(groups)
    for s in obj['summary']:
        rows=groups[(s['seed'],s['difficulty'],s['style'],s['levyPercent'])]
        assert [x['week'] for x in rows]==list(range(1,len(rows)+1))
        w30=first(rows,lambda r:r['happiness']<30)
        actual=first(rows,warning)
        assert w30==s['firstBelowWarningHappiness']
        assert actual is None or actual==s['firstCrisis']
        h30=rows[w30-1] if w30 else {}
        warned=rows[actual-1] if actual else {}
        week5=s['levyPercent']==5 and s['style']=='good'
        week10=s['levyPercent']==10 and s['style']=='good' and s['difficulty']=='normal'
        m1=s['levyPercent']==0
        early=s['first15Money']
        e={
          'round':round_name,'seed':s['seed'],'difficulty':s['difficulty'],'style':s['style'],'levyPercent':s['levyPercent'],
          'weeks':len(rows),'netPer100Gold': None if s['netPer100'] is None else s['netPer100']/1000,
          'grossPer100Gold':None if s['grossPer100'] is None else s['grossPer100']/1000,
          'goodsMadeMilli':s['goods'],'paidGoldMilli':s['totalLevyPaidMilli'],'creditMoneyMilli':s['totalLevyMoneyMilli'],
          'shortfallGoldMilli':s['totalLevyShortfallMilli'],'firstUnfundedUpkeep':s['firstUnpaidUpkeep'],
          'firstZeroGold':s['firstZero'],'first15Money':early,'minHappiness':s['minHappiness'],
          'firstBelow30':w30,'happinessOnFirstBelow30':h30.get('happiness'),'hungryOnFirstBelow30':h30.get('hungry'),
          'tensionOnFirstBelow30':h30.get('tension'),'stageOnFirstBelow30':h30.get('crisisStage'),
          'firstRuntimeWarning':actual,'warningHappiness':warned.get('happiness'),
          'warningHungry':warned.get('hungry'),'warningTension':warned.get('tension'),
          'firstFailure':s['firstFailure'],'fallen':s['fallen'],
          'm2PaceMet': bool(early and (10<=early<=15 if s['difficulty']=='normal' else 5<=early<=8)) if week5 else None,
          'normal5Above30':(s['minHappiness']>30 and len(rows)==40) if week5 and s['difficulty']=='normal' else None,
          'normal5NoWarning':(actual is None and len(rows)==40) if week5 and s['difficulty']=='normal' else None,
          'normal10Below30ByW15':ontime(w30) if week10 else None,
          'normal10WarningByW15':ontime(actual) if week10 else None,
        }
        net=e['netPer100Gold']
        gross=e['grossPer100Gold']
        d=s['difficulty']
        if m1:
            if s['style']=='bad':
                value=s['firstUnpaidUpkeep']
                meets=bool(value and (8<=value<=12 if d=='normal' else 18<=value<=22))
            elif s['style']=='average':
                meets=bool(net is not None and (-1<=net<=1 if d=='normal' else 2<=net<=4))
            else:
                meets=bool(net is not None and (4<=net<=6 and gross is not None and 20<=gross<=30 if d=='normal' else 9<=net<=11))
            e['m1ControlMet']=meets
        else:
            e['m1ControlMet']=None
        entries.append(e)
with (out/'calibration-table.csv').open('w',encoding='utf-8',newline='') as stream:
    tab=csv.DictWriter(stream,fieldnames=entries[0].keys(),lineterminator='\n')
    tab.writeheader()
    tab.writerows(entries)
(out/'calibration-table.json').write_bytes((json.dumps(entries,indent=2,ensure_ascii=False)+'\n').encode('utf-8'))
for round_name in sys.argv[1:]:
    selected=[e for e in entries if e['round']==round_name]
    print(round_name,len(selected),'traces',sum(x['weeks'] for x in selected),'closes')
    print('M1 controls',sum(x['m1ControlMet'] is True for x in selected),'/18')
    for p in [5,10,20]:
        for e in [x for x in selected if x['style']=='good' and x['levyPercent']==p]:
            print(
                e['seed'],e['difficulty'],p,'weeks',e['weeks'],'Hmin',e['minHappiness'],
                'H<30',e['firstBelow30'],e['tensionOnFirstBelow30'],e['hungryOnFirstBelow30'],
                'Warn',e['firstRuntimeWarning'],e['warningTension'],e['warningHungry'],
                '15 Money',e['first15Money'],'shortfall',e['shortfallGoldMilli'],'failure',e['firstFailure'])
