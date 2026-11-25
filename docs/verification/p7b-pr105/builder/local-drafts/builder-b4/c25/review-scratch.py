import difflib
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone

BASE = '15cfc2c71aba0799e4d936c09b77529a53724272'
TREE = 'd9225177b6c416384112f6bf340a4b11b8302273'
EVIDENCE = Path(__file__).resolve().parent
ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
HOUSEHOLD = 'tests/e2e/household.spec.ts'
GOODS = 'tests/e2e/goods-stock.spec.ts'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def replace(data, before, after):
    assert data.count(before) == 1, before
    return data.replace(before, after)


def json_out(name, content):
    (EVIDENCE / name).write_bytes((json.dumps(content, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def describe(data):
    return dict(bytes=len(data), sha256=sha(data),
                gitBlob=hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest(),
                endsWithNewline=data.endswith(b'\n'))


def inventory(name, path, before, after):
    old = before.splitlines(keepends=True)
    new = after.splitlines(keepends=True)
    edits = []
    for tag, i, j, k, l in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        if tag != 'equal':
            start = sum(map(len, old[:i]))
            end = start + sum(map(len, old[i:j]))
            edits.append(dict(beforeLine=i + 1, afterLine=k + 1, startByte=start, endByteExclusive=end,
                              before=before[start:end].decode(), after=b''.join(new[k:l]).decode()))
    replay = before
    for edit in reversed(edits):
        start, end = edit['startByte'], edit['endByteExclusive']
        assert replay[start:end] == edit['before'].encode()
        replay = replay[:start] + edit['after'].encode() + replay[end:]
    assert replay == after
    json_out(name + '-byte-inventory.json', dict(base=BASE, tree=TREE, file=path, encoding='UTF-8',
                                                before=describe(before), after=describe(after), replacements=edits))
    patch = f'diff --git a/{path} b/{path}\n'.encode() + b''.join(difflib.diff_bytes(
        difflib.unified_diff, old, new, f'a/{path}'.encode(), f'b/{path}'.encode()))
    (EVIDENCE / (name + '.patch')).write_bytes(patch)


def junction(link, target):
    command = 'mklink /J "{}" "{}"'.format(link, target)
    subprocess.run('cmd.exe /d /c ' + command, check=True, stdout=subprocess.DEVNULL)


def create_scratch():
    scratch = Path(tempfile.mkdtemp(prefix='p7b-b4-c25-'))
    (EVIDENCE / 'scratch-path.txt').write_bytes((str(scratch) + '\n').encode())
    with tarfile.open(fileobj=io.BytesIO(git('-c', 'core.autocrlf=false', 'archive', '--format=tar', BASE))) as source:
        source.extractall(scratch, filter='data')
    deps = scratch / 'node_modules'
    deps.mkdir()
    for entry in (ROOT / 'node_modules').iterdir():
        if entry.name in {'@haven', '.package-lock.json'} or entry.name.startswith('.vite'):
            continue
        if entry.is_dir():
            junction(deps / entry.name, entry)
        else:
            shutil.copy2(entry, deps / entry.name)
    (deps / '@haven').mkdir()
    for workspace in ('core', 'simulation', 'persistence', 'content', 'ui'):
        junction(deps / '@haven' / workspace, scratch / 'packages' / workspace)
    ui_deps = scratch / 'packages/ui/node_modules'
    ui_deps.mkdir()
    for entry in (ROOT / 'packages/ui/node_modules').iterdir():
        if entry.is_dir() and not entry.name.startswith('.vite'):
            junction(ui_deps / entry.name, entry)
    measured = json.loads((EVIDENCE.parent / 'bundle/bundle-and-served-hashes.json').read_bytes())
    assert (measured['head'], measured['tree']) == (BASE, TREE)
    for item in measured['manifest']:
        rel = 'packages/ui/dist' if item['build'] == 'production' else 'packages/ui/regression/dist'
        dest = scratch / rel
        shutil.copytree(ROOT / rel, dest)
        assert sha((dest / 'index.html').read_bytes()) == item['indexSha256']
        for asset in item['assets']:
            assert sha((dest / asset['file']).read_bytes()) == asset['sha256']
    json_out('reused-browser-build.json', dict(head=BASE, tree=TREE, manifest=measured['manifest']))
    print(scratch, flush=True)


def utc():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


household_base = git('show', f'{BASE}:{HOUSEHOLD}')
goods_base = git('show', f'{BASE}:{GOODS}')
household_green = replace(
    household_base,
    b"    await expect(sheet.getByRole('region', { name: 'Starting past' })).toContainText('Outsider partners2');\n",
    b"    const past = sheet.getByRole('region', { name: 'Starting past', exact: true });\n"
    b"    const outsiderPartners = past.getByText('Outsider partners', { exact: true });\n"
    b"    await expect(outsiderPartners.locator('xpath=following-sibling::dd')).toHaveText('2');\n",
)
household_red = replace(household_green, b"counters['partners.outsider'] = 2;\n", b"counters['partners.outsider'] = 20;\n")
goods_red = replace(goods_base, b"  expect(debit).toBe(30000 + 20000);\n", b"  expect(debit).toBe(30000);\n")
goods_green = replace(
    goods_red,
    b"    debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold;\n",
    b"    const wagesPaidMilli = report.household?.wagesPaidMilli ?? 0;\n"
    b"    expect(wagesPaidMilli).toBe(4000);\n"
    b"    debit += report.before.gold + report.taxMilli + report.goods.revenueMilli - report.after.gold - wagesPaidMilli;\n",
)

if sys.argv[1] == 'prepare':
    assert git('rev-parse', 'HEAD', 'HEAD^{tree}').decode().splitlines() == [BASE, TREE]
    assert not git('status', '--porcelain')
    inventory('f1-approved', HOUSEHOLD, household_base, household_green)
    inventory('f1-red-fixture', HOUSEHOLD, household_green, household_red)
    inventory('f2-proposal', GOODS, goods_base, goods_green)
    inventory('f2-red-original-pin', GOODS, goods_base, goods_red)
    assert (ROOT / HOUSEHOLD).read_bytes() == household_base
    assert git('show', f'{BASE}^:{GOODS}') == goods_red
    create_scratch()
    sys.exit(0)

runs = {
    'f1-red': (HOUSEHOLD, household_red),
    'f1-green': (HOUSEHOLD, household_green),
    'f2-red': (GOODS, goods_red),
    'f2-green': (GOODS, goods_green),
}
run = sys.argv[1]
path, data = runs[run]
scratch = Path((EVIDENCE / 'scratch-path.txt').read_text(encoding='utf-8').strip())
assert scratch.parent == Path(tempfile.gettempdir())
assert (scratch / 'package.json').read_bytes() == git('show', f'{BASE}:package.json')
assert (scratch / 'playwright.config.ts').read_bytes() == git('show', f'{BASE}:playwright.config.ts')
for port in (4173, 4174):
    for host in ('127.0.0.1', '::1'):
        family = socket.AF_INET if host == '127.0.0.1' else socket.AF_INET6
        with socket.socket(family, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            assert sock.connect_ex((host, port)) != 0, ('Port in use', host, port)
(scratch / path).write_bytes(data)
command = ['node', 'node_modules/@playwright/test/cli.js', 'test', path, '--output', f'c25-artifacts/{run}']
env = dict(os.environ, CI='1', FORCE_COLOR='0')
env.pop('NO_COLOR', None)
log = EVIDENCE / f'{run}.txt'
if log.exists():
    raise SystemExit(f'Preserve the earlier log before retrying {run}')
with log.open('wb') as out:
    note = (f'UTC start {utc()}\nBase {BASE}\nTree {TREE}\nScratch {scratch}\n'
            f'Spec {path}\nSpec SHA-256 {sha(data)}\nConfig SHA-256 {sha((scratch / "playwright.config.ts").read_bytes())}\n'
            f'$ CI=1 {" ".join(command)}\n')
    out.write(note.encode())
    out.flush()
    result = subprocess.run(command, cwd=scratch, env=env, stdout=out, stderr=subprocess.STDOUT)
    out.write(f'\nUTC finish {utc()}\nExit {result.returncode}\n'.encode())
for item in sorted((scratch / 'c25-artifacts' / run).glob('*/error-context.md')):
    dest = EVIDENCE / 'raw-artifacts' / run / item.parent.name
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy2(item, dest / item.name)
sys.stdout.buffer.write(log.read_bytes())
sys.exit(result.returncode)
