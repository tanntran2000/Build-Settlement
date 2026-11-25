import html
import json
import math
from pathlib import Path

here = Path(__file__).resolve().parent
summary = json.loads((here/'timings'/'comparison.json').read_bytes())
names = {
    'control':'No-market control', 'market':'Full market',
    'short-gold':'Short Gold', 'departing-equipped':'Equipped departures',
}
cases = summary['cases']
values = [case[key]['median'] for case in cases.values() for key in ('mainWarmMs','b4WarmMs')]
axis_max = 10 * math.ceil(max(values)/10)
rows = []
for key, case in cases.items():
    name = html.escape(names[key])
    a, b = case['mainWarmMs']['median'], case['b4WarmMs']['median']
    rows.append(f'''<section>
  <h2>{name}</h2>
  <div class="series"><span>Main</span><div class="track"><div class="bar main" style="width:{100*a/axis_max:.4f}%"></div></div><output>{a:.2f} ms</output></div>
  <div class="series"><span>B4</span><div class="track"><div class="bar branch" style="width:{100*b/axis_max:.4f}%"></div></div><output>{b:.2f} ms</output></div>
  <p>Median paired change <b>{case['medianPairedDeltaMs']:+.2f} ms</b> · largest main-to-main gap <b>{case['maxMainToMainNoiseMs']:.2f} ms</b></p>
</section>''')
page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>End Week with 100 NPCs</title>
<style>
  body{font:14px/1.35 var(--font-sans,system-ui,sans-serif);color:var(--foreground,#20242a)}
  h1{font-size:19px;margin:0 0 4px}h2{font-size:14px;margin:0 0 6px}
  section{margin-top:11px;border-top:1px solid var(--border,#d4d9df);padding:9px 0 0}
  p{margin:4px 0;color:var(--muted-foreground,#55616f)}
  .series{display:grid;grid-template-columns:3rem minmax(0,1fr) 5.4rem;align-items:center;gap:7px;margin:3px 0}
  .track{height:8px;background:var(--muted,#e5e7eb);border-radius:4px;overflow:hidden}
  .bar{height:8px;border-radius:4px}.main{background:var(--chart-1,#5282c9)}.branch{background:var(--chart-2,#278570)}
  output{text-align:right;font-family:var(--font-mono,monospace);font-size:13px}
</style></head><body>
<h1>End Week with 100 NPCs</h1>
<p>Warm medians in milliseconds across five paired runs per case.</p>
''' + '\n'.join(rows) + '\n</body></html>\n'
(here/'timings'/'comparison.html').write_bytes(page.encode('utf-8'))

