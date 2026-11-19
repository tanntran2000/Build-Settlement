"""Create a report from retained measurements; no server, build or benchmark."""
from pathlib import Path
import json

OUT=Path(__file__).resolve().parent
OLD=OUT.parent/'perf-profile'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
pairs=[]
for base,head in [('01-base','02-head'),('03-base','04-head'),('05-base','06-head')]:
    pairs.append({'base':load(OUT/'profile'/f'{base}.json')['ticks'],'head':load(OUT/'profile'/f'{head}.json')['ticks'],'previous':load(OLD/f'{head}.json')['ticks']})
text=(OLD/'comparison.html').read_text(encoding='utf-8')
start=text.index('const pairs=');end=text.index(';\nconst ns=',start)
text=text[:start]+'const pairs='+json.dumps(pairs)+text[end:]
text=text.replace('Base dac6040</span><span><i class="swatch head"></i>Head cf94804','Current base dac6040</span><span><i class="swatch head"></i>New b94d308</span><span><i class="swatch previous"></i>Previous cf94804 · earlier batch')
text=text.replace('gap:20px;align-items:center','gap:12px;flex-wrap:wrap;align-items:center')
text=text.replace('.head{background:var(--chart-1)}','.head{background:var(--chart-1)}.previous{background:var(--chart-2)}.previousLine{stroke:var(--chart-2);fill:none;stroke-width:1.3;stroke-dasharray:4 4;opacity:.7}')
text=text.replace("for(const kind of ['base','head'])","for(const kind of ['base','previous','head'])")
text=text.replace("`.readout`", "`.readout`")
text=text.replace('.readout{min-height:20px;','.readout{height:34px;')
text=text.replace('base ${pair.base[tick-1].endWeekMs.toFixed(3)} ms · head ${pair.head[tick-1].endWeekMs.toFixed(3)} ms','base ${pair.base[tick-1].endWeekMs.toFixed(3)} ms · new ${pair.head[tick-1].endWeekMs.toFixed(3)} ms · previous ${pair.previous[tick-1].endWeekMs.toFixed(3)} ms')
text=text.replace('Instrumented SSR diagnostic with CPU sampling; no warm-up samples discarded. Base, head, base, head, base, head. No product change or fix. Status: HOLD.','Instrumented SSR with CPU sampling; every raw tick retained. The previous-head traces come from an earlier batch with different ambient load. One-line fix implemented; strict cold-tick performance acceptance remains HOLD.')
new=load(OUT/'bundle-results.json');old=load(OUT.parent/'bundle-results.json')
bars=''
for label,value in [('Main (rounded)',139.26),('Previous head',old['current']['jsGzipKB']),('New head',new['current']['jsGzipKB'])]:
    bars+=f'<div class="bundle-row"><span>{label}</span><span class="track"><span style="width:{value/160*100:.5f}%"></span></span><strong>{value:.3f} kB</strong></div>'
section='<section><h3>Production JS gzip · decimal kB</h3>'+bars+f'<p class="note">New head: {new["current"]["jsGzipBytes"]:,} JS gzip bytes; {new["current"]["cssGzipBytes"]:,} CSS gzip bytes. JS +{new["current"]["jsGzipBytes"]-old["current"]["jsGzipBytes"]} bytes vs previous head; CSS unchanged. Main CSS baseline is rounded 7.15 kB. Embedded build SHA also changes bundle bytes.</p></section>'
text=text.replace('</main><script>',section+'</main><script>')
text=text.replace('</style>','.bundle-row{display:grid;grid-template-columns:112px minmax(30px,1fr) 90px;gap:8px;align-items:center;font-size:12px;margin:9px 0}.track{height:14px;background:color-mix(in srgb,var(--foreground) 10%,transparent);border-radius:3px}.track span{height:14px;display:block;background:var(--chart-1);border-radius:3px}.bundle-row strong{text-align:right;font:12px var(--font-mono,monospace)}</style>')
(OUT/'comparison.html').write_text(text,encoding='utf-8')
print('Created retained-data comparison; no new measurement.')
