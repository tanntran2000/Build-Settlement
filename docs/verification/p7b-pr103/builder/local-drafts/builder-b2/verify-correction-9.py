from pathlib import Path
from collections import defaultdict
import hashlib
import json
import subprocess
import sys

drafts = Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2')
evidence = drafts / 'builder-b2'
base = '58b4f2d59b1dddff5841db67970b561f3679bfbd'
candidate = '62c34cb35c597b26f936f938f924d6449e0094ad'
main = 'f73595b449db84b988d44a44cd33620efca9ecad'
approval = {
    drafts / 'binding-plan-607c087.md': 'bc8fae1125e1a439064bc9f55e8ad1f7dc062520ab0c1235f4a2100415020e06',
    evidence / 'B2-2-HOLD.md': 'c6af8d3af9683cbdba4a5fd514be531d81f5848848df34c50fadcab716aec215',
    evidence / 'b2-2-amendment-proposal.json': 'd9b77a0da0ac0905317c00b855269abf463e1717849d5a4691c7a9a350f851e1',
    evidence / 'b2-2-candidate.patch': '0617e0f9b68b1c9f0eaa40f57c6b250fab907df50c8f297e56178fcf3fcf5c08',
}

def git(*args):
    return subprocess.check_output(['git', *args])

def check(*args):
    subprocess.run(['git', *args], check=True)

def sha(value):
    return hashlib.sha256(value).hexdigest()

def string(value):
    return value.decode('utf-8').strip()

def paths(value):
    return set(filter(None, value.decode('utf-8').split('\0')))

for path, digest in approval.items():
    assert sha(path.read_bytes()) == digest, path

historical = json.loads((evidence / 'b2-2-candidate-verifier.json').read_bytes())
assert historical['candidateTree'] == candidate
assert historical['head'] == base
amendments = json.loads((evidence / 'b2-2-amendment-proposal.json').read_bytes())['amendments']
assert len(amendments) == 23
by_path = defaultdict(list)
for change in amendments:
    by_path[change['path']].append(change)

expected = {}
facts = []
for path, hunks in sorted(by_path.items()):
    initial = git('show', f'{candidate}:{path}')
    text = initial.decode('utf-8')
    for hunk in hunks:
        assert text.count(hunk['before']) == 1, (path, hunk['before'])
        text = text.replace(hunk['before'], hunk['after'], 1)
    final = text.encode('utf-8')
    expected[path] = final
    facts.append({'path': path, 'candidateSha256': sha(initial), 'finalSha256': sha(final),
                  'beforeBytes': len(initial), 'afterBytes': len(final), 'amendments': hunks})

def verify(revision):
    tree = string(git('rev-parse', revision + '^{tree}'))
    assert paths(git('diff','--name-only','--no-renames','-z',candidate,tree)) == set(expected)
    for path, content in expected.items():
        assert git('show', f'{tree}:{path}') == content, path
    for entry in historical['verifiedFiles']:
        path = entry['path']
        if path in expected:
            continue
        if entry.get('deleted'):
            assert not git('ls-tree', tree, '--', path), path
        else:
            assert sha(git('show', f'{tree}:{path}')) == entry['sha256'], path
    changed_paths = paths(git('diff','--name-only','--no-renames','-z',main,tree))
    assert changed_paths == set(expected) | {x['path'] for x in historical['verifiedFiles']}
    ui_product = paths(git('diff','--name-only','-z',candidate,tree,'--','packages/ui/src'))
    assert all('/__tests__/' in path for path in ui_product), ui_product
    return {'originMain': main, 'b2_1': base, 'candidateTree': candidate, 'verifiedTree': tree,
            'verificationRevision': revision,
            'totalPathsCompared': len(changed_paths), 'correction9Files': len(expected),
            'correction9Hunks': len(amendments), 'correction7': historical['correction7'],
            'correction8': historical['correction8'], 'correction9': facts,
            'previousProductUiByteChanges': sorted(ui_product),
            'pinnedInputs': {path.name:digest for path,digest in approval.items()}}

mode = sys.argv[1]
if mode == 'apply':
    assert string(git('rev-parse','HEAD')) == base
    assert string(git('rev-parse','origin/main')) == main
    assert not git('status','--porcelain=v1','--untracked-files=all')
    patch = str(evidence / 'b2-2-candidate.patch')
    check('apply','--check','--index',patch)
    check('apply','--index',patch)
    assert string(git('write-tree')) == candidate, 'patch did not reproduce the pinned candidate'
    for path, content in expected.items():
        Path(path).write_bytes(content)
    check('-c','core.autocrlf=false','add','--',*expected)
    assert not git('diff','--name-only','-z')
    assert not git('ls-files','--others','--exclude-standard','-z')
    revision = string(git('write-tree'))
    output = evidence / 'verifier-b2-2-precommit.json'
else:
    assert mode == 'verify'
    assert not git('status','--porcelain=v1','--untracked-files=all')
    revision = 'HEAD'
    output = evidence / 'verifier-final.json'

data = verify(revision)
if revision == 'HEAD':
    data['head'] = string(git('rev-parse','HEAD'))
    assert string(git('rev-parse','HEAD^')) == base
output.write_text(json.dumps(data, indent=2)+'\n', encoding='utf-8', newline='\n')
print(f"Verified {data['totalPathsCompared']} paths against the pinned candidate and approvals. Correction 9 alters {len(expected)} files in {len(amendments)} exact hunks.")
print(f"Verified tree {data['verifiedTree']}")

