import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, ORDER_TRIAL, SOCIETY_RULESET } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';

function session(){const r=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});if(!r.success)throw Error(r.error.message);return r.value;}
function step(s:ReturnType<typeof session>,type:'END_WEEK'|'NEXT_WEEK'){
 const r=executeCharacterLifeCommand(s,{type,expectedRevision:s.city.revision,...(type==='END_WEEK'?{expectedWeek:s.city.world.week}:{})});
 if(!r.success)throw Error(r.error.message);return r.next;
}
it('pins five P3 weeks with the v3 fixture shape byte-for-byte and round-trips the checkpoint',()=>{
 let s=session();for(let i=0;i<5;i++){s=step(s,'END_WEEK');s=step(s,'NEXT_WEEK');}
 const oldBytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v2/life-5-weeks.json',import.meta.url),'utf8');
 expect(deserializeCharacterLifeSave(oldBytes)).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.'}});
 // PR A keeps the P3 week unchanged. Adapt only the required v3 shape in memory;
 // PR B owns the new five-week pin once weekly order effects exist.
 const reference=JSON.parse(oldBytes), {rulesetId: oldRuleset, ...society}=reference.state.city.society;
 expect(oldRuleset).toBe('tile-society-02');
 reference.cityRulesetId=SOCIETY_RULESET;
 reference.state.city.society={rulesetId:SOCIETY_RULESET,order:{...ORDER_TRIAL.newGame},...society};
 Object.assign(reference.state.city.society.research.progressMilli,{'watch-patrols':0,'barracks-drill':0});
 const bytes=JSON.stringify(reference);
 expect(serializeCharacterLifeSave(s)).toEqual({success:true,text:bytes});
 const decoded=deserializeCharacterLifeSave(bytes);expect(decoded.success).toBe(true);if(!decoded.success)throw Error(decoded.error.message);
 expect(decoded.state).toEqual(s);expect(serializeCharacterLifeSave(decoded.state)).toEqual({success:true,text:bytes});
});
it('keeps two sessions deep-equal through each of five identical weeks',()=>{
 let a=session(),b=session();expect(a).toEqual(b);
 for(let i=0;i<5;i++)for(const type of ['END_WEEK','NEXT_WEEK'] as const){a=step(a,type);b=step(b,type);expect(a).toEqual(b);}
});
