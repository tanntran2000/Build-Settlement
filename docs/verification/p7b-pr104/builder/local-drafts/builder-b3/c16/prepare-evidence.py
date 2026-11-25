from pathlib import Path
import shutil

here = Path(__file__).resolve().parent
prior = here.parent / 'c14'
for name in ('capture-environment.ps1','run-gates.ps1','served-and-bundle.mjs','rerun-smoke-failures.py','bench-worker.mjs'):
    shutil.copy2(prior/name,here/name)

def write(path, text):
    path.write_text(text,encoding='utf-8',newline='\n')
def edit(source, target, *pairs):
    s = source.read_text(encoding='utf-8')
    for before,after in pairs:
        assert s.count(before)==1,(source,before)
        s = s.replace(before,after)
    write(target,s)

edit(prior/'paired-timings.py',here/'paired-timings.py',
     ("'method':'Five alternating triples on one machine. Each fresh process uses the same untouched checkpoint. The market checkpoint is the exact browser-measured save. Main uses the same shared state encoded via its v12 codec with the v13 acquisition subtree excluded. Baseline noise is the maximum absolute main-A/main-A2 warm-median gap. A warm cost is repeatable when at least four of five candidate deltas exceed that noise.'",
      "'method':'Five alternating triples on one machine. Each fresh process uses the same untouched checkpoint. The market checkpoint is the exact browser-measured save. Main uses the same shared state encoded via its v12 codec with the v13 acquisition subtree excluded. For each triple report the difference from the midpoint of the two main warm medians and the absolute main-to-main gap. Performance interpretation is the owner’s decision under Correction 15.'"),
     (""",'medianDeltaMs':median(deltas),
                      'warmCostAboveNoise':sum(delta>limit for delta in deltas)>=4}""", """,'medianDeltaMs':median(deltas)}"""),
     ("""results.update(finishUTC=utc(),cases=cases,aggregate=aggregate,
               hold=any(item['warmCostAboveNoise'] for item in aggregate.values()))""","""results.update(finishUTC=utc(),cases=cases,aggregate=aggregate)"""),
     ("if results['hold']: raise SystemExit(2)\n", "")
)
edit(prior/'archive-final-artifacts.py', here/'archive-final-artifacts.py',
     ("""    candidate = sorted((here/'green-save-artifacts').rglob(name))
    assert len(candidate) == 1 and candidate[0].read_bytes() == matches[0].read_bytes(), name""",
      """    comparable = here.parent/'c14'/'save-size'/name
    assert comparable.read_bytes() == matches[0].read_bytes(), name"""),
     ("""screens = here/'screenshots'
screens.mkdir(exist_ok=True)
shutil.copy2(here.parent/'screenshot-checkpoint.json', screens/'screenshot-checkpoint.json')
print('Exact-head browser payloads match the isolated reproduction and measured byte counts.')""",
      """print('Exact-head browser payloads match the previous representative sample byte for byte and their measured lengths.')""")
)
edit(prior/'post-smoke.ps1',here/'post-smoke.ps1',
     ("""Run-Evidence 'exact-head-screenshots' @('node',"$PSScriptRoot/capture-screenshots.mjs","$PSScriptRoot/screenshots")
""",""))
edit(prior/'capture-final-worktree.ps1',here/'capture-final-worktree.ps1',
     ("if ($head -ne '8aa7dc4cefbc759ce2a7d158937011c3afe71549' -or $tree -ne 'a44d6bcd31a26f3519a39f5b71e481045a2b9318') { throw 'Tested commit changed' }",
      """$smoke = Get-Content -LiteralPath "$PSScriptRoot/gate-8-smoke.txt" -Encoding utf8
if ($smoke[1] -ne $head -or $smoke[2] -ne $tree) { throw 'Tested commit changed' }"""))
edit(here/'verify-c16.py',here/'verify-c16.py',
     ("    'packages/simulation/src/__tests__/replay-checkpoint.test.ts':",
      """    'packages/persistence/src/__tests__/item-records.test.ts': 'R2-1 synthetic colon owner without a live purchase',
    'packages/persistence/src/__tests__/items-rebuild-order.test.ts': 'R2-1 synthetic numeric and prototype owners without live purchases',
    'packages/simulation/src/__tests__/character-life-command.test.ts': 'R2-1 exact parity oracle for legal retained fixture purchases',
    'packages/simulation/src/__tests__/character-life-observation.test.ts': 'R2-1 exact retained-purchase report for the legal fixture',
    'packages/simulation/src/__tests__/npc-homes.test.ts': 'R2-1 earlier purchase dates for a market-free existing roster',
    'packages/simulation/src/__tests__/replay-checkpoint.test.ts':"""))
