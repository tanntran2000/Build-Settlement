import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { deserializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';

function session(){const r=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});if(!r.success)throw Error(r.error.message);return r.value;}
function step(s:ReturnType<typeof session>,type:'END_WEEK'|'NEXT_WEEK'){
 const r=executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...(type==='END_WEEK'?{expectedWeek:s.city.world.week}:{})});
 if(!r.success)throw Error(r.error.message);return r.next;
}
it('refuses the pinned v3 five-week checkpoint without throwing',()=>{
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v3/life-5-weeks.json',import.meta.url),'utf8');
 const before=JSON.parse(bytes), snapshot=structuredClone(before);
 expect(()=>deserializeCharacterLifeSave(bytes)).not.toThrow();
 expect(deserializeCharacterLifeSave(bytes)).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.'}});
 expect(before).toEqual(snapshot);
});
it('keeps two sessions deep-equal through each of five identical weeks',()=>{
 let a=session(),b=session();expect(a).toEqual(b);
 for(let i=0;i<5;i++)for(const type of ['END_WEEK','NEXT_WEEK'] as const){a=step(a,type);b=step(b,type);expect(a).toEqual(b);}
});
