import { createSocietyState, type TileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { orderFacts, resolveOrderWeek } from '../order-week.js';
import { runTileTrialWeek } from '../tile-trial-week.js';

const tile = (s: TileTrialState, id: string) => s.tiles.find(t => t.id === id)!;
const partial = (s: TileTrialState) => ({ before: {...s.society!.order}, taxModifierBps:0, taxDeltaMilli:0, arrivalsBudgetBefore:0, arrivalsBudgetAfter:0 });
function built() {
 const s=createSocietyState();
 tile(s,'service-1').building={typeId:'watch-house',level:1,workers:2,enabled:true};
 tile(s,'service-2').building={typeId:'military-barracks',level:1,workers:4,enabled:true};
 tile(s,'slum-1').building={typeId:'slave-quarters',level:1,workers:0,enabled:true};
 s.society!.desperation=10;
 return s;
}
it('projects the worked example and drifts sequentially toward its targets',()=>{
 const s=built(), funded=new Set(['service-1','service-2','slum-1']);
 expect(orderFacts(s,funded)).toEqual({wallRing:1,watchHouses:[{level:1,slum:false}],barracksWorkers:4,population:100,slumOther:1,corruption:50,desperation:10,tension:0,meanSatisfaction:80,townHallStaffed:false,patrols:false,drill:false});
 const r=resolveOrderWeek(s,funded,partial(s));
 expect(r.before).toEqual({security:30,crime:10,authority:50});
 expect(r.targets).toEqual({security:25,crime:5,authority:40});
 expect(r.after).toEqual({security:25,crime:5,authority:47});
 expect(s.society!.order).toEqual(r.after);
});
it('excludes a Slum Watch House from other Slum buildings',()=>{
 const s=createSocietyState();
 tile(s,'slum-1').building={typeId:'watch-house',level:1,workers:2,enabled:true};
 expect(orderFacts(s,new Set(['slum-1']))).toMatchObject({watchHouses:[{level:1,slum:true}],slumOther:0});
});
it('counts only enabled funded and fully staffed facilities except Barracks workers',()=>{
 const s=built(); tile(s,'service-1').building!.workers=1; tile(s,'service-2').building!.workers=3;
 tile(s,'spec-2').building={typeId:'town-hall',level:1,workers:0,enabled:true};
 const ids=new Set(['service-1','service-2','spec-2']);
 expect(orderFacts(s,ids)).toMatchObject({watchHouses:[],barracksWorkers:3,townHallStaffed:false});
 expect(orderFacts(s,new Set())).toMatchObject({watchHouses:[],barracksWorkers:0});
 tile(s,'service-2').building!.enabled=false;
 expect(orderFacts(s,ids).barracksWorkers).toBe(0);
});
it('reports consistent before targets and after for End Week',()=>{
 const s=createSocietyState(), r=runTileTrialWeek(s);
 expect(r.order!.before).toEqual({security:30,crime:10,authority:50});
 expect(r.order!.after).toEqual({security:25,crime:5,authority:47});
 expect(r.order!.targets.security).toBe(10);
 expect(s.society!.order).toEqual(r.order!.after);
});
it('uses research completed by finishOutsideLand in this week targets',()=>{
 const s=built(); tile(s,'service-2').building={typeId:'library',level:2,workers:2,enabled:true};
 s.society!.research.topic='watch-patrols'; s.society!.research.paid=['watch-patrols']; s.society!.research.progressMilli['watch-patrols']=4000;
 const r=runTileTrialWeek(s);
 expect(r.outside!.researchCompleted).toContain('watch-patrols');
 expect(r.order!.targets.security).toBe(22);
});
