import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
const require=createRequire(path.resolve('package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:3000/?mode=data-inspector');
 await page.getByRole('heading',{name:'Data inspector',exact:true}).waitFor();
 await page.getByText('0 of 0 records shown',{exact:true}).waitFor();
 writeFileSync(new URL('./dev-inspector-save.txt',import.meta.url),await page.locator('body').innerText(),'utf8');
 console.log('EMPTY_SAVE_DATABASES='+JSON.stringify(await page.evaluate(async()=>indexedDB.databases())));
 await page.getByRole('tab',{name:'Catalogs',exact:true}).click();
 await page.getByLabel('Search by id',{exact:true}).fill('HOSPITAL');
 await page.getByRole('heading',{name:'hospital',exact:true}).waitFor();
 writeFileSync(new URL('./dev-inspector-catalog.txt',import.meta.url),await page.locator('body').innerText(),'utf8');
 await page.screenshot({path:new URL('./dev-inspector.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 console.log('CATALOG_SEARCH='+await page.getByText('1 of 32 records shown',{exact:true}).innerText());
 console.log('EDITABLE_DATA_CONTROLS='+await page.locator('textarea,[contenteditable=true]').count());
} finally {await browser.close();}
