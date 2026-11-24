from pathlib import Path
import datetime as dt
import io
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile

def git(*args):
    return subprocess.check_output(['git', *args])

root = Path.cwd()
evidence = Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2')
label = sys.argv[1]
revision = sys.argv[2]
tree = git('rev-parse', revision+'^{tree}').decode().strip()
git_dir = git('rev-parse', '--absolute-git-dir').decode().strip()
script = 'packages/simulation/src/__tests__/fixtures/p7b-b2-path-diff.ts'
dest = evidence/(label+'.txt')
started = dt.datetime.now(dt.timezone.utc).isoformat()
with tempfile.TemporaryDirectory(prefix='b2-path-audit-',dir=evidence) as scratch:
    snapshot = Path(scratch)
    bundle = git('-c', 'core.autocrlf=false', 'archive', '--format=tar', tree, 'packages/persistence/src/__tests__/fixtures', 'packages/simulation/src/__tests__/fixtures')
    with tarfile.open(fileobj=io.BytesIO(bundle), mode='r:') as archive:
        archive.extractall(path=snapshot,filter='data')
    env = os.environ.copy()
    env.update(GIT_DIR=git_dir,GIT_WORK_TREE=str(snapshot))
    result = subprocess.run(['node',script],cwd=snapshot,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    with dest.open('wb') as log:
        log.write(f'UTC start {started}\nRevision {revision}\nTree {tree}\nInput canonical Git archive (LF)\nCommand: node {script}\n\n'.encode())
        log.write(result.stdout)
        log.write(f'\nUTC end {dt.datetime.now(dt.timezone.utc).isoformat()}\nExit {result.returncode}\n'.encode())
print(dest.read_text(encoding='utf-8'))
sys.exit(result.returncode)

