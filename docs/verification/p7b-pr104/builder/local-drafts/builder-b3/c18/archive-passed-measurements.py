from hashlib import sha256
import json
from pathlib import Path
import re
import shutil
import subprocess

here = Path(__file__).resolve().parent
repo = Path.cwd()
def git(*args):
    return subprocess.check_output(('git', *args)).decode().strip()
def digest(path):
    return sha256(path.read_bytes()).hexdigest()

base = 'b184357d235d164478584e36b96d063551124e66'
head = git('rev-parse','HEAD')
tree = git('rev-parse','HEAD^{tree}')
assert not git('status','--porcelain=v1','--untracked-files=all')
assert git('rev-parse','origin/main') == base
bundle = here/'bundle'
manifest = json.loads((bundle/'bundle-and-served-hashes.json').read_bytes())
assert (manifest['head'],manifest['tree']) == (head,tree)
for group in manifest['manifest']:
    location = 'packages/ui/dist' if group['build']=='production' else 'packages/ui/regression/dist'
    directory = repo/location
    assert digest(directory/'index.html') == group['indexSha256']
    for entry in group['assets']:
        assert digest(directory/entry['file']) == entry['sha256']
print('Both builds on disk still match the pre-smoke served hashes, including the regression rebuild.')

historical = (here.parents[2]/'p7b-prB2'/'builder-b2'/'correction-11'/'final'/'b2-3-served-check-and-bundle.txt')
raw = historical.read_bytes()
logged = json.loads(re.search(rb'\{\r?\n  "scope":.*?\r?\n\}', raw, re.S)[0])
assert logged['tree'] == git('rev-parse',base+'^{tree}')
assert logged['tree'] == git('rev-parse',logged['head']+'^{tree}')
main_assets = logged['bundle']['assets']
candidate_assets = manifest['manifest'][0]['assets']
assert sum(row['gzipBytes'] for row in main_assets) == manifest['baseline']['totalGzipBytes']
shutil.copy2(historical, bundle/'main-tree-bundle-proof.txt')
comparison = {'main':base, 'mainTree':logged['tree'], 'historicalLogSha256':digest(historical),
              'candidate':head,'candidateTree':tree, 'mainAssets':main_assets,'candidateAssets':candidate_assets,
              'mainGzipBytes':logged['bundle']['totalGzipBytes'],'candidateGzipBytes':manifest['totalGzipBytes'],
              'deltaGzipBytes':manifest['deltaGzipBytes'],'headroomBytes':manifest['headroomBytes']}
(bundle/'per-file-comparison.json').write_text(json.dumps(comparison,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Recorded per-file main and head bundles. Main shares the verified B2 final tree.')

smoke_log = (here/'gate-8-smoke.txt').read_text(encoding='utf-8')
assert head in smoke_log and tree in smoke_log and 'CI=1' in smoke_log
assert re.search(r'^Exit [1-9]\d*$',smoke_log,re.M)
assert re.search(r'^\s*ok\s+\d+ \[chromium\].*round-trips the largest representative 100-NPC market checkpoint',smoke_log,re.M)
out = here/'save-size'
out.mkdir(exist_ok=True)
for name in ('largest-save.json','largest-save-indexeddb-rows.json','largest-save-measurement.json'):
    matches = sorted((repo/'test-results').rglob(name))
    assert len(matches) == 1, (name,matches)
    comparable = here.parent/'c14'/'save-size'/name
    assert comparable.read_bytes() == matches[0].read_bytes(), name
    dest = out/name
    shutil.copy2(matches[0],dest)
    print(name,len(dest.read_bytes()),digest(dest))
measurement = json.loads((out/'largest-save-measurement.json').read_bytes())
assert (out/'largest-save.json').stat().st_size == measurement['saveBytes']
assert (out/'largest-save-indexeddb-rows.json').stat().st_size == measurement['indexedDbRowJsonBytes']
assert 'Largest acquisition checkpoint '+json.dumps(measurement,separators=(',',':')) in smoke_log
assert (measurement['npcCount'],measurement['stock'],measurement['lots'],measurement['actionsPerLot'],measurement['departures'],measurement['recentEntriesPerNpc'])==(100,12,2,[4,4],14,20)

print('Exact-head browser payloads match the previous representative sample byte for byte and their measured lengths.')
