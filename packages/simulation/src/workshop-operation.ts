import { LAW_CATALOG, lawTerms, ITEM_CATALOG, ITEM_TRIAL, effectiveSkills, isWearable, isOpenItemSlot,
  TILE_TRIAL_BALANCE as B, OUTSIDE_TRIAL as O, buildingWorkerCap, trialBuilding,
  type ItemWeekContext, type TileTrialReport, type TileTrialState, type WeeklyResource, type WorldNpc } from '@haven/core';
import { authorityTaxBps } from './order-week.js';
import { FARM_GOLD_PER_BATCH_MILLI, FARM_MAX_BATCHES, FARM_WHEAT_PER_BATCH_MILLI } from './weekly.js';

type PostContext=Pick<ItemWeekContext,'postSkills'|'postTraits'>;
export type WorkshopTileOperation={operating:boolean;reason?:'upkeep'|'herbs'|'disabled'|'staff'};

// The panel has posted NPCs; End Week already has their effective item context.
// Both forms feed the same allocation below, without a Player dependency.
function postContext(state:TileTrialState,context:ItemWeekContext|readonly WorldNpc[]|undefined):PostContext|undefined {
  if(!context||'postSkills' in context)return context;
  const equipped=state.society!.items.equipped,postSkills:PostContext['postSkills']={},postTraits:PostContext['postTraits']={};
  for(const npc of context)if(npc.postTileId){
    const worn=Object.values(Object.hasOwn(equipped,npc.character.id)?equipped[npc.character.id]:{}).map(item=>ITEM_CATALOG[item.defId]);
    postSkills[npc.postTileId]=effectiveSkills(npc.character.skills,worn,npc.character.socialClass);
    postTraits[npc.postTileId]=worn.filter(d=>isWearable(d)&&isOpenItemSlot(d.slot)&&(!d.exclusiveClass||d.exclusiveClass===npc.character.socialClass)&&d.trait).map(d=>d.trait!);
  }
  return {postSkills,postTraits};
}

export function trialSafe(n: number): number {
  if (!Number.isSafeInteger(n) || n < 0) throw Error("Trial arithmetic exceeds safe nonnegative integer bounds.");
  return n;
}
export function scaled(a: number, b: number, divisor = 1): number {
  const result = BigInt(a) * BigInt(b) / BigInt(divisor);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw Error("Trial arithmetic overflow.");
  return Number(result);
}
export function itemOutput(amount:number,tileId:string,skill:'management'|'technical',ctx?:PostContext):number {
  const skills=ctx?.postSkills[tileId];if(!skills)return amount;
  const effects=ITEM_TRIAL.effects;
  const skillPercent=Math.min(effects.outputCapPercent,Math.floor(Math.max(0,skills[skill]-effects.threshold)/effects.outputStep)*effects.outputPercent);
  const ledgerPercent=ctx?.postTraits[tileId]?.includes('ledger')?effects.ledgerOutputPercent:0;
  return scaled(amount,100+skillPercent+ledgerPercent,100);
}

// Pure End Week prelude. Only local stocks and plot copies are changed. The
// returned effects are applied by End Week; UI callers only read tile statuses.
export function resolveWorkshopOperation(input:TileTrialState,context?:ItemWeekContext|readonly WorldNpc[]) {
  if(!input.society||!input.goodsStock)throw Error('Invalid society city.');
  const s={...input,society:{...input.society,stocksMilli:{...input.society.stocksMilli},
    outside:Object.fromEntries(Object.entries(input.society.outside).map(([id,plot])=>[id,{...plot}]))}};
  const ctx=postContext(s,context);
  const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = { ...settlement.inventory };
  const orderBefore = {...s.society.order};
  const before = { ...stocks }; const activities: string[] = [];
  const outside: NonNullable<TileTrialReport['outside']> = {producedMilli:{wood:0,iron:0,stone:0,wool:0,herbs:0,cloth:0},stocksBefore:{...s.society.stocksMilli},stocksAfter:{...s.society.stocksMilli},hospitalsIdle:[],cleared:[],researchCompleted:[],exhausted:[],spoiledMilli:{}};
  const newStocks=s.society.stocksMilli;
  const add = (key: WeeklyResource, amount: number) => { stocks[key] = trialSafe(stocks[key] + amount); };
  const population = settlement.cohorts.reduce((n, c) => trialSafe(n + c.count), 0);
  const baseTaxMilli=scaled(population,B.taxGoldPerResident);
  const taxModifierBps=authorityTaxBps(orderBefore.authority)+lawTerms(s.society.laws.active).taxBps;
  const creditedTaxMilli=taxModifierBps<0?scaled(baseTaxMilli,10000+taxModifierBps,10000):baseTaxMilli;
  add('gold',creditedTaxMilli);
  for(const id of s.society.laws.active)add('gold',LAW_CATALOG[id].effect.incomeMilli??0);
  let farmBatchGoldMilli = 0, farmExtraUpkeepMilli = 0, upkeepPaidMilli = 0, unpaidUpkeepMilli = 0;
  const funded: typeof s.tiles = [];
  const fundedTileIds: string[] = [];
  let farmBatches = 0, woodProducedMilli = 0, ironProducedMilli = 0, operatingDebitMilli = 0;
  for (const tile of s.tiles) {
    const b = tile.building; if (!b || !b.enabled) continue;
    const d = trialBuilding(b.typeId)!; const due = scaled(d.upkeepMilli, b.level);
    const batches = d.operation === "farm" ? Math.min(b.workers, FARM_MAX_BATCHES, Math.floor(stocks.gold / FARM_GOLD_PER_BATCH_MILLI)) : 0;
    const batchGold = batches * FARM_GOLD_PER_BATCH_MILLI;
    const extra = Math.max(0, due - batchGold); const debit = trialSafe(batchGold + extra);
    if (stocks.gold < debit) {
      unpaidUpkeepMilli = trialSafe(unpaidUpkeepMilli + due);
      activities.push(`${tile.id}: ${d.name} idle; upkeep unfunded.`); continue;
    }
    stocks.gold -= debit; upkeepPaidMilli = trialSafe(upkeepPaidMilli + due);
    fundedTileIds.push(tile.id); operatingDebitMilli = trialSafe(operatingDebitMilli + debit);
    if (d.operation === "farm") {
      farmBatches += batches;
      farmBatchGoldMilli = trialSafe(farmBatchGoldMilli + batchGold); farmExtraUpkeepMilli = trialSafe(farmExtraUpkeepMilli + extra);
      add("wheat", itemOutput(batches * FARM_WHEAT_PER_BATCH_MILLI,tile.id,'management',ctx));
      activities.push(`${tile.id}: Farm ${batches} batches; batch Gold credited against this Farm upkeep.`);
    } else funded.push(tile);
  }
  // Extraction precedes Hospital inputs and processing, independent of placement order.
  for(const tile of funded){
    const b=tile.building!,d=trialBuilding(b.typeId)!,plot=s.society.outside[tile.id];
    if(d.operation==='logging'||d.operation==='mine'||d.operation==='stone'){
      if(d.operation==='stone'&&b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
      const good=d.operation==='logging'?'wood':d.operation==='mine'?'iron':'stone';
      const rate=good==='wood'?B.loggingWoodPerWorker:good==='iron'?B.mineIronPerWorker:O.perWorker.stone;
      const wanted=itemOutput(scaled(scaled(b.workers,rate),plot.deepShaft?O.deepShaft.outputBps:10000,10000),tile.id,'technical',ctx);
      const output=Math.min(wanted,plot.depositMilli!);plot.depositMilli!-=output;
      if(good==='stone')newStocks.stone=trialSafe(newStocks.stone+output);else add(good,output);
      outside.producedMilli[good]=trialSafe(outside.producedMilli[good]+output);
      if(good==='wood')woodProducedMilli=trialSafe(woodProducedMilli+output);
      if(good==='iron')ironProducedMilli=trialSafe(ironProducedMilli+output);
      activities.push(`${tile.id}: extracted ${good==='wood'?'Wood':good==='iron'?'Iron':'Stone'}.`);
    }
    if((d.operation==='wool'||d.operation==='herbs')&&b.workers===buildingWorkerCap(b.typeId,b.level)){
      const good=d.operation,output=itemOutput(scaled(b.workers,O.perWorker[good]),tile.id,'management',ctx);
      newStocks[good]=trialSafe(newStocks[good]+output);outside.producedMilli[good]=trialSafe(outside.producedMilli[good]+output);
    }
  }
  const operatingIds=new Set(fundedTileIds);
  for(const tile of funded){
    const b=tile.building!;if(b.typeId!=='hospital'||b.workers!==buildingWorkerCap(b.typeId,b.level))continue;
    const due=scaled(b.level,O.hospitalHerbsPerLevelMilli);
    if(newStocks.herbs<due){operatingIds.delete(tile.id);outside.hospitalsIdle.push(tile.id);}else newStocks.herbs-=due;
  }

  const byTile:Record<string,WorkshopTileOperation>={};
  for(const tile of s.tiles){
    const b=tile.building;
    byTile[tile.id]=!b?.enabled?{operating:false,reason:'disabled'}:
      !fundedTileIds.includes(tile.id)?{operating:false,reason:'upkeep'}:
      (b.typeId==='hospital'&&b.workers!==buildingWorkerCap(b.typeId,b.level))||(b.typeId==='smithy'&&b.workers===0)?{operating:false,reason:'staff'}:
      !operatingIds.has(tile.id)?{operating:false,reason:'herbs'}:{operating:true};
  }
  // Keep the legacy funded service set: its consumers apply their own staffing
  // gates. byTile also includes the stricter Smithy/Hospital crafting gates.
  return {byTile,operatingIds,fundedTileIds,fundedNonFarmTileIds:funded.map(tile=>tile.id),
    stocks,stocksMilli:newStocks,outsidePlots:s.society.outside,before,orderBefore,activities,outside,
    population,baseTaxMilli,taxModifierBps,creditedTaxMilli,farmBatchGoldMilli,farmExtraUpkeepMilli,
    upkeepPaidMilli,unpaidUpkeepMilli,farmBatches,woodProducedMilli,ironProducedMilli,operatingDebitMilli};
}
