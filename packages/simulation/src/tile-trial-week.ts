import { TILE_TRIAL_BALANCE as B, trialBuilding, LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type TileTrialRuleset, type TileTrialState, type TileTrialReport, type WeeklyResource } from "@haven/core";
import { FARM_MAX_BATCHES, PROCESSOR_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI, FARM_WHEAT_PER_BATCH_MILLI, PROCESSOR_WHEAT_PER_BATCH_MILLI, PROCESSOR_FOOD_PER_BATCH_MILLI } from "./weekly.js";
import { resolveTileTrialNeeds } from "./tile-trial-needs.js";
import { resolveTrialImmigration } from "./tile-trial-immigration.js";
import { cityEconomyRuleset, GOODS_STOCK_RULESET, GOODS_STOCK_TRIAL as G } from '@haven/core';

export function trialSafe(n: number): number {
  if (!Number.isSafeInteger(n) || n < 0) throw Error("Trial arithmetic exceeds safe nonnegative integer bounds.");
  return n;
}
function scaled(a: number, b: number, divisor = 1): number {
  const result = BigInt(a) * BigInt(b) / BigInt(divisor);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw Error("Trial arithmetic overflow.");
  return Number(result);
}
export function runTileTrialWeek(s: TileTrialState, ruleset: TileTrialRuleset = LEGACY_TILE_RULESET): Readonly<TileTrialReport> {
  const economy = cityEconomyRuleset(s, ruleset);
  if (economy === null) throw Error('Invalid city economy.');
  const storedGoods = economy === GOODS_STOCK_RULESET;
  const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = settlement.inventory;
  const before = { ...stocks }; const activities: string[] = [];
  const add = (key: WeeklyResource, amount: number) => { stocks[key] = trialSafe(stocks[key] + amount); };
  const population = settlement.cohorts.reduce((n, c) => trialSafe(n + c.count), 0);
  const taxMilli = scaled(population, B.taxGoldPerResident); add("gold", taxMilli);
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
  // Every extraction completes before any processing, independent of placement order.
  for (const tile of funded) {
    const b = tile.building!; const d = trialBuilding(b.typeId)!;
    if (d.operation === "logging") { const output = scaled(b.workers, B.loggingWoodPerWorker); add("wood", output); woodProducedMilli = trialSafe(woodProducedMilli + output); activities.push(`${tile.id}: extracted Wood.`); }
    if (d.operation === "mine") { const output = scaled(b.workers, B.mineIronPerWorker); add("iron", output); ironProducedMilli = trialSafe(ironProducedMilli + output); activities.push(`${tile.id}: extracted Iron.`); }
    if (d.operation === "market") marketCapacity = trialSafe(marketCapacity + scaled(b.level, storedGoods ? G.capacityPerLevelMilli : B.marketServicePerLevel));
  }
  for (const tile of funded) {
    const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== "processor") continue;
    const batches = Math.min(b.workers, PROCESSOR_MAX_BATCHES, Math.floor(stocks.wheat / PROCESSOR_WHEAT_PER_BATCH_MILLI));
    processorBatches += batches;
    stocks.wheat -= batches * PROCESSOR_WHEAT_PER_BATCH_MILLI; add("food", batches * PROCESSOR_FOOD_PER_BATCH_MILLI);
    activities.push(`${tile.id}: Food Processor ${batches} batches.`);
  }
  const demandMilli = scaled(population, storedGoods ? G.demandPerResidentMilli : B.goodsDemandPerResident); let servedMilli = 0, woodUsed = 0, ironUsed = 0;
  let goodsStock: TileTrialReport['goodsStock'];
  if (storedGoods) {
    const openingMilli = s.goodsStock!.amountMilli;
    let producedMilli = 0;
    for (const tile of funded) {
      const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== 'goods') continue;
      const batches = population === 0 ? 0 : Math.min(b.workers, Math.floor(stocks.wood / G.woodPerBatchMilli));
      const wood = scaled(batches, G.woodPerBatchMilli);
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
  } else {
    for (const tile of funded) {
      const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== "goods") continue;
      const remaining = Math.max(0, Math.min(demandMilli, marketCapacity) - servedMilli);
      const batches = Math.min(b.workers, Math.ceil(remaining / B.goodsServicePerBatch), Math.floor(stocks.wood / B.goodsWoodPerBatch), Math.floor(stocks.iron / B.goodsIronPerBatch));
      const wood = scaled(batches, B.goodsWoodPerBatch), iron = scaled(batches, B.goodsIronPerBatch);
      stocks.wood -= wood; stocks.iron -= iron; woodUsed = trialSafe(woodUsed + wood); ironUsed = trialSafe(ironUsed + iron);
      servedMilli = trialSafe(servedMilli + Math.min(remaining, scaled(batches, B.goodsServicePerBatch)));
      activities.push(`${tile.id}: Goods Workshop ${batches} batches; materials charged once.`);
    }
  }
  const fulfillmentBps = demandMilli === 0 ? 10000 : scaled(servedMilli, 10000, demandMilli);
  const revenueMilli = scaled(servedMilli, storedGoods ? G.goldPerGoodsMilli : B.goldPerServiceMilli, 1000); add("gold", revenueMilli);
  const happinessBefore = s.happiness;
  const needs = resolveTileTrialNeeds(population, stocks.food, happinessBefore, fulfillmentBps);
  const { foodDemandMilli, foodConsumedMilli } = needs;
  stocks.food = needs.foodRemainingMilli; s.happiness = needs.happinessAfter;
  const immigration = economy === POPULATION_TILE_RULESET || storedGoods ? resolveTrialImmigration(s, { fundedTileIds, farmBatches, processorBatches, woodProducedMilli, ironProducedMilli, operatingDebitMilli, foodDemandMilli, foodConsumedMilli, unpaidUpkeepMilli }) : undefined;
  if (immigration?.arrivals) settlement.cohorts.find(c => c.id === "weekly_middle")!.count += immigration.arrivals;
  s.world.week = trialSafe(s.world.week + 1); s.phase = "report";
  const goods = Object.freeze({ demandMilli, servedMilli, fulfillmentBps, woodUsed, ironUsed, revenueMilli });
  return Object.freeze({ week: s.world.week - 1, before: Object.freeze(before), after: Object.freeze({ ...stocks }), taxMilli, farmBatchGoldMilli, farmExtraUpkeepMilli, upkeepPaidMilli, unpaidUpkeepMilli, foodDemandMilli, foodConsumedMilli, happinessBefore, happinessAfter: s.happiness, goods, ...(goodsStock ? { goodsStock } : {}), activities: Object.freeze(activities), ...(immigration ? { immigration } : {}) });
}
