import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const require=createRequire(path.resolve('package.json'));
const { chromium }=require('playwright');
const data=(file,type)=>'data:'+type+';base64,'+fs.readFileSync(root+file).toString('base64');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Owner reference and hand-traced NPC silhouette</title><style>*{box-sizing:border-box}body{margin:0;padding:22px;background:#f6efde;color:#3b2a17;font:14px system-ui}h1{font-size:18px;margin:0 0 18px}.row{display:flex;gap:24px;align-items:start}figure{margin:0}figcaption{margin-bottom:10px;font-weight:600}.panel{height:300px;width:150px;background:#d9c499;display:flex;align-items:end;justify-content:center}img{display:block;object-fit:contain}.note{font-size:12px;margin-top:16px}</style><h1>NPC silhouette · owner reference and hand trace</h1><div class="row"><figure><figcaption>Reference · 300 px</figcaption><div class="panel"><img width="150" height="300" src="${data('owner-npc-silhouette-reference.webp','image/webp')}"></div></figure><figure><figcaption>SVG · 300 px</figcaption><div class="panel"><img width="150" height="300" src="${data('silhouette/npc-trace.svg','image/svg+xml')}"></div></figure><figure><figcaption>SVG · 140 px</figcaption><div class="panel"><img width="70" height="140" src="${data('silhouette/npc-trace.svg','image/svg+xml')}"></div></figure></div><p class="note">Trace uses the existing doll fill (#756248, opacity .65) on the doll background (#d9c499). Reference preserved as supplied.</p></html>`;
fs.writeFileSync(root+'silhouette/comparison.html',html,'utf8');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:565,height:418},deviceScaleFactor:1});
 await page.setContent(html);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
 await page.screenshot({path:root+'silhouette/reference-vs-trace.png',fullPage:true});
 console.log('Saved silhouette/reference-vs-trace.png (reference and SVG at 300 px; SVG at 140 px).');
}finally{await browser.close();}
