import { type PopulationCohort } from "./domain/population.js";
import { calculateSocialResourceBreakdown } from "./social/calculator.js";
import { INITIAL_BALANCE_PROFILE } from "./social/profile.js";
import { calculateEffectiveWorkforceMilli } from "./social/workforce.js";

export function weeklyWorkforceMilli(cohorts: PopulationCohort[]): number {
  const base = calculateSocialResourceBreakdown(cohorts, INITIAL_BALANCE_PROFILE).total.laborCapacityMilli;
  return calculateEffectiveWorkforceMilli(base, 0);
}
