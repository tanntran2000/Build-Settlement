from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT = Path.cwd()
DRAFTS = Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2')
EVIDENCE = DRAFTS / 'builder-b2'
BASE = 'f73595b449db84b988d44a44cd33620efca9ecad'
TREE = 'fd04e1f2d7f6f47270a2e7ac82d18b68729a6372'
SOURCE_INVENTORY = 'fc81f8e7888eef743ef2f9614a53dfb357810eef89db34163913f6131b853235'
GENERATED_INVENTORY = 'a0e97ebed23b4b6f33fa490b4b0d748499fb221c8618863428b696b25518d3b8'
AMENDMENT = 'c301e839644c9ea1b8e9385c47b49ba045a226577b0f605c9e19a68d5d566db3'
NAME_CORRECTION = '7701d8ab6da2c134c37cbc479ff313957c964396553f9fa1198dcc74f3933f1a'
GENERATOR = 'packages/core/src/world/npc-generator.ts'
HOUSEHOLD = 'packages/core/src/world/npc-household.ts'
PRICE = 'packages/core/src/world/npc-price.ts'
DATA = 'packages/core/src/data/npc-generator.json'
VALIDATOR = 'packages/core/src/data/validate.ts'
INDEX = 'packages/core/src/index.ts'
B21_TEST = 'packages/core/src/world/__tests__/npc-generator.test.ts'
B22_TEST = 'packages/simulation/src/__tests__/npc-homes.test.ts'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args])

def pinned(path, digest):
    raw = path.read_bytes()
    assert sha(raw) == digest, path
    return json.loads(raw)

def once(text, before, after):
    assert text.count(before) == 1, before
    return text.replace(before, after, 1)

def source_after(entry, approved_lines=None):
    name = entry['path']
    raw = git('show', f'{BASE}:{name}')
    assert sha(raw) == entry['before']['sha256'], name
    lines = raw.decode('utf-8').splitlines(keepends=True)
    for edit in reversed(entry['replacements']):
        lo = edit['startLine']
        hi = edit['endLine']
        if approved_lines is not None and lo not in approved_lines:
            continue
        assert ''.join(lines[lo-1:hi]) == edit['before'], (name, lo)
        lines[lo-1:hi] = [edit['after']]
    new = ''.join(lines)
    if approved_lines is None:
        assert sha(new.encode()) == entry['after']['sha256'], name
    return new

def apply_changes(files, amendments):
    for change in amendments:
        name = change['path']
        if name in files:
            files[name] = once(files[name], change['before'], change['after'])

def make_files(stage):
    assert git('rev-parse', f'{BASE}^{{tree}}').decode().strip() == TREE
    entries = pinned(DRAFTS/'source-replacements.json', SOURCE_INVENTORY)
    added = pinned(DRAFTS/'generated-byte-proposals.json', GENERATED_INVENTORY)
    amendments = pinned(EVIDENCE/'amendment-proposal.json', AMENDMENT)
    rename = pinned(EVIDENCE/'correction-7-additions.json', NAME_CORRECTION)
    source = {row['path']: row for row in entries['files']}
    generated = {}
    for item in added['files']:
        assert sha(item['after'].encode()) == item['afterSha256'], item['path']
        generated[item['path']] = item['after']
    name = rename['changed'][0]
    assert name['path'] == DATA and sha(generated[DATA].encode()) == name['beforeSha256']
    generated[DATA] = once(generated[DATA], '"Briala"', '"Veylathenne"')
    assert sha(generated[DATA].encode()) == name['afterSha256']
    red = (EVIDENCE/'npc-generator-red.test.ts').read_bytes().decode('utf-8').replace('\r\n', '\n')
    gold_rejection = "    [['P7B_TRIAL', 'startGoldMilli'], 45000, 'P7B_TRIAL.startGoldMilli: expected 120000'],\n"
    red = once(red, gold_rejection, '')
    if stage == 'stage1':
        files = {name: generated[name] for name in [GENERATOR, HOUSEHOLD, PRICE, DATA]}
        apply_changes(files, amendments['finalByteChanges'])
        files[VALIDATOR] = source_after(source[VALIDATOR], {8, 988})
        files[VALIDATOR] = once(files[VALIDATOR], "import tuningJson from './tuning.json' with { type: 'json' };\n", '')
        files[VALIDATOR] = once(files[VALIDATOR],
            'startGoldMilli: literal(tuningJson.GOODS_STOCK_TRIAL.initialGoldMilli)',
            'startGoldMilli: positive')
        files[INDEX] = source_after(source[INDEX], {15})
        files[HOUSEHOLD] = once(files[HOUSEHOLD], '\nconst keys =',
            '\nexport type NpcWithHousehold = WorldNpc & { household: NpcHousehold };\n\nconst keys =')
        files[HOUSEHOLD] = once(files[HOUSEHOLD], 'npcs: readonly WorldNpc[]', 'npcs: readonly NpcWithHousehold[]')
        files[GENERATOR] = once(files[GENERATOR], 'import type { NpcHousehold }', 'import type { NpcHousehold, NpcWithHousehold }')
        files[GENERATOR] = once(files[GENERATOR], '{ npc: WorldNpc; profile: CharacterProfile }',
            '{ npc: NpcWithHousehold; profile: CharacterProfile }')
        files[PRICE] = once(files[PRICE], "import type { WorldNpc }", "import type { NpcWithHousehold } from './npc-household.js';\nimport type { WorldNpc }")
        files[PRICE] = once(files[PRICE], 'npcSellMilli(npc: WorldNpc)', 'npcSellMilli(npc: NpcWithHousehold)')
        files[B21_TEST] = red
        return files
    files = {name: source_after(item) for name, item in source.items()}
    files.update(generated)
    apply_changes(files, amendments['finalByteChanges'])
    files[B21_TEST] = red
    files[B22_TEST] = (EVIDENCE/'npc-homes-red.test.ts').read_bytes().decode('utf-8').replace('\r\n', '\n')
    return files

def store(files, stage):
    for name, text in files.items():
        if stage == 'stage2' and ('/society-v12/' in name or name.endswith('/catalog-golden.json')):
            continue
        dest = ROOT / name
        if text == '':
            assert name == 'packages/core/src/character/starter-profiles.ts', name
            if dest.exists():
                dest.unlink()
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(text.encode('utf-8'))

def verify(files, revision):
    actual = set(git('diff', '--name-only', '-z', BASE, revision).decode().strip('\0').split('\0'))
    assert actual == set(files), {'unapproved': sorted(actual - set(files)), 'missing': sorted(set(files) - actual)}
    report = []
    for name, text in sorted(files.items()):
        if text:
            observed = git('show', f'{revision}:{name}')
            assert observed == text.encode('utf-8'), name
            report.append({'path': name, 'sha256': sha(observed), 'bytes': len(observed)})
        else:
            assert not git('ls-tree', revision, '--', name), name
            report.append({'path': name, 'deleted': True})
    return report

mode = sys.argv[1]
files = make_files('stage1' if mode in ('stage1', 'verify-stage1') else 'stage2')
if mode.startswith('verify'):
    rev = sys.argv[2] if len(sys.argv) > 2 else 'HEAD'
    report = verify(files, rev)
    filename = 'verifier-b2-1.json' if mode == 'verify-stage1' else 'verifier-final.json'
    data = {'base':BASE, 'baseTree':TREE, 'testHead':git('rev-parse', rev).decode().strip(),
            'testTree':git('rev-parse', rev + '^{tree}').decode().strip(),
            'sourceReplacements':SOURCE_INVENTORY, 'generatedProposals':GENERATED_INVENTORY,
            'correction7':pinned(EVIDENCE/'correction-7-additions.json', NAME_CORRECTION),
            'correction8':pinned(EVIDENCE/'amendment-proposal.json', AMENDMENT), 'files':report}
    (EVIDENCE/filename).write_text(json.dumps(data, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(f'OK: {len(report)} changed paths are byte-identical to the pinned plan and approved overlays.')
else:
    assert mode in ('stage1', 'stage2'), mode
    store(files, mode)
    print(f'{mode}: verified {len(files)} planned paths against the pinned input before writing.')

