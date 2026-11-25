from collections import defaultdict
import hashlib
import json
from pathlib import Path
import re
import subprocess

root = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
packet = Path(__file__).parent
scratch = Path((packet / 'scratch-location.txt').read_text(encoding='utf-8').strip())
base = '95821832a8c95988c3203b4c38f5f9ae665978e9'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)
def sha(data):
    return hashlib.sha256(data).hexdigest()
def write(name, data):
    (packet / name).write_bytes((json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))

groups = {
    'order': r'runNpcLifeWeek|runTileTrialWeek|(?:householdUpkeep|acquisitionWeekReport|drawAcquisition)|(?:60 weeks|byte-identical|full-session parity|frozen delegated report)',
    'save': r'tile-society-13|hasAcquisitionRosterProof|isAcquisitionReplay|isNpcHousehold|historicalSocietyRuleset|historicalNpcLifeRuleset|historicalHouseholdRuleset|\.departures|releaseReason',
    'commands': r'ANSWER_NOTICE|RELEASE_NPC|WITHDRAW_BID|CharacterLifeActionType|CARD_PENDING|pendingCard.*lock|(?:actionTypes|planningActions)|switch\s*\(\s*(?:type|command|c\.type)',
    'report': r'(?:TileTrialReport\W.{0,45})?household\b|lotsToRivals|Household activity|expectReport\(|lifeUiSnapshot\(',
    'ui': r'NpcSheet|npc-sheet|CharacterLifeCharacters|Character roster|Home residents|data-character-id|data-household-kind|data-notice-choice',
    'runner': r'p7b-road-balance|node-version: 24|check:architecture|lint.*eslint|typecheck:(core|simulation|content|persistence|ui)',
}
regexes = {key: re.compile(pattern) for key, pattern in groups.items()}
hits = defaultdict(list)
fixture_bytes = []
paths = git('ls-files', '-z').decode('utf-8').strip('\0').split('\0')
for path in paths:
    if path.startswith('packages/persistence/src/__tests__/fixtures/') or path.endswith('/fixtures/catalog-golden.json'):
        blob = git('cat-file', 'blob', base + ':' + path)
        disk = (scratch / path).read_bytes()
        assert blob == disk, (path, 'scratch fixture moved')
        fixture_bytes.append({'path': path, 'bytes': len(blob), 'sha256': sha(blob)})
        continue
    if not path.endswith(('.ts','.svelte','.mjs','.js','.json','.yml','.yaml','.md','.txt')):
        continue
    blob = (root / path).read_bytes()
    try:
        text = blob.decode('utf-8-sig')
    except UnicodeDecodeError:
        continue
    for line, current in enumerate(text.splitlines(), start=1):
        match = [group for group, regex in regexes.items() if regex.search(current)]
        if match and len(current) <= 1800:
            for group in match:
                hits[group].append({'path': path, 'line': line, 'current': current})
write('repo-impact.json', {
    'base': base, 'trackedPathsScanned': len(paths), 'searched': groups,
    'note': 'Source verification index includes guard and historical references, which retain their exact current text unless listed in source-replacements.json. Excludes individual lines over 1,800 characters and indexes fixture blobs separately.',
    'matches': dict(hits), 'fixtureBlobsIdenticalToGit': fixture_bytes,
})
assert not git('status', '--porcelain=v1', '--untracked-files=normal')
assert git('rev-parse', 'HEAD').decode().strip() == base
print(f'{len(paths)} tracked paths; {sum(map(len, hits.values()))} source references; {len(fixture_bytes)} unchanged fixture blobs')

