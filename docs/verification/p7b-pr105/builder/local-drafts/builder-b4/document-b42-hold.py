import difflib
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

root = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
here = Path(__file__).resolve().parent
expected_head = '71ff95afdac14f4c81f00b9d83695ed205bf619f'
def git(*args):
    return subprocess.check_output(['git',*args], cwd=root)
head, tree = git('rev-parse', 'HEAD', 'HEAD^{tree}').decode().splitlines()
assert head == expected_head
path = 'tests/e2e/household.spec.ts'
before = (root / path).read_bytes()
old = b"    await keyActivate(page, page.getByRole('button', { name: 'Plan next week' }));\n"
new = b"    await keyActivate(page, page.getByRole('button', { name: 'Plan next week', exact: true }));\n"
assert before.count(old) == 1
i = before.index(old)
after = before[:i] + new + before[i+len(old):]
diff = ''.join(difflib.unified_diff(before.decode('utf-8').splitlines(keepends=True),
    after.decode('utf-8').splitlines(keepends=True), fromfile='a/'+path, tofile='b/'+path)).encode('utf-8')
(here/'proposed-b42-locator-fix.patch').write_bytes(diff)
sha = lambda data: hashlib.sha256(data).hexdigest()
details = {
    'head':head, 'tree':tree, 'path':path, 'line':before[:i].count(b'\n')+1,
    'startByte':i, 'endByte':i+len(old), 'before':old.decode(), 'after':new.decode(),
    'heldSHA256':sha(before), 'proposedSHA256':sha(after), 'patchSHA256':sha(diff),
    'reason':'Select the report’s exact Plan next week button. Keep the Tab/Enter and all assertions.',
}
(here/'proposed-b42-locator-fix.json').write_bytes((json.dumps(details, ensure_ascii=False, indent=2)+'\n').encode('utf-8'))
(here/'b42-held-worktree.txt').write_bytes((f'HEAD {head}\nTree {tree}\n').encode() + git('status','--short','--branch'))
for case in (root/'test-results').glob('household-renewal-renders-*'):
    if not case.is_dir():
        continue
    dest = here/'b42-e2e-confirm-artifacts'/case.name
    dest.mkdir(parents=True, exist_ok=True)
    for name in ['error-context.md','trace.zip']:
        evidence = case/name
        if evidence.is_file():
            shutil.copy2(evidence, dest/name)
print(f'{path}:{details["line"]}')
print(f'Proposed patch SHA-256 {details["patchSHA256"]}')

