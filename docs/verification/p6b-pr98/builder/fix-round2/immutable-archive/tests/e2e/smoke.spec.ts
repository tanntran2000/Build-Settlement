import {test,expect} from '@playwright/test';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {makeLife,importLife,exportLife} from './character-life-navigation.helpers.ts';
import {createHash} from 'node:crypto';
import {execSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
test.use({baseURL:'http://localhost:4174'});

test('regression build cannot overwrite or enter the production artifact',async()=>{
 async function hashes(directory:string):Promise<Record<string,string>>{
  const result:Record<string,string>={};
  for(const item of await readdir(directory,{withFileTypes:true})){
   const path=`${directory}/${item.name}`;
   if(item.isDirectory())Object.assign(result,await hashes(path));
   else result[path]=createHash('sha256').update(await readFile(path)).digest('hex');
  }
  return result;
 }
 const before=await hashes('packages/ui/dist');
 expect(Object.keys(before).length).toBeGreaterThan(0);
 // Constant command via shell: Windows npm is npm.cmd, which execFile cannot launch.
 execSync('npm run build:regression --workspace=@haven/ui',{stdio:'pipe'});
 expect(await hashes('packages/ui/dist')).toEqual(before);
 expect(Object.keys(before).some(path=>path.includes('/regression/'))).toBe(false);
 expect(await readFile('packages/ui/dist/index.html','utf8')).not.toContain('R1 regression only');
 expect((await readFile('packages/ui/regression/main.ts','utf8')).trim()).toBe("import '../src/main.js';");
 const regression=await hashes('packages/ui/regression/dist');
 for(const [path,hash] of Object.entries(regression)){
  if(path.endsWith('.js')||path.endsWith('.css'))expect(before[path.replace('/regression/dist/','/dist/')]).toBe(hash);
 }
 expect(Object.keys(regression).some(path=>path.endsWith('.js'))).toBe(true);
});
test('advances society weeks through commands, floors shortage stocks at zero and reports why',async({page})=>{
 const s=makeLife();const inventory=s.city.world.settlements[s.city.world.activeSettlementId!].inventory;inventory.food=0;inventory.wheat=0;
 for(const tile of s.city.tiles)if(tile.building)tile.building.workers=0;
 await page.goto('/');await importLife(page,s);let expected=s;
 for(let week=1;week<=7;week++){
  const resolved=executeCharacterLifeCommand(expected,{type:'END_WEEK',expectedRevision:expected.city.revision,expectedWeek:week});if(!resolved.success)throw Error(resolved.error.message);
  await page.getByTestId('life-end-week').click();await expect(page.getByTestId('society-why')).toContainText('Free residents went short of Food.');
  await expect(page.getByRole('heading',{name:`Week ${week} · Year 1 report`,exact:true})).toBeVisible();await page.getByRole('button',{name:'Plan next week',exact:true}).click();
  const next=executeCharacterLifeCommand(resolved.next,{type:'NEXT_WEEK',expectedRevision:resolved.next.city.revision});if(!next.success)throw Error(next.error.message);expected=next.next;
  const actual=await exportLife(page);expect(actual).toEqual(expected);expect(actual.city.world.week).toBe(week+1);
  const stocks=actual.city.world.settlements[actual.city.world.activeSettlementId!].inventory;expect(stocks.food).toBe(0);for(const n of Object.values(stocks))expect(n).toBeGreaterThanOrEqual(0);
 }
});
