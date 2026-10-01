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

import {
  CITY_EFFECT_ABSOLUTE_MAX_BPS,
  CITY_EFFECT_STEP_BPS,
} from "../status/effects.js";

export function calculateEffectiveWorkforceMilli(
  baseWorkforceMilli: number,
  modifierBps: number
): number {
  if (
    !Number.isFinite(baseWorkforceMilli) ||
    !Number.isInteger(baseWorkforceMilli) ||
    baseWorkforceMilli < 0
  ) {
    throw new RangeError(
      `baseWorkforceMilli must be a finite non-negative integer, received: ${baseWorkforceMilli}`
    );
  }

  if (
    !Number.isFinite(modifierBps) ||
    !Number.isInteger(modifierBps) ||
    Math.abs(modifierBps) > CITY_EFFECT_ABSOLUTE_MAX_BPS ||
    Math.abs(modifierBps) % CITY_EFFECT_STEP_BPS !== 0
  ) {
    throw new RangeError(
      `modifierBps must be an integer multiple of 50 in [-500, 500], received: ${modifierBps}`
    );
  }

  const result = Math.floor(
    (baseWorkforceMilli * (10_000 + modifierBps)) / 10_000
  );

  if (!Number.isFinite(result) || !Number.isInteger(result) || result < 0) {
    throw new RangeError("effective workforce result is outside supported numeric range");
  }

  return result;
}
