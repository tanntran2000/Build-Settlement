import { TILE_TRIAL_BALANCE as B,GOODS_STOCK_TRIAL as G,IMMIGRATION_TRIAL_DEFAULTS,trialBuilding,weeklyWorkforceMilli,type TileTrialState,type TrialImmigrationReport } from "@haven/core";
import { FARM_MAX_BATCHES,FARM_WHEAT_PER_BATCH_MILLI,PROCESSOR_FOOD_PER_BATCH_MILLI,PROCESSOR_MAX_BATCHES,PROCESSOR_WHEAT_PER_BATCH_MILLI } from "./weekly.js";

export interface ImmigrationFacts {
  fundedTileIds: readonly string[];
  farmBatches: number; processorBatches: number; woodProducedMilli: number; ironProducedMilli: number;
  operatingDebitMilli: number; foodDemandMilli: number; foodConsumedMilli: number; unpaidUpkeepMilli: number;
}
const integer = (n: number): bigint => {
  if (!Number.isSafeInteger(n) || n < 0) throw Error("Immigration needs safe nonnegative integers.");
  return BigInt(n);
};
const number = (n: bigint): number => {
  if (n < 0n || n > BigInt(Number.MAX_SAFE_INTEGER)) throw Error("Immigration arithmetic overflow.");
  return Number(n);
};
const min = (...values: bigint[]) => values.reduce((a, b) => a < b ? a : b);
const positive = (n: bigint) => n > 0n ? n : 0n;

// Read-only projection: no stocks are debited, no production or assignments replayed.
export function resolveTrialImmigration(state: TileTrialState, facts: ImmigrationFacts, config: Readonly<typeof IMMIGRATION_TRIAL_DEFAULTS> = IMMIGRATION_TRIAL_DEFAULTS): Readonly<TrialImmigrationReport> {
  if (!state.society || !state.goodsStock) throw Error('Invalid society city.');
  const woodPerBatch = integer(G.woodPerBatchMilli);
  const goodsPerBatch = integer(G.goodsPerBatchMilli);
  const support = integer(config.foodSupportBps), catchup = integer(config.catchupBps), cap = integer(config.weeklyCapBps);
  if (support < 10000n || catchup > 10000n || cap > 10000n || catchup === 0n || cap === 0n) throw Error("Invalid immigration TRIAL configuration.");
  const settlement = state.world.settlements[state.world.activeSettlementId!];
  const population = settlement.cohorts.reduce((total, c) => total + integer(c.count), 0n);
  const populationBefore = number(population);
  const funded = new Set(facts.fundedTileIds);
  let farm = 0n, processor = 0n, logging = 0n, mine = 0n, workshop = 0n, workshopWorkers = 0n, market = 0n;
  for (const t of state.tiles) {
    const b = t.building;
    if (!b?.enabled || !funded.has(t.id)) continue;
    const d = trialBuilding(b.typeId)!; const slots = integer(d.maxWorkers) * integer(b.level);
    switch (d.operation) {
      case "farm": farm += min(slots, integer(FARM_MAX_BATCHES)); break;
      case "processor": processor += min(slots, integer(PROCESSOR_MAX_BATCHES)); break;
      case "logging": logging += slots; break;
      case "mine": mine += slots; break;
      case "goods": workshop += slots; workshopWorkers += integer(b.workers); break;
      case "market": market += integer(b.level) * integer(G.capacityPerLevelMilli); break;
    }
  }
  const usefulProcessor = min(processor, farm * integer(FARM_WHEAT_PER_BATCH_MILLI) / integer(PROCESSOR_WHEAT_PER_BATCH_MILLI));
  const usefulWorkshop = min(workshop, logging * integer(B.loggingWoodPerWorker) / woodPerBatch, market / goodsPerBatch);
  const usefulWorkerSlots = number(farm + usefulProcessor + logging + mine + usefulWorkshop);
  const renewableFood = min(integer(facts.processorBatches), integer(facts.farmBatches) * integer(FARM_WHEAT_PER_BATCH_MILLI) / integer(PROCESSOR_WHEAT_PER_BATCH_MILLI)) * integer(PROCESSOR_FOOD_PER_BATCH_MILLI);
  const renewableFoodMilli = number(renewableFood);
  let target = populationBefore;
  const result = (reason: TrialImmigrationReport["reason"], arrivals = 0): Readonly<TrialImmigrationReport> => Object.freeze({ populationBefore, arrivals, populationAfter: number(population + integer(arrivals)), target, usefulWorkerSlots, renewableFoodMilli, reason });
  if (population === 0n) return result("zero-population");
  const cohort = settlement.cohorts.find(c => c.id === "weekly_middle" && c.socialClass === "common" && c.legalStatus === "citizen");
  if (!cohort) return result("cohort-unavailable");
  const marginal = integer(weeklyWorkforceMilli([{ ...cohort, count: 1 }]));
  if (marginal === 0n) return result("cohort-unavailable");
  const workforce = integer(weeklyWorkforceMilli(settlement.cohorts));
  const jobsTarget = population + positive(integer(usefulWorkerSlots) * 1000n - workforce) / marginal;
  const foodTarget = renewableFood * 10000n / (integer(B.foodDemandPerResident) * support);
  target = number(min(jobsTarget, foodTarget));
  if (target <= populationBefore) return result("no-capacity");
  if (integer(facts.foodConsumedMilli) < integer(facts.foodDemandMilli)) return result("food-shortage");
  if (integer(facts.unpaidUpkeepMilli) > 0n) return result("upkeep-unpaid");
  const goodsBatches = min(workshopWorkers, integer(facts.woodProducedMilli) / woodPerBatch);
  const service = min(integer(target) * integer(B.goodsDemandPerResident), market, goodsBatches * goodsPerBatch);
  const recurringIncome = integer(target) * integer(B.taxGoldPerResident) + service * integer(B.goldPerServiceMilli) / 1000n;
  const debit = integer(facts.operatingDebitMilli);
  if (recurringIncome < debit) return result("target-unfunded");
  if (integer(settlement.inventory.gold) + population * integer(B.taxGoldPerResident) < debit) return result("liquidity");
  const gap = integer(target) - population;
  const catchupCount = gap * catchup / 10000n, capCount = population * cap / 10000n;
  const arrivals = number(min(gap, catchupCount > 0n ? catchupCount : 1n, capCount > 0n ? capCount : 1n));
  // Count overflow must reject the entire caller's cloned End Week transaction.
  number(integer(cohort.count) + integer(arrivals));
  return result("arrivals", arrivals);
}
