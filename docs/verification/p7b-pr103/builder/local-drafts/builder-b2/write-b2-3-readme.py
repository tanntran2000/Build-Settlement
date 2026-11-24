from pathlib import Path
import json
import re
import statistics
import subprocess
import sys

folder=Path(__file__).resolve().parent

def read(name):
    return (folder/name).read_text(encoding='utf-8-sig')

def get(name):
    return json.loads(read(name))

head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip()
assert not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'])
gates=get('b2-3-gates.json')
verify=get('verifier-final.json')
metrics=get('b2-3-measurements.json')
assert gates['head']==head==verify['head']==metrics['head']
assert gates['tree']==tree==verify['verifiedTree']==metrics['tree']
assert 'Ports 4173 and 4174 free' in read('b2-3-environment-after.txt')
smoke=get('b2-3-smoke.json')['stats']
smoke_duration=smoke['duration']/60000
smoke_log=read('b2-3-smoke.txt')
assert '\nCI=1\n' in smoke_log
smoke_exit=int(re.findall(r'^Exit (\d+)\s*$',smoke_log,re.M)[-1])
result='HOLD' if smoke_exit else 'PASS'
case_total=sum(smoke[k] for k in ('expected','unexpected','skipped','flaky'))
assert case_total==409,case_total
retry=get('b2-3-tick-recheck/b2-3-measurements.json')['endWeek']
first=metrics['endWeek']
if max(retry['warm'])>=50 or 'No matching events' not in read('b2-3-environment-after.txt'):
    result='HOLD'
def timings(t):
    return f"cold {t['cold']:.3f} ms. Warm min/median/max {min(t['warm']):.3f}/{statistics.median(t['warm']):.3f}/{max(t['warm']):.3f} ms, {sum(w>=50 for w in t['warm'])}/{len(t['warm'])} at or above 50 ms."

report=f'''# P7-B B2 Builder evidence

**{result}** at `{head}` (`feat/p7b-npc-generator`), tree `{tree}`.

Builder checks ran on 2026-11-24 UTC. `origin/main` was `{verify['originMain']}`. Final porcelain output is empty. Ports 4173 and 4174 were free at handback. [Pre-gates environment](b2-3-environment-before.txt) · [Final environment, status and trailers](b2-3-environment-after.txt)

Owner approval, verbatim: “Duyệt 23 chỗ (Recommended)”. Correction 9 approves the pinned B2.2 patch and 23 exact amendments. The B2.1 commit is `{verify['b2_1']}` (`feat(core): seeded npc generator and price`). The B2.2 commit is `{head}` (`feat(core): npc homes, cap and no starter npcs`). Both carry `Co-authored-by: Codex <noreply@openai.com>`.

## Test-first and byte evidence

| Check | Observed result |
| --- | --- |
| B2.1 | [RED](b2-1-red-recorded.txt) recorded all 33 failures. [GREEN](b2-1-green.txt) passed 32/32 with the exact 45000 comparison staged into B2.2 by Correction 8. |
| B2.2 | [Unit RED](b2-2-red-unit.txt) recorded 9 failures, including the exact 45000 comparison. [Browser RED](b2-2-red-browser.txt) recorded 3 failures. [Focused unit GREEN](b2-2-green-unit.txt) passed 41/41 and [desktop homes GREEN](b2-2-candidate-homes-browser.txt) passed at 1280 and 1600. The standalone New Game RED's empty-roster assertion is in the approved existing creation test. |
| Composed tree before commit | [Typecheck](c9-precommit-typecheck.txt) and [lint](c9-precommit-lint.txt) exited 0. [Full unit](c9-precommit-unit.txt) passed 3,186/3,186 across 137 files. |
| Byte verifier | [Verifier](verifier-final.json) covers {verify['totalPathsCompared']} paths vs main and records Corrections 7–9. The candidate tree `{verify['candidateTree']}` plus {verify['correction9Hunks']} hunks over {verify['correction9Files']} files yields the exact tested tree. [Script](verify-correction-9.py) |
| Golden and saves | [Canonical Git path diff](b2-3-path-diff-final.txt) passed on 3 seeds. It found 0 forbidden paths, 83 byte-identical historical fixtures and 10 v12 fixtures. [Golden regeneration](b2-2-golden-generation.txt) · [v12 generation](b2-2-v12-generation.txt) |

## Final gates

| Gate | Command | Exit |
| --- | --- | --- |
'''
for i,(cmd,code) in enumerate(zip(gates['commands'],gates['exits']),1):
    report+=f'| {i} | `{cmd}` | [{code}](b2-3-gate-{i}.txt) |\n'
report+=f'''| Smoke | `CI=1 npm run test:smoke` | [{smoke_exit}](b2-3-smoke.txt) |

The full smoke ran {case_total} cases in {smoke_duration:.1f} minutes with one Chromium worker. {smoke['expected']} passed, {smoke['unexpected']} failed, {smoke['skipped']} skipped and {smoke['flaky']} flaky. Git Bash printed `CI=1` before invoking npm in the same shell. The added CLI options capture text, JSON and artifacts. [JSON results](b2-3-smoke.json) · [Smoke commands](run-final-smoke.sh)
'''
if smoke_exit:
    isolated=get('b2-3-isolated/results.json')['cases']
    assert len(isolated)==smoke['unexpected']
    report+='\nThe full-smoke failure triggers HOLD even if an isolated rerun passes. Each failed case was selected by source, line, project and exact title.\n\n| Case | Full smoke | Isolated rerun |\n| --- | --- | --- |\n'
    for case in isolated:
        rr=case['rerun']
        full=', '.join(case['fullRunStatuses'])
        label=case['title'].replace('|',r'\|')
        report+=f"| `{case['source']}:{case['line']}` {label} | {full} | [exit {rr['exit']}, {rr['isolatedCount']} case](b2-3-isolated/{rr['log']}) |\n"
report+=f'''
## Measurements and screenshots

Production and regression served HTML matched their own disk bytes. Their JS and CSS SHA-256 values matched the production and regression disk assets and each other before smoke. [Served check](b2-3-served-check-and-measurements.txt) · [Script](measure-final.mjs) · [Raw JSON](b2-3-measurements.json)

| Metric | Exact-head observation |
| --- | --- |
| Bundle, gzip | JS **150.866 kB** (+5.129 kB), CSS **7.567 kB** (+0.039 kB), total **158.433 kB** (+5.168 kB) against main. Headroom **41.567 kB** under the 200 kB budget. [Raw JS](b2-3-index-xNyhfJ1L.js.gz) · [Raw CSS](b2-3-index-BJ9v1KVg.css.gz) |
| 100-NPC End Week, first sample | {timings(first)} [Raw timings](b2-3-measurements.json) |
| 100-NPC End Week, fresh process after smoke | {timings(retry)} [Raw timings](b2-3-tick-recheck/b2-3-measurements.json) · [Pre-repeat environment](b2-3-environment-before-repeat.txt) |
| 100-NPC save | **{metrics['save']['bytes']:,} UTF-8 bytes**, with a byte-identical serialize → deserialize → serialize round trip. Limit 1,048,576 bytes. [Raw save](b2-3-100npc-roundtrip.json) |

[Characters window, empty at New Game](b2-3-characters-empty-1280x900.png) · [Hall residents and Move](b2-3-hall-move-1280x900.png). Both are 1280×900 PNGs from this head. The seven-byte bundle change was the compiled Git build stamp. [Asset comparison](b2-3-screenshot-asset-diff.txt) · [Capture script](capture-final.mjs) · [Capture log](b2-3-screenshots.txt)

The assigned worktree retains the two local commits. [Evidence checksum manifest](SHA256SUMS.txt)
'''
output=folder/('B2-3-HOLD.md' if result=='HOLD' else 'B2-3-README.md')
output.write_text(report,encoding='utf-8',newline='\n')
assert '“Duyệt 23 chỗ (Recommended)”' in output.read_text(encoding='utf-8')
print(output)
