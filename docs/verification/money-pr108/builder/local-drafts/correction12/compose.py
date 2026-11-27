from pathlib import Path
from hashlib import sha256
from base64 import b64decode, b64encode
from difflib import unified_diff
import json
import subprocess

here = Path(__file__).resolve().parent
draft = here.parent
main = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scratch = Path((draft / '.scratch-path').read_text().strip())
head = '0b2b3a6088d003301d48b460202327fb53546ede'
sha = lambda b: sha256(b).hexdigest()
base_files = {}
files = {}
original_candidate = {}
reason = {}
C, S, U, E = 'packages/core/src/', 'packages/simulation/src/', 'packages/ui/src/', 'tests/e2e/'
for name, expected in [
    ('existing-file-replacements.json', '2b3ba81faa054ab44c0adc7d3ee9cf9b5582b0873d00b0008b0bed09e3086989'),
    ('generated-byte-proposals.json', '1396377240aeed6693505a7f43d3b8eea152385ab541465177d1cdb4a1b8ae71'),
]:
    raw = (draft / name).read_bytes()
    assert sha(raw) == expected
    for e in json.loads(raw)['files']:
        p = e['path']
        if 'beforeSha256' in e:
            base_files[p] = (main / p).read_bytes()
            assert sha(base_files[p]) == e['beforeSha256'], p
        else:
            assert not (main / p).exists(), p
        files[p] = b64decode(e['afterBase64'], validate=True)
        assert sha(files[p]) == e['afterSha256'], p
        original_candidate[p] = files[p]
        reason[p] = e['why']
touched = {}
def update(path, why, *changes):
    if path not in files:
        base_files[path] = (main / path).read_bytes()
        files[path] = base_files[path]
        original_candidate[path] = files[path]
        reason[path] = []
    v = files[path].decode('utf-8')
    eol = '\r\n' if '\r\n' in v else '\n'
    for a,b in changes:
        a,b = a.replace('\n',eol), b.replace('\n',eol)
        assert v.count(a) == 1, (path,a,v.count(a))
        v = v.replace(a,b,1)
    files[path] = v.encode()
    reason[path].append(why)
    touched.setdefault(path,[]).append(why)
update(C+'data/tuning.json','Apply the approved profile scalars.',
       ('"levyMoneyBps": 10000 }','"levyMoneyBps": 10000, "robberySafeBps": 10000 }'),
       ('"levyMoneyBps": 20000 }','"levyMoneyBps": 20000, "robberySafeBps": 20000 }'))
update(C+'data/validate.ts','Validate both safe scalars and keep the safe-amount overflow rule valid after scaling.',
       ('upkeepBps: number; levyMoneyBps: number;', 'upkeepBps: number; levyMoneyBps: number; robberySafeBps: number;'),
       ("""const difficultyProfileRule = (bps: Rule, levyMoneyBps: Rule = bps): Rule =>
    object({ taxBps: bps, goodsPriceBps: bps, lawPayBps: bps, upkeepBps: bps, levyMoneyBps });""",
        """const difficultyProfileRule = (bps: Rule, levyMoneyBps: Rule = bps, robberySafeBps: Rule = bps): Rule =>
    object({ taxBps: bps, goodsPriceBps: bps, lawPayBps: bps, upkeepBps: bps, levyMoneyBps, robberySafeBps });"""),
       ('easy: difficultyProfileRule(nonnegative, positive)', 'easy: difficultyProfileRule(nonnegative, positive, integerInRange(1, 100000))'),
       ("""    if (!Number.isSafeInteger(purse.robberySafeBaseMilli + 100 * purse.robberySafePerSecurityMilli))""",
        """    const maxSafeBps = Math.max(tuning.DIFFICULTY_TRIAL.profiles.normal.robberySafeBps,
        tuning.DIFFICULTY_TRIAL.profiles.easy.robberySafeBps);
    const safeAt100 = BigInt(purse.robberySafeBaseMilli) + 100n * BigInt(purse.robberySafePerSecurityMilli);
    if (safeAt100 * BigInt(maxSafeBps) / 10000n > BigInt(Number.MAX_SAFE_INTEGER))"""))
update(C+'character/purse.ts','Scale safe by profile and share the same spend check across simulation and UI.',
       ("import { createSeededRandom } from '../world/random.js';", "import { createSeededRandom } from '../world/random.js';\nimport type { PlayerCharacter } from './types.js';"),
       ("""export function safeAmountMilli(security: number): number {
  return PURSE_TRIAL.robberySafeBaseMilli + security * PURSE_TRIAL.robberySafePerSecurityMilli;
}""",
        """export function safeAmountMilli(security: number, difficulty: DifficultyId): number {
  const base = PURSE_TRIAL.robberySafeBaseMilli + security * PURSE_TRIAL.robberySafePerSecurityMilli;
  return applyDifficulty(base, difficultyProfile(difficulty).robberySafeBps);
}

export function canSpendMoney(purse: PlayerCharacter['purse'], amountMilli: number): boolean {
  return purse.moneyMilli - amountMilli >= (purse.robbery?.excessMilli ?? 0);
}"""),
       ("""  excessMilli: number, moneyMilli: number, security: number, option: 'pay' | 'let-go',""",
        """  excessMilli: number, option: 'pay' | 'let-go',"""),
       ("""return Math.min(applyDifficulty(excessMilli, rate), Math.max(0, moneyMilli - safeAmountMilli(security)));""",
        """return applyDifficulty(excessMilli, rate);"""))
update(C+'index.ts','Expose the spend guard alongside the purse math.',
       ('homeRobberyLossMilli, type HomeRobberyOption', 'homeRobberyLossMilli, canSpendMoney, type HomeRobberyOption'))
update(S+'purse-week.ts','Use the same per-difficulty safe amount as the purse projection.',
       ('safeAmountMilli(society!.order.security)', 'safeAmountMilli(society!.order.security, society!.difficulty)'))
update(S+'purse-command.ts','Protect the saved excess on donation and use the exact original excess for resolution.',
       ('  donationGoldMilli, hasWeeklyKeys,', '  canSpendMoney, donationGoldMilli, hasWeeklyKeys,'),
       ("homeRobberyLossMilli(card.excessMilli, purse.moneyMilli, security, option === 'pay' ? 'pay' : 'let-go')",
        "homeRobberyLossMilli(card.excessMilli, option === 'pay' ? 'pay' : 'let-go')"),
       ("if (amount > purse.moneyMilli) return fail('NOT_ENOUGH_MONEY', 'Not enough Money.');",
        "if (!canSpendMoney(purse, amount)) return fail('NOT_ENOUGH_MONEY', 'Not enough Money.');"))
update(S+'item-command.ts','Use the reserve for the shared item/potion purchase and crafting fee. Credit paths stay intact.',
       ('  hasWeeklyKeys, isLiveCharacterLifeSessionState,', '  canSpendMoney, hasWeeklyKeys, isLiveCharacterLifeSessionState,'),
       ("if(purse.moneyMilli<price)return fail('NOT_ENOUGH_MONEY');","if(!canSpendMoney(purse,price))return fail('NOT_ENOUGH_MONEY');"),
       ("if(purse.moneyMilli<recipe.feeMilli)return fail('NOT_ENOUGH_MONEY');","if(!canSpendMoney(purse,recipe.feeMilli))return fail('NOT_ENOUGH_MONEY');"))
update('scripts/money-calibration.ts','Use the saved difficulty for all measured safe thresholds.',
       ('const safeMoneyMilli = safeAmountMilli(security);','const safeMoneyMilli = safeAmountMilli(security, difficulty);'))

exec((here/'ui.pyfrag').read_text('utf-8'))
exec((here/'tests.pyfrag').read_text('utf-8'))
# The added reserve cases terminate with exactly one newline.
files['packages/simulation/src/__tests__/home-robbery.test.ts'] = files['packages/simulation/src/__tests__/home-robbery.test.ts'].rstrip(b'\n') + b'\n'

def stage(p):
    is_test = '/__tests__/' in p or p.startswith('tests/')
    ui = '/ui/' in p or p.startswith(('tests/e2e/','scripts/'))
    return ('ui-' if ui else 'simulation-') + ('tests' if is_test else 'product')

for name, paths in [
    ('existing-file-replacements.json', sorted(base_files)),
    ('generated-byte-proposals.json', sorted(set(files)-set(base_files))),
]:
    entries = []
    for p in paths:
        b = files[p]
        e = dict(path=p, stage=stage(p), why=reason[p], afterSha256=sha(b), afterBytes=len(b),
                 afterUtf8=b.decode('utf-8'), afterBase64=b64encode(b).decode())
        if p in base_files:
            e.update(beforeSha256=sha(base_files[p]), beforeBytes=len(base_files[p]))
        entries.append(e)
    (here/name).write_bytes((json.dumps({'base':head,'files':entries}, ensure_ascii=False,indent=2)+'\n').encode())
changes = []
for p in sorted(touched):
    a,b = original_candidate[p].decode(), files[p].decode()
    assert a != b, p
    changes.extend(unified_diff(a.splitlines(keepends=True), b.splitlines(keepends=True),
                                fromfile='step0/'+p, tofile='correction12/'+p))
(here/'correction12.diff').write_bytes(''.join(changes).replace('\r\n','\n').encode())
for p,b in files.items():
    path = scratch/p
    path.parent.mkdir(exist_ok=True, parents=True)
    path.write_bytes(b)
    assert sha(path.read_bytes()) == sha(b)
print('Exact scratch files:',len(files), 'Correction 12 amended:',len(touched))
for category in ['simulation-tests','simulation-product','ui-tests','ui-product']:
    print(category, sum(stage(p) == category for p in files))

