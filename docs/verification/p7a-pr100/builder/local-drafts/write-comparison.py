"""Render the recorded bundle/performance comparison as self-contained HTML."""
from pathlib import Path
import json

OUT=Path(__file__).resolve().parent
data=json.loads((OUT/'results-summary.json').read_text(encoding='utf-8'))
bundle=data['bundle']
perf=data['perfMaxMs']
def row(label,value,maximum,unit,style='',digits=2):
    limit='<span class="limit" aria-hidden="true"></span>' if unit=='ms' else ''
    return f'<div class="row {style}"><span>{label}</span><div class="track">{limit}<span class="bar" style="width:{value/maximum*100:.5f}%"></span></div><strong>{value:.{digits}f} {unit}</strong></div>'
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PR B measurements</title><style>
*{box-sizing:border-box}body{margin:0;color:var(--foreground);font:14px/1.45 var(--font-sans,system-ui)}h3{font-size:15px;margin:0 0 10px}p{margin:8px 0 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.row{display:grid;grid-template-columns:58px minmax(30px,1fr) 82px;gap:8px;align-items:center;margin:10px 0;font-size:12px}.row strong{text-align:right;font:12px var(--font-mono,monospace);font-weight:600;white-space:nowrap}.track{height:17px;position:relative;background:color-mix(in srgb,var(--foreground) 9%,transparent);border-radius:3px;overflow:hidden}.bar{display:block;height:17px;background:var(--chart-1);border-radius:3px}.baseline .bar{background:var(--muted-foreground);opacity:.65}.failed .bar{background:var(--warning)}.limit{position:absolute;z-index:2;left:50%;top:0;bottom:0;border-left:2px dashed var(--foreground)}.axis{display:flex;justify-content:space-between;font-size:11px;color:var(--muted-foreground);margin:6px 90px 0 66px}.note{font-size:12px;color:var(--muted-foreground)}.perf{margin-top:25px}.measurement{height:100px}.perf .measurement{height:133px}.delta{font-size:13px;font-weight:600;margin:4px 0 0}.head{font-size:11px;color:var(--muted-foreground);margin-top:18px}@media(max-width:560px){.grid{grid-template-columns:1fr;gap:16px}.measurement{height:88px}.row{grid-template-columns:58px minmax(30px,1fr) 82px}.perf{margin-top:20px}}
</style><main><div class="grid"><section><h3>Production JS · gzip</h3><div class="measurement">'''
html+=row('Main',bundle['baseline']['jsGzipKB'],160,'kB','baseline')+row('PR B',bundle['current']['jsGzipKB'],160,'kB')
html+='<div class="axis"><span>0</span><span>160 kB</span></div></div><p class="delta">+0.63 kB vs main</p></section><section><h3>Production CSS · gzip</h3><div class="measurement">'
html+=row('Main',bundle['baseline']['cssGzipKB'],8,'kB','baseline')+row('PR B',bundle['current']['cssGzipKB'],8,'kB')
html+='<div class="axis"><span>0</span><span>8 kB</span></div></div><p class="delta">Unchanged at 0.01 kB precision</p></section></div><section class="perf"><h3>Maximum tick time · 100 NPCs × 60 weeks</h3><div class="measurement">'
html+=row('First',perf['firstEndWeek'],100,'ms','failed',4)+row('Confirm',perf['confirmationEndWeek'],100,'ms','',4)+row('Life only',perf['confirmationLife'],100,'ms','',4)
html+='<div class="axis"><span>0</span><span>50 ms limit</span><span>100 ms</span></div></div><p class="note">First and confirmation rows measure full END_WEEK. The unchanged confirmation passed every tick; the first failure is retained. No samples were discarded. Timing variation is unconfirmed.</p></section><p class="note">Bundle units are decimal kB; main baselines were supplied rounded. Current raw gzip: JS 139,893 bytes; CSS 7,152 bytes. Comparison uses recorded measurements, with no new build or benchmark run.</p><p class="head">HEAD cf94804876ef2d02835112e06c355314bbcc16cd</p></main></html>\n'
(OUT/'bundle-perf-comparison.html').write_text(html,encoding='utf-8')
print(OUT/'bundle-perf-comparison.html')
