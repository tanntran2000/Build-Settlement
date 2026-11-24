import hashlib
import html
import json
from pathlib import Path

out=Path(__file__).resolve().parent
s=json.loads((out/'benchmark-summary.json').read_bytes())
raw=json.loads((out/'benchmark-raw.json').read_bytes())
assert len(raw)==s['pairs']==12
assert all(len(entry['runs'][side]['ticksMs'])==21 for entry in raw for side in ('main','b2'))
assert s['conclusion']=='no warm cost distinguishable from run-to-run noise'
assert (out/'worktrees-before.txt').read_bytes()==(out/'worktrees-after.txt').read_bytes()
patch=hashlib.sha256((out/'storage-fixture.patch').read_bytes()).hexdigest()
main=s['variants']['main']; b2=s['variants']['b2']
addendum=f'''### R-026 addendum — P7-B B2 at 100 NPCs, 2026-11-24

Owner decision (Tân), verbatim: “Sửa test + đo so sánh (Recommended)”. Plan correction 10 authorizes a measurement-only comparison of main `f73595b` against B2 product head `f31310c`.

On the i5-8250U Windows machine with Node 24.19.0, 12 alternating fresh-process pairs each ran one first End Week and 20 warm End Week commands. Each command used the same week-8 state with 100 NPCs and 120,000 Gold milli. The main input used ruleset 11 and omitted B2's per-NPC `household` field to satisfy main's exact validator. B2 used ruleset 12. All remaining state matched. Wall-clock timing ran in the external harness. CPU load snapshots were 25% before and 18% after, and the event log showed no sleep/resume during the run. Main pair 7 reached a 96.16 ms warm median and is retained in the analysis.

| Revision | First tick median | First ticks ≥50 ms | Median warm process median | Warm ticks ≥50 ms | Warm maximum |
| --- | ---: | ---: | ---: | ---: | ---: |
| main `f73595b` | {main['coldMedianMs']:.2f} ms | {main['coldAtOrAbove50ms']}/12 | {main['medianWarmProcessMedianMs']:.2f} ms | {main['warmAtOrAbove50ms']}/240 | {main['warmTickRangeMs'][1]:.2f} ms |
| B2 `f31310c` | {b2['coldMedianMs']:.2f} ms | {b2['coldAtOrAbove50ms']}/12 | {b2['medianWarmProcessMedianMs']:.2f} ms | {b2['warmAtOrAbove50ms']}/240 | {b2['warmTickRangeMs'][1]:.2f} ms |

The median paired warm difference (B2 minus main) was +{s['pairedWarmMedianDeltaMs']:.2f} ms. It ranged from −46.31 to +7.28 ms, with an exact 96.14% median interval of −2.56 to +3.19 ms. The pooled median absolute change between consecutive same-revision warm medians was {s['sameRevisionAdjacentChangeMedianMs']:.2f} ms. The added warm cost was within the observed run-to-run noise. Both revisions exceeded {s['thresholdMs']} ms on first and warm ticks, so R-026 now covers the observed warm misses as well. The under-50-ms target stays in force. The comparison measured total command time and did not attribute the slow processes to a particular code path.
'''
(out/'R-026-addendum.md').write_text(addendum,encoding='utf-8',newline='\n')
head=s['checkouts']['b2']['head']; tree=s['checkouts']['b2']['tree']
report=f'''# P7-B B2 Correction 10 Builder HOLD

**HOLD at `{head}`, tree `{tree}`.** Branch `feat/p7b-npc-generator` has empty `git status --porcelain=v1 --untracked-files=all`. Both previous commits are retained, with the Codex trailer. Ports 4173 and 4174 are free. The baseline used a sibling detached worktree at `b2-c10-benchmark-main`, created at `f73595b` and removed after the run. [Worktrees before](worktrees-before.txt) · [Worktrees after](worktrees-after.txt)

Owner approval, verbatim: “Sửa test + đo so sánh (Recommended)”. Correction 10 plan SHA-256 `ae6b5ceea46f630c4694f48f84193884a6a7c572809a997aa78609f92b8010d9`. Prior HOLD SHA-256 `9b72a274a3af7d60d7129af4c8e79969c9a6e4a0b35a03588bf1efe923fb460c`.

## Storage smoke

1. RED remains the prior full-smoke result and isolated reproduction at `storage.spec.ts:113`, expected seven rows and received four. [Full RED](../b2-3-smoke.txt) · [Isolated RED](../b2-3-isolated/001.txt)
2. Applied the approved helper import and fixture call only. The staged tree was `312797f184f6414064e5ecf81eb1fba7a7bc55d0` and the assertions were byte-identical. The two launches went through the same Windows command wrapper. Attempt 1 selected zero tests. Attempt 2 selected 409 and was terminated before the target case ran. This is a launch HOLD. The case has no GREEN result. [Attempt 1](storage-green.txt) · [Attempt 2](storage-green-isolated.txt)
3. Archived the exact staged diff, verified it reapplies, and restored the worktree to HEAD. The planned third commit awaits an authorized isolated GREEN. The direct Playwright invocation selects exactly one case in collection mode. [Patch](storage-fixture.patch) SHA-256 `{patch}` · [Verifier](verifier-precommit.json) · [Collection output](storage-selector-list.txt) · [Direct runner](run-storage-case-direct.py)

The last completed gate run at this HEAD passed gates 1–7, including 3,186 unit tests. The last completed full `CI=1` smoke passed 408/409, with the one failed case reproducing in isolation. The Correction 10 full gates and smoke were deferred at the storage launch HOLD. [Prior gate and smoke evidence](../B2-3-HOLD.md)

## Paired timing results

The comparison points to warm variation under R-026. Read [the risk register addendum](R-026-addendum.md), [protocol](benchmark-protocol.md), [per-tick raw data](benchmark-raw.json), [summary JSON](benchmark-summary.json) and [input comparison](benchmark-inputs.json).

| Pair | Order | Main cold | B2 cold | Main warm median | B2 warm median | Warm delta |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
'''
for pair in raw:
    m=pair['runs']['main']; b=pair['runs']['b2']; order='main → B2' if pair['pair']%2 else 'B2 → main'
    report+=f"| {pair['pair']} | {order} | {m['coldMs']:.3f} ms | {b['coldMs']:.3f} ms | {m['warmMedianMs']:.3f} ms | {b['warmMedianMs']:.3f} ms | {pair['pairedWarmMedianDeltaMs']:+.3f} ms |\n"
report+='''
[Execution log](benchmark-run.txt) · [CPU and top processes before](benchmark-environment-before.txt) · [CPU and top processes after](benchmark-environment-after.txt) · [Power events](benchmark-power-events.txt)

The B2 save is 300,168 bytes and round-tripped byte-identically in the comparison probe. The last production measurement at this HEAD was 150.866 kB JS and 7.567 kB CSS gzip, 158.433 kB total against 153.265 kB on main. [Save probe](benchmark-probes.json) · [Bundle and served hashes](../b2-3-measurements.json)

Existing exact-head 1280×900 screenshots remain representative because the product HEAD is the same. [Characters](../b2-3-characters-empty-1280x900.png) · [Hall Move](../b2-3-hall-move-1280x900.png) · [Evidence manifest](SHA256SUMS.txt)
'''
(out/'README.md').write_text(report,encoding='utf-8',newline='\n')

def position(ms):
    return (ms-30)/70*100
rows=[]
for pair in raw:
    a=pair['runs']['main']['warmMedianMs']; b=pair['runs']['b2']['warmMedianMs']
    delta=pair['pairedWarmMedianDeltaMs']
    label=html.escape(f"Pair {pair['pair']}. Main {a:.2f} ms. B2 {b:.2f} ms. B2 minus main {delta:+.2f} ms.")
    rows.append(f'''<div class="row" role="img" aria-label="{label}" title="{label}"><div class="label">{pair['pair']:02d}</div><div class="track"><i class="budget"></i><span class="connector" style="left:{position(min(a,b)):.3f}%;width:{abs(position(a)-position(b)):.3f}%"></span><span class="dot main" style="left:{position(a):.3f}%"></span><span class="dot b2" style="left:{position(b):.3f}%"></span></div><div class="delta">{delta:+.2f}</div></div>''')
page='''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>100-NPC End Week comparison</title>
<style>
body{font-family:var(--font-sans,system-ui);color:var(--foreground,#17191f);margin:0;font-size:13px}h2{font-size:17px;margin:0 0 8px}.legend{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 9px}.legend span{display:inline-flex;align-items:center;gap:6px}.glyph{display:inline-block;width:8px;height:8px}.main{background:var(--chart-1,#3c7bd5);border-radius:50%}.b2{background:var(--chart-2,#e88937);border-radius:1px}.legend .line{width:12px;border-top:2px dashed var(--muted-foreground,#777)}.row,.axis{display:grid;grid-template-columns:35px 1fr 63px;gap:8px;align-items:center}.row{height:22px;border-top:1px solid var(--border,#ddd)}.track{position:relative;height:22px}.dot{position:absolute;top:50%;width:8px;height:8px;transform:translate(-50%,-50%)}.b2.dot{width:6px;height:6px;z-index:1}.connector{position:absolute;top:50%;height:1px;background:var(--muted-foreground,#777)}.budget{position:absolute;left:28.571%;height:22px;border-left:1px dashed var(--muted-foreground,#777)}.axis{border-top:1px solid var(--border,#ddd);margin-top:1px}.ticks{position:relative;height:22px;font-size:11px}.ticks span{position:absolute;transform:translateX(-50%);top:4px}.label,.delta,.mono{font-variant-numeric:tabular-nums}.delta{text-align:right}.muted{color:var(--muted-foreground,#666)}
</style><body><h2>100-NPC End Week warm medians</h2><p class="legend"><span><i class="glyph main"></i>Main</span><span><i class="glyph b2"></i>B2</span><span><i class="line"></i>50 ms budget</span></p>
<div class="axis muted"><span>Pair</span><span></span><span class="delta">B2 − main</span></div>
''' + '\n'.join(rows) + '''
<div class="axis muted"><span></span><div class="ticks"><span style="left:0">30</span><span style="left:28.571%">50</span><span style="left:57.143%">70</span><span style="left:85.714%">90</span><span style="left:100%">100</span></div><span class="delta">ms</span></div></body></html>
'''
(out/'warm-comparison.html').write_text(page,encoding='utf-8',newline='\n')
print(f'Wrote report with {len(raw)} pair rows, addendum and warm median chart.')
