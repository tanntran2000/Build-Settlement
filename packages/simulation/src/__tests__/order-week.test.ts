import { createSocietyState, isTileTrialState, type TileTrialState } from '@haven/core';
import { expect, it } from 'vitest';
import { authorityTaxBps, authorityArrivals, orderFacts, resolveOrderWeek } from '../order-week.js';
import { cityHappiness, societyCounts } from '../society-week.js';
import { executeTileTrialCommand } from '../tile-trial.js';
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
 expect(orderFacts(s,funded)).toEqual({lawSecurity:0,lawCrime:0,lawAuthority:0,standing:50,wallRing:1,watchHouses:[{level:1,slum:false}],barracksWorkers:4,population:100,slumOther:1,corruption:50,desperation:10,tension:0,meanSatisfaction:80,townHallStaffed:false,patrols:false,drill:false});
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

function crimeCity(crime:number, amount=100000) {
 const s=createSocietyState();s.society!.classes.free=3000;
 s.society!.corruption=61;s.society!.desperation=100;
 s.society!.order={security:0,crime:Math.max(0,crime-5),authority:50};
 s.tiles=Array.from({length:20},(_,i)=>({id:`crime-${i}`,terrain:'town',building:{typeId:'slave-quarters',level:1,workers:0,enabled:true}}));
 const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;
 for(const key of ['gold','food','wheat','wood','iron'] as const)stocks[key]=amount;
 for(const key of ['stone','wool','cloth','herbs'] as const)s.society!.stocksMilli[key]=amount;
 s.goodsStock!.amountMilli=amount;s.society!.luxuryStockMilli=amount;
 return s;
}
function crimeWeek(s:TileTrialState){return resolveOrderWeek(s,new Set(s.tiles.map(t=>t.id)),partial(s));}
it.each([[19,0],[20,0],[60,4000],[100,8000]])('steals exactly at drifted Crime %i',(crime,loss)=>{
 const s=crimeCity(crime),r=crimeWeek(s);expect(r.after.crime).toBe(crime);
 const keys=['gold','food','wheat','wood','iron','stone','wool','cloth','herbs','goods','luxury'];
 expect(r.theftMilli).toEqual(loss?Object.fromEntries(keys.map(k=>[k,loss])):{});
 const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;
 expect(Object.values(stocks)).toEqual(Array(5).fill(100000-loss));
 expect(Object.values(s.society!.stocksMilli)).toEqual(Array(4).fill(100000-loss));
 expect(s.goodsStock!.amountMilli).toBe(100000-loss);expect(s.society!.luxuryStockMilli).toBe(100000-loss);
});
it.each([0,1])('omits zero theft for %i milli even at Crime 100',amount=>{
 const s=crimeCity(100,amount),r=crimeWeek(s);expect(r.theftMilli).toEqual({});
 expect(s.goodsStock!.amountMilli).toBe(amount);
});
it.each([[49,1],[50,2],[100,4]])('adds Tension at Crime %i',(crime,added)=>{
 const s=crimeCity(crime);s.society!.tension=10;expect(crimeWeek(s).tensionAdded).toBe(added);expect(s.society!.tension).toBe(10+added);
 const capped=crimeCity(crime);capped.society!.tension=99;expect(crimeWeek(capped).tensionAdded).toBe(1);expect(capped.society!.tension).toBe(100);
});
it.each([[39,0],[40,1],[70,2]])('lowers only citizen satisfaction at Crime %i',(crime,loss)=>{
 const s=crimeCity(crime),r=crimeWeek(s);expect(r.satisfactionLost).toBe(loss);
 for(const key of ['free','makers','luminaries','merchants'] as const)expect(s.society!.satisfaction[key]).toBe(80-loss);
 expect(s.society!.satisfaction.bound).toBe(80);
 const low=crimeCity(crime);low.society!.satisfaction.free=0;crimeWeek(low);expect(low.society!.satisfaction.free).toBe(0);
});
it.each([[0,-2000],[50,0],[100,2000]])('tax modifier at Authority %i',(authority,bps)=>expect(authorityTaxBps(authority)).toBe(bps));
// An admitted resolver result has at least one arrival; zero budget with room is always a refusal.
it.each([[29,1,true,0],[29,5,true,2],[70,1,true,2],[70,3,false,3],[69,3,true,3]])('arrivals Authority %i budget %i room %s',(authority,budget,room,expected)=>expect(authorityArrivals(authority,budget,room)).toBe(expected));
it('steals before storage spoilage in End Week',()=>{
 const s=createSocietyState();s.society!.order.crime=65;s.society!.stocksMilli.stone=100000;
 const r=runTileTrialWeek(s);expect(r.order!.after.crime).toBe(60);expect(r.order!.theftMilli.stone).toBe(4000);
 expect(r.outside!.spoiledMilli.stone).toBe(56000);expect(s.society!.stocksMilli.stone).toBe(40000);
});
it.each([0,50,100])('applies Authority %i after the Counting House with floor rounding',authority=>{
 const s=createSocietyState();s.society!.order.authority=authority;
 tile(s,'spec-2').building={typeId:'counting-house',level:1,workers:2,enabled:true};
 s.society!.classes.free=49;s.society!.classes.merchants.common=20;s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=101;
 expect(isTileTrialState(s)).toBe(true);
 const r=runTileTrialWeek(s),withCH=3333,expected=Math.floor(withCH*(10000+(authority-50)*40)/10000);
 expect(r.taxMilli).toBe(expected);expect(r.order!.taxDeltaMilli).toBe(expected-withCH);expect(r.order!.taxModifierBps).toBe((authority-50)*40);
});
it.each([[29,0],[50,1],[70,2]])('passes Authority %i adjusted budget through society arrivals', (authority,arrivals)=>{
 const s=createSocietyState();s.society!.classes.free=49;
 for(const key of ['makers','luminaries','merchants'] as const)s.society!.classes[key].common=0;
 s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=49;
 s.society!.order.authority=authority;
 tile(s,'spec-1').building!.enabled=false;
 const r=runTileTrialWeek(s);
 expect(r.order!.arrivalsBudgetBefore).toBe(1);expect(r.order!.arrivalsBudgetAfter).toBe(arrivals);
 expect(r.immigration!.arrivals).toBe(arrivals);expect(r.immigration!.populationAfter).toBe(49+arrivals);
});
it('uses exact BigInt theft arithmetic on safe-integer stocks',()=>{
 const s=crimeCity(100,Number.MAX_SAFE_INTEGER),r=crimeWeek(s);
 expect(r.theftMilli.gold).toBe(Number(BigInt(Number.MAX_SAFE_INTEGER)*800n/10000n));
});

it('advances a valid New Game with Authority 0 and zero Gold without negative stocks',()=>{
 const s=createSocietyState();s.society!.order.authority=0;
 const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;stocks.gold=0;
 expect(isTileTrialState(s)).toBe(true);const before=structuredClone(s);
 const result=executeTileTrialCommand(s,{type:'END_WEEK',expectedRevision:s.revision,expectedWeek:s.world.week});
 expect(s).toEqual(before);expect(result.success).toBe(true);
 if(!result.success)throw Error(result.error.message);
 expect(isTileTrialState(result.nextState)).toBe(true);expect(result.nextState.world.week).toBe(2);
 expect(result.report!.taxMilli).toBe(2400);
 expect(result.report!.order).toMatchObject({taxModifierBps:-2000,taxDeltaMilli:-600});
 expect(result.report!.upkeepPaidMilli).toBe(1000);expect(result.report!.unpaidUpkeepMilli).toBe(1000);
 expect(result.report!.after.gold).toBe(400);
 expect(Object.values(result.nextState.world.settlements[s.world.activeSettlementId!].inventory).every(n=>n>=0)).toBe(true);
});
it.each([[0,2908,-728],[50,3636,0],[100,4363,727]])('applies Authority %i after the level-2 Counting House bonus',(authority,tax,delta)=>{
 const s=createSocietyState();s.society!.order.authority=authority;
 s.society!.classes.free=29;s.society!.classes.merchants.common=40;s.world.settlements[s.world.activeSettlementId!].cohorts[0].count=101;
 tile(s,'spec-2').building={typeId:'counting-house',level:2,workers:4,enabled:true};
 expect(isTileTrialState(s)).toBe(true);
 const r=runTileTrialWeek(s);
 // Base 101*30=3030; Counting House gives 3636, then floor(*Authority factor).
 expect(r.taxMilli).toBe(tax);expect(r.order!.taxDeltaMilli).toBe(delta);
 expect(r.order!.taxModifierBps).toBe((authority-50)*40);
});

it('reports final class satisfaction and happiness after Crime 75 drifts to 70',()=>{
 const s=createSocietyState();s.society!.order.crime=75;
 const previous=s.happiness,r=runTileTrialWeek(s);
 expect(r.order!.after.crime).toBe(70);expect(r.order!.satisfactionLost).toBe(2);
 for(const key of ['free','makers','luminaries','merchants'] as const){
  expect(s.society!.satisfaction[key]).toBe(80);
  expect(r.society!.classes[key].satisfactionAfter).toBe(s.society!.satisfaction[key]);
 }
 expect(r.society!.classes.bound.satisfactionAfter).toBe(s.society!.satisfaction.bound);
 const expected=cityHappiness(s.society!.satisfaction,societyCounts(s.society!),previous);
 expect(expected).toBe(80);expect(s.happiness).toBe(expected);expect(r.happinessAfter).toBe(expected);
 expect(r.happinessBefore).toBe(previous);
});
it('preserves class satisfaction and happiness while reporting Tension when Crime starts at 39',()=>{
 const control=createSocietyState(),s=structuredClone(control);s.society!.order.crime=39;
 const baseline=runTileTrialWeek(control),r=runTileTrialWeek(s);
 expect(r.order!.after.crime).toBe(34);expect(r.order!.satisfactionLost).toBe(0);
 expect(s.happiness).toBe(82);expect(s.happiness).toBe(control.happiness);
 expect(r.happinessAfter).toBe(baseline.happinessAfter);expect(r.happinessAfter).toBe(s.happiness);
 expect(r.order!.tensionAdded).toBe(1);expect(s.society!.tension).toBe(1);
 expect(r.society).toEqual({...baseline.society,tensionAfter:1});
});

it.each([[75,70,2],[24,19,0]])('reports final Tension after starting Crime %i drifts to %i', (crime,afterCrime,tension)=>{
 const s=createSocietyState();s.society!.order.crime=crime;const before=structuredClone(s);
 expect(isTileTrialState(s)).toBe(true);
 const result=executeTileTrialCommand(s,{type:'END_WEEK',expectedRevision:s.revision,expectedWeek:s.world.week});
 expect(s).toEqual(before);expect(result.success).toBe(true);if(!result.success)throw Error(result.error.message);
 expect(isTileTrialState(result.nextState)).toBe(true);
 expect(result.report!.order!.after.crime).toBe(afterCrime);expect(result.report!.order!.tensionAdded).toBe(tension);
 expect(result.nextState.society!.tension).toBe(tension);expect(result.report!.society!.tensionAfter).toBe(tension);
 if(crime===24){const control=runTileTrialWeek(createSocietyState());expect(result.report!.society).toEqual(control.society);}
});
