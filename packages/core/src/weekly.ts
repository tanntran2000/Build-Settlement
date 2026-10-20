import { createPopulationCohort, type PopulationCohort } from "./domain/population.js";
import type { CanonicalGameState } from "./domain/canonical-state.js";
import { calculateSocialResourceBreakdown } from "./social/calculator.js";
import { INITIAL_BALANCE_PROFILE } from "./social/profile.js";
import { calculateEffectiveWorkforceMilli } from "./social/workforce.js";
import type { ResourceFlowResult } from "./resource/types.js";
import type { WeeklyResource, WeeklyStocks } from "./domain/canonical-state.js";

export interface WeeklyReport {
  readonly week: number;
  readonly settlementId: string;
  readonly before: Readonly<WeeklyStocks>;
  readonly net: Readonly<WeeklyStocks>;
  readonly after: Readonly<WeeklyStocks>;
  readonly flows: Readonly<Record<WeeklyResource, Readonly<ResourceFlowResult>>>;
  readonly workforce: Readonly<{ effectiveMilli: number; assignedMilli: number; availableMilli: number; fulfilledMilli: number; idleAssignedMilli: number }>;
  readonly production: Readonly<{
    farm: Readonly<{ plannedBatches: number; completedBatches: number; blockedBatches: number }>;
    processor: Readonly<{ plannedBatches: number; completedBatches: number; blockedBatches: number }>;
  }>;
  readonly why: string;
}
export interface EndWeekCommand { type: "END_WEEK"; expectedWeek: number; farmWorkforceMilli: number; processorWorkforceMilli: number }
export type WeeklyCommandResult<S> =
  | { success: true; nextState: CanonicalGameState; report: WeeklyReport }
  | { success: false; state: S; error: { code: string; message: string } };

export function createWeeklyState(): CanonicalGameState {
  const id = "settlement_haven_01";
  return {
    week: 1, worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" }, activeSettlementId: id,
    settlements: { [id]: {
      id, name: "Haven", status: "active", foodProcessorOperational: true, inventory: { gold: 10000, wheat: 0, food: 4000, wood: 0, iron: 0 },
      cohorts: [createPopulationCohort({
        id: "weekly_middle", occupation: "worker", socialClass: "common", legalStatus: "citizen", count: 100,
        averageHealth: 80, morale: 80, productivity: 80, resentment: 0, loyalty: 80, livingStandard: "decent",
      })],
    } },
  };
}

export function weeklyWorkforceMilli(cohorts: PopulationCohort[]): number {
  const base = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE).total.laborCapacityMilli;
  return calculateEffectiveWorkforceMilli(base, 0);
}
