import { LAW_IDS, LAW_MESSAGES, LAW_TRIAL, previewLawVote, type LawId, CARD_OPTIONS, CRISIS_TRIAL, crisisOptions, societyPopulation, type CardOption } from '@haven/core';
import { cityHappiness, societyCounts } from './society-week.js';
import { RESEARCH_TOPICS,type ResearchTopic,OUTSIDE_TRIAL,outsidePlot,hasWeeklyKeys,isTileTrialPlanningState,isTileTrialState,SOCIETY_BUILDINGS,societyPlot,trialBuilding,type TileTrialResult,type TileTrialState } from '@haven/core';
import { runTileTrialWeek,trialSafe } from "./tile-trial-week.js";

export function executeTileTrialCommand(state: unknown, raw: unknown): TileTrialResult {
  const fail = (code: string, message: string): TileTrialResult => ({ success: false, state, error: { code, message } });
  try {
    if (!isTileTrialState(state) || !state.society || !state.goodsStock) return fail("INVALID_STATE", "Trial state is invalid; nothing was changed.");

    if (state.society.crisis.stage === 'fallen') return fail('CITY_FALLEN','The city has fallen. Start a New Game.');
    if (!raw || typeof raw !== "object" || !hasWeeklyKeys(raw, Object.keys(raw))) return fail("INVALID_COMMAND", "Command must contain plain data fields.");
    const c = { ...raw } as Record<string, unknown>;
    if (c.expectedRevision !== state.revision) return fail("STALE_COMMAND", "The plan changed. Refresh the action before retrying.");
    if (c.type === 'END_WEEK' && state.society.pendingCard) return fail('CARD_PENDING','Answer the crisis first.');
    if (state.phase === "report" && c.type !== "NEXT_WEEK" && c.type !== 'CHOOSE_CARD_OPTION') return fail("FORBIDDEN", "Read the report, then choose Plan next week.");
    if (state.phase === "planning" && c.type === "NEXT_WEEK") return fail("FORBIDDEN", "Finish this week before planning the next one.");
    const keys: Record<string, string[]> = {
      ENACT_LAW: ['lawId','lobby'], REPEAL_LAW: ['lawId'],
      CHOOSE_CARD_OPTION: ['cardId','option'], CLEAR: ['tileId','workers'], SET_RESEARCH: ['topic'], BUILD_DEEP_SHAFT: ['tileId'],
      EXTEND_WALL: [], SET_TRAINING: ["target"], END_WEEK: ["expectedWeek"], NEXT_WEEK: [], LOAD_TRIAL: ["snapshot"], BUILD: ["tileId", "typeId"], REPLACE: ["tileId", "typeId"],
      UPGRADE: ["tileId"], SET_WORKERS: ["tileId", "workers"], SET_ENABLED: ["tileId", "enabled"],
    };
    if (typeof c.type !== "string" || !Object.hasOwn(keys, c.type) || !hasWeeklyKeys(c, ["type", "expectedRevision", ...keys[c.type]])) return fail("INVALID_COMMAND", "Unknown command or fields.");
    if (['EXTEND_WALL','SET_TRAINING'].includes(c.type) && !state.society) return fail('UNSUPPORTED_RULESET','This command requires a society city.');
    let next = structuredClone(state) as TileTrialState;
    let report;
    if (c.type === 'ENACT_LAW') {
      const view=previewLawVote(next,c.lawId,c.lobby);
      if(view.refusal)return fail(view.refusal.code,view.refusal.message);
      const society=next.society!, laws=society.laws, lawId=c.lawId as LawId;
      const clamp=(n:number)=>Math.max(0,Math.min(100,n));
      next.world.settlements[next.world.activeSettlementId!].inventory.gold-=view.goldMilli;
      for(const group of view.groups)if(group.lobby==='force'){
        society.satisfaction[group.group]=clamp(society.satisfaction[group.group]+LAW_TRIAL.force.satisfaction);
        society.tension=clamp(society.tension+LAW_TRIAL.force.tension);
        society.standing=clamp(society.standing+LAW_TRIAL.force.standing);
      }
      if(view.groups.some(group=>group.lobby==='force'))next.happiness=cityHappiness(society.satisfaction,societyCounts(society),next.happiness);
      for(const group of view.groups)if(group.lobby==='promise')laws.promise={group:group.group,lawId,satisfactionAtVote:society.satisfaction[group.group],weeksLeft:LAW_TRIAL.promise.weeks};
      laws.active.push(lawId);laws.votedWeek=next.world.week;delete laws.repealedUntil[lawId];
    } else if(c.type==='REPEAL_LAW'){
      if(!LAW_IDS.includes(c.lawId as LawId))return fail('UNKNOWN_LAW',LAW_MESSAGES.UNKNOWN_LAW);
      const society=next.society!,lawId=c.lawId as LawId;
      if(!society.laws.active.includes(lawId))return fail('LAW_INACTIVE',LAW_MESSAGES.LAW_INACTIVE);
      society.laws.active=society.laws.active.filter(id=>id!==lawId);
      society.order.authority=Math.max(0,society.order.authority+LAW_TRIAL.repeal.authority);
      society.laws.repealedUntil[lawId]=trialSafe(next.world.week+LAW_TRIAL.repeal.cooldownWeeks);
    } else if (c.type === 'CHOOSE_CARD_OPTION') {
      const society=next.society!, card=society.pendingCard;
      if (!card || c.cardId!==card.id) return fail('UNKNOWN_CARD','This card is no longer waiting for an answer.');
      if (!CARD_OPTIONS.includes(c.option as CardOption)) return fail('UNKNOWN_OPTION','Choose Pay, Promise, Force or Refuse.');
      const inventory=next.world.settlements[next.world.activeSettlementId!].inventory;
      const population=societyPopulation(society);
      trialSafe(population*CRISIS_TRIAL.pay[card.kind].milliPerResident);
      const view=crisisOptions(card.kind,{population,goldMilli:inventory.gold,security:society.order.security,promisePending:society.crisis.promise!==null}).find(v=>v.option===c.option)!;
      if (!view.available) return fail('OPTION_UNAVAILABLE',view.reason!);
      const clamp=(n:number)=>Math.max(0,Math.min(100,n));
      inventory.gold-=view.goldMilli;
      society.tension=clamp(society.tension+view.tensionDelta);
      if (view.option==='promise') society.crisis.promise={stage:card.kind,weeksLeft:CRISIS_TRIAL.promise.weeks};
      if (view.option==='force') {
        society.order.authority=clamp(society.order.authority+CRISIS_TRIAL.force.authority);
        society.order.crime=clamp(society.order.crime+CRISIS_TRIAL.force.crime);
        for (const key of ['free','makers','luminaries','merchants','bound'] as const) society.satisfaction[key]=clamp(society.satisfaction[key]+CRISIS_TRIAL.force.satisfaction);
        next.happiness=cityHappiness(society.satisfaction,societyCounts(society),next.happiness);
      }
      society.crisis.lastChoice={stage:card.kind,option:view.option,goldMilli:view.goldMilli};
      society.pendingCard=null;
    } else if (c.type === 'SET_RESEARCH') {
      const research=next.society!.research, topic=c.topic as ResearchTopic|null;
      if(topic!==null && !RESEARCH_TOPICS.includes(topic))return fail('UNKNOWN_TOPIC','Choose a supported research topic.');
      if(topic!==null){
        if(research.completed.includes(topic))return fail('ALREADY_RESEARCHED','This topic is already completed.');
        if(!research.paid.includes(topic)){
          const inventory=next.world.settlements[next.world.activeSettlementId!].inventory;
          const cost=OUTSIDE_TRIAL.research[topic].goldMilli;
          if(inventory.gold<cost)return fail('INSUFFICIENT_RESOURCES','Not enough Gold for research.');
          inventory.gold-=cost;research.paid.push(topic);
        }
      }
      research.topic=topic;
    } else if (c.type === 'SET_TRAINING') {
      if (c.target !== null && !['makers','luminaries','merchants'].includes(c.target as string)) return fail('INVALID_COMMAND','Choose a training group.');
      next.society!.training.target = c.target as 'makers' | 'luminaries' | 'merchants' | null;
    } else if (c.type === 'EXTEND_WALL') {
      const ring = next.society!.wallRing;
      if (ring === 3) return fail('WALL_COMPLETE','All wall rings are open.');
      const prerequisite = ring === 1 ? 'builders-yard' : 'town-hall';
      if (!next.tiles.some(t=>t.building?.typeId === prerequisite && t.building.enabled && t.building.workers === trialBuilding(prerequisite)!.maxWorkers*t.building.level)) return fail('PREREQUISITE_MISSING','An operating prerequisite building is required.');
      const inventory = next.world.settlements[next.world.activeSettlementId!].inventory;
      const costs = ring === 1 ? {gold:30000,wood:20000,iron:10000} : {gold:60000,wood:40000,iron:20000};
      for (const key of ['gold','wood','iron'] as const) if (inventory[key]<costs[key]) return fail('INSUFFICIENT_RESOURCES','Not enough resources to extend the wall.');
      const stone=ring===2?OUTSIDE_TRIAL.wallRing3StoneMilli:0;
      if(next.society!.stocksMilli.stone<stone)return fail('INSUFFICIENT_RESOURCES','Not enough Stone to extend the wall.');
      for (const key of ['gold','wood','iron'] as const) inventory[key]-=costs[key];
      next.society!.stocksMilli.stone-=stone;
      next.society!.wallRing = ring === 1 ? 2 : 3;
    } else if (c.type === "LOAD_TRIAL") {
      if (c.snapshot && typeof c.snapshot === 'object' && !Object.hasOwn(c.snapshot, 'society')) return fail('INVALID_STATE', 'Checkpoint economy is incompatible with this society city.');
      if (!isTileTrialPlanningState(c.snapshot) || !c.snapshot.society) return fail("INVALID_SAVE_STATE", "Checkpoint must contain a valid society Planning state.");
      next = structuredClone(c.snapshot);
      next.revision = Math.max(state.revision, next.revision);
    } else if (c.type === "END_WEEK") {
      if (c.expectedWeek !== state.world.week) return fail("WEEK_MISMATCH", "The week changed; this command was not applied.");
      report = runTileTrialWeek(next);
    } else if (c.type === "NEXT_WEEK") next.phase = "planning";
    else {
      const tile = next.tiles.find(t => t.id === c.tileId);
      if (!tile) return fail("INVALID_TILE", "Select a valid tile.");
      const outside=outsidePlot(tile.id), plotState=next.society!.outside[tile.id];
      if(['CLEAR','BUILD','REPLACE','UPGRADE','BUILD_DEEP_SHAFT'].includes(c.type) && outside){
        if(outside.ring>next.society!.wallRing)return fail('LOCKED_PLOT','Extend the wall first.');
        if(c.type!=='CLEAR'&&plotState.wild)return fail('WILD_PLOT','Clear this plot before building.');
      }
      if(c.type==='CLEAR'){
        if(!outside)return fail('NOT_OUTSIDE','Choose an outside plot.');
        if(!plotState.wild)return fail('NOT_WILD','This plot is already cleared.');
        if(!Number.isSafeInteger(c.workers)||(c.workers as number)<0)return fail('INVALID_WORKFORCE','Use whole nonnegative clearing workers.');
        const inventory=next.world.settlements[next.world.activeSettlementId!].inventory;
        if((c.workers as number)>0&&!plotState.clearPaid){
          if(inventory.gold<OUTSIDE_TRIAL.clearFeeGoldMilli)return fail('INSUFFICIENT_RESOURCES','Not enough Gold to start clearing.');
          inventory.gold-=OUTSIDE_TRIAL.clearFeeGoldMilli;plotState.clearPaid=true;
        }
        plotState.clearWorkers=c.workers as number;
      } else if(c.type==='BUILD_DEEP_SHAFT'){
        if(!next.society!.research.completed.includes('deep-mining'))return fail('RESEARCH_REQUIRED','Complete Deep Mining first.');
        if(!outside || (outside.terrain!=='ore'&&outside.terrain!=='rock'))return fail('NOT_A_MINE','Choose an Iron Mine or Quarry.');
        if(plotState.depositMilli===0)return fail('DEPOSIT_EXHAUSTED','This deposit is exhausted.');
        if(tile.building?.typeId!=='mine'&&tile.building?.typeId!=='quarry')return fail('NOT_A_MINE','Choose an Iron Mine or Quarry.');
        if(plotState.deepShaft)return fail('ALREADY_DEEP','This plot already has a Deep Shaft.');
        const inventory=next.world.settlements[next.world.activeSettlementId!].inventory, discount=constructionDiscount(state);
        const cost=OUTSIDE_TRIAL.deepShaft;
        const gold=discounted(cost.goldMilli,discount), wood=discounted(cost.woodMilli,discount), stone=discounted(cost.stoneMilli,discount);
        if(inventory.gold<gold||inventory.wood<wood||next.society!.stocksMilli.stone<stone)return fail('INSUFFICIENT_RESOURCES','Not enough resources for a Deep Shaft.');
        const cap=trialSafe(plotState.capMilli!+cost.depositBonusMilli), deposit=trialSafe(plotState.depositMilli!+cost.depositBonusMilli);
        inventory.gold-=gold;inventory.wood-=wood;next.society!.stocksMilli.stone-=stone;
        plotState.capMilli=cap;plotState.depositMilli=deposit;plotState.deepShaft=true;
      } else if (["BUILD", "REPLACE", "UPGRADE"].includes(c.type)) {
        const typeId = c.type === "UPGRADE" ? tile.building?.typeId : c.typeId;
        if (state.society) {
          const plot = societyPlot(tile.id), info = typeof typeId === 'string' && Object.hasOwn(SOCIETY_BUILDINGS,typeId) ? SOCIETY_BUILDINGS[typeId] : undefined;
          if (plot && plot.ring > state.society.wallRing) return fail('LOCKED_PLOT','Extend the wall first.');
          if (info?.reserved) return fail('NOT_AVAILABLE','This building is reserved.');
          if (plot && info && plot.tier !== info.tier && plot.tier !== info.alsoTier) return fail('WRONG_TIER','Choose the matching plot tier.');
          if (typeId === 'market' || (info && !plot) || (plot && !info)) return fail('INVALID_PLACEMENT','Choose a supported plot.');
        }
        const d = typeof typeId === "string" ? trialBuilding(typeId) : undefined;
        if (!d || typeof typeId !== "string") return fail("INVALID_BUILDING", "Select a known building type.");
        if (!d.terrain.includes(tile.terrain)) return fail("INVALID_PLACEMENT", `${d.name} requires ${d.terrain.join(" or ")} terrain.`);
        if (c.type === "BUILD" && tile.building) return fail("OCCUPIED", "This tile is occupied; use Replace or Upgrade.");
        if (c.type !== "BUILD" && !tile.building) return fail("EMPTY_TILE", "Build a building on this tile first.");
        const level = c.type === "UPGRADE" ? tile.building!.level + 1 : 1;
        if (level > d.maxLevel) return fail("MAX_LEVEL", "This building is at its trial maximum level.");
        const inventory = next.world.settlements[next.world.activeSettlementId!].inventory;
        const discount=constructionDiscount(state);
        const costs = { gold: trialSafe(d.cost.gold * level), wood: trialSafe(d.cost.wood * level), iron: trialSafe(d.cost.iron * level) };
        for (const key of ['gold','wood','iron'] as const) costs[key] = discounted(costs[key],discount);
        for (const key of ["gold", "wood", "iron"] as const) if (inventory[key] < costs[key]) return fail("INSUFFICIENT_RESOURCES", `Not enough ${key} for this action.`);
        for (const key of ["gold", "wood", "iron"] as const) inventory[key] -= costs[key];
        const stone=level===3?discounted(OUTSIDE_TRIAL.level3StoneMilli,discount):0;
        if(next.society!.stocksMilli.stone<stone)return fail('INSUFFICIENT_RESOURCES','Not enough Stone for level three.');
        next.society!.stocksMilli.stone-=stone;
        tile.building = { typeId, level, workers: c.type === "UPGRADE" ? tile.building!.workers : 0, enabled: c.type === "UPGRADE" ? tile.building!.enabled : true };
      } else {
        if (!tile.building) return fail("EMPTY_TILE", "Build a building on this tile first.");
        if (c.type === "SET_WORKERS") {
          if (!tile.building.enabled || !Number.isSafeInteger(c.workers) || (c.workers as number) < 0) return fail("INVALID_WORKFORCE", "Use whole nonnegative workers on an active building.");
          tile.building.workers = c.workers as number;
        } else {
          if (typeof c.enabled !== "boolean") return fail("INVALID_COMMAND", "Active must be true or false.");
          tile.building.enabled = c.enabled;
          if (!c.enabled) tile.building.workers = 0;
        }
      }
    }
    next.revision = trialSafe(next.revision + 1);
    if (!isTileTrialState(next)) return fail("INVALID_PLAN", "The action exceeds building capacity or the shared workforce pool.");
    return { success: true, nextState: next, ...(report ? { report } : {}) };
  } catch { return fail("EXECUTION_ERROR", "The action failed validation or safe arithmetic; the original state was preserved."); }
}

function constructionDiscount(state:TileTrialState):number {
 let discount=0;
 for(const {building:b} of state.tiles)if(b?.typeId==='builders-yard'&&b.enabled&&b.workers===trialBuilding(b.typeId)!.maxWorkers*b.level)discount=Math.max(discount,b.level*10);
 return discount;
}
const discounted=(cost:number,discount:number):number=>trialSafe(Number(BigInt(cost)*BigInt(100-discount)/100n));
