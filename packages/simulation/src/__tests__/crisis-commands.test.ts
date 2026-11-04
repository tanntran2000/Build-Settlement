import { expect,it } from 'vitest';
import { cardId, createSocietyState,createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,type CrisisCardKind,type CardOption } from '@haven/core';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { cityHappiness,societyCounts } from '../society-week.js';
function city(kind:CrisisCardKind='demand'){
 const s=createSocietyState();s.society!.crisis.stage=kind;s.society!.pendingCard={id:cardId('crisis',kind,1),source:'crisis',kind,week:1};s.society!.tension=60;return s;
}
function choose(s:ReturnType<typeof city>,option:CardOption){return executeTileTrialCommand(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:s.revision,cardId:s.society!.pendingCard?.id,option});}
function reject(s:ReturnType<typeof city>,command:unknown,code:string,message?:string){const before=structuredClone(s);expect(executeTileTrialCommand(s,command)).toMatchObject({success:false,error:{code,...(message?{message}:{})}});expect(s).toEqual(before);}
it.each([['demand',2000,40,10],['protest',4000,55,15],['rebellion',6000,70,20]] as const)('applies all %s effects and boundaries',(kind,cost,security,delta)=>{
 const s=city(kind),inv=s.world.settlements[s.world.activeSettlementId!].inventory;inv.gold=cost;
 const pay=choose(s,'pay');expect(pay.success).toBe(true);if(!pay.success)throw Error(pay.error.message);
 expect(pay.nextState.world.settlements[s.world.activeSettlementId!].inventory.gold).toBe(0);expect(pay.nextState.society!.tension).toBe(60-delta);
 expect(pay.nextState.society!.crisis.lastChoice).toEqual({stage:kind,option:'pay',goldMilli:cost});expect(pay.nextState.society!.pendingCard).toBeNull();expect(pay.nextState.revision).toBe(1);
 reject(pay.nextState,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:cardId('crisis',kind,1),option:'pay'},'STALE_COMMAND');
 reject(pay.nextState,{type:'CHOOSE_CARD_OPTION',expectedRevision:1,cardId:cardId('crisis',kind,1),option:'pay'},'UNKNOWN_CARD');
 inv.gold=cost-1;reject(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:s.society!.pendingCard!.id,option:'pay'},'OPTION_UNAVAILABLE',`Needs ${cost/1000} Gold.`);
 s.society!.order.security=security;
 s.society!.satisfaction.bound=2;
 const force=choose(s,'force');expect(force.success).toBe(true);if(!force.success)throw Error(force.error.message);
 expect(force.nextState.society!.tension).toBe(60-delta);expect(force.nextState.society!.order).toEqual({security,crime:15,authority:55});
 expect(force.nextState.society!.satisfaction).toEqual({free:75,makers:75,luminaries:75,merchants:75,bound:0});
 expect(force.nextState.happiness).toBe(cityHappiness(force.nextState.society!.satisfaction,societyCounts(force.nextState.society!),s.happiness));
 s.society!.order.security=security-1;reject(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:s.society!.pendingCard!.id,option:'force'},'OPTION_UNAVAILABLE',`Needs Security ${security}.`);
 inv.gold=cost;s.society!.tension=1;const clamp=choose(s,'pay');expect(clamp.success&&clamp.nextState.society!.tension).toBe(0);
});
it('promises once and clamps Refuse',()=>{
 const s=city();const r=choose(s,'promise');expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.nextState.society!.crisis.promise).toEqual({stage:'demand',weeksLeft:2});
 r.nextState.society!.pendingCard=s.society!.pendingCard;
 reject(r.nextState,{type:'CHOOSE_CARD_OPTION',expectedRevision:1,cardId:s.society!.pendingCard!.id,option:'promise'},'OPTION_UNAVAILABLE','A promise is already pending.');
 s.society!.tension=99;const refused=choose(s,'refuse');expect(refused.success&&refused.nextState.society!.tension).toBe(100);
});
it.each(['planning','report'] as const)('answers during %s and locks End Week first',phase=>{
 const s=city();s.phase=phase;
 reject(s,{type:'END_WEEK',expectedRevision:0,expectedWeek:1},'CARD_PENDING','Answer the crisis first.');
 reject(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:'wrong',option:'pay'},'UNKNOWN_CARD');
 reject(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:s.society!.pendingCard!.id,option:'other'},'UNKNOWN_OPTION');
 const r=choose(s,'refuse');expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 let next=r.nextState;if(phase==='report'){const plan=executeTileTrialCommand(next,{type:'NEXT_WEEK',expectedRevision:next.revision});if(!plan.success)throw Error(plan.error.message);next=plan.nextState;}
 expect(executeTileTrialCommand(next,{type:'END_WEEK',expectedRevision:next.revision,expectedWeek:1}).success).toBe(true);
});
it('allows NEXT_WEEK before answering a report card',()=>{const s=city();s.phase='report';const r=executeTileTrialCommand(s,{type:'NEXT_WEEK',expectedRevision:0});if(!r.success)throw Error(r.error.message);expect(choose(r.nextState,'refuse').success).toBe(true);});
it('clamps Force scores and preserves the original on success',()=>{
 const s=city();s.society!.order={security:100,crime:99,authority:99};s.society!.tension=1;
 const before=structuredClone(s),r=choose(s,'force');expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);
 expect(r.nextState.society!.order).toEqual({security:100,crime:100,authority:100});expect(r.nextState.society!.tension).toBe(0);expect(s).toEqual(before);
});
it('refuses a choice when no card waits',()=>{
 const s=createSocietyState();reject(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:'crisis-demand-w1',option:'pay'},'UNKNOWN_CARD','This card is no longer waiting for an answer.');
});
it('routes Life choices and refuses all commands in a fallen session',()=>{
 const made=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});if(!made.success)throw Error(made.error.message);const s=made.value;s.city=city();
 expect(executeCharacterLifeCommand(s,{type:'CHOOSE_CARD_OPTION',expectedRevision:0,cardId:'crisis-demand-w1',option:'refuse'}).success).toBe(true);
 s.city.society!.crisis.stage='fallen';s.city.society!.crisis.fallCause='rebellion';s.city.society!.pendingCard=null;
 for(const command of [null,{type:'ASSIGN_NPC'},{type:'NEXT_WEEK'},{type:'END_WEEK'},{type:'CHOOSE_CARD_OPTION'}]){
  const before=structuredClone(s);expect(executeCharacterLifeCommand(s,command)).toMatchObject({success:false,error:{code:'CITY_FALLEN',message:'The city has fallen. Start a New Game.'}});expect(s).toEqual(before);
  reject(s.city,command,'CITY_FALLEN');
 }
});
