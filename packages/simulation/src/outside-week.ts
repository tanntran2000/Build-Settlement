import { OUTSIDE_PLOTS, OUTSIDE_TRIAL as O, trialBuilding, type TileTrialReport, type TileTrialState } from '@haven/core';

type OutsideReport=NonNullable<TileTrialReport['outside']>;
const safe=(n:number):number=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Outside arithmetic overflow.');return n;};

export function finishOutsideLand(s:TileTrialState,operatingIds:ReadonlySet<string>,report:OutsideReport):void {
 const society=s.society!,stocks=s.world.settlements[s.world.activeSettlementId!].inventory;
 for(const p of OUTSIDE_PLOTS){
  const o=society.outside[p.id];if(!o.wild||o.clearWorkers===0)continue;
  const work=O.clearWork[p.terrain];
  o.clearMilli=safe(o.clearMilli+Math.min(work-o.clearMilli,safe(o.clearWorkers*1000)));
  if(o.clearMilli<work)continue;
  o.wild=false;o.clearWorkers=0;report.cleared.push(p.id);
  if(p.terrain==='forest')stocks.wood=safe(stocks.wood+O.forestClearWoodMilli);
 }
 const research=society.research,topic=research.topic;
 if(topic!==null){
  const needed=O.research[topic].workMilli;
  for(const t of s.tiles){
   const b=t.building;
   if(!b?.enabled||b.typeId!=='library'||!operatingIds.has(t.id)||b.workers!==trialBuilding(b.typeId)!.maxWorkers*b.level)continue;
   research.progressMilli[topic]=safe(research.progressMilli[topic]+Math.min(Math.max(0,needed-research.progressMilli[topic]),safe(b.workers*1000)));
  }
  if(research.progressMilli[topic]>=needed){research.completed.push(topic);research.topic=null;report.researchCompleted.push(topic);}
 }
 for(const p of OUTSIDE_PLOTS){
  const o=society.outside[p.id];
  if(p.terrain==='forest')o.depositMilli=safe(o.depositMilli!+Math.min(O.forestRegrowMilli,o.capMilli!-o.depositMilli!));
  if((p.terrain==='ore'||p.terrain==='rock')&&o.depositMilli===0){
   const t=s.tiles.find(t=>t.id===p.id)!;
   if(t.terrain==='plain')continue;
   t.terrain='plain';t.building=null;report.exhausted.push(p.id);
  }
 }
}
