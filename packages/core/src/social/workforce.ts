import type { PopulationCohort } from "../domain/population.js";
import { resolveEconomicProfile } from "./calculator.js";
import type { WorkforceHeadcountSnapshot } from "./types.js";

/**
 * Demographic headcount summary for direct-workforce eligibility.
 * This does not assign jobs and does not include Named NPCs.
 */
export function calculateWorkforceHeadcount(
  cohorts: PopulationCohort[]
): WorkforceHeadcountSnapshot {
  const summary: WorkforceHeadcountSnapshot = {
    totalHeadcount: 0,
    servile: 0,
    lower: 0,
    middle: 0,
    upper: 0,
    directAssignableHeadcount: 0,
  };

  for (const cohort of cohorts) {
    const key = resolveEconomicProfile(cohort);
    summary[key] += cohort.count;
    summary.totalHeadcount += cohort.count;
  }

  summary.directAssignableHeadcount =
    summary.servile + summary.lower + summary.middle;

  return summary;
}
