import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from datetime import datetime, timezone

evidence = Path(__file__).resolve().parent
root = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')


def git(*args):
    return subprocess.check_output(['git', *args], cwd=root).decode().strip()


def read(name):
    return (evidence / name).read_text(encoding='utf-8')


def write(name, content):
    (evidence / name).write_bytes(content.encode('utf-8'))


f1 = json.loads(read('f1-approved-byte-inventory.json'))
f2 = json.loads(read('f2-proposal-byte-inventory.json'))
f1_red, f1_green, f2_red, f2_green = (read(run + '.txt') for run in ('f1-red', 'f1-green', 'f2-red', 'f2-green'))
assert f1_red.count('Received: "20"') == 2 and f1_red.count('Expected: "2"') == 2
assert '2 failed' in f1_red and f1_red.rstrip().endswith('Exit 1')
assert '2 passed' in f1_green and f1_green.rstrip().endswith('Exit 0')
assert f2_red.count('Expected: 30000') == 2 and f2_red.count('Received: 50000') == 2
assert '2 failed' in f2_red and f2_red.rstrip().endswith('Exit 1')
assert '2 passed' in f2_green and f2_green.rstrip().endswith('Exit 0')
for log in (f1_red, f1_green):
    assert all(f'at {width}' in log for width in (1280, 1600))
for log in (f2_red, f2_green):
    assert all(f'at {width}px' in log for width in (375, 1280))
assert f1['after']['sha256'] in f1_green and f2['after']['sha256'] in f2_green
assert git('rev-parse', 'HEAD^') == f1['base']
head, tree = git('rev-parse', 'HEAD', 'HEAD^{tree}').splitlines()
assert git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD') == f1['file']
assert git('rev-parse', f'HEAD:{f1["file"]}') == f1['after']['gitBlob']
assert git('rev-parse', f'HEAD:{f2["file"]}') == f2['before']['gitBlob']
assert not git('status', '--porcelain')
checked = subprocess.run(['git', 'apply', '--cached', '--check', str(evidence / 'f2-proposal.patch')],
                         cwd=root, check=True, capture_output=True, text=True)
remote = git('ls-remote', '--exit-code', 'origin', 'refs/heads/feat/p7b-servants-wages')
assert remote.split()[0] == f1['base']
assert not git('status', '--porcelain')

scratch = Path(read('scratch-path.txt').strip())
items = []
for item in sorted((scratch / 'c25-artifacts').rglob('*')):
    if item.name not in {'trace.zip', 'goods-week5-report.png', 'goods-week5-city.png'}:
        continue
    data = item.read_bytes()
    items.append(dict(path=item.relative_to(scratch).as_posix(), bytes=len(data),
                      sha256=hashlib.sha256(data).hexdigest()))
    if item.name == 'goods-week5-report.png' and 'f2-green' in item.parts:
        dest = evidence / 'raw-artifacts' / 'f2-green' / item.parent.name
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest / item.name)
write('scratch-artifacts.json', json.dumps(items, ensure_ascii=False, indent=2) + '\n')

now = datetime.now(timezone.utc).isoformat(timespec='seconds')
write('hold-worktree.txt', f'UTC {now}\nHEAD {head}\nTree {tree}\n'
      f'$ git apply --cached --check f2-proposal.patch\n{checked.stdout}{checked.stderr}Exit {checked.returncode}\n'
      f'Goods blob at HEAD {f2["before"]["gitBlob"]}\n'
      f'$ git status --short --branch\n{git("status", "--short", "--branch")}\n'
      f'$ git ls-remote --exit-code origin refs/heads/feat/p7b-servants-wages\n{remote}\nExit 0\n')
write('HOLD.md', f"""# P7-B B4 Correction 25 · F2 HOLD

The pending owner decision is whether to approve [the independent debit assertions](f2-proposal.patch). The review base is `{f1['base']}` (tree `{f1['tree']}`). The local branch has one additional commit `{head}` (tree `{tree}`). The remote branch is still at the review base. [Worktree and remote verification](hold-worktree.txt)

## F1 · Exact History count committed

Owner (Tân), verbatim — “Duyệt sửa test (Recommended)”.

The test selects the exact `Outsider partners` term in the Starting past region and checks its sibling `dd` with `toHaveText('2')`. A scratch fixture rendered `20` in the existing UI and both 1280 and 1600 tests failed at that assertion (exit 1). Restoring the fixture to `2` made both pass (exit 0). The local test-only commit is `{head}` with subject `test(e2e): exact starting past count in the household sheet`. [RED](f1-red.txt) · [GREEN](f1-green.txt) · [Commit proof](f1-commit.txt)

In `tests/e2e/household.spec.ts:38`, the single replaced byte interval is `[2100, 2208)` in the review-base Git blob. The UTF-8 file keeps LF line endings and its final newline. Its SHA-256 is `{f1['after']['sha256']}`. [Applied patch](f1-approved.patch) · [Exact bytes and hashes](f1-approved-byte-inventory.json) · [Temporary fixture mutation](f1-red-fixture.patch)

## F2 · Independent five-week Goods and wage pins

Owner (Tân), verbatim — “Không, giữ HOLD”.

The scratch RED run restored the exact pre-amendment spec from the parent of `15cfc2c`. At both 375 and 1280, the original 30,000 milli pin received 50,000 milli after the fifth week (exit 1). After applying the proposed assertions in the same scratch copy, both widths passed (exit 0). [RED](f2-red.txt) · [GREEN](f2-green.txt)

The proposed bytes read wages from the rendered weekly report and pin **4,000 milli each week**. The fixture hires three servants whose weekly wages are **1,000 + 2,000 + 1,000 milli**. The debit formula deducts the reported payroll and keeps the original **30,000 milli** pin on the remaining five-week debit in the Goods scenario. These independent equalities imply an exact 50,000 milli total and reject changes to either component even if they cancel in the total. A missing wage row also fails the 4,000 milli check. The five-week loop, exact report and checkpoint comparisons, stock pins, viewport coverage and default timeouts are preserved. [Independent fixture proof](../c24-goods-scope-proof.txt)

The two proposed replacements are review-base byte intervals `[1930, 2029)` and `[2751, 2788)` in `tests/e2e/goods-stock.spec.ts`. The proposed UTF-8 blob keeps LF line endings and its final newline. Its SHA-256 is `{f2['after']['sha256']}`. The patch applies cleanly to the current index in check-only mode. F2 is uncommitted and the worktree is clean. [Proposal patch](f2-proposal.patch) · [Exact bytes and hashes](f2-proposal-byte-inventory.json) · [Temporary original-pin patch](f2-red-original-pin.patch)

## Verification scope

Only the two targeted Playwright specs ran with the original configuration and retries. Both preview builds were reused from the reviewed head and verified against their recorded bundle hashes. Vite printed Git metadata warnings because the scratch tree is a plain archive. The scratch archive and its traces are retained for this HOLD. No worktree or branch was created. No storage was reclaimed. [Reproduction script](review-scratch.py) · [Reused build manifest](reused-browser-build.json) · [Raw artifact hashes](scratch-artifacts.json)

Gates 1–7, full smoke and branch push await the F2 decision. R-026 remains open under the existing 50 ms budget. Correction 25 adds no timing gate. [Paired timing evidence](../paired-end-week-timings.txt)
""")
for value in ['Duyệt sửa test (Recommended)', 'Không, giữ HOLD', '1–7']:
    assert value.encode('utf-8') in (evidence / 'HOLD.md').read_bytes()
manifest = evidence / 'SHA256SUMS.txt'
with manifest.open('w', encoding='utf-8', newline='\n') as sink:
    for item in sorted(evidence.rglob('*')):
        if item.is_file() and item != manifest:
            sink.write(f'{hashlib.sha256(item.read_bytes()).hexdigest()}  {item.relative_to(evidence).as_posix()}\n')
for entry in manifest.read_text(encoding='utf-8').splitlines():
    digest, name = entry.split('  ', maxsplit=1)
    assert hashlib.sha256((evidence / name).read_bytes()).hexdigest() == digest, name
print('HOLD evidence SHA256SUMS.txt', hashlib.sha256(manifest.read_bytes()).hexdigest())
print('F2 patch', hashlib.sha256((evidence / 'f2-proposal.patch').read_bytes()).hexdigest())
print('Local', head, 'remote', remote)
