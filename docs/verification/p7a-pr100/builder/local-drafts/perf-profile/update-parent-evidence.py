"""Supersede the earlier completion claim with the diagnostic HOLD; preserve history."""
from pathlib import Path
import datetime as dt
import json

OUT=Path(__file__).resolve().parent
PARENT=OUT.parent
for current,history in [('README.md','prior-README.md'),('results-summary.json','prior-results-summary.json'),('SHA256SUMS.txt','prior-parent-SHA256SUMS.txt')]:
    if not (OUT/history).exists():(OUT/history).write_bytes((PARENT/current).read_bytes())
readme=(PARENT/'README.md').read_text(encoding='utf-8')
readme=readme.replace('**B0–B2 complete at the exact head below.**','**HOLD — B1 performance acceptance remains unresolved after Astra round 1 and matched base/head profiling.**',1)
readme=readme.replace('This folder has no independent review verdict and is not a G5 approval.','Astra round 1 is FAIL with one P2; the new diagnostic does not clear that finding. This is not a G5 approval.',1)
marker='## Latest performance review — diagnostic HOLD'
if marker not in readme:
    readme+='''
## Latest performance review — diagnostic HOLD

Owner Tân: "Profile base vs head (Recommended)". Astra round 1 found no functional defect but one P2 for unresolved performance acceptance. The six approved fresh-process runs are complete in base/head/base/head/base/head order. See [perf-profile/README.md](C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/README.md) and [perf-profile/summary.json](C:/Users/Admin/.t3/local-drafts/p7a-prB/perf-profile/summary.json) for full and warmed per-run tables, CPU profiles, component timers and limitations.

The matched profile shows additional head cost: pooled mean +9.027 ms, pooled maximum +36.562 ms; warmed head has 20/165 >50 ms ticks, base 0/165. One head run drives the large tail; the other adjacent mean differences are +1.169 and +2.285 ms. First ticks dominate base and two head runs, but not the first head run's late tail. The additional full-NPC clone in npc-life-week.ts:17 accounts for about 97% of direct life-step time. It does not uniquely explain the entire late outlier. No fix was performed. B1 performance acceptance is HOLD; historical green functional gates and 387/387 smoke remain recorded facts, not an acceptance override.

The feature HEAD/tree and all 498 tracked raw file bytes are restored and unchanged. No feature commit, dependency install, build/test/smoke run, timeout/threshold/config change, push, PR creation or merge. All six measurement processes exited 0. The controller's final Git stat-cache assertion incident and its content-preserving resolution are retained in perf-profile/restoration.json and restoration-stat-cache.txt. Explicit UTC sleep/resume audit reports zero events through restoration. Ports are free and status is empty. The earlier README/results/parent manifest are preserved inside perf-profile as history.
'''
    (PARENT/'README.md').write_text(readme,encoding='utf-8')
summary=json.loads((PARENT/'results-summary.json').read_text(encoding='utf-8'))
summary.update(overallStatus='HOLD',performanceAcceptance='Unresolved; Astra round 1 P2 and six-run matched profile. Historical passing confirmation does not close acceptance.',latestDiagnostic='perf-profile/summary.json',reviewVerdict={'reviewer':'Astra','round':1,'verdict':'FAIL','P2':1,'functionalDefects':0,'source':'astra-review/astra-round1.md'},diagnosticRecordedUtc=dt.datetime.now(dt.timezone.utc).isoformat())
(PARENT/'results-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
ledger=PARENT/'progress.md'
with ledger.open('a',encoding='utf-8') as log:log.write('\nAstra round 1 P2: performance acceptance unresolved. Owner approved "Profile base vs head (Recommended)". Six alternating diagnostic processes completed; head pooled mean +9.027 ms and head-only warmed breaches. Additional full NPC clone is measured, exceptional late tail not uniquely explained. HOLD, no fix. Branch/head/tree/all 498 raw tracked files restored, empty status/ports free, no commit or push. Prior completion claim is superseded for B1 performance acceptance.\n')
print('Parent README/results now state diagnostic HOLD; prior evidence retained.')
