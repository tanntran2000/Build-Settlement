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
    const count = cohort.count;

    target.headcount += count;
    target.laborCapacityMilli +=
      key === "upper"
        ? 0
        : Math.floor((count * profile.laborMultiplierMilli) / 10);
    target.purchaseDemandCapacityMilli += Math.floor(
      (count * profile.purchaseDemandMultiplierMilli) / 100
    );
    target.survivalFoodNeedMilli += Math.floor(
      (count * SOCIAL_RESOURCE_SCALE) / 100
    );
    target.lifestyleFoodDemandMilli += Math.floor(
      (count * profile.lifestyleFoodMultiplierMilli) / 100
    );
  }

  const keys: EconomicProfileKey[] = ["servile", "lower", "middle", "upper"];
  for (const key of keys) {
    breakdown[key].populationBlocks = calculatePopulationBlocks(
      breakdown[key].headcount
    );
  }

  breakdown.total.headcount = keys.reduce(
    (sum, key) => sum + breakdown[key].headcount,
    0
  );
  breakdown.total.populationBlocks = calculatePopulationBlocks(
    breakdown.total.headcount
  );
  breakdown.total.laborCapacityMilli = keys.reduce(
    (sum, key) => sum + breakdown[key].laborCapacityMilli,
    0
  );
  breakdown.total.purchaseDemandCapacityMilli = keys.reduce(
    (sum, key) => sum + breakdown[key].purchaseDemandCapacityMilli,
    0
  );
  breakdown.total.survivalFoodNeedMilli = keys.reduce(
    (sum, key) => sum + breakdown[key].survivalFoodNeedMilli,
    0
  );
  breakdown.total.lifestyleFoodDemandMilli = keys.reduce(
    (sum, key) => sum + breakdown[key].lifestyleFoodDemandMilli,
    0
  );

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
