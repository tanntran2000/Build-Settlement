import { expect, it } from 'vitest';
import { createSocietyState, type CrisisStage } from '@haven/core';
import { resolveCrisisWeek } from '../crisis-week.js';
const hungry = { foodDemandMilli: 100, foodConsumedMilli: 0 };
const calm = { foodDemandMilli: 100, foodConsumedMilli: 100 };
function city(stage: CrisisStage = 'none', tension = 0) {
 const s = createSocietyState(); s.happiness = 29;
 s.society!.crisis.stage = stage; s.society!.tension = tension; return s;
}
it.each([[29,100,0,true],[30,100,0,false],[29,0,0,false]] as const)('hungry boundary %s/%s/%s', (h,d,c,want) => {
 const s=city();s.happiness=h;expect(resolveCrisisWeek(s,{foodDemandMilli:d,foodConsumedMilli:c}).hungry).toBe(want);
});
it.each([[49,'none'],[50,'warning']] as const)('warning tension %s', (t,stage)=>{
 expect(resolveCrisisWeek(city('none',t),calm).stageAfter).toBe(stage);
});
it('opens only one stage and uses the current planning week',()=>{
 const s=city('warning',95);s.society!.crisis.hungerStreak=2;s.world.week=8;
 expect(resolveCrisisWeek(s,hungry)).toMatchObject({stageAfter:'demand',weeksInStage:0,cardOpened:'demand'});
 expect(s.society!.pendingCard).toEqual({id:'crisis-demand-w8',source:'crisis',kind:'demand',week:8});
});
it.each([['demand',74,'demand'],['demand',75,'protest'],['protest',89,'protest'],['protest',90,'rebellion']] as const)('stage boundary %s %s',(stage,t,after)=>{
 const s=city(stage,t);s.society!.crisis.weeksInStage=1;expect(resolveCrisisWeek(s,hungry).stageAfter).toBe(after);
});
it('requires two full weeks after Demand opens',()=>{
 const s=city('demand',95);expect(resolveCrisisWeek(s,hungry).stageAfter).toBe('demand');
 expect(resolveCrisisWeek(s,hungry).stageAfter).toBe('protest');
});
it.each([['rebellion','protest'],['protest','demand'],['demand','warning'],['warning','none']] as const)('steps down %s without a card',(stage,after)=>{
 const s=city(stage);s.society!.crisis.calmStreak=1;expect(resolveCrisisWeek(s,calm)).toMatchObject({stageAfter:after,calmStreak:0,cardOpened:null});
});
it('warning stays at tension 50 and hunger starts warning at zero',()=>{
 const s=city('warning',50);s.society!.crisis.calmStreak=1;expect(resolveCrisisWeek(s,calm).stageAfter).toBe('warning');
 expect(resolveCrisisWeek(city(),hungry).stageAfter).toBe('warning');
 const w=city('warning');w.society!.crisis.hungerStreak=1;expect(resolveCrisisWeek(w,hungry).stageAfter).toBe('warning');
});
it.each([[true,'fallen'],[false,'protest']] as const)('last rebellion week hungry=%s',(h,after)=>{
 const s=city('rebellion');s.society!.crisis.weeksInStage=3;
 expect(resolveCrisisWeek(s,h?hungry:calm).stageAfter).toBe(after);expect(s.society!.pendingCard).toBeNull();expect(s.society!.crisis.fallCause).toBe(h?'rebellion':null);
});
it.each(['demand','protest','rebellion'] as const)('keeps the %s promise after two calm weeks',stage=>{
 const s=city(stage,80);s.society!.crisis.promise={stage,weeksLeft:2};
 expect(resolveCrisisWeek(s,calm).promise?.result).toBe('pending');
 const r=resolveCrisisWeek(s,calm);expect(r.promise).toEqual({stage,result:'kept',tensionDelta:stage==='demand'?-15:stage==='protest'?-20:-25,authorityDelta:5});
 expect(s.society!.crisis.promise).toBeNull();expect(s.society!.order.authority).toBe(55);
});
it('breaks promises and consumes lastChoice into the report',()=>{
 const s=city('demand',95);s.society!.order.authority=5;s.society!.crisis.promise={stage:'demand',weeksLeft:2};
 const choice={stage:'demand',option:'pay',goldMilli:2000} as const;s.society!.crisis.lastChoice=choice;
 expect(resolveCrisisWeek(s,hungry)).toMatchObject({promise:{result:'broken',tensionDelta:5,authorityDelta:-5},lastChoice:choice,tensionAfter:100});
 expect(s.society!.crisis.lastChoice).toBeNull();expect(s.society!.order.authority).toBe(0);
});

import { runTileTrialWeek } from '../tile-trial-week.js';
it('syncs promise effects into the society and order reports',()=>{
 const s=city();s.society!.crisis.promise={stage:'demand',weeksLeft:1};
 const r=runTileTrialWeek(s);expect(r.crisis?.promise?.result).toBe('kept');
 expect(r.society!.tensionAfter).toBe(s.society!.tension);expect(r.order!.after.authority).toBe(s.society!.order.authority);
});
it('has identical crisis results through five fed weeks',()=>{
 const a=city(),b=structuredClone(a);
 for(let i=0;i<5;i++){
  expect(runTileTrialWeek(a)).toEqual(runTileTrialWeek(b));expect(a).toEqual(b);
  expect(a.society!.crisis.stage).toBe('none');
 }
});
