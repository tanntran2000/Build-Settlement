import { TILE_TRIAL_BALANCE as B, trialBuilding, type TileTrialState, type TileTrialReport, type WeeklyResource } from "@haven/core";
import { FARM_MAX_BATCHES, PROCESSOR_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI, FARM_WHEAT_PER_BATCH_MILLI, PROCESSOR_WHEAT_PER_BATCH_MILLI, PROCESSOR_FOOD_PER_BATCH_MILLI } from "./weekly.js";

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
  const settlement = s.world.settlements[s.world.activeSettlementId!]; const stocks = settlement.inventory;
  const before = { ...stocks }; const activities: string[] = [];
  const add = (key: WeeklyResource, amount: number) => { stocks[key] = trialSafe(stocks[key] + amount); };
  const population = settlement.cohorts.reduce((n, c) => trialSafe(n + c.count), 0);
  const taxMilli = scaled(population, B.taxGoldPerResident); add("gold", taxMilli);
  let farmBatchGoldMilli = 0, farmExtraUpkeepMilli = 0, upkeepPaidMilli = 0, unpaidUpkeepMilli = 0, marketCapacity = 0;
  const funded: typeof s.tiles = [];
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
    if (d.operation === "farm") {
      farmBatchGoldMilli = trialSafe(farmBatchGoldMilli + batchGold); farmExtraUpkeepMilli = trialSafe(farmExtraUpkeepMilli + extra);
      add("wheat", batches * FARM_WHEAT_PER_BATCH_MILLI);
      activities.push(`${tile.id}: Farm ${batches} batches; batch Gold credited against this Farm upkeep.`);
    } else funded.push(tile);
  }
  // Every extraction completes before any processing, independent of placement order.
  for (const tile of funded) {
    const b = tile.building!; const d = trialBuilding(b.typeId)!;
    if (d.operation === "logging") { add("wood", scaled(b.workers, B.loggingWoodPerWorker)); activities.push(`${tile.id}: extracted Wood.`); }
    if (d.operation === "mine") { add("iron", scaled(b.workers, B.mineIronPerWorker)); activities.push(`${tile.id}: extracted Iron.`); }
    if (d.operation === "market") marketCapacity = trialSafe(marketCapacity + scaled(b.level, B.marketServicePerLevel));
  }
  for (const tile of funded) {
    const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== "processor") continue;
    const batches = Math.min(b.workers, PROCESSOR_MAX_BATCHES, Math.floor(stocks.wheat / PROCESSOR_WHEAT_PER_BATCH_MILLI));
    stocks.wheat -= batches * PROCESSOR_WHEAT_PER_BATCH_MILLI; add("food", batches * PROCESSOR_FOOD_PER_BATCH_MILLI);
    activities.push(`${tile.id}: Food Processor ${batches} batches.`);
  }
  const demandMilli = scaled(population, B.goodsDemandPerResident); let servedMilli = 0, woodUsed = 0, ironUsed = 0;
  for (const tile of funded) {
    const b = tile.building!; if (trialBuilding(b.typeId)!.operation !== "goods") continue;
    const remaining = Math.max(0, Math.min(demandMilli, marketCapacity) - servedMilli);
    const batches = Math.min(b.workers, Math.ceil(remaining / B.goodsServicePerBatch), Math.floor(stocks.wood / B.goodsWoodPerBatch), Math.floor(stocks.iron / B.goodsIronPerBatch));
    const wood = scaled(batches, B.goodsWoodPerBatch), iron = scaled(batches, B.goodsIronPerBatch);
    stocks.wood -= wood; stocks.iron -= iron; woodUsed = trialSafe(woodUsed + wood); ironUsed = trialSafe(ironUsed + iron);
    servedMilli = trialSafe(servedMilli + Math.min(remaining, scaled(batches, B.goodsServicePerBatch)));
    activities.push(`${tile.id}: Goods Workshop ${batches} batches; materials charged once.`);
  }
  const fulfillmentBps = demandMilli === 0 ? 10000 : scaled(servedMilli, 10000, demandMilli);
  const revenueMilli = scaled(servedMilli, B.goldPerServiceMilli, 1000); add("gold", revenueMilli);
  const foodDemandMilli = scaled(population, B.foodDemandPerResident);
  const foodConsumedMilli = Math.min(stocks.food, foodDemandMilli); stocks.food -= foodConsumedMilli;
  const happinessBefore = s.happiness;
  if (population > 0) {
    const deficit = (foodDemandMilli - foodConsumedMilli) / foodDemandMilli;
    if (deficit > 0) s.happiness -= B.shortageHappiness * deficit;
    else if (s.happiness < B.foodRecoveryCap) s.happiness = Math.min(B.foodRecoveryCap, s.happiness + B.foodRecovery);
    s.happiness = Math.round(Math.max(0, Math.min(100, s.happiness + B.goodsHappinessMax * fulfillmentBps / 10000)) * B.happinessPrecision) / B.happinessPrecision;
  }
  s.world.week = trialSafe(s.world.week + 1); s.phase = "report";
  const goods = Object.freeze({ demandMilli, servedMilli, fulfillmentBps, woodUsed, ironUsed, revenueMilli });
  return Object.freeze({ week: s.world.week - 1, before: Object.freeze(before), after: Object.freeze({ ...stocks }), taxMilli, farmBatchGoldMilli, farmExtraUpkeepMilli, upkeepPaidMilli, unpaidUpkeepMilli, foodDemandMilli, foodConsumedMilli, happinessBefore, happinessAfter: s.happiness, goods, activities: Object.freeze(activities) });
}
