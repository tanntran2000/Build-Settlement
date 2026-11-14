import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { serializeCharacterLifeSave, deserializeCharacterLifeSave } from '../character-life-save.js';
import { recordsToSession, sessionToRecords, StoreRecordError } from '../session-records.js';
import { executeCharacterLifeCommand } from '@haven/simulation';
function life(){const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return r.value;}
function stocked(){const s=life();Object.assign(s.city.society!.items,{nextItemId:7,inventory:[{id:1,defId:'common-ring'},{id:2,defId:'rare-top'}],consumables:[{id:3,defId:'heal-potion-1'}],storage:[{item:{id:4,defId:'epic-top'},expiresWeek:4}],equipped:{player:{weapon:{id:5,defId:'common-weapon'}},npc_starter_1:{necklace:{id:6,defId:'rare-necklace'}}},materials:{iron:10}});return s;}
it('stores all instance locations in items records and round-trips byte-identically in ascending id order',()=>{
 const s=stocked(),before=serializeCharacterLifeSave(s),rows=sessionToRecords('main',s);
 expect(rows.filter(r=>r.table==='items').map(r=>({id:r.id,value:r.value}))).toEqual([
  {id:'item:1',value:{defId:'common-ring',place:'inventory'}},{id:'item:2',value:{defId:'rare-top',place:'inventory'}},
  {id:'item:3',value:{defId:'heal-potion-1',place:'consumables'}},{id:'item:4',value:{defId:'epic-top',place:'storage:4'}},
  {id:'item:5',value:{defId:'common-weapon',place:'equipped:player:weapon'}},{id:'item:6',value:{defId:'rare-necklace',place:'equipped:npc_starter_1:necklace'}},
 ]);
 const stored=rows.find(r=>r.table==='city')!.value as {society:{items:Record<string,unknown>}};
 expect(Object.keys(stored.society.items)).toEqual(['nextItemId','materials','market','goals']);
 const rowsBefore=structuredClone(rows),decoded=recordsToSession([...rows].reverse());
 expect(before.success).toBe(true);expect(serializeCharacterLifeSave(decoded)).toEqual(before);expect(decoded).toEqual(s);expect(rows).toEqual(rowsBefore);
});
it('rejects unknown place with StoreRecordError ref items:item:1',()=>{
 const rows=sessionToRecords('main',life());rows.push({slotId:'main',id:'item:1',table:'items',schemaVersion:1,value:{defId:'common-ring',place:'void'}});
 let error:unknown;try{recordsToSession(rows);}catch(e){error=e;}
 expect(error).toBeInstanceOf(StoreRecordError);expect((error as StoreRecordError).ref).toBe('items:item:1');
});
it('reads historical v7 records without changing bytes and refuses checkpoint import unchanged',()=>{
 const bytes=readFileSync(new URL('./fixtures/society-v7/life-new-game.json',import.meta.url),'utf8'),s=JSON.parse(bytes).state,before=structuredClone(s);
 expect(recordsToSession(sessionToRecords('main',s))).toEqual(s);expect(s).toEqual(before);
 expect(deserializeCharacterLifeSave(bytes)).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.'}});
 expect(readFileSync(new URL('./fixtures/society-v7/life-new-game.json',import.meta.url),'utf8')).toBe(bytes);
});
it('loads every new v8 Character Life fixture as current and round-trips exact bytes',()=>{
 const root=new URL('./fixtures/society-v8/',import.meta.url),files=readdirSync(root).filter(f=>f.startsWith('life-'));
 expect(files).toHaveLength(9);
 for(const file of files){const bytes=readFileSync(new URL(file,root),'utf8'),loaded=deserializeCharacterLifeSave(bytes);expect(loaded.success).toBe(true);if(!loaded.success)throw Error(loaded.error.message);expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main',loaded.state)))).toEqual({success:true,text:bytes});}
});
it('round-trips equipped character ids containing a colon',()=>{
 const s=stocked();s.npcs[0].character.id='npc:one';s.profiles[0].id='npc:one';
 s.city.society!.items.equipped['npc:one']=s.city.society!.items.equipped.npc_starter_1;delete s.city.society!.items.equipped.npc_starter_1;
 expect(recordsToSession(sessionToRecords('main',s))).toEqual(s);
});
it('keeps save bytes after equipping later instances before earlier ones',()=>{
 let s=life();Object.assign(s.city.society!.items,{nextItemId:4,inventory:[{id:1,defId:'common-ring'},{id:2,defId:'rare-weapon'},{id:3,defId:'common-weapon'}]});
 for(const [itemId,characterId] of [[3,'player'],[2,'npc_starter_1'],[1,'player']] as const){
  const r=executeCharacterLifeCommand(s,{type:'EQUIP_ITEM',itemId,characterId,expectedRevision:s.city.revision});if(!r.success)throw Error(r.error.message);s=r.next;
 }
 expect(serializeCharacterLifeSave(recordsToSession(sessionToRecords('main',s)))).toEqual(serializeCharacterLifeSave(s));
});
