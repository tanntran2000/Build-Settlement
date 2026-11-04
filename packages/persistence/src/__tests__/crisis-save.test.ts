import {expect,it} from 'vitest';
import {createCharacterLifeSession,DEFAULT_PLAYER_DRAFT} from '@haven/core';
import {serializeCharacterLifeSave,deserializeCharacterLifeSave} from '../index.js';
function session(){const r=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});if(!r.success)throw Error(r.error.message);return r.value;}
it('round-trips a pending card, promise and last choice without losing data',()=>{
 const s=session(),soc=s.city.society!;
 soc.crisis={fallCause:null,stage:'demand',weeksInStage:1,hungerStreak:3,calmStreak:0,promise:{stage:'demand',weeksLeft:2},lastChoice:{stage:'demand',option:'pay',goldMilli:2000}};
 soc.pendingCard={id:'crisis-demand-w1',source:'crisis',kind:'demand',week:1};
 const encoded=serializeCharacterLifeSave(s);if(!encoded.success)throw Error(encoded.error.message);
 expect(deserializeCharacterLifeSave(encoded.text)).toEqual({success:true,state:s});
});
it.each(['mismatch','warning','fallen','promise','negative','fractional','option'])('refuses edited crisis %s without changing the save',edit=>{
 const s=session(),soc=s.city.society!;soc.crisis.stage='demand';soc.pendingCard={id:'crisis-demand-w1',source:'crisis',kind:'demand',week:1};
 const encoded=serializeCharacterLifeSave(s);if(!encoded.success)throw Error(encoded.error.message);
 const envelope=JSON.parse(encoded.text),bad=envelope.state.city.society;
 if(edit==='mismatch')bad.pendingCard.kind='protest';
 if(edit==='warning'||edit==='fallen')bad.crisis.stage=edit;
 if(edit==='promise')bad.crisis.promise={stage:'demand',weeksLeft:3};
 if(edit==='negative')bad.crisis.hungerStreak=-1;
 if(edit==='fractional')bad.crisis.calmStreak=0.5;
 if(edit==='option')bad.crisis.lastChoice={stage:'demand',option:'other',goldMilli:0};
 const before=structuredClone(envelope),bytes=JSON.stringify(envelope);
 expect(()=>deserializeCharacterLifeSave(bytes)).not.toThrow();
 expect(deserializeCharacterLifeSave(bytes)).toMatchObject({success:false,error:{code:'INVALID_SAVE_STATE'}});
 expect(serializeCharacterLifeSave(envelope.state)).toMatchObject({success:false,error:{code:'INVALID_SAVE_STATE'}});
 expect(envelope).toEqual(before);expect(deserializeCharacterLifeSave(encoded.text).success).toBe(true);
});
