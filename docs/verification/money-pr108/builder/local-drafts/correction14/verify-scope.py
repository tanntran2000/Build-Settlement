from hashlib import sha256
from pathlib import Path
import json
import re
import subprocess

here = Path(__file__).resolve().parent
repo = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
reviewed = '57c0cbe7b2862bbc148a528444dcad64e58d35b9'
base = '0b2b3a6088d003301d48b460202327fb53546ede'
git = lambda *args: subprocess.check_output(['git', *args], cwd=repo)
paths = {
    'packages/core/src/character/__tests__/purse-shape.test.ts',
    'packages/core/src/character/validate.ts',
    'packages/simulation/src/__tests__/home-robbery.test.ts',
    'packages/ui/src/PursePanel.svelte',
    'packages/ui/src/__tests__/home-robbery-view.test.ts',
    'packages/ui/src/purse-view.ts',
    'tests/e2e/character-life-navigation.helpers.ts',
    'tests/e2e/home-robbery.spec.ts',
}
head, tree, parent = git('rev-parse', 'HEAD', 'HEAD^{tree}', 'HEAD^').decode().split()
assert parent == reviewed
assert git('log', '-1', '--format=%s').decode().strip() == 'fix: robbery card reader limit, at-risk amount and strict tests'
assert git('branch', '--show-current').decode().strip() == 'feat/money-robbery'
assert git('rev-parse', 'origin/main').decode().strip() == base
assert not git('status', '--porcelain', '-z')
paths_changed = set(git('diff', '--name-only', reviewed, head).decode().splitlines())
assert paths == paths_changed, sorted(paths ^ paths_changed)
git('diff', '--check', reviewed, head)
data = git('diff', '--no-ext-diff', '--no-color', reviewed, head)
(here / 'correction14.patch').write_bytes(data)
inventory = {
    'reviewed': reviewed, 'head': head, 'tree': tree, 'base': base,
    'patchSHA256': sha256(data).hexdigest(),
    'paths': [{'path': path, 'beforeSHA256': sha256(git('show', reviewed + ':' + path)).hexdigest(),
               'afterSHA256': sha256(git('show', head + ':' + path)).hexdigest()} for path in sorted(paths)],
}
documents = {
    'binding-plan-7946251.md': '7d084026289ea35cb0acaf42ecf35070abf77156664ff0b15fb752b7fefcd628',
    'astra-review/astra-round1.md': 'aa051497d0723a7d4b5dc85cab03f9c6864ec730ef97cb5c4f497ea79eec5463',
}
for name, expected in documents.items():
    assert sha256((here.parent / name).read_bytes()).hexdigest() == expected
inventory['documents'] = documents
(here / 'scope.json').write_bytes((json.dumps(inventory, indent=2) + '\n').encode())
checks = {
    'private key header': r'-----BEGIN (?:[A-Z0-9-]+ )*PRIVATE KEY-----',
    'GitHub token': r'\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b',
    'AWS access key': r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'Slack token': r'\bxox[baprs]-[A-Za-z0-9-]{15,}\b',
    'embedded credential': r'(?i)\b(?:password|api[_-]?key|access[_-]?token)\s*[:=]\s*["\x27][A-Za-z0-9+/_.~-]{16,}["\x27]',
    'literal private service key': r'\b(?:sk-proj-|sk_live_|rk_live_)[A-Za-z0-9_-]{20,}\b',
}
matchers = {name: re.compile(pattern) for name, pattern in checks.items()}
added = 0
matches = []
file = ''
for line in git('diff', '--no-ext-diff', '--no-color', '--unified=0', base + '...' + head).decode().splitlines():
    if line.startswith('+++ '):
        file = line.removeprefix('+++ b/')
    elif line.startswith('+'):
        added += 1
        for name, matcher in matchers.items():
            if matcher.search(line[1:]):
                matches.append((file, name))
assert not matches, matches
print(f'Correction 14 paths: {len(paths)}; working tree clean; parent {parent}; head {head}; tree {tree}.')
print(f'Branch-wide added lines scanned: {added}. Credential patterns detected: 0.')
