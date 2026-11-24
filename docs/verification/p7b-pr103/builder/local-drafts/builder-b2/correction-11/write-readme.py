from pathlib import Path
import hashlib
import json
import re
import subprocess

c=Path(__file__).resolve().parent
f=c/'final'
base=c.parent
load=lambda path:json.loads(path.read_bytes())
read=lambda path:path.read_text(encoding='utf-8-sig')
git=lambda *args:subprocess.check_output(['git',*args],text=True).strip()
head=git('rev-parse','HEAD'); tree=git('rev-parse','HEAD^{tree}')
assert not git('status','--porcelain=v1','--untracked-files=all')
v=load(c/'verifier-final.json')
g=load(f/'b2-3-gates.json')
m=load(f/'b2-3-measurements.json')
pre=load(c/'precommit-gates.json')
red=load(c/'targeted-red-summary.json'); green=load(c/'targeted-green-summary.json')
mutants=load(c/'mutation-summary.json')
assert v['verifiedHead']==g['head']==m['head']==head
assert v['verifiedTree']==g['tree']==m['tree']==pre['tree']==tree
assert v['otherTreeEntriesByteIdentical'] and v['samplePinsByteIdentical']
assert len(v['changedFiles'])==8 and len(mutants)==7
assert pre['exits']==[0,0,0] and '3204 passed (3204)' in read(c/'precommit-unit.txt')
assert len(red['failures'])==16 and green['total']==123 and not green['failures']
assert 'Ports 4173 and 4174 free' in read(f/'b2-3-environment-after.txt')
assert all(x['servedIdentical'] for b in m['servedBuilds'] for x in b['assets'])
log=read(f/'b2-3-smoke.txt'); assert '\nCI=1\n' in log
smoke=load(f/'b2-3-smoke.json')['stats']
exitcode=int(re.findall(r'^Exit (\d+)\s*$',log,re.M)[-1])
expected,unexpected,skipped,flaky=(smoke[k] for k in ('expected','unexpected','skipped','flaky'))
total=expected+unexpected+skipped+flaky
state='PASS' if g['exits']==[0]*7 and exitcode==0 and expected==409 and not any((unexpected,skipped,flaky)) else 'HOLD'
if 'No matching events' not in read(f/'b2-3-environment-after.txt'):
    state='HOLD'
assert hashlib.sha256((base/'correction-10'/'R-026-addendum.md').read_bytes()).hexdigest()=='070388e1be8429eb812483d35ed9ca6e5566392d15d1d530240e578d9b0fd382'
gate_rows=''.join(f'| {i} | `{cmd}` | [{code}](final/b2-3-gate-{i}.txt) |\n' for i,(cmd,code) in enumerate(zip(g['commands'],g['exits']),1))
js,css=(next(row for row in m['bundle']['assets'] if row['file'].endswith(ext)) for ext in ('.js','.css'))
report=f'''# Correction 11 · Astra round 1 fixes

**{state}** at `{head}`, tree `{tree}`. Branch `feat/p7b-npc-generator`, base `{v['originMain']}`. Git porcelain is empty; ports 4173 and 4174 are free. [Final environment and four commits](final/b2-3-environment-after.txt)

Owner Tân, verbatim: “Sửa cả 9 (Recommended)”. The verified plan and review hashes are recorded in the [Correction 11 verifier](verifier-final.json). The pinned local review supplied all acceptance conditions. The thread lookup was unavailable.

## RED, mutation probes and GREEN

| Finding | RED evidence at `63cbdca` | GREEN and resulting behavior |
| --- | --- | --- |
| P1-1 | Wrong old-version response survived the original assertion and failed the tightened one | Malformed JSON matches the complete `INVALID_SAVE` result and exact message |
| P1-2 | Added text to catalog, malformed-key and salt-exhaustion errors in three isolated mutants. All 19 selections passed originally and failed when tightened | Exact messages and `CatalogError`/`RangeError` type checks |
| P1-3 | Separate given-name and epithet mutants each survived the original sweep and failed the tightened sweep | Both name components checked against each NPC's culture over 200 seeds |
| P1-4 | Removing the generated NPC's trait phrase survived the original integration case and failed the pin | Complete `describeShort` string pinned for `npc_w1_guild_0`, seed 3 |
| P2-1 | Fractional-affection v12 checkpoint loaded | Checkpoint refused and both planning and live state guards reject fractional NPC affection |
| P2-2 | Catalog accepted `[5, 5]` with four traits | `[4, 4]` accepted, `[5, 5]` refused against actual pool size |
| P2-3 | Nine invalid whole rows returned empty fields | Full `CatalogError` strings name each parent field |
| P3-1 | Probe recorded two base-key streams, one with five discarded draws | One base-key stream, same retained draw count and byte-identical sample pins |
| P3-2 | Five invalid seeds silently generated | Five invalid seeds refused; both unsigned endpoints generate deterministically |

[RED summary](targeted-red-summary.json) · [Raw RED](targeted-red-raw.json) · [Seven mutation probes](mutation-summary.json) · [GREEN summary](targeted-green-summary.json) · [Raw GREEN](targeted-green-raw.json) · [RNG before](P3-1-rng-before.txt) · [RNG after](P3-1-rng-after.txt)

The targeted run passed 123/123 after the fixes. The applied inventory has 25 exact replacements in eight files. The verifier reconstructs each resulting blob and compares all {v['baseTrackedBlobs']} entries against `63cbdca`. The other {v['baseTrackedBlobs']-8} entries and the exact sample pin block match byte for byte. [Test edits](test-edits.json) · [Product edits](product-edits.json)

## Precommit and exact-head gates

The verified staged tree passed all-workspace [typecheck](precommit-typecheck.txt), [lint](precommit-lint.txt) and the [full 3,204-case unit run](precommit-unit.txt) before commit.

| Gate | Command | Exit |
| --- | --- | --- |
{gate_rows}| Smoke | `CI=1 npm run test:smoke` | [{exitcode}](final/b2-3-smoke.txt) |

Smoke ran {total} cases in {smoke['duration']/60000:.1f} minutes. {expected} passed, {unexpected} failed, {skipped} skipped and {flaky} flaky. The Git Bash launch shell printed `CI=1` before starting npm. [Smoke JSON](final/b2-3-smoke.json) · [Pre-gates environment](final/b2-3-environment-before.txt) · [Pre-smoke environment](final/b2-3-environment-before-smoke.txt)
'''
if exitcode and unexpected:
    cases=load(f/'b2-3-isolated'/'results.json')['cases']
    assert len(cases)==unexpected
    report+='\n| Failed smoke case | Full | Isolated rerun |\n| --- | --- | --- |\n'
    for case in cases:
        result=case['rerun']; statuses=' / '.join(case['fullRunStatuses'])
        report+=f"| {case['title'].replace('|',' / ')} | {statuses} | [Exit {result['exit']}](final/b2-3-isolated/{result['log']}) |\n"
report+=f'''
## Measurements and artifacts

Production and regression served HTML matched their respective disk files. Both served builds matched the JS and CSS hashes. [Served-build log](final/b2-3-served-check-and-bundle.txt) · [Raw measurements](final/b2-3-measurements.json)

| Metric | Value |
| --- | --- |
| JS gzip | {js['gzipBytes']/1000:.3f} kB. [Raw artifact](final/b2-3-{js['file']}.gz) |
| CSS gzip | {css['gzipBytes']/1000:.3f} kB. [Raw artifact](final/b2-3-{css['file']}.gz) |
| Combined gzip | {m['bundle']['totalGzipBytes']/1000:.3f} kB, with {(200000-m['bundle']['totalGzipBytes'])/1000:.3f} kB headroom under 200 kB |
| 100-NPC save | {m['save']['bytes']:,} bytes; exact round trip. Byte-identical to prior measurement: {m['save']['byteIdenticalToPrevious']}. [Raw save](final/b2-3-100npc-roundtrip.json) |
'''
if m['screenshotAssetBytesChanged']:
    for name in ('b2-3-characters-empty-1280x900.png','b2-3-hall-move-1280x900.png'):
        assert (f/name).is_file()
    report+='\nFinal-head 1280×900 captures after the JS bytes changed. [Characters](final/b2-3-characters-empty-1280x900.png) · [Hall Move](final/b2-3-hall-move-1280x900.png) · [Capture log](final/b2-3-screenshots.txt)\n'
report+='\nThe accepted prior R-026 addendum is retained byte for byte. [R-026 addendum](../correction-10/R-026-addendum.md) · [Evidence manifest](SHA256SUMS.txt)\n'
(c/'README.md').write_text(report,encoding='utf-8',newline='\n')
print(f'{state} at {head}. Smoke {expected}/{total}, exit {exitcode}.')
