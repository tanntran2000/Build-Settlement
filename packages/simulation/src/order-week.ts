import { societySoldiers, garrisonSecurity, lawTerms, type LawTerms, ORDER_TRIAL as O, SOCIETY_BUILDINGS, societyPlot, societyPopulation, buildingWorkerCap,trialBuilding, securityTarget, crimeTarget, authorityTarget, driftToward, type OrderFacts, type OrderReport, type TileTrialState } from '@haven/core';

const classes=['free','makers','luminaries','merchants'] as const;
export function orderFacts(s:TileTrialState,fundedTileIds:ReadonlySet<string>,terms:LawTerms=lawTerms([])):OrderFacts {
 const society=s.society!;
 const facts:OrderFacts={lawSecurity:terms.securityTarget,lawCrime:terms.crimeTarget,lawAuthority:terms.authorityTarget,standing:society.standing,wallRing:society.wallRing,watchHouses:[],barracksWorkers:0,soldiers:societySoldiers(s,fundedTileIds),population:societyPopulation(society),slumOther:0,corruption:society.corruption,desperation:society.desperation,tension:society.tension,
  meanSatisfaction:Math.trunc(classes.reduce((sum,key)=>sum+society.satisfaction[key],0)/classes.length),townHallStaffed:false,patrols:society.research.completed.includes('watch-patrols'),drill:society.research.completed.includes('barracks-drill')};
 for(const tile of s.tiles){
  const b=tile.building;
  if(!b?.enabled||!fundedTileIds.has(tile.id))continue;
  if(b.typeId==='military-barracks')facts.barracksWorkers+=b.workers;
  if(b.typeId==='watch-house'){facts.watchHouses.push({level:b.level as 1|2,slum:societyPlot(tile.id)?.tier==='slum',workers:b.workers});continue;}
  if(b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
  else if(SOCIETY_BUILDINGS[b.typeId]?.tier==='slum')facts.slumOther++;
  if(b.typeId==='town-hall')facts.townHallStaffed=true;
 }
 return facts;
}
export function authorityTaxBps(authority:number):number {return (authority-50)*O.tax.bpsPerPoint;}
export function authorityArrivals(authority:number,budget:number,hasRoom:boolean):number {
 if(authority<O.immigration.halveBelow)return Math.trunc(budget/2);
 if(authority>=O.immigration.bonusAtOrAbove&&hasRoom){if(!Number.isSafeInteger(budget+1))throw Error('Order arrivals overflow.');return budget+1;}
 return budget;
}
export function resolveOrderWeek(s:TileTrialState,fundedTileIds:ReadonlySet<string>,partial:Pick<OrderReport,'before'|'taxModifierBps'|'taxDeltaMilli'|'arrivalsBudgetBefore'|'arrivalsBudgetAfter'>,terms:LawTerms=lawTerms([])):OrderReport {
 const facts=orderFacts(s,fundedTileIds,terms), order=s.society!.order;
 const security=securityTarget(facts); order.security=driftToward(order.security,security,O.drift.security);
 const crime=crimeTarget(facts,order.security); order.crime=driftToward(order.crime,crime,O.drift.crime);
 const authority=authorityTarget(facts,order.security,order.crime); order.authority=driftToward(order.authority,authority,O.drift.authority);
 const society=s.society!,stocks=s.world.settlements[s.world.activeSettlementId!].inventory;
 const theftMilli:OrderReport['theftMilli']={};
 const bps=Math.max(0,order.crime-O.theft.threshold)*O.theft.bpsPerPoint;
 const steal=(key:keyof OrderReport['theftMilli'],amount:number):number=>{
  const loss=Number(BigInt(amount)*BigInt(bps)/10000n);
  if(loss>0)theftMilli[key]=loss;
  return amount-loss;
 };
 for(const key of ['gold','food','wheat','wood','iron'] as const)stocks[key]=steal(key,stocks[key]);
 for(const key of ['stone','wool','cloth','herbs'] as const)society.stocksMilli[key]=steal(key,society.stocksMilli[key]);
 s.goodsStock!.amountMilli=steal('goods',s.goodsStock!.amountMilli);
 society.luxuryStockMilli=steal('luxury',society.luxuryStockMilli);
 const tensionAdded=Math.min(100-society.tension,Math.trunc(order.crime/O.tensionDivisor));society.tension+=tensionAdded;
 const satisfactionLost=O.satisfactionLoss.find(entry=>order.crime>=entry.crime)?.loss??0;
 for(const key of classes)society.satisfaction[key]=Math.max(0,society.satisfaction[key]-satisfactionLost);
 return {...partial,soldiers:facts.soldiers,garrisonSecurity:garrisonSecurity(facts.soldiers),before:{...partial.before},targets:{security,crime,authority},after:{...order},theftMilli,tensionAdded,satisfactionLost};
}
