import { TILE_TRIAL_BALANCE as B } from "@haven/core";

interface TileTrialNeedsResult {
  foodDemandMilli: number;
  foodConsumedMilli: number;
  foodRemainingMilli: number;
  happinessAfter: number;
}

// Internal post-production arithmetic; callers supply validated tile-trial scalars.
export function resolveTileTrialNeeds(
  population: number,
  availableFoodMilli: number,
  happinessBefore: number,
  goodsFulfillmentBps: number,
): TileTrialNeedsResult {
  const demand = BigInt(population) * BigInt(B.foodDemandPerResident);
  if (demand > BigInt(Number.MAX_SAFE_INTEGER)) throw Error("Trial arithmetic overflow.");
  const foodDemandMilli = Number(demand);
  const foodConsumedMilli = Math.min(availableFoodMilli, foodDemandMilli);
  let happinessAfter = happinessBefore;
  if (population > 0) {
    const deficit = (foodDemandMilli - foodConsumedMilli) / foodDemandMilli;
    if (deficit > 0) happinessAfter -= B.shortageHappiness * deficit;
    else if (happinessAfter < B.foodRecoveryCap) happinessAfter = Math.min(B.foodRecoveryCap, happinessAfter + B.foodRecovery);
    happinessAfter = Math.round(Math.max(0, Math.min(100, happinessAfter + B.goodsHappinessMax * goodsFulfillmentBps / 10000)) * B.happinessPrecision) / B.happinessPrecision;
  }
  return { foodDemandMilli, foodConsumedMilli, foodRemainingMilli: availableFoodMilli - foodConsumedMilli, happinessAfter };
}
