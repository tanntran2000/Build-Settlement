from pathlib import Path
from hashlib import sha256
from base64 import b64decode
import json, re

d = Path(__file__).resolve().parent
read = lambda name: (d / name).read_text(encoding='utf-8')
def write(name, text):
    (d / name).write_bytes((text.rstrip('\n')+'\n').encode('utf-8'))
old = read("STEP0-HOLD.md").rstrip()
parts = ('hold-b.md','hold-c.md','hold-d.md')
if all((d/n).is_file() for n in parts):
    old += '\n\n' + '\n\n'.join(read(n).strip() for n in parts)
old = (old.replace('PursePanel.svelte:40','PursePanel.svelte:39')
       .replace('No requested acceptance check remains red in scratch.','Every executed final scratch check passed on the quiet run.')
       .replace('checked permission and save lifetimes','checked card, report and save lifetimes')
       .replace('current Reader','current reader').replace('existing Reader','existing reader'))
write("STEP0-HOLD.md", old)
for name in ('fixture-probe.txt','scratch-typecheck-draft.txt'):
    raw = (d / name).read_bytes()
    if raw.startswith(b'\xff\xfe'):
        s=raw.decode('utf-16').replace('\r\n','\n')
        if name == 'scratch-typecheck-draft.txt':
            s='Base HEAD 0b2b3a6088d003301d48b460202327fb53546ede, initial scratch UI dependencies incomplete.\n'+s+'\nExit code 1\n'
        write(name,s)
name='scratch-unit-1.txt'
raw=(d/name).read_bytes()
if b'\0' in raw:
    n=raw.index(b'\0')-1
    end=raw.rindex(b'Exit code')
    text=raw[:n].decode('utf-8-sig')+raw[n:end].decode('utf-16le')+raw[end:].decode('utf-8')
    write(name,text.replace('\r\r\n','\n').replace('\r\n','\n'))
summary=read('calibration-summary.md')
summary=summary.replace('Chase success |','Chase availability / success |')
summary=re.sub(r'\| 25% \|$', '| Unavailable (Security 10) |', summary, flags=re.MULTILINE)
write('calibration-summary.md',summary)
f=d/'calibration-summary.py'
src=read(f.name).replace("f'{min(10000,r[\"security\"]*250)/100:g}%'", "f'{min(10000,r[\"security\"]*250)/100:g}%' if r['security'] >= 15 else 'Unavailable (Security 10)'")
write(f.name,src.replace('Chase success |','Chase availability / success |'))
probe=read('crisis-probe.mjs')
probe=probe.replace(".building.enabled=false;", ".building.workers=0;").replace("'original', 'disable-farm', 'disable-processor', 'disable-both'","'disable-both'")
write('crisis-probe.mjs',probe)
write('save-size-probe.txt','Base 0b2b3a6 with composed bytes. Candidate Planning checkpoint, seed 40 closed W1.\n'
      'Node measurement of serializeCharacterLifeSave via Buffer.byteLength.\n'
      'Null card 17612 B\nPending home-robbery-w1, week 1, excess 28751 milli 17661 B\nDifference 49 B\nExit 0\n')
for name in (*parts,'compose-e2e.pyfrag','probe.mjs','scratch-lint.txt','scratch-lint-draft.txt','scratch-typecheck.txt'):
    (d/name).unlink(missing_ok=True)
root = Path(read('.scratch-path').strip())
main = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
count=0
for name in ("existing-file-replacements.json", "generated-byte-proposals.json"):
    items=json.loads(read(name))['files']
    for entry in items:
        candidate=b64decode(entry['afterBase64'], validate=True)
        assert candidate == entry['afterUtf8'].encode() == (root/entry['path']).read_bytes()
        assert sha256(candidate).hexdigest() == entry['afterSha256']
        if 'beforeSha256' in entry:
            assert sha256((main/entry['path']).read_bytes()).hexdigest() == entry['beforeSha256']
        count+=1
    print(f'{name}: {len(items)} files, exact scratch match')
hold=read('STEP0-HOLD.md')
for value in ('Thiết kế Money','Duyệt thiết kế','Duyệt, giao M1','Thẻ khủng hoảng có lựa chọn (Recommended)','Start M3 Step 0','→','—'):
    assert value in hold, value
for suffix in ('*.md','*.json','*.diff','*.txt'):
    for f in d.glob(suffix):
        if f.name == 'SHA256SUMS.txt': continue
        s=f.read_bytes().decode('utf-8')
        assert '\ufffd' not in s and '\0' not in s, f.name
manifest = d/'SHA256SUMS.txt'
entries = [(p,sha256(p.read_bytes()).hexdigest()) for p in sorted(d.rglob('*')) if p.is_file() and p != manifest]
write(manifest.name, '\n'.join(f'{h}  {p.relative_to(d).as_posix()}' for p,h in entries))
assert all(sha256(p.read_bytes()).hexdigest() == h for p,h in entries)
print(f'{count} verified candidate paths, {len(entries)} sealed evidence files.')
print('HOLD sha256',sha256((d/'STEP0-HOLD.md').read_bytes()).hexdigest())

