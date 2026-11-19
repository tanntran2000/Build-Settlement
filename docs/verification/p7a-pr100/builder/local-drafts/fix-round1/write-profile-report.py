"""Compare retained new-head measurements with the previous batch; run no gameplay."""
from pathlib import Path
import json

OUT=Path(__file__).resolve().parent
NEW=OUT/'profile'
OLD=OUT.parent/'perf-profile'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
new=load(NEW/'summary.json');old=load(OLD/'summary.json')
assert new['runtime']==old['runtime']
assert new['initialSessionSha256']==old['initialSessionSha256']
head_names=['02-head','04-head','06-head']
same=[];ordinal=[]
for name in head_names:
    a,b=load(OLD/(name+'.json')),load(NEW/(name+'.json'))
    assert a['finalSessionSha256']==b['finalSessionSha256']
    assert (a['seed'],a['npcs'],a['weeks'],a['cpuSamplingUs'])==(b['seed'],b['npcs'],b['weeks'],b['cpuSamplingUs'])==(42,100,60,1000)
    same.append({'run':name,'previousHead':a['head'],'newHead':b['head'],'finalSessionSha256':b['finalSessionSha256'],'serializedFinalStateIdentical':True})
    ordinal.append({'run':name,'allMeanDelta':b['endWeek']['all']['mean']-a['endWeek']['all']['mean'],'allMaxDelta':b['endWeek']['all']['max']-a['endWeek']['all']['max'],'warmMeanDelta':b['endWeek']['warm']['mean']-a['endWeek']['warm']['mean'],'warmMaxDelta':b['endWeek']['warm']['max']-a['endWeek']['warm']['max'],'lifeMeanDelta':b['life']['all']['mean']-a['life']['all']['mean']})
change={view:{key:new['pooled']['head'][view][key]-old['pooled']['head'][view][key] for key in ['mean','max','p95','over50']} for view in ['all','warm']}
adjusted={view:{key:new['headMinusBase'][view][key]-old['headMinusBase'][view][key] for key in ['mean','max']} for view in ['all','warm']}
average=lambda dataset,key:sum(r[key]['all']['mean'] for r in dataset['rows'] if r['revision']=='head')/3
old_life,new_life=average(old,'life'),average(new,'life')
old_copy,new_copy=average(old,'lifeClone'),average(new,'lifeClone')
result={'status':'HOLD: strict 50 ms raw-tick acceptance still breached at new-head tick 1 in each run','previousHead':'cf94804876ef2d02835112e06c355314bbcc16cd','newHead':'b94d3083dd71722f329b1bf444fa9dec9b0fd309','headChangeFromPrevious':change,'baseAdjustedChange':adjusted,'ordinalChanges':ordinal,'stateEquality':same,'lifeMean':{'previous':old_life,'new':new_life,'delta':new_life-old_life,'percent':100*(new_life/old_life-1)},'copyPreparationMean':{'previous':old_copy,'new':new_copy,'delta':new_copy-old_copy,'percent':100*(new_copy/old_copy-1)},'limitations':['Previous and new heads were measured in different batches; absolute changes are descriptive, not a controlled contemporaneous old/new causal estimate.','The old outlier run drives much of the pooled improvement.','The reused timing hook recognizes the changed initializer; legacy lifeCloneMs now measures shallow NPC plus deep life copy preparation. Workload, sampling and timing boundaries are unchanged.']}
(OUT/'previous-head-comparison.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')

def table(view):
    text='| Run | CPU before | Max ms | p95 ms | Mean ms | >50 ms |\n|---|---:|---:|---:|---:|---:|\n'
    for r in new['rows']:
        s=r['endWeek'][view]
        text+=f"| {r['run']} | {r['cpuStart'][0]['LoadPercentage']}% | {s['max']:.3f} | {s['p95']:.3f} | {s['mean']:.3f} | {s['over50']} |\n"
    return text
life='| New-head run | All: max / p95 / mean ms | Warm: max / p95 / mean ms | >50 all / warm |\n|---|---:|---:|---:|\n'
for r in new['rows'][1::2]:
    a,w=r['life']['all'],r['life']['warm']
    life+=f"| {r['run']} | {a['max']:.3f} / {a['p95']:.3f} / {a['mean']:.3f} | {w['max']:.3f} / {w['p95']:.3f} / {w['mean']:.3f} | {a['over50']} / {w['over50']} |\n"
diff='| Adjacent pair | All mean Δ | All max Δ | Warm mean Δ | Warm max Δ |\n|---|---:|---:|---:|---:|\n'
for p in new['pairs']:diff+=f"| {p['head']} − {p['base']} | {p['allMeanDelta']:+.3f} | {p['allMaxDelta']:+.3f} | {p['warmMeanDelta']:+.3f} | {p['warmMaxDelta']:+.3f} |\n"
previous='| New minus previous head | All mean Δ | All max Δ | Warm mean Δ | Warm max Δ |\n|---|---:|---:|---:|---:|\n'
for p in ordinal:previous+=f"| {p['run']} | {p['allMeanDelta']:+.3f} | {p['allMaxDelta']:+.3f} | {p['warmMeanDelta']:+.3f} | {p['warmMaxDelta']:+.3f} |\n"
text=f'''# Fix round 1 matched profile

Owner Tân: "Remove the extra clone (Recommended)". Base `dac604054d7cbbf14a0a42209a3ff560380f2956`; new head `b94d3083dd71722f329b1bf444fa9dec9b0fd309`; prior head `cf94804876ef2d02835112e06c355314bbcc16cd`.

**Performance acceptance remains HOLD:** every new-head run has one raw tick over 50 ms, at tick 1. No threshold or warm-up waiver is applied. The full gates/smoke are separate requested checks.

## Shared method and provenance

Six alternating base/head/base/head/base/head processes, seed 42, 100 female adult NPCs, 60 full END_WEEK ticks plus NEXT_WEEK transitions, no gameplay pre-warm or discarded sample. Warmed view is ticks 6–60, calculated separately. p95 is nearest rank. Node/V8/Vite versions match the prior batch. Initial sessions are byte-identical across both batches; each new-head final serialized session equals its corresponding prior-head final session.

The shared source SSR/Inspector harness is reused with one timing-hook recognition adapter for the changed initializer. See ../runner-provenance.json and ../profile-harness.mjs.adapter.patch. This is not a claim of bit-identical harness bytes to the previous batch. Workload, 1 ms CPU sampling, timing boundaries and statistics remain unchanged. Raw legacy lifeCloneMs/instrumentation labels refer to the initializer timing window: on the new head that window measures the shallow NPC / deep life copy preparation, not a full-NPC clone. Saved transformed sources show exactly what executed. Head-only timer overhead remains included.

## Full END_WEEK — ticks 1–60

{table('all')}
## Warmed END_WEEK — ticks 6–60

{table('warm')}
## Life step inside END_WEEK

{life}
## New head minus matched base, milliseconds

{diff}
Pooled all-tick mean difference **{new['headMinusBase']['all']['mean']:+.3f} ms**, maximum difference **{new['headMinusBase']['all']['max']:+.3f} ms**. Warmed mean difference **{new['headMinusBase']['warm']['mean']:+.3f} ms**, maximum difference **{new['headMinusBase']['warm']['max']:+.3f} ms**. Base raw breaches 3/180, warmed 1/165; new head raw breaches 3/180, warmed 0/165.

Every base and new-head maximum is at tick 1. New-head breaches are confined to tick 1; the prior late head tail was not reproduced in this batch. Base run 03 also breaches at tick 10. This does not establish that the earlier tail cannot recur.

## Change from previous head, milliseconds

{previous}
Pooled new − previous head: all-tick mean **{change['all']['mean']:+.3f} ms**, maximum **{change['all']['max']:+.3f} ms**; warmed mean **{change['warm']['mean']:+.3f} ms**, maximum **{change['warm']['max']:+.3f} ms**. Previous-head raw breaches 23/180 become 3/180; warmed 20/165 become 0/165. The previous outlier strongly influences these pooled changes; the two batches have different ambient CPU load and are not a direct contemporaneous old-head/new-head control.

Mean direct life-step time: **{old_life:.3f} → {new_life:.3f} ms ({result['lifeMean']['percent']:+.1f}%)**. Mean copy preparation: **{old_copy:.3f} → {new_copy:.3f} ms ({result['copyPreparationMean']['percent']:+.1f}%)**. Base-adjusted change in the mean gap is **{adjusted['all']['mean']:+.3f} ms** for all ticks and **{adjusted['warm']['mean']:+.3f} ms** for the warmed view. No claim attributes all full-command variability to the refactor.

## Preservation and raw evidence

All six measurement processes and the controller exited 0. The feature branch was restored clean, every original tracked raw file hash and local branch ref was verified, and index-tree equality was checked around the stat-cache refresh. No build/install occurred during profiling. Per-run machine snapshots show no competing test/build/review job or held port at launch. Profile sleep/resume count: {load(NEW/'sleep-resume-events.json')['eventCount']} in the recorded window.

Raw per-tick JSON, initial/final sessions, CPU profiles, transformed-source text, machine snapshots, controller logs and UTC sleep audit are retained in this directory. summary.json/cpu-summary.json recompute metrics directly from raw data. ../previous-head-comparison.json records old/new equality and deltas. This diagnostic does not waive the strict cold-tick budget.
'''
(NEW/'README.md').write_text(text,encoding='utf-8')
new['acceptanceStatus']=result['status'];new['previousHeadComparison']='../previous-head-comparison.json'
(NEW/'summary.json').write_text(json.dumps(new,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'headMinusBase':new['headMinusBase'],'newMinusPrevious':change,'lifeMean':result['lifeMean'],'copyPreparationMean':result['copyPreparationMean'],'serializedStatesUnchanged':True},indent=2))
