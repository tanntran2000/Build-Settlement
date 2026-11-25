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

previous=here.parent/'c19'/'bundle'
prior_manifest=json.loads((previous/'bundle-and-served-hashes.json').read_bytes())
older=[row for row in prior_manifest['manifest'][0]['assets'] if row['file'].endswith('.js')]
newer=[row for row in candidate_assets if row['file'].endswith('.js')]
if len(older)==len(newer)==1:
    from gzip import decompress
    old=decompress((previous/(older[0]['file'].replace('/','-')+'.gz')).read_bytes())
    new=decompress((bundle/(newer[0]['file'].replace('/','-')+'.gz')).read_bytes())
    old_head=prior_manifest['head']
    revised=old.replace(old_head.encode(),head.encode()).replace(old_head[:7].encode(),head[:7].encode())
    if new==old:
        print('Production JavaScript bytes match C19.')
    elif new==revised:
        print('Production JavaScript matches C19 after substituting the embedded Git revision.')
    else:
        print('Production JavaScript spans differ from C19. The asset hashes above record the exact build.')
