import type { PopulationCohort } from "../domain/population.js";
import type { SocialClass, LegalStatus } from "../domain/character.js";

export type EconomicProfileKey = "servile" | "lower" | "middle" | "upper";

export interface ClassResourceProfile {
  laborMultiplierMilli: number;
  purchaseDemandMultiplierMilli: number;
  lifestyleFoodMultiplierMilli: number;
}

export interface SocialResourceSnapshot {
  headcount: number;
  populationBlocks: number; // derived display: headcount / 100
  laborCapacityMilli: number; // integer milli-units
  purchaseDemandCapacityMilli: number; // integer milli-units
  survivalFoodNeedMilli: number; // integer milli-units (headcount * 1.0)
  lifestyleFoodDemandMilli: number; // integer milli-units (theo giai cấp)
}

export type EconomicProfileSnapshot = SocialResourceSnapshot;

export interface SocialResourceBreakdown {
  servile: EconomicProfileSnapshot;
  lower: EconomicProfileSnapshot;
  middle: EconomicProfileSnapshot;
  upper: EconomicProfileSnapshot;
  total: SocialResourceSnapshot;
}

export interface WorkforceHeadcountSnapshot {
  totalHeadcount: number;
  servile: number;
  lower: number;
  middle: number;
  upper: number;
  directAssignableHeadcount: number;
}
