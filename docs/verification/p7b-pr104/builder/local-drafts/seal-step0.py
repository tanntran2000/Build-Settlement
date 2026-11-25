from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess

DOC = Path(__file__).parent
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
BASE = 'b184357d235d164478584e36b96d063551124e66'
TREE = '961567de7ef638861a55a42589be203037e123c9'
def sha(data):
    return hashlib.sha256(data).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
def read(name):
    return (DOC / name).read_text(encoding='utf-8')
def write(name,text):
    (DOC / name).write_text(text,encoding='utf-8',newline='\n')
def as_json(name):
    return json.loads(read(name))

existing = as_json('source-replacements.json')
new = as_json('generated-byte-proposals.json')
impact = as_json('repo-impact.json')
paths = {row['path']:row for row in existing['files']}
scratch = Path(read('scratch-location.txt'))
assert len(paths) == 60 and len(new['files']) == 23

for row in existing['files']:
    before = git('cat-file','blob',BASE+':'+row['path'])
    assert sha(before) == row['before']['sha256']
    reconstructed = before
    for hunk in reversed(row['replacements']):
        start,end = hunk['startByte'],hunk['endByte']
        assert reconstructed[start:end] == hunk['before'].encode('utf-8')
        reconstructed = reconstructed[:start]+hunk['after'].encode('utf-8')+reconstructed[end:]
    assert sha(reconstructed) == row['after']['sha256']
    assert reconstructed == (scratch / row['path']).read_bytes()
for row in new['files']:
    raw = row['text'].encode('utf-8')
    assert sha(raw) == row['sha256'] and raw == (scratch / row['path']).read_bytes()
for row in impact['historicalFixtures']:
    assert sha((scratch / row['path']).read_bytes()) == row['sha256']
for group in impact['searchGroups'].values():
    for entry in group['paths']:
        replacements = paths.get(entry['path'],{}).get('replacements',[])
        for finding in entry['findings']:
            line = finding['line']
            indices = [i for i, h in enumerate(replacements) if h['baselineLine'] <= line < h['baselineLine'] + h['baselineLineCount']]
            finding['afterInventoryIndexes'] = indices
            finding['after'] = None if indices else finding['current']
write('repo-impact.json',json.dumps(impact,ensure_ascii=False,indent=2)+'\n')

status = git('status','--porcelain=v1','--untracked-files=all')
assert status == b''
heads = git('rev-parse','HEAD','HEAD^{tree}','origin/main').decode().splitlines()
assert heads == [BASE,TREE,BASE]
assert git('diff','--exit-code') == b''
assert git('diff','--cached','--exit-code') == b''
assert git('branch','--show-current').strip() == b''
worktrees = git('worktree','list').decode('utf-8')
write('verification-worktree.txt',f'UTC {datetime.now(timezone.utc).isoformat(timespec="seconds")}\n'
    f'git rev-parse HEAD HEAD^{{tree}} origin/main (exit 0)\n'+'\n'.join(heads)+'\n'
    'git branch --show-current (exit 0, empty means detached)\n'
    'git status --porcelain=v1 --untracked-files=all (exit 0, empty)\n'
    'git diff --exit-code (exit 0, empty)\n'
    'git diff --cached --exit-code (exit 0, empty)\n'
    'git worktree list (exit 0)\n'+worktrees.replace('\r\n','\n')+
    'Reconstructed with original blob hashes and EOF bytes: 60 existing files, 23 generated files.\n'
    'Verified SHA-256 for 93 historical files in the external scratch snapshot.\n')
for file in ['verification-typescript.txt','verification-eslint.txt','verification-fixture-path-proof.txt','verification-e2e-discovery.txt','verification-unit-scoped.txt']:
    complete = read(file)
    assert 'Exit 1' not in complete and 'Exit 0' in complete
assert '258 passed' in read('verification-unit-scoped.txt')
assert '294795' in read('verification-unit-scoped.txt')
assert '3234 passed' in read('verification-unit.txt')
assert 'building for production' in read('verification-unit.txt')
assert 'building for production' not in read('verification-unit-scoped.txt')
assert 'Duyệt P7-B' in read('STEP0-HOLD.md')

head = read('STEP0-HOLD.md').split('\n### Results and deviations\n')[0].rstrip()+'\n'
body = '''
### Results and deviations

| External scratch check | Result |
|---|---|
| [TypeScript and Svelte Check](verification-typescript.txt) | Four no-emit configurations and Svelte Check exited 0. Svelte reported 0 errors and 0 warnings. |
| [ESLint](verification-eslint.txt) | Exit 0 with the complete composed tree and zero-warning limit. |
| [Scoped unit checks](verification-unit-scoped.txt) | 258 passed in nine suites, exit 0. The 100-NPC, 12-offer, two-lot save was 294,795 UTF-8 bytes. The empty-week control was 293,786 bytes, a delta of 1,009 bytes. The no-market report comparison and original 60-week report/item hashes passed. |
| [Fixture proof](verification-fixture-path-proof.txt) | Three golden seeds, 93 unchanged historical fixtures, ten proposed v13 siblings, zero forbidden paths. The script output matched the proposed proof bytes. |
| [Playwright discovery](verification-e2e-discovery.txt) | Five cases enumerated, exit 0. Browser behavior and screenshots await the approved implementation. |

The first composed run caught a test fixture typed as a partial report and an exact law-week society expectation missing the new key. The proposal uses a narrow typed report input and adds only the expected empty acquisition state to the law assertion. Both checks passed on rerun. [First Svelte output](verification-typescript-first-pass.txt) · [First full unit output](verification-unit-first-pass.txt)

**Scope deviation** — The broad scratch Vitest run invoked the existing `packages/ui/src/__tests__/inspector-build.test.ts:23–26`, which launches Vite’s production build. I did not catch that transitive build before running the suite, so it crossed the Step 0 no-build limit. The broad rerun produced 3,234 passing tests and generated UI output in the external scratch tree. Its incidental bundle lines show 160.92 kB gzip JS and 7.68 kB gzip CSS, summing to 168.60 kB. That is indicative scratch output. The formal B3.4 candidate/base bundle comparison and paired R-026 timing remain pending. The final scoped check omitted the build-running test. [Full scratch execution](verification-unit.txt) · [Clean checkout and byte verification](verification-worktree.txt)

## Exact path index

The baseline line numbers in this index refer to the before-text of each hunk. Exact old/new UTF-8 text and byte offsets are in the linked inventories. An insertion points to the baseline line immediately following the insertion. The search index records retained hits with identical before/after text.

### Existing paths

| File | Baseline lines | Reason |
|---|---|---|
'''
for row in existing['files']:
    lines = []
    for hunk in row['replacements']:
        line, count = hunk['baselineLine'],hunk['baselineLineCount']
        lines.append(str(line) if count <= 1 else f'{line}–{line+count-1}')
    body += '| `'+row['path']+'` | '+', '.join(lines)+' | '+' '.join(row['reasons']).replace('|','\\|')+' |\n'
body += '\n### Generated paths\n\n| File | Bytes | Reason |\n|---|---:|---|\n'
for row in new['files']:
    body += '| `'+row['path']+'` | '+str(row['bytes'])+' | '+row['reason'].replace('|','\\|')+' |\n'
write('STEP0-HOLD.md',head+body)
assert sha((DOC / 'binding-plan-befe6e8.md').read_bytes()) == 'e0613ce89b9881b933ad93698b46af7f542f76862e51bfb924bb6d36be2f05cf'
assert sha((DOC / 'binding-spec-9dace86.md').read_bytes()) == '0460f26205b8804ca39b0b87c889279ed568c29791556d3690927994dc3428b5'
files = sorted(path for path in DOC.iterdir() if path.is_file() and path.name != 'SHA256SUMS.txt')
write('SHA256SUMS.txt',''.join(sha(path.read_bytes())+'  '+path.name+'\n' for path in files))
for line in read('SHA256SUMS.txt').splitlines():
    digest, name = line.split('  ',1)
    assert sha((DOC / name).read_bytes()) == digest
print(f'Sealed {len(files)} packet files. Worktree clean at {BASE}.')
