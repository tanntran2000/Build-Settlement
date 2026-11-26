import base64, csv, hashlib, json, math
from pathlib import Path

builder = Path(__file__).resolve().parent
scratch = builder.parent / '_scratch/tree'
real = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
head = '63d2b2627b57d172be8459c64989e42ff650f692'
def write(name, text): (builder / name).write_text(text, encoding='utf-8', newline='\n')
def write_json(name, value): write(name, json.dumps(value, indent=2, ensure_ascii=False) + '\n')
def read(name): return json.loads((builder / name).read_bytes())
def sha(data): return hashlib.sha256(data).hexdigest()
def b64(data): return base64.b64encode(data).decode('ascii')
def link(name, label=None): return f'[{label or name}]({(builder / name).as_posix()})'
def decoded(data):
    result = json.loads(data)
    if isinstance(result, list):
        return [dict(row, session=json.loads(row['session'])) if isinstance(row.get('session'), str) else row for row in result]
    return result

missing = object()
def diffs(old, new, prefix=''):
    if isinstance(old, dict) and isinstance(new, dict):
        for key in dict.fromkeys([*old, *new]):
            yield from diffs(old.get(key, missing), new.get(key, missing), '.'.join(filter(None, [prefix, key])))
    elif isinstance(old, list) and isinstance(new, list):
        for i in range(max(len(old), len(new))):
            yield from diffs(old[i] if i < len(old) else missing, new[i] if i < len(new) else missing, f'{prefix}[{i}]')
    elif type(old) is not type(new) or old != new:
        yield dict(path=prefix, beforePresent=old is not missing, before=old if old is not missing else None,
                   afterPresent=new is not missing, after=new if new is not missing else None)

fixture_records = []
scene = ['# Round 3 regenerated scenario paths', '',
         'Existing generators replayed ten v14 fixtures and three catalog seeds in external scratch. The golden session strings were decoded before comparing paths. All changed values and complete raw file bytes are recorded. '
         + link('round3-scenario-bytes.json', 'Exact scenario bytes'), '']
for old in read('round2-scenario-bytes.json')['files']:
    path = old['path']
    before = (real / path).read_bytes()
    after = (scratch / path).read_bytes()
    changed = list(diffs(decoded(before), decoded(after)))
    assert all(not end in x['path'] for x in changed for end in ('rulesetId', 'difficulty', 'purse')), path
    fixture_records.append(dict(path=path, sha256Before=sha(before), sha256After=sha(after), bytesBefore=len(before),
                                bytesAfter=len(after), beforeBase64=b64(before), afterBase64=b64(after), decodedChanges=changed))
    scene += [f'## {path}', '', f'Before {sha(before)} ({len(before):,} bytes).',
              f'After {sha(after)} ({len(after):,} bytes).', '']
    tick = chr(96)
    for change in changed:
        old_text = json.dumps(change['before'], ensure_ascii=False) if change['beforePresent'] else '(absent)'
        new_text = json.dumps(change['after'], ensure_ascii=False) if change['afterPresent'] else '(absent)'
        scene.append(f"- {tick}{change['path']}{tick} from {tick}{old_text}{tick} to {tick}{new_text}{tick}.")
    if not changed:
        scene.append('No decoded value changed.')
    scene.append('')
write('round3-scenario-paths.md', '\n'.join(scene))
write_json('round3-scenario-bytes.json', dict(status='Regenerated in the external Round 3 candidate.', baseHead=head, files=fixture_records))
cal = read('calibration-round3.json')
assert len(cal['summary']) == 18 and len(cal['rows']) == 720
scored = []
for cell in cal['summary']:
    seed, difficulty, style = (cell[k] for k in ('seed','difficulty','style'))
    all_weeks = [w for w in cal['rows'] if (w['seed'],w['difficulty'],w['style'])==(seed,difficulty,style)]
    window = [w for w in all_weeks if 20<=w['week']<=40]
    assert len(all_weeks) == 40 and len(window) == 21
    for row in all_weeks:
        assert row['gross'] == sum(row[k] for k in ['tax','goodsRevenue','lawPay'])
        assert row['end'] - row['start'] == row['net'] == row['gross'] - sum(row[k] for k in ['wages','operations','homes','lawCosts','training','securityTheft','crimeTheft','luxury'])
        assert row['end'] >= 0 and row['closeAfterAnswer'] >= 0 and not row['fallen'] and row['failure'] is None
    first_unpaid = next((w for w in all_weeks if w['scheduledUpkeepUnfunded'] or w['homeUpkeepUnfunded']),None)
    assert cell['firstUnpaidUpkeep'] == (first_unpaid and first_unpaid['week'])
    first_post_zero = next((w['week'] for w in all_weeks if w['crisisCost'] and w['closeAfterAnswer']==0), None)
    net, gross = cell['netPer100']/1000, cell['grossPer100']/1000
    money_eta = None
    if style == 'good':
        minimum,maximum = (4,6) if difficulty == 'normal' else (9,11)
        target = f'Net {minimum:+} to {maximum:+}' + (', gross 20 to 30' if difficulty=='normal' else '')
        passed = minimum<=net<=maximum and (difficulty!='normal' or 20<=gross<=30)
        money_eta = math.ceil(15000/(math.floor(cell['grossPer100']*5/100)*(2 if difficulty=='easy' else 1)))
        assert cell['goods'] > 0 and sum(w['sold'] for w in all_weeks) > 0 and all(w['foodDemand']==w['foodConsumed'] for w in all_weeks) and first_unpaid is None
    elif style == 'average':
        minimum,maximum = (-1,1) if difficulty=='normal' else (2,4)
        target = f'Net {minimum:+} to {maximum:+}'
        passed = minimum<=net<=maximum
    else:
        minimum,maximum = (8,12) if difficulty=='normal' else (18,22)
        target = f'Unpaid W{minimum}–{maximum}'
        passed = first_unpaid is not None and minimum<=first_unpaid['week']<=maximum
        assert cell['goods']==0
    scored.append(dict(seed=seed,difficulty=difficulty,style=style,netGoldPer100=net,grossGoldPer100=gross,
                       firstUnpaid=cell['firstUnpaidUpkeep'],scheduledUnpaidMilli=first_unpaid and first_unpaid['scheduledUpkeepUnfunded'],
                       homeUnpaidMilli=first_unpaid and first_unpaid['homeUpkeepUnfunded'],goldAtFirstUnpaidMilli=first_unpaid and first_unpaid['end'],
                       firstZero=cell['firstZero'],firstPostCardZero=first_post_zero,producedGoods=cell['goods']/1000,
                       soldGoods=sum(w['sold'] for w in all_weeks)/1000,goodsProducedW20To40=sum(w['goods'] for w in window)/1000,
                       goodsSoldW20To40=sum(w['sold'] for w in window)/1000,firstProductionWeek=next((w['week'] for w in all_weeks if w['goods']), None),
                       lastProductionWeek=next((w['week'] for w in reversed(all_weeks) if w['goods']), None),
                       minHappiness=min(w['happiness'] for w in all_weeks),residentsMin=min(w['residents'] for w in all_weeks),
                       residentsMax=max(w['residents'] for w in all_weeks),moneyEtaWeeks=money_eta,target=target,
                       passed=passed))
with (builder / 'calibration-round3-cells.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(scored[0])); writer.writeheader(); writer.writerows(scored)
def week(number): return f'W{number}' if number is not None else '—'
total = sum(x['passed'] for x in scored)
lines = ['# Round 3 calibration scorecard', '',
         f'**{total}/18 cells passed**. All 18 runs closed 40 weeks. All 720 weekly Gold ledgers reconcile. No scenario command failed and no city fell.',
         '', 'Income and net are Gold per week per 100 residents averaged over weeks 20–40 inclusive. First unpaid is based on scheduled building and home charges at the End Week close. Zero-close and zero-after-card are recorded separately. '
         + link('calibration-round3.json','720 raw weeks') + ' · ' + link('calibration-round3-cells.csv','Full precision') + ' · ' + link('calibration-round3-run.txt','Run log'), '',
         '| Difficulty | Style | Seed | Target | Net | Gross | First unpaid | First zero | Result |',
         '|---|---|---:|---|---:|---:|---:|---:|---|']
for x in sorted(scored,key=lambda x:(['normal','easy'].index(x['difficulty']),['good','average','bad'].index(x['style']),x['seed'])):
    state = 'Pass' if x['passed'] else 'Miss'
    lines.append(f"| {x['difficulty'].title()} | {x['style'].title()} | {x['seed']} | {x['target']} | {x['netGoldPer100']:+.6f} | {x['grossGoldPer100']:.6f} | {week(x['firstUnpaid'])} | {week(x['firstZero'])} | {state} |")
lines += ['', '## Bad first unpaid charges', '',
          '| Difficulty | Seed | Week | Scheduled unpaid (milli) | Home unpaid (milli) | End Week Gold (milli) | First zero after a card debit |',
          '|---|---:|---:|---:|---:|---:|---:|']
for x in (x for x in scored if x['style']=='bad'):
    lines.append(f"| {x['difficulty'].title()} | {x['seed']} | {week(x['firstUnpaid'])} | {x['scheduledUnpaidMilli']} | {x['homeUnpaidMilli']} | {x['goldAtFirstUnpaidMilli']} | {week(x['firstPostCardZero'])} |")
lines += ['', '## Good production and M2 pace projection', '',
          '| Difficulty | Seed | Goods produced / sold, W1–40 | Goods produced / sold, W20–40 | Production window | 15 Money at 5% levy |',
          '|---|---:|---:|---:|---:|---:|']
for x in (x for x in scored if x['style']=='good'):
    lines.append(f"| {x['difficulty'].title()} | {x['seed']} | {x['producedGoods']:g} / {x['soldGoods']:g} | {x['goodsProducedW20To40']:g} / {x['goodsSoldW20To40']:g} | {week(x['firstProductionWeek'])}–{week(x['lastProductionWeek'])} | {x['moneyEtaWeeks']} weeks |")
lines += ['', 'The pace uses floor of 5% of mean gross in milli Gold, multiplied by the approved conversion and rounded up to a whole number of weeks for a 15 Money purchase. The calibration ran with levy 0% and did not collect Money.',
          '', 'The closest numerical result is Easy Average seed 2028 at +3.964190, about 0.036 Gold below the upper bound.', '']
write('calibration-round3-summary.md', '\n'.join(lines))
print(f'{total}/18, {len(fixture_records)} scenarios, {sum(len(f["decodedChanges"]) for f in fixture_records)} changed paths')
