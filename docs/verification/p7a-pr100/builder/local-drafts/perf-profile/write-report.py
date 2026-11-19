"""Write HOLD report and a chart from existing raw diagnostic data only."""
from pathlib import Path
import json

OUT=Path(__file__).resolve().parent
data=json.loads((OUT/'summary.json').read_text(encoding='utf-8'))
rows=data['rows']
def table(view):
    text='| Run | CPU before | Max ms | p95 ms | Mean ms | Ticks >50 ms |\n|---|---:|---:|---:|---:|---:|\n'
    for r in rows:
        s=r['endWeek'][view]
        text+=f"| {r['run']} | {r['cpuStart'][0]['LoadPercentage']}% | {s['max']:.3f} | {s['p95']:.3f} | {s['mean']:.3f} | {s['over50']} |\n"
    return text
life='| Head run | All: max / p95 / mean ms | Warm: max / p95 / mean ms | >50 all / warm |\n|---|---:|---:|---:|\n'
components='| Head run | Life mean ms | Full-NPC clone mean ms | Clone / life | Post map/scan mean ms |\n|---|---:|---:|---:|---:|\n'
for r in rows[1::2]:
    a,w=r['life']['all'],r['life']['warm'];c=r['lifeClone']['all'];p=r['postTransitions']['all']
    life+=f"| {r['run']} | {a['max']:.3f} / {a['p95']:.3f} / {a['mean']:.3f} | {w['max']:.3f} / {w['p95']:.3f} / {w['mean']:.3f} | {a['over50']} / {w['over50']} |\n"
    components+=f"| {r['run']} | {a['mean']:.3f} | {c['mean']:.3f} | {100*c['mean']/a['mean']:.2f}% | {p['mean']:.3f} |\n"
diff='| Adjacent pair | All mean Δ ms | All max Δ ms | Warm mean Δ ms | Warm max Δ ms |\n|---|---:|---:|---:|---:|\n'
for p in data['pairs']:diff+=f"| {p['head']} − {p['base']} | {p['allMeanDelta']:+.3f} | {p['allMaxDelta']:+.3f} | {p['warmMeanDelta']:+.3f} | {p['warmMaxDelta']:+.3f} |\n"
dominance='| Run | Max at tick | First 5 mean ms | Ticks 6–60 mean ms | >50 first 5 / rest |\n|---|---:|---:|---:|---:|\n'
for r in rows:dominance+=f"| {r['run']} | {r['maxTick']} | {r['endWeek']['firstFive']['mean']:.3f} | {r['endWeek']['warm']['mean']:.3f} | {r['firstFiveOver50']} / {r['warmOver50']} |\n"
text=f'''# PR #100 performance profile — HOLD

Owner Tân, verbatim: "Profile base vs head (Recommended)". Diagnostic only; no product/test/timeout/threshold/config change, commit, push, PR creation or merge. Astra round 1's P2 remains unresolved. The historical functional gates/smoke remain green, but B1 performance acceptance must not be claimed complete.

Base: `dac604054d7cbbf14a0a42209a3ff560380f2956`. Head: `cf94804876ef2d02835112e06c355314bbcc16cd`, tree `3ee007bb2818beddbe87f1dce042b6820e8a2ad2`.

## Method

One `profile-harness.mjs`, six fresh Node processes in the exact base/head/base/head/base/head order. Same seed 42, byte-identical initial session, 100 female adult NPCs with life present on both revisions, 60 full END_WEEK calls and intervening NEXT_WEEK calls. No gameplay warm-up or separate life pre-pass; every raw tick 1–60 is retained. The warmed view below uses ticks 6–60 only as an additional view. p95 uses nearest rank `ceil(0.95*n)`. Runtime: Node {data['runtime']['node']}, V8 {data['runtime']['v8']}, Vite {data['runtime']['vite']}.

Both revisions use the same source SSR harness and 1 ms Inspector CPU sampling. Head-only in-memory Vite transforms time the life call, its full-NPC clone, and post-transition map/scan in the actual END_WEEK path. The transformed sources are saved as text. Repository/config files are not instrumented or edited. Timer/wrapper overhead is included, not subtracted; these are instrumented diagnostic timings, not a production-bundle performance guarantee. Inspector traces include END_WEEK plus NEXT_WEEK; inclusive CPU times can overlap and must not be added.

No .codegraph directory or matching memory index exists; exact source reads were used for attribution. `graph-coverage.json` records the unavailable-index result. Lockfiles match; no dependency install, build, unit or smoke run was performed.

## END_WEEK — all 60 ticks

{table('all')}
## END_WEEK — warmed view, ticks 6–60

{table('warm')}
## Head life step — in-call timings

Base has no life step; it still executes the same 100-NPC full END_WEEK workload.

{life}
## Head minus base

{diff}
Pooled over 180 raw ticks per revision: base mean {data['pooled']['base']['all']['mean']:.3f} ms; head mean {data['pooled']['head']['all']['mean']:.3f} ms. Head − base mean **{data['headMinusBase']['all']['mean']:+.3f} ms**, maxima difference **{data['headMinusBase']['all']['max']:+.3f} ms**. Warmed pooled differences: mean **{data['headMinusBase']['warm']['mean']:+.3f} ms**, maxima **{data['headMinusBase']['warm']['max']:+.3f} ms**. Raw >50 counts: base 3/180, head 23/180. Warmed >50 counts: base 0/165, head 20/165.

The pooled difference is driven by 02-head. Other adjacent pairs have smaller positive mean deltas. Thus this evidence does not support saying base and head behave the same, nor does it prove a universal 9 ms regression on every run.

## First-tick dominance

{dominance}
Base maxima occur at tick 1 in all three runs; all three base breaches are in ticks 1–2. Head runs 04 and 06 also peak at tick 1 and have no warmed breaches. Head run 02 differs: max at tick 45, breaches at tick 1 and ticks 40–59. Its ticks 6–39 mean is 34.307 ms versus 73.160 ms for ticks 40–60. The late block coincides with the first birthday/history population at tick 40, but that association does not reproduce as a comparable jump in 04-head or 06-head. Startup dominates most runs, not all head runs.

## Attribution: measured facts and inference

{components}
The strongest measured added cost is `packages/simulation/src/npc-life-week.ts:17`, `structuredClone(npcs)`, after `packages/simulation/src/world-npc.ts:52` already cloned those NPCs for the delegated command. The additional full-NPC clone accounts for about 97% of direct life-step time. This is the likely PR B allocation contributing to ordinary head overhead. The new Map/scan at `character-life-command.ts:46` is measured but much smaller. Birthday history also allocates counter/recent objects at `npc-life-week.ts:13–14` and is subsequently validated through `npc-life.ts` and `hasWeeklyKeys`; no bounded-history leak was observed.

The added clone alone does **not** explain the full exceptional latency. At 02-head tick 45, END_WEEK is 106.600 ms, life is 8.596 ms, its clone is 8.357 ms, and post bookkeeping is 0.112 ms. CPU sampling shows both structuredClone and canonical validation/record checks as major costs across the whole command path. 02-head has broader higher sampled costs; an allocation trace or controlled counterfactual was not authorized/performed. GC, JIT and ambient CPU variability have not been uniquely separated. Do not subtract life timing from full time as proof of cause or claim the outlier is explained away.

## Machine, restoration and decision

`machine-start.json` records initial CPU 9% on 8 logical processors. Each run has its own CPU/top-process snapshot and no competing test/build/review job or held port was detected at launch. Per-run CPU load varies 17–45%; quiet means the required competing-job check passed, not that ambient CPU load was zero. Explicit UTC sleep/resume records cover the whole measurement/restoration window.

All six measurement processes exited 0. The controller initially exited 1 because Git reported stat-cache dirt after exact LF/CRLF byte restoration despite empty content/index diffs. `restoration-stat-cache.txt` records the restricted cache refresh; no blob or index tree changed, no commit and no measurement rerun. `restoration.json` independently verifies the feature branch, empty status, free ports, unchanged local branch refs and all 498 tracked raw file hashes. The original `sequence.json` is retained unchanged rather than hiding the controller incident.

**HOLD:** the owner-specified slower-head condition is observed (pooled mean delta >5 ms and head-only warmed breaches). The likely added clone/allocation is identified, but the exceptional late-run slowdown is not uniquely attributed. No optimization is authorized by this diagnostic approval. Owner review is required before any next step.

Files: `summary.json` contains all statistics; `cpu-summary.json` has sampled frame summaries; `01-base.json` through `06-head.json` contain all raw tick rows, revision/runtime/source/harness hashes and identical-initial-state proof; matching `.cpuprofile` files are raw CPU profiles. `comparison.html` shows all raw full-tick traces. `SHA256SUMS.txt` covers every file in this folder except itself; the parent top manifest also includes this nested manifest.
'''
(OUT/'README.md').write_text(text,encoding='utf-8')
data['conclusion']={'status':'HOLD','headBehavesSameAsBase':False,'observedPooledMeanDeltaOver5Ms':True,'headOnlyWarmBreaches':20,'likelyAddedCost':'Additional full-NPC structuredClone in npc-life-week.ts:17 after world-npc.ts:52 already clones NPCs','lateOutlierUniquelyAttributed':False,'noFixPerformed':True}
(OUT/'summary.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
payload=[{'base':json.loads((OUT/(names[0]+'.json')).read_text())['ticks'],'head':json.loads((OUT/(names[1]+'.json')).read_text())['ticks']} for names in [('01-base','02-head'),('03-base','04-head'),('05-base','06-head')]]
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Full tick profiles</title><style>
*{box-sizing:border-box}body{margin:0;color:var(--foreground);font:13px/1.4 var(--font-sans,system-ui)}.legend{display:flex;gap:20px;align-items:center;margin:0 0 12px}.swatch{display:inline-block;width:20px;height:3px;vertical-align:middle;margin-right:5px}.base{background:var(--muted-foreground)}.head{background:var(--chart-1)}section{margin:16px 0 0}h3{font-size:14px;margin:0 0 5px}svg{width:100%;height:175px;display:block;overflow:visible}.grid{stroke:var(--border);stroke-width:1}.baseLine{stroke:var(--muted-foreground);fill:none;stroke-width:1.8}.headLine{stroke:var(--chart-1);fill:none;stroke-width:2}.limit{stroke:var(--warning);stroke-dasharray:5 4;stroke-width:1.4}.birthday{stroke:var(--border);stroke-dasharray:2 4}text{fill:var(--muted-foreground);font:11px var(--font-mono,monospace)}.readout{min-height:20px;font:11px var(--font-mono,monospace);color:var(--muted-foreground)}.note{font-size:12px;color:var(--muted-foreground);margin:12px 0 0}.cursor{stroke:var(--foreground);stroke-width:.7;opacity:.5}
</style><main><div class="legend"><span><i class="swatch base"></i>Base dac6040</span><span><i class="swatch head"></i>Head cf94804</span></div><div id="plots"></div><p class="note">Full END_WEEK, all 60 ticks in every fresh process. Dashed horizontal line: 50 ms. Vertical marker: tick 40, when head records birthdays. Same y-axis in all panels. Hover/tap a trace for exact per-tick values.</p><p class="note">Instrumented SSR diagnostic with CPU sampling; no warm-up samples discarded. Base, head, base, head, base, head. No product change or fix. Status: HOLD.</p></main><script>const pairs='''+json.dumps(payload)+''';
const ns='http://www.w3.org/2000/svg';const root=document.querySelector('#plots');
const y=v=>143-v/120*130;
const element=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e};
function draw(){root.replaceChildren();const width=Math.max(260,root.clientWidth);const x=t=>30+(t-1)/59*(width-45);pairs.forEach((pair,i)=>{const section=document.createElement('section');const title=document.createElement('h3');title.textContent=`Pair ${i+1} · runs ${2*i+1} / ${2*i+2}`;section.append(title);const svg=element('svg',{viewBox:`0 0 ${width} 175`,role:'img','aria-label':`Pair ${i+1}: all 60 raw full-tick timings for base and head`});[0,50,100].forEach(v=>{svg.append(element('line',{x1:30,x2:width-15,y1:y(v),y2:y(v),class:v===50?'limit':'grid'}));svg.append(element('text',{x:24,y:y(v)+4,'text-anchor':'end'},String(v)))});[1,20,40,60].forEach(t=>svg.append(element('text',{x:x(t),y:164,'text-anchor':'middle'},String(t))));svg.append(element('line',{x1:x(40),x2:x(40),y1:13,y2:143,class:'birthday'}));for(const kind of ['base','head'])svg.append(element('polyline',{points:pair[kind].map(t=>`${x(t.tick)},${y(t.endWeekMs)}`).join(' '),class:kind+'Line'}));const cursor=element('line',{x1:30,x2:30,y1:13,y2:143,class:'cursor',visibility:'hidden'});svg.append(cursor);const readout=document.createElement('div');readout.className='readout';readout.textContent='Tick 1–60 · y-axis milliseconds';svg.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect();const local=(e.clientX-rect.left)/rect.width*width;const tick=Math.max(1,Math.min(60,Math.round((local-30)/(width-45)*59)+1));cursor.setAttribute('x1',x(tick));cursor.setAttribute('x2',x(tick));cursor.setAttribute('visibility','visible');readout.textContent=`Tick ${tick}: base ${pair.base[tick-1].endWeekMs.toFixed(3)} ms · head ${pair.head[tick-1].endWeekMs.toFixed(3)} ms`});section.append(svg,readout);root.append(section)});};draw();window.addEventListener('resize',draw);
</script></html>\n'''
(OUT/'comparison.html').write_text(html,encoding='utf-8')
print('Wrote diagnostic HOLD report and all-raw-tick chart; no new measurements.')
