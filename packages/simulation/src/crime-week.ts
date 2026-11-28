import { societySoldiers, soldierTiles, idleWatchHouse, CRIME_TRIAL as C, crimeChancePercent, crimeSeverity, crimeRandom, societyPopulation, ITEM_TRIAL, MANSION_CATALOG, type ItemWeekContext, type CrimeEventReport, type TileTrialState } from '@haven/core';
import { releaseSocietyWorkers } from './society-facilities.js';

interface PreparedCrime {
 chancePercent: number;
 event: CrimeEventReport['event'];
 goldLossMilli: number;
 applyRobbery?: () => void;
 foiled?: boolean;
 fatalRoll?: number;
}

// The draws use post-theft Security/Crime. The law promise between selection
// and application can change Authority and satisfaction, which consume no draws.
export function prepareCrimeWeek(s:TileTrialState, fundedTileIds:ReadonlySet<string>, rng:()=>number):PreparedCrime {
 const society=s.society!,order=society.order;
 const chancePercent=crimeChancePercent(order.crime,idleWatchHouse(s,fundedTileIds));
 const plan:PreparedCrime={chancePercent,event:null,goldLossMilli:0};
 if(rng()*100>=chancePercent)return plan;
 const soldiers=societySoldiers(s);
 const available=(['robbery','smear','raid','assassination'] as const).filter(kind=>kind==='raid'?soldiers>0:kind==='assassination'?order.crime>=C.assassinationMinCrime:true);
 let pick=rng()*available.reduce((sum,kind)=>sum+C.weights[kind],0);
 const kind=available.find(kind=>{pick-=C.weights[kind];return pick<0;})!;
 const severity=crimeSeverity(order.crime),event:NonNullable<CrimeEventReport['event']>={kind,severity};
 plan.event=event;
 if(kind==='robbery'){
  const stocks=s.world.settlements[s.world.activeSettlementId!].inventory;
  const targets: {key:NonNullable<typeof event.target>;get:()=>number;set:(n:number)=>void}[]=[];
  for(const key of ['gold','food','wheat','wood','iron'] as const)targets.push({key,get:()=>stocks[key],set:n=>{stocks[key]=n;}});
  for(const key of ['stone','wool','cloth','herbs'] as const)targets.push({key,get:()=>society.stocksMilli[key],set:n=>{society.stocksMilli[key]=n;}});
  targets.push({key:'goods',get:()=>s.goodsStock!.amountMilli,set:n=>{s.goodsStock!.amountMilli=n;}},{key:'luxury',get:()=>society.luxuryStockMilli,set:n=>{society.luxuryStockMilli=n;}});
  const choices=targets.filter(t=>t.key==='gold'||t.get()>0),target=choices[Math.floor(rng()*choices.length)];
  const loss=Number(BigInt(target.get())*BigInt(C.robberyBps[severity])/10000n);
  event.target=target.key;event.lossMilli=loss;
  plan.goldLossMilli=target.key==='gold'?loss:0;
  plan.applyRobbery=()=>target.set(target.get()-loss);
 }else if(kind==='assassination'){
  plan.foiled=rng()*100<order.security;
  if(!plan.foiled&&order.crime>=C.fatal.minCrime&&order.security<C.fatal.maxSecurity)plan.fatalRoll=rng();
 }
 return plan;
}

export function resolveCrimeWeek(
 s:TileTrialState, fundedTileIds:ReadonlySet<string>, rng?:()=>number, ctx?:ItemWeekContext,
 mansionReductionBps=0, prepared?:PreparedCrime,
):CrimeEventReport {
 const society=s.society!,order=society.order,standingBefore=society.standing;
 const clamp=(n:number)=>Math.max(0,Math.min(100,n));
 society.standing=clamp(standingBefore+Math.sign(C.standing.newGame-standingBefore)*C.standing.drift);
 const plan=prepared??prepareCrimeWeek(s,fundedTileIds,rng??crimeRandom(s.world.worldMetadata.worldSeed,s.world.week-1));
 const {event,chancePercent}=plan;
 const report:CrimeEventReport={standingBefore,standingAfter:society.standing,chancePercent,event,lordHealthLoss:0};
 if(!event)return report;
 const {kind,severity}=event,effects=ITEM_TRIAL.effects;
 const combatFatalReduction=ctx?Math.min(effects.fatalCap,Math.floor(Math.max(0,ctx.playerSkills.combat-effects.threshold)/effects.fatalStep)):0;
 const fatalChance=mansionReductionBps===0?(C.fatal.chance*100-combatFatalReduction)/100:
  Math.max(MANSION_CATALOG.calibration.fatalChanceFloorBps,C.fatal.chance*10000-combatFatalReduction*100-mansionReductionBps)/10000;
 if(kind==='robbery'){
  plan.applyRobbery!();
 }else if(kind==='smear'){
  const before=society.standing;society.standing=clamp(before-C.smear[severity]);event.standingLoss=before-society.standing;
 }else if(kind==='raid'){
  const barracks=soldierTiles(s),soldiers=societySoldiers(s);
  const deaths=Math.min(soldiers,C.raidDeaths[severity]);let left=deaths;
  for(const tile of barracks){const count=Math.min(left,tile.building!.workers);tile.building!.workers-=count;left-=count;}
  left=deaths;const free=Math.min(left,society.classes.free);society.classes.free-=free;left-=free;
  for(const key of ['free','makers','luminaries','merchants'] as const){const count=Math.min(left,society.classes.bound[key]);society.classes.bound[key]-=count;left-=count;}
  s.world.settlements[s.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(society);
  releaseSocietyWorkers(s);event.soldiersKilled=deaths;
 }else if(plan.foiled){event.outcome='foiled';}
 else if(plan.fatalRoll!==undefined&&plan.fatalRoll<fatalChance){
  event.outcome='killed';society.crisis.stage='fallen';society.crisis.fallCause='assassination';society.pendingCard=null;
 }else{
  const medicalWoundReduction=ctx?Math.floor(Math.max(0,ctx.playerSkills.medical-effects.threshold)/effects.woundStep):0;
  const ironhideWoundReduction=ctx?.playerTraits.includes('ironhide')?effects.ironhideWoundReduction:0;
  event.outcome='wounded';report.lordHealthLoss=Math.max(effects.woundFloor,C.wound.health-medicalWoundReduction-ironhideWoundReduction);
  event.standingLoss=Math.min(society.standing,C.wound.standing);society.standing-=event.standingLoss;
  event.authorityLoss=Math.min(order.authority,C.wound.authority);order.authority-=event.authorityLoss;
 }
 report.standingAfter=society.standing;return report;
}
