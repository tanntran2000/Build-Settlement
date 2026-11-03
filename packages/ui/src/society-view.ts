import { SOCIETY_BUILDINGS, SOCIETY_PLOT_IDS, societyPlot, societyStaff, TRIAL_BUILDINGS, GOODS_STOCK_TRIAL, type TileTrialState, type SocietyTier } from '@haven/core';
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
  return Object.entries(SOCIETY_BUILDINGS).filter(([,v])=>v.tier===plot.tier).sort((a,b)=>Number(a[1].reserved)-Number(b[1].reserved)).map(([typeId,v])=>({typeId,label:v.reserved?`${reservedNames[typeId]} — Not available yet`:TRIAL_BUILDINGS[typeId].name,available:!v.reserved}));
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
 if(b.typeId==='warehouse'&&b.workers===d.maxWorkers*b.level)capacity+=O.storage.warehousePerLevelMilli*b.level;
 }
 const amounts={Food:stocks.food,Wheat:stocks.wheat,Wood:stocks.wood,Iron:stocks.iron,Stone:society.stocksMilli.stone,Wool:society.stocksMilli.wool,Cloth:society.stocksMilli.cloth,Herbs:society.stocksMilli.herbs,Goods:city.goodsStock!.amountMilli,Luxury:society.luxuryStockMilli};
 return Object.entries(amounts).map(([good,amount])=>({good,amount:amount/1000,capacity:capacity/1000}));
}
export function outsideReportLines(report:Readonly<TileTrialReport>):string[] {
 const o=report.outside;if(!o)return [];
 return [...Object.entries(o.spoiledMilli).map(([good,n])=>`${formatMilli(n)} ${good[0].toUpperCase()+good.slice(1)} spoiled: storage full.`),
 ...o.exhausted.map(id=>`${id}: deposit exhausted; the ${TRIAL_BUILDINGS[outsidePlot(id)!.terrain==='ore'?'mine':'quarry'].name} closed and the plot is now plain.`),
 ...o.cleared.map(id=>`${id} cleared.`),...o.researchCompleted.map(()=>'Research completed: Deep Mining.'),...o.hospitalsIdle.map(id=>`${id}: Hospital idle, no Herbs.`)];
}
