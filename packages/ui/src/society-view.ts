import { buildingWorkerCap, societySoldiers, garrisonSecurity, idleWatchHouse, SOCIETY_BUILDINGS, SOCIETY_PLOT_IDS, societyPlot, societyStaff, TRIAL_BUILDINGS, GOODS_STOCK_TRIAL, type TileTrialState, type SocietyTier } from '@haven/core';
import { societyWorkforce, SOCIETY_WEEK_TRIAL as T, type SocietyNote } from '@haven/simulation';
export type ClassId = 'free' | 'makers' | 'luminaries' | 'merchants' | 'bound';
export type ColourKey = ClassId | 'none';
export const CLASS_LABELS: Record<ClassId,string> = {free:'Free residents',makers:'Makers',luminaries:'Luminaries',merchants:'Merchants',bound:'The Bound'};
const colours: Record<string,ColourKey> = {'common-housing':'free','makers-rowhouses':'makers','scholars-quarters':'luminaries','merchant-townhouses':'merchants','slave-quarters':'bound',hospital:'luminaries','town-hall':'merchants','builders-yard':'makers',academy:'luminaries','town-market':'merchants','trading-post':'merchants','counting-house':'merchants',warehouse:'makers',smithy:'makers',library:'luminaries',processor:'makers',workshop:'makers',weaver:'makers'};
export function buildingColour(typeId:string):ColourKey { return colours[typeId] ?? 'none'; }
export function effectLine(typeId:string,level:number):string {
 const info=SOCIETY_BUILDINGS[typeId];
 if(info?.reserved) return 'Not available yet';
 if(info?.housing) {
  const names={...CLASS_LABELS,elite:'Elites of any group',bound:'Bound'};
  return `Houses ${info.housing.byLevel[level-1]} ${names[info.housing.class]}`;
 }
 switch(typeId) {
 case 'tavern':return `+${level===1?T.tavernL1:T.tavernL2} satisfaction to Free residents and Makers while fed`;
 case 'hospital': {const n=level===1?T.hospitalL1:T.hospitalL2;return `+${n} satisfaction to every class except the Bound; −${n} Desperation`;}
 case 'town-hall':return 'Opens Ring 3; hosts an NPC manager post';
 case 'builders-yard':return `Opens Ring 2; construction −${10*level}%`;
 case 'academy':return `Trains up to ${T.trainingPerLevel*level} Free residents per week`;
 case 'town-market':return `Distributes up to ${GOODS_STOCK_TRIAL.capacityPerLevelMilli*level/1000} Goods per week`;
 case 'trading-post':return `Imports ${2*level} Luxury per week for ${3*level} Gold`;
 case 'counting-house':return `+${10*level}% tax`;
 default:return '';
 }
}
export function insideTiers(city:TileTrialState) {
 const labels:Record<SocietyTier,string>={housing:'Housing',service:'Services',specialist:'Specialist',slum:'Slum'};
 return (Object.keys(labels) as SocietyTier[]).map(tier=>({tier,label:labels[tier],plots:SOCIETY_PLOT_IDS.filter(id=>societyPlot(id)!.tier===tier).map(tileId=>{const {ring}=societyPlot(tileId)!;return {tileId,ring,locked:ring>(city.society?.wallRing??1)};})}));
}
export function buildOptions(city:TileTrialState,tileId:string):{typeId:string;label:string;available:boolean}[] {
 const plot=societyPlot(tileId);
 if(plot) {
  if(plot.ring>(city.society?.wallRing??1)) return [];
  return Object.entries(SOCIETY_BUILDINGS).filter(([,v])=>(v.tier===plot.tier||v.alsoTier===plot.tier)).sort((a,b)=>Number(a[1].reserved)-Number(b[1].reserved)).map(([typeId,v])=>({typeId,label:typeId==='watch-house'&&plot.tier==='slum'?'Watch House · +5 Security in the Slum':v.reserved?`${reservedNames[typeId]} — Not available yet`:TRIAL_BUILDINGS[typeId].name,available:!v.reserved}));
 }
 const outside=outsidePlot(tileId);
 if(outside&&(outside.ring>city.society!.wallRing||city.society!.outside[tileId].wild))return [];
 if(!city.tiles.some(t=>t.id===tileId)) return [];
 return Object.entries(TRIAL_BUILDINGS).filter(([id,d])=>id!=='market'&&!d.terrain.includes('town')).map(([typeId,d])=>({typeId,label:d.name,available:true}));
}
const reservedNames:Record<string,string>={'watch-house':'Watch House',warehouse:'Warehouse',smithy:'Smithy',library:'Library',brothel:'Brothel','black-market':'Black Market',arena:'Arena','drug-store':'Drug Store'};
export function staffPools(city:TileTrialState) {
 const workforce=societyWorkforce(city.society!);
 const pools={basic:{assigned:0,available:workforce.free+workforce.bound},makers:{assigned:0,available:workforce.makers},luminaries:{assigned:0,available:workforce.luminaries},merchants:{assigned:0,available:workforce.merchants}};
 for(const {building:b} of city.tiles) if(b?.enabled) {const staff=societyStaff(b.typeId);if(staff) pools[staff].assigned+=b.workers;}
 for(const o of Object.values(city.society!.outside)) pools.basic.assigned+=o.clearWorkers;
 return pools;
}
export function plannedHousing(city:TileTrialState) {
 const totals={free:0,makers:0,luminaries:0,merchants:0,elite:0,bound:0};
 for(const {building:b} of city.tiles) if(b?.enabled) {const housing=SOCIETY_BUILDINGS[b.typeId]?.housing;if(housing) totals[housing.class]+=housing.byLevel[b.level-1];}
 return totals;
}
export function wallStatus(city:TileTrialState):{ring:1|2|3;openPlots:number;next:null|{ring:2|3;text:string}} {
 const ring=city.society!.wallRing;
 return {ring,openPlots:SOCIETY_PLOT_IDS.filter(id=>societyPlot(id)!.ring<=ring).length,next:ring===3?null:{ring:ring===1?2:3,text:ring===1?"Needs an operating Builders' Yard. Cost: 30 Gold, 20 Wood, 10 Iron.":'Needs an operating Town Hall. Cost: 60 Gold, 40 Wood, 20 Iron, 30 Stone.'}};
}
export function noteSentence(id:ClassId,note:SocietyNote,enslaved:number):string {
 const label=CLASS_LABELS[id];
 const sentences:Record<SocietyNote,string>={'food-short':`${label} went short of Food.`,'goods-short':`${label} went short of Goods.`,'luxury-short':`${label} Elites went short of Luxury.`,overcrowded:`${label} housing is overcrowded (−${T.overcrowding} satisfaction).`,'housing-full':`No ${label} arrived: ${label}' housing is full.`,'no-slave-room':'Debt enslavement was limited: Slave Quarters are full.','training-no-housing':`Training was limited: ${label} housing is full.`,'training-no-gold':'Training was limited: not enough Gold.',unemployed:`Some ${label} had no work, so debt pressure rose.`,'debt-enslavement':`${enslaved} ${label} fell into debt slavery.`};
 return sentences[note];
}
export function workforceSummary(city:TileTrialState):string {
 const pools=staffPools(city);
 return Object.entries(pools).map(([id,p])=>`${id[0].toUpperCase()+id.slice(1)} ${p.assigned}/${p.available}`).join(' · ')+' WF assigned';
}
import { OUTSIDE_PLOTS, OUTSIDE_TRIAL as O, outsidePlot, type TileTrialReport, TILE_TRIAL_BALANCE } from '@haven/core';
import { FARM_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI } from '@haven/simulation';
import { formatMilli } from './milli-format.js';
export function outsideRings(city:TileTrialState) {
 return ([1,2,3] as const).map(ring=>({ring,locked:ring>city.society!.wallRing,plots:OUTSIDE_PLOTS.filter(p=>p.ring===ring).map(p=>{
 const o=city.society!.outside[p.id],tile=city.tiles.find(t=>t.id===p.id)!,b=tile.building;
 const good=p.terrain==='forest'?'Wood':p.terrain==='ore'?'Iron':'Stone';
 return {tileId:p.id,terrain:tile.terrain,wild:o.wild,clear:o.wild?{progress:o.clearMilli/1000,work:O.clearWork[p.terrain]/1000}:null,
 deposit:o.depositMilli===null?null:{good:good as 'Wood'|'Iron'|'Stone',remaining:o.depositMilli/1000,cap:o.capMilli!/1000},
 deepShaftAllowed:ring<=city.society!.wallRing&&!o.wild&&!o.deepShaft&&o.depositMilli!>0&&!!b&&['mine','quarry'].includes(b.typeId)&&city.society!.research.completed.includes('deep-mining')};
 })}));
}
export function storageView(city:TileTrialState) {
 const society=city.society!,settlement=city.world.settlements[city.world.activeSettlementId!],stocks=settlement.inventory;
 let gold=stocks.gold+settlement.cohorts.reduce((n,c)=>n+c.count,0)*TILE_TRIAL_BALANCE.taxGoldPerResident;
 let capacity:number=O.storage.baseMilli;
 for(const tile of city.tiles){const b=tile.building;if(!b?.enabled)continue;const d=TRIAL_BUILDINGS[b.typeId];
 const batches=d.operation==='farm'?Math.min(b.workers,FARM_MAX_BATCHES,Math.floor(gold/FARM_GOLD_PER_BATCH_MILLI)):0;
 const debit=Math.max(d.upkeepMilli*b.level,batches*FARM_GOLD_PER_BATCH_MILLI);if(gold<debit)continue;gold-=debit;
 if(b.typeId==='warehouse'&&b.workers===buildingWorkerCap(b.typeId,b.level))capacity+=O.storage.warehousePerLevelMilli*b.level;
 }
 const amounts={Food:stocks.food,Wheat:stocks.wheat,Wood:stocks.wood,Iron:stocks.iron,Stone:society.stocksMilli.stone,Wool:society.stocksMilli.wool,Cloth:society.stocksMilli.cloth,Herbs:society.stocksMilli.herbs,Goods:city.goodsStock!.amountMilli,Luxury:society.luxuryStockMilli};
 return Object.entries(amounts).map(([good,amount])=>({good,amount:amount/1000,capacity:capacity/1000}));
}
export function outsideReportLines(report:Readonly<TileTrialReport>):string[] {
 const o=report.outside;if(!o)return [];
 return [...Object.entries(o.spoiledMilli).map(([good,n])=>`${formatMilli(n)} ${good[0].toUpperCase()+good.slice(1)} spoiled: storage full.`),
 ...o.exhausted.map(id=>`${id}: deposit exhausted; the ${TRIAL_BUILDINGS[outsidePlot(id)!.terrain==='ore'?'mine':'quarry'].name} closed and the plot is now plain.`),
 ...o.cleared.map(id=>`${id} cleared.`),...o.researchCompleted.map(topic=>`Research completed: ${RESEARCH_LABELS[topic]}.`),...o.hospitalsIdle.map(id=>`${id}: Hospital idle, no Herbs.`)];
}

import {securityTarget,crimeTarget,authorityTarget,orderBand,type ResearchTopic} from '@haven/core';
import {orderFacts} from '@haven/simulation';
export const RESEARCH_LABELS:Record<ResearchTopic,string>={'deep-mining':'Deep Mining','watch-patrols':'Watch Patrols','barracks-drill':'Barracks Drill'};
export function orderRows(city:TileTrialState):{label:'Security'|'Crime'|'Authority';value:number;target:number;band:'Low'|'Fair'|'High'}[]{
 const facts=orderFacts(city,new Set(city.tiles.filter(t=>t.building?.enabled).map(t=>t.id))),order=city.society!.order;
 const targets={security:securityTarget(facts),crime:crimeTarget(facts,order.security),authority:authorityTarget(facts,order.security,order.crime)};
 return (['security','crime','authority'] as const).map(key=>({label:({security:'Security',crime:'Crime',authority:'Authority'} as const)[key],value:order[key],target:targets[key],band:orderBand(order[key])}));
}
export const ORDER_GOODS=['gold','food','wheat','wood','iron','stone','wool','cloth','herbs','goods','luxury'] as const;
export function orderReportLines(report:Readonly<TileTrialReport>):string[]{
 const o=report.order;if(!o)return [];
 const lines=(['security','crime','authority'] as const).map(key=>`${key[0].toUpperCase()+key.slice(1)} ${o.before[key]} → ${o.after[key]} (target ${o.targets[key]})`);
 const theft=ORDER_GOODS.filter(key=>(o.theftMilli[key]??0)>0).map(key=>`−${formatMilli(o.theftMilli[key]!)} ${key[0].toUpperCase()+key.slice(1)}`);
 if(theft.length)lines.push(`Theft: ${theft.join(', ')}`);
 if(o.tensionAdded>0)lines.push(`Crime raised Tension by ${o.tensionAdded}.`);
 if(o.satisfactionLost>0)lines.push(`Crime lowered satisfaction by ${o.satisfactionLost}.`);
 if(o.taxModifierBps!==0)lines.push(`Authority ${o.before.authority}: taxes ${o.taxModifierBps>0?'+':'−'}${Math.abs(o.taxModifierBps)/100}%.`);
 if(o.arrivalsBudgetBefore>0&&o.arrivalsBudgetAfter<o.arrivalsBudgetBefore)lines.push(`Authority ${o.before.authority}: half of the newcomers turned away.`);
 if(o.arrivalsBudgetAfter===o.arrivalsBudgetBefore+1)lines.push(`Authority ${o.before.authority}: one more newcomer stayed.`);
 return lines;
}
import { CRISIS_TRIAL, type CrisisCardKind, type CrisisStage } from '@haven/core';
export const CRISIS_CARD_COPY:Record<CrisisCardKind,{title:string;text:string}>={
 demand:{title:'The Hungry Demand Bread',text:'Three weeks of hunger. Crowds gather at the granary and demand food.'},
 protest:{title:'Protest in the Streets',text:'The demand went unanswered. Crowds fill the streets and shout at your gate.'},
 rebellion:{title:'Open Rebellion',text:'The city rises against you. Feed your people within four weeks or lose Haven.'},
};
const stageNames:Record<CrisisStage,string>={none:'Calm',warning:'Warning',demand:'Demand',protest:'Protest',rebellion:'Rebellion',fallen:'Fallen'};
export function crisisRow(city:TileTrialState):string {
 const c=city.society!.crisis;
 return [`${stageNames[c.stage]} · ${c.weeksInStage} weeks`,...(c.hungerStreak?[`Hungry weeks in a row: ${c.hungerStreak}`]:[]),...(c.promise?[`Promise: ${c.promise.weeksLeft} weeks left`]:[]),...(c.stage==='rebellion'?[`Weeks left: ${CRISIS_TRIAL.finalWeeks-c.weeksInStage}`]:[])].join(' · ');
}
const signed=(n:number)=>`${n<0?'−':'+'}${Math.abs(n)}`;
export function crisisReportLines(report:Readonly<TileTrialReport>):string[]{
 const c=report.crisis;if(!c)return [];
 const stages:CrisisStage[]=['none','warning','demand','protest','rebellion','fallen'];
 const lines:string[]=[];
 if(c.stageBefore!==c.stageAfter)lines.push(`Unrest ${stages.indexOf(c.stageAfter)>stages.indexOf(c.stageBefore)?'rose':'eased'}: ${stageNames[c.stageBefore]} → ${stageNames[c.stageAfter]}.`);
 if(c.hungerStreak)lines.push(`Hungry weeks in a row: ${c.hungerStreak}.`);
 if(c.promise&&c.promise.result!=='pending')lines.push(`Promise ${c.promise.result}: Tension ${signed(c.promise.tensionDelta)}, Authority ${signed(c.promise.authorityDelta)}.`);
 if(c.lastChoice){const a=c.lastChoice;lines.push(`Your answer last week: ${a.option[0].toUpperCase()+a.option.slice(1)}${a.option==='pay'?` (−${formatMilli(a.goldMilli)} Gold, Tension ${signed(CRISIS_TRIAL.pay[a.stage].tension)})`:''}.`);}
 return lines;
}

import { crimeChancePercent } from '@haven/core';
export function standingRow(city:TileTrialState):string {
 const n=city.society!.standing;return `Standing ${n} · ${orderBand(n)}`;
}
export function crimeChanceRow(city:TileTrialState):string {
 return `Crime events: ${crimeChancePercent(city.society!.order.crime,idleWatchHouse(city))}% a week`;
}
export const END_SCREEN_COPY:Record<'rebellion'|'assassination',{title:string;text:string}>={
 rebellion:{title:'The City Has Fallen',text:'Hunger turned Haven against you.'},
 assassination:{title:'The Lord Is Dead',text:"An assassin's blade ended your rule."},
};
export function crimeReportLine(report:Readonly<TileTrialReport>):string {
 const c=report.crimeEvent,e=c?.event;
 if(!e)return 'A quiet week on the streets.';
 switch(e.kind){
 case 'robbery':
  if(e.lossMilli===0)return `A gang tried to rob the ${e.target==='gold'?'treasury':'stores'} but took nothing.`;
  return `A gang robbed the ${e.target==='gold'?'treasury':'stores'}: −${formatMilli(e.lossMilli!)} ${e.target![0].toUpperCase()+e.target!.slice(1)}.`;
 case 'smear':return `Rumours spread about the Lord: Standing −${e.standingLoss}.`;
 case 'raid':return `A gang attacked the garrison: ${e.soldiersKilled} soldier${e.soldiersKilled===1?'':'s'} died.`;
 case 'assassination':return e.outcome==='foiled'?'Guards stopped an assassin.':e.outcome==='wounded'?`An assassin wounded you: health −${c!.lordHealthLoss}, Standing −${e.standingLoss}, Authority −${e.authorityLoss}.`:END_SCREEN_COPY.assassination.text;
 }
}

import { LAW_CATALOG, type LawId, type SocietyClassKey } from '@haven/core';
export const GROUP_LABELS: Record<SocietyClassKey,string> = {free:'Free residents',makers:'Makers',luminaries:'Luminaries',merchants:'Merchants'};
export function lawsRow(state:TileTrialState):string { return `Laws ${state.society!.laws.active.length}/3`; }
export function lawEffectLine(id:LawId):string {
 const copy:Record<LawId,string>={curfew:'Security target +10; Free satisfaction −2','watch-levy':'Costs 1 Gold; Crime target −5','guild-charters':'Makers satisfaction +2; Merchants satisfaction −2','war-tithe':"Tax +10 %; every group's satisfaction −1",'poor-relief':'Costs 1.5 Gold; Desperation −3; Free satisfaction +2','free-assembly':'Tension −3; Authority target −5','public-punishments':'Crime target −10; Tension +2','licensed-vice':'Earns 1.5 Gold; Luminaries satisfaction −2'};
 return copy[id];
}
export function lawReportLines(report:Readonly<TileTrialReport>):string[] {
 const l=report.laws;if(!l)return [];
 const lines=[l.inForce.length?`Laws in force: ${l.inForce.map(id=>LAW_CATALOG[id].name).join(', ')}.`:'No laws in force.',
 ...l.costs.map(c=>`${LAW_CATALOG[c.lawId].name} cost ${formatMilli(c.goldMilli)} Gold.`),
 ...l.unfunded.map(id=>`${LAW_CATALOG[id].name} was unfunded: no effect this week.`)];
 if(l.incomeMilli)lines.push(`Licensed Vice earned ${formatMilli(l.incomeMilli)} Gold.`);
 if(l.promise){const p=l.promise;lines.push(p.outcome==='kept'?`You kept your promise to the ${GROUP_LABELS[p.group]}: Authority +3.`:`You broke your promise to the ${GROUP_LABELS[p.group]}: satisfaction −10, Tension +10.`);}
 return lines;
}

export function soldiersRow(state:TileTrialState):string {
 const n=societySoldiers(state);return `Soldiers ${n} · Garrison +${garrisonSecurity(n)} Security`;
}
export function garrisonReportLine(report:Readonly<TileTrialReport>):string {
 const o=report.order;return o?`Garrison: ${o.soldiers} soldiers, Security +${o.garrisonSecurity}.`:'';
}
