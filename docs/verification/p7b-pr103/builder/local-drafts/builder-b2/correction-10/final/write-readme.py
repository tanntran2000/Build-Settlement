from pathlib import Path
import hashlib
import json
import re
import subprocess

folder=Path(__file__).resolve().parent
c10=folder.parent
base=c10.parent

def jsonload(where):
    return json.loads(where.read_bytes())

def read(name):
    return (folder/name).read_text(encoding='utf-8-sig')

def git(*args):
    return subprocess.check_output(['git',*args],text=True).strip()

head=git('rev-parse','HEAD')
tree=git('rev-parse','HEAD^{tree}')
main=git('rev-parse','origin/main')
assert head=='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
assert tree=='312797f184f6414064e5ecf81eb1fba7a7bc55d0'
assert not git('status','--porcelain=v1','--untracked-files=all')
assert 'Ports 4173 and 4174 free' in read('b2-3-environment-after.txt')
assert '$' not in head
pins={base/'B2-3-HOLD.md':'9b72a274a3af7d60d7129af4c8e79969c9a6e4a0b35a03588bf1efe923fb460c',
      c10/'R-026-addendum.md':'070388e1be8429eb812483d35ed9ca6e5566392d15d1d530240e578d9b0fd382'}
for path,digest in pins.items():
    assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,path
verify=jsonload(c10/'verifier-final.json')
assert verify['head']==head and verify['verifiedTree']==tree and verify['correction10']['assertionsByteIdentical']
assert 'Total: 1 test in 1 file' in (c10/'storage-authorized-list.txt').read_text(encoding='utf-8-sig',errors='replace') or 'Total: 1 test in 1 file' in (c10/'storage-authorized-list.txt').read_text(encoding='utf-16',errors='replace')
isolated=jsonload(c10/'storage-green-verified.json')['stats']
assert [isolated[k] for k in ('expected','unexpected','flaky','skipped')]==[1,0,0,0]
smoke=jsonload(folder/'b2-3-smoke.json')['stats']
smoke_exit=int(re.findall(r'^Exit (\d+)\s*$',read('b2-3-smoke.txt'),re.M)[-1])
total=sum(smoke[k] for k in ('expected','unexpected','flaky','skipped'))
assert '\nCI=1\n' in read('b2-3-smoke.txt')
gates=jsonload(folder/'b2-3-gates.json')
assert gates['head']==head and gates['tree']==tree and len(gates['exits'])==7
bundle=jsonload(folder/'b2-3-measurements.json')
assert bundle['head']==head and bundle['tree']==tree
assert all(a['servedIdentical'] for prod in bundle['servedBuilds'] for a in prod['assets'])
assert bundle['sourceDiffFromPrevious']==['tests/e2e/storage.spec.ts']
js,css=(next(a for a in bundle['bundle']['assets'] if a['file'].endswith(ext)) for ext in ('.js','.css'))
save=jsonload(c10/'benchmark-probes.json')['b2']['save']
assert save['byteIdentical'] and save['bytes']<=1048576
assert 'Co-authored-by: Codex <noreply@openai.com>' in git('log','-3','--format=%b')
result='PASS' if not any(gates['exits']) and smoke_exit==0 and smoke['expected']==409 and smoke['unexpected']==smoke['flaky']==smoke['skipped']==0 else 'HOLD'
if 'No matching events' not in read('b2-3-environment-after.txt'):
    result='HOLD'
report=f'''# P7-B B2 Builder final evidence

**{result}** at `{head}`, tree `{tree}`, on `feat/p7b-npc-generator`. Base `origin/main` `{main}`. Git porcelain is empty, ports 4173 and 4174 are free, and the detached comparison checkout was removed. [Final environment and commits](b2-3-environment-after.txt)

Owner Correction 10 decision, verbatim: “Sửa test + đo so sánh (Recommended)”. The Orchestrator authorized direct Playwright launch recovery under the existing Correction 10. The exact approved patch produced the final tree. [Correction 10 verifier](../verifier-final.json) · [Patch](../storage-fixture.patch)

## Storage RED and GREEN

- RED at `f31310c` hit the seven-versus-four assertion in the full suite and once in isolation. [Full RED](../../b2-3-smoke.txt) · [Isolated RED](../../b2-3-isolated/001.txt)
- GREEN was collected as exactly one test before execution. The direct runner recorded `CI=1` and passed the case without changing its seven-row, migration or save-parity assertions. [Collection](../storage-authorized-list.txt) · [Run log](../storage-green-verified.txt) · [Result JSON](../storage-green-verified.json)
- Both implementation commits and the fixture commit carry the Codex co-author trailer. The verifier covers 112 paths. The third commit changes only the test fixture call and its helper import. The prior golden path audit covered three seeds, 83 byte-identical historical fixtures and ten v12 fixtures. [Golden audit](../../b2-3-path-diff-final.txt)

## Exact-head gates

| Gate | Command | Exit |
| --- | --- | --- |
'''
for i,(command,code) in enumerate(zip(gates['commands'],gates['exits']),1):
    report+=f'| {i} | `{command}` | [{code}](b2-3-gate-{i}.txt) |\n'
report+=f'''| Smoke | `CI=1 npm run test:smoke` | [{smoke_exit}](b2-3-smoke.txt) |

The full smoke ran {total} cases in {smoke['duration']/60000:.1f} minutes with one Chromium worker. {smoke['expected']} passed, {smoke['unexpected']} failed, {smoke['skipped']} skipped and {smoke['flaky']} flaky. Git Bash printed `CI=1` immediately before launching npm in the same shell. [JSON results](b2-3-smoke.json) · [Launcher](run-final-smoke.sh)

[Quiet-machine record before gates](b2-3-environment-before.txt) · [Before smoke](b2-3-environment-before-smoke.txt) · [After testing](b2-3-environment-after.txt)
'''
if smoke_exit and smoke['unexpected']:
    reruns=jsonload(folder/'b2-3-isolated'/'results.json')['cases']
    assert len(reruns)==smoke['unexpected']
    report+='\n| Failed smoke case | Full result | Isolated rerun |\n| --- | --- | --- |\n'
    for case in reruns:
        log=case['rerun']['log']; row=' / '.join(case['fullRunStatuses'])
        report+=f"| {case['title'].replace('|',' / ')} | {row} | [Exit {case['rerun']['exit']}](b2-3-isolated/{log}) |\n"

report+=f'''
## Served build and artifacts

Production and regression HTML matched their corresponding disk bytes. Both served builds agreed on JS and CSS SHA-256 hashes. [Served-build check](b2-3-served-check-and-bundle.txt) · [Raw measurements](b2-3-measurements.json) · [Script](measure-bundle.mjs)

| Metric | Result |
| --- | --- |
| JS gzip | {js['gzipBytes']/1000:.3f} kB vs 145.737 kB on main. [Raw gzip](b2-3-{js['file']}.gz) |
| CSS gzip | {css['gzipBytes']/1000:.3f} kB vs 7.528 kB on main. [Raw gzip](b2-3-{css['file']}.gz) |
| Combined gzip | {bundle['bundle']['totalGzipBytes']/1000:.3f} kB vs 153.265 kB on main. {(200000-bundle['bundle']['totalGzipBytes'])/1000:.3f} kB of budget headroom. |
| 100-NPC save | {save['bytes']:,} bytes, byte-identical across the comparison probe round trip. No serialization source or fixture save bytes changed in the test-only commit. [Prior save probe](../benchmark-probes.json) |
| 100-NPC End Week | Paired warm median difference +1.21 ms against 4.68 ms of observed same-revision variation. The accepted R-026 addendum covers both revisions' budget misses. [R-026 addendum](../R-026-addendum.md) |
'''
if bundle['screenshotAssetBytesChanged']:
    stamp=bundle['buildStamp']
    assert all((folder/filename).is_file() for filename in ('b2-3-characters-empty-1280x900.png','b2-3-hall-move-1280x900.png'))
    report+=f"\nThe compiled JS build stamp changed from `{stamp['previous']}` to `{stamp['current']}`. The remaining JS and CSS bytes matched. Both screenshots were retaken at 1280×900. [Characters](b2-3-characters-empty-1280x900.png) · [Hall Move](b2-3-hall-move-1280x900.png) · [Capture log](b2-3-screenshots.txt)\n"
else:
    report+='\nThe UI assets were byte-identical. [Characters](../../b2-3-characters-empty-1280x900.png) · [Hall Move](../../b2-3-hall-move-1280x900.png)\n'
report+='\n[Final evidence manifest](SHA256SUMS.txt) · [Builder manifest](../../SHA256SUMS.txt)\n'
(folder/'README.md').write_text(report,encoding='utf-8',newline='\n')
print(f'{result} at {head}, {smoke["expected"]}/{total} smoke cases passed.')
