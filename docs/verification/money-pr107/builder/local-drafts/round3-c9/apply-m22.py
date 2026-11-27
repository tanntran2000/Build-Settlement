from pathlib import Path
from hashlib import sha256
import json,subprocess,sys

root=Path('C:/Users/Admin/.t3/local-drafts/money-prM2')
wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=root/'round3-c9'
mode=sys.argv[1]
assert mode in ('red','green')
def digest(data):return sha256(data).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=wt)
head=git('rev-parse','HEAD').decode().strip()
base='f1fac9498f47fc7be8f6498ee3321800e14f2894'
assert git('rev-parse','HEAD^').decode().strip()==base
assert git('log','-1','--format=%s').decode().strip()=='feat(simulation): player money, weekly levy and donations'
assert git('branch','--show-current').decode().strip()=='feat/money-purse'
assert not git('diff','--cached','--name-only')
pins={
 'existing-file-replacements.json':'65521425c08f61807d2e6156f5c7ee51ac02aaca1a0c5c2163ac83018670f4fc',
 'generated-byte-proposals.json':'2087566d2db027c2bbb1197e2185d133b26991887aee884b39e761adc44dd930',
}
entries={}
for n,hash in pins.items():
    raw=(root/n).read_bytes()
    assert digest(raw)==hash,n
    for e in json.loads(raw)['entries']:
        p=e['path']
        if p.startswith(('packages/ui/','tests/e2e/')):
            assert digest(e['after'].encode('utf-8'))==e['proposedBytes']['sha256'],p
            if 'before' in e:
                assert git('show',f'{base}:{p}').replace(b'\r\n',b'\n')==e['before'].encode('utf-8').replace(b'\r\n',b'\n'),p
            entries[p]=e

sealed={p:e['after'] for p,e in entries.items()}
after=sealed.copy()
def edit(path,*pairs):
    src=after[path]
    crlf='\r\n' in src and '\n' not in src.replace('\r\n','')
    if crlf:src=src.replace('\r\n','\n')
    for a,b,n in pairs:
        assert src.count(a)==n,(path,a,src.count(a),n)
        src=src.replace(a,b)
    after[path]=src.replace('\n','\r\n') if crlf else src

u='packages/ui/src/'
e='tests/e2e/'
edit(u+'purse-view.ts',
    ('import { levySatisfactionCost, PURSE_TRIAL, type PlayerCharacter }',
     'import { donationGoldMilli, levySatisfactionCost, PURSE_TRIAL, type DifficultyId, type PlayerCharacter }',1),
    ("input: string, locked: boolean) {","input: string, locked: boolean, difficulty: DifficultyId) {",1),
    ('    amountMilli,\n','    amountMilli,\n    goldMilli: amountMilli === null ? null : donationGoldMilli(amountMilli, difficulty),\n',1))
edit(u+'PursePanel.svelte',
    ('import type { PlayerCharacter }','import type { DifficultyId, PlayerCharacter }',1),
    ('  export let locked: boolean;','  export let locked: boolean;\n  export let difficulty: DifficultyId;',1),
    ('purseControls(purse, input, locked)','purseControls(purse, input, locked, difficulty)',2),
    ('Donation amount in Gold','Donation amount in Money',1),
    ('    {#if controls.donateReason}<p id="purse-donate-reason">{controls.donateReason}</p>{/if}',
     """    {#if controls.donateReason}<p id="purse-donate-reason">{controls.donateReason}</p>
    {:else if controls.amountMilli !== null && controls.goldMilli !== null}
      <p>{formatMilli(controls.amountMilli)} Money → {formatMilli(controls.goldMilli)} Gold</p>
    {/if}""",1))
edit(u+'CharacterLifeShell.svelte',
    ('<PursePanel purse={storageSession.player.purse} {locked}', '<PursePanel purse={storageSession.player.purse} difficulty={state.society!.difficulty} {locked}',1))
edit(u+'WorkshopPanel.svelte',
    ("{order.paidWithMoney ? 'Money' : 'Gold'}",'Money',1))
edit(u+'report-letters.ts',
    ('levyPaidMilli, donationsMilli, moneyAfterMilli','levyPaidMilli, donationsMilli, donationGoldMilli, moneyAfterMilli',1),
    ("signedMilli(-donationsMilli) + ' Money'","`${signedMilli(-donationsMilli)} Money · ${signedMilli(donationGoldMilli)} Gold`",1))
edit(u+'__tests__/purse-view.test.ts',
    ("purseControls(purse, '3', false)","purseControls(purse, '3', false, 'normal')",1),
    ("donateReason: '', happinessCost: 0,","donateReason: '', happinessCost: 0, goldMilli: 3000,",1),
    ("  expect(purseControls({ ...purse, levyPercent: 20 }, '4', false))",
     "  expect(purseControls(purse, '3', false, 'easy').goldMilli).toBe(1500);\n  expect(purseControls({ ...purse, levyPercent: 20 }, '4', false, 'normal'))",1),
    ("purseControls(purse, '3', true)","purseControls(purse, '3', true, 'normal')",1),
    ('donationsMilli: 3000, moneyAfterMilli: 400','donationsMilli: 3000, donationGoldMilli: 3000, moneyAfterMilli: 400',1),
    ("{ label: 'Donation', value: '−3 Money' }", "{ label: 'Donation', value: '−3 Money · +3 Gold' }",1),
    ("""  expect(purseReportRows({ ...purse, moneyAfterMilli: 800 }, 'easy')[0].value).toBe(
    '+0.8 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall',
  );""",
     """  const easy = purseReportRows({ ...purse, donationGoldMilli: 1500, moneyAfterMilli: 800 }, 'easy');
  expect(easy[0].value).toBe('+0.8 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall');
  expect(easy[1]).toEqual({ label: 'Donation', value: '−3 Money · +1.5 Gold' });""",1))
edit(e+'character-life-navigation.helpers.ts',
    (r'/^(?:−([\d,.]+)|0) Money$/.exec(amounts[1])',
     r'/^(?:−([\d,.]+)|0) Money · (?:\+([\d,.]+)|0) Gold$/.exec(amounts[1])',1),
    ('donationsMilli: donated[1] ? milli(donated[1]) : 0, moneyAfterMilli: milli(balance[1]),',
     'donationsMilli: donated[1] ? milli(donated[1]) : 0,\n      donationGoldMilli: donated[2] ? milli(donated[2]) : 0, moneyAfterMilli: milli(balance[1]),',1))
edit(e+'purse.spec.ts',
    ('    const s = makeLife();','    const s = makeLife();\n    const easy = width === 1600;\n    s.city.society!.difficulty = easy ? \'easy\' : \'normal\';',1),
    ("    await expect(purse).toContainText('5 %');","    await expect(purse).toContainText('5 %');\n    await expect(purse).toContainText('Happiness cost: −3 a week');",1),
    ('Donation amount in Gold','Donation amount in Money',1),
    ("    await input.fill('1');","    await input.fill('1');\n    await expect(purse.getByText(easy ? '1 Money → 0.5 Gold' : '1 Money → 1 Gold', { exact: true })).toBeVisible();",1),
    ('    expect(r.report.purse?.donationsMilli).toBe(1000);',
     '    expect(r.report.purse?.donationsMilli).toBe(1000);\n    expect(r.report.purse?.donationGoldMilli).toBe(easy ? 500 : 1000);',1))

def changed():
    paths=set()
    for args in (['diff','--name-only','-z','HEAD'],['ls-files','--others','--exclude-standard','-z']):
        paths.update(filter(None,git(*args).decode().split('\0')))
    return paths
red={'tests/e2e/purse.spec.ts','packages/ui/src/__tests__/purse-view.test.ts'}
assert changed()==(set() if mode=='red' else red),changed()
selected=red if mode=='red' else set(after)
for p in selected:
    dst=wt/p
    if 'before' in entries[p]:
        old=git('show',f'HEAD:{p}').replace(b'\r\n',b'\n')
        assert dst.read_bytes().replace(b'\r\n',b'\n')==old,p
    elif p in red and mode=='green':
        assert dst.read_bytes()==after[p].encode('utf-8'),p
    else:
        assert not dst.exists(),p

for p in sorted(selected):
    (wt/p).write_bytes(after[p].encode('utf-8'))
payload={'simulationHead':head,'encoding':'UTF-8','entries':[
    {'path':p,'sealedAfter':sealed[p],'computedAfter':after[p],
     'sealedSha256':digest(sealed[p].encode('utf-8')),'appliedSha256':digest(after[p].encode('utf-8'))}
    for p in sorted(selected)]}
(out/('m22-'+mode+'-bytes.json')).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('M2.2',mode,len(selected))
