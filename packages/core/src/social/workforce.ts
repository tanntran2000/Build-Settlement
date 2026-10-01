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

/**
 * Tính toán Effective Workforce theo công thức số học cố định (Fixed-Point):
 * effectiveWorkforceMilli = floor(baseWorkforceMilli * (10000 + modifierBps) / 10000)
 *
 * Ràng buộc:
 * - baseWorkforceMilli: số nguyên hữu hạn >= 0
 * - modifierBps: số nguyên hữu hạn, là bội số của 50, nằm trong khoảng [-500, 500] (0 cho phép)
 */
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
      `baseWorkforceMilli must be a finite non-negative integer. Received: ${baseWorkforceMilli}`
    );
  }

  if (!Number.isFinite(modifierBps) || !Number.isInteger(modifierBps)) {
    throw new RangeError(
      `modifierBps must be a finite integer. Received: ${modifierBps}`
    );
  }

  if (Math.abs(modifierBps) > 500) {
    throw new RangeError(
      `modifierBps must be in range [-500, 500]. Received: ${modifierBps}`
    );
  }

  if (Math.abs(modifierBps) % 50 !== 0) {
    throw new RangeError(
      `modifierBps must be a multiple of 50 bps. Received: ${modifierBps}`
    );
  }

  return Math.floor((baseWorkforceMilli * (10000 + modifierBps)) / 10000);
}
