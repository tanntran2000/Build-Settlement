from pathlib import Path
from hashlib import sha256
from base64 import b64encode
from difflib import unified_diff
import json, subprocess

draft = Path(__file__).resolve().parent
main = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
root = Path((draft / ".scratch-path").read_text(encoding="utf-8"))
changes = {}
reasons = {}
new = {}
def update(path, reason, *pairs):
    original = (main / path).read_bytes()
    before = changes.get(path, original).decode("utf-8")
    eol = "\r\n" if "\r\n" in before else "\n"
    for old, after in pairs:
        old = old.replace("\n", eol)
        after = after.replace("\n", eol)
        assert before.count(old) == 1, (path, old, before.count(old))
        before = before.replace(old, after, 1)
    changes[path] = before.encode()
    reasons.setdefault(path, []).append(reason)
def generate(path, reason, content):
    assert not (main / path).exists()
    new[path] = content.lstrip("\n").encode()
    reasons[path] = [reason]

values = {
    'robberySafeBaseMilli': 15000,
    'robberySafePerSecurityMilli': 250,
    'robberyChanceBpsPerGold': 120,
    'robberyChanceCapBps': 2500,
    'robberyRansomBps': 2500,
    'robberyLossBps': 6000,
    'robberyChaseSecurityMin': 15,
    'robberyChaseSuccessBpsPerSecurity': 250,
}
C = "packages/core/src/"
S = "packages/simulation/src/"
U = "packages/ui/src/"
E = "tests/e2e/"
def core():
    update(C+"data/tuning.json", "Ship eight candidate TRIAL values.",
        ('"donateSatisfactionCapPerWeek": 2\n', '"donateSatisfactionCapPerWeek": 2,\n'+
         ',\n'.join(f'    "{k}": {v}' for k,v in values.items())+'\n'))
    update(C+"data/validate.ts", "Declare and validate new tuning keys, the maximum safe balance, and strict ransom ordering.",
        ("        donateSatisfactionCapPerWeek: number;\n", "        donateSatisfactionCapPerWeek: number;\n"+
         ''.join(f"        {k}: number;\n" for k in values)),
        ("        donateSatisfactionCapPerWeek: integerInRange(0, 100),\n", """        donateSatisfactionCapPerWeek: integerInRange(0, 100),
        robberySafeBaseMilli: nonnegative,
        robberySafePerSecurityMilli: nonnegative,
        robberyChanceBpsPerGold: integerInRange(1, 10000),
        robberyChanceCapBps: integerInRange(1, 10000),
        robberyRansomBps: integerInRange(0, 10000),
        robberyLossBps: integerInRange(1, 10000),
        robberyChaseSecurityMin: integerInRange(0, 100),
        robberyChaseSuccessBpsPerSecurity: integerInRange(1, 10000),
"""),
        ("    const tuning = data as unknown as TuningCatalog;\n", """    const tuning = data as unknown as TuningCatalog;
    const purse = tuning.PURSE_TRIAL;
    if (!Number.isSafeInteger(purse.robberySafeBaseMilli + 100 * purse.robberySafePerSecurityMilli))
        fail('tuning.json#PURSE_TRIAL', 'robberySafePerSecurityMilli', 'expected a safe integer amount at Security 100');
    if (purse.robberyRansomBps >= purse.robberyLossBps)
        fail('tuning.json#PURSE_TRIAL', 'robberyRansomBps', 'expected less than robberyLossBps');
"""))
    update(C+"character/purse.ts", "Share safe exposure, exact loss, and deterministic salted draws.",
        ("export const PURSE_TRIAL", """import { mixSeed } from '../trial/crime.js';
import { createSeededRandom } from '../world/random.js';

export const PURSE_TRIAL"""),
        ("  return Number(BigInt(amountMilli) * 10000n / BigInt(levyMoneyBps));\n}\n", """  return Number(BigInt(amountMilli) * 10000n / BigInt(levyMoneyBps));
}

export type HomeRobberyOption = 'pay' | 'chase' | 'let-go';

const homeRobberySalts = { 'home-robbery': 0x48524f42, 'home-robbery-chase': 0x48524348 } as const;

export function homeRobberyRoll(seed: number, week: number, stream: keyof typeof homeRobberySalts): number {
  return createSeededRandom(mixSeed(mixSeed(seed, week), homeRobberySalts[stream]))() * 10000;
}

export function safeAmountMilli(security: number): number {
  return PURSE_TRIAL.robberySafeBaseMilli + security * PURSE_TRIAL.robberySafePerSecurityMilli;
}

export function homeRobberyChanceBps(excessMilli: number): number {
  if (excessMilli <= 0) return 0;
  const { robberyChanceBpsPerGold: rate, robberyChanceCapBps: cap } = PURSE_TRIAL;
  if (excessMilli >= Math.ceil(cap * 1000 / rate)) return cap;
  return Math.floor(excessMilli * rate / 1000);
}

export function homeRobberyChaseChanceBps(security: number): number {
  return Math.min(10000, security * PURSE_TRIAL.robberyChaseSuccessBpsPerSecurity);
}

export function homeRobberyLossMilli(
  excessMilli: number, moneyMilli: number, security: number, option: 'pay' | 'let-go',
): number {
  const rate = option === 'pay' ? PURSE_TRIAL.robberyRansomBps : PURSE_TRIAL.robberyLossBps;
  return Math.min(applyDifficulty(excessMilli, rate), Math.max(0, moneyMilli - safeAmountMilli(security)));
}
"""))
    update(C+"index.ts", "Expose shared purse math and option type through the package API.",
        ('export { levySatisfactionCost, levyDueMilli, donationGoldMilli } from "./character/purse.js";',
         '''export {
  levySatisfactionCost, levyDueMilli, donationGoldMilli, safeAmountMilli, homeRobberyChanceBps,
  homeRobberyRoll, homeRobberyChaseChanceBps, homeRobberyLossMilli, type HomeRobberyOption,
} from "./character/purse.js";'''))
    update(C+"trial/types.ts", "Add report-only result union inside the purse to preserve no-hit report shapes.",
        ("export interface PurseWeekReport {\n", """export type HomeRobberyReport =
  | { outcome: 'pending'; excessMilli: number }
  | { outcome: 'pay' | 'chase-success' | 'chase-failure' | 'let-go'; excessMilli: number; lossMilli: number };
export type HomeRobberyResolution = Exclude<HomeRobberyReport, { outcome: 'pending' }> & { week: number };

export interface PurseWeekReport {
  robbery?: Readonly<HomeRobberyReport>;
"""))
    update(C+"__tests__/catalog-data.test.ts", "Enumerate the eight fields in the existing strict tuning expectation and keep recursive freeze checking the export.",
        ("        donateSatisfactionCapPerWeek: PURSE_TRIAL.donateSatisfactionCapPerWeek;\n".replace(";",","),
          "        donateSatisfactionCapPerWeek: PURSE_TRIAL.donateSatisfactionCapPerWeek,\n"+
          ''.join(f"        {k}: PURSE_TRIAL.{k},\n" for k in values)))

def simulation():
    update(S+"purse-week.ts", "Check post-levy exposure on the isolated draft and report a hit only.",
        ("  applyDifficulty, difficultyProfile, donationGoldMilli, levyDueMilli, type CharacterLifeSessionState, type PurseWeekReport,",
         """  applyDifficulty, difficultyProfile, donationGoldMilli, levyDueMilli, homeRobberyChanceBps, homeRobberyRoll, safeAmountMilli,
  type CharacterLifeSessionState, type HomeRobberyReport, type PurseWeekReport,"""),
        ("    donationGoldMilli: donationGoldMilli(purse.donatedThisWeekMilli, society!.difficulty), moneyAfterMilli,\n  });\n}\n",
         """    donationGoldMilli: donationGoldMilli(purse.donatedThisWeekMilli, society!.difficulty), moneyAfterMilli,
  });
}

export function runHomeRobberyCheck(session: CharacterLifeSessionState, week: number): Readonly<HomeRobberyReport> | undefined {
  const { world, society } = session.city;
  const purse = session.player.purse;
  if (society!.crisis.stage === 'fallen') return;
  const excessMilli = purse.moneyMilli - safeAmountMilli(society!.order.security);
  if (excessMilli <= 0) return;
  const chanceBps = homeRobberyChanceBps(excessMilli);
  if (chanceBps === 0 || homeRobberyRoll(world.worldMetadata.worldSeed, week, 'home-robbery') >= chanceBps) return;
  purse.robbery = { id: 'home-robbery-w' + week, week, excessMilli };
  return Object.freeze({ outcome: 'pending', excessMilli });
}
"""))
    update(S+"character-life-command.ts", "Join the End Week lock at the Player-aware boundary and use the reserved opportunity after levy.",
        ("type CharacterLifeSessionState, type TileTrialReport", "type CharacterLifeSessionState, type HomeRobberyResolution, type TileTrialReport"),
        ("import { runLevyWeek }", "import { runHomeRobberyCheck, runLevyWeek }"),
        ("report?: Readonly<TileTrialReport> }", "report?: Readonly<TileTrialReport>; robberyResolution?: Readonly<HomeRobberyResolution> }"),
        ("  if (type === 'ANSWER_NOTICE') return answerNotice(session, raw);", """  if (type === 'ANSWER_NOTICE') return answerNotice(session, raw);
  if (type === 'END_WEEK' && session.player.purse.robbery && Object.getOwnPropertyDescriptor(raw as object, 'expectedRevision')?.value === session.city.revision) {
    return fail('CARD_PENDING', session.city.society?.pendingCard ? 'Answer the crisis first.' : 'Answer the robbery first.');
  }"""),
        ("&& !session.city.society?.pendingCard\n", "&& !session.city.society?.pendingCard && !session.player.purse.robbery\n"),
        ("      // M3 inserts the home robbery check here, before the weekly donation reset.", "      const robbery = runHomeRobberyCheck(next, report.week);"),
        ("report = Object.freeze({ ...report, after, purse });", "report = Object.freeze({ ...report, after, purse: robbery ? Object.freeze({ ...purse, robbery }) : purse });"))
    update(S+"purse-command.ts", "Route and validate the exact answer shape; debit Money, clear card, increment revision, and return an unsaved outcome.",
        ("  donationGoldMilli, hasWeeklyKeys, isLiveCharacterLifeSessionState, PURSE_TRIAL,\n  type CharacterLifeSessionState,",
         """  donationGoldMilli, hasWeeklyKeys, homeRobberyChaseChanceBps, homeRobberyLossMilli, homeRobberyRoll,
  isLiveCharacterLifeSessionState, PURSE_TRIAL, type CharacterLifeSessionState, type HomeRobberyResolution,"""),
        ("['SET_LEVY', 'DONATE_MONEY']", "['SET_LEVY', 'DONATE_MONEY', 'ANSWER_ROBBERY']"),
        ("{ SET_LEVY: 'percent', DONATE_MONEY: 'amountMilli' }", "{ SET_LEVY: 'percent', DONATE_MONEY: 'amountMilli', ANSWER_ROBBERY: 'option' }"),
        ("    return fail('FORBIDDEN', 'Plan next week before changing the purse.');", """    return type === 'ANSWER_ROBBERY'
      ? fail('FORBIDDEN', 'Choose Plan next week to answer.')
      : fail('FORBIDDEN', 'Plan next week before changing the purse.');"""),
        ("  if (type === 'SET_LEVY') {", """  let robberyResolution: Readonly<HomeRobberyResolution> | undefined;
  if (type === 'ANSWER_ROBBERY') {
    const { option } = raw;
    if (option !== 'pay' && option !== 'chase' && option !== 'let-go')
      return fail('UNKNOWN_OPTION', 'Choose Pay, Chase or Let go.');
    const card = purse.robbery;
    if (!card) return fail('UNKNOWN_CARD', 'No home robbery is pending.');
    const { society, world } = next.city;
    if (society!.pendingCard) return fail('CARD_PENDING', 'Answer the crisis first.');
    const { security } = society!.order;
    if (option === 'chase' && security < PURSE_TRIAL.robberyChaseSecurityMin)
      return fail('CHASE_UNAVAILABLE', 'Needs Security ' + PURSE_TRIAL.robberyChaseSecurityMin + '.');
    const chased = option === 'chase' &&
      homeRobberyRoll(world.worldMetadata.worldSeed, card.week, 'home-robbery-chase') < homeRobberyChaseChanceBps(security);
    const lossMilli = chased ? 0 :
      homeRobberyLossMilli(card.excessMilli, purse.moneyMilli, security, option === 'pay' ? 'pay' : 'let-go');
    purse.moneyMilli -= lossMilli;
    purse.robbery = null;
    robberyResolution = Object.freeze({
      week: card.week, excessMilli: card.excessMilli, lossMilli,
      outcome: option === 'chase' ? (chased ? 'chase-success' : 'chase-failure') : option,
    });
  } else if (type === 'SET_LEVY') {"""),
        ("  return { success: true, next };", "  return { success: true, next, ...(robberyResolution ? { robberyResolution } : {}) };"))
    update(S+"character-life-observation.ts", "Advertise only phase- and card-eligible actions and disable End Week while either card remains.",
        ("  if (city.phase === 'report') disabledReasons.push", """  const crisis = city.society?.pendingCard;
  const robbery = session.player.purse.robbery;
  if (crisis || robbery) disabledReasons.push(crisis ? 'Answer the crisis first.' : 'Answer the robbery first.');
  if (city.phase === 'report') disabledReasons.push"""),
        ("""    actionTypes: city.phase === 'report' ? ['NEXT_WEEK']
      : ['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED', 'END_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC',
        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING', ...PURSE_COMMAND_TYPES] as const : []),""",
         """    actionTypes: city.phase === 'report'
      ? ['NEXT_WEEK', ...(crisis ? ['CHOOSE_CARD_OPTION'] as const : [])]
      : ['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED',
        ...(crisis || robbery ? [] : ['END_WEEK'] as const), 'ASSIGN_NPC', 'UNASSIGN_NPC',
        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING', ...PURSE_COMMAND_TYPES.filter(type =>
          type !== 'ANSWER_ROBBERY' || (robbery && !crisis))] as const : []),
        ...(crisis ? ['CHOOSE_CARD_OPTION'] as const : []),"""))
    update(S+"__tests__/lord-health.test.ts", "Keep the closed-city command enumeration exhaustive.",
        ("'SET_LEVY','DONATE_MONEY',...ITEM_COMMAND_TYPES", "'SET_LEVY','DONATE_MONEY','ANSWER_ROBBERY',...ITEM_COMMAND_TYPES"))


def calibration():
    update("scripts/money-calibration.ts", "Keep current routes and Gold reconciliation, measure end-of-week exposure and answer hits by a fixed pay policy.",
        ("crisisStage: string; tension: number; hungry: boolean;",
         """security: number; safeMoneyMilli: number; robberyExcessMilli: number; robberyChanceBps: number;
  robberyHit: boolean; robberyLossMilli: number; moneyAfterAnswerMilli: number;
  crisisStage: string; tension: number; hungry: boolean;"""),
        ("buildItemWeekContext, crisisOptions, societyPopulation }", "buildItemWeekContext, crisisOptions, societyPopulation, safeAmountMilli, homeRobberyChanceBps }"),
        ("    const closeAfterAnswer = inventory(state).gold, fallen = state.city.society!.crisis.stage === 'fallen';",
         """    const closeAfterAnswer = inventory(state).gold, fallen = state.city.society!.crisis.stage === 'fallen';
    const security = report.order!.after.security;
    const safeMoneyMilli = safeAmountMilli(security);
    const robberyExcessMilli = Math.max(0, report.purse.moneyAfterMilli - safeMoneyMilli);
    const robberyHit = report.purse.robbery?.outcome === 'pending';
    let robberyLossMilli = 0;
    if (robberyHit) {
      act('NEXT_WEEK');
      act('ANSWER_ROBBERY', { option: 'pay' });
      robberyLossMilli = report.purse.moneyAfterMilli - state.player.purse.moneyMilli;
    }"""),
        ("moneyAfterMilli: report.purse.moneyAfterMilli, crisisStage:", """moneyAfterMilli: report.purse.moneyAfterMilli, security, safeMoneyMilli, robberyExcessMilli,
      robberyChanceBps: fallen ? 0 : homeRobberyChanceBps(robberyExcessMilli), robberyHit,
      robberyLossMilli, moneyAfterAnswerMilli: state.player.purse.moneyMilli,
      crisisStage:"""),
        ("    act('NEXT_WEEK');\n  }", "    if (!robberyHit) act('NEXT_WEEK');\n  }"),
        ("      first15Money:run.find", """      firstAboveSafe:run.find(row=>row.robberyExcessMilli>0)?.week??null,
      robberies:run.filter(row=>row.robberyHit).length,
      robberyLossMilli:run.reduce((sum,row)=>sum+row.robberyLossMilli,0),
      first15Money:run.find"""),
        ("JSON.stringify({schemaVersion:2,", "JSON.stringify({schemaVersion:3,"))

def seal():
    files = []
    generated = []
    diff = ''
    for path, after in sorted({**changes, **new}.items()):
        f = root / path
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(after)
        before = (main / path).read_bytes() if path in changes else b''
        text = after.decode('utf-8')
        data = dict(path=path, why=reasons[path], afterSha256=sha256(after).hexdigest(),
                    afterUtf8=text, afterBase64=b64encode(after).decode(), afterBytes=len(after))
        if path in changes:
            data.update(beforeSha256=sha256(before).hexdigest(), beforeBytes=len(before))
        (files if path in changes else generated).append(data)
        diff += ''.join(unified_diff(before.decode().splitlines(keepends=True), text.splitlines(keepends=True),
                                    fromfile='a/'+path if before else '/dev/null', tofile='b/'+path)).replace('\r\n','\n')
    for name, entries in [('existing-file-replacements', files), ('generated-byte-proposals', generated)]:
        (draft/(name+'.json')).write_bytes((json.dumps({'base':'0b2b3a6088d003301d48b460202327fb53546ede','files':entries},
                                                       indent=2, ensure_ascii=False)+'\n').encode())
    (draft/'change-index.diff').write_bytes(diff.encode())

core()
simulation()
exec((draft/'compose-ui.pyfrag').read_text(encoding='utf-8'))
ui()
exec((draft/'compose-calibration.pyfrag').read_text(encoding='utf-8').split('\ncore()\n')[0])
calibration()
test_file = draft/'compose-tests.pyfrag'
if test_file.exists():
    exec(test_file.read_text(encoding='utf-8'))
    tests()
seal()

