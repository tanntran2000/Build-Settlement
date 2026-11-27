from pathlib import Path
from hashlib import sha256
import json,subprocess

wt=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
local=Path('C:/Users/Admin/.t3/local-drafts/money-prM2')
out=local/'correction10'
out.mkdir(exist_ok=True)
head='546c48b9f312144c494a48dd44fe41741c9c2470'
def sha(b):return sha256(b).hexdigest()
assert sha((local/'binding-plan-a5ef4bb.md').read_bytes())=='6579bbe220d290df9eb56bad641a5ca1fff5aa56e8267f946669dc3560341da5'
assert sha((local/'astra-review/astra-round1.md').read_bytes())=='2679f41512fe7669d631b8dbe9f73fbd7070da74e5e1dcfe171713c9e62a3376'
def git(*args):return subprocess.check_output(['git',*args],cwd=wt)
assert git('rev-parse','HEAD').decode().strip()==head
assert not git('status','--porcelain=v1')
entries={}
def change(path,*pairs):
    if path in entries: old_data=entries[path]['after'].encode('utf-8')
    else: old_data=(wt/path).read_bytes()
    assert old_data.replace(b'\r\n',b'\n')==git('show',f'{head}:{path}').replace(b'\r\n',b'\n') or path in entries
    crlf=b'\r\n' in old_data
    old=old_data.decode('utf-8')
    new=old.replace('\r\n','\n')
    for a,b in pairs:
        assert new.count(a)==1,(path,new.count(a),a)
        new=new.replace(a,b)
    new=new.replace('\n','\r\n') if crlf else new
    original=entries[path]['before'] if path in entries else old
    assert new.endswith('\n')==original.endswith('\n')
    entries[path]={'path':path,'before':original,'after':new,'beforeSha256':sha(original.encode('utf-8')),'afterSha256':sha(new.encode('utf-8'))}

u='packages/ui/src/'
c='packages/core/src/'
s='packages/simulation/src/'
e='tests/e2e/'
p=c+'trial/__tests__/difficulty.test.ts'
change(p,("it('floors the scaled milli amount and keeps Normal exact', () => {","""it('refuses a zero Easy levy divisor at its catalog path', () => {
  const data = structuredClone(tuningJson);
  data.DIFFICULTY_TRIAL.profiles.easy.levyMoneyBps = 0;
  let message: string | undefined;
  try {
    validateTuning(data);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    message = error.message;
  }
  expect(message).toBe('tuning.json#DIFFICULTY_TRIAL.profiles.easy.levyMoneyBps: expected integer > 0');
});

it('floors the scaled milli amount and keeps Normal exact', () => {"""))
change(c+'__tests__/catalog-data.test.ts',
    ('      DIFFICULTY_TRIAL, PURSE_TRIAL: Object.freeze({','      DIFFICULTY_TRIAL, PURSE_TRIAL: {'),
    ('        donateSatisfactionCapPerWeek: PURSE_TRIAL.donateSatisfactionCapPerWeek,\n      }),',
     '        donateSatisfactionCapPerWeek: PURSE_TRIAL.donateSatisfactionCapPerWeek,\n      },'),
    ('  else Object.values(view).forEach(frozen);',"""  else for (const [key, value] of Object.entries(view)) {
    frozen(entry.file === 'tuning.json' && key === 'PURSE_TRIAL' ? PURSE_TRIAL : value);
  }"""))
change(s+'__tests__/craft-command.test.ts',
    ('    stockRecipe(s,recipeId);s.player.purse.moneyMilli=1000;\n    expect(items(act(s,\'PLACE_CRAFT_ORDER\',{tileId,recipeId})).workshops![tileId].orders).toHaveLength(1);',
     """    stockRecipe(s,recipeId);s.player.purse.moneyMilli=1000;goldStock(s).gold=0;
    const next=act(s,'PLACE_CRAFT_ORDER',{tileId,recipeId});
    expect(items(next).workshops![tileId].orders).toHaveLength(1);
    expect(next.player.purse.moneyMilli).toBe(0);
    expect(goldStock(next).gold).toBe(0);"""))
change(u+'__tests__/crafting-view.test.ts',
    ('s.city.society!.stocksMilli.herbs = 0; s.player.purse.moneyMilli = 1000;',
     's.city.society!.stocksMilli.herbs = 0; s.player.purse.moneyMilli = 1000; stock(s).gold = 0;'))
change(s+'__tests__/purse-week.test.ts',
    ('    expect(runLevyWeek(s, 24019)).toMatchObject({ levyDueMilli: 1200, levyPaidMilli: 1200, moneyAfterMilli: 2400 });',
     """    expect(runLevyWeek(s, 24019)).toStrictEqual({
      levyPercent: 5, levyDueMilli: 1200, levyPaidMilli: 1200,
      donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 2400,
    });"""))

path=u+'__tests__/purse-view.test.ts'
original=(wt/path).read_text(encoding='utf-8')
start=original.index("it('parses whole digits")
end=original.index("it('shows both purse transactions", start)
change(path,(original[start:end],"""it('parses whole digits and explains all disabled purse actions', () => {
  const purse = { levyPercent: 0, donatedThisWeekMilli: 0, moneyMilli: 3000, robbery: null };
  expect(parseDonationMilli('03')).toBe(3000);
  expect(purseControls(purse, '3', false, 'normal')).toStrictEqual({
    amountMilli: 3000, goldMilli: 3000, happinessCost: 0, levyCost: 0, donationOffset: 0,
    decreaseReason: 'Weekly levy is at its minimum.', increaseReason: '', donateReason: '',
  });
  expect(purseControls(purse, '3', false, 'easy').goldMilli).toBe(1500);
  expect(purseControls({ ...purse, levyPercent: 20 }, '4', false, 'normal')).toStrictEqual({
    amountMilli: 4000, goldMilli: 4000, happinessCost: 21, levyCost: 21, donationOffset: 0,
    decreaseReason: '', increaseReason: 'Weekly levy is at its maximum.', donateReason: 'Not enough Money.',
  });
  expect(purseControls(purse, '3', true, 'normal')).toStrictEqual({
    amountMilli: 3000, goldMilli: 3000, happinessCost: 0, levyCost: 0, donationOffset: 0,
    decreaseReason: 'Plan next week before changing the purse.',
    increaseReason: 'Plan next week before changing the purse.',
    donateReason: 'Plan next week before changing the purse.',
  });
  expect(itemError('NOT_ENOUGH_MONEY')).toBe('Not enough Money.');
});

it.each([['normal', 1, 2], ['easy', 2, 1]] as const)(
  'previews the effective %s Happiness cost from saved donations', (difficulty, cost, offset) => {
    const purse = { levyPercent: 5, donatedThisWeekMilli: 2000, moneyMilli: 1000, robbery: null };
    const controls = purseControls(purse, '', false, difficulty);
    expect(controls.happinessCost).toBe(cost);
    expect(controls).toStrictEqual({
      amountMilli: null, goldMilli: null, happinessCost: cost, levyCost: 3, donationOffset: offset,
      decreaseReason: '', increaseReason: '', donateReason: 'Enter a positive whole amount.',
    });
  },
);

"""),
("""  expect(easy[0].value).toBe('+0.8 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall');
  expect(easy[1]).toEqual({ label: 'Donation', value: '−3 Money · +1.5 Gold' });""",
"""  expect(easy).toStrictEqual([
    { label: 'Levy', value: '+0.8 Money · 5% · 0.4 of 1.2 Gold paid · 0.8 Gold shortfall' },
    { label: 'Donation', value: '−3 Money · +1.5 Gold' },
    { label: 'Money after', value: '0.8 Money' },
  ]);"""))

path=s+'__tests__/purse-command.test.ts'
old=(wt/path).read_text(encoding='utf-8')
a=old.index("vi.mock(")
b=old.index("function make()",a) if "function make()" in old[a:] else old.index("function make(",a)
change(path,("import { expect, it, vi }","import { expect, it }"),(old[a:b],''))
a=old.index('it.each([21')
b=old.index("it.each([['normal', 3000]",a)
change(path,(old[a:b],"""function close(s: CharacterLifeSessionState) {
  const result = act(s, 'END_WEEK', { expectedWeek: s.city.world.week });
  if (!result.report) throw Error('Expected End Week report');
  return { ...result, report: result.report };
}

function refused(s: CharacterLifeSessionState, command: object, code: string, message: string) {
  const before = structuredClone(s);
  expect(executeCharacterLifeCommand(s, command)).toStrictEqual({ success: false, error: { code, message } });
  expect(s).toStrictEqual(before);
}

it.each([21, 2.5, -1, '5', Infinity])('refuses levy %s without mutation', percent => {
  const s = make();
  refused(s, { type: 'SET_LEVY', expectedRevision: s.city.revision, percent },
    'INVALID_AMOUNT', 'Enter a whole levy percent from 0 to 20.');
});

it.each([
  [0, 'INVALID_AMOUNT', 'Enter a positive whole amount.'],
  [1500, 'INVALID_AMOUNT', 'Enter a positive whole amount.'],
  [3000, 'NOT_ENOUGH_MONEY', 'Not enough Money.'],
] as const)('refuses donation %i without mutation', (amountMilli, code, message) => {
  const s = make();
  refused(s, { type: 'DONATE_MONEY', expectedRevision: s.city.revision, amountMilli }, code, message);
});

it.each([
  ['SET_LEVY', { percent: 5 }],
  ['DONATE_MONEY', { amountMilli: 1000 }],
] as const)('refuses %s in Report or with an invalid command envelope', (type, fields) => {
  const s = act(make(), 'SET_LEVY', { percent: 2 }).next;
  s.player.purse.moneyMilli = 1000;
  const report = close(s).next;
  refused(report, { type, expectedRevision: report.city.revision, ...fields },
    'FORBIDDEN', 'Plan next week before changing the purse.');
  refused(s, { type, expectedRevision: s.city.revision - 1, ...fields },
    'STALE_COMMAND', 'The purse changed. Try again.');
  for (const command of [
    { type, expectedRevision: s.city.revision },
    { type, ...fields },
    { type, expectedRevision: s.city.revision, ...fields, extra: true },
  ]) refused(s, command, 'INVALID_COMMAND', 'Command must contain plain data fields.');
});

"""))
a=old.index('it.each([2, 5, 10, 20]')
b=old.index("it('keeps NPC acquisition",a)
change(path,(old[a:b],"""function fundedControl(s: CharacterLifeSessionState, goldMilli: number, percent = 0) {
  const control = act(s, 'SET_LEVY', { percent }).next;
  stock(control).gold += goldMilli;
  return control;
}

it.each([2, 5, 10, 20].flatMap(percent => (['normal', 'easy'] as const).map(difficulty => ({ percent, difficulty }))))(
  'returning the whole levy at percent $percent in $difficulty creates no Gold or Happiness', ({ percent, difficulty }) => {
    const initial = make(difficulty);
    const world = initial.city.world;
    // 1,250 residents at 240 milli each give 300 Gold with no Goods or law revenue.
    initial.city.society!.classes.free += 1150;
    world.settlements[world.activeSettlementId!].cohorts[0].count = 1250;
    stock(initial).food = 200000;
    stock(initial).gold = 1000000;
    const closed = close(act(initial, 'SET_LEVY', { percent }).next);
    const paid = 3000 * percent;
    const receipt = paid * (difficulty === 'easy' ? 2 : 1);
    expect(closed.report.taxMilli).toBe(300000);
    expect(closed.report.purse!.levyPaidMilli).toBe(paid);
    expect(closed.next.player.purse.moneyMilli).toBe(receipt);
    const planning = act(closed.next, 'NEXT_WEEK').next;
    const control = fundedControl(planning, paid);
    const donated = act(planning, 'DONATE_MONEY', { amountMilli: receipt }).next;
    expect(donated.player.purse.moneyMilli).toBe(0);
    expect(stock(donated).gold).toBe(closed.report.after.gold + paid);
    expect(stock(donated)).toStrictEqual(stock(control));
    expect(donated.city.happiness).toBe(planning.city.happiness);
    const unlevied = close(control), afterDonation = close(donated);
    expect(unlevied.report.purse!.donationsMilli).toBe(0);
    expect(afterDonation.next.city.happiness).toBeLessThanOrEqual(unlevied.next.city.happiness);
    if (percent === 2)
      expect(afterDonation.next.city.society!.satisfaction).toStrictEqual(unlevied.next.city.society!.satisfaction);
  });

it.each([0, 1, 2].flatMap(percent => (['normal', 'easy'] as const).map(difficulty => ({ percent, difficulty }))))(
  'at $percent percent, a positive $difficulty donation leaves Happiness and class scores at the zero-levy control', ({ percent, difficulty }) => {
    const s = make(difficulty);
    s.player.purse.moneyMilli = 4000;
    const gold = difficulty === 'easy' ? 2000 : 4000;
    const control = fundedControl(s, gold);
    const levied = act(s, 'SET_LEVY', { percent }).next;
    const donated = act(levied, 'DONATE_MONEY', { amountMilli: 4000 }).next;
    expect(stock(donated)).toStrictEqual(stock(control));
    const afterDonation = close(donated), baseline = close(control);
    expect(afterDonation.report.purse!.donationGoldMilli).toBe(gold);
    expect(baseline.report.purse!.donationsMilli).toBe(0);
    expect(afterDonation.next.city.society!.satisfaction).toStrictEqual(baseline.next.city.society!.satisfaction);
    expect(afterDonation.next.city.happiness).toBe(baseline.next.city.happiness);
    expect(afterDonation.report.happinessAfter).toBe(baseline.report.happinessAfter);
  });

it('keeps a funded citizen class at zero through the combined adjustment and compares the aggregate', () => {
  let s = make();
  s.city.society!.satisfaction.free = 0;
  s.player.purse.moneyMilli = 2000;
  stock(s).food = 0;
  stock(s).gold = 1000000;
  for (const tileId of ['field-1', 'plain-1', 'spec-1']) s = act(s, 'SET_ENABLED', { tileId, enabled: false }).next;
  const zero = fundedControl(s, 2000);
  const levy = act(s, 'SET_LEVY', { percent: 5 }).next;
  const donated = act(levy, 'DONATE_MONEY', { amountMilli: 2000 }).next;
  expect(stock(donated)).toStrictEqual(stock(zero));
  const baseline = close(zero), result = close(donated);
  const baseFree = baseline.report.society!.classes.free;
  expect(baseFree.foodBps).toBe(0);
  expect(baseFree.goodsBps).toBe(0);
  expect(baseFree.satisfactionBefore).toBe(0);
  expect(baseFree.satisfactionAfter).toBe(0);
  expect(baseline.report.order!.satisfactionLost).toBe(0);
  expect(result.report.society!.classes.free.satisfactionAfter).toBe(0);
  const scores = baseline.next.city.society!.satisfaction;
  const expected = { ...scores, free: 0, makers: scores.makers - 1, luminaries: scores.luminaries - 1, merchants: scores.merchants - 1 };
  expect(result.next.city.society!.satisfaction).toStrictEqual(expected);
  const { free, makers, luminaries, merchants } = baseline.next.city.society!.classes;
  const counts = [free, ...[makers, luminaries, merchants].map(group => group.common + group.elite)];
  const score = [expected.free, expected.makers, expected.luminaries, expected.merchants]
    .reduce((sum, value, index) => sum + value * counts[index], 0);
  const happiness = Number((score / counts.reduce((sum, n) => sum + n, 0)).toFixed(2));
  expect(result.next.city.happiness).toBe(happiness);
  expect(result.report.happinessAfter).toBe(happiness);
  expect(happiness).toBeLessThan(baseline.next.city.happiness);
});

it.each([['normal', 3000, 2, 1], ['easy', 1500, 1, 2]] as const)(
  'uses shipped %s Gold conversion and the capped offset including after save and reload', (difficulty, gold, offset, cost) => {
    const s = make(difficulty);
    s.player.purse.moneyMilli = 3000;
    const zero = fundedControl(s, gold);
    const withoutOffset = fundedControl(s, gold, 5);
    const levied = act(s, 'SET_LEVY', { percent: 5 }).next;
    const first = act(levied, 'DONATE_MONEY', { amountMilli: 1000 }).next;
    const saved = serializeCharacterLifeSave(first);
    if (!saved.success) throw Error(saved.error.message);
    const loaded = deserializeCharacterLifeSave(saved.text);
    if (!loaded.success) throw Error(loaded.error.message);
    expect(loaded.state).toStrictEqual(first);
    const donated = act(loaded.state, 'DONATE_MONEY', { amountMilli: 2000 }).next;
    expect(donated.player.purse.donatedThisWeekMilli).toBe(3000);
    expect(donated.city.society!.satisfaction).toStrictEqual(s.city.society!.satisfaction);
    expect(stock(donated)).toStrictEqual(stock(withoutOffset));
    const regular = close(withoutOffset).next;
    const unlevied = close(zero).next;
    const offsetWeek = close(donated);
    expect(offsetWeek.report.purse!.donationGoldMilli).toBe(gold);
    for (const key of ['free', 'makers', 'luminaries', 'merchants'] as const) {
      expect(offsetWeek.next.city.society!.satisfaction[key]).toBe(regular.city.society!.satisfaction[key] + offset);
      expect(offsetWeek.next.city.society!.satisfaction[key]).toBe(unlevied.city.society!.satisfaction[key] - cost);
    }
    expect(offsetWeek.next.city.society!.satisfaction.bound).toBe(regular.city.society!.satisfaction.bound);
    expect(offsetWeek.report.happinessAfter).toBe(Number((unlevied.city.happiness - cost).toFixed(2)));
  },
);

"""))

for p,entry in entries.items():
    (wt/p).write_bytes(entry['after'].encode('utf-8'))
(out/'unit-test-bytes.json').write_text(json.dumps({'baseHead':head,'entries':list(entries.values())},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(len(entries),'test paths')
