import { cardId, CRISIS_TRIAL as C, type CrisisReport, type CrisisStage, type TileTrialState } from '@haven/core';
import { trialSafe } from './tile-trial-week.js';
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function resolveCrisisWeek(s: TileTrialState, f: { foodDemandMilli: number; foodConsumedMilli: number }): CrisisReport {
 const society=s.society!; const c=society.crisis;
 const stageBefore=c.stage, tensionBefore=society.tension;
 const hungry=f.foodDemandMilli>0 && f.foodConsumedMilli<f.foodDemandMilli && s.happiness<C.happinessBelow;
 c.hungerStreak=hungry?trialSafe(c.hungerStreak+1):0;
 c.calmStreak=hungry?0:trialSafe(c.calmStreak+1);
 let promise: CrisisReport['promise']=null;
 if(c.promise){
  const {stage,weeksLeft}=c.promise; const before=society.tension, authority=society.order.authority;
  const result=hungry?'broken':weeksLeft===1?'kept':'pending';
  if(result==='pending')c.promise.weeksLeft=1;
  else {
   society.tension=clamp(before+(hungry?C.promise.brokenTension:C.promise.kept[stage]));
   society.order.authority=clamp(authority+(hungry?C.promise.brokenAuthority:C.promise.keptAuthority));c.promise=null;
  }
  promise={stage,result,tensionDelta:society.tension-before,authorityDelta:society.order.authority-authority};
 }
 c.weeksInStage=trialSafe(c.weeksInStage+1);
 let next:CrisisStage=c.stage; let up=false;
 if(c.stage==='none' && (society.tension>=C.warningTension||hungry))next='warning';
 else if(c.stage==='warning' && c.hungerStreak>=C.demandHungerWeeks){next='demand';up=true;}
 else if(c.stage==='demand' && c.weeksInStage>=C.protest.minWeeks && hungry && society.tension>=C.protest.tension){next='protest';up=true;}
 else if(c.stage==='protest' && c.weeksInStage>=C.rebellion.minWeeks && hungry && society.tension>=C.rebellion.tension){next='rebellion';up=true;}
 else if(c.stage==='rebellion' && c.weeksInStage===C.finalWeeks){next=hungry?'fallen':'protest';}
 else if(c.calmStreak>=C.calmWeeksToStepDown){
  if(c.stage==='rebellion')next='protest';else if(c.stage==='protest')next='demand';else if(c.stage==='demand')next='warning';
  else if(c.stage==='warning' && society.tension<C.warningTension)next='none';
 }
 let cardOpened:CrisisReport['cardOpened']=null;
 if(next!==c.stage){
  if(!up && stageBefore!=='none' && next!=='fallen')c.calmStreak=0;
  c.stage=next;if(next==='fallen')c.fallCause='rebellion';c.weeksInStage=0;society.pendingCard=null;
  if(up && (next==='demand'||next==='protest'||next==='rebellion')){
   cardOpened=next;society.pendingCard={id:cardId('crisis',next,s.world.week),source:'crisis',kind:next,week:s.world.week};
  }
 }
 const lastChoice=c.lastChoice;c.lastChoice=null;
 return {stageBefore,stageAfter:c.stage,hungry,hungerStreak:c.hungerStreak,calmStreak:c.calmStreak,weeksInStage:c.weeksInStage,promise,cardOpened,lastChoice,tensionBefore,tensionAfter:society.tension};
}
