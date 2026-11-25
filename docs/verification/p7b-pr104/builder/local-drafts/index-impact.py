from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import os
import subprocess

DOC = Path(__file__).parent
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
BASE = 'b184357d235d164478584e36b96d063551124e66'
GRAPHIFY = Path(r'C:\Users\Admin\.local\bin\graphify.exe')
env = dict(os.environ, PYTHONIOENCODING='utf-8')
def run(args):
    return subprocess.run(args, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
def raw(path):
    return run(['git', 'show', BASE + ':' + path]).stdout
def write(name, string):
    (DOC / name).write_text(string, encoding='utf-8', newline='\n')
sources = json.loads((DOC / 'source-replacements.json').read_text(encoding='utf-8'))
paths = {file['path']: file for file in sources['files']}
generated = json.loads((DOC / 'generated-byte-proposals.json').read_text(encoding='utf-8'))
all_paths = sorted(set(paths) | {row['path'] for row in generated['files']})
old = {}
patterns = {
    'save-ruleset-and-checkpoints': r'isTileTrial(State|PlanningState)|isSocietyState|isStoredCity|historical(NpcLife|Society)Ruleset|SOCIETY_RULESET|tile-society-12|society-v12',
    'weekly-report-and-pins': r'TileTrialReport|VisibleReport|expectReport|lifeUiSnapshot|npcLifeReportRows|reportLetters|householdUpkeep|catalog-golden|Match(Inline)?Snapshot|hash\(reports\)',
    'items-storage-and-owner': r'returnEquippedToStorage|STORAGE_FULL|ITEM_TRIAL.storage(Cap|Weeks)|items.storage|CLAIM_STORED_ITEM|isItemsState|\.equipped',
    'dispatch-command-sets-and-refusals': r'CharacterLifeActionType|actionTypes|ITEM_COMMAND_TYPES|MOVE_NPC_HOME|BUILD.{0,5}REPLACE|case .(END_WEEK|BUILD|SET_ENABLED)|STALE_COMMAND|NOT_ENOUGH_GOLD|NO_BED|NPC_CAP|NO_BUILDING|OFFER_GONE|NOT_A_SLAVE',
    'inside-city-selection-a11y-and-viewport': r'Inside City|InsideCity|openLifeCity|focusManage|trial-tile-|setViewportSize|scrollWidth[< =]|tab-work|selectedId|lifeUiSnapshot',
    'catalog-ranges-and-prior-pins': r'generateNpc|npcSellMilli|npcValueMilli|P7B_TRIAL|nameSalt|p7b-b2-path-diff',
}
pathspec = ['.', ':!docs', ':!*.json', ':!*.txt', ':!*.lock', ':!*.svg', ':!*.png', ':!*.webp', ':!*.pdf', ':!*.woff2']
groups = {}
for title, pattern in patterns.items():
    command = ['git','grep','-n','-I','-E','-e',pattern,BASE,'--',*pathspec]
    result = run(command)
    assert result.returncode in (0,1), result.stdout
    grouped = defaultdict(list)
    for entry in result.stdout.decode('utf-8').splitlines():
        _, path, line, text = entry.split(':',3)
        line = int(line)
        if path not in old:
            old[path] = raw(path).decode('utf-8').splitlines(keepends=True)
        current = old[path][line-1]
        assert current.rstrip('\r\n') == text, (path,line)
        target = paths.get(path)
        matches = [i for i,h in enumerate(target['replacements']) if h['baselineLine'] <= line <
                   h['baselineLine']+h['baselineLineCount']] if target else []
        grouped[path].append(dict(line=line,current=current,
            after=current if not matches else None,
            afterInventoryIndexes=matches))
    groups[title] = dict(command=command, exit=result.returncode, locations=sum(map(len,grouped.values())),
        paths=[dict(path=path, outcome='edit' if path in paths else 'retain', findings=locations)
               for path,locations in sorted(grouped.items())])
docs = run(['git','grep','-n','-I','-E','tile-society-12|society-v12|R-026|P7-B.*(B3|[Aa]cquisition)', BASE,'--','docs'])
assert docs.returncode in (0,1)
write('historical-matches.txt', docs.stdout.decode('utf-8'))
fixture_prefix = 'packages/persistence/src/__tests__/fixtures/'
tracked = run(['git','ls-tree','-r','--name-only','-z',BASE]).stdout.decode('utf-8').split('\0')
historical = []
for path in sorted(path for path in tracked if path.startswith(fixture_prefix)):
    previous = raw(path)
    historical.append(dict(path=path, disposition='retain byte for byte',
        sourceFor=path.replace('society-v12/','society-v13/') if 'society-v12/' in path else None,
        bytes=len(previous),sha256=hashlib.sha256(previous).hexdigest(),endsWithNewline=previous.endswith(b'\n')))
write('repo-impact.json',json.dumps(dict(base=BASE, note='Identical after text denotes retained lines. For changed lines, afterInventoryIndexes are zero-based indexes in the same path entry in source-replacements.json. The full changed-path inventory also covers insertions.',
    changedAndNewPaths=all_paths, searchGroups=groups, historicalFixtures=historical,
    snapshots=[p for p in tracked if p.endswith('.snap')]), indent=2, ensure_ascii=False)+'\n')

log = ['Source graph audit for ' + BASE, 'Graph SHA-256 ' + hashlib.sha256((ROOT / 'graphify-out/graph.json').read_bytes()).hexdigest()]
for query in [
    ['--version'],
    *[['explain',s,'--all'] for s in ['isTileTrialState','isTileTrialPlanningState','isSocietyState','isStoredCity',
        'TileTrialReport','expectReport','lifeUiSnapshot','returnEquippedToStorage','isItemsState','InsideCity.svelte','reportLetters']],
    ['affected','executeCharacterLifeCommand','--depth','2'],
    ['affected','createSocietyState','--depth','2'],
    ['query','reportLetters','--depth','1','--budget','4500'],
    ['path','executeCharacterLifeCommand','runNpcLifeWeek','--directed'],
]:
    args = [str(GRAPHIFY),*query]
    result = run(args)
    log.extend(['',datetime.now(timezone.utc).isoformat(timespec='seconds')+' '+subprocess.list2cmdline(args),
                result.stdout.decode('utf-8').rstrip(),f'Exit {result.returncode}'])
write('graph-queries.txt','\n'.join(log)+'\n')
print('Recorded', len(all_paths), 'proposed paths,', len(historical), 'historical fixtures and',
      sum(g['locations'] for g in groups.values()), 'source-search locations.')
