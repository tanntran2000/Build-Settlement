import {expect,type Page} from '@playwright/test';
import type {CharacterLifeSessionState} from '../../packages/core/src/index.ts';
import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
import {serializeCharacterLifeSave} from '../../packages/persistence/src/character-life-save.ts';
import {expectReport,exportLife,go,importLife,makeLife} from './character-life-navigation.helpers.ts';
export function fundedLife(){const s=makeLife();Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=1;return s;}
export async function boot(page:Page,s=makeLife()){await page.goto('/');await importLife(page,s);return s;}
export async function encoded(page:Page){const s=await exportLife(page);const r=serializeCharacterLifeSave(s);if(!r.success)throw Error(r.error.message);await go(page,'city');return r.text;}
export async function put(page:Page,text:string){if(await page.getByTestId('life-shell').count())await go(page,'session');await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles({name:'life.json',mimeType:'application/json',buffer:Buffer.from(text)});}
export const notice=(page:Page)=>page.locator('[aria-label="Planning checkpoints"] [role="status"]');
export async function act(page:Page,state:CharacterLifeSessionState,type:string,fields:Record<string,unknown>={}){
 const result=executeCharacterLifeCommand(state,{type,expectedRevision:state.city.revision,...fields});
 if(type==='NEXT_WEEK'){await go(page,'reports');await page.getByRole('button',{name:'Plan next week',exact:true}).click();}
 else{await go(page,'city');
  if(fields.tileId)await page.getByTestId(`trial-tile-${fields.tileId}`).click();
  if(type==='BUILD'||type==='REPLACE'){await page.getByLabel('Building type').selectOption(String(fields.typeId));await page.getByRole('button',{name:type==='BUILD'?'Build':'Replace',exact:true}).click();}
  else if(type==='SET_WORKERS'){await page.getByLabel('Assigned workers (WF)',{exact:true}).fill(String(fields.workers));await page.getByRole('button',{name:'Assign workers',exact:true}).click();}
  else if(type==='SET_ENABLED')await page.getByRole('button',{name:fields.enabled?'Resume':'Pause',exact:true}).click();
  else if(type==='UPGRADE')await page.getByRole('button',{name:'Upgrade',exact:true}).click();
  else if(type==='END_WEEK')await page.getByTestId('life-end-week').click();
  else throw Error(`Unsupported UI test action ${type}`);
 }
 if(!result.success){await expect(page.getByRole('region',{name:'Manage tile',exact:true}).getByRole('alert')).toHaveText(result.error.message);expect(await exportLife(page)).toEqual(state);await go(page,'city');return state;}
 if(result.report){await expectReport(page,result.report);return result.next;}
 expect(await exportLife(page)).toEqual(result.next);await go(page,'city');return result.next;
}
export async function week(page:Page,state:CharacterLifeSessionState){state=await act(page,state,'END_WEEK',{expectedWeek:state.city.world.week});return act(page,state,'NEXT_WEEK');}
