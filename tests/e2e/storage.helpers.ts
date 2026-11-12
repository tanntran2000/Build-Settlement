import { type Page } from '@playwright/test';
import { GAME_DB, recordsToSession, sessionToRecords, serializeCharacterLifeSave, type StoredRecord, type TableName } from '../../packages/persistence/src/index.ts';

export async function readStoredRecords(page: Page): Promise<StoredRecord[]> {
  return page.evaluate(config => new Promise<StoredRecord[]>((resolve,reject) => {
    const request=indexedDB.open(config.name,config.version);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction([...config.stores],'readonly'),rows:StoredRecord[]=[];
      for(const name of config.stores){const read=tx.objectStore(name).getAll();read.onsuccess=()=>rows.push(...read.result);}
      tx.oncomplete=()=>{db.close();resolve(rows.sort((a,b)=>`${a.table}:${a.id}`.localeCompare(`${b.table}:${b.id}`)));};
      tx.onabort=()=>{db.close();reject(tx.error);};
    };
  }),GAME_DB);
}
export async function storedSaveText(page: Page): Promise<string|null> {
  const rows=(await readStoredRecords(page)).filter(r=>r.slotId==='main'&&r.table!=='system');
  if(!rows.some(r=>r.table==='meta'))return null;
  const result=serializeCharacterLifeSave(recordsToSession(rows));
  if(!result.success)throw Error(result.error.message);
  return result.text;
}
export async function writeRecords(page: Page,rows: StoredRecord[]) {
  await page.evaluate(({config,rows})=>new Promise<void>((resolve,reject)=>{
    const request=indexedDB.open(config.name,config.version);request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{const db=request.result,tx=db.transaction([...config.stores],'readwrite');
      for(const name of config.stores.filter(t=>t!=='system'))tx.objectStore(name).clear();
      for(const row of rows)tx.objectStore(row.table).put(row);
      tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error);};
    };
  }),{config:GAME_DB,rows});
}
export async function writeStoredSaveText(page: Page,text: string) {
  let rows:StoredRecord[];
  try {
    const data=JSON.parse(text);rows=sessionToRecords('main',data.state);
    for(const r of rows)r.schemaVersion=data.schemaVersion;
    const meta=rows.find(r=>r.table==='meta')!;Object.assign(meta.value as object,{saveFormat:data.format});
    const city=rows.find(r=>r.table==='city')!.value as {society?:{rulesetId:string}};
    if(city.society)city.society.rulesetId=data.cityRulesetId;
  } catch {
    rows=[{slotId:'main',id:'session',table:'meta',schemaVersion:1,value:{saveFormat:'invalid'}},{slotId:'main',id:'city',table:'city',schemaVersion:1,value:text}];
  }
  await writeRecords(page,rows);return readStoredRecords(page);
}
export async function clearStored(page: Page){await writeRecords(page,[]);}
export async function writeRawRecord(page: Page,table: TableName,id: string,value: unknown) {
  const rows=(await readStoredRecords(page)).filter(r=>r.table!=='system');
  const record=rows.find(r=>r.table===table&&r.id===id);if(!record)throw Error('Missing record '+table+':'+id);
  record.value=value;await writeRecords(page,rows);
}
export async function storeMarks(page: Page){return page.evaluate(()=>performance.getEntriesByType('mark').map(m=>m.name).filter(n=>/^haven\.store\.(read|write|clear)$/.test(n)));}
export async function resetStoreMarks(page: Page){await page.evaluate(()=>{for(const name of ['read','write','clear'])performance.clearMarks('haven.store.'+name);});}
export async function injectWriteAbort(page: Page,kind='abort') {
  await page.evaluate(kind=>{
    const original=IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction=function(...args: Parameters<typeof original>){
      if(args[1]==='readwrite'&&kind==='throw')throw Error('raw/private/storage');
      const tx=original.apply(this,args);if(args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx;
    };
  },kind);
}
