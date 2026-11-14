import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const require=createRequire(path.resolve('package.json')),{chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:728,height:410},deviceScaleFactor:1});
 await page.setContent(fs.readFileSync(root+'bundle/comparison.html','utf8'));
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
 await page.screenshot({path:root+'bundle/comparison.png',fullPage:true});
}finally{await browser.close();}
fs.writeFileSync(root+'fix1/visual-renderer.json',JSON.stringify({UTC:new Date().toISOString(),HEAD:'5e97f049330c2e6c4e213b845815afb368d8a7b3',preview:'unavailable',render:'unavailable',renderCode:'thread_credential_required',error:'This tool acts as the calling T3 thread, so it needs an agent running inside T3 Code. This MCP client signed in from outside a thread.',fallbacks:['bundle/comparison.html','bundle/comparison.png','review-preview.html'],method:'Standalone HTML chart rasterized with the installed Playwright Chromium, no server; browser closed afterward'},null,2)+'\n','utf8');
console.log('Wrote bundle/comparison.png and visual-renderer.json.');
