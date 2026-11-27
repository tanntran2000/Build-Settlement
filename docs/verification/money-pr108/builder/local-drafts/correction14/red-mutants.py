from pathlib import Path
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
import json
import os
import shutil
import subprocess
import sys
import tarfile

here = Path(__file__).resolve().parent
repo = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scratch = Path((here.parent / '.scratch-path').read_text(encoding='utf-8').strip()).resolve()
assert repo.resolve() != scratch and repo.resolve() not in scratch.parents
head, tree = subprocess.check_output(['git', 'rev-parse', 'HEAD', 'HEAD^{tree}'], cwd=repo, text=True).split()
assert head == '57c0cbe7b2862bbc148a528444dcad64e58d35b9'
tests = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD'], cwd=repo, text=True).splitlines()
assert len(tests) == 5 and all('/__tests__/' in path or path.startswith('tests/e2e/') for path in tests)
if sys.argv[1] == 'build':
    archive = subprocess.check_output(['git', 'archive', 'HEAD'], cwd=repo)
    with tarfile.open(fileobj=BytesIO(archive)) as bundle:
        bundle.extractall(scratch, filter='data')
    for name in tests:
        shutil.copyfile(repo / name, scratch / name)
    
    changes = {
        'packages/core/src/character/validate.ts': [
            ('int(robbery.excessMilli, balanceRange));',
             'int(robbery.excessMilli, balanceRange) && (robbery.excessMilli as number) < (purse.moneyMilli as number));'),
        ],
        'packages/ui/src/CharacterLifeShell.svelte': [
            ("aria-disabled={locked || !!endWeekReason}",
             "aria-disabled={storageSession.player.purse.moneyMilli === 1000 ? true : "
             "storageSession.player.purse.moneyMilli === 22500 ? false : locked || !!endWeekReason}"),
        ],
        'packages/ui/src/MarketPanel.svelte': [
            ('{#each items.market as offer,index}', '{#each (purse.moneyMilli === 4999 ? items.market.slice(0, 1) : items.market) as offer,index}'),
            ('holdNotice&&!canSpendMoney(purse,offer.priceMilli)', 'holdNotice&&purse.moneyMilli<offer.priceMilli'),
            ('canSpendMoney, ITEM_CATALOG', 'ITEM_CATALOG'),
        ],
    }
    inventory = []
    for name, pairs in changes.items():
        path = scratch / name
        before = path.read_bytes()
        data = before
        for old, new in pairs:
            assert data.count(old.encode()) == 1, (name, old)
            data = data.replace(old.encode(), new.encode())
        path.write_bytes(data)
        inventory.append({'path': name, 'beforeSHA256': sha256(before).hexdigest(), 'afterSHA256': sha256(data).hexdigest(), 'replacements': pairs})
    for name in tests:
        inventory.append({'path': name, 'scratchSHA256': sha256((scratch / name).read_bytes()).hexdigest()})
    (here / 'red-mutants.json').write_text(json.dumps({'head':head, 'tree':tree, 'scratch':str(scratch), 'files':inventory}, indent=2)+'\n', encoding='utf-8')
    
    
env = {**os.environ, 'CI':'1', 'NO_COLOR':'1'}
def run(label, args):
    label = here / (label + '.txt')
    with label.open('xb') as f:
        def log(s): f.write((s+'\n').encode()); f.flush()
        log(f'Base HEAD {head}\nBase tree {tree}\nDisposable scratch composition {scratch}\n'
            f'CI=1 {subprocess.list2cmdline(args)}\nStart UTC {datetime.now(timezone.utc).isoformat()}')
        code = subprocess.run(args, cwd=scratch, env=env, stdout=f, stderr=subprocess.STDOUT).returncode
        log(f'Exit {code} | End UTC {datetime.now(timezone.utc).isoformat()}')
    print(label.name, code, flush=True)
    return code
if sys.argv[1] == 'build':
    sys.exit(run('red-mutants-build-2', ['cmd','/d','/c','npm','run','build']) or
             run('red-mutants-regression-build', ['cmd','/d','/c','npm','run','pretest:smoke']))
if sys.argv[1] == 'unit':
    sys.exit(run('red-mutants-boundary', ['cmd','/d','/c','npm','test','--',
        'packages/core/src/character/__tests__/purse-shape.test.ts',
        'packages/simulation/src/__tests__/home-robbery.test.ts']))
if sys.argv[1] == 'test':
    sys.exit(run('red-mutants-browser', [
        'node', 'node_modules/@playwright/test/cli.js', 'test',
        'tests/e2e/purse.spec.ts', 'tests/e2e/home-robbery.spec.ts', '--grep',
        r'uses the Player purse, reports both transactions and round-trips at 1280|renders and answers the normal home robbery at 1280|describes all controls blocked|blocks a 5 Money Market purchase',
    ]))
