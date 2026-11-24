import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, {encoding:'utf8'}).trim();
const manifest = JSON.parse(readFileSync(path.join(process.argv[2], 'b2-3-measurements.json'), 'utf8'));
if (git('rev-parse','HEAD') !== manifest.head || git('rev-parse','HEAD^{tree}') !== manifest.tree || git('status','--porcelain=v1')) {
  throw Error('Screenshot head is not the clean measured head.');
}
console.log(`Final head ${manifest.head}, tree ${manifest.tree}`);

const root = process.cwd();
const out = process.argv[2];
const ui = path.join(root,'packages','ui');
const require = createRequire(path.join(root,'package.json'));
const uiRequire = createRequire(path.join(ui,'package.json'));
const {chromium} = require('playwright');
const vite = path.join(path.dirname(uiRequire.resolve('vite/package.json')),'bin','vite.js');
const server = spawn(process.execPath,[vite,'preview','--port','4173','--strictPort'], {
  cwd:ui,windowsHide:true,stdio:['ignore','pipe','pipe'],
});
server.stdout.on('data',chunk=>process.stdout.write(chunk));
server.stderr.on('data',chunk=>process.stderr.write(chunk));
let browser;
try {
  const url = 'http://localhost:4173/?mode=world-life';
  for (let attempt=0;attempt<60;attempt+=1) {
    if (server.exitCode!==null) throw Error('Preview server exited');
    try { if ((await fetch(url)).ok) break; } catch {}
    if (attempt===59) throw Error('Preview did not become ready');
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  for(const asset of manifest.bundle.assets){
    const response=await fetch(`http://localhost:4173/assets/${asset.file}`);
    const hash=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
    if(!response.ok||hash!==asset.sha256)throw Error(`Unexpected screenshot asset bytes: ${asset.file}`);
    console.log(`${asset.file} ${hash}`);
  }
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
  await page.goto(url);
  const button = name => page.getByRole('button',{name,exact:true});
  await button('New Game').click();
  const creation=page.getByRole('region',{name:'Character Creation',exact:true});
  await creation.getByLabel('Name',{exact:true}).fill('Synthetic Keeper');
  await creation.getByRole('tab',{name:'Review',exact:true}).click();
  await creation.getByRole('button',{name:'Create character',exact:true}).click();
  await page.locator('#life-nav-characters').click();
  await page.getByText('No NPCs yet. Find recruits at the Guild, Auction House or Slave Market.',{exact:true}).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(out,'b2-3-characters-empty-1280x900.png'),scale:'css'});
  await page.locator('#life-nav-session').click();
  await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles(path.join(out,'b2-3-hall-checkpoint.json'));
  await button('Select estate-2').click();
  const panel=page.getByRole('region',{name:'Manage tile',exact:true});
  const home=panel.getByRole('region',{name:'Home residents',exact:true});
  await home.getByText('Beds used: 3 / 25',{exact:true}).waitFor();
  await home.locator('#npc-home-destination-npc_w1_guild_0').selectOption('estate-1');
  if (await home.getByRole('listitem').count() !== 3) throw Error('Hall roster does not have three residents.');
  if (!(await home.getByRole('button',{name:'Move',exact:true}).first().isEnabled())) throw Error('First Move control is disabled.');
  await home.evaluate(node=>node.scrollIntoView({block:'center'}));
  await page.screenshot({path:path.join(out,'b2-3-hall-move-1280x900.png'),scale:'css'});
  for(const name of ['characters-empty','hall-move']){
    const file=`b2-3-${name}-1280x900.png`;
    const bytes=readFileSync(path.join(out,file));
    if(bytes.readUInt32BE(16)!==1280||bytes.readUInt32BE(20)!==900)throw Error(`${file} dimensions`);
    console.log(`${file} ${createHash('sha256').update(bytes).digest('hex')}`);
  }
} finally {
  if(browser)await browser.close();
  if(server.exitCode===null){const closed=once(server,'exit');server.kill();await closed;}
}

