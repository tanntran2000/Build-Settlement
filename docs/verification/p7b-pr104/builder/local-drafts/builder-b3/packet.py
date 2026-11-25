import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

EVIDENCE = Path(__file__).resolve().parent
PACKET = EVIDENCE.parent
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
BASE = 'b184357d235d164478584e36b96d063551124e66'
CORE = 'packages/core/src/'
SIM = 'packages/simulation/src/'
UI = 'packages/ui/src/'
PERSIST = 'packages/persistence/src/'
GOLDEN = SIM + '__tests__/fixtures/catalog-golden.json'
FIXTURE_DIR = PERSIST + '__tests__/fixtures/society-v13/'
AUCTIONS = SIM + 'npc-auction.ts'
ACQUISITION = SIM + 'npc-acquisition.ts'
STOCK_TEST = SIM + '__tests__/npc-acquisition.test.ts'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
def digest(data):
    return hashlib.sha256(data).hexdigest()
def packet_file(name, expected):
    data = (PACKET / name).read_bytes()
    if digest(data) != expected:
        raise ValueError(f'Unapproved packet bytes: {name}')
    return json.loads(data)
patch = packet_file('source-replacements.json', 'fd02c1c4bf598a8097c2b84a3135f42689946e41b0f58316a444ac6cd9e07fd0')
additions = packet_file('generated-byte-proposals.json', 'ca4d2c1fb31e4d6e9050605cd9f9286ea04b591e11145487183612237b1d3e25')

def approved():
    files = {}
    for row in patch['files']:
        path = row['path']
        data = git('cat-file','blob',BASE+':'+path)
        assert digest(data) == row['before']['sha256']
        for hunk in reversed(row['replacements']):
            start,end = hunk['startByte'],hunk['endByte']
            assert data[start:end] == hunk['before'].encode('utf-8'), path
            data = data[:start] + hunk['after'].encode('utf-8') + data[end:]
        assert digest(data) == row['after']['sha256']
        files[path] = data
    for row in additions['files']:
        data = row['text'].encode('utf-8')
        assert digest(data) == row['sha256']
        files[row['path']] = data
    return files

def selected_stage(path):
    if ((path.startswith(UI) and '/__tests__/' not in path) or
         path in [UI+'__tests__/acquisition-view.test.ts','tests/e2e/acquisition.spec.ts',
                  'tests/e2e/character-life-navigation.helpers.ts', SIM+'index.ts',
                  SIM+'character-life-observation.ts',SIM+'__tests__/character-life-observation.test.ts']):
        return 3
    if path in [AUCTIONS,SIM+'__tests__/npc-auction.test.ts',SIM+'__tests__/lord-health.test.ts']:
        return 2
    return 1

def interim_stage_one(path, data):
    text = data.decode('utf-8')
    if path == STOCK_TEST:
        text,count = re.subn(r"  it\('round trips a 100-NPC save.*?(?=  it\('rejects a malformed)",'',text,flags=re.S)
        assert count == 1
        text = text.replace("    expect(isAcquisitionState({ ...a, lots: a.lots.map(lot => ({ ...lot, out: [false] })) })).toBe(false);\n", "")
    if path == ACQUISITION:
        text = text.replace('acquisitionNpc, auctionOpeningMilli, auctionRivals, emptyAcquisition,','acquisitionNpc, emptyAcquisition,')
        text = text.replace('emptyHouseholdReport, generateNpc, hasWeeklyKeys, homeBeds, homeResidents, isAcquisitionSource, isAuctionSource,','emptyHouseholdReport, hasWeeklyKeys, homeBeds, homeResidents, isAcquisitionSource,')
        text = text.replace('P7B_TRIAL, playerRaise, returnEquippedToStorage,','P7B_TRIAL, returnEquippedToStorage,')
        text = text.replace('type AcquisitionSource, type AcquisitionState, type AuctionLot, type CharacterLifeSessionState, type HouseholdReport,',
                            'type AcquisitionSource, type AcquisitionState, type CharacterLifeSessionState, type HouseholdReport,')
        text = text.replace("import { auctionRound, closeAuctionLot } from './npc-auction.js';\n",'')
        text = text.replace("  BID_NPC: ['source', 'raise', 'homeTileId'],\n  WITHDRAW_BID: ['source'],\n",'')
        text,count = re.subn(r"    if \(!isAuctionSource\(source\)\) continue;\n.*?    next.lots.push\([^\n]+\);\n",'',text,flags=re.S)
        assert count == 1
        text,count = re.subn(r"  for \(const lot of previous.lots\) \{\n.*?(?=  for \(const entry of previous.departures\))",'',text,flags=re.S)
        assert count == 1
        text = text.replace("      if (type === 'BUY_NPC') {\n",'')
        text,count = re.subn(r"      \} else \{\n        if \(!isAuctionSource\(source\)\).*?\n      \}\n    \}\n    city.revision",'\n    }\n    city.revision',text,flags=re.S)
        assert count == 1
        line_start = text.index('        if (!Number.isSafeInteger(raw.slot)')
        line_end = text.index("        offer.status = 'bought';\n",line_start)+len("        offer.status = 'bought';\n")
        text = text[:line_start] + ''.join(line[2:] for line in text[line_start:line_end].splitlines(keepends=True)) + text[line_end:]
    return text.encode('utf-8')

def replay_overrides(original, mode):
    manifest = EVIDENCE / 'replay-additions.json'
    if mode != 'approved' and manifest.exists():
        records = json.loads(manifest.read_text(encoding='utf-8'))['files']
        for entry in records:
            path = entry['path']
            before = original[path] if path in original else (git('cat-file','blob',BASE+':'+path) if entry['before_sha256'] else b'')
            if entry['before_sha256']: assert digest(before) == entry['before_sha256']
            data = entry['after'].encode('utf-8')
            assert digest(data) == entry['after_sha256']
            original[path] = data
    return original

def write(path,data):
    dest = ROOT / path
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(data)

def test_file(path):
    return '/__tests__/' in path and path.endswith(('.test.ts','/acquisition-fixture.ts')) or path.startswith('tests/e2e/') and path.endswith('.spec.ts')

mode = sys.argv[1]
stage = int(sys.argv[2]) if len(sys.argv) > 2 else 3
with_modes = approved()
if '--correction-13' in sys.argv:
    from difflib import unified_diff
    assert stage == 3
    path = 'tests/e2e/acquisition.spec.ts'
    plan = (PACKET / 'binding-plan-d0e5a0b.md').read_bytes()
    assert digest(plan) == '484707bc757c904e6af578ca69821a4412ac23ce766b2f46847e6da5f0489a5f'
    delta = (EVIDENCE / 'mobile-keyboard-proposal.patch').read_bytes()
    assert digest(delta) == 'ac8fb2c0ebb6aaeb82b0c0bf785f83f6484b6eec8d14965625448039d4e2acc5'
    evidence = json.loads((EVIDENCE / 'mobile-keyboard-proposal.json').read_text(encoding='utf-8'))
    assert evidence['path'] == path and len(evidence['replacements']) == 2
    before = with_modes[path]
    assert digest(before) == evidence['before_sha256']
    text = before.decode('utf-8')
    for hunk in evidence['replacements']:
        assert text.count(hunk['before']) == 1
        assert before.decode('utf-8').splitlines()[hunk['line'] - 1].find(hunk['before']) >= 0
        text = text.replace(hunk['before'], hunk['after'], 1)
    assert digest(text.encode('utf-8')) == evidence['after_sha256']
    exact_delta = ''.join(unified_diff(before.decode('utf-8').splitlines(keepends=True), text.splitlines(keepends=True),
        fromfile='approved/'+path, tofile='proposed/'+path, n=3)).encode('utf-8')
    assert exact_delta == delta
    with_modes[path] = text.encode('utf-8')
    print('Correction 13: exact two-hunk approval matches '+evidence['after_sha256'])
replay_manifest = EVIDENCE / 'replay-additions.json'
replay_files = set(row['path'] for row in json.loads(replay_manifest.read_text(encoding='utf-8'))['files']) if replay_manifest.exists() else set()
if mode in ['verify','stage','verify-head']:
    expected = replay_overrides(with_modes, mode) if stage >= 2 else with_modes
    expected = {p:interim_stage_one(p,d) if stage==1 else d for p,d in expected.items() if selected_stage(p)<=stage or stage>=2 and p in replay_files}
    if mode == 'stage':
        subprocess.run(['git','-c','core.autocrlf=false','add','--',*sorted(expected)],cwd=ROOT,check=True)
        changed = set(git('diff','--cached','--name-only','-z',BASE,'--').decode().split('\0')) - {''}
        actual = lambda path: git('cat-file','blob',':'+path)
    elif mode == 'verify-head':
        changed = set(git('diff','--name-only','-z',BASE,'HEAD','--').decode().split('\0')) - {''}
        actual = lambda path: git('cat-file','blob','HEAD:'+path)
    else:
        changed = set(git('diff','--name-only','-z',BASE,'--').decode().split('\0')) - {''}
        changed.update(set(git('ls-files','--others','--exclude-standard','-z').decode().split('\0'))-{''})
        actual = lambda path: (ROOT/path).read_bytes()
    assert changed == set(expected), {'outside':sorted(changed-set(expected)),'missing':sorted(set(expected)-changed)}
    for p,data in expected.items():
        assert actual(p) == data, ('byte mismatch',p)
    print(f'{mode}: {len(expected)} paths verified against approved bytes and stage projection')
elif mode == 'red' or mode == 'apply':
    for path,data in with_modes.items():
        if selected_stage(path)!=stage and not (stage==2 and path in [STOCK_TEST,ACQUISITION]):
            continue
        if mode=='red' and not test_file(path):
            continue
        if path.startswith(FIXTURE_DIR) or path==GOLDEN:
            continue
        write(path,interim_stage_one(path,data) if stage==1 else data)
elif mode == 'fixtures':
    source_dir = FIXTURE_DIR.replace('society-v13','society-v12')
    for path, target in with_modes.items():
        if not path.startswith(FIXTURE_DIR):
            continue
        source = git('cat-file','blob',BASE+':'+path.replace(FIXTURE_DIR,source_dir))
        fixture = json.loads(source)
        standalone = path.endswith('/new-game.json')
        city = fixture['state'] if standalone else fixture['state']['city']
        fixture['rulesetId' if standalone else 'cityRulesetId'] = 'tile-society-13'
        city['society']['rulesetId'] = 'tile-society-13'
        city['society']['acquisition'] = {'week':0,'stock':[],'lots':[],'departures':[]}
        wanted = json.dumps(fixture,ensure_ascii=False,separators=(',',':')).encode('utf-8') + (b'\n' if source.endswith(b'\n') else b'')
        assert wanted == target,path
        if not (ROOT/path).exists():
            write(path,wanted)
        else:
            assert (ROOT/path).read_bytes()==wanted
        print(path,digest(wanted))
elif mode == 'golden':
    assert with_modes[GOLDEN] == (ROOT/GOLDEN).read_bytes()
    print(GOLDEN,digest(with_modes[GOLDEN]))
else:
    raise ValueError(mode)
