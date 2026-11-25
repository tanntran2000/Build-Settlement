import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';

const root=process.cwd(), out=resolve(process.argv[2]);
const ui=join(root,'packages','ui');
const require=createRequire(join(root,'package.json'));
const uiRequire=createRequire(join(ui,'package.json'));
const { chromium }=require('playwright');
const vite=join(dirname(uiRequire.resolve('vite/package.json')),'bin','vite.js');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git', args,{encoding:'utf8'}).trim();
console.log(JSON.stringify({head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}')}));
const server=spawn(process.execPath,[vite,'preview','--port','4173','--strictPort'],{cwd:ui,windowsHide:true,stdio:'inherit'});
const origin='http://localhost:4173', entry=origin+'/?mode=world-life';
let browser;
try {
  for(let i=0;i<60;i+=1) {
    if(server.exitCode!==null) throw Error('Preview exited');
    try { if ((await fetch(entry)).ok) break; } catch {}
    if(i===59) throw Error('Preview did not become ready');
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  const served=await (await fetch(entry)).text();
  assert.equal(served,readFileSync(join(ui,'dist/index.html'),'utf8'));
  for(const match of served.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)){
    const response=await fetch(origin+match[1]);
    const bytes=Buffer.from(await response.arrayBuffer());
    assert(response.ok);
    assert.equal(hash(bytes),hash(readFileSync(join(ui,'dist',match[1].slice(1)))));
    console.log(match[1]+' '+hash(bytes));
  }
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
  await page.goto(entry);
  const button=name=>page.getByRole('button',{name,exact:true});
  await button('New Game').click();
  const creation=page.getByRole('region',{name:'Character Creation',exact:true});
  await creation.getByLabel('Name',{exact:true}).fill('Market Keeper');
  await creation.getByRole('tab',{name:'Review',exact:true}).click();
  await creation.getByRole('button',{name:'Create character',exact:true}).click();
  await page.locator('#life-nav-session').click();
  await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles(join(out,'screenshot-checkpoint.json'));
  await page.locator('#life-nav-city').click();
  await page.getByTestId('trial-tile-spec-2').click();
  const panel=page.getByRole('region',{name:'Auction House acquisitions',exact:true});
  const assets=['for-sale','auction'];
  async function capture(name){
    await page.evaluate(()=>document.fonts.ready);
    await panel.evaluate(node=>node.scrollIntoView({block:'start'}));
    const filename=join(out,'acquisition-'+name+'-1280.png');
    await page.screenshot({path:filename,scale:'css'});
    const data=readFileSync(filename);
    assert.equal(data.readUInt32BE(16),1280);
    assert.equal(data.readUInt32BE(20),900);
    console.log(`1280×900 ${filename} ${hash(data)}`);
  }
  await panel.getByRole('article').first().waitFor();
  assert.equal(await panel.getByRole('article').count(),4);
  await capture(assets[0]);
  await panel.getByRole('tab',{name:'For sale',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await panel.getByRole('button',{name:'+5 Gold',exact:true}).press('Enter');
  await panel.getByRole('list',{name:'Bid log',exact:true}).getByText(/^You bid /).waitFor();
  await capture(assets[1]);
  async function tabTo(target) {
    await target.waitFor({state:'visible'});
    for(let step=0;step<160;step+=1) {
      if(await target.evaluate(node=>node===document.activeElement)) return step;
      await page.keyboard.press('Tab');
    }
    throw Error('Diagnostic control unreachable: '+await target.getAttribute('id'));
  }
  for(const width of [320,375]) {
    await page.setViewportSize({width,height:812});
    await page.getByTestId('trial-tile-field-1').click();
    await page.getByTestId('trial-tile-spec-2').click();
    const sale=panel.getByRole('tab',{name:'For sale',exact:true});
    const auction=panel.getByRole('tab',{name:'Auction',exact:true});
    assert.equal(await sale.getAttribute('tabindex'),'0');
    assert.equal(await auction.getAttribute('tabindex'),'-1');
    const intoTabs=await tabTo(sale);
    await page.keyboard.press('ArrowRight');
    assert.equal(await auction.evaluate(node=>node===document.activeElement),true);
    assert.equal(await auction.getAttribute('aria-selected'),'true');
    const geometry = await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert(geometry.scroll <= geometry.viewport);
    const toOrdinary=await tabTo(page.getByTestId('trial-tile-field-1'));
    await page.keyboard.press('Enter');
    assert.equal(await panel.count(),0);
    const ordinary=page.getByRole('region',{name:'Manage tile'}).getByRole('heading',{name:'field-1 · fertile',exact:true});
    await ordinary.waitFor();
    assert.equal(await ordinary.evaluate(node=>node===document.activeElement),true);
    console.log(JSON.stringify({diagnostic:'mobile keyboard path',width,geometry,intoTabs,toOrdinary,
      focusedOrdinaryTile:true}));
  }
} finally {
  if(browser) await browser.close();
  if(server.exitCode===null){const closed=once(server,'exit');server.kill();await closed;}
}
