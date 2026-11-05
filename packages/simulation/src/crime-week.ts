import { societySoldiers, soldierTiles, idleWatchHouse, CRIME_TRIAL as C, crimeChancePercent, crimeSeverity, crimeRandom, societyPopulation, type CrimeEventReport, type TileTrialState } from '@haven/core';
import { releaseSocietyWorkers } from './society-facilities.js';

export function resolveCrimeWeek(s:TileTrialState, fundedTileIds:ReadonlySet<string>, rng=crimeRandom(s.world.worldMetadata.worldSeed,s.world.week-1)):CrimeEventReport {
 const society=s.society!,order=society.order,standingBefore=society.standing;
 const clamp=(n:number)=>Math.max(0,Math.min(100,n));
 society.standing=clamp(standingBefore+Math.sign(C.standing.newGame-standingBefore)*C.standing.drift);
 const report:CrimeEventReport={standingBefore,standingAfter:society.standing,chancePercent:crimeChancePercent(order.crime,idleWatchHouse(s,fundedTileIds)),event:null,lordHealthLoss:0};
 if(rng()*100>=report.chancePercent)return report;
 const barracks=soldierTiles(s);
 const soldiers=societySoldiers(s);
 const available=(['robbery','smear','raid','assassination'] as const).filter(kind=>kind==='raid'?soldiers>0:kind==='assassination'?order.crime>=C.assassinationMinCrime:true);
 let pick=rng()*available.reduce((sum,kind)=>sum+C.weights[kind],0);
 const kind=available.find(kind=>{pick-=C.weights[kind];return pick<0;})!;
 const severity=crimeSeverity(order.crime),event:NonNullable<CrimeEventReport['event']>={kind,severity};report.event=event;
 if(kind==='robbery'){
  const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;
  const targets: {key:NonNullable<typeof event.target>;get:()=>number;set:(n:number)=>void}[]=[];
  for(const key of ['gold','food','wheat','wood','iron'] as const)targets.push({key,get:()=>stocks[key],set:n=>{stocks[key]=n;}});
  for(const key of ['stone','wool','cloth','herbs'] as const)targets.push({key,get:()=>society.stocksMilli[key],set:n=>{society.stocksMilli[key]=n;}});
  targets.push({key:'goods',get:()=>s.goodsStock!.amountMilli,set:n=>{s.goodsStock!.amountMilli=n;}},{key:'luxury',get:()=>society.luxuryStockMilli,set:n=>{society.luxuryStockMilli=n;}});
  const choices=targets.filter(t=>t.key==='gold'||t.get()>0),target=choices[Math.floor(rng()*choices.length)];
  event.target=target.key;event.lossMilli=Number(BigInt(target.get())*BigInt(C.robberyBps[severity])/10000n);target.set(target.get()-event.lossMilli);
 }else if(kind==='smear'){
  const before=society.standing;society.standing=clamp(before-C.smear[severity]);event.standingLoss=before-society.standing;
 }else if(kind==='raid'){
  const deaths=Math.min(soldiers,C.raidDeaths[severity]);let left=deaths;
  for(const tile of barracks){const count=Math.min(left,tile.building!.workers);tile.building!.workers-=count;left-=count;}
  left=deaths;const free=Math.min(left,society.classes.free);society.classes.free-=free;left-=free;
  for(const key of ['free','makers','luminaries','merchants'] as const){const count=Math.min(left,society.classes.bound[key]);society.classes.bound[key]-=count;left-=count;}
  s.world.settlements[s.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(society);
  releaseSocietyWorkers(s);event.soldiersKilled=deaths;
 }else if(rng()*100<order.security){event.outcome='foiled';}
 else if(order.crime>=C.fatal.minCrime&&order.security<C.fatal.maxSecurity&&rng()<C.fatal.chance){
  event.outcome='killed';society.crisis.stage='fallen';society.crisis.fallCause='assassination';society.pendingCard=null;
 }else{
  event.outcome='wounded';report.lordHealthLoss=C.wound.health;
  event.standingLoss=Math.min(society.standing,C.wound.standing);society.standing-=event.standingLoss;
  event.authorityLoss=Math.min(order.authority,C.wound.authority);order.authority-=event.authorityLoss;
 }
 report.standingAfter=society.standing;return report;
}