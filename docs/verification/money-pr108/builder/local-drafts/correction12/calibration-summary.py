from pathlib import Path
from collections import defaultdict
import json

d=Path(__file__).resolve().parent
read=lambda p: json.loads(p.read_bytes())
baseline=read(d.parent/'baseline-with-security.json')['rows']
observed=read(d/'calibration-raw.json')['rows']
cols=set(baseline[0])
control=lambda data:[{k:r[k] for k in cols} for r in data if r['levyPercent']==0]
assert control(baseline)==control(observed)
common=cols-{'moneyAfterMilli'}
assert [{k:r[k] for k in common} for r in baseline] == [{k:r[k] for k in common} for r in observed]
groups=defaultdict(list)
for r in observed:
    groups[r['style'],r['difficulty'],r['levyPercent'],r['seed']].append(r)
assert len(groups)==90
table=[]
detail=[]
for (style,difficulty,levy,seed), rows in sorted(groups.items()):
    scalar=2 if difficulty=='easy' else 1
    assert all(r['safeMoneyMilli']==scalar*(15000+250*r['security']) for r in rows)
    if levy not in (5,10): continue
    first=next((r['week'] for r in rows if r['robberyExcessMilli']), '—')
    hits=[r for r in rows if r['robberyHit']]
    table.append(f'| {style.title()} | {difficulty.title()} | {levy}% | {seed} | {len(rows)} | {first} | {len(hits)} | {sum(r["robberyLossMilli"] for r in hits)} |')
    if style=='good' and hits:
        r=hits[0]
        excess=r['robberyExcessMilli']
        security=r['security']
        chase='Unavailable' if security<15 else str(min(10000,security*250))+' bps'
        detail.append(f'| {difficulty.title()} | {levy}% | {seed} | {r["week"]} | {excess} | {r["robberyLossMilli"]} | 0 / {excess*6000//10000} | {excess*6000//10000} | {chase} |')
out='\n'.join([
 '# M3.2 calibration at the Correction 12 thresholds','',
 'Frozen routes, all 90 seed/style/difficulty/levy combinations. The 0% rows match every original field. All routes also preserve the original Gold, Security, Happiness, crisis and levy-credit columns. The measurement chooses Pay after crisis and the Planning transition. Early falls are reported with their actual number of closes. All losses use integer Money milli.','',
 '| Style | Difficulty | Levy | Seed | Closed weeks | First above safe (week) | Hits | Total Pay loss |',
 '|---|---|---:|---:|---:|---:|---:|---:|',*table,'',
 '## Good routes at the first observed hit','',
 '| Difficulty | Levy | Seed | Hit week | Excess | Pay | Chase success/fail loss | Let go | Chase availability |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---|',*detail,
])
(d/'calibration-summary.md').write_bytes((out+'\n').encode())
print(len(observed), 'weekly rows,', len(table),'5% / 10% seeded routes; zero-levy rows and original Gold/Happiness receipts are identical.')

