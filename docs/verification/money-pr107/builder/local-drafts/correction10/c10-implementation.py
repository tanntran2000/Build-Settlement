from pathlib import Path
from hashlib import sha256
import json,re,subprocess

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
out=Path('C:/Users/Admin/.t3/local-drafts/money-prM2/correction10')
head='546c48b9f312144c494a48dd44fe41741c9c2470'
def sha(b):return sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=wt)
assert git('rev-parse','HEAD').decode().strip()==head
red=(out/'red-product.txt').read_text(encoding='utf-8')
assert re.search(r'^Exit 1 in ',red,re.M)
for label in ('refuses a zero Easy levy divisor at its catalog path','previews the effective normal Happiness cost from saved donations','previews the effective easy Happiness cost from saved donations'):
    assert label in red,label
entries={}
existing=json.loads((out/'unit-test-bytes.json').read_bytes())['entries']
assert set(git('diff','--name-only').decode().splitlines())=={e['path'] for e in existing}
for e in existing:assert sha((wt/e['path']).read_bytes())==e['afterSha256'],e['path']
def change(path,*replacements):
    old=(wt/path).read_bytes()
    assert old.replace(b'\r\n',b'\n')==git('show',f'{head}:{path}').replace(b'\r\n',b'\n'),path
    after=old.decode('utf-8').replace('\r\n','\n')
    for find,replacement in replacements:
        assert after.count(find)==1,(path,after.count(find),find)
        after=after.replace(find,replacement)
    if b'\r\n' in old:after=after.replace('\n','\r\n')
    assert after.endswith('\n')==old.endswith(b'\n')
    entries[path]={'path':path,'before':old.decode('utf-8'),'after':after,
        'beforeSha256':sha(old),'afterSha256':sha(after.encode('utf-8'))}

change('packages/core/src/data/validate.ts',
    ('const difficultyProfileRule = (bps: Rule): Rule =>\n    object({ taxBps: bps, goodsPriceBps: bps, lawPayBps: bps, upkeepBps: bps, levyMoneyBps: bps });',
     'const difficultyProfileRule = (bps: Rule, levyMoneyBps: Rule = bps): Rule =>\n    object({ taxBps: bps, goodsPriceBps: bps, lawPayBps: bps, upkeepBps: bps, levyMoneyBps });'),
    ('easy: difficultyProfileRule(nonnegative)','easy: difficultyProfileRule(nonnegative, positive)'))
change('packages/ui/src/purse-view.ts',
    ("  const lockReason = locked ? 'Plan next week before changing the purse.' : '';\n  return {",
     """  const lockReason = locked ? 'Plan next week before changing the purse.' : '';
  const levyCost = levySatisfactionCost(purse.levyPercent);
  const donatedGoldMilli = donationGoldMilli(purse.donatedThisWeekMilli, difficulty);
  const happinessCost = levySatisfactionCost(purse.levyPercent, donatedGoldMilli);
  return {"""),
    ('    happinessCost: levySatisfactionCost(purse.levyPercent),',
     '    happinessCost,\n    levyCost,\n    donationOffset: levyCost - happinessCost,'))
change('packages/ui/src/PursePanel.svelte',
    ("  <p>Happiness cost: {controls.happinessCost ? '−' : ''}{controls.happinessCost} a week</p>",
     """  <p>
    Happiness cost: {controls.happinessCost ? '−' : ''}{controls.happinessCost} a week{controls.donationOffset
      ? ` (levy −${controls.levyCost}, donation +${controls.donationOffset})` : ''}
  </p>"""))

change('tests/e2e/character-life-navigation.helpers.ts',
    ('type CharacterLifeSessionState,type TileTrialReport','type CharacterLifeSessionState,type DifficultyId,type TileTrialReport'),
    ('export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {',
     """export async function expectReport(
  page: Page, expected: Readonly<TileTrialReport>, difficulty: DifficultyId = 'normal',
): Promise<TileTrialReport> {"""),
    ("    await expect(purse.locator('dt')).toHaveText(['Levy', 'Donation', 'Money after']);",
     """    const credit = expected.purse.levyPaidMilli * (difficulty === 'easy' ? 2 : 1);
    expect(levy[1]).toBe(credit === 0 ? '0' : `+${u(credit)}`);
    await expect(purse.locator('dt')).toHaveText(['Levy', 'Donation', 'Money after']);"""))
p='tests/e2e/purse.spec.ts'
change(p,
    ("    s.city.society!.difficulty = easy ? 'easy' : 'normal';",
     """    const difficulty = easy ? 'easy' : 'normal';
    s.city.society!.difficulty = difficulty;
    const effectiveCost = easy
      ? 'Happiness cost: −2 a week (levy −3, donation +1)'
      : 'Happiness cost: −1 a week (levy −3, donation +2)';"""),
    ("""    await expect(purse).toContainText('Safe amount — · At risk —');
    await expect(purse.getByRole('button', { name: 'Decrease weekly levy' })).toHaveAttribute('aria-disabled', 'true');
    const increase = purse.getByRole('button', { name: 'Increase weekly levy' });""",
     """    await expect(purse.getByText('Safe amount — · At risk —', { exact: true })).toBeVisible();
    const levy = purse.getByRole('group', { name: 'Weekly levy', exact: true });
    const percent = levy.locator('span');
    const decrease = levy.getByRole('button', { name: 'Decrease weekly levy', exact: true });
    const increase = levy.getByRole('button', { name: 'Increase weekly levy', exact: true });
    await expect(decrease).toHaveText('−');
    await expect(increase).toHaveText('+');
    await expect(decrease).toHaveAttribute('aria-disabled', 'true');
    await expect(purse.locator('#levy-decrease-reason')).toHaveText('Weekly levy is at its minimum.');"""),
    ("""    await expect(purse).toContainText('5 %');
    await expect(purse).toContainText('Happiness cost: −3 a week');""",
     """    await expect(percent).toHaveText('5 %');
    await expect(purse.getByText(/^Happiness cost:/)).toHaveText('Happiness cost: −3 a week');
    for (let i = 5; i < 20; i++) await increase.press('Enter');
    await expect(percent).toHaveText('20 %');
    await expect(increase).toHaveAttribute('aria-disabled', 'true');
    await expect(increase).toHaveAttribute('aria-describedby', 'levy-increase-reason');
    await expect(purse.locator('#levy-increase-reason')).toHaveText('Weekly levy is at its maximum.');
    await increase.press('Enter');
    await expect(percent).toHaveText('20 %');
    for (let i = 20; i > 5; i--) await decrease.press('Enter');
    await expect(percent).toHaveText('5 %');"""),
    ("    await expect(purse).toContainText('Not enough Money.');",
     "    await expect(purse.locator('#purse-donate-reason')).toHaveText('Not enough Money.');"),
    ("    await expect(purse).toContainText('Money 2');",
     """    await expect(donate).toHaveText('Donate');
    await expect(purse.getByText('Money 2', { exact: true })).toBeVisible();
    await input.fill('1');
    await donate.press('Enter');
    await expect(purse.getByText('Money 1', { exact: true })).toBeVisible();
    await expect(purse.getByText(/^Happiness cost:/)).toHaveText(effectiveCost);"""),
    ("""    expect(before.player.purse).toMatchObject({ moneyMilli: 2000, levyPercent: 5, donatedThisWeekMilli: 1000 });
    await go(page, 'session');""",
     """    expect(before.player.purse).toStrictEqual({ moneyMilli: 1000, levyPercent: 5, donatedThisWeekMilli: 2000, robbery: null });
    await go(page, 'city');
    await page.getByRole('button', { name: 'Select spec-1', exact: true }).click();
    const market = page.getByRole('region', { name: 'Item Market', exact: true });
    const unaffordable = before.city.society!.items.market.findIndex(offer => offer.priceMilli > before.player.purse.moneyMilli);
    expect(unaffordable).toBeGreaterThanOrEqual(0);
    const offers = market.getByRole('group', { name: 'Weekly offers', exact: true });
    await offers.getByRole('article').nth(unaffordable).getByRole('button', { name: 'Buy', exact: true }).click();
    await expect(market.getByRole('alert')).toHaveText('Not enough Money.');
    expect(await exportLife(page)).toStrictEqual(before);
    await go(page, 'session');"""),
    ("""    expect((await exportLife(page)).player.purse).toStrictEqual(before.player.purse);
    await importLife(page, before);""",
     """    expect((await exportLife(page)).player.purse).toStrictEqual(before.player.purse);
    await player.click();
    await expect(purse.getByText(/^Happiness cost:/)).toHaveText(effectiveCost);
    await page.keyboard.press('Escape');
    await importLife(page, before);"""),
    ("""    await page.getByTestId('life-end-week').click();
    expect((await expectReport(page, r.report)).purse).toStrictEqual(r.report.purse);
    expect(r.report.purse?.donationsMilli).toBe(1000);
    expect(r.report.purse?.donationGoldMilli).toBe(easy ? 500 : 1000);""",
     """    await page.getByTestId('life-end-week').click();
    await player.click();
    await expect(percent).toHaveText('5 %');
    await expect(decrease).toHaveAttribute('aria-disabled', 'true');
    await expect(increase).toHaveAttribute('aria-disabled', 'true');
    await expect(input).toBeDisabled();
    await expect(donate).toHaveAttribute('aria-disabled', 'true');
    const lockReason = 'Plan next week before changing the purse.';
    await expect(purse.locator('#levy-decrease-reason')).toHaveText(lockReason);
    await expect(increase).toHaveAttribute('aria-describedby', 'levy-decrease-reason');
    await expect(purse.locator('#purse-donate-reason')).toHaveText(lockReason);
    await increase.press('Enter');
    await expect(percent).toHaveText('5 %');
    await page.keyboard.press('Escape');
    expect((await expectReport(page, r.report, difficulty)).purse).toStrictEqual(r.report.purse);
    expect(r.report.purse?.levyPaidMilli).toBeGreaterThan(0);
    expect(r.report.purse?.donationsMilli).toBe(2000);
    expect(r.report.purse?.donationGoldMilli).toBe(easy ? 1000 : 2000);"""))

for p,e in entries.items():(wt/p).write_bytes(e['after'].encode('utf-8'))
(out/'implementation-bytes.json').write_text(json.dumps({'baseHead':head,'entries':list(entries.values())},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(len(entries),'implemented paths')
