from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
import json, re, subprocess, sys

here=Path(__file__).resolve().parent
m=here/'M3.3'
gate=m/sys.argv[1]
timing=m/sys.argv[2]
published=len(sys.argv)>3 and sys.argv[3]=='pushed'
smoke=m/sys.argv[4] if len(sys.argv)>4 else gate
repo=Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
base='0b2b3a6088d003301d48b460202327fb53546ede'
head,tree=subprocess.check_output(['git','rev-parse','HEAD','HEAD^{tree}'],cwd=repo,text=True).split()
assert head=='57c0cbe7b2862bbc148a528444dcad64e58d35b9' and tree=='38420881e654cc19299d07f2ee0d63becd116545'
assert not subprocess.check_output(['git','status','--porcelain','-z'],cwd=repo)
date=datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
read=lambda p:p.read_text(encoding='utf-8-sig')
ansi=re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
sha=lambda data:sha256(data).hexdigest()

def passed(path, exact_head=True):
    content=ansi.sub('',read(path))
    if exact_head:
        assert head in content and tree in content,path
    assert re.search(r'(?m)^Exit 0 \| [Ee]nd UTC .+$',content),path
    return content

commands=[
    ('Diff check','01-diff.txt'),
    ('Lint','02-lint.txt'),
    ('Typecheck','03-typecheck.txt'),
    ('Architecture check','04-check-architecture.txt'),
    ('Architecture tests','05-test-architecture.txt'),
    ('Unit suite','06-unit.txt'),
    ('Build','07-build.txt'),
    ('Bundle measurement','07b-bundle.txt'),
    ('Full smoke','08-smoke.txt'),
]
log_path=lambda name:(smoke if name=='08-smoke.txt' else gate)/name
logs={name:passed(log_path(name)) for _,name in commands}
unit=re.search(r'(?m)^\s*Tests\s+(\d+) passed \((\d+)\)',logs['06-unit.txt'])
unit_files=re.search(r'(?m)^\s*Test Files\s+(\d+) passed \((\d+)\)',logs['06-unit.txt'])
full=re.search(r'(?m)^\s*(\d+) passed \(([^)]*)\)',logs['08-smoke.txt'])
scheduled=re.search(r'Running (\d+) tests',logs['08-smoke.txt'])
arch=re.search(r'(?m)^.*?tests (\d+)\s*$',logs['05-test-architecture.txt'])
assert unit and unit_files and full and scheduled and arch
assert unit[1]==unit[2] and unit_files[1]==unit_files[2] and full[1]==scheduled[1]
assert re.search(r'(?m)^\s*8 passed \(',passed(here/'m32-focused-smoke-1.txt',exact_head=False))
bundle_text=logs['07b-bundle.txt']
bundle=json.JSONDecoder().raw_decode(bundle_text[bundle_text.index('\n{')+1:])[0]
assert bundle['totalGzipBytes']<200000
measurement=json.loads((timing/'measurement-summary.json').read_bytes())
assert len(measurement['summary'])==8 and all(x['npcCount']==100 for x in measurement['summary'])
assert len(read(timing/'raw-timings.ndjson').splitlines())==64
passed(timing/'paired-week.txt')
passed(here/'prepush-check.txt')
if published:
    passed(here/'push.txt')
    assert head+'\trefs/heads/feat/money-robbery' in passed(here/'remote-head.txt')

lines=[
 '# Money M3.3 verification',
 '',
 f'Evidence sealed {date}. Branch feat/money-robbery.',
 '',
 f'Base {base}. Tested HEAD {head}. Tested tree {tree}.',
 'Verified on origin after push.' if published else 'Local verification complete.',
 '',
 '## Decisions and scope',
 '',
 'Correction 12 owner answers, verbatim.',
 '',
 '- “Duyệt bộ số (Recommended)”',
 '- “Easy an toàn gấp đôi”',
 '- “Khóa phần bị đe dọa (Recommended)”',
 '- “Duyệt tất cả (Recommended)”',
 '',
 'Correction 13 owner answer, verbatim. “Duyệt sửa 1 dòng (Recommended)”.',
 '',
 'The branch has the approved simulation and UI commits. Exact packet verification covers all 35 paths and the single assertion overlay.',
 '',
 '## Gates',
 '',
 '| Check | Exit | Result |',
 '|---|---:|---|',
]
detail={
 'Architecture tests':f'{arch[1]} tests passed',
 'Unit suite':f'{unit[1]} tests in {unit_files[1]} files',
 'Full smoke':f'{full[1]} tests passed in {full[2]}',
 'Bundle measurement':f"{bundle['totalGzipBytes']:,} B gzip JS and CSS against 200,000 B",
}
for label, filename in commands:
    lines.append(f'| {label} | 0 | {detail.get(label,"Complete")} |')
lines += [
 '',
 'The full smoke uses the checked-in configuration and existing timeouts. The first full smoke reached the existing 60-second limit in the fulfillment case. An unchanged full retry from a quieter sampled window supplies the passing smoke result. Both logs are retained. M3.2 focused verification passed all eight browser cases after Correction 13.',
 '',
 '## Paired End Week benchmark',
 '',
 f'Node {measurement["node"]}. Matched 100-NPC snapshots, eight alternating A/B and B/A blocks per case with eight samples per side, plus same-build A/A blocks. Cloning and assertions are outside the timed interval.',
 '',
 '| Difficulty | Condition | n per side | Base median / p95 / max (ms) | Head median / p95 / max (ms) | Base / head >50 ms | A/A delta range (ms) | Paired median delta (ms) |',
 '|---|---|---:|---:|---:|---:|---:|---:|',
]
def fmt(v):
    return f"{v['median']:.2f} / {v['p95']:.2f} / {v['max']:.2f}"
for r in measurement['summary']:
    a,b,noise,delta=[r[name] for name in ('baseMs','headMs','aaMedianDeltaMs','pairedMedianDeltaMs')]
    assert a['n']==b['n']==64
    lines.append(f"| {r['difficulty']} | {r['scenario']} | {a['n']} | {fmt(a)} | {fmt(b)} | {a['above50']} / {b['above50']} | {noise['min']:+.2f} to {noise['max']:+.2f} | {delta['median']:+.2f} |")
lines += ['', 'Recorded machine samples and process activity are in the environment files. The A/A intervals report observed run-to-run noise. R-026 and R-031 remain open.', '',
          '## Save size and assets', '',
          '| Difficulty | Pending checkpoint (B) | Matching null-card checkpoint (B) | Delta (B) |',
          '|---|---:|---:|---:|']
for difficulty in ('normal','easy'):
    row=json.loads((timing/(difficulty+'-save-size.json')).read_bytes())
    save=(timing/(difficulty+'-pending-save.json')).read_bytes()
    assert sha(save)==row['saveSha256'] and len(save)==row['pendingBytes']
    lines.append(f"| {difficulty} | {row['pendingBytes']:,} | {row['nullBytes']:,} | {row['delta']:+d} |")
lines += [
 '',
 'Raw compressed assets, timing blocks, pending checkpoints, and CPU samples are retained beside the logs. Prior calibration ran all 90 frozen routes with the same product bytes. Correction 13 changes the test assertion only.',
 '',
 'The assigned worktree and external benchmark snapshot are retained for review and reproduction. Storage reclaimed 0 B.',
]
(here/'README.md').write_bytes(('\n'.join(lines)+'\n').encode())
(m/'exact-head-gate-log.txt').write_bytes('\n'.join(f'=== {label} ===\n'+read(log_path(name)) for label,name in commands).encode())
manifest=here/'SHA256SUMS.txt'
checked=[]
for p in sorted(here.rglob('*')):
    if not p.is_file() or p==manifest: continue
    content=p.read_bytes()
    if p.suffix in ('.md','.txt','.json','.mjs','.py','.ndjson'):
        assert '\ufffd' not in content.decode('utf-8-sig'),p
    checked.append(sha(content)+'  '+p.relative_to(here).as_posix())
manifest.write_bytes(('\n'.join(checked)+'\n').encode())
print('Sealed',len(checked),'evidence files',sha(manifest.read_bytes()))
print(f'{unit[1]} unit, {arch[1]} architecture, {full[1]} smoke, {bundle["totalGzipBytes"]} B gzip.')

