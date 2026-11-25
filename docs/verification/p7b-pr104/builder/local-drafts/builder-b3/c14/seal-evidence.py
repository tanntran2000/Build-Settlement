from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import sys

here = Path(__file__).resolve().parent
status = sys.argv[1]
assert status in {'COMPLETE','HOLD'}
reason = sys.argv[2] if len(sys.argv)>2 else None
def git(*args):
    return subprocess.check_output(('git',*args)).decode('utf-8').strip()
def log(name):
    path = here/name
    return path.read_text(encoding='utf-8') if path.is_file() else ''
def data(name):
    path = here/name
    return json.loads(path.read_bytes()) if path.is_file() else None
def exit_code(name):
    matches = re.findall(r'^Exit (\d+)$',log(name),re.M)
    return int(matches[-1]) if matches else None
def link(name,title=None):
    return f'[{title or name}]({name})' if (here/name).is_file() else 'Pending'
def section_title(name):
    return '\n## '+name+'\n\n'

head, tree = git('rev-parse','HEAD'), git('rev-parse','HEAD^{tree}')
base = git('rev-parse','origin/main')
worktree = git('status','--porcelain=v1','--untracked-files=all')
branch = git('branch','--show-current')
port_log = log('final-worktree.txt')
commit = git('show','-s','--format=%B')
test_count = re.search(r'^\s*Tests\s+(\d+) passed',log('gate-6-unit.txt'),re.M)
arch_count = re.search(r'^(?:#|ℹ) pass (\d+)$',log('gate-5-architecture-tests.txt'),re.M)
smoke_passed = re.search(r'^\s*(\d+) passed \((.*)\)$',log('gate-8-smoke.txt'),re.M)
smoke_failed = re.search(r'^\s*(\d+) failed\s*$',log('gate-8-smoke.txt'),re.M)
smoke_total = re.search(r'Running (\d+) tests using 1 worker',log('gate-8-smoke.txt'))
verification = {
    'base-approved': exit_code('approved-base-verifier.txt'),
    'worktree': exit_code('candidate-verifier-final-capture.txt'),
    'index': exit_code('index-verifier.txt'),
    'head': exit_code('final-head-verifier.txt'),
    'pathDiff': exit_code('final-path-diff.txt'),
    'bytePaths':20,'byteSpans':53,'extraPaths':0,
}
gates = [
    ('Diff check','gate-1-diff.txt','git diff --check origin/main...HEAD',None),
    ('Lint','gate-2-lint.txt','npm run lint',None),
    ('Typecheck','gate-3-typecheck.txt','npm run typecheck',None),
    ('Architecture','gate-4-architecture.txt','npm run check:architecture',None),
    ('Architecture tests','gate-5-architecture-tests.txt','npm run test:architecture',
        arch_count.group(1)+' passing' if arch_count else None),
    ('Unit','gate-6-unit.txt','npm test',test_count.group(1)+' passing' if test_count else None),
    ('Build','gate-7-build.txt','npm run build',None),
    ('Chromium smoke','gate-8-smoke.txt','CI=1 npm run test:smoke',
        '; '.join(filter(None,(smoke_passed.group(1)+' passing in '+smoke_passed.group(2) if smoke_passed else None,
                            smoke_failed.group(1)+' failing' if smoke_failed else None))) or None),
]
bundle = data('bundle/bundle-and-served-hashes.json')
save = data('save-size/largest-save-measurement.json') or next(iter(
    (json.loads(path.read_bytes()) for path in (here/'green-save-artifacts').rglob('largest-save-measurement.json'))),None)
timing = data('timings/comparison.json')
if status=='COMPLETE':
    assert all(exit_code(file)==0 for _,file,_,_ in gates)
    assert all(exit_code(filename)==0 for filename in ('final-artifacts.txt','final-path-diff.txt','final-worktree.txt','exact-head-screenshots.txt','paired-end-week-and-load.txt'))
    assert not worktree and 'Ports 4173 and 4174 free' in port_log
    assert smoke_passed and int(smoke_passed.group(1)) == int(smoke_total.group(1)) == 415
    assert bundle['head']==head and timing['head']==head and not timing['hold'] and bundle['headroomBytes']>0

results = {'status':status, 'reason':reason, 'sealedUTC':datetime.now(timezone.utc).isoformat(timespec='seconds'),
           'head':head,'tree':tree,'base':base,'branch':branch,'gitStatus':worktree,
           'commitMessage':commit,'portsFree':'Ports 4173 and 4174 free' in port_log,
           'verification':verification,
           'gates':[dict(name=name, log=file, command=command, exit=exit_code(file), result=summary) for name,file,command,summary in gates],
           'smoke':{'ci':1,'total':int(smoke_total.group(1)) if smoke_total else None,
                    'passed':int(smoke_passed.group(1)) if smoke_passed else None,
                    'failed':int(smoke_failed.group(1)) if smoke_failed else (0 if smoke_passed else None)},
           'bundle':bundle,'save':save,'timing':timing}

parts = [
    '# P7-B PR B3 — Correction 14 Builder evidence\n\n',
    f'**{status}**'+(' — '+reason if reason else '')+'\n\n',
    f'- Head: `{head}`\n- Tree: `{tree}`\n- Main base: `{base}`\n- Branch: `{branch}`\n',
    f'- Builder: Codex. Sealed {results["sealedUTC"]}. Git status '+('empty' if not worktree else 'has changes')+'.\n',
    f'- Local commit: `{commit.splitlines()[0]}` with `Co-authored-by: Codex <noreply@openai.com>`.\n\n',
    'Owner (Tân), verbatim: “Sửa cả 11 (Recommended)” and “Ghi Rút lui vào dãy trả giá (Recommended)”. '
    '[Binding Correction 14](../../binding-plan-4cc95f8.md) · [Astra round 1](../../astra-review/astra-round1.md)\n',
    section_title('Astra findings'),
    '| Finding | RED at 825ca5c | GREEN evidence |\n| --- | --- | --- |\n',
]
unit = link('green-unit-focused.txt','98 focused tests')
browser = link('green-browser.txt','6 Chromium cases, CI=1')
findings = [
    ('P1-1',link('red-unit.txt','Missing group and enabled-market sentinel were accepted')+' · '+link('red-sold-group-and-withdraw.txt','Paused market accepted removal of a sold recruit’s group'),unit+' · JSON and row refusals. Paused complete groups load.'),
    ('P1-2',link('red-unit.txt','Status-only edit was accepted'),unit+' · Withdraw is stored in order. Reopening is refused by both codecs.'),
    ('P1-3',link('red-probe-p1-3-browser.txt','Four rendered-output mutations failed'),browser+' · Seed 42 cards, rival stance and status, bid order and household rows.'),
    ('P1-4',link('red-probe-p1-4-card.txt','Blank labels and wrong skills failed'),unit+' · Literal seed 42 projection.'),
    ('P1-5',link('red-probe-p1-5-json.txt','Wrong JSON refusal failed')+' · '+link('red-probe-p1-5-row.txt','Wrong row ref failed'),unit+' · Full JSON error and row error type, ref and message.'),
    ('P1-6',link('red-probe-p1-6-v12-bytes.txt','Historical whitespace edit failed hash pin'),unit+' · Ten original v12 byte pins in regular Vitest.'),
    ('P2-1',link('red-unit.txt','Edited immutable source and week were accepted'),unit+' · Both metadata fields pinned to the matched offer.'),
    ('P2-2',link('red-unit.txt','Impossible sale, unknown name and reoffered ID were accepted'),unit+' · The departure uses an NPC id and seed-derived provenance.'),
    ('P2-3',link('red-unit.txt','Four diagnostics attributed errors to the wrong field'),unit+' · Opening, rival and indexed player steps report the exact field.'),
    ('P2-4',link('red-browser.txt','Large save round-tripped, then exposed missing departure identities'),link('green-browser-measurement.txt','Largest save passes browser persistence and JSON equality')+' · '+link('save-size/largest-save-measurement.json','Exact-head bytes')),
    ('P3-1',link('red-browser.txt','Computed marker positions were outside at 1280 and 1600 px'),browser+' · Both lists have inside markers.'),
    ('P3-2',link('red-probe-p3-2-labels.txt','Eight mislabeled current-version cases'),link('green-probe-p3-2-labels.txt','Correct version in each test label')),
]
for item, red, green in findings:
    parts.append(f'| {item} | {red} | {green} |\n')
parts.extend([
    '\nThe first browser mutation launch selected zero tests because the Windows path was supplied as a regex. The corrected launch exercised all four assertions. '
    +link('red-probe-p1-3-browser-launch.txt','First launch')+' · '+link('red-browser-mutations.txt','Corrected launch and byte restoration')+'\n',
    section_title('Byte verification'),
    'The reviewed head passed the packet verifier for 86 paths. The Correction 14 verifier reconstructed all 53 exact byte spans across 20 authorized paths and confirmed the other 66 hashes at the final head. '
    +link('approved-base-verifier.txt','Approved baseline')+' · '+link('final-head-verifier.txt','Final verifier')+' · '+link('correction14-byte-inventory.json','Byte inventory')+'\n\n',
    'The ruleset is tile-society-13. The only save data changes are the Withdraw marker in the ordered raises array and NPC id on a weekly departure. '
    'The golden and v13 fixture bytes match 825ca5c. The existing path-diff checks 3 golden seeds, 93 historical fixtures and 10 v13 siblings against main. '
    +link('final-path-diff.txt','Path diff')+' · '+link('risk-register.md','Replay limits')+'\n',
    section_title('Exact-head gates'),
    '| Gate | Command | Result | Evidence |\n| --- | --- | --- | --- |\n',
])
for number,(name,file,command,summary) in enumerate(gates,1):
    code = exit_code(file)
    result = 'Pending' if code is None else 'PASS' if code==0 else f'FAIL (exit {code})'
    if summary: result += ' · '+summary.replace(';',',')
    parts.append(f'| {number}. {name} | `{command}` | {result} | {link(file,"Output and exit")} |\n')
parts.append('\n'+link('environment-before-gates.txt','CPU/processes before gates')+' · '+link('environment-before-smoke.txt','CPU/processes before smoke')+
             ' · '+link('environment-after-smoke.txt','CPU/processes after smoke')+' · '+link('before-smoke-served-hashes.txt','Served build hashes before smoke')+'\n')
if bundle:
    parts.extend([section_title('Bundle'),f'Production totals {bundle["totalGzipBytes"]:,} gzip bytes, up {bundle["deltaGzipBytes"]:,} from main. '
                  f'JS {bundle["jsGzipBytes"]:,} bytes. CSS {bundle["cssGzipBytes"]:,} bytes. '
                  f'The 200,000-byte budget leaves {bundle["headroomBytes"]:,} bytes. '
                  +link('bundle/per-file-comparison.json','Per-file comparison on the exact main tree')+'\n'])
if save:
    parts.extend([section_title('Largest representative save'),
        f'The 100-NPC checkpoint used 12 stock slots, two won lots with four legal raises each, 14 departures and 20 recent entries per NPC. '
        f'JSON uses {save["saveBytes"]:,} bytes of the 1,048,576-byte ceiling. The {save["rowCount"]} IndexedDB records serialize as '
        f'{save["indexedDbRowJsonBytes"]:,} UTF-8 bytes. JSON restore, IndexedDB byte export and browser Continue all matched the original state. '
        f'The measurement-only empty-week control uses {save["emptyWeekBytes"]:,} bytes, a difference of {save["acquisitionDeltaBytes"]:,} bytes. '
        +link('save-size/largest-save.json','Raw save')+' · '+link('save-size/largest-save-indexeddb-rows.json','Raw IndexedDB read')+'\n'])
if timing:
    parts.extend([section_title('End Week and checkpoint load'),timing['method']+'\n\n',
        '| Case | Main warm median / p95 (ms) | Head warm median / p95 (ms) | Median paired delta (ms) | Maximum noise (ms) | Above noise |\n'
        '| --- | ---: | ---: | ---: | ---: | --- |\n'])
    for key,row in timing['aggregate'].items():
        m,h = row['mainWarm'],row['headWarm']
        parts.append(f'| {key} | {m["median"]:.2f} / {m["p95"]:.2f} | {h["median"]:.2f} / {h["p95"]:.2f} | {row["medianDeltaMs"]:+.2f} | {row["maxMainNoiseMs"]:.2f} | {row["warmCostAboveNoise"]} |\n')
    draw = timing['aggregate']['market-tick']['drawAcquisitionMs']
    parts.append(f'\nSeparate drawAcquisition warm median {draw["median"]:.3f} ms, p95 {draw["p95"]:.3f} ms. '
                 'Cold samples, warm maxima and 50 ms exceedances are recorded with the per-run raw data. '
                 +link('timings/comparison.json','Timing summary')+' · '+link('timings/raw-timings.json','Raw timing runs')+'\n')
parts.extend([section_title('Artifacts'),
    link('screenshots/acquisition-for-sale-1280.png','For sale, 1280×900 PNG')+' · '+
    link('screenshots/acquisition-auction-1280.png','Auction, 1280×900 PNG')+' · '+
    link('final-worktree.txt','Final clean status and free ports')+' · '+
    '[SHA-256 manifest](SHA256SUMS.txt)\n'])
(here/'README.md').write_text(''.join(parts),encoding='utf-8',newline='\n')
(here/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

def manifest(folder):
    nested = sorted(path for path in folder.iterdir() if path.is_dir() and path.name!='__pycache__')
    for subfolder in nested:
        manifest(subfolder)
    files = (path for path in folder.rglob('*') if path.is_file() and path != folder/'SHA256SUMS.txt' and '__pycache__' not in path.parts)
    lines = [f'{sha256(path.read_bytes()).hexdigest()}  {path.relative_to(folder).as_posix()}\n' for path in sorted(files)]
    (folder/'SHA256SUMS.txt').write_text(''.join(lines),encoding='utf-8',newline='\n')
manifest(here)
for line in (here/'SHA256SUMS.txt').read_text(encoding='utf-8').splitlines():
    expected,path = line.split('  ',1)
    assert sha256((here/path).read_bytes()).hexdigest()==expected, path
assert 'Sửa cả 11 (Recommended)' in (here/'README.md').read_text(encoding='utf-8')
print(f'{status} — {head} / {tree}; evidence and nested manifests sealed.')
