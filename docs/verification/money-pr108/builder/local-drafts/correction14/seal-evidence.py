from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json
import re
import subprocess
import sys

here = Path(__file__).resolve().parent
repo = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scope = json.loads((here / 'scope.json').read_bytes())
head, tree, base = (scope[key] for key in ('head', 'tree', 'base'))
git = lambda *args: subprocess.check_output(['git', *args], cwd=repo, text=True).strip()
assert git('rev-parse', 'HEAD', 'HEAD^{tree}').split() == [head, tree]
assert not git('status', '--porcelain')
assert git('branch', '--show-current') == 'feat/money-robbery'

phase, gates_label, smoke_label = sys.argv[1:]
gates = here / 'M3.3' / gates_label
smoke = here / 'M3.3' / smoke_label
timing = here / 'M3.3/timing-1'
commands = [
    ('01-diff', 'git diff --check origin/main...HEAD'),
    ('02-lint', 'npm run lint'),
    ('03-typecheck', 'npm run typecheck'),
    ('04-check-architecture', 'npm run check:architecture'),
    ('05-test-architecture', 'npm run test:architecture'),
    ('06-unit', 'npm test'),
    ('07-build', 'npm run build'),
]
json_read = lambda path: json.loads(path.read_bytes())
def read(path):
    return re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', path.read_text(encoding='utf-8-sig', errors='strict'))

def passing(path, command=None):
    text = read(path)
    assert text.splitlines()[:3] == [f'HEAD {head}', f'Tree {tree}', f'Base {base}'], path
    assert re.search(r'^Exit 0 \| End UTC .+$', text, re.M), path
    if command:
        assert f'CI=1 {command}\n' in text, path
    return text

def selected(path):
    env = json_read(path)
    assert (env['testedHead'], env['testedTree']) == (head, tree)
    mean, peak = env['cpu']['meanCpuPercent'], max(env['cpu']['twoSecondCpuPercent'])
    assert mean <= 10 and peak <= 20 and env['systemRequired'], env
    if path.parent == gates or path.parent == smoke:
        assert env['portsInUse'] == [] and env['topProcesses'], env
    return mean, peak

gates_cpu = selected(gates / 'start-environment.json')
smoke_cpu = selected(smoke / ('pre-smoke-environment.json' if smoke == gates else 'start-environment.json'))
isolated_cpu = selected(timing / 'start-environment.json')
paired_cpu = selected(timing / 'pre-paired-environment.json')
passing(timing / 'isolated-week.txt')
passing(timing / 'paired-week.txt')
for filename, command in commands:
    passing(gates / (filename + '.txt'), command)
bundle = next(json.loads(line) for line in passing(gates / '07b-bundle.txt').splitlines() if line.startswith('{"gzipLevel"'))
gz = bundle['totalGzipBytes']
assert gz < 200000
unit = read(gates / '06-unit.txt')
unit_files = int(re.search(r'Test Files\s+(\d+) passed \(\1\)', unit)[1])
unit_tests = int(re.search(r'Tests\s+(\d+) passed \(\1\)', unit)[1])
arch = read(gates / '05-test-architecture.txt')
architecture_tests = int(re.search(r'^[#ℹ] pass (\d+)$', arch, re.M)[1])
assert re.search(r'^[#ℹ] fail 0$', arch, re.M)
browser = passing(smoke / '08-smoke.txt', 'npm run test:smoke')
smoke_tests = int(re.search(r'Running (\d+) tests using 1 worker', browser)[1])
smoke_result = re.search(r'^\s+' + str(smoke_tests) + r' passed \(([^)]+)\)', browser, re.M)
assert smoke_result
fulfillment = re.search(r'^  ok\s+\d+ .+character-life-navigation\.spec\.ts:225.+$', browser, re.M)
assert fulfillment
first = read(here / 'M3.3/gate-1/08-smoke.txt')
assert re.search(r'429 passed', first)
assert 'Test timeout of 60000ms exceeded.' in first
assert re.search(r'^Exit 1 \| End UTC .+$', first, re.M)
trace = json_read(here / 'M3.3/gate-1/fulfillment-raw/trace-summary.json')
assert len(trace['checks']) == 10 and all(check['error'] is None for check in trace['checks'])
isolated = json_read(timing / 'isolated-summary.json')
paired = json_read(timing / 'measurement-summary.json')['summary']
assert len(paired) == 8
assert {row['difficulty'] for row in isolated['results']} == {'normal', 'easy'}
assert all(row['npcCount'] == 100 and row['medianMs'] <= 0.05 for row in isolated['results'])
for row in isolated['results']:
    assert len(json_read(timing / (row['difficulty'] + '-isolated-raw-ns.json'))) == row['samples']
assert len(read(timing / 'raw-timings.ndjson').splitlines()) == 64
print(f'Verified {head}: gates 1–7, {unit_tests} unit, {architecture_tests} architecture, {smoke_tests} smoke, {gz} gzip bytes.')
if phase == 'check':
    sys.exit(0)
assert phase == 'seal'
remote = read(here / 'remote-head.txt')
assert f'{head}\trefs/heads/feat/money-robbery' in remote.splitlines()
assert 'Exit 0 | end UTC ' in remote and 'Exit 0 | end UTC ' in read(here / 'push.txt')
manifest = here / 'SHA256SUMS.txt'
readme = here / 'README.md'
today = datetime.now(timezone.utc).date()
lines = [
    '# Money M3 Correction 14 evidence', '',
    f'Builder verification, {today} UTC. Branch feat/money-robbery.', '',
    f'- Tested head: {head}', f'- Tested tree: {tree}', f'- Main base: {base}',
    f'- Astra round 1 reviewed: {scope["reviewed"]}', '',
    '## Owner decisions', '',
    '1. Invalid checkpoint card — “Từ chối file lỗi (Recommended)”',
    '2. At risk while a card waits — “Hiện số của thẻ (Recommended)”',
    '3. End Week timing — “Đo riêng rồi chấp nhận (Recommended)”',
    '4. Test fixes and quiet gates — “Duyệt sửa (Recommended)”', '',
    'The binding plan and Astra round 1 report are identified by SHA-256 in scope.json. '
    'The eight-path patch and before and after blob hashes are in correction14.patch and scope.json.', '',
    '## RED and focused verification', '',
    '| Run | Exit | Observed result |', '| --- | ---: | --- |',
    '| red-unit.txt | 1 | Reader accepted excess above balance and pending At risk was 9.088 instead of 30.088. |',
    '| red-current-browser.txt | 1 | The imported invalid card was accepted and the donated balance displayed 9.088 At risk. Six cases passed. |',
    '| red-final-import.txt | 1 | The final exact browser alert assertion failed because the invalid import was accepted. |',
    '| red-mutants-boundary.txt | 1 | Strictly less-than rejected an exactly backed card. Pay and Let go both failed to load that boundary checkpoint. |',
    '| red-mutants-browser.txt | 1 | Both exact End Week aria-disabled values, both eight-button Market shelf checks, and the matched hold control caught deliberate defects. |',
    '| green-focused-unit.txt | 0 | 25 passed. |',
    '| green-focused-browser.txt | 0 | 11 passed. |', '',
    'The first scratch mutation build exposed TypeScript narrowing rules for the integer validator. '
    'The second build added numeric casts after the validation and ran the deliberate fault tests. '
    'The mutation inventory and raw traces are in this packet.', '',
    'The existing browser alert for this rejected import is “This checkpoint is from an older version of Haven '
    'and can no longer be played. Start a New Game.” The test pins that copy and compares the live export and IndexedDB save.', '',
    '## Exact-head gates', '',
    '| # | Command | Exit | Result |', '| ---: | --- | ---: | --- |',
]
reports = ['Clean diff', 'Passed', 'Passed', 'Passed', f'{architecture_tests} passed',
           f'{unit_tests:,} passed in {unit_files} files', 'Built production assets']
for i, ((filename, command), report) in enumerate(zip(commands, reports), 1):
    lines.append(f'| {i} | {command} | 0 | {report} |')
lines += [
    f'| 8 | CI=1 npm run test:smoke | 0 | {smoke_tests} passed in {smoke_result[1]} |', '',
    f'Gate logs live in M3.3/{gates_label}/. The full smoke log is M3.3/{smoke_label}/08-smoke.txt.', '',
    'The first run passed gates 1–7. Full smoke returned exit 1 with 429 passes and the fulfillment '
    'case at its original 60-second timeout. All ten added End Week attribute assertions completed '
    f'successfully in {trace["totalMs"]:.3f} ms total in the preserved trace. '
    'The unchanged retry ran all seven gates and full smoke on the same commit. '
    'The retry captured top processes and confirmed both Playwright ports were free before starting each phase.', '',
    '| Phase | Ambient mean CPU | Ambient peak CPU |', '| --- | ---: | ---: |',
]
for label, (mean, peak) in [('Isolated End Week', isolated_cpu), ('Paired End Week', paired_cpu),
                            ('Gates 1–7', gates_cpu), ('Full smoke', smoke_cpu)]:
    lines.append(f'| {label} | {mean:.2f}% | {peak:.2f}% |')
lines += ['', '### Fulfillment smoke case', '', fulfillment[0].strip(), '',
    f'Production JS/CSS gzip total was {gz:,} bytes, against the 200,000-byte budget. '
    'The raw compressed assets and hashes are with the gate 7 evidence.', '',
    '## End Week with 100 NPCs', '',
    '| Difficulty | After-levy Money | Safe amount | Samples | Isolated median (ms) | Isolated p95 (ms) |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
]
for row in isolated['results']:
    lines.append(f'| {row["difficulty"].title()} | {row["moneyMilli"] / 1000:g} | {row["safeMilli"] / 1000:g} | '
                 f'{row["samples"]:,} | {row["medianMs"]:.4f} | {row["p95Ms"]:.4f} |')
lines += ['', 'The isolated median met the 0.05 ms threshold for both difficulties. '
    'The owner’s Correction 14 rule accepts the paired dispatch delta as measurement noise. R-026 and R-031 stay open.', '',
    '| Difficulty | Route | Base median (ms) | Head median (ms) | Head p95 (ms) | Paired median delta (ms) | A/A median delta (ms) |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
]
for row in paired:
    lines.append(f'| {row["difficulty"].title()} | {row["scenario"]} | {row["baseMs"]["median"]:.3f} | '
                 f'{row["headMs"]["median"]:.3f} | {row["headMs"]["p95"]:.3f} | '
                 f'{row["pairedMedianDeltaMs"]["median"]:+.3f} | {row["aaMedianDeltaMs"]["median"]:+.3f} |')
lines += ['', 'The timed code, raw per-call nanoseconds, paired samples and representative saves are in M3.3/timing-1/. '
    'The isolated probe runs the dispatcher’s guard expressions and the production check. '
    'The paired run alternates A/B and B/A block order against the M2 base, with an A/A control.', '',
    '| Save with a pending card | Bytes | Bytes without card | Difference (bytes) |',
    '| --- | ---: | ---: | ---: |',
]
for difficulty in ['normal', 'easy']:
    save = json_read(timing / (difficulty + '-save-size.json'))
    lines.append(f'| {difficulty.title()} | {save["pendingBytes"]:,} | {save["nullBytes"]:,} | {save["delta"]:,} |')
lines += ['', '## Remote and storage', '',
    'The remote feature branch was verified at the tested head. This was a branch-only push.', '',
    'The assigned worktree and existing checkout were retained. Storage reclaimed was 0 bytes.', '']
text = '\n'.join(lines)
assert '\ufffd' not in text
assert all(quote in text for quote in ['Từ chối file lỗi', 'Hiện số của thẻ', 'Đo riêng rồi chấp nhận', 'Duyệt sửa'])
readme.write_bytes(text.encode('utf-8'))
assert readme.read_bytes().decode('utf-8') == text
files = sorted(path for path in here.rglob('*') if path.is_file() and path != manifest)
hashes = {file:sha256(file.read_bytes()).hexdigest() for file in files}
manifest.write_bytes(''.join(f'{digest}  {file.relative_to(here).as_posix()}\n' for file,digest in hashes.items()).encode())
for line in manifest.read_text(encoding='utf-8').splitlines():
    digest, relative = line.split('  ', 1)
    assert sha256((here / relative).read_bytes()).hexdigest() == digest, relative
print(f'Sealed and verified {len(files)} files. Manifest SHA-256 {sha256(manifest.read_bytes()).hexdigest()}.')
