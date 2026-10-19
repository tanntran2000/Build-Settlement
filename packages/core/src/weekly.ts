import { createPopulationCohort, type PopulationCohort } from "./domain/population.js";
import type { CanonicalGameState } from "./domain/canonical-state.js";
import { calculateSocialResourceBreakdown } from "./social/calculator.js";
import { INITIAL_BALANCE_PROFILE, SOCIAL_RESOURCE_SCALE } from "./social/profile.js";
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
  readonly workforce: Readonly<{ effectiveMilli: number; assignedMilli: number; availableMilli: number; fundedMilli: number; unfundedMilli: number }>;
  readonly why: string;
}
export interface EndWeekCommand { type: "END_WEEK"; expectedWeek: number; foodWorkforceMilli: number }
export type WeeklyCommandResult<S> =
  | { success: true; nextState: CanonicalGameState; report: WeeklyReport }
  | { success: false; state: S; error: { code: string; message: string } };

export function createWeeklyState(): CanonicalGameState {
  const id = "settlement_haven_01";
  return {
    week: 1, worldMetadata: { worldSeed: 2026, gameVersion: "0.1.0" }, activeSettlementId: id,
    settlements: { [id]: {
      id, name: "Haven", status: "active", inventory: { gold: 10000, food: 4000, wood: 0, iron: 0 },
      cohorts: [createPopulationCohort({
        id: "weekly_middle", occupation: "worker", socialClass: "common", legalStatus: "citizen", count: 100,
        averageHealth: 80, morale: 80, productivity: 80, resentment: 0, loyalty: 80, livingStandard: "decent",
      })],
    } },
  };
}

export function weeklyWorkforceMilli(cohorts: PopulationCohort[]): number {
  const maxProfileMultiplier = Math.max(SOCIAL_RESOURCE_SCALE, ...Object.values(INITIAL_BALANCE_PROFILE).flatMap(Object.values));
  const safeHeadcount = Math.floor(Number.MAX_SAFE_INTEGER / maxProfileMultiplier);
  let headcount = 0;
  for (const cohort of cohorts) {
    // Guard every profile product and aggregate before calling the unchanged social calculator.
    if (!Number.isSafeInteger(cohort.count) || cohort.count < 0 || cohort.count > safeHeadcount - headcount) {
      throw new RangeError("Cohort totals exceed safe social calculator arithmetic.");
    }
    headcount += cohort.count;
  }
  const base = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE).total.laborCapacityMilli;
  const neutralBasisPointFactor = 10000;
  if (base > Math.floor(Number.MAX_SAFE_INTEGER / neutralBasisPointFactor)) {
    throw new RangeError("Workforce exceeds safe effective-workforce arithmetic.");
  }
  return calculateEffectiveWorkforceMilli(base, 0);
}
