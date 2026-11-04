import type { CrisisCardKind, CrisisStage, CrisisState } from './crisis.js';
import type { ResearchTopic } from './outside.js';
import type { OrderState } from './order.js';
import type { SocietyState } from './society.js';
import type { CanonicalGameState, WeeklyStocks } from "../domain/canonical-state.js";
import type { GoodsStock } from './goods-stock.js';

export interface TrialBuilding { typeId: string; level: number; workers: number; enabled: boolean }
export interface TrialTile { id: string; terrain: string; building: TrialBuilding | null }
export interface TileTrialState {
  goodsStock?: GoodsStock;
  society?: SocietyState;
  world: CanonicalGameState;
  revision: number;
  phase: "planning" | "report";
  tiles: TrialTile[];
  happiness: number;
}
export interface CrisisReport {
 stageBefore: CrisisStage; stageAfter: CrisisStage; hungry: boolean;
 hungerStreak: number; calmStreak: number; weeksInStage: number;
 promise: { stage: CrisisCardKind; result: 'kept' | 'broken' | 'pending'; tensionDelta: number; authorityDelta: number } | null;
 cardOpened: CrisisCardKind | null; lastChoice: CrisisState['lastChoice']; tensionBefore: number; tensionAfter: number;
}
export interface CrimeEventReport {
 standingBefore:number; standingAfter:number; chancePercent:number;
 event:null | {kind:'robbery'|'smear'|'raid'|'assassination';severity:'minor'|'serious'|'severe';target?:keyof OrderReport['theftMilli'];lossMilli?:number;soldiersKilled?:number;outcome?:'foiled'|'wounded'|'killed';standingLoss?:number;authorityLoss?:number};
 lordHealthLoss:number;
}
export interface TileTrialReport {
  crimeEvent?: CrimeEventReport;
  crisis?: CrisisReport;
  order?: OrderReport;
  outside?: {
    producedMilli: {wood:number;iron:number;stone:number;wool:number;herbs:number;cloth:number};
    stocksBefore:{stone:number;wool:number;cloth:number;herbs:number};
    stocksAfter:{stone:number;wool:number;cloth:number;herbs:number};
    hospitalsIdle:string[];cleared:string[];researchCompleted:ResearchTopic[];exhausted:string[];
    spoiledMilli:Partial<Record<'food'|'wheat'|'wood'|'iron'|'goods'|'luxury'|'stone'|'wool'|'cloth'|'herbs',number>>;
  };
  society?: { classes: Record<'free' | 'makers' | 'luminaries' | 'merchants' | 'bound', {
    foodBps:number; goodsBps:number; luxuryBps:number|null; satisfactionBefore:number; satisfactionAfter:number;
    arrivals:number; trained:number; enslaved:number; debtBefore:number|null; debtAfter:number|null; notes:readonly string[];
  }>; eliteArrived:'makers'|'luminaries'|'merchants'|null; desperationBefore:number; desperationAfter:number; tensionBefore:number; tensionAfter:number; corruptionAfter:number };
  luxuryImportedMilli?: number;
  trainingGoldMilli?: number;
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
export interface OrderReport {
 before: OrderState; targets: OrderState; after: OrderState;
 theftMilli: Partial<Record<'gold'|'food'|'wheat'|'wood'|'iron'|'stone'|'wool'|'cloth'|'herbs'|'goods'|'luxury',number>>;
 tensionAdded: number; satisfactionLost: number; taxModifierBps: number; taxDeltaMilli: number;
 arrivalsBudgetBefore: number; arrivalsBudgetAfter: number;
}
export interface TrialImmigrationReport {
  populationBefore: number; arrivals: number; populationAfter: number;
  target: number; usefulWorkerSlots: number; renewableFoodMilli: number;
  reason: "arrivals" | "zero-population" | "cohort-unavailable" | "no-capacity" | "food-shortage" | "upkeep-unpaid" | "target-unfunded" | "liquidity";
}
export type TileTrialResult = { success: true; nextState: TileTrialState; report?: Readonly<TileTrialReport> }
  | { success: false; state: unknown; error: { code: string; message: string } };
