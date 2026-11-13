import researchJson from '../data/research.json' with { type: 'json' };
import outsidePlotsJson from '../data/outside-plots.json' with { type: 'json' };
import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateResearch, validateOutsidePlots, validateTuning } from '../data/validate.js';
import { hasWeeklyKeys } from '../domain/canonical-state.js';

export type OutsideTerrain = 'fertile' | 'pasture' | 'meadow' | 'forest' | 'ore' | 'rock' | 'plain';
export const RESEARCH_TOPICS = deepFreeze(validateResearch(researchJson));
export type ResearchTopic = typeof RESEARCH_TOPICS[number];
export interface OutsidePlotState {
 wild: boolean; clearMilli: number; clearWorkers: number; clearPaid: boolean;
 depositMilli: number | null; capMilli: number | null; deepShaft: boolean;
}

export const OUTSIDE_PLOTS: readonly Readonly<{id:string;terrain:OutsideTerrain;ring:1|2|3}>[] = deepFreeze(validateOutsidePlots(outsidePlotsJson));
export type OutsidePlotId = typeof OUTSIDE_PLOTS[number]['id'];
export function outsidePlot(id:string): {terrain:OutsideTerrain;ring:1|2|3} | null {
 const plot=OUTSIDE_PLOTS.find(p=>p.id===id);return plot?{terrain:plot.terrain,ring:plot.ring}:null;
}
export const OUTSIDE_TRIAL = deepFreeze(validateTuning(tuningJson).OUTSIDE_TRIAL);
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
