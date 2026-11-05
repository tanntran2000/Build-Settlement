import { LAW_CATALOG, LAW_TRIAL, type LawId, type LawWeekReport, type TileTrialState } from '@haven/core';
import { cityHappiness, societyCounts } from './society-week.js';
import { trialSafe } from './tile-trial-week.js';

export function resolveLawGold(s:TileTrialState,stocks:{gold:number}):Omit<LawWeekReport,'inForce'|'promise'> & {applied:LawId[]} {
 const applied:LawId[]=[],unfunded:LawId[]=[],costs:LawWeekReport['costs']=[];
 let incomeMilli=0;
 for(const lawId of s.society!.laws.active){
  const effect=LAW_CATALOG[lawId].effect;
  incomeMilli=trialSafe(incomeMilli+(effect.incomeMilli??0));
  const cost=effect.costMilli??0;
  if(stocks.gold<cost){unfunded.push(lawId);continue;}
  stocks.gold=trialSafe(stocks.gold-cost);applied.push(lawId);
  if(cost>0)costs.push({lawId,goldMilli:cost});
 }
 return {applied,unfunded,costs,incomeMilli};
}
export function resolveLawPromiseWeek(s:TileTrialState):LawWeekReport['promise'] {
 const society=s.society!,promise=society.laws.promise;
 if(!promise)return null;
 promise.weeksLeft--;
 if(promise.weeksLeft>0)return null;
 const outcome=society.satisfaction[promise.group]>=promise.satisfactionAtVote?'kept':'broken';
 const clamp=(n:number)=>Math.max(0,Math.min(100,n));
 if(outcome==='kept')society.order.authority=clamp(society.order.authority+LAW_TRIAL.promise.keptAuthority);
 else{
  society.satisfaction[promise.group]=clamp(society.satisfaction[promise.group]+LAW_TRIAL.promise.brokenSatisfaction);
  society.tension=clamp(society.tension+LAW_TRIAL.promise.brokenTension);
  s.happiness=cityHappiness(society.satisfaction,societyCounts(society),s.happiness);
 }
 society.laws.promise=null;
 return {group:promise.group,lawId:promise.lawId,outcome};
}
