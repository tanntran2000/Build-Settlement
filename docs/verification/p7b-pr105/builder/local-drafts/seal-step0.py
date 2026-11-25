import hashlib
import json
from pathlib import Path
import subprocess

packet = Path(__file__).parent
root = Path(r'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
scratch = Path((packet / 'scratch-location.txt').read_text(encoding='utf-8').strip())
sha = lambda data: hashlib.sha256(data).hexdigest()
read = lambda name: (packet / name).read_text(encoding='utf-8-sig')
old = json.loads(read('source-replacements.json'))
generated = json.loads(read('generated-byte-proposals.json'))
report = packet / 'STEP0-HOLD.md'
prefix = report.read_text(encoding='utf-8').split('\n<!-- Exact-byte table begins -->\n', 1)[0].rstrip()
lines = [prefix, '', '<!-- Exact-byte table begins -->', '',
    '| Baseline source | Hunk start lines | Reason |',
    '| --- | --- | --- |']
for f in old['files']:
    path = f['path']
    locations = ', '.join(str(r['baselineLine']) for r in f['replacements'])
    why = ' · '.join(f['reasons'])
    lines.append(f'| {path} | {locations} | {why} |')
    baseline = subprocess.check_output(['git','show',old['base'] + ':' + path], cwd=root)
    assert sha(baseline) == f['before']['sha256']
    for h in reversed(f['replacements']):
        i, j = h['startByte'], h['endByte']
        assert baseline[i:j] == h['before'].encode('utf-8')
        baseline = baseline[:i] + h['after'].encode('utf-8') + baseline[j:]
    assert sha(baseline) == f['after']['sha256'] and (scratch / path).read_bytes() == baseline
lines.extend(['','| Proposed new file | Bytes | Purpose |','| --- | ---: | --- |'])
for f in generated['files']:
    lines.append(f"| {f['path']} | {f['bytes']} | {f['reason']} |")
    data = f['text'].encode('utf-8')
    assert sha(data) == f['sha256'] and (scratch / f['path']).read_bytes() == data

lines.extend(['', '### Existing-file hunks', '',
              'Diff display strips line terminators for readability. The JSON contains the exact UTF-8 bytes and line terminators.'])
for f in old['files']:
    lines.extend(['', '<details>', f"<summary>{f['path']}</summary>", '', '~~~~diff'])
    for h in f['replacements']:
        lines.append(f"@@ -{h['baselineLine']},{h['baselineLineCount']} +{h['proposedLine']} @@")
        for marker, value in [('-', h['before']), ('+', h['after'])]:
            lines.extend(marker + text for text in value.splitlines())
            if value and not value.endswith('\n'):
                lines.append('\\ No newline at end of file')
    lines.extend(['~~~~', '', '</details>'])
report.write_bytes(('\n'.join(lines) + '\n').encode('utf-8'))
for name in ['STEP0-HOLD.md', 'README.md', 'source-replacements.json', 'generated-byte-proposals.json']:
    text = (packet / name).read_bytes().decode('utf-8')
    assert '\ufffd' not in text
for quote in ['Duyệt P7-B', 'Duyệt, giao B1', 'Start B4 Step 0', '—', '→']:
    assert quote in read('STEP0-HOLD.md')
assert not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=normal'], cwd=root)
paths = sorted(p for p in packet.iterdir() if p.is_file() and p.name != 'SHA256SUMS.txt')
manifest = ''.join(f'{sha(p.read_bytes())}  {p.name}\n' for p in paths)
(packet / 'SHA256SUMS.txt').write_bytes(manifest.encode('utf-8'))
for line in read('SHA256SUMS.txt').splitlines():
    digest, name = line.split('  ', 1)
    assert digest == sha((packet / name).read_bytes()), name
print(f"{len(old['files'])} existing paths / {sum(len(f['replacements']) for f in old['files'])} hunks; "
      f"{len(generated['files'])} new paths. {len(paths)} verified manifest entries. Detached worktree clean.")

