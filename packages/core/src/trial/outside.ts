import { hasWeeklyKeys } from '../domain/canonical-state.js';

export type OutsideTerrain = 'fertile' | 'pasture' | 'meadow' | 'forest' | 'ore' | 'rock' | 'plain';
export const RESEARCH_TOPICS = Object.freeze(['deep-mining', 'watch-patrols', 'barracks-drill'] as const);
export type ResearchTopic = typeof RESEARCH_TOPICS[number];
export interface OutsidePlotState {
 wild: boolean; clearMilli: number; clearWorkers: number; clearPaid: boolean;
 depositMilli: number | null; capMilli: number | null; deepShaft: boolean;
}
const ringIds = [
 'field-1 plain-1 forest-1 ore-1 plain-2 plain-3 forest-2 ore-2 field-2 plain-4',
 'field-3 field-4 pasture-1 pasture-2 meadow-1 meadow-2 forest-3 rock-1 rock-2 plain-5',
 'field-5 pasture-3 meadow-3 forest-4 forest-5 ore-3 ore-4 rock-3 plain-6 plain-7',
];
export const OUTSIDE_PLOTS: readonly Readonly<{id:string;terrain:OutsideTerrain;ring:1|2|3}>[] = Object.freeze(ringIds.flatMap((ids,i)=>ids.split(' ').map(id=>Object.freeze({
 id, terrain:(id.startsWith('field-')?'fertile':id.split('-')[0]) as OutsideTerrain, ring:(i+1) as 1|2|3,
}))));
export type OutsidePlotId = typeof OUTSIDE_PLOTS[number]['id'];
export function outsidePlot(id:string): {terrain:OutsideTerrain;ring:1|2|3} | null {
 const plot=OUTSIDE_PLOTS.find(p=>p.id===id);return plot?{terrain:plot.terrain,ring:plot.ring}:null;
}
export const OUTSIDE_TRIAL = Object.freeze({
 deposit:Object.freeze({forest:60000,ore:80000,rock:100000}), forestRegrowMilli:3000,
 clearWork:Object.freeze({fertile:4000,pasture:4000,meadow:4000,plain:4000,forest:6000,ore:8000,rock:8000}),
 clearFeeGoldMilli:2000, forestClearWoodMilli:5000,
 perWorker:Object.freeze({wool:1000,herbs:500,stone:1000}),
 weaver:Object.freeze({woolPerBatchMilli:2000,clothPerBatchMilli:1000}),
 workshopClothRecipe:Object.freeze({woodMilli:1000,clothMilli:1000}), hospitalHerbsPerLevelMilli:1000,
 storage:Object.freeze({baseMilli:40000,warehousePerLevelMilli:40000}),
 research:Object.freeze({'deep-mining':Object.freeze({workMilli:8000,goldMilli:10000}),'watch-patrols':Object.freeze({workMilli:6000,goldMilli:6000}),'barracks-drill':Object.freeze({workMilli:8000,goldMilli:8000})}),
 deepShaft:Object.freeze({stoneMilli:10000,woodMilli:5000,goldMilli:10000,depositBonusMilli:60000,outputBps:15000}),
 wallRing3StoneMilli:30000, level3StoneMilli:5000,
});
export function createOutsideState(): Record<OutsidePlotId,OutsidePlotState> {
 return Object.fromEntries(OUTSIDE_PLOTS.map(p=>{
  const deposit= p.terrain==='forest'||p.terrain==='ore'||p.terrain==='rock'?OUTSIDE_TRIAL.deposit[p.terrain]:null;
  return [p.id,{wild:p.ring>1,clearMilli:0,clearWorkers:0,clearPaid:false,depositMilli:deposit,capMilli:deposit,deepShaft:false}];
 }));
}
const count=(n:unknown):n is number=>Number.isSafeInteger(n)&&(n as number)>=0;
export function isOutsideState(raw:unknown): raw is Record<OutsidePlotId,OutsidePlotState> {
 if(!hasWeeklyKeys(raw,OUTSIDE_PLOTS.map(p=>p.id))) return false;
 for(const p of OUTSIDE_PLOTS){
  const o=raw[p.id];
  if(!hasWeeklyKeys(o,['wild','clearMilli','clearWorkers','clearPaid','depositMilli','capMilli','deepShaft']) ||
   typeof o.wild!=='boolean'||!count(o.clearMilli)||!count(o.clearWorkers)||typeof o.clearPaid!=='boolean'||typeof o.deepShaft!=='boolean')return false;
  if(p.terrain==='forest'||p.terrain==='ore'||p.terrain==='rock'){
   if(!count(o.depositMilli)||!count(o.capMilli)||o.depositMilli>o.capMilli)return false;
  }else if(o.depositMilli!==null||o.capMilli!==null||o.deepShaft)return false;
  if(o.deepShaft && p.terrain!=='ore' && p.terrain!=='rock')return false;
 }
 return true;
}
export interface OutsideResearch {
 topic: ResearchTopic|null; progressMilli:Record<ResearchTopic,number>; paid:ResearchTopic[]; completed:ResearchTopic[];
}
export function isOutsideResearch(raw:unknown): raw is OutsideResearch {
 if(!hasWeeklyKeys(raw,['topic','progressMilli','paid','completed']) ||
  !hasWeeklyKeys(raw.progressMilli,RESEARCH_TOPICS))return false;
 const progress = raw.progressMilli;
 if (!RESEARCH_TOPICS.every(topic=>count(progress[topic]))) return false;
 const topics=(v:unknown):ResearchTopic[]|null=>{
  if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype)return null;
  const length=Object.getOwnPropertyDescriptor(v,'length')?.value;
  if(!Number.isSafeInteger(length)||length<0||Reflect.ownKeys(v).length!==length+1)return null;
  const values:ResearchTopic[]=[];
  for(let i=0;i<length;i++){
   const d=Object.getOwnPropertyDescriptor(v,String(i));
   if(!d?.enumerable||!('value' in d)||!RESEARCH_TOPICS.includes(d.value))return null;
   values.push(d.value);
  }
  return new Set(values).size===values.length?values:null;
 };
 const paid=topics(raw.paid), completed=topics(raw.completed);
 return paid!==null&&completed!==null&&(raw.topic===null||RESEARCH_TOPICS.includes(raw.topic as ResearchTopic)&&!completed.includes(raw.topic as ResearchTopic));
}
