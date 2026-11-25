from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import os
import sys
import subprocess

DOC = Path(__file__).parent
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
scratch = Path((DOC / 'scratch-location.txt').read_text(encoding='utf-8'))
git_dir = subprocess.check_output(['git','rev-parse','--absolute-git-dir'], cwd=ROOT, text=True).strip()
env = dict(os.environ, GIT_DIR=git_dir, GIT_WORK_TREE=str(scratch), P7B_B3_BASE_REPO=str(ROOT), P7B_STEP0_MEASURE='1',
           NO_COLOR='1', FORCE_COLOR='0', PYTHONIOENCODING='utf-8')
base = 'b184357d235d164478584e36b96d063551124e66'
tree = '961567de7ef638861a55a42589be203037e123c9'
node = 'node'
def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')
def check(name, commands):
    report = [f'Base HEAD {base}', f'Base tree {tree}', f'Candidate {scratch} (plain snapshot)', f'Check group {name}']
    for cwd, args in commands:
        report.append(f'\nUTC start {now()}\nCWD {cwd}\n$ '+subprocess.list2cmdline(args))
        run = subprocess.run(args, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        output = run.stdout.decode('utf-8', errors='replace')
        report += [output.rstrip(), f'UTC finish {now()}\nExit {run.returncode}']
        if name == 'fixture-path-proof' and run.returncode == 0:
            want = (scratch / 'packages/simulation/src/__tests__/fixtures/p7b-b3-path-diff.txt').read_bytes()
            assert run.stdout.replace(b'\r\n', b'\n') == want
        print(f'{name}: exit {run.returncode} ({args[-1]})', flush=True)
    (DOC / f'verification-{name}.txt').write_text('\n'.join(report)+'\n', encoding='utf-8', newline='\n')

checks = {
    'typescript': [(scratch, [node, 'node_modules/typescript/bin/tsc', '-p', f'packages/{package}/tsconfig.json', '--noEmit'])
                   for package in ('core','simulation','persistence','content')] +
                  [(scratch / 'packages/ui', [node, '../../node_modules/svelte-check/bin/svelte-check', '--tsconfig', './tsconfig.json'])],
    'eslint': [(scratch, [node, 'node_modules/eslint/bin/eslint.js', '.', '--max-warnings=0'])],
    'fixture-path-proof': [(scratch, [node, 'packages/simulation/src/__tests__/fixtures/p7b-b3-path-diff.ts'])],
    'e2e-discovery': [(scratch, [node, 'node_modules/@playwright/test/cli.js', 'test', 'tests/e2e/acquisition.spec.ts', '--list'])],
    'unit-scoped': [(scratch, [node, 'node_modules/vitest/vitest.mjs', 'run', '--maxWorkers=4', '--disableConsoleIntercept', 'npc-acquisition.test.ts', 'npc-auction.test.ts', 'acquisition-view.test.ts', 'law-week.test.ts', 'craft-week.test.ts', 'items-week.test.ts', 'session-records.test.ts', 'p7b-checkpoint.test.ts', 'catalog-golden.test.ts'])],
}
with ThreadPoolExecutor(max_workers=3) as pool:
    results = [pool.submit(check, name, steps) for name, steps in checks.items() if len(sys.argv) == 1 or name in sys.argv[1:]]
    for result in results:
        result.result()
