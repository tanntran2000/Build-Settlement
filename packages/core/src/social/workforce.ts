import type { PopulationCohort } from "../domain/population.js";
import type { WorkforceHeadcountSnapshot } from "./types.js";
import { resolveEconomicProfile } from "./calculator.js";

/**
 * Tính toán tóm tắt headcount lực lượng lao động theo macro profile.
 * Bảo toàn tổng dân số (totalHeadcount) và dân số có thể phân bổ lao động trực tiếp (directAssignableHeadcount).
 * Giai cấp High/Upper không đóng góp trực tiếp vào workforce (directAssignableHeadcount = servile + lower + middle).
 */
export function calculateWorkforceHeadcount(
  cohorts: PopulationCohort[]
): WorkforceHeadcountSnapshot {
  let servile = 0;
  let lower = 0;
  let middle = 0;
  let upper = 0;

  for (const cohort of cohorts) {
    const key = resolveEconomicProfile(cohort);
    switch (key) {
      case "servile":
        servile += cohort.count;
        break;
      case "lower":
        lower += cohort.count;
        break;
      case "middle":
        middle += cohort.count;
        break;
      case "upper":
        upper += cohort.count;
        break;
      default: {
        const _exhaustive: never = key;
        throw new Error(`Unexpected economic profile key: ${_exhaustive}`);
      }
    }
  }

  const totalHeadcount = servile + lower + middle + upper;
  const directAssignableHeadcount = servile + lower + middle;

  return {
    totalHeadcount,
    servile,
    lower,
    middle,
    upper,
    directAssignableHeadcount,
  };
}
