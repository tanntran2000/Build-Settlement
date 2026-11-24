from pathlib import Path
import datetime as dt
import os
import shutil
import subprocess
import sys

out=Path(__file__).resolve().parent
expected='312797f184f6414064e5ecf81eb1fba7a7bc55d0'
root=Path.cwd()
node=shutil.which('node.exe')
assert node
args=[node,'node_modules/playwright/cli.js','test','tests/e2e/storage.spec.ts:105','--project=chromium',
      '--grep=fix2 F1: recovered legacy A cannot replace B saved while migration was blocked$']
env=dict(os.environ,CI='1')
listing=subprocess.run([*args,'--list'],env=env,capture_output=True,encoding='utf-8',check=True)
assert 'Total: 1 test in 1 file' in listing.stdout
if sys.argv[1]=='list':
    print('CI=1; collection only, no test execution.\n',listing.stdout,sep='')
else:
    assert sys.argv[1]=='run' and subprocess.check_output(['git','write-tree'],text=True).strip()==expected
    assert not subprocess.check_output(['git','diff','--name-only','-z'])
    env['PLAYWRIGHT_JSON_OUTPUT_FILE']=str(out/'storage-green-verified.json')
    args.extend(['--reporter=list,json','--output='+str(out/'storage-green-verified-artifacts')])
    utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()
    with (out/'storage-green-verified.txt').open('xb') as log:
        log.write(f'UTC start {utc()}\nStaged tree {expected}\nCI=1\n{args!r}\n\n'.encode())
        log.flush()
        result=subprocess.run(args,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
        log.write(f'\nUTC end {utc()}\nExit {result.returncode}\n'.encode())
    sys.exit(result.returncode)
