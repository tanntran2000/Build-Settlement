import difflib
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile

ROOT = Path(r'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01')
DOC = Path(__file__).parent
BASE = 'b184357d235d164478584e36b96d063551124e66'
TREE = '961567de7ef638861a55a42589be203037e123c9'
scratch_file = DOC / 'scratch-location.txt'
if not scratch_file.exists():
    scratch_file.write_text(tempfile.mkdtemp(prefix='p7b-b3-step0-'), encoding='utf-8')
SCRATCH = Path(scratch_file.read_text(encoding='utf-8'))
if SCRATCH.is_relative_to(ROOT) or SCRATCH.is_relative_to(DOC):
    raise RuntimeError('Scratch must be outside the worktree and packet')
changes = {}
generated = {}
basefiles = {}
why = {}
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
def digest(data):
    return hashlib.sha256(data).hexdigest()
def canonical(value, pretty=False):
    return json.dumps(value, ensure_ascii=False, separators=None if pretty else (',', ':'), indent=2 if pretty else None)
def jsonout(name, value):
    (DOC / name).write_bytes((canonical(value, True) + '\n').encode('utf-8'))
def original(path):
    if path not in basefiles:
        basefiles[path] = git('show', BASE + ':' + path)
    return basefiles[path]
def edit(path, old, new, reason):
    data = changes.get(path, original(path))
    delimiter = '\r\n' if b'\r\n' in data else '\n'
    if isinstance(old,str):
        old = old.replace('\n', delimiter).encode('utf-8')
    if isinstance(new,str):
        new = new.replace('\n', delimiter).encode('utf-8')
    if data.count(old) != 1:
        raise ValueError((path, data.count(old), old[:160]))
    changes[path] = data.replace(old, new, 1)
    why.setdefault(path, set()).add(reason)
def replace_all(path, old, new, reason):
    data = changes.get(path, original(path))
    if old.encode() not in data:
        raise ValueError((path, old))
    changes[path] = data.replace(old.encode(), new.encode())
    why.setdefault(path, set()).add(reason)
def new(path, data, reason):
    generated[path] = (data.encode('utf-8') if isinstance(data, str) else data, reason)
def sha_info(data):
    return dict(bytes=len(data), sha256=digest(data), finalNewline=data.endswith(b'\n'), bom=data.startswith(b'\xef\xbb\xbf'))
def write_scratch():
    if not (SCRATCH / 'package.json').exists():
        with tarfile.open(fileobj=io.BytesIO(git('archive', '--format=tar', BASE))) as tar:
            tar.extractall(SCRATCH, filter='data')
    if not (SCRATCH / '.deps-ready').exists():
        deps = SCRATCH / 'node_modules'
        deps.mkdir(exist_ok=True)
        def junction(destination, target):
            command = 'mklink /J "{}" "{}"'.format(destination, target)
            if not destination.exists():
                subprocess.run('cmd.exe /d /c ' + command, check=True, stdout=subprocess.DEVNULL)
        for entry in (ROOT / 'node_modules').iterdir():
            if entry.name == '@haven' or entry.name.startswith('.vite'):
                continue
            if entry.is_dir():
                junction(deps / entry.name, entry)
            elif entry.name != '.package-lock.json':
                shutil.copy2(entry, deps / entry.name)
        (deps / '@haven').mkdir(exist_ok=True)
        for workspace in ('core', 'simulation', 'persistence', 'content', 'ui'):
            junction(deps / '@haven' / workspace, SCRATCH / 'packages' / workspace)
        source_ui_deps = ROOT / 'packages' / 'ui' / 'node_modules'
        if source_ui_deps.is_dir():
            scratch_ui_deps = SCRATCH / 'packages' / 'ui' / 'node_modules'
            scratch_ui_deps.mkdir(exist_ok=True)
            for entry in source_ui_deps.iterdir():
                if entry.is_dir() and not entry.name.startswith('.vite'):
                    junction(scratch_ui_deps / entry.name, entry)
        (SCRATCH / '.deps-ready').touch()
    for path, content in changes.items():
        (SCRATCH / path).write_bytes(content)
    for path, (content, _) in generated.items():
        target = SCRATCH / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
def write_inventories():
    records = []
    for path, content in sorted(changes.items()):
        before = original(path)
        old, updated = before.splitlines(keepends=True), content.splitlines(keepends=True)
        offsets = [0]
        for line in old:
            offsets.append(offsets[-1]+len(line))
        hunks = []
        for kind, i, j, k, l in difflib.SequenceMatcher(None, old, updated, autojunk=False).get_opcodes():
            if kind == 'equal':
                continue
            a, b = b''.join(old[i:j]), b''.join(updated[k:l])
            hunks.append(dict(baselineLine=i+1, baselineLineCount=j-i, proposedLine=k+1,
                startByte=offsets[i], endByte=offsets[j], before=a.decode('utf-8'), after=b.decode('utf-8')))
        verified = before
        for h in reversed(hunks):
            i,j = h['startByte'], h['endByte']
            assert verified[i:j] == h['before'].encode('utf-8')
            verified = verified[:i] + h['after'].encode('utf-8') + verified[j:]
        assert verified == content
        records.append(dict(path=path, reasons=sorted(why[path]), before=sha_info(before), after=sha_info(content), replacements=hunks))
    jsonout('source-replacements.json', dict(base=BASE, tree=TREE, source='Git blob bytes', files=records))
    jsonout('generated-byte-proposals.json', dict(base=BASE, tree=TREE, encoding='UTF-8', files=[
        dict(path=path, reason=reason, **sha_info(data), text=data.decode('utf-8'))
        for path, (data, reason) in sorted(generated.items())]))
for component in sorted(DOC.glob('draft-part-*.py')):
    exec(compile(component.read_text(encoding='utf-8'), str(component), 'exec'))
write_inventories()
if '--scratch' in sys.argv:
    write_scratch()
print(f'{len(changes)} existing paths, {len(generated)} new paths. Scratch: {SCRATCH}')
