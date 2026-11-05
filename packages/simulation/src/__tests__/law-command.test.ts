import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, createSocietyState, LAW_IDS, previewLawVote, type TileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';

function city() {
 const s=createSocietyState();
 s.tiles.find(t=>t.id==='service-1')!.building={typeId:'town-hall',level:1,workers:1,enabled:true};
 return s;
}
function act(s:TileTrialState,fields:Record<string,unknown>) {
 return executeTileTrialCommand(s,{expectedRevision:s.revision,...fields});
}
it('enacts a passing vote atomically and consumes the weekly vote',()=>{
 const s=city(),before=structuredClone(s),r=act(s,{type:'ENACT_LAW',lawId:'poor-relief',lobby:{}});
 expect(s).toEqual(before);expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.nextState.society!.laws).toEqual({active:['poor-relief'],votedWeek:1,repealedUntil:{},promise:null});
 expect(r.nextState.revision).toBe(s.revision+1);
 expect(act(r.nextState,{type:'ENACT_LAW',lawId:'watch-levy',lobby:{}})).toMatchObject({success:false,error:{code:'VOTE_USED'}});
});
it('preserves Happiness when a passing vote has no Force lobby',()=>{
 const s=city();s.happiness=1;
 const r=act(s,{type:'ENACT_LAW',lawId:'poor-relief',lobby:{}});
 expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.nextState.happiness).toBe(1);
});
it.each([[],null,{bound:'pay'},{free:'bribe'},{free:'pay'}])('refuses hostile lobby %j without mutation',lobby=>{
 const s=city(),before=structuredClone(s);
 expect(act(s,{type:'ENACT_LAW',lawId:'poor-relief',lobby})).toMatchObject({success:false,error:{code:'LOBBY_INVALID'}});
 expect(s).toEqual(before);
});
it.each([11000,10999])('handles exact Pay affordability at %i milli',gold=>{
 const s=city();s.world.settlements[s.world.activeSettlementId!].inventory.gold=gold;
 const r=act(s,{type:'ENACT_LAW',lawId:'curfew',lobby:{free:'pay'}});
 expect(r.success).toBe(gold===11000);
 if(r.success)expect(r.nextState.world.settlements[s.world.activeSettlementId!].inventory.gold).toBe(0);
 else expect(r.error).toEqual({code:'OPTION_UNAVAILABLE',message:'Needs 11 Gold.'});
});
it('applies Force, opens a promise and recomputes Happiness',()=>{
 const s=city();s.society!.order.security=40;
 const r=act(s,{type:'ENACT_LAW',lawId:'curfew',lobby:{free:'force',makers:'promise'}});
 expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.nextState.society!.satisfaction.free).toBe(70);expect(r.nextState.society!.tension).toBe(5);
 expect(r.nextState.society!.standing).toBe(47);expect(r.nextState.happiness).toBe(74.5);
 expect(r.nextState.society!.laws.promise).toEqual({group:'makers',lawId:'curfew',satisfactionAtVote:80,weeksLeft:4});
});
it('repeals without consuming a vote and preserves its promise',()=>{
 const s=city();s.world.week=10;s.society!.laws.active=['poor-relief'];s.society!.order.authority=3;
 s.society!.laws.promise={group:'free',lawId:'poor-relief',satisfactionAtVote:80,weeksLeft:4};
 const r=act(s,{type:'REPEAL_LAW',lawId:'poor-relief'});expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.nextState.society!.order.authority).toBe(0);expect(r.nextState.society!.laws.promise).toEqual(s.society!.laws.promise);
 expect(r.nextState.society!.laws.votedWeek).toBeNull();
 for(const week of [10,11,12,13,14]){
  const next=structuredClone(r.nextState);next.world.week=week;
  const vote=act(next,{type:'ENACT_LAW',lawId:'poor-relief',lobby:{}});
  expect(vote.success).toBe(week===14);
  if(!vote.success)expect(vote.error.code).toBe('LAW_COOLDOWN');
 }
});
it.each(LAW_IDS)('matches preview for %s and every lobby combination',lawId=>{
 const options=[undefined,'pay','promise','force'];
 for(const free of options)for(const makers of options)for(const luminaries of options)for(const merchants of options){
  const s=city();s.society!.order.security=40;
  const lobby=Object.fromEntries(Object.entries({free,makers,luminaries,merchants}).filter(([,v])=>v!==undefined));
  const preview=previewLawVote(s,lawId,lobby),before=structuredClone(s),r=act(s,{type:'ENACT_LAW',lawId,lobby});
  expect(r.success).toBe(preview.refusal===null);expect(s).toEqual(before);
  if(!r.success)expect(r.error).toEqual(preview.refusal);
  else expect(before.world.settlements[s.world.activeSettlementId!].inventory.gold-r.nextState.world.settlements[s.world.activeSettlementId!].inventory.gold).toBe(preview.goldMilli);
 }
});
it.each(['ENACT_LAW','REPEAL_LAW'])('routes %s through Character Life',type=>{
 const created=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});
 if(!created.success)throw Error(created.error.message);
 const session=created.value;
 session.city.tiles.find(t=>t.id==='service-1')!.building={typeId:'town-hall',level:1,workers:1,enabled:true};
 if(type==='REPEAL_LAW')session.city.society!.laws.active=['poor-relief'];
 const result=executeCharacterLifeCommand(session,{type,lawId:'poor-relief',...(type==='ENACT_LAW'?{lobby:{}}:{}),expectedRevision:session.city.revision});
 expect(result.success).toBe(true);
});
it.each(['ENACT_LAW','REPEAL_LAW'])('preserves state on global and unknown-law refusals for %s',type=>{
 const fields={type,lawId:'unknown',...(type==='ENACT_LAW'?{lobby:{}}:{})};
 for(const [setup,code] of [
  [(s:TileTrialState)=>{s.phase='report';},'FORBIDDEN'],
  [(_s:TileTrialState)=>{},'UNKNOWN_LAW'],
 ] as const){
  const s=city();setup(s);const before=structuredClone(s);
  expect(act(s,fields)).toMatchObject({success:false,error:{code}});expect(s).toEqual(before);
 }
 const s=city(),before=structuredClone(s);
 expect(executeTileTrialCommand(s,{...fields,expectedRevision:s.revision+1})).toMatchObject({success:false,error:{code:'STALE_COMMAND'}});
 expect(s).toEqual(before);
});
it('refuses an inactive repeal without mutation',()=>{
 const s=city(),before=structuredClone(s);
 expect(act(s,{type:'REPEAL_LAW',lawId:'poor-relief'})).toMatchObject({success:false,error:{code:'LAW_INACTIVE'}});
 expect(s).toEqual(before);
});
