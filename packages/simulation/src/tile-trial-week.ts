import { resolveOrderWeek } from './order-week.js';
import { TILE_TRIAL_BALANCE as B,GOODS_STOCK_TRIAL as G,OUTSIDE_TRIAL as O,societyPopulation,trialBuilding,type TileTrialReport,type TileTrialState,type WeeklyResource } from '@haven/core';
import { releaseSocietyWorkers,societyEmployment,societyFacilities } from './society-facilities.js';
import { allocateRequirements,resolveSocietyWeek } from './society-week.js';
import { finishOutsideLand,spoilOutsideStocks } from './outside-week.js';
import { resolveTrialImmigration } from "./tile-trial-immigration.js";
import { FARM_GOLD_PER_BATCH_MILLI,FARM_MAX_BATCHES,FARM_WHEAT_PER_BATCH_MILLI,PROCESSOR_FOOD_PER_BATCH_MILLI,PROCESSOR_MAX_BATCHES,PROCESSOR_WHEAT_PER_BATCH_MILLI } from "./weekly.js";

export function trialSafe(n: number): number {
  if (!Number.isSafeInteger(n) || n < 0) throw Error("Trial arithmetic exceeds safe nonnegative integer bounds.");
  return n;
}
function scaled(a: number, b: number, divisor = 1): number {
  const result = BigInt(a) * BigInt(b) / BigInt(divisor);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw Error("Trial arithmetic overflow.");
  return Number(result);
}
export function runTileTrialWeek(s: TileTrialState): Readonly<TileTrialReport> {
  if (!s.society || !s.goodsStock) throw Error('Invalid society city.');
  const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = settlement.inventory;
  const orderBefore = {...s.society.order};
  const before = { ...stocks }; const activities: string[] = [];
  const outside: NonNullable<TileTrialReport['outside']> = {producedMilli:{wood:0,iron:0,stone:0,wool:0,herbs:0,cloth:0},stocksBefore:{...s.society.stocksMilli},stocksAfter:{...s.society.stocksMilli},hospitalsIdle:[],cleared:[],researchCompleted:[],exhausted:[],spoiledMilli:{}};
  const newStocks=s.society.stocksMilli;
  const add = (key: WeeklyResource, amount: number) => { stocks[key] = trialSafe(stocks[key] + amount); };
  const population = settlement.cohorts.reduce((n, c) => trialSafe(n + c.count), 0);
  let taxMilli = scaled(population, B.taxGoldPerResident); add("gold", taxMilli);
  let farmBatchGoldMilli = 0, farmExtraUpkeepMilli = 0, upkeepPaidMilli = 0, unpaidUpkeepMilli = 0, marketCapacity = 0;
  const funded: typeof s.tiles = [];
  const fundedTileIds: string[] = [];
  let farmBatches = 0, processorBatches = 0, woodProducedMilli = 0, ironProducedMilli = 0, operatingDebitMilli = 0;
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
      add("wheat", batches * FARM_WHEAT_PER_BATCH_MILLI);
      activities.push(`${tile.id}: Farm ${batches} batches; batch Gold credited against this Farm upkeep.`);
    } else funded.push(tile);
  }
  // Extraction precedes Hospital inputs and processing, independent of placement order.
  for(const tile of funded){
    const b=tile.building!,d=trialBuilding(b.typeId)!,plot=s.society.outside[tile.id];
    if(d.operation==='logging'||d.operation==='mine'||d.operation==='stone'){
      if(d.operation==='stone'&&b.workers!==d.maxWorkers*b.level)continue;
      const good=d.operation==='logging'?'wood':d.operation==='mine'?'iron':'stone';
      const rate=good==='wood'?B.loggingWoodPerWorker:good==='iron'?B.mineIronPerWorker:O.perWorker.stone;
      const wanted=scaled(scaled(b.workers,rate),plot.deepShaft?O.deepShaft.outputBps:10000,10000);
      const output=Math.min(wanted,plot.depositMilli!);plot.depositMilli!-=output;
      if(good==='stone')newStocks.stone=trialSafe(newStocks.stone+output);else add(good,output);
      outside.producedMilli[good]=trialSafe(outside.producedMilli[good]+output);
      if(good==='wood')woodProducedMilli=trialSafe(woodProducedMilli+output);
      if(good==='iron')ironProducedMilli=trialSafe(ironProducedMilli+output);
      activities.push(`${tile.id}: extracted ${good==='wood'?'Wood':good==='iron'?'Iron':'Stone'}.`);
    }
    if((d.operation==='wool'||d.operation==='herbs')&&b.workers===d.maxWorkers*b.level){
      const good=d.operation,output=scaled(b.workers,O.perWorker[good]);
      newStocks[good]=trialSafe(newStocks[good]+output);outside.producedMilli[good]=trialSafe(outside.producedMilli[good]+output);
    }
  }
  const operatingIds=new Set(fundedTileIds);
  for(const tile of funded){
    const b=tile.building!;if(b.typeId!=='hospital'||b.workers!==trialBuilding(b.typeId)!.maxWorkers*b.level)continue;
    const due=scaled(b.level,O.hospitalHerbsPerLevelMilli);
    if(newStocks.herbs<due){operatingIds.delete(tile.id);outside.hospitalsIdle.push(tile.id);}else newStocks.herbs-=due;
  }
  const facilities = societyFacilities(s, operatingIds);
  if (facilities) {
    const adjusted = scaled(taxMilli, 100 + 10 * facilities.countingHouseLevels, 100);
    add('gold', adjusted - taxMilli); taxMilli = adjusted;
  }
  let luxuryImportedMilli = 0;
  for (const tile of funded) {
    const b = tile.building!;
    if (b.typeId !== 'trading-post' || b.workers !== trialBuilding(b.typeId)!.maxWorkers * b.level) continue;
    const cost = scaled(3000, b.level);
    if (stocks.gold < cost) continue;
    stocks.gold -= cost; luxuryImportedMilli = trialSafe(luxuryImportedMilli + scaled(2000, b.level));
  }
  // Every extraction completes before any processing, independent of placement order.
  for (const tile of funded) {
    const b = tile.building!; const d = trialBuilding(b.typeId)!;
    if (d.operation === "market" && (b.typeId === 'town-market' && b.workers === d.maxWorkers * b.level)) marketCapacity = trialSafe(marketCapacity + scaled(b.level, G.capacityPerLevelMilli));
  }
  for (const tile of funded) {
    const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== "processor") continue;
    const batches = Math.min(b.workers, PROCESSOR_MAX_BATCHES, Math.floor(stocks.wheat / PROCESSOR_WHEAT_PER_BATCH_MILLI));
    processorBatches += batches;
    stocks.wheat -= batches * PROCESSOR_WHEAT_PER_BATCH_MILLI; add("food", batches * PROCESSOR_FOOD_PER_BATCH_MILLI);
    activities.push(`${tile.id}: Food Processor ${batches} batches.`);
  }
  for(const tile of funded){
    const b=tile.building!,d=trialBuilding(b.typeId)!;if(d.operation!=='cloth'||b.workers!==d.maxWorkers*b.level)continue;
    const batches=Math.min(b.workers,Math.floor(newStocks.wool/O.weaver.woolPerBatchMilli));
    newStocks.wool-=scaled(batches,O.weaver.woolPerBatchMilli);
    const output=scaled(batches,O.weaver.clothPerBatchMilli);newStocks.cloth=trialSafe(newStocks.cloth+output);outside.producedMilli.cloth=trialSafe(outside.producedMilli.cloth+output);
  }
  const societyDemand = allocateRequirements({society:s.society!,foodAvailableMilli:0,goodsServableMilli:Number.MAX_SAFE_INTEGER,luxuryImportedMilli:0}).goodsConsumedMilli;
  const demandMilli = societyDemand; let servedMilli = 0, woodUsed = 0, ironUsed = 0;
  let goodsStock: TileTrialReport['goodsStock'];
  {
    const openingMilli = s.goodsStock!.amountMilli;
    let producedMilli = 0;
    for (const tile of funded) {
      const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== 'goods') continue;
      const clothBatches=population===0?0:Math.min(b.workers,Math.floor(newStocks.cloth/O.workshopClothRecipe.clothMilli),Math.floor(stocks.wood/O.workshopClothRecipe.woodMilli));
      const clothWood=scaled(clothBatches,O.workshopClothRecipe.woodMilli);
      const plainBatches=population===0?0:Math.min(b.workers-clothBatches,Math.floor((stocks.wood-clothWood)/G.woodPerBatchMilli));
      const batches=clothBatches+plainBatches;
      newStocks.cloth-=scaled(clothBatches,O.workshopClothRecipe.clothMilli);
      const wood=trialSafe(clothWood+scaled(plainBatches,G.woodPerBatchMilli));
      stocks.wood -= wood; woodUsed = trialSafe(woodUsed + wood);
      producedMilli = trialSafe(producedMilli + scaled(batches, G.goodsPerBatchMilli));
      activities.push(`${tile.id}: Goods Workshop ${batches} batches; Goods stored, Wood charged once.`);
    }
    const available = trialSafe(openingMilli + producedMilli);
    servedMilli = Math.min(available, demandMilli, marketCapacity);
    const closingMilli = available - servedMilli, unmetMilli = demandMilli - servedMilli;
    s.goodsStock!.amountMilli = closingMilli;
    goodsStock = Object.freeze({ openingMilli, producedMilli, distributedMilli: servedMilli, closingMilli, demandMilli, unmetMilli,
      capacityMilli: marketCapacity, limitedBy: unmetMilli === 0 ? 'none' : marketCapacity <= available ? 'capacity' : 'stock' });
  }
  const fulfillmentBps = demandMilli === 0 ? 10000 : scaled(servedMilli, 10000, demandMilli);
  const revenueMilli = scaled(servedMilli, G.goldPerGoodsMilli, 1000); add("gold", revenueMilli);
  const happinessBefore = s.happiness;
  let foodDemandMilli: number, foodConsumedMilli: number;
  let immigration: ReturnType<typeof resolveTrialImmigration> | undefined;
  let societyReport: TileTrialReport['society'];
  let trainingGoldMilli = 0;
  {
    const allocated = allocateRequirements({society:s.society!,foodAvailableMilli:stocks.food,goodsServableMilli:servedMilli,luxuryImportedMilli});
    foodDemandMilli = allocateRequirements({society:s.society!,foodAvailableMilli:Number.MAX_SAFE_INTEGER,goodsServableMilli:0,luxuryImportedMilli:0}).foodConsumedMilli;
    foodConsumedMilli = allocated.foodConsumedMilli;
    immigration = resolveTrialImmigration(s, {fundedTileIds,farmBatches,processorBatches,woodProducedMilli,ironProducedMilli,operatingDebitMilli,foodDemandMilli,foodConsumedMilli,unpaidUpkeepMilli});
    const resolved = resolveSocietyWeek({society:s.society!,foodAvailableMilli:stocks.food,goodsServableMilli:servedMilli,luxuryImportedMilli,facilities:facilities!,employment:societyEmployment(s),arrivalsBudget:immigration.arrivals,goldAvailableMilli:stocks.gold});
    stocks.food -= resolved.foodConsumedMilli; stocks.gold -= resolved.goldSpentMilli;
    trainingGoldMilli = resolved.goldSpentMilli; s.society = resolved.society;
    s.happiness = resolved.cityHappiness; societyReport = resolved.report;
    settlement.cohorts.find(c=>c.id==='weekly_middle')!.count = societyPopulation(resolved.society);
    finishOutsideLand(s,operatingIds,outside);
    activities.push(...releaseSocietyWorkers(s));
    const arrivals = Object.values(resolved.report.classes).reduce((total,c)=>trialSafe(total+c.arrivals),0);
    immigration = Object.freeze({...immigration, arrivals:trialSafe(arrivals+(resolved.report.eliteArrived===null?0:1)), populationAfter:societyPopulation(resolved.society)});
  }
  s.world.week = trialSafe(s.world.week + 1); s.phase = "report";
  const order = resolveOrderWeek(s,operatingIds,{before:orderBefore,taxModifierBps:0,taxDeltaMilli:0,arrivalsBudgetBefore:immigration!.arrivals,arrivalsBudgetAfter:immigration!.arrivals});
  spoilOutsideStocks(s,operatingIds,outside);
  if(goodsStock)goodsStock=Object.freeze({...goodsStock,closingMilli:s.goodsStock.amountMilli});
  outside.stocksAfter={...s.society.stocksMilli};
  const goods = Object.freeze({ demandMilli, servedMilli, fulfillmentBps, woodUsed, ironUsed, revenueMilli });
  return Object.freeze({ order, outside, week: s.world.week - 1, before: Object.freeze(before), after: Object.freeze({ ...stocks }), taxMilli, farmBatchGoldMilli, farmExtraUpkeepMilli, upkeepPaidMilli, unpaidUpkeepMilli, foodDemandMilli, foodConsumedMilli, happinessBefore, happinessAfter: s.happiness, goods, ...(goodsStock ? { goodsStock } : {}), ...(societyReport ? { society:societyReport,luxuryImportedMilli,trainingGoldMilli } : {}), activities: Object.freeze(activities), ...(immigration ? { immigration } : {}) });
}
