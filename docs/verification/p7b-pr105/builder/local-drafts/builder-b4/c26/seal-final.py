import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

evidence = Path(__file__).resolve().parent
builder = evidence.parent
root = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
head = '90519b682846de9ad336c30db53f4b0b07afb2a2'
tree = 'b138254d44b76e3b2c8c6eb853449608a3bbc094'
parent = '0bd1b245262e4801b052f7eabbebbe2beec7d884'
measured = '15cfc2c71aba0799e4d936c09b77529a53724272'
main = '95821832a8c95988c3203b4c38f5f9ae665978e9'
branch = 'feat/p7b-servants-wages'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)


def read(path):
    return path.read_text(encoding='utf-8')


def write(path, data):
    path.write_bytes(data.encode('utf-8'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_log(path):
    data = read(path)
    assert data.splitlines()[:3] == ['HEAD and tree', head, tree], path
    assert data.rstrip().endswith('Exit 0'), path
    return data


def log_for(stem):
    retry = evidence / f'{stem}-retry2.txt'
    return retry if retry.exists() else evidence / f'{stem}.txt'


def count(pattern, data):
    return int(re.search(pattern, data, flags=re.MULTILINE).group(1))


assert git('rev-parse', 'HEAD', 'HEAD^{tree}', 'HEAD^', 'origin/main').decode().splitlines() == [head, tree, parent, main]
assert git('branch', '--show-current').decode().strip() == branch
assert not git('status', '--porcelain=v1')
assert git('diff-tree', '--no-commit-id', '--name-only', '-r', head).splitlines() == [b'tests/e2e/goods-stock.spec.ts']
assert git('diff', '--name-only', measured, head).splitlines() == [b'tests/e2e/goods-stock.spec.ts', b'tests/e2e/household.spec.ts']
assert git('diff', '--name-only', main, head) == git('diff', '--name-only', main, measured)
assert git('rev-parse', f'{measured}:packages') == git('rev-parse', f'{head}:packages')
for label in ('f1-approved', 'f2-proposal'):
    item = json.loads((builder / 'c25' / f'{label}-byte-inventory.json').read_bytes())
    content = git('show', f'HEAD:{item["file"]}')
    assert hashlib.sha256(content).hexdigest() == item['after']['sha256']
assert sha(builder / 'c25/f2-proposal.patch') == 'c50a6a311ba3dfb962c87c0bea9531dc2cbbc37d319095c9d68bb10899a35caa'
assert sha(builder.parent / 'binding-plan-a9d3c7c.md') == 'b3502a24007ec02aaa7933b88595851d310ae3bfc31c3f56a8984b273db26ef8'
gate_names = ('diff', 'lint', 'typecheck', 'architecture', 'architecture-tests', 'unit', 'build')
gates = [checked_log(log_for(f'gate-{number}-{name}')) for number, name in enumerate(gate_names, start=1)]
architecture = count(r'^ℹ pass (\d+)$', gates[4])
unit = count(r'^ *Tests +(\d+) passed', gates[5])
smoke_path = log_for('gate-8-smoke')
smoke_log = checked_log(smoke_path)
smoke = count(r'^ *(\d+) passed \(', smoke_log)
assert (architecture, unit, smoke) == (154, 3286, 417)
assert 'CI=1\n' in smoke_log
assert 'Windows system sleep inhibited for this process while the child runs.' in smoke_log
assert 'Process execution-state request released.' in smoke_log
smoke_tag = '-retry2' if smoke_path.stem.endswith('-retry2') else ''
before = f'environment-before-smoke{smoke_tag}.txt'
after = f'environment-after-smoke{smoke_tag}.txt'
for name in ('environment-before-gates.txt', before, after):
    data = read(evidence / name)
    for marker in (head, tree, 'Ports 4173 and 4174 free', 'CPU current load', 'Top processes by sampled CPU seconds'):
        assert marker in data, (name, marker)
write(evidence / 'gates-1-7.txt', '\n'.join(gates))
scope = subprocess.check_output([sys.executable, str(builder / 'check-push-scope.py')], cwd=root)
(evidence / 'push-scope.txt').write_bytes(scope)
push = ''
if '--pushed' in sys.argv:
    push_log = checked_log(evidence / 'push.txt')
    remote = checked_log(evidence / 'remote-head.txt')
    assert f'{head}\trefs/heads/{branch}' in remote
    assert 'HEAD:refs/heads/' + branch in push_log
    push = '\nThe branch was pushed and the remote ref was verified against the tested SHA. No pull request was opened. [Push](push.txt) · [Remote ref](remote-head.txt)\n'
attempt_notes = evidence / 'attempt-notes.md'
notes = '' if not attempt_notes.exists() else '\n' + read(attempt_notes) + '\n'
report = f"""# P7-B B4 Correction 26 · Builder verification

Builder Codex · 2026-11-25  
Branch `{branch}`  
Tested head `{head}` · tree `{tree}`  
Base `origin/main` `{main}`

Owner (Tân), verbatim — “Duyệt patch P2 (Recommended)”.

The F2 commit applies patch SHA-256 `c50a6a311ba3dfb962c87c0bea9531dc2cbbc37d319095c9d68bb10899a35caa` above `{parent}`. The spec pins 4,000 milli of wages in each report and 30,000 milli of five-week debit after subtracting wages. [Commit and blob proof](commit.txt) · [Exact approved bytes](../c25/f2-proposal-byte-inventory.json) · [F2 RED](../c25/f2-red.txt) · [F2 GREEN](../c25/f2-green.txt)

| Verification | Result |
| --- | --- |
| Gates 1–7 | Pass · diff check, lint, typecheck, architecture, architecture tests, unit, build |
| Architecture tests | {architecture}/{architecture} passed |
| Unit tests | {unit}/{unit} passed |
| Full smoke with `CI=1` | {smoke}/{smoke} passed |

[Full gates log](gates-1-7.txt) · [Full smoke log]({smoke_path.name}) · [Pre-gates CPU and ports](environment-before-gates.txt) · [Pre-smoke CPU and ports]({before}) · [Post-smoke environment]({after})

Windows system sleep inhibition was held for the full smoke command and released when it finished. The Playwright configuration, test timeouts and product sources retain their previous bytes.
{notes}
## Measurements from `15cfc2c`

Only `goods-stock.spec.ts` and `household.spec.ts` changed since `{measured}`. The production bundle, largest-save and paired End Week measurements were reused under Correction 26. Gate 7 still ran on `{head}`.

- Bundle was 173,844 bytes gzip. [Bundle measurement](../bundle/bundle-and-served-hashes.json)
- The 100-NPC and 86-notice checkpoint measured 294,186 bytes as JSON and 309,847 bytes as serialized IndexedDB. [Largest save](../save-size/largest-notice-measurement.json)
- The paired End Week measurements carry forward, including main-to-main noise. R-026 remains open. [Paired timings](../timings/comparison.json) · [Raw timings](../timings/raw-timings.json)
{push}"""
write(evidence / 'README.md', report.rstrip() + '\n')
assert 'Duyệt patch P2 (Recommended)'.encode('utf-8') in (evidence / 'README.md').read_bytes()
manifest = evidence / 'SHA256SUMS.txt'
files = [p for p in sorted(evidence.rglob('*')) if p.is_file() and p != manifest]
write(manifest, ''.join(f'{sha(p)}  {p.relative_to(evidence).as_posix()}\n' for p in files))
for entry in read(manifest).splitlines():
    digest, member = entry.split('  ', maxsplit=1)
    assert sha(evidence / member) == digest, member
print(f'Architecture {architecture} | Unit {unit} | Full smoke {smoke}')
print('Evidence manifest SHA-256', sha(manifest))
