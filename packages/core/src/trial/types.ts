import type { CanonicalGameState, WeeklyStocks } from "../domain/canonical-state.js";
import type { GoodsStock } from './goods-stock.js';

export interface TrialBuilding { typeId: string; level: number; workers: number; enabled: boolean }
export interface TrialTile { id: string; terrain: string; building: TrialBuilding | null }
export interface TileTrialState {
  goodsStock?: GoodsStock;
  world: CanonicalGameState;
  revision: number;
  phase: "planning" | "report";
  tiles: TrialTile[];
  happiness: number;
}
export interface TileTrialReport {
  goodsStock?: Readonly<{ openingMilli: number; producedMilli: number; distributedMilli: number; closingMilli: number;
    demandMilli: number; unmetMilli: number; capacityMilli: number; limitedBy: 'none' | 'stock' | 'capacity' }>;
  immigration?: Readonly<TrialImmigrationReport>;
  week: number;
  before: WeeklyStocks;
  after: WeeklyStocks;
  taxMilli: number;
  farmBatchGoldMilli: number;
  farmExtraUpkeepMilli: number;
  upkeepPaidMilli: number;
  unpaidUpkeepMilli: number;
  foodDemandMilli: number;
  foodConsumedMilli: number;
  happinessBefore: number;
  happinessAfter: number;
  goods: { demandMilli: number; servedMilli: number; fulfillmentBps: number; woodUsed: number; ironUsed: number; revenueMilli: number };
  activities: readonly string[];
}
export interface TrialImmigrationReport {
  populationBefore: number; arrivals: number; populationAfter: number;
  target: number; usefulWorkerSlots: number; renewableFoodMilli: number;
  reason: "arrivals" | "zero-population" | "cohort-unavailable" | "no-capacity" | "food-shortage" | "upkeep-unpaid" | "target-unfunded" | "liquidity";
}
export type TileTrialResult = { success: true; nextState: TileTrialState; report?: Readonly<TileTrialReport> }
  | { success: false; state: unknown; error: { code: string; message: string } };
