import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const report=JSON.parse(fs.readFileSync(path.join(root,'bundle-measurement.json'),'utf8'));
const before=report.baselineGzipKB.js+report.baselineGzipKB.css,after=(report.gzipBytes.js+report.gzipBytes.css)/1000;
const row=(label,value,color)=>`<div class="row"><span>${label}</span><div class="track"><div class="bar" style="width:${value/2}%;background:var(${color})"></div></div><strong>${value.toFixed(3)} kB</strong></div>`;
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PR B bundle comparison</title><style>
body{margin:0;color:var(--foreground);font-family:var(--font-sans),sans-serif}figure{margin:0;padding:0}figcaption{font-size:15px;font-weight:600;margin-bottom:16px}.row{display:grid;grid-template-columns:62px minmax(0,1fr) 94px;align-items:center;gap:12px;margin:12px 0;font-size:13px}.track{height:22px;background:var(--muted);border-radius:4px;overflow:hidden}.bar{height:22px;border-radius:4px}strong{font:12px var(--font-mono),monospace;text-align:right}.axis{display:flex;justify-content:space-between;margin:4px 106px 0 74px;font-size:11px;color:var(--muted-foreground)}p{font-size:12px;line-height:1.5;color:var(--muted-foreground);margin:14px 0 0}
</style><figure aria-label="Combined JavaScript and CSS gzip size compared with main on a zero to 200 kilobyte scale"><figcaption>Combined JS + CSS · gzip kB</figcaption>${row('Main',before,'--chart-2')}${row('PR B',after,'--chart-1')}<div class="axis"><span>0</span><span>200 kB budget</span></div><p>Growth versus the supplied main baseline: +${(after-before).toFixed(3)} kB. Final head ${report.head.slice(0,7)}.</p></figure></html>`;
fs.writeFileSync(path.join(root,'bundle-comparison.html'),html,'utf8');
console.log(`Chart: main ${before.toFixed(3)} kB; PR B ${after.toFixed(3)} kB; growth ${(after-before).toFixed(3)} kB.`);
