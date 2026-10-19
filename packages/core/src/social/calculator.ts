import type { PopulationCohort } from "../domain/population.js";
import type {
  EconomicProfileKey,
  ClassResourceProfile,
  SocialResourceBreakdown,
  SocialResourceSnapshot,
} from "./types.js";
import { SOCIAL_RESOURCE_SCALE } from "./profile.js";

/**
 * Giá trị dẫn xuất Population Blocks (100 cư dân = 1 Block).
 * Pure derived value phục vụ hiển thị, tuyệt đối không lưu trữ hay mutate độc lập trong state.
 */
export function calculatePopulationBlocks(headcount: number): number {
  return headcount / 100;
}

/**
 * Ánh xạ giai cấp và thân phận pháp lý sang hồ sơ kinh tế vĩ mô.
 * 1. legalStatus === "enslaved" luôn được ưu tiên quy về "servile" bất kể giai cấp.
 * 2. Ngược lại, áp dụng exhaustive switch trên canonical SocialClass.
 * 3. Chốt chặn TypeScript `never` ở nhánh default chống bỏ sót khi mở rộng enum.
 */
export function resolveEconomicProfile(cohort: PopulationCohort): EconomicProfileKey {
  if (cohort.legalStatus === "enslaved") {
    return "servile";
  }

  switch (cohort.socialClass) {
    case "lower":
      return "lower";
    case "common":
    case "skilled":
      return "middle";
    case "administrative":
    case "elite":
      return "upper";
    default: {
      const _exhaustive: never = cohort.socialClass;
      return _exhaustive;
    }
  }
}

function createEmptySnapshot(): SocialResourceSnapshot {
  return {
    headcount: 0,
    populationBlocks: 0,
    laborCapacityMilli: 0,
    purchaseDemandCapacityMilli: 0,
    survivalFoodNeedMilli: 0,
    lifestyleFoodDemandMilli: 0,
  };
}

function nonNegativeInteger(value: number, name: string): bigint {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative integer.`);
  }
  return BigInt(value);
}

function addSafeInteger(total: number, value: bigint): number {
  const result = BigInt(total) + value;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Social resource result exceeds the safe integer range.");
  }
  return Number(result);
}

/**
 * Tính breakdown theo EconomicProfileKey, giữ nguyên các metric POP-01A
 * nhưng áp dụng Workforce v2: 10 cư dân = 1 base WF trước class multiplier.
 */
export function calculateSocialResourceBreakdown(
  cohorts: PopulationCohort[],
  profileMap: Record<EconomicProfileKey, ClassResourceProfile>
): SocialResourceBreakdown {
  const breakdown: SocialResourceBreakdown = {
    servile: createEmptySnapshot(),
    lower: createEmptySnapshot(),
    middle: createEmptySnapshot(),
    upper: createEmptySnapshot(),
    total: createEmptySnapshot(),
  };

  for (const cohort of cohorts) {
    const key = resolveEconomicProfile(cohort);
    const profile = profileMap[key];
    const target = breakdown[key];
    const count = nonNegativeInteger(cohort.count, "count");
    const labor = nonNegativeInteger(profile.laborMultiplierMilli, "laborMultiplierMilli");
    const purchase = nonNegativeInteger(profile.purchaseDemandMultiplierMilli, "purchaseDemandMultiplierMilli");
    const lifestyle = nonNegativeInteger(profile.lifestyleFoodMultiplierMilli, "lifestyleFoodMultiplierMilli");

    // Positive BigInt division preserves floor per cohort before any profile/total aggregation.
    target.headcount = addSafeInteger(target.headcount, count);
    target.laborCapacityMilli = addSafeInteger(target.laborCapacityMilli, key === "upper" ? 0n : count * labor / 10n);
    target.purchaseDemandCapacityMilli = addSafeInteger(target.purchaseDemandCapacityMilli, count * purchase / 100n);
    target.survivalFoodNeedMilli = addSafeInteger(target.survivalFoodNeedMilli, count * BigInt(SOCIAL_RESOURCE_SCALE) / 100n);
    target.lifestyleFoodDemandMilli = addSafeInteger(target.lifestyleFoodDemandMilli, count * lifestyle / 100n);
  }

  const keys: EconomicProfileKey[] = ["servile", "lower", "middle", "upper"];
  for (const key of keys) {
    breakdown[key].populationBlocks = calculatePopulationBlocks(
      breakdown[key].headcount
    );
  }

  for (const metric of ["headcount", "laborCapacityMilli", "purchaseDemandCapacityMilli", "survivalFoodNeedMilli", "lifestyleFoodDemandMilli"] as const) {
    breakdown.total[metric] = keys.reduce((sum, key) => addSafeInteger(sum, BigInt(breakdown[key][metric])), 0);
  }
  breakdown.total.populationBlocks = calculatePopulationBlocks(breakdown.total.headcount);

  return breakdown;
}

/**
 * Backward-compatible aggregate POP-01A API.
 */
export function calculateSocialResources(
  cohorts: PopulationCohort[],
  profileMap: Record<EconomicProfileKey, ClassResourceProfile>
): SocialResourceSnapshot {
  return calculateSocialResourceBreakdown(cohorts, profileMap).total;
}
